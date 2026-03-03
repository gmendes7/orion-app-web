from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AgentKind(str, Enum):
    SECURITY = "security"
    CODE = "code"
    EXECUTIVE = "executive"
    DOCUMENTATION = "documentation"
    VISION = "vision"


class OrchestrationRequest(BaseModel):
    message: str = Field(min_length=1)
    context: Dict[str, Any] = Field(default_factory=dict)
    preferred_agents: Optional[List[AgentKind]] = None
    max_agents: int = Field(default=3, ge=1, le=5)


class AgentResult(BaseModel):
    agent: AgentKind
    summary: str
    actions: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class OrchestrationResponse(BaseModel):
    strategy: str
    selected_agents: List[AgentKind]
    diagnosis: str
    technical_analysis: str
    solution_options: List[str]
    risks_and_benefits: List[str]
    strategic_recommendation: str
    implementation_plan: List[str]
    tests_and_validation: List[str]
    agent_outputs: List[AgentResult]
