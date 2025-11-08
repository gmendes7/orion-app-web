# 🧠 Sistema de Memória RAG (Retrieval-Augmented Generation)

## 📖 Visão Geral

O sistema de memória RAG permite que o O.R.I.Ö.N lembre e utilize contexto de conversas anteriores para fornecer respostas mais personalizadas e contextualmente relevantes.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  OrionChat → useChatStore → useRAGMemory          │  │
│  │  RAGMemoryIndicator (Visual Feedback)             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Edge Functions (Supabase)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  chat-ai: Busca contexto + gera resposta          │  │
│  │  generate-embedding: Gera embeddings               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Lovable AI Gateway                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  google/gemini-2.5-flash (Chat)                   │  │
│  │  text-embedding-3-small (Embeddings)              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│           Database (PostgreSQL + pgvector)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  messages: Conteúdo das mensagens                  │  │
│  │  message_embeddings: Vetores 1536D                 │  │
│  │  search_similar_messages(): Busca por similaridade │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Componentes Principais

### 1. Tabela `message_embeddings`

Armazena os embeddings vetoriais de cada mensagem:

```sql
- id: UUID (Primary Key)
- message_id: UUID (Foreign Key → messages.id)
- conversation_id: UUID (Foreign Key → conversations.id)
- user_id: UUID
- embedding: vector(1536) -- Vetor de 1536 dimensões
- created_at: TIMESTAMP
```

**Índices:**
- `ivfflat` index para busca vetorial eficiente
- Índices em `user_id` e `conversation_id` para queries rápidas

### 2. Edge Function: `generate-embedding`

**Responsabilidade:** Gera embeddings usando Lovable AI

**Input:**
```json
{
  "text": "Texto para gerar embedding",
  "message_id": "uuid",
  "conversation_id": "uuid",
  "user_id": "uuid"
}
```

**Output:**
```json
{
  "success": true,
  "message": "Embedding gerado e armazenado com sucesso"
}
```

### 3. Edge Function: `chat-ai` (Modificada)

**Nova funcionalidade:** Busca contexto antes de gerar resposta

**Fluxo:**
1. Recebe mensagem do usuário
2. Gera embedding da mensagem
3. Busca mensagens similares (threshold: 0.7)
4. Injeta contexto no system prompt
5. Gera resposta com Gemini
6. Retorna resposta via streaming

### 4. Função SQL: `search_similar_messages`

**Responsabilidade:** Busca vetorial eficiente

**Parâmetros:**
- `query_embedding`: vector(1536)
- `user_id_param`: UUID
- `match_threshold`: FLOAT (default: 0.7)
- `match_count`: INT (default: 5)
- `exclude_conversation_id`: UUID (opcional)

**Retorna:**
```sql
TABLE (
  message_id UUID,
  conversation_id UUID,
  content TEXT,
  is_user BOOLEAN,
  similarity_score FLOAT,
  created_at TIMESTAMP
)
```

## 🎯 Como Funciona

### Fluxo de uma Conversa

1. **Usuário envia mensagem:**
   ```
   "Como faço para autenticar usuários?"
   ```

2. **Sistema gera embedding:**
   ```
   [0.123, -0.456, 0.789, ...] (1536 dimensões)
   ```

3. **Busca mensagens similares:**
   ```
   Encontradas 3 mensagens relevantes:
   - [Usuário]: "Preciso implementar login"
   - [Orion]: "Para login, use Supabase Auth..."
   - [Usuário]: "Como criar tabela de usuários?"
   ```

4. **Injeta contexto no prompt:**
   ```
   System: Você é O.R.I.Ö.N...
   
   MEMÓRIA CONTEXTUAL:
   [Usuário]: Preciso implementar login
   [Orion]: Para login, use Supabase Auth...
   ...
   
   [Usuário atual]: Como faço para autenticar usuários?
   ```

5. **IA responde com contexto:**
   ```
   "Com base na nossa conversa anterior sobre login,
   você pode usar o Supabase Auth que já discutimos..."
   ```

## 🚀 Performance

### Otimizações Implementadas

