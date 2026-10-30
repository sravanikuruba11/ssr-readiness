from pydantic import BaseModel, Field
from typing import List, Optional

class CriterionResult(BaseModel):
    criterion: str
    title: str
    score: int
    status: str
    findings: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

class AnalysisResult(BaseModel):
    analysis_id: str
    filename: str
    overall_score: int
    readiness_level: str
    extracted_characters: int
    detected_sections: List[str]
    criteria: List[CriterionResult]
    critical_gaps: List[str]
    weak_sections: List[str]
    evidence_warnings: List[str]
    consistency_warnings: List[str]
    priority_actions: List[str]
    summary: str
    limitations: List[str]
