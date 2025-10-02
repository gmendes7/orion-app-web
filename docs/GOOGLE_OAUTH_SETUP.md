# 🔑 Configuração do Google OAuth

Guia completo para configurar autenticação com Google no O.R.I.Ö.N.

---

## 📋 Pré-requisitos

- Conta Google (Gmail)
- Acesso ao Supabase Dashboard
- Projeto O.R.I.Ö.N em produção ou staging

---

## 🔧 Passo 1: Google Cloud Console

### 1.1 Criar Projeto (se não tiver)

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Select a project"** → **"New Project"**
3. Nome do projeto: `ORION-App` (ou nome de sua preferência)
4. Clique em **"Create"**

### 1.2 Habilitar Google+ API

1. No menu lateral, vá em: **APIs & Services** → **Library**
2. Procure por: **"Google+ API"**
3. Clique em **"Enable"**

### 1.3 Configurar OAuth Consent Screen

1. Vá em: **APIs & Services** → **OAuth consent screen**
2. Escolha **"External"** (para usuários públicos)
3. Clique em **"Create"**

#### Informações do aplicativo:

| Campo | Valor |
|-------|-------|
| **App name** | O.R.I.Ö.N |
| **User support email** | seu-email@gmail.com |
| **App logo** | (Upload do logo se tiver) |
| **Application home page** | https://seu-dominio.com |
| **Privacy Policy** | https://seu-dominio.com/privacy |
| **Terms of Service** | https://seu-dominio.com/terms |
| **Developer contact** | seu-email@gmail.com |

4. Clique em **"Save and Continue"**

#### Scopes (Escopos):

1. Clique em **"Add or Remove Scopes"**
2. Selecione os seguintes escopos:
   - ✅ `.../auth/userinfo.email` - Ver seu endereço de e-mail
   - ✅ `.../auth/userinfo.profile` - Ver suas informações pessoais
   - ✅ `openid` - Autenticar usando OpenID Connect

3. Clique em **"Update"** → **"Save and Continue"**

#### Test Users (opcional para desenvolvimento):

1. Adicione emails de teste se estiver em modo de desenvolvimento
2. Clique em **"Save and Continue"**

### 1.4 Criar OAuth 2.0 Credentials

1. Vá em: **APIs & Services** → **Credentials**
2. Clique em **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

#### Configuração:

| Campo | Valor |
|-------|-------|
| **Application type** | Web application |
| **Name** | ORION Web Client |

#### Authorized JavaScript origins:

Adicione todas as URLs onde sua aplicação será acessada:

```
https://seu-dominio.com
https://preview-url.lovable.app
http://localhost:3000
```

#### Authorized redirect URIs:

**IMPORTANTE:** Esta é a URL de callback do Supabase:

```
https://wcwwqfiolxcluyuhmxxf.supabase.co/auth/v1/callback
```

💡 **Dica:** Para encontrar sua redirect URI do Supabase:
1. Acesse o Supabase Dashboard
2. Vá em: Authentication → Providers → Google
3. Copie a **"Callback URL (for OAuth)"**

3. Clique em **"Create"**

### 1.5 Obter Client ID e Client Secret

Após criar, você verá um modal com:

```
Client ID: 123456789-abc...googleusercontent.com
Client Secret: GOCSPX-xyz...
```

⚠️ **IMPORTANTE:** 
- Salve essas credenciais em um lugar seguro
- NÃO commite no git
- Você precisará delas no próximo passo

---

## 🗄️ Passo 2: Configurar Supabase

### 2.1 Adicionar Credenciais Google

