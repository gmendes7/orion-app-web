# 📱 Guia de Deploy Mobile - Orion Intelligence

## 🎯 Visão Geral

Este guia cobre o processo completo de build e publicação do **Orion** para **Android** e **Desktop** (Windows, macOS, Linux).

### Opções de Deploy

#### **Opção 1: PWA + TWA (Recomendada para MVP)**
- ✅ Mais rápida para publicar
- ✅ Atualização automática via web
- ✅ Menor complexidade técnica
- ⚠️ Algumas limitações de APIs nativas

#### **Opção 2: Capacitor (App Nativo Completo)**
- ✅ Acesso total a APIs nativas
- ✅ Performance superior
- ✅ Experiência 100% nativa
- ⚠️ Requer setup mais complexo

---

## 🚀 Setup Inicial

### 1. Pré-requisitos

```bash
# Node.js 18+ e npm
node --version  # v18+
npm --version   # 9+

# Git
git --version

# Android Studio (para builds Android)
# Xcode (para builds iOS - apenas macOS)
```

### 2. Clonar e Instalar Dependências

```bash
# Exportar projeto do Lovable para GitHub
# Depois clonar localmente:
git clone <seu-repo-orion>
cd orion

# Instalar dependências
npm install
```

### 3. Configurar Capacitor

```bash
# Inicializar Capacitor (já configurado via capacitor.config.ts)
# Adicionar plataformas
npx cap add android
# npx cap add ios  # Se tiver macOS

# Build da aplicação web
npm run build

# Sincronizar com plataformas nativas
npx cap sync
```

---

## 🤖 Android - Build e Publicação

### Passo 1: Configuração de Produção

Editar `capacitor.config.ts` e **comentar** a seção `server`:

```typescript
// Para PRODUÇÃO, comente isso:
/*
server: {
  url: 'https://746200be-ef3c-4fc0-8a6d-1f8297e609fe.lovableproject.com?forceHideBadge=true',
  cleartext: true
},
*/
```

### Passo 2: Build da App Web

```bash
npm run build
npx cap sync android
```

### Passo 3: Abrir no Android Studio

```bash
npx cap open android
```

### Passo 4: Criar Keystore (Primeira vez)

```bash
# Gerar keystore para assinatura
keytool -genkey -v -keystore orion-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias orion-key

# Guardar MUITO BEM:
# - Senha da keystore
# - Senha do alias
# - Caminho do arquivo .jks
```

⚠️ **IMPORTANTE**: Guarde o keystore em local seguro! Sem ele, você não poderá atualizar o app na Play Store.

### Passo 5: Configurar Build Release

Editar `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../orion-release-key.jks')
            storePassword 'SUA_SENHA_KEYSTORE'
            keyAlias 'orion-key'
            keyPassword 'SUA_SENHA_ALIAS'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Passo 6: Gerar AAB para Play Store

No Android Studio:
1. `Build → Generate Signed Bundle / APK`
2. Escolher `Android App Bundle (AAB)`
3. Selecionar keystore
4. Build Type: `release`
5. Gerar AAB

Ou via linha de comando:

```bash
cd android
./gradlew bundleRelease
# AAB gerado em: android/app/build/outputs/bundle/release/app-release.aab
```

### Passo 7: Upload para Google Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Criar novo app "Orion Intelligence"
3. Preencher informações:
   - **Nome**: Orion Intelligence Assistant
   - **Descrição Curta**: IA avançada desenvolvida por Gabriel Mendes Schjneider
   - **Descrição Completa**: (Use o texto da biografia + features)
   - **Categoria**: Produtividade
   - **Idade**: 3+ (Everyone)
4. Upload de assets:
   - Ícone (512x512px)
   - Feature graphic (1024x500px)
   - Screenshots (pelo menos 2, max 8)
   - Video promocional (opcional)
5. Upload do AAB
6. Preencher política de privacidade
7. Enviar para revisão

---

## 🖥️ Desktop - Build com Tauri

### Por que Tauri?
- ✅ Binários 10x menores que Electron
- ✅ Usa WebView nativo do sistema
- ✅ Segurança superior
- ✅ Auto-updater integrado

### Passo 1: Instalar Rust

```bash
# Windows
# Download de: https://rustup.rs/

# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Passo 2: Instalar Tauri CLI

```bash
npm install --save-dev @tauri-apps/cli
```

### Passo 3: Configurar Tauri

