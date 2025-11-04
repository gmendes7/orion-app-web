# ⚡ Quickstart - Orion Native Apps

## 🎯 Setup em 5 Minutos

### 1️⃣ Clone e Instale (Local)

```bash
# Exportar do Lovable → GitHub
# Depois clonar:
git clone https://github.com/SEU-USUARIO/orion.git
cd orion

# Instalar dependências
npm install
```

### 2️⃣ Testar Localmente

```bash
# Rodar versão web
npm run dev

# Abrir: http://localhost:8080
```

---

## 📱 Testar no Android (Via Hot-Reload)

**Pré-requisito**: Android Studio instalado

```bash
# Build web
npm run build

# Adicionar plataforma Android
npx cap add android

# Sincronizar
npx cap sync android

# Abrir no Android Studio
npx cap open android

# No Android Studio:
# 1. Conectar dispositivo USB ou iniciar emulador
# 2. Clicar em "Run" (▶️)
# 3. App abrirá conectado ao seu localhost via hot-reload!
```

**Benefício**: Qualquer mudança no código aparece instantaneamente no celular 🔥

---

## 🖥️ Testar Desktop (Tauri)

**Pré-requisito**: Rust instalado

### Instalar Rust

```bash
# Windows
# Baixar e executar: https://win.rustup.rs/

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Rodar Tauri Dev

```bash
# Instalar Tauri CLI
npm install --save-dev @tauri-apps/cli

# Inicializar (apenas primeira vez)
npx tauri init

# Durante o init, responder:
# - App name: Orion Intelligence
# - Window title: Orion Intelligence  
# - Web assets: ../dist
# - Dev server: http://localhost:8080
# - Dev command: npm run dev
# - Build command: npm run build

# Rodar desktop app
npm run tauri dev
```

Janela desktop nativa abrirá com o app! 🚀

---

## 🚀 Build de Produção

### Android (APK para testes)

```bash
# Build web
npm run build

# Sync com Android
npx cap sync android

# Abrir Android Studio
npx cap open android

# No Android Studio:
# Build → Build Bundle(s) / APK(s) → Build APK(s)
# APK gerado em: android/app/build/outputs/apk/debug/
```

### Desktop (Executável)

```bash
# Build Tauri
npm run tauri build

# Instaladores em: src-tauri/target/release/bundle/
# Windows: .msi
# macOS: .dmg
# Linux: .deb, .AppImage
```

---

## 📦 Estrutura do Projeto

```
orion/
├── src/                    # React app (web + mobile)
├── supabase/              # Backend (Edge Functions)
├── docs/                  # Documentação completa
│   ├── QUICKSTART_NATIVE.md       ← Você está aqui
│   ├── MOBILE_DEPLOYMENT.md       ← Guia completo Android
│   └── TAURI_DESKTOP_GUIDE.md     ← Guia completo Desktop
├── capacitor.config.ts    # Config mobile
├── src-tauri/            # Config desktop (após tauri init)
└── package.json
```

---

## 🔄 Workflow Recomendado

### Durante Desenvolvimento

1. **Desenvolver no Lovable** (rápido, visual)
2. **Exportar para GitHub** quando quiser testar nativo
3. **Git pull** local
4. **Testar no mobile/desktop** conforme necessário

### Para Releases

1. Desenvolver features no Lovable
2. Exportar para GitHub (tag: v1.0.0, v1.1.0...)
3. Rodar build de produção
4. Publicar nas stores

---

## ⚙️ Comandos Úteis

```bash
# Web
npm run dev          # Dev server
npm run build        # Build produção

# Mobile (Capacitor)
npx cap sync         # Sincronizar assets web → native
npx cap open android # Abrir Android Studio
npx cap open ios     # Abrir Xcode (macOS)

# Desktop (Tauri)
npm run tauri dev    # Rodar desktop em dev
npm run tauri build  # Build produção
```

---

## 🆘 Problemas Comuns

### "capacitor: command not found"
```bash
npm install -g @capacitor/cli
```

### "tauri: command not found"  
```bash
npm install --save-dev @tauri-apps/cli
```

### Android: "SDK not found"
- Baixar e instalar [Android Studio](https://developer.android.com/studio)
- Abrir Android Studio > Settings > Android SDK
- Instalar SDK Platform 33 (Android 13)

### Rust: "rustc: command not found"
```bash
# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Reiniciar terminal
source $HOME/.cargo/env
```

---

## 📚 Leitura Recomendada

### Essencial
- [`MOBILE_DEPLOYMENT.md`](./MOBILE_DEPLOYMENT.md) - Deploy completo Android + stores
- [`TAURI_DESKTOP_GUIDE.md`](./TAURI_DESKTOP_GUIDE.md) - Desktop com Tauri

### Avançado
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Tauri Docs](https://tauri.app/v1/guides/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 🎉 Próximos Passos

1. ✅ Setup local concluído
2. 📱 Testar no celular (hot-reload)
3. 🖥️ Testar desktop
4. 🎨 Customizar splash screen e ícones
5. 🚀 Preparar build de produção
6. 📦 Publicar nas stores

---

**Desenvolvido com 💙 por Gabriel Mendes Schjneider**

Dúvidas? Leia os guias completos em [`docs/`](.)
