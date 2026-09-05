import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from opportunity_intelligence.analyzer import DeterministicLocalAnalyzer
from opportunity_intelligence.api import app, get_service
from opportunity_intelligence.domain import OpportunityAnalysis, Risk
from opportunity_intelligence.services import AnalysisService

EXAMPLES = json.loads((Path(__file__).parents[2] / "examples/opportunities.json").read_text())
client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "opportunity-intelligence"}


@pytest.mark.parametrize("example", EXAMPLES, ids=lambda item: item["id"])
def test_examples_are_typed_deterministic_and_source_grounded(example):
    analyzer = DeterministicLocalAnalyzer()
    expected = analyzer.analyze(example["text"])
    response = client.post("/api/v1/opportunities/analyze", json={"text": example["text"]})
    assert response.status_code == 200
    actual = OpportunityAnalysis.model_validate(response.json())
    assert actual == expected == analyzer.analyze(example["text"])
    assert actual.opportunity_type == example["id"]
    assert len(actual.requirements) >= 2
    assert all(item.description in example["text"] for item in actual.requirements)
    assert all(item in example["text"] for item in actual.constraints)
    assert actual.analyzer == "deterministic-local-v1"


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"text": ""},
        {"text": " " * 40},
        {"text": "tiny brief"},
        {"text": 123},
        {"text": "x" * 20001},
        {"text": "! " * 40},
        {"text": "a" * 40},
        {"text": None},
        {"text": EXAMPLES[0]["text"], "secret": "unexpected"},
    ],
)
def test_invalid_requests_do_not_echo_input(payload):
    response = client.post("/api/v1/opportunities/analyze", json=payload)
    assert response.status_code == 422
    assert list(response.json()) == ["detail"]
    assert "input" not in response.json()


def test_schema_rejects_invalid_severity_and_missing_fields():
    with pytest.raises(ValidationError):
        Risk(description="A risk", severity="critical")
    with pytest.raises(ValidationError):
        OpportunityAnalysis(opportunity_title="Incomplete")


def test_missing_topics_generate_questions_and_risks():
    result = DeterministicLocalAnalyzer().analyze(
        "We need help improving our existing operational workflows for the team."
    )
    assert result.opportunity_type == "other"
    assert result.requirements == []
    assert len(result.missing_information) == len(result.clarification_questions) == 4
    assert len(result.risks) == 2


def test_complete_checklist_and_sensitive_data_flag():
    result = DeterministicLocalAnalyzer().analyze(EXAMPLES[1]["text"])
    assert result.missing_information == []
    assert result.clarification_questions == []
    assert [risk.severity for risk in result.risks] == ["high"]


def test_duplicate_sentences_are_not_counted_twice():
    result = DeterministicLocalAnalyzer().analyze(
        "Must build a Python API.\nMust build a Python API."
    )
    assert len(result.requirements) == 1
    assert result.requirements[0].priority == "required"


def test_route_accepts_replacement_analyzer():
    expected = DeterministicLocalAnalyzer().analyze(EXAMPLES[2]["text"])

    class FixedAnalyzer:
        def analyze(self, text):
            return expected

    app.dependency_overrides[get_service] = lambda: AnalysisService(FixedAnalyzer())
    try:
        response = client.post("/api/v1/opportunities/analyze", json={"text": EXAMPLES[0]["text"]})
        assert response.json() == expected.model_dump()
    finally:
        app.dependency_overrides.clear()


def test_cors_allows_only_configured_origins():
    for origin, allowed in [("http://localhost:3000", True), ("https://untrusted.example", False)]:
        response = client.options(
            "/api/v1/opportunities/analyze",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        assert (response.headers.get("access-control-allow-origin") == origin) == allowed
