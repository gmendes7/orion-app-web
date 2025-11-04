# 🖥️ Guia Completo Tauri - Orion Desktop

## 🎯 Por que Tauri?

| Feature | Tauri | Electron |
|---------|-------|----------|
| **Bundle Size** | ~3-5 MB | ~80-150 MB |
| **Memory** | ~50-100 MB | ~200-500 MB |
| **Startup** | Instantâneo | 2-5s |
| **Segurança** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Auto-Update** | ✅ Integrado | ✅ Via plugin |
| **Native APIs** | Rust FFI | Node C++ |

**Tauri é a escolha ideal para Orion** porque:
- Aplicação leve e rápida
- WebView nativo = sem bundle Chromium
- Segurança superior (sandbox Rust)
- Desenvolvimento com React (sem rewrite)

---

## 🚀 Setup Inicial

### 1. Instalar Rust

#### Windows
```powershell
# Download e execute o instalador:
# https://win.rustup.rs/

# Adicionar ao PATH manualmente ou reiniciar terminal
refreshenv

# Verificar instalação
rustc --version
cargo --version
```

#### macOS
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Instalar Xcode Command Line Tools
xcode-select --install
```

#### Linux (Ubuntu/Debian)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Dependências necessárias
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### 2. Criar Projeto Tauri

```bash
# No diretório raiz do Orion
npm install --save-dev @tauri-apps/cli

# Inicializar Tauri
npx tauri init

# Responda as perguntas:
# What is your app name? → Orion Intelligence
# What should the window title be? → Orion Intelligence
# Where are your web assets located? → ../dist
# What is the url of your dev server? → http://localhost:8080
# What is your frontend dev command? → npm run dev
# What is your frontend build command? → npm run build
```

Isso criará a estrutura:
```
orion/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── icons/
│   └── src/
│       └── main.rs
├── src/          (React app existente)
└── package.json
```

---

## ⚙️ Configuração Avançada

### `src-tauri/tauri.conf.json` (Completo)

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/schema.json",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:8080",
    "distDir": "../dist",
    "withGlobalTauri": true
  },
  "package": {
    "productName": "Orion Intelligence",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "clipboard": {
        "all": false,
        "readText": true,
        "writeText": true
      },
      "dialog": {
        "all": false,
        "ask": true,
        "confirm": true,
        "message": true,
        "open": false,
        "save": false
      },
      "fs": {
        "all": false,
        "readFile": false,
        "writeFile": false,
        "createDir": false,
        "removeDir": false,
        "copyFile": false,
        "scope": []
      },
      "globalShortcut": {
        "all": true
      },
      "http": {
        "all": false,
        "request": true,
        "scope": [
          "https://wcwwqfiolxcluyuhmxxf.supabase.co/*",
          "https://api.openai.com/*"
        ]
      },
      "notification": {
        "all": true
      },
      "os": {
        "all": false
      },
      "path": {
        "all": false
      },
      "process": {
        "all": false,
        "exit": true,
        "relaunch": true,
        "relaunchDangerousAllowSymlinkMacos": false
      },
      "protocol": {
        "all": false,
        "asset": true,
        "assetScope": []
      },
      "shell": {
        "all": false,
        "execute": false,
        "open": true,
        "scope": []
      },
      "window": {
        "all": false,
        "center": true,
        "close": true,
        "create": false,
        "hide": true,
        "maximize": true,
        "minimize": true,
        "print": false,
        "requestUserAttention": true,
        "setAlwaysOnTop": true,
        "setDecorations": true,
        "setFocus": true,
        "setFullscreen": true,
        "setIcon": true,
        "setMaxSize": true,
        "setMinSize": true,
        "setPosition": true,
        "setResizable": true,
        "setSize": true,
        "setSkipTaskbar": false,
        "setTitle": true,
        "show": true,
        "startDragging": true,
        "unmaximize": true,
        "unminimize": true
      }
    },
    "bundle": {
      "active": true,
      "category": "Productivity",
      "copyright": "© 2025 Gabriel Mendes Schjneider. All rights reserved.",
      "deb": {
        "depends": []
      },
      "externalBin": [],
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "identifier": "app.orion.intelligence",
      "longDescription": "Orion Intelligence Assistant is an advanced AI-powered productivity tool developed by Gabriel Mendes Schjneider, a German prodigy recognized worldwide for winning numerous logic and computational intelligence championships. Access cutting-edge AI conversations, document analysis, semantic search, and intelligent automation.",
      "macOS": {
        "entitlements": null,
        "exceptionDomain": "",
        "frameworks": [],
        "minimumSystemVersion": "10.13",
        "providerShortName": null,
        "signingIdentity": null
      },
      "resources": [],
      "shortDescription": "Advanced AI Assistant by Gabriel Mendes Schjneider",
      "targets": "all",
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": "",
        "tsp": false,
        "wix": {
          "language": "en-US"
        },
        "nsis": {
          "displayLanguageSelector": false,
          "installerIcon": "icons/icon.ico",
          "installMode": "perMachine",
          "languages": ["en-US", "pt-BR"],
          "license": "../LICENSE"
        }
      }
    },
    "security": {
      "csp": "default-src 'self'; connect-src 'self' https://wcwwqfiolxcluyuhmxxf.supabase.co https://api.openai.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'"
    },
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/seu-usuario/orion/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "SUA_PUBLIC_KEY_AQUI_APOS_GERAR"
    },
    "windows": [
      {
        "title": "Orion Intelligence",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "center": true,
        "decorations": true,
        "transparent": false,
        "alwaysOnTop": false,
        "skipTaskbar": false,
        "fileDropEnabled": true
      }
    ],
    "systemTray": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true,
      "menuOnLeftClick": false
    }
  }
}
```

