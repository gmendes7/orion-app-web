# ORION — Arquitetura e Roadmap Técnico (Nível JARVIS Realista)

> Documento de engenharia: serve como guia direto para implementação.

## 1) Visão de Produto
ORION é um assistente pessoal multimodal (voz, visão, automação, contexto) com foco em **autonomia supervisionada**, privacidade e desempenho. O objetivo é entregar utilidade diária comparável a um “JARVIS real”, porém **100% viável tecnologicamente**.

**Princípios obrigatórios**
- **Local-first** sempre que possível (voz, memória, visão, automação)
- **Privacidade e consentimento explícitos**
- **Arquitetura modular** (troca de módulos sem quebrar o sistema)
- **Sem dependência de APIs caras** como requisito básico
- **Auditabilidade**: logs legíveis e rastreáveis

---

## 2) Diagnóstico do Estado Atual (observável no repo)
- Front-end React/Vite com UI conversacional.
- Supabase para dados e edge functions.
- Componentes de interface Orion (OrionEye, OrionInterface).
- Base pronta para evoluir o “cérebro” e os módulos multimodais.

**Gap atual**: falta uma camada de **orquestração cognitiva**, **memória persistente**, **voz/visão funcional** e **automação segura**.

---

## 3) Arquitetura de Camadas (proposta final)

### 3.1 Núcleo Cognitivo (Brain)
**Responsabilidades**
- Compreender intenções e objetivos do usuário.
- Planejar tarefas (multi-step) e delegar para agentes.
- Decidir quando pedir confirmação vs. executar.

**Componentes internos**
- **Router de intenção** (classificação de intent + extração de slots)
- **Planner** (HTN/ToT simplificado + validação)
- **Executor** (chama módulos de voz, visão, automação)
- **Policy Engine** (regras de segurança e consentimento)

**Tecnologias**
- Orquestrador: Node.js + workers
- Modelo local: Ollama + fallback cloud
- Mensageria: event bus leve (em memória + persistência)

---

### 3.2 Memória Inteligente
**Camadas**
- **Curto prazo**: contexto da sessão atual (RAM + cache local)
- **Médio prazo**: últimos X dias/ações
- **Longo prazo**: preferências/hábitos (somente opt-in)

**RAG**
- Vetorização local (sentence-transformers)
- Índice: SQLite + sqlite-vss ou Qdrant local

**Política de retenção**
- Configurável pelo usuário
- Expiração automática
- Exportável/Removível

---

### 3.3 Voz (Speech)
**Entrada**
- VAD + ASR streaming (Whisper local)
- Fallback cloud se baixa performance

**Saída**
- TTS local (Piper) com perfis: técnico, casual, urgente

**Desafios e soluções**
- Latência: pipeline em worker separado
- Ruído: normalização + VAD agressivo

---

### 3.4 Visão (Computer Vision)
**Capacidades**
- OCR de tela
- Detecção de UI (botões, janelas, campos)
- Interpretação contextual

**Ferramentas possíveis**
- Tesseract + OpenCV local
- OCR + layout detection

---

### 3.5 Automação do Sistema
**Regras**
- Execução apenas com consentimento explícito
- Log de cada ação
- Modo seguro (lista branca)

**Exemplos de ações**
- Abrir apps, organizar arquivos, executar scripts pré-aprovados
- Macro automations (ex: backup, limpeza)

---

### 3.6 Proatividade Inteligente
**Lógica**
- Score de confiança
- Proatividade configurável (0–3)
- Sugestões “não invasivas”

---

## 4) Roadmap por Fases

### Fase 1 — MVP funcional (4–6 semanas)
- Brain básico: roteamento de intents
- Memória curta/média
- ASR/TTS local
- Automação segura (scripts aprovados)

### Fase 2 — Multimodal (6–10 semanas)
- OCR + visão básica
- Memória longa com RAG
- Painel de permissões e privacidade

### Fase 3 — Avançado (10+ semanas)
- Planejamento multi-step robusto
- Proatividade contextual configurável
- Aprendizado de hábitos (opt-in)

---

## 5) Segurança e Privacidade
- Criptografia local (AES-GCM) para dados sensíveis
- Segregação por usuário e dispositivo
- Logs com níveis (mínimo / padrão / detalhado)
- “Botão de pânico”: desativa automações e apaga sessão

---

## 6) MVP recomendado (entregável concreto)
- **Brain** com Router de intents
- **Voz**: ASR + TTS local
- **Memória**: histórico local + notas rápidas
- **Automação**: scripts aprovados e confirmação obrigatória

---

## 7) Próximas ações no código
- Criar módulo `brain/` com registry de agentes
- Criar serviço de voz (worker separado)
- Criar camada de memória local (SQLite + criptografia)
- Adicionar painel de permissões no front-end
