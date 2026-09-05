"""Transparent sentence/keyword rules, not semantic reasoning or an AI model."""

import re

from opportunity_intelligence.domain import OpportunityAnalysis, Requirement, Risk


def matches(pattern: str, text: str) -> bool:
    return bool(re.search(pattern, text, re.IGNORECASE))


class DeterministicLocalAnalyzer:
    def analyze(self, text: str) -> OpportunityAnalysis:
        sentences = list(
            dict.fromkeys(
                part.strip(" \t-•")
                for part in re.split(r"\n+|(?<=[.!?])\s+", text)
                if part.strip(" \t-•")
            )
        )
        kind = "other"
        if matches(r"\b(hackathon|hack day)\b", text):
            kind = "hackathon"
        elif matches(r"\b(job|hiring|salary|candidate|role)\b", text):
            kind = "job"
        elif matches(r"\b(consultant|consulting|rfp|rfq|statement of work)\b", text):
            kind = "consulting"

        requirements = []
        constraints = []
        for sentence in sentences:
            if matches(
                r"\b(must|required|require|should|build|deliver|experience|submit|preferred)\b",
                sentence,
            ):
                category = "general"
                if matches(r"\b(python|api|ai|data|typescript|model|software)\b", sentence):
                    category = "technical"
                elif matches(r"\b(deliver|submit|demo|report|document)\b", sentence):
                    category = "delivery"
                priority = "unspecified"
                if matches(r"\b(must|required|require)\b", sentence):
                    priority = "required"
                elif matches(r"\b(preferred|nice to have|should)\b", sentence):
                    priority = "preferred"
                requirements.append(
                    Requirement(description=sentence, category=category, priority=priority)
                )
            if matches(
                r"\b(budget|salary|deadline|remote|onsite|on-site|within|weeks|days|hours)\b",
                sentence,
            ):
                constraints.append(sentence)

        checks = [
            (
                r"\b(budget|salary|compensation|prize|unpaid)\b",
                "Commercial terms",
                "What budget, compensation or commercial terms apply?",
            ),
            (
                r"\b(deadline|timeline|weeks|days|hours|start date)\b",
                "Timeline",
                "What are the start date, deadline and key milestones?",
            ),
            (
                r"\b(success|acceptance|judging|evaluated|evaluation)\b",
                "Success criteria",
                "How will success be measured, and who accepts the outcome?",
            ),
            (
                r"\b(contact|owner|report to|reports to|sponsor)\b",
                "Decision owner",
                "Who owns the decision and can clarify the brief?",
            ),
        ]
        gaps, questions = [], []
        for pattern, label, question in checks:
            if not matches(pattern, text):
                gaps.append(f"{label} not detected in the brief.")
                questions.append(question)

        risks = []
        if any("Success criteria" in gap for gap in gaps):
            risks.append(
                Risk(
                    description="Unclear acceptance criteria may cause scope disagreements.",
                    severity="medium",
                )
            )
        if any("Commercial terms" in gap for gap in gaps):
            risks.append(
                Risk(
                    description="Commercial fit cannot be assessed without financial terms.",
                    severity="medium",
                )
            )
        if matches(r"\b(personal data|confidential|sensitive|customer data)\b", text):
            risks.append(
                Risk(
                    description="Confirm data access, privacy and handling obligations.",
                    severity="high",
                )
            )
        actions = ["Review the extracted items against the original brief."]
        if requirements:
            actions.append(
                "Map each requirement to evidence of capability and identify shortfalls."
            )
        if gaps:
            actions.append("Resolve the clarification questions with the opportunity owner.")
        actions.append("Confirm feasibility and commercial fit before committing.")
        return OpportunityAnalysis(
            opportunity_title=sentences[0][:120],
            opportunity_type=kind,
            summary=" ".join(sentences[:3]),
            requirements=requirements,
            constraints=constraints,
            assumptions=[
                "The pasted brief is treated as complete; no external facts are verified.",
                "Keyword matches are provisional; review priorities and omissions manually.",
            ],
            missing_information=gaps,
            clarification_questions=questions,
            risks=risks,
            recommended_next_actions=actions,
        )
