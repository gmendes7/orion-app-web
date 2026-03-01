# ORION Enterprise Orchestrator (FastAPI)

Implementação inicial de referência para a arquitetura **multiagente coordenada** do ORION.

## Objetivo

Evitar IA monolítica e operar com **agentes especializados**:

- Security Agent
- Code Agent
- Executive Agent
- Documentation Agent
- Vision Agent

com um **Orchestrator** central que seleciona agentes por contexto.

## Executar localmente

```bash
pip install -r backend/python/requirements.txt
uvicorn backend.python.orion_enterprise.main:app --reload --port 8090
```

## Endpoint principal

`POST /v1/orchestrate`

Exemplo de payload:

```json
{
  "message": "preciso de arquitetura segura com OCR e KPIs",
  "context": {"tenant": "acme"},
  "max_agents": 4
}
```

## Roadmap enterprise

1. Conectar memória vetorial (Qdrant/Weaviate/Pinecone).
2. Integrar autenticação JWT/OAuth2 e RBAC.
3. Adicionar fila assíncrona (Celery/Redis) para tarefas pesadas.
4. Instrumentar observabilidade (Prometheus/Grafana/Sentry).
