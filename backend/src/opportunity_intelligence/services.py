"""Small replacement seam for a future analyzer; no provider framework."""

from typing import Protocol

from opportunity_intelligence.domain import OpportunityAnalysis


class OpportunityAnalyzer(Protocol):
    def analyze(self, text: str) -> OpportunityAnalysis: ...


class AnalysisService:
    def __init__(self, analyzer: OpportunityAnalyzer) -> None:
        self.analyzer = analyzer

    def analyze(self, text: str) -> OpportunityAnalysis:
        return self.analyzer.analyze(text)
