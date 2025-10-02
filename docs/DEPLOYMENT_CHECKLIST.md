# 🚀 Checklist de Deploy para Produção

Este documento fornece uma lista completa de verificação antes de fazer deploy para produção.

---

## 📋 Pré-Deploy

### 🔐 Segurança

- [ ] **Remover secrets do histórico do git**
  ```bash
  ./scripts/clean-git-history.sh
  ```

- [ ] **Verificar .gitignore está atualizado**
  ```bash
  cat .gitignore | grep -E "\.env|secrets|credentials"
  ```

- [ ] **Revogar chaves expostas**
  - [ ] OpenAI: https://platform.openai.com/api-keys
  - [ ] Supabase: https://supabase.com/dashboard/project/wcwwqfiolxcluyuhmxxf/settings/api
  - [ ] Google OAuth: https://console.cloud.google.com/apis/credentials

- [ ] **Criar novas chaves de API**
  - [ ] OpenAI (com permissões mínimas)
  - [ ] Resend (se usar email customizado)
  - [ ] Outras APIs utilizadas

- [ ] **Adicionar secrets ao Supabase**
  ```
  Dashboard > Functions > Secrets
  - OPENAI_API_KEY
  - RESEND_API_KEY (opcional)
  ```

- [ ] **Habilitar Secret Scanning no GitHub**
  - Settings > Security > Secret scanning
  - Push protection: ✅ Ativado

- [ ] **Instalar Git Hooks**
  ```bash
  ./scripts/setup-git-hooks.sh
  ```

### 🔧 Configuração de Autenticação

- [ ] **Google OAuth configurado**
  - [ ] Client ID e Secret no Supabase
  - [ ] Redirect URI: `https://wcwwqfiolxcluyuhmxxf.supabase.co/auth/v1/callback`
  - [ ] JavaScript Origins adicionadas

- [ ] **URLs de Autenticação no Supabase**
  - Dashboard > Auth > URL Configuration
  - [ ] Site URL: `https://seu-dominio.com`
  - [ ] Redirect URLs:
    - `https://seu-dominio.com/**`
    - `http://localhost:3000/**` (dev)

- [ ] **Testar fluxo de autenticação completo**
  - [ ] Registro de nova conta
  - [ ] Login com email/senha
  - [ ] Login com Google
  - [ ] Logout
  - [ ] Persistência de sessão

### 🗄️ Banco de Dados

- [ ] **Verificar RLS Policies**
  ```sql
  SELECT * FROM pg_policies WHERE tablename IN ('conversations', 'messages', 'profiles');
  ```

- [ ] **Testar criação de dados**
  ```sql
  -- Teste manual via SQL Editor
  INSERT INTO conversations (title, user_id)
  VALUES ('Teste', '00000000-0000-0000-0000-000000000000');
  ```

- [ ] **Backup do banco de dados**
  - Dashboard > Database > Backups
  - [ ] Backup manual criado

- [ ] **Indexes otimizados**
  ```sql
  -- Verificar indexes
  SELECT * FROM pg_indexes WHERE tablename IN ('conversations', 'messages');
  ```

### 🧪 Testes

- [ ] **Testes locais passando**
  ```bash
  npm run test
  ```

- [ ] **Build sem erros**
  ```bash
  npm run build
  ```

- [ ] **Testes E2E em staging**
  - [ ] Criar conta
  - [ ] Login/Logout
  - [ ] Criar conversa
  - [ ] Enviar mensagem
  - [ ] Upload de imagem
  - [ ] Análise de imagem

- [ ] **Performance adequada**
  - [ ] Lighthouse Score > 90
  - [ ] Time to Interactive < 3s
  - [ ] Sem memory leaks

### 📱 Responsividade

- [ ] **Testar em dispositivos**
  - [ ] Desktop (1920x1080)
  - [ ] Tablet (768x1024)
  - [ ] Mobile (375x667)
  - [ ] Mobile landscape

- [ ] **Testar em navegadores**
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari
  - [ ] Mobile Safari

### 🔗 Edge Functions

- [ ] **Todas as functions deployadas**
  ```bash
  supabase functions list
  ```

- [ ] **Secrets configurados**
  ```bash
  supabase secrets list
  ```

- [ ] **Logs limpos (sem erros)**
  - Dashboard > Functions > Logs

- [ ] **Rate limits adequados**
  - [ ] CORS configurado
  - [ ] Timeout configurado
  - [ ] Error handling implementado

---

## 🚀 Deploy

### 1. Commit e Push

```bash
# Commit final
git add .
git commit -m "chore: preparar para deploy em produção

- Atualizar secrets
- Corrigir configurações de auth
- Otimizar performance
- Adicionar documentação de segurança
"

# Push para main
git push origin main
```

### 2. Verificar Build

- [ ] Build automático iniciado
- [ ] Build sem erros
- [ ] Preview URL funcional

### 3. Validação Pós-Deploy

- [ ] Site carregando corretamente
- [ ] Login funcionando
- [ ] Conversas sendo criadas
- [ ] IA respondendo
- [ ] Nenhum erro no console

---

## 📊 Monitoramento Pós-Deploy

### Primeiras 24 horas

- [ ] **Monitorar logs de erro**
  - Supabase Dashboard > Logs
  - Console do navegador (F12)

- [ ] **Verificar métricas**
  - [ ] Usuários ativos
  - [ ] Conversas criadas
  - [ ] Mensagens enviadas
  - [ ] Taxa de erro < 1%

- [ ] **Performance**
  - [ ] Response time < 500ms
  - [ ] Error rate < 1%
  - [ ] Uptime > 99.9%

### Primeiros 7 dias

- [ ] Coletar feedback de usuários
- [ ] Identificar bugs reportados
- [ ] Otimizar bottlenecks
- [ ] Revisar custos de API

---

## 🆘 Rollback (se necessário)

Se algo der errado:

```bash
# 1. Reverter para versão anterior
git revert HEAD
git push origin main

# 2. Ou fazer rollback no Vercel/Netlify
# Dashboard > Deployments > Previous deployment > Promote

# 3. Notificar usuários
# Colocar banner de manutenção se necessário
```

---

## 📝 Pós-Deploy

- [ ] **Atualizar documentação**
  - [ ] CHANGELOG.md
  - [ ] README.md
  - [ ] API docs

- [ ] **Notificar equipe**
  - [ ] Deploy bem-sucedido
  - [ ] Novas features disponíveis
  - [ ] Breaking changes (se houver)

- [ ] **Criar tag de release**
  ```bash
  git tag -a v1.0.0 -m "Release v1.0.0 - Deploy inicial"
  git push origin v1.0.0
  ```

- [ ] **Backup pós-deploy**
  - Backup do banco de dados
  - Backup das configurações
  - Documentar versões utilizadas

---

## ✅ Checklist Rápido (TL;DR)

```
[ ] Secrets removidos do git
[ ] Novas chaves criadas e no Supabase Secrets
[ ] Google OAuth configurado
[ ] RLS Policies validadas
[ ] Testes passando
[ ] Build sem erros
[ ] Deploy bem-sucedido
[ ] Monitoramento ativo
```

---

**Última atualização:** 2025-10-02  
**Próxima revisão:** Após primeiro deploy
