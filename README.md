# 🚀 O.R.I.O.N.X - Assistente de IA Inteligente

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-Ativo-brightgreen.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?logo=typescript)

> **Assistente de Inteligência Artificial avançado, desenvolvido em React + TypeScript com suporte a voz, câmera e análise semântica de documentos.**

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Recursos Principais](#recursos-principais)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Uso](#uso)
- [Desenvolvimento](#desenvolvimento)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## 🎯 Visão Geral

O.R.I.O.N.X é um assistente de IA pessoal multimodal criado para:

- 🤖 **Processamento inteligente** de texto, voz e imagens
- 🔐 **Privacidade em primeiro lugar** com conformidade LGPD
- 🚀 **Performance otimizada** com caching e PWA
- 📱 **Responsividade total** do desktop ao mobile
- 🎨 **Interface moderna** com animações fluidas

### Desenvolvido por

**Gabriel Mendes Lourenço** (18 anos)  
UNIDERP - Universidade para o Desenvolvimento do Estado e da Região do Pantanal

---

## ✨ Recursos Principais

### 1. **Chat Multimodal JARVIS**

- Conversas naturais com IA
- Suporte a entrada por voz (Speech-to-Text)
- Saída de áudio (Text-to-Speech)
- Análise de imagens em tempo real

### 2. **Dashboard Inteligente**

- Gestão de documentos PDF/TXT
- Busca semântica avançada com embeddings
- Análise de imagens com Computer Vision
- Histórico de conversas persistente

### 3. **Integração com Serviços**

- **Azure Cognitive Services** - IA e processamento
- **Supabase** - Backend e autenticação
- **N8N** - Automação de workflows
- **Groq** - LLM com latência ultra-baixa

### 4. **Segurança & Conformidade**

- Criptografia end-to-end
- Azure Key Vault para secrets
- Conformidade total com LGPD
- Rate limiting e proteção DDoS

### 5. **Progressive Web App (PWA)**

- Funciona offline com Service Workers
- Instalável em qualquer dispositivo
- Sincronização automática de dados
- Cache inteligente com Workbox

---

## 🏗️ Arquitetura

```
O.R.I.O.N.X
├── Frontend (React 18 + TypeScript)
│   ├── Components UI (Shadcn/UI + Radix)
│   ├── Hooks customizados
│   ├── Context API (Jarvis, Auth)
│   └── Integrations (APIs, Supabase)
│
├── Backend (Node.js + Express)
│   ├── Azure Key Vault Integration
│   ├── Gateway N8N
│   └── Python ML Service
│
├── Database (Supabase PostgreSQL)
│   ├── Conversas & Mensagens
│   ├── Documentos & Embeddings
│   └── Perfil & Preferências
│
└── Infrastructure (Azure + Capacitor)
    ├── Cloud Functions (Azure)
    ├── Storage (Blob Storage)
    └── Native Builds (iOS/Android)
```

### Stack Tecnológico

| Camada        | Tecnologia                             |
| ------------- | -------------------------------------- |
| **Frontend**  | React 18, TypeScript, Vite             |
| **UI/UX**     | Tailwind CSS, Shadcn/UI, Framer Motion |
| **State**     | Zustand, TanStack Query                |
| **Backend**   | Node.js, Express, Python Django        |
| **Database**  | Supabase PostgreSQL, pgvector          |
| **IA/ML**     | Azure OpenAI, Groq, Computer Vision    |
| **Automação** | N8N, Webhooks                          |
| **Mobile**    | Capacitor, React Native                |

---

## 📦 Instalação

### Pré-requisitos

- **Node.js** 18+ (ou Bun)
- **npm**, **yarn** ou **bun**
- Chaves de API: Azure, Supabase, Groq

### Passos

```bash
# 1. Clonar repositório
git clone https://github.com/usuario/orion.git
cd orion

# 2. Instalar dependências
npm install
# ou
bun install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas chaves

# 4. Executar em desenvolvimento
npm run dev

# 5. Abrir navegador
# http://localhost:8080
```

### Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Azure
VITE_AZURE_ENDPOINT=https://xxx.openai.azure.com/
VITE_AZURE_API_KEY=xxx

# Groq
VITE_GROQ_API_KEY=gsk_xxx

# Key Vault
KEYVAULT_URL=https://vault-xxx.vault.azure.net/
```

---

## 🚀 Uso

### Iniciar Chat JARVIS

```bash
npm run dev
# Acessar http://localhost:8080
```

### Build para Produção

```bash
# Build otimizado
npm run build

# Pré-visualizar
npm run preview

# Build em modo desenvolvimento
npm run build:dev
```

### Lint e Testes

```bash
# Verificar código
npm run lint

# Executar testes
npm run test

# Watch mode
npm run test:watch
```

### Build Mobile (Capacitor)

```bash
# iOS
npx cap build ios

# Android
npx cap build android
```

---

## 💻 Desenvolvimento

### Estrutura de Pastas

```
src/
├── components/          # Componentes React
│   ├── chat/           # Componentes de chat
│   └── ui/             # Componentes de UI (Shadcn)
├── contexts/           # Context API (Auth, Jarvis)
├── hooks/              # Hooks customizados
├── integrations/       # Integrações com APIs
├── lib/                # Utilitários e helpers
├── pages/              # Páginas/rotas
├── types/              # Tipos TypeScript
└── utils/              # Funções utilitárias
```

### Executar em Desenvolvimento

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 (opcional) - Backend Node
npm run dev:backend

# Terminal 3 (opcional) - Python ML
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Debugging

```bash
# Ativar logs detalhados
export DEBUG=orion:*

# DevTools do Chrome
# F12 ou Ctrl+Shift+I
```

### Commit Conventions

Seguir padrão Conventional Commits:

```bash
git commit -m "feat(chat): add voice input functionality"
git commit -m "fix(auth): resolve login timeout issue"
git commit -m "docs(readme): update installation steps"
git commit -m "perf(dashboard): optimize document loading"
```

---

## 🤝 Contribuição

Gostaríamos da sua contribuição! Por favor, siga estas etapas:

1. **Fork o projeto**

   ```bash
   git clone https://github.com/seu-usuario/orion.git
   ```

2. **Crie uma branch feature**

   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

3. **Commit suas mudanças**

   ```bash
   git commit -m "feat: adicionar nova funcionalidade"
   ```

4. **Push para a branch**

   ```bash
   git push origin feature/nova-funcionalidade
   ```

5. **Abra um Pull Request**

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para mais detalhes.

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

## 📞 Contato & Suporte

- **Desenvolvedor:** Gabriel Mendes Lourenço
- **Email:** gabriel@example.com
- **GitHub:** [@seu-usuario](https://github.com/seu-usuario)
- **LinkedIn:** [Gabriel Mendes](https://linkedin.com/in/seu-usuario)

### Issues & Sugestões

- 🐛 [Reportar Bug](https://github.com/usuario/orion/issues)
- 💡 [Sugerir Feature](https://github.com/usuario/discussions)
- 📧 Entre em contato diretamente

---

## 🙏 Agradecimentos

- Comunidade React & TypeScript
- Azure, Supabase, Groq
- Todos os contribuidores
- Professores da UNIDERP

---

## 📊 Status do Projeto

- [x] MVP Funcional
- [x] Integração IA Completa
- [x] Responsividade Mobile
- [ ] Testes Automatizados (em progresso)
- [ ] Documentação API (planejado)
- [ ] Dashboard Admin (planejado)

---

<div align="center">

**Desenvolvido com ❤️ por Gabriel Mendes**

_Last updated: 29/01/2026 | v1.0.0_

</div>