Criar `src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:8080",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Orion Intelligence",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "window": {
        "all": false,
        "close": true,
        "hide": true,
        "show": true,
        "maximize": true,
        "minimize": true,
        "unmaximize": true,
        "unminimize": true,
        "startDragging": true
      }
    },
    "bundle": {
      "active": true,
      "category": "Productivity",
      "copyright": "© 2025 Gabriel Mendes Schjneider",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "identifier": "app.orion.intelligence",
      "longDescription": "Advanced AI Assistant powered by Gabriel Mendes Schjneider",
      "macOS": {
        "entitlements": null,
        "minimumSystemVersion": "10.13"
      },
      "resources": [],
      "shortDescription": "Orion AI Assistant",
      "targets": "all",
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    },
    "security": {
      "csp": null
    },
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/<seu-usuario>/orion/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "SEU_PUBLIC_KEY_AQUI"
    },
    "windows": [
      {
        "fullscreen": false,
        "height": 800,
        "resizable": true,
        "title": "Orion Intelligence",
        "width": 1200,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

### Passo 4: Build para Todas as Plataformas

```bash
# Windows (gera .msi e .exe)
npm run tauri build

# macOS (gera .dmg e .app)
npm run tauri build

# Linux (gera .deb, .AppImage, .rpm)
npm run tauri build
```

Instaladores gerados em: `src-tauri/target/release/bundle/`

### Passo 5: Distribuição Desktop

**Opção A: GitHub Releases**
```bash
# Criar release no GitHub com instaladores
gh release create v1.0.0 \
  src-tauri/target/release/bundle/msi/*.msi \
  src-tauri/target/release/bundle/dmg/*.dmg \
  src-tauri/target/release/bundle/appimage/*.AppImage \
  --title "Orion v1.0.0" \
  --notes "Primeiro lançamento público"
```

**Opção B: Microsoft Store (Windows)**
- Criar conta de desenvolvedor
- Empacotar como MSIX
- Submeter via Partner Center

**Opção C: Mac App Store**
- Apple Developer Account necessário
- Code signing obrigatório
- Processo de revisão Apple

---

## 🔄 CI/CD Automático

### GitHub Actions (`.github/workflows/build.yml`)

```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build web
        run: npm run build
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      
      - name: Build AAB
        run: |
          npx cap sync android
          cd android
          ./gradlew bundleRelease
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      
      - name: Upload AAB
        uses: actions/upload-artifact@v3
        with:
          name: orion-android
          path: android/app/build/outputs/bundle/release/*.aab

  build-desktop:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Tauri
        run: npm run tauri build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: orion-${{ matrix.os }}
          path: src-tauri/target/release/bundle/
```

---

## 📊 Monitoramento e Analytics

### Recomendações de Ferramentas

1. **Crash Reporting**: [Sentry](https://sentry.io)
   ```bash
   npm install @sentry/capacitor @sentry/react
   ```

2. **Analytics**: [Mixpanel](https://mixpanel.com) ou [Amplitude](https://amplitude.com)
   ```bash
   npm install mixpanel-browser
   ```

3. **Performance**: Firebase Performance Monitoring

---

## ✅ Checklist Pré-Publicação

### Android
- [ ] Testado em 3+ dispositivos diferentes
- [ ] Testado em Android 8.0+ (API 26+)
- [ ] Splash screen funcionando
- [ ] Ícones em todas as resoluções
- [ ] Política de privacidade publicada
- [ ] Termos de serviço publicados
- [ ] Screenshots de alta qualidade
- [ ] Descrição otimizada para SEO
- [ ] Keystore guardado em local seguro
- [ ] Versão de produção testada (não debug)

### Desktop
- [ ] Testado em Windows 10/11
- [ ] Testado em macOS 11+
- [ ] Testado em Ubuntu/Debian
- [ ] Auto-updater configurado
- [ ] Instaladores assinados (quando possível)
- [ ] Permissões mínimas solicitadas
- [ ] Ícones em todas as resoluções
- [ ] Changelog documentado

---

## 🆘 Troubleshooting

### Erro: "App not installed"
```bash
# Limpar build anterior
npx cap sync android --force
cd android && ./gradlew clean
```

### Erro: Signature mismatch
- Você tentou instalar com keystore diferente
- Desinstale a versão anterior completamente

### Erro: Tauri build falha
```bash
# Limpar cache Rust
cargo clean
# Atualizar Rust
rustup update
```

### Performance ruim no Android
- Ativar ProGuard (minificação)
- Reduzir tamanho de imagens
- Lazy-load de componentes pesados

---

## 📚 Recursos Adicionais

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Tauri Docs](https://tauri.app/v1/guides/)
- [Android Publishing Guide](https://developer.android.com/studio/publish)
- [Google Play Console](https://play.google.com/console)

---

## 🎉 Próximos Passos

1. **Versão Beta**: Liberar para testadores via Play Store Beta
2. **Feedback Loop**: Coletar feedback e corrigir bugs
3. **Marketing**: Criar landing page, posts, press kit
4. **Otimização ASO**: App Store Optimization para descoberta
5. **iOS Version**: Expandir para iPhone/iPad
6. **Updates**: Manter ciclo de updates mensais

---

**Desenvolvido com 💙 por Gabriel Mendes Schjneider**
