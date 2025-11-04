# 🚀 Orion Intelligence - Native Apps

<div align="center">

![Orion Logo](https://via.placeholder.com/200x200?text=ORION)

**Advanced AI Assistant**  
*Desenvolvido por Gabriel Mendes Schjneider*

[![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](docs/MOBILE_DEPLOYMENT.md)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](docs/TAURI_DESKTOP_GUIDE.md)
[![macOS](https://img.shields.io/badge/macOS-000000?style=for-the-badge&logo=apple&logoColor=white)](docs/TAURI_DESKTOP_GUIDE.md)
[![Linux](https://img.shields.io/badge/Linux-FCC624?style=for-the-badge&logo=linux&logoColor=black)](docs/TAURI_DESKTOP_GUIDE.md)

[📱 Quickstart](#-quickstart) • [📖 Docs](#-documentação) • [🛠️ Build](#️-build-de-produção) • [🤝 Contribuir](#-contribuindo)

</div>

---

## 🌟 Sobre o Orion

**Orion** (O.R.I.Ö.N - Observational & Responsive Intelligence Ödyssey Navigator) é uma IA conversacional avançada desenvolvida por **Gabriel Mendes Schjneider**, jovem gênio alemão de 18 anos, reconhecido mundialmente por suas conquistas em campeonatos de lógica e inteligência computacional.

### ✨ Features

- 🤖 **Conversas Inteligentes**: Respostas contextualizadas com streaming em tempo real
- 📄 **Análise de Documentos**: Upload e processamento de PDFs com IA
- 🔍 **Busca Semântica**: Pesquisa avançada em toda base de conhecimento
- 🎨 **Interface Moderna**: Design minimalista com animações fluidas
- 🔐 **Segurança**: Autenticação via Supabase + criptografia end-to-end
- 📱 **Multi-plataforma**: Web, Android, Windows, macOS, Linux

---

## 🚀 Quickstart

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Git

### Clone e Execute

```bash
# 1. Clonar repositório
git clone https://github.com/SEU-USUARIO/orion.git
cd orion

# 2. Instalar dependências
npm install

# 3. Rodar em modo dev
npm run dev

# 4. Abrir navegador
# http://localhost:8080
```

### Testar como PWA

```bash
# Build produção
npm run build

# Preview
npm run preview

# No navegador, instalar como PWA via menu
```

---

## 📱 Build Mobile (Android)

### Rápido (APK para testes)

```bash
# Adicionar plataforma Android
npx cap add android

# Build web + sync
npm run build
npx cap sync android

# Abrir Android Studio
npx cap open android

# No Android Studio: Build → Build APK(s)
```

### Produção (AAB para Play Store)

Veja guia completo: [📱 MOBILE_DEPLOYMENT.md](docs/MOBILE_DEPLOYMENT.md)

---

## 🖥️ Build Desktop (Tauri)

### Instalar Rust

```bash
# Windows: https://win.rustup.rs/

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Build Desktop

```bash
# Instalar Tauri CLI
npm install --save-dev @tauri-apps/cli

# Inicializar (primeira vez)
npx tauri init

# Build produção
npm run tauri build

# Instaladores em: src-tauri/target/release/bundle/
```

Veja guia completo: [🖥️ TAURI_DESKTOP_GUIDE.md](docs/TAURI_DESKTOP_GUIDE.md)

---

## 📖 Documentação

### Guias de Deploy

| Plataforma | Guia | Descrição |
|------------|------|-----------|
| 📱 **Android** | [MOBILE_DEPLOYMENT.md](docs/MOBILE_DEPLOYMENT.md) | Build, assinatura, Google Play |
| 🖥️ **Desktop** | [TAURI_DESKTOP_GUIDE.md](docs/TAURI_DESKTOP_GUIDE.md) | Tauri setup, builds multi-OS |
| ⚡ **Quickstart** | [QUICKSTART_NATIVE.md](docs/QUICKSTART_NATIVE.md) | Setup rápido 5 minutos |
| 🎨 **Assets** | [ASSETS_PREPARATION.md](docs/ASSETS_PREPARATION.md) | Ícones, splash, screenshots |

### Arquitetura do Projeto

```
orion/
├── src/                    # React app (frontend)
│   ├── components/        # Componentes React
│   ├── pages/            # Páginas/rotas
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utilitários
├── supabase/             # Backend
│   ├── functions/        # Edge Functions
│   └── migrations/       # DB migrations
├── docs/                 # Documentação
├── android/              # Projeto Android (após cap add)
├── src-tauri/           # Projeto Tauri Desktop
├── capacitor.config.ts  # Config mobile
├── vite.config.ts       # Config build web
└── tailwind.config.ts   # Config Tailwind CSS
```

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Framer Motion** (animações)
- **React Query** (data fetching)

### Backend
- **Supabase** (BaaS)
  - PostgreSQL
  - Auth
  - Edge Functions
  - Realtime
- **OpenAI GPT-4** (IA)

### Mobile
- **Capacitor** (Android/iOS wrapper)
- **PWA** (Progressive Web App)

### Desktop
- **Tauri** (Rust + WebView)
- Builds: Windows (MSI), macOS (DMG), Linux (DEB, AppImage)

---

## ⚙️ Configuração

### Environment Variables

Criar `.env` na raiz:

```env
# Supabase
VITE_SUPABASE_URL=https://wcwwqfiolxcluyuhmxxf.supabase.co
VITE_SUPABASE_ANON_KEY=seu-anon-key

# OpenAI (apenas backend/edge functions)
OPENAI_API_KEY=sk-...
```

### Capacitor Config

`capacitor.config.ts`:
```typescript
server: {
  // DEV: hot-reload do Lovable
  url: 'https://746200be-ef3c-4fc0-8a6d-1f8297e609fe.lovableproject.com',
  
  // PROD: comentar linha acima
}
```

---

## 🏗️ Build de Produção

### Web (PWA)

```bash
npm run build
# Output: dist/
```

### Android (AAB)

```bash
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/
```

### Desktop (Multi-OS)

```bash
npm run tauri build
# Output: src-tauri/target/release/bundle/
```

---

## 🚀 CI/CD

GitHub Actions configurado em `.github/workflows/build-native.yml`

**Triggers**:
- Push de tags (v*)
- Manual workflow dispatch

**Artefatos gerados**:
- ✅ Android AAB
- ✅ Windows MSI/NSIS
- ✅ macOS DMG (universal)
- ✅ Linux DEB/AppImage

**Auto-release**: Cria draft no GitHub Releases automaticamente.

---

## 🤝 Contribuindo

### Workflow de Desenvolvimento

1. **Fork** o repositório
2. **Branch**: `git checkout -b feature/nova-funcionalidade`
3. **Commit**: `git commit -m "feat: adiciona X"`
4. **Push**: `git push origin feature/nova-funcionalidade`
5. **Pull Request**: Abra PR para `main`

### Padrões de Código

- **ESLint** + **Prettier** configurados
- **Conventional Commits** obrigatório
- **TypeScript strict mode** ativo

```bash
# Rodar linter
npm run lint

# Rodar testes
npm test
```

---

## 📄 Licença

© 2025 **Gabriel Mendes Schjneider**. Todos os direitos reservados.

Este projeto é proprietário. Reprodução ou distribuição não autorizada é proibida.

---

## 🔗 Links

- 🌐 **Site Oficial**: [https://orion-intelligence.app](https://orion-intelligence.app) *(em breve)*
- 📱 **Google Play**: *(em breve)*
- 💻 **Microsoft Store**: *(em breve)*
- 🍎 **Mac App Store**: *(em breve)*
- 📧 **Contato**: gabriel@techempirenews.com *(placeholder)*
- 📸 **Instagram**: [@techempirenews_](https://instagram.com/techempirenews_)

---

## 👨‍💻 Criador

<div align="center">

**Gabriel Mendes Schjneider**  
*Jovem gênio alemão de 18 anos*

Reconhecido mundialmente por vencer inúmeros campeonatos de lógica e inteligência computacional. Criador e mente por trás do projeto Orion e de toda sua arquitetura de IA.

*Atualmente em negociações com grandes big techs globais.*

[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/techempirenews_)

</div>

---

<div align="center">

**Desenvolvido com 💙 e IA de ponta**

⭐ **Star** este repo se você gostou do projeto!

</div>