1. **Geração Assíncrona de Embeddings**
   - Embeddings são gerados em background
   - Não bloqueiam a resposta da IA
   - Usa `.catch()` para não travar em erros

2. **Índice IVFFlat**
   - Busca vetorial O(log n) ao invés de O(n)
   - Configurado com 100 listas
   - Otimizado para similaridade de cosseno

3. **Threshold de Similaridade**
   - Apenas mensagens com score > 0.7 são retornadas
   - Reduz ruído e melhora relevância

4. **Limite de Contexto**
   - Máximo de 3 mensagens similares por query
   - Evita overload do prompt
   - Mantém foco no contexto mais relevante

## 📊 Monitoramento

### Métricas Disponíveis

**Via Hook `useRAGMemory`:**
```typescript
const { stats } = useRAGMemory();

console.log(stats);
// {
//   totalEmbeddings: 1234,
//   lastUpdated: "2025-01-08T10:30:00Z"
// }
```

**Via Indicador Visual:**
- Ícone de cérebro mostra quando RAG está ativo
- Badge numérico indica quantas memórias foram usadas
- Animação de pulso ao buscar contexto

## 🔒 Segurança

### Row-Level Security (RLS)

**Políticas Aplicadas:**
```sql
-- Usuários só veem seus próprios embeddings
CREATE POLICY "Users can view their own message embeddings"
ON message_embeddings FOR SELECT
USING (auth.uid() = user_id);

-- Usuários só podem criar embeddings próprios
CREATE POLICY "Users can insert their own message embeddings"
ON message_embeddings FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Isolamento de Dados

- Cada usuário tem acesso apenas aos próprios embeddings
- Busca semântica filtrada por `user_id`
- Opção de excluir conversa atual da busca

## 🧪 Testando o Sistema

### Teste 1: Conversa Simples
```
[Você]: Olá, qual o seu nome?
[Orion]: Sou O.R.I.Ö.N...

[Nova conversa]
[Você]: Você lembra qual é o seu nome?
[Orion]: Sim! Como mencionei anteriormente, sou O.R.I.Ö.N...
```

### Teste 2: Contexto Técnico
```
[Você]: Como criar uma tabela no Supabase?
[Orion]: Use CREATE TABLE...

[30 minutos depois]
[Você]: Preciso adicionar uma coluna
[Orion]: Na tabela que discutimos, você pode usar ALTER TABLE...
```

## 📈 Próximas Melhorias

1. **Configurações de Usuário**
   - Ajustar threshold de similaridade
   - Número de memórias a buscar
   - Ativar/desativar RAG

2. **Análise de Memória**
   - Dashboard de memórias armazenadas
   - Visualização de clusters de tópicos
   - Limpeza de memórias antigas

3. **Embeddings Incrementais**
   - Atualizar embeddings ao editar mensagens
   - Versioning de embeddings

4. **Multi-modal RAG**
   - Embeddings de imagens
   - Busca em documentos anexados
   - Contexto de código

## 🐛 Troubleshooting

### Problema: Embeddings não são gerados

**Sintomas:**
- Mensagens aparecem mas sem contexto
- Tabela `message_embeddings` vazia

**Solução:**
1. Verificar se `LOVABLE_API_KEY` está configurada
2. Checar logs da edge function `generate-embedding`
3. Verificar quota do Lovable AI

### Problema: Busca não retorna resultados

**Sintomas:**
- Score de similaridade sempre baixo
- Contexto não aparece nas respostas

**Solução:**
1. Reduzir `match_threshold` de 0.7 para 0.5
2. Aumentar `match_count` de 3 para 5
3. Verificar se há embeddings no banco

### Problema: Performance lenta

**Sintomas:**
- Resposta demora mais que o normal
- Database CPU alto

**Solução:**
1. Verificar índices: `\d message_embeddings`
2. Executar `VACUUM ANALYZE message_embeddings`
3. Considerar aumentar `lists` no índice IVFFlat

## 📚 Recursos Adicionais

- [Lovable AI Documentation](https://docs.lovable.dev/features/ai)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

**Status:** ✅ Implementado e funcional  
**Versão:** 1.0.0  
**Data:** 08/01/2025
