#!/bin/bash

# 🧹 Script de Limpeza do Histórico do Git
# Remove secrets expostos do histórico completo do repositório
# ⚠️ AVISO: Este script reescreve o histórico do git - use com cuidado!

set -e

echo "🔐 Script de Limpeza de Secrets do Git"
echo "======================================"
echo ""
echo "⚠️  AVISO: Este script irá REESCREVER o histórico do git!"
echo "⚠️  Isso é IRREVERSÍVEL e afetará todos os commits."
echo "⚠️  Coordene com sua equipe antes de prosseguir."
echo ""
read -p "Você tem certeza que deseja continuar? (digite 'yes' para confirmar): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operação cancelada."
    exit 1
fi

# 1. Verificar se estamos em um repositório git
if [ ! -d .git ]; then
    echo "❌ Erro: Não é um repositório git!"
    exit 1
fi

# 2. Criar backup
echo ""
echo "📦 Criando backup do repositório..."
BACKUP_DIR="../$(basename "$PWD")-backup-$(date +%Y%m%d-%H%M%S)"
cp -r . "$BACKUP_DIR"
echo "✅ Backup criado em: $BACKUP_DIR"

# 3. Verificar se git-filter-repo está instalado
if ! command -v git-filter-repo &> /dev/null; then
    echo ""
    echo "❌ git-filter-repo não está instalado!"
    echo ""
    echo "Instale com:"
    echo "  Ubuntu/Debian: sudo apt install git-filter-repo"
    echo "  macOS: brew install git-filter-repo"
    echo "  Windows: Baixe de https://github.com/newren/git-filter-repo"
    exit 1
fi

# 4. Criar arquivo de substituição
echo ""
echo "📝 Criando arquivo de substituições..."
cat > /tmp/git-replacements.txt << 'EOF'
# OpenAI Keys
sk-proj-33WoDfHqIlab3FZOE3bptudWbGE==>REMOVED_OPENAI_KEY_1
sk-proj-33WoDfqGd0Vz3G8ISUg6xS0yRK==>REMOVED_OPENAI_KEY_2

# Padrões genéricos
OPENAI_API_KEY=sk-.*==>OPENAI_API_KEY=REMOVED_FROM_HISTORY
sk-proj-***REMOVED***
sk-***REMOVED***

# Outros secrets (adicione conforme necessário)
# SUPABASE_SERVICE_ROLE_KEY=***REMOVED***
# RESEND_API_KEY=***REMOVED***
EOF

echo "✅ Arquivo de substituições criado"

# 5. Reescrever histórico
echo ""
echo "🔄 Reescrevendo histórico do git (isso pode demorar)..."
echo "   Removendo secrets de todos os commits..."

git filter-repo --replace-text /tmp/git-replacements.txt --force

echo "✅ Histórico reescrito com sucesso!"

# 6. Limpar arquivo temporário
rm /tmp/git-replacements.txt

# 7. Verificar se ainda há secrets
echo ""
echo "🔍 Verificando se ainda há secrets no repositório..."
if git log --all -S 'sk-proj-' > /dev/null 2>&1; then
    echo "⚠️  Atenção: Ainda há ocorrências de 'sk-proj-' no histórico."
    echo "   Verifique manualmente com: git log --all -S 'sk-proj-'"
else
    echo "✅ Nenhum secret detectado no histórico!"
fi

# 8. Instruções finais
echo ""
echo "✅ Limpeza concluída!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Revogue as chaves expostas no painel da OpenAI"
echo "  2. Crie novas chaves e adicione aos Supabase Secrets"
echo "  3. Teste o repositório localmente"
echo "  4. Force push para o remoto (coordenar com equipe!):"
echo "     git push origin --force --all"
echo "     git push origin --force --tags"
echo ""
echo "⚠️  Lembre-se: Force push afeta todos que têm o repositório clonado!"
echo "   Instrua a equipe para:"
echo "   1. Fazer backup das mudanças locais"
echo "   2. Clonar o repositório novamente: git clone <url>"
echo ""
echo "📦 Backup salvo em: $BACKUP_DIR"
