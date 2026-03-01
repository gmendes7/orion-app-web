from __future__ import annotations

from typing import List

from .agents import build_agent_registry
from .schemas import AgentKind, OrchestrationRequest, OrchestrationResponse


class OrionOrchestrator:
    """Orquestrador multiagente para respostas enterprise estruturadas."""

    def __init__(self) -> None:
        self.registry = build_agent_registry()

    def select_agents(self, request: OrchestrationRequest) -> List[AgentKind]:
        if request.preferred_agents:
            selected = [k for k in request.preferred_agents if k in self.registry]
            return selected[: request.max_agents]

        text = request.message.lower()
        selected: List[AgentKind] = [AgentKind.CODE, AgentKind.SECURITY]

        if any(word in text for word in ["documentação", "document", "runbook"]):
            selected.append(AgentKind.DOCUMENTATION)
        if any(word in text for word in ["visão", "imagem", "ocr", "camera", "câmera"]):
            selected.append(AgentKind.VISION)
        if any(word in text for word in ["roi", "kpi", "negócio", "estratégia", "sla"]):
            selected.append(AgentKind.EXECUTIVE)

        # remove duplicates mantendo ordem
        uniq: List[AgentKind] = []
        for agent in selected:
            if agent not in uniq:
                uniq.append(agent)

        return uniq[: request.max_agents]

    def run(self, request: OrchestrationRequest) -> OrchestrationResponse:
        selected_agents = self.select_agents(request)
        outputs = [self.registry[agent].run(request.message, request.context) for agent in selected_agents]

        return OrchestrationResponse(
            strategy="Sistema de agentes coordenados com orquestração explícita por domínio.",
            selected_agents=selected_agents,
            diagnosis="Necessidade de evolução para arquitetura enterprise multimodal, segura e escalável.",
            technical_analysis="Separação em gateway + orquestrador + agentes reduz acoplamento e melhora governança técnica.",
            solution_options=[
                "Adotar FastAPI como backend principal para orquestração e APIs assíncronas.",
                "Usar PostgreSQL para dados estruturados e banco vetorial para memória semântica.",
                "Reservar Rust para módulos de segurança e processamento crítico.",
            ],
            risks_and_benefits=[
                "Benefício: maior escalabilidade organizacional por especialização de agentes.",
                "Risco: aumento de complexidade operacional sem observabilidade adequada.",
            ],
            strategic_recommendation="Implementar em fases com foco inicial em orquestrador + agentes core (code/security/executive).",
            implementation_plan=[
                "Fase 1: API FastAPI com orquestrador e contratos pydantic.",
                "Fase 2: integração com memória vetorial (Qdrant/Weaviate/Pinecone).",
                "Fase 3: hardening de segurança (JWT/OAuth2/RBAC/auditoria).",
                "Fase 4: multimodalidade e agentes avançados de visão/documentação.",
            ],
            tests_and_validation=[
                "Testes unitários do seletor de agentes e validação dos contratos.",
                "Testes de integração para fluxo ponta a ponta gateway → orquestrador → agentes.",
                "SLOs de latência, taxa de erro e custo por requisição monitorados em produção.",
            ],
            agent_outputs=outputs,
        )