---

## 🎨 Customização da Interface

### Adicionar Custom Titlebar (Opcional)

Editar `src-tauri/tauri.conf.json`:
```json
{
  "windows": [{
    "decorations": false,  // Remove titlebar padrão
    "transparent": true
  }]
}
```

Depois criar componente React `TitleBar.tsx`:
```tsx
import { appWindow } from '@tauri-apps/api/window';

export const TitleBar = () => {
  return (
    <div 
      data-tauri-drag-region 
      className="h-8 bg-black flex items-center justify-between px-4"
    >
      <span className="text-sm font-semibold">Orion Intelligence</span>
      <div className="flex gap-2">
        <button onClick={() => appWindow.minimize()}>−</button>
        <button onClick={() => appWindow.toggleMaximize()}>□</button>
        <button onClick={() => appWindow.close()}>×</button>
      </div>
    </div>
  );
};
```

---

## 🔧 Comandos Rust (Backend Native)

### Criar comando customizado

Editar `src-tauri/src/main.rs`:

```rust
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::Manager;

// Comando para salvar configurações localmente
#[tauri::command]
fn save_settings(settings: String) -> Result<(), String> {
    // Lógica para salvar em arquivo local
    std::fs::write("settings.json", settings)
        .map_err(|e| e.to_string())
}

// Comando para atalho global
#[tauri::command]
async fn toggle_window(app: tauri::AppHandle) -> Result<(), String> {
    let window = app.get_window("main").ok_or("Window not found")?;
    
    if window.is_visible().unwrap_or(false) {
        window.hide().map_err(|e| e.to_string())?;
    } else {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_settings,
            toggle_window
        ])
        .setup(|app| {
            // Configurar atalho global (Ctrl+Shift+O)
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            
            app.global_shortcut().register("CmdOrCtrl+Shift+O", move |app, _shortcut| {
                // Toggle window visibility
                if let Some(window) = app.get_window("main") {
                    let _ = window.is_visible().map(|visible| {
                        if visible {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    });
                }
            })?;
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Usar comando no React:

```typescript
import { invoke } from '@tauri-apps/api/tauri';

// Salvar settings
await invoke('save_settings', { settings: JSON.stringify(data) });

// Toggle window
await invoke('toggle_window');
```

---

## 📦 Build e Distribuição

### Build Development (com logs)

```bash
npm run tauri dev
```

### Build Production

```bash
# Build otimizado
npm run tauri build

# Ou separado por plataforma:
npm run tauri build -- --target x86_64-pc-windows-msvc  # Windows
npm run tauri build -- --target x86_64-apple-darwin     # macOS Intel
npm run tauri build -- --target aarch64-apple-darwin    # macOS Apple Silicon
npm run tauri build -- --target x86_64-unknown-linux-gnu # Linux
```

Artefatos gerados:
```
src-tauri/target/release/bundle/
├── deb/         (Linux .deb)
├── appimage/    (Linux AppImage)
├── rpm/         (Linux RPM)
├── msi/         (Windows Installer)
├── nsis/        (Windows NSIS)
└── dmg/         (macOS Disk Image)
    └── macos/   (.app bundle)
```

---

## 🔄 Auto-Updater

### 1. Gerar Keypair

```bash
# Instalar Tauri CLI globalmente
npm install -g @tauri-apps/cli

# Gerar chave de assinatura
tauri signer generate -w ~/.tauri/orion.key
```

Isso gera:
- **Private key**: `~/.tauri/orion.key` (guardar secreto!)
- **Public key**: Será exibido no terminal (copiar para `tauri.conf.json`)

### 2. Configurar Public Key

Editar `src-tauri/tauri.conf.json`:
```json
{
  "tauri": {
    "updater": {
      "pubkey": "COLE_A_PUBLIC_KEY_AQUI"
    }
  }
}
```

### 3. Assinar Release

```bash
# Build com assinatura
npm run tauri build

