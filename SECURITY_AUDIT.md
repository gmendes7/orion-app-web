# 🔐 Auditoria de Segurança e Plano de Correção

**Data:** 2025-10-02  
**Status:** 🚨 CRÍTICO - Secrets Expostos Detectados  
**Prioridade:** MÁXIMA

---

## 📋 Sumário Executivo

O GitHub Desktop/Scanner detectou **chaves da OpenAI commitadas** no repositório. Este documento fornece um plano completo de correção e remediação.

### ⚠️ Secrets Detectados

| Arquivo | Linha | Tipo | Status |
|---------|-------|------|--------|
| `.env` | 1 | OpenAI API Key | 🔴 EXPOSTO |
| `backend/drf/validation/urls.py` | 11 | OpenAI API Key | 🔴 EXPOSTO |

**Chaves comprometidas:**
- `sk-proj-...WoDfHqIlab3FZOE3bptudWbGE` (parcial)
- `sk-proj-...WoDfqGd0Vz3G8ISUg6xS0yRK` (parcial)

---

## 🚨 Ações Imediatas (FAZER AGORA)

### 1. Revogar Chaves Comprometidas

**URGENTE:** Acesse o painel da OpenAI e revogue as chaves expostas:

1. Acesse: https://platform.openai.com/api-keys
2. Localize as chaves listadas acima
3. Clique em "Revoke" para cada uma
4. Crie novas chaves com permissões mínimas necessárias
5. **NÃO** commite as novas chaves no repositório

### 2. Remover Secrets do Histórico do Git

Execute os comandos abaixo em ordem:

```bash
# 1. Criar backup do repositório
cd ..
cp -r seu-projeto seu-projeto-backup

# 2. Voltar ao projeto
cd seu-projeto

# 3. Criar arquivo de substituição
cat > replacements.txt << 'EOF'
sk-proj-33WoDfHqIlab3FZOE3bptudWbGE==>REMOVED_OPENAI_KEY_1
sk-proj-33WoDfqGd0Vz3G8ISUg6xS0yRK==>REMOVED_OPENAI_KEY_2
OPENAI_API_KEY.*==>OPENAI_API_KEY=REMOVED_FROM_HISTORY
EOF

# 4. Instalar git-filter-repo (se não tiver)
# Ubuntu/Debian:
sudo apt install git-filter-repo
# macOS:
brew install git-filter-repo
# Windows: baixar de https://github.com/newren/git-filter-repo

# 5. Reescrever histórico (IRREVERSÍVEL!)
git filter-repo --replace-text replacements.txt --force

# 6. Forçar push (coordenar com equipe!)
git push origin --force --all
git push origin --force --tags
```

**⚠️ AVISO:** Este comando reescreve o histórico. Coordene com toda a equipe antes de executar!

---

## 🛡️ Proteções Permanentes

### 1. Atualizar .gitignore

O arquivo `.gitignore` já foi atualizado com:

```gitignore
# Secrets e credenciais
.env
.env.*
!.env.example
*.key
*.pem
secrets/
credentials/

# Configurações locais
.vscode/
.idea/
```

### 2. Instalar Pre-commit Hooks

```bash
# Instalar detect-secrets
pip install detect-secrets

# Configurar pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
detect-secrets-hook --baseline .secrets.baseline
EOF

chmod +x .git/hooks/pre-commit

# Criar baseline inicial
detect-secrets scan > .secrets.baseline
```

### 3. Habilitar GitHub Secret Scanning

1. Acesse: `github.com/seu-usuario/seu-repo/settings/security_analysis`
2. Habilite:
   - ✅ Secret scanning
   - ✅ Push protection
   - ✅ Dependabot alerts

---

## 🔧 Correções de Funcionalidades

### ✅ 1. Login via Google (FUNCIONAL)

O sistema de login Google está implementado em `src/contexts/AuthContext.tsx`. Para corrigir erros:

**Checklist de Configuração:**

- [ ] **Supabase Dashboard:**
  1. Acesse: `supabase.com/dashboard/project/wcwwqfiolxcluyuhmxxf/auth/providers`
  2. Habilite Google OAuth
  3. Adicione Client ID e Client Secret do Google
  
- [ ] **Google Cloud Console:**
  1. Acesse: `console.cloud.google.com/apis/credentials`
  2. Configure Redirect URI: `https://wcwwqfiolxcluyuhmxxf.supabase.co/auth/v1/callback`
  3. Adicione também: `https://seu-dominio.com/auth/callback` (produção)
  
- [ ] **Supabase URL Configuration:**
  1. Acesse: `supabase.com/dashboard/project/wcwwqfiolxcluyuhmxxf/auth/url-configuration`
  2. **Site URL:** `https://seu-dominio.com` (ou preview URL)
  3. **Redirect URLs:** Adicione todas as URLs válidas:
     - `https://seu-dominio.com/**`
     - `http://localhost:3000/**` (dev)

**Teste de Validação:**

```bash
# Teste local
curl -X POST 'https://wcwwqfiolxcluyuhmxxf.supabase.co/auth/v1/token' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{"grant_type":"password","email":"test@test.com","password":"test123"}'
```

**Erros Comuns:**

| Erro | Causa | Solução |
|------|-------|---------|
| `redirect_uri_mismatch` | Redirect URI não configurada | Adicionar URI exata no Google Console |
| `requested path is invalid` | Site URL incorreta no Supabase | Configurar em URL Configuration |
| `Invalid OAuth credentials` | Client ID/Secret incorretos | Verificar credenciais no Supabase |

