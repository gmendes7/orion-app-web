# ORION — Roadmap para tornar a IA impecável

Objetivo: transformar ORION numa IA especialista em servidores, bancos, programação lógica/matemática e troubleshooting, com memória longa, integração com ferramentas externas (GitHub, Supabase, logs), comunicação técnica e camadas de explicação.

Visão geral dos componentes

1. Core AI runtime

- Serverless functions para: chat, tools proxy, embeddings, memory store/retrieval.
- Pipeline RAG (retrieval-augmented generation) usando embeddings + vetor DB (Supabase/pgvector).
- Prompt templates e sistema de controle de tom (system prompt + user style profile).

2. Memória longa

- Banco: Supabase (Postgres + pgvector) ou alternativa vector DB.
- Estrutura: `memories` (metadata, text, created_at), `memory_embeddings` (embedding vector, memory_id).
- TTL e políticas de segurança + criptografia at rest (via Supabase/KMS).

3. Integrações externas (tools)

- GitHub: app or PAT to read PRs, comment, suggest changes.
- Supabase: execute queries, manage user state, store memories.
- Logs: collect from servers (CloudWatch/ELK); provide a logs adapter for analysis.
- Documentation: versioned docs ingestion pipeline (convert to embeddings).

4. Frontend & UX

- Chat UI (React) with streaming, cancel, TTS (já presente).
- Mobile responsive layout and accessibility.
- Settings: profiles (tone), memory toggles, privacy options.

5. Security & Governance

- Secrets: store in environment (Supabase secrets / GitHub secrets / AWS KMS).
- Rate limits, input validation, audit logs (append-only), opt-out memory per-user.
- Data retention policy and export tools.

Fases e entregáveis (MVP -> v1 -> v2)

MVP (2-4 semanas):

- Memory tables + simple supabase function to upsert/query mems using OpenAI embeddings.
- Chat function integration: use memory retrieval as context.
- GitHub PR bot skeleton (read PR, post summary/comment).
- Mobile responsive fixes (already applied).

v1 (4-8 semanas):

- Full RAG pipeline with chunking, retriever scoring, freshness heuristics.
- User profiles and tone adaptation.
- Secure key management + audit logging.

v2 (ongoing):

- Fine-tuning or retrieval-augmented fine-tuning pipelines.
- Advanced tools: run database migrations, execute limited queries, analyze logs.
- Multi-modal memory (images, attachments).

Métricas de sucesso

- Tempo médio para resposta < 2s (latência de infra para RAG < 1s para retrieval).
- Precisão nas respostas técnicas (avaliado por testes e revisão humana) > 90%.
- Adoção: 50% dos usuários ativos usam memória personalizada.

---

# Ações imediatas (o que eu criei no repositório)

- `supabase/migrations/create_memory_tables.sql` — DDL para criar tabelas de memória e embeddings (pgvector).
- `supabase/functions/memory-store/index.ts` — função edge (TS) para upsert/query memórias usando OpenAI embeddings (placeholder de API key).
- `prompts/orion_templates.md` — templates de sistema e instruções para camadas de explicação e tom.
- `scripts/github-pr-bot.js` — script Node.js (octokit) esqueleto para comentar PRs.
- `docs/ORION_ROADMAP.md` — este arquivo.

Próximos passos

- Configurar segredo `OPENAI_API_KEY` e `SUPABASE_SERVICE_KEY` (para funções server-side) no painel do Supabase.
- Deploy da função `memory-store` no Supabase Functions.
- Rodar a migração SQL no banco Supabase (ou via UI SQL editor).
- Testar com alguns exemplos de input para verificar embeddings e queries.

Observação: os exemplos usam a API de embeddings da OpenAI por ser amplamente disponível; você pode trocar por outra provedora de embeddings (Anthropic, Cohere) alterando `memory-store`.