# Gerar arquivo de manifest
tauri signer sign \
  ./src-tauri/target/release/bundle/msi/Orion*.msi \
  -k ~/.tauri/orion.key
```

### 4. Criar `latest.json` para GitHub Releases

```json
{
  "version": "1.0.0",
  "pub_date": "2025-01-15T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "SIGNATURE_GERADA_PELO_SIGNER",
      "url": "https://github.com/seu-usuario/orion/releases/download/v1.0.0/Orion_1.0.0_x64_en-US.msi"
    },
    "darwin-x86_64": {
      "signature": "SIGNATURE",
      "url": "https://github.com/seu-usuario/orion/releases/download/v1.0.0/Orion_1.0.0_x64.dmg"
    },
    "linux-x86_64": {
      "signature": "SIGNATURE",
      "url": "https://github.com/seu-usuario/orion/releases/download/v1.0.0/orion_1.0.0_amd64.AppImage"
    }
  }
}
```

### 5. Upload para GitHub Release

```bash
gh release create v1.0.0 \
  src-tauri/target/release/bundle/msi/*.msi \
  src-tauri/target/release/bundle/dmg/*.dmg \
  src-tauri/target/release/bundle/appimage/*.AppImage \
  latest.json \
  --title "Orion v1.0.0" \
  --notes "Primeiro lançamento público com auto-update"
```

---

## 🔒 Code Signing

### Windows

```bash
# Comprar certificado code signing (DigiCert, Sectigo)
# Importar para Windows Certificate Store

# Configurar em tauri.conf.json
{
  "tauri": {
    "bundle": {
      "windows": {
        "certificateThumbprint": "THUMBPRINT_DO_SEU_CERTIFICADO",
        "digestAlgorithm": "sha256",
        "timestampUrl": "http://timestamp.digicert.com"
      }
    }
  }
}
```

### macOS

```bash
# Necessário Apple Developer Account ($99/ano)

# Obter Developer ID Application Certificate
# Instalar em Keychain Access

# Build com assinatura automática
npm run tauri build

# Ou manual:
codesign --deep --force --verbose \
  --sign "Developer ID Application: Seu Nome (TEAM_ID)" \
  src-tauri/target/release/bundle/macos/Orion.app

# Notarização Apple (obrigatório para macOS 10.15+)
xcrun notarytool submit \
  src-tauri/target/release/bundle/dmg/Orion_1.0.0_x64.dmg \
  --apple-id seu-email@apple.com \
  --team-id TEAM_ID \
  --password APP_SPECIFIC_PASSWORD \
  --wait

# Staple do ticket de notarização
xcrun stapler staple src-tauri/target/release/bundle/dmg/Orion_1.0.0_x64.dmg
```

---

## 🎛️ Configurações Avançadas

### Adicionar System Tray

```rust
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent};
use tauri::Manager;

fn main() {
    // Menu do system tray
    let show = CustomMenuItem::new("show".to_string(), "Mostrar Orion");
    let hide = CustomMenuItem::new("hide".to_string(), "Ocultar");
    let quit = CustomMenuItem::new("quit".to_string(), "Sair");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    
    let system_tray = SystemTray::new().with_menu(tray_menu);
    
    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => {
                let window = app.get_window("main").unwrap();
                match id.as_str() {
                    "show" => {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                    "hide" => window.hide().unwrap(),
                    "quit" => std::process::exit(0),
                    _ => {}
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## ⚡ Otimizações de Performance

### `Cargo.toml` otimizado

```toml
[profile.release]
opt-level = "z"     # Otimiza para tamanho
lto = true          # Link-Time Optimization
codegen-units = 1   # Melhor otimização (build mais lento)
panic = "abort"     # Reduz tamanho binário
strip = true        # Remove símbolos debug
```

### Reduzir tamanho do bundle

```bash
# Instalar UPX (compressor de binário)
# Windows: choco install upx
# macOS: brew install upx
# Linux: apt install upx-ucl

# Comprimir após build
upx --best --lzma src-tauri/target/release/orion.exe

# Resultado: ~50% de redução
```

---

## 🆘 Troubleshooting

### Erro: `webkit2gtk` não encontrado (Linux)
```bash
sudo apt install libwebkit2gtk-4.0-dev
```

### Erro: Rust toolchain não encontrado
```bash
rustup default stable
rustup update
```

### Build lento demais
```toml
# Adicionar em Cargo.toml
[profile.dev]
opt-level = 1  # Otimização mínima em dev
```

### Hot-reload não funciona
```bash
# Limpar cache
rm -rf node_modules/.vite
npm run dev
```

---

## 📚 Recursos

- [Tauri Docs](https://tauri.app/v1/guides/)
- [Tauri API Reference](https://tauri.app/v1/api/js/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [Tauri Plugin System](https://tauri.app/v1/guides/building/plugins)

---

**Orion Desktop - Powered by Tauri & Rust 🦀**
