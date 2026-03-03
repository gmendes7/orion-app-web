from __future__ import annotations

from typing import Dict, List

from .schemas import AgentKind, AgentResult


class BaseAgent:
    kind: AgentKind

    def run(self, message: str, context: Dict[str, object]) -> AgentResult:
        raise NotImplementedError


class SecurityAgent(BaseAgent):
    kind = AgentKind.SECURITY

    def run(self, message: str, context: Dict[str, object]) -> AgentResult:
        return AgentResult(
            agent=self.kind,
            summary="Avaliação inicial de superfície de ataque e controles mínimos de segurança.",
            actions=[
                "Aplicar JWT/OAuth2 para autenticação e autorização.",
                "Ativar rate limiting com Redis por IP e por token.",
                "Registrar logs estruturados e trilha de auditoria.",
            ],
            risks=[
                "Ausência de controles de acesso granulares (RBAC).",
                "Falta de monitoramento centralizado para incidentes.",
            ],
            metadata={"priority": "high", "domain": "security"},
        )


class CodeAgent(BaseAgent):
    kind = AgentKind.CODE

    def run(self, message: str, context: Dict[str, object]) -> AgentResult:
        return AgentResult(
            agent=self.kind,
            summary="Plano técnico para implementação modular e escalável.",
            actions=[
                "Separar API Gateway, Orchestrator e Agent Services em módulos independentes.",
                "Definir contratos pydantic para requests/responses entre serviços.",
                "Introduzir fila assíncrona para tarefas pesadas de IA.",
            ],
            risks=[
                "Acoplamento alto entre frontend e serviços de IA.",
                "Acúmulo de lógica de negócio no cliente sem bounded contexts.",
            ],
            metadata={"priority": "high", "domain": "engineering"},
        )


class ExecutiveAgent(BaseAgent):
    kind = AgentKind.EXECUTIVE

    def run(self, message: str, context: Dict[str, object]) -> AgentResult:
        return AgentResult(
            agent=self.kind,
            summary="Recomendação executiva orientada a ROI e governança.",
            actions=[
                "Definir roadmap em fases (MVP, hardening, enterprise scale).",
                "Estabelecer KPIs de latência, custo por requisição e taxa de sucesso.",
                "Criar trilha de compliance e gestão de riscos.",
            ],
            risks=[
                "Escala sem observabilidade pode elevar custo operacional.",
            ],
            metadata={"priority": "medium", "domain": "business"},
        )


class DocumentationAgent(BaseAgent):
    kind = AgentKind.DOCUMENTATION

    def run(self, message: str, context: Dict[str, object]) -> AgentResult:
        return AgentResult(
            agent=self.kind,
            summary="Estrutura mínima de documentação corporativa e técnica.",
            actions=[
                "Publicar ADRs para decisões arquiteturais.",
                "Versionar OpenAPI e contratos internos.",
                "Gerar runbooks de incidentes e playbooks operacionais.",
            ],
            risks=["Conhecimento tácito não documentado no time."],
            metadata={"priority": "medium", "domain": "documentation"},
        )


class VisionAgent(BaseAgent):
    kind = AgentKind.VISION

    def run(self, message: str, context: Dict[str, object]) -> AgentResult:
        return AgentResult(
            agent=self.kind,
            summary="Plano multimodal para visão computacional e OCR enterprise.",
            actions=[
                "Pipeline de OCR com Tesseract e fallback cloud.",
                "Classificação de conteúdo visual com modelos multimodais.",
                "Política de retenção para imagens e redaction de dados sensíveis.",
            ],
            risks=["Custos de processamento visual em alta escala."],
            metadata={"priority": "medium", "domain": "multimodal"},
        )


def build_agent_registry() -> Dict[AgentKind, BaseAgent]:
    agents: List[BaseAgent] = [
        SecurityAgent(),
        CodeAgent(),
        ExecutiveAgent(),
        DocumentationAgent(),
        VisionAgent(),
    ]
    return {agent.kind: agent for agent in agents}