1. Acesse o Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/wcwwqfiolxcluyuhmxxf/auth/providers
   ```

2. Localize **"Google"** na lista de providers

3. Ative o toggle **"Enable Sign in with Google"**

4. Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Client ID (for OAuth)** | Cole o Client ID do Google Cloud |
| **Client Secret (for OAuth)** | Cole o Client Secret do Google Cloud |

5. Clique em **"Save"**

### 2.2 Configurar URLs de Redirecionamento

1. Vá em: **Authentication** → **URL Configuration**

2. Configure as seguintes URLs:

#### Site URL:
```
https://seu-dominio.com
```
(ou URL do preview durante desenvolvimento)

#### Redirect URLs:

Adicione **TODAS** as URLs válidas:

```
https://seu-dominio.com/**
https://preview-url.lovable.app/**
http://localhost:3000/**
```

💡 **Dica:** O `**` no final permite qualquer caminho após a URL base

3. Clique em **"Save"**

---

## 🧪 Passo 3: Testar Integração

### 3.1 Teste Local

1. Execute o projeto localmente:
   ```bash
   npm run dev
   ```

2. Acesse: http://localhost:3000/auth

3. Clique em **"Continuar com Google"**

4. Você deve ser redirecionado para a tela de login do Google

5. Após fazer login, deve voltar para a aplicação autenticado

### 3.2 Teste em Produção

1. Acesse seu domínio de produção

2. Tente fazer login com Google

3. Verifique se funciona corretamente

### 3.3 Verificar Logs

Se algo der errado, verifique os logs:

**Supabase Logs:**
```
https://supabase.com/dashboard/project/wcwwqfiolxcluyuhmxxf/logs/auth-logs
```

**Console do Navegador:**
- Abra DevTools (F12)
- Vá na aba **"Console"**
- Procure por erros em vermelho

---

## 🐛 Troubleshooting (Solução de Problemas)

### ❌ Erro: "redirect_uri_mismatch"

**Causa:** A Redirect URI não está configurada corretamente no Google Cloud Console

**Solução:**
1. Vá no Google Cloud Console → Credentials
2. Edite o OAuth Client ID
3. Adicione a URL exata de callback do Supabase:
   ```
   https://wcwwqfiolxcluyuhmxxf.supabase.co/auth/v1/callback
   ```
4. Salve e aguarde alguns minutos para propagar

### ❌ Erro: "requested path is invalid"

**Causa:** Site URL ou Redirect URLs não configuradas no Supabase

**Solução:**
1. Vá no Supabase Dashboard → Authentication → URL Configuration
2. Configure **Site URL** com sua URL de produção
3. Adicione **Redirect URLs** com todas as URLs válidas (incluindo `/**`)
4. Salve

### ❌ Erro: "Access blocked: ORION-App has not completed the Google verification process"

**Causa:** App está em modo de teste no Google Cloud Console

**Solução:**

**Opção 1 - Para Desenvolvimento:**
1. Vá em: OAuth consent screen
2. Adicione seu email em **"Test users"**
3. Use apenas com emails de teste

**Opção 2 - Para Produção:**
1. Vá em: OAuth consent screen
2. Clique em **"Publish App"**
3. Siga o processo de verificação do Google (pode levar alguns dias)

### ❌ Erro: "Unauthorized client"

**Causa:** Client ID ou Client Secret incorretos

**Solução:**
1. Verifique se as credenciais no Supabase estão corretas
2. No Google Cloud Console, gere novas credenciais se necessário
3. Atualize no Supabase

### ❌ Login funciona localmente mas não em produção

**Causa:** URLs não configuradas para ambiente de produção

**Solução:**
1. **Google Cloud Console:**
   - Adicione URL de produção em **Authorized JavaScript origins**
   - Verifique Redirect URI

2. **Supabase:**
   - Configure Site URL com URL de produção
   - Adicione URL de produção em Redirect URLs

---

## 📊 Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

### Google Cloud Console
- [ ] Projeto criado
- [ ] Google+ API habilitada
- [ ] OAuth Consent Screen configurado
- [ ] Scopes corretos adicionados (.../userinfo.email, .../userinfo.profile, openid)
- [ ] OAuth Client ID criado
- [ ] JavaScript origins configuradas (incluindo localhost)
- [ ] Redirect URI do Supabase adicionada
- [ ] Client ID e Secret salvos com segurança

### Supabase Dashboard
- [ ] Provider Google habilitado
- [ ] Client ID configurado
- [ ] Client Secret configurado
- [ ] Site URL configurada
- [ ] Redirect URLs configuradas (com /**)
- [ ] Configurações salvas

### Testes
- [ ] Login local funciona
- [ ] Login em produção funciona
- [ ] Logout funciona
- [ ] Sessão persiste após reload
- [ ] Sem erros no console

---

## 🔒 Segurança

### Boas Práticas

1. **NUNCA** exponha Client Secret publicamente
2. Use Supabase Secrets para armazenar credenciais
3. Habilite apenas os scopes necessários
4. Mantenha lista de Redirect URLs restrita
5. Monitore logs de autenticação regularmente

### Auditoria de Segurança

Execute periodicamente:

```bash
# Verificar se secrets não estão no git
git log --all -S 'GOCSPX-'

# Verificar configurações do Supabase
# Dashboard → Authentication → Policies
```

---

## 📚 Recursos Adicionais

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Troubleshooting OAuth](https://supabase.com/docs/guides/auth/troubleshooting)

---

## 💬 Suporte

Se você seguiu todos os passos e ainda está com problemas:

1. Verifique os logs do Supabase
2. Verifique console do navegador (F12)
3. Consulte a documentação oficial
4. Abra uma issue no GitHub (sem expor secrets!)

---

**Última atualização:** 2025-10-02  
**Versão do guia:** 1.0
