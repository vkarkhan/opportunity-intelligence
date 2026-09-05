"""Public contracts shared by the API and analyzer."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str = Field(min_length=30, max_length=20000)

    @field_validator("text")
    @classmethod
    def meaningful_text(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 30 or sum(c.isalpha() for c in value) < 20 or len(value.split()) < 5:
            raise ValueError("Enter a brief with at least 30 characters and five words.")
        return value


class Requirement(BaseModel):
    description: str = Field(min_length=1)
    category: Literal["technical", "delivery", "general"]
    priority: Literal["required", "preferred", "unspecified"]


class Risk(BaseModel):
    description: str = Field(min_length=1)
    severity: Literal["low", "medium", "high"]


class OpportunityAnalysis(BaseModel):
    opportunity_title: str = Field(min_length=1)
    opportunity_type: Literal["job", "consulting", "hackathon", "other"]
    summary: str = Field(min_length=1)
    requirements: list[Requirement]
    constraints: list[str]
    assumptions: list[str]
    missing_information: list[str]
    clarification_questions: list[str]
    risks: list[Risk]
    recommended_next_actions: list[str]
    analyzer: Literal["deterministic-local-v1"] = "deterministic-local-v1"
