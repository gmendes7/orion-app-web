#!/bin/bash

# 🪝 Script de Configuração de Git Hooks
# Instala pre-commit hooks para detectar secrets antes do commit

set -e

echo "🪝 Configurando Git Hooks para Segurança"
echo "========================================"
echo ""

# 1. Verificar se estamos em um repositório git
if [ ! -d .git ]; then
    echo "❌ Erro: Não é um repositório git!"
    exit 1
fi

# 2. Verificar/instalar detect-secrets
echo "📦 Verificando detect-secrets..."
if ! command -v detect-secrets &> /dev/null; then
    echo "⚙️  Instalando detect-secrets..."
    
    if command -v pip &> /dev/null; then
        pip install detect-secrets
    elif command -v pip3 &> /dev/null; then
        pip3 install detect-secrets
    else
        echo "❌ Erro: pip não encontrado!"
        echo "   Instale Python e pip primeiro: https://www.python.org/downloads/"
        exit 1
    fi
fi

echo "✅ detect-secrets instalado"

# 3. Criar baseline de secrets conhecidos
echo ""
echo "🔍 Criando baseline de secrets conhecidos..."
detect-secrets scan > .secrets.baseline 2>/dev/null || true
echo "✅ Baseline criado em .secrets.baseline"

# 4. Criar pre-commit hook
echo ""
echo "📝 Criando pre-commit hook..."

mkdir -p .git/hooks

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# 🔐 Pre-commit Hook - Detecta Secrets
# Previne commits com secrets expostos

echo "🔍 Verificando secrets antes do commit..."

# Executar detect-secrets
if ! detect-secrets-hook --baseline .secrets.baseline $(git diff --cached --name-only); then
    echo ""
    echo "❌ COMMIT BLOQUEADO!"
    echo "   Secrets detectados nos arquivos modificados."
    echo ""
    echo "📋 Ações recomendadas:"
    echo "  1. Remova os secrets dos arquivos"
    echo "  2. Use variáveis de ambiente (.env)"
    echo "  3. Adicione secrets ao Supabase Secrets"
    echo "  4. Se for um falso positivo, atualize .secrets.baseline"
    echo ""
    echo "Para atualizar baseline (apenas se tiver certeza):"
    echo "  detect-secrets scan --update .secrets.baseline"
    echo ""
    exit 1
fi

echo "✅ Nenhum secret detectado - prosseguindo com commit"
exit 0
EOF

chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook instalado em .git/hooks/pre-commit"

# 5. Criar commit-msg hook para mensagens padronizadas
echo ""
echo "📝 Criando commit-msg hook..."

cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# 📝 Commit Message Hook
# Valida formato de mensagens de commit

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Verificar se a mensagem está vazia
if [ -z "$COMMIT_MSG" ]; then
    echo "❌ Mensagem de commit vazia!"
    exit 1
fi

# Verificar se contém secrets (palavras-chave suspeitas)
if echo "$COMMIT_MSG" | grep -qiE "password|secret|key|token|api.*key"; then
    echo ""
    echo "⚠️  Aviso: Mensagem de commit contém palavras suspeitas!"
    echo "   Certifique-se de não expor secrets na mensagem."
    echo ""
    read -p "Continuar mesmo assim? (s/N): " confirm
    if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
        echo "❌ Commit cancelado"
        exit 1
    fi
fi

exit 0
EOF

chmod +x .git/hooks/commit-msg

echo "✅ Commit-msg hook instalado em .git/hooks/commit-msg"

# 6. Testar hooks
echo ""
echo "🧪 Testando configuração..."
if [ -f .git/hooks/pre-commit ] && [ -x .git/hooks/pre-commit ]; then
    echo "✅ Pre-commit hook está funcional"
else
    echo "❌ Erro ao instalar pre-commit hook"
    exit 1
fi

# 7. Instruções finais
echo ""
echo "✅ Git hooks configurados com sucesso!"
echo ""
echo "📋 Hooks instalados:"
echo "  • pre-commit: Detecta secrets antes do commit"
echo "  • commit-msg: Valida mensagens de commit"
echo ""
echo "🔒 Proteções ativas:"
echo "  • Scan automático de secrets"
echo "  • Bloqueio de commits com secrets"
echo "  • Validação de mensagens de commit"
echo ""
echo "💡 Dica: Para bypass manual (use com cautela):"
echo "   git commit --no-verify -m 'mensagem'"
echo ""
