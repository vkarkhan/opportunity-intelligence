"""HTTP boundary and dependency wiring."""

import os
from functools import lru_cache
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from opportunity_intelligence.analyzer import DeterministicLocalAnalyzer
from opportunity_intelligence.domain import AnalyzeRequest, OpportunityAnalysis
from opportunity_intelligence.services import AnalysisService

app = FastAPI(title="Opportunity Intelligence", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if origin.strip()
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def validation_error(_request, _error):
    # Do not echo potentially sensitive opportunity text in validation responses.
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Provide text with 30–20,000 characters, at least five words and 20 letters."
        },
    )


@lru_cache
def get_service() -> AnalysisService:
    return AnalysisService(DeterministicLocalAnalyzer())


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "opportunity-intelligence"}


@app.post("/api/v1/opportunities/analyze", response_model=OpportunityAnalysis)
def analyze(request: AnalyzeRequest, service: Annotated[AnalysisService, Depends(get_service)]):
    return service.analyze(request.text)
