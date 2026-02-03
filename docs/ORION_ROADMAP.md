# ORION — Plano Técnico e Arquitetura (JARVIS Realista)

## 1) Objetivo e princípios
- **Produto real, não demo**: foco em usabilidade diária e confiabilidade.
- **Modularidade**: cada capacidade (voz, visão, automação, memória) como serviço isolado.
- **Privacidade por padrão**: processamento local sempre que possível, com controle explícito de dados.
- **Eficiência**: minimizar custo de API e latência; fallback offline parcial.

## 2) Estado atual (observável no repo)
- Front-end React/Vite com foco em UI conversacional.
- Integrações com Supabase e funções edge.
- Componentes de interface para Orion (ex.: `OrionInterface`, `OrionEye`).

## 3) Arquitetura alvo (camadas)

### 3.1 Núcleo Cognitivo (Brain)
**Responsabilidades**
- Orquestrar agentes especializados.
- Planejamento de tarefas (HTN/ToT simples + heurísticas).
- Roteamento de intenções para módulos (voz, visão, automação).

**Tecnologias possíveis**
- Orquestrador local: Node.js + worker threads.
- LLM: modelo local (via Ollama) + fallback cloud quando necessário.
- Estrutura de agentes: registro de capacidades + políticas de execução.

### 3.2 Memória Inteligente
**Camadas**
- **Curto prazo**: contexto da sessão (em memória + persistência leve).
- **Médio prazo**: histórico recente, ações executadas e resultados.
- **Longo prazo**: preferências e padrões (consentimento explícito).

**RAG**
- Vetorização local (sentence transformers) e índice (SQLite + sqlite-vss / qdrant local).
- Política de retenção configurável pelo usuário.

### 3.3 Voz (Speech)
**Entrada**
- VAD + streaming ASR (Whisper local ou serviço cloud quando necessário).
- Detecção de intenção e extração de slots.

**Saída**
- TTS local (p.ex. Piper) + vozes por perfil (técnico, casual, urgente).

### 3.4 Visão (Computer Vision)
- Captura de tela com consentimento.
- OCR + detecção de elementos visuais (buttons, cards, dialogs).
- Explicação contextual + sugestões baseadas no estado visual.

### 3.5 Automação de Sistema (SO)
- Execução por “planos” com confirmação.
- **Modo seguro**: lista branca de comandos permitidos.
- Logs assinados e reversibilidade quando possível.

### 3.6 Proatividade Inteligente
- Score de confiança para sugestões.
- Níveis de proatividade configuráveis.
- Nunca atuar sem confirmação explícita.

## 4) Roadmap técnico (entregas)

### Fase 1 — MVP Real (4–6 semanas)
- Brain mínimo: roteamento de intenções + agente principal.
- Memória curta/média com histórico local.
- Voz: ASR + TTS com configuração simples.
- Automação segura: abrir apps e executar scripts autorizados.
- Observabilidade básica (logs estruturados + métricas).

### Fase 2 — Multimodal (6–10 semanas)
- Visão básica (OCR + detecção simples de UI).
- RAG local para memória longa.
- Painel de privacidade e permissões.

### Fase 3 — Avançado (10+ semanas)
- Planejamento avançado (multi-step + validação)
- Proatividade contextual com níveis configuráveis.
- Aprendizado de hábitos (opt-in) com auditoria.

## 5) Segurança e privacidade
- Criptografia local (AES-GCM) para dados sensíveis.
- Segregação por usuário e por dispositivo.
- Política de logs com níveis (mínimo / padrão / detalhado).
- “Botão de pânico”: desativa automações e apaga sessão.

## 6) MVP recomendado
- **Núcleo**: roteador de intents + um agente principal.
- **Voz**: ASR local + TTS local.
- **Memória**: histórico de conversa + notas rápidas (curto/médio prazo).
- **Automação**: scripts aprovados e execução com confirmação.

## 7) Critérios de sucesso
- Latência de resposta < 2s para comandos comuns.
- 95%+ de intents reconhecidas corretamente em cenários comuns.
- Zero execução sem confirmação explícita.

## 8) Próximas ações sugeridas no código
- Criar módulo `brain/` com registry de agentes.
- Implementar pipeline de voz (ASR/TTS) isolado em worker.
- Adicionar storage local para memória (SQLite + criptografia).