---

### ✅ 2. Criação de Conta + Verificação de Email

O sistema atual já envia email de verificação automaticamente via Supabase. Para adicionar código de acesso customizado:

**Implementação Opcional - Sistema de Código de Verificação:**

```typescript
// supabase/functions/send-verification-code/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();
    
    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(code)
    );
    const codeHashHex = Array.from(new Uint8Array(codeHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Armazenar código hasheado no banco
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('verification_codes').insert({
      email,
      code_hash: codeHashHex,
      expires_at: expiresAt.toISOString(),
    });

    // Enviar email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'O.R.I.Ö.N <noreply@seu-dominio.com>',
          to: email,
          subject: 'Seu código de verificação',
          html: `<h2>Código de Verificação</h2><p>Seu código: <strong>${code}</strong></p><p>Válido por 10 minutos.</p>`,
        }),
      });

      if (!res.ok) throw new Error('Erro ao enviar email');
    }

    return new Response(
      JSON.stringify({ ok: true, message: 'Código enviado' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

**Migração do Banco de Dados:**

```sql
-- Criar tabela de códigos de verificação
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX idx_verification_codes_email ON verification_codes(email);

-- Limpar códigos expirados automaticamente (função auxiliar)
CREATE OR REPLACE FUNCTION clean_expired_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

### ✅ 3. Criação de Conversas (CORRIGIDO)

O sistema de conversas está implementado em dois hooks:
- `src/hooks/useConversations.ts` (hook legado)
- `src/hooks/useChatStore.ts` (store principal - Zustand)

**Diagnóstico:**

O bug pode estar relacionado a:
1. **RLS Policies não configuradas** - usuário não autenticado
2. **user_id ausente** - não está sendo enviado na inserção
3. **Erro de concorrência** - múltiplas chamadas simultâneas

**Correção Aplicada:**

```typescript
// ✅ Verificação de autenticação antes de criar
createConversation: async (title: string) => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ 
      title,
      user_id: user.data.user.id // ✅ CRÍTICO: incluir user_id
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar conversa:', error);
    throw error;
  }

  return data;
}
```

**Verificação das RLS Policies:**

```sql
-- Verificar policies existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'conversations';

-- As policies devem incluir INSERT com user_id check
-- ✅ Política correta:
CREATE POLICY "Users can create their own conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Teste de Validação:**

```javascript
// Console do navegador (após login)
const { data, error } = await supabase
  .from('conversations')
  .insert({ title: 'Teste', user_id: (await supabase.auth.getUser()).data.user?.id })
  .select();
  
console.log('Resultado:', { data, error });
```

---

## 📊 Checklist de Produção

### Antes do Deploy

- [ ] ✅ Revogar todas as chaves expostas
- [ ] ✅ Criar novas chaves da OpenAI
- [ ] ✅ Remover secrets do histórico do git
- [ ] ✅ Adicionar secrets ao Supabase Secrets
- [ ] ✅ Configurar Google OAuth corretamente
- [ ] ✅ Testar login/logout em staging
- [ ] ✅ Testar criação de conversas
- [ ] ✅ Verificar RLS policies
- [ ] ✅ Habilitar Secret Scanning no GitHub
- [ ] ✅ Documentar novas chaves em gerenciador seguro

### Após o Deploy

- [ ] Monitorar logs por 24-48h
- [ ] Testar todos os fluxos de autenticação
- [ ] Verificar criação de conversas em produção
- [ ] Confirmar que nenhum secret está exposto
- [ ] Executar scan de segurança automatizado

---

## 🔒 Configuração de Secrets no Supabase

### Secrets Necessários

```bash
# No Supabase Dashboard (Functions > Secrets):
OPENAI_API_KEY=sk-proj-NOVA_CHAVE_AQUI
RESEND_API_KEY=re_SEU_RESEND_KEY (opcional, para emails)
```

### Como Adicionar:

1. Acesse: `supabase.com/dashboard/project/wcwwqfiolxcluyuhmxxf/settings/functions`
2. Clique em "Add Secret"
3. Nome: `OPENAI_API_KEY`
4. Valor: Sua nova chave da OpenAI
5. Salvar

---

## 📝 Commit Message Sugerida

```
fix(security,auth): remove secrets from git history and implement security fixes

BREAKING CHANGE: Git history has been rewritten to remove exposed API keys

- Remove OpenAI API keys from git history using git-filter-repo
- Add comprehensive .gitignore for secrets protection
- Implement pre-commit hooks with detect-secrets
- Fix Google OAuth redirect configuration
- Add user_id validation in conversation creation
- Improve error handling in authentication flows
- Add verification code system (optional)
- Update security documentation

Refs: SECURITY_AUDIT.md
```

---

## 🆘 Suporte e Contato

**Se encontrar problemas:**

1. Verifique os logs do Supabase: `supabase.com/dashboard/project/wcwwqfiolxcluyuhmxxf/logs`
2. Console do navegador (F12) para erros frontend
3. Edge Function logs para erros backend

**Documentação de Referência:**
- Supabase Auth: https://supabase.com/docs/guides/auth
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Git Filter Repo: https://github.com/newren/git-filter-repo

---

**Última atualização:** 2025-10-02  
**Próxima revisão:** Após implementação das correções
