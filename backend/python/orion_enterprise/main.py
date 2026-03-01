from __future__ import annotations

from fastapi import FastAPI

from .orchestrator import OrionOrchestrator
from .schemas import OrchestrationRequest, OrchestrationResponse

app = FastAPI(
    title="ORION Enterprise Orchestrator",
    version="0.1.0",
    description="Orquestrador multiagente para o ecossistema ORION.",
)

orchestrator = OrionOrchestrator()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "orion-enterprise-orchestrator"}


@app.post("/v1/orchestrate", response_model=OrchestrationResponse)
def orchestrate(payload: OrchestrationRequest) -> OrchestrationResponse:
    return orchestrator.run(payload)
