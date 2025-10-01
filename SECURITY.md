# 🔐 Segurança e Conformidade LGPD

Este documento descreve as medidas de segurança implementadas no O.R.I.Ö.N e como o projeto está em conformidade com a LGPD.

## 📋 Índice
- [Medidas de Segurança](#medidas-de-segurança)
- [Conformidade LGPD](#conformidade-lgpd)
- [Dados Coletados](#dados-coletados)
- [Direitos do Titular](#direitos-do-titular)
- [Reportar Vulnerabilidades](#reportar-vulnerabilidades)

---

## 🛡️ Medidas de Segurança

### 1. Autenticação e Autorização

**✅ Implementado:**
- Autenticação via Supabase Auth
- Tokens JWT com renovação automática
- Sessões persistentes com localStorage
- Logout seguro com limpeza de tokens
- Row Level Security (RLS) no banco de dados

**Exemplo de RLS Policy:**
```sql
-- Usuários só podem ver suas próprias conversas
CREATE POLICY "Users can view their own conversations" 
ON conversations FOR SELECT 
USING (auth.uid() = user_id);
```

### 2. Criptografia

**✅ Implementado:**
- HTTPS/TLS para todas as comunicações
- Senhas criptografadas (bcrypt via Supabase)
- Tokens JWT assinados
- Comunicação segura com APIs externas

**❌ Não Implementado (mas recomendado para produção):**
- Criptografia end-to-end de mensagens
- Backup criptografado

### 3. Validação de Entrada

**✅ Implementado:**
- Validação de tipos TypeScript
- Sanitização de inputs do usuário
- Limites de tamanho de arquivo (10MB)
- Tipos de arquivo permitidos (imagens: png, jpg, webp)

**Exemplo:**
```typescript
const validateFile = (file: File): string | null => {
  if (!allowedTypes.includes(file.type)) {
    return "Tipo de arquivo não suportado";
  }
  if (file.size > maxSize * 1024 * 1024) {
    return "Arquivo muito grande";
  }
  return null;
};
```

### 4. Proteção contra Ataques

**✅ Medidas Implementadas:**
- CORS configurado adequadamente
- Rate limiting via Supabase
- Validação de tokens em todas as requisições
- Prevenção de SQL Injection (via ORM)
- XSS Protection (React escapa HTML automaticamente)

---

## 📜 Conformidade LGPD

O projeto está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).

### Princípios Seguidos

1. **✅ Finalidade**: Dados usados apenas para o propósito informado
2. **✅ Adequação**: Tratamento compatível com as finalidades
3. **✅ Necessidade**: Coleta limitada ao mínimo necessário
4. **✅ Transparência**: Informações claras sobre o tratamento
5. **✅ Segurança**: Medidas técnicas e administrativas adequadas
6. **✅ Prevenção**: Prevenção de danos
7. **✅ Não discriminação**: Sem tratamento discriminatório
8. **✅ Responsabilização**: Demonstração de conformidade

### Base Legal (Art. 7º)

O tratamento de dados é realizado com base em:

**I. Consentimento do titular** ✅
- Banner de consentimento na primeira visita
- Consentimento explícito e informado
- Opção de aceitar ou recusar
- Possibilidade de revogar a qualquer momento

**Implementação:**
```typescript
// Armazenamento de consentimento
localStorage.setItem('orion_privacy_consent', JSON.stringify({
  accepted: true,
  timestamp: new Date().toISOString(),
  version: '1.0'
}));
```

---

## 📊 Dados Coletados

### Dados de Cadastro
- ✅ Nome completo
- ✅ Email
- ✅ Senha (criptografada)

**Finalidade:** Autenticação e gerenciamento de conta

### Dados de Uso
- ✅ Histórico de conversas
- ✅ Documentos e imagens enviados
- ✅ Preferências (tema, configurações)
- ✅ Logs de acesso (segurança)

**Finalidade:** Fornecimento do serviço de IA e melhorias

### Dados NÃO Coletados
- ❌ Localização GPS
- ❌ Contatos do dispositivo
- ❌ Histórico de navegação externo
- ❌ Dados de terceiros

---

## 👤 Direitos do Titular

Conforme Art. 18 da LGPD, você tem direito a:

### 1. ✅ Confirmação e Acesso
**Como exercer:** Acesse as configurações da conta

### 2. ✅ Correção
**Como exercer:** Edite seus dados nas configurações

### 3. ✅ Anonimização ou Exclusão
**Como exercer:** 
```typescript
// Exclusão de conta e dados
// Disponível em: Configurações > Conta > Excluir Conta
// ⚠️ Ação irreversível - remove todos os dados em até 30 dias
```

### 4. ✅ Portabilidade
**Como exercer:** Solicite via email (formato JSON estruturado)

### 5. ✅ Revogação do Consentimento
**Como exercer:** Limpe o localStorage ou revogue nas configurações

### 6. ✅ Oposição
**Como exercer:** Entre em contato via email

**Prazo de resposta:** Até 15 dias úteis

---

## 🔍 Auditoria e Logs

### Logs de Segurança
```typescript
// Exemplo de log de acesso (apenas para segurança)
{
  event: "user_login",
  user_id: "uuid",
  timestamp: "2025-10-01T10:00:00Z",
  ip: "hash_do_ip", // IP hasheado para privacidade
  success: true
}
```

**Retenção:** 90 dias (apenas para segurança)

### Monitoramento
- ✅ Logs de erros (sem dados sensíveis)
- ✅ Performance monitoring
- ✅ Tentativas de acesso indevido

---

## 🚨 Reportar Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança:

### NÃO Faça:
- ❌ Publicar a vulnerabilidade publicamente
- ❌ Explorar a vulnerabilidade além do necessário para demonstrá-la
- ❌ Acessar, modificar ou deletar dados de terceiros

### Faça:
1. ✅ Envie um email para: [seu-email-seguranca@exemplo.com]
2. ✅ Inclua:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestão de correção (se possível)

### Compromisso:
- ⏱️ Resposta inicial: 48 horas
- 🔧 Correção crítica: 7 dias
- 🎁 Reconhecimento público (se desejar)

---

## 📝 Política de Retenção

### Dados de Conta
- **Durante conta ativa:** Armazenado indefinidamente
- **Após exclusão:** 30 dias (backup) → Exclusão permanente

### Conversas e Mensagens
- **Durante conta ativa:** Armazenado indefinidamente
- **Após exclusão:** Removido imediatamente

### Logs de Segurança
- **Retenção:** 90 dias
- **Após período:** Exclusão automática

---

## 🔄 Atualizações de Segurança

**Última revisão:** 01 de Outubro de 2025  
**Versão:** 1.0  
**Próxima revisão prevista:** Janeiro de 2026

### Histórico de Atualizações
- **v1.0 (Out/2025):** Implementação inicial LGPD completa

---

## 📧 Contato

**Desenvolvedor:** Gabriel Mendes  
**Email Segurança:** [seu-email-seguranca@exemplo.com]  
**Email Geral:** [seu-email@exemplo.com]

---

**Última atualização:** 01 de Outubro de 2025
