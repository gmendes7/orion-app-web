# 🎨 Preparação de Assets - Orion Native

## 📱 Ícones Necessários

### PWA (Web App Installable)
Colocar em `public/`:
- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)
- `favicon.ico` (32x32px)

### Android (Capacitor)
Executar após ter ícones:
```bash
# Gerar automaticamente todos os tamanhos
npm install -g @capacitor/assets
npx capacitor-assets generate --iconSource src/assets/icon.png --splashSource src/assets/splash.png
```

Ou manual em `android/app/src/main/res/`:
```
mipmap-mdpi/ic_launcher.png       (48x48)
mipmap-hdpi/ic_launcher.png       (72x72)
mipmap-xhdpi/ic_launcher.png      (96x96)
mipmap-xxhdpi/ic_launcher.png     (144x144)
mipmap-xxxhdpi/ic_launcher.png    (192x192)
```

### iOS (se implementar)
Similar ao Android, mas em `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Desktop (Tauri)
Colocar em `src-tauri/icons/`:
- `icon.png` (1024x1024px - alta resolução)
- `icon.ico` (Windows multi-size)
- `icon.icns` (macOS)
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.png`

**Ferramenta recomendada**: [png2icons](https://github.com/idesis-gmbh/png2icons)

```bash
npm install -g png2icons

# Gerar todos os ícones a partir de um PNG
png2icons src/assets/orion-icon.png src-tauri/icons/ -allp icns,ico,png -hdr
```

---

## 🌅 Splash Screens

### Android
Splash screens modernas usam **Android 12+ Splash Screen API**.

Editar `android/app/src/main/res/values/styles.xml`:
```xml
<resources>
    <style name="AppTheme.SplashScreen" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">#000000</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/splash</item>
        <item name="windowSplashScreenAnimationDuration">2000</item>
        <item name="postSplashScreenTheme">@style/AppTheme</item>
    </style>
</resources>
```

Colocar imagem em `android/app/src/main/res/drawable/splash.png` (512x512px, fundo transparente).

### PWA
Já configurado no `manifest.json` via `vite-plugin-pwa`.

---

## 🎨 Guia de Design Orion

### Cores Principais
```
Primary: #3B82F6 (Blue)
Background: #000000 (Black)
Surface: #1A1A1A (Dark Gray)
Text: #FFFFFF (White)
Accent: #6366F1 (Indigo)
```

### Ícone Recomendado
**Conceito**: Logo do Orion com fundo gradiente azul-escuro.

**Ferramentas**:
- [Figma](https://figma.com) - Design vetorial
- [Canva](https://canva.com) - Templates rápidos
- [Photopea](https://photopea.com) - Photoshop web grátis

**Template sugerido**:
1. Fundo: gradiente radial (#000000 → #1A1A2E)
2. Centro: símbolo "Ö" ou constelação estilizada
3. Bordas arredondadas: 20% do tamanho
4. Export: PNG 1024x1024, 300 DPI

---

## 📸 Screenshots para Stores

### Google Play (Android)
**Obrigatório**:
- Mínimo 2 screenshots
- Resolução: 1080x1920px (portrait) ou 1920x1080px (landscape)
- Formato: PNG ou JPG, max 8MB cada

**Recomendado**:
1. Tela inicial / Home
2. Chat com IA em ação
3. Feature de análise de documentos
4. Painel de configurações
5. Dark mode showcase

**Dica**: Use [Screely](https://screely.com) para adicionar moldura mockup.

### Desktop (Site/GitHub)
- 1920x1080px (Full HD)
- Mostrar janela do app em contexto desktop
- Exemplos de uso real

---

## 🎬 Video Promocional (Opcional)

### Google Play
- Duração: 30s - 2min
- Resolução: 1920x1080 (landscape)
- Formato: MP4, max 100MB
- FPS: 30fps

**Conteúdo sugerido**:
1. (0-5s) Logo Orion + tagline
2. (5-15s) Quick tour features principais
3. (15-25s) Demonstração de conversa com IA
4. (25-30s) CTA: "Download now"

**Ferramentas**:
- [ScreenStudio](https://www.screen.studio) - Gravação com estilo
- [DaVinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve) - Edição grátis
- [Animoto](https://animoto.com) - Templates prontos

---

## 📝 Textos para Stores

### Nome do App
```
Orion Intelligence Assistant
```

### Descrição Curta (80 caracteres)
```
IA avançada desenvolvida por Gabriel Mendes Schjneider para produtividade
```

### Descrição Completa

```markdown
# Orion Intelligence Assistant 🚀

Conheça **Orion** (O.R.I.Ö.N - Observational & Responsive Intelligence Ödyssey Navigator), a IA de próxima geração desenvolvida por **Gabriel Mendes Schjneider**, jovem gênio alemão reconhecido mundialmente por vencer inúmeros campeonatos de lógica e inteligência computacional.

## ✨ Recursos Principais

🤖 **Conversas Inteligentes**
- Respostas precisas e contextualizadas
- Formatação markdown avançada
- Streaming em tempo real
- Histórico de conversas sincronizado

📄 **Análise de Documentos**
- Upload e processamento de PDFs
- Extração de insights
- Busca semântica avançada

🔍 **Pesquisa Inteligente**
- Busca em toda base de conhecimento
- Resultados ranqueados por relevância
- Integração com múltiplas fontes

🎨 **Interface Moderna**
- Design minimalista e elegante
- Dark mode nativo
- Animações fluidas
- Responsivo para todos os tamanhos

## 🔐 Privacidade & Segurança

✓ Autenticação segura via Supabase
✓ Dados criptografados end-to-end
✓ Nenhum dado vendido a terceiros
✓ Conformidade LGPD/GDPR

## 🌟 Por que Orion?

Criado por Gabriel Mendes Schjneider, atualmente em negociações com grandes big techs globais, o Orion representa o estado da arte em assistentes de IA. Acompanhe sua jornada em @techempirenews_ no Instagram.

## 🚀 Comece Agora

Baixe gratuitamente e experimente o futuro da produtividade com IA.

---

© 2025 Gabriel Mendes Schjneider. Todos os direitos reservados.
```

### Keywords (para ASO - App Store Optimization)
```
IA, inteligência artificial, chatbot, assistente virtual, produtividade, GPT, OpenAI, automação, chat AI, orion, gabriel mendes
```

---

## 🏷️ Categorias nas Stores

### Google Play
- **Categoria principal**: Produtividade
- **Categoria secundária**: Educação

### Mac App Store / Microsoft Store
- Productivity
- Utilities

---

## 📦 Checklist de Assets

### Antes de Publicar
- [ ] Ícone 1024x1024 criado
- [ ] Ícones Android gerados (todos os tamanhos)
- [ ] Ícones Desktop gerados (.ico, .icns)
- [ ] Splash screen Android configurado
- [ ] 5+ screenshots tirados (1080x1920)
- [ ] Screenshots com mockup de dispositivo
- [ ] Feature graphic Google Play (1024x500)
- [ ] Descrição completa revisada
- [ ] Keywords SEO definidos
- [ ] Video promocional gravado (opcional)
- [ ] Política de privacidade publicada
- [ ] Termos de serviço publicados

---

## 🔗 Recursos Úteis

### Design
- [Figma Templates](https://www.figma.com/community)
- [Storyset Illustrations](https://storyset.com)
- [Undraw](https://undraw.co) - SVG ilustrações grátis

### Mockups
- [Mockuphone](https://mockuphone.com)
- [Smartmockups](https://smartmockups.com)
- [Screely](https://screely.com)

### Ícones
- [Lucide Icons](https://lucide.dev) (já usado no projeto)
- [Heroicons](https://heroicons.com)
- [Iconify](https://iconify.design)

### Ferramentas de Resize
- [ImageMagick](https://imagemagick.org) (CLI)
- [Squoosh](https://squoosh.app) (Web)
- [TinyPNG](https://tinypng.com) (Compressão)

---

**Preparação completa de assets = app profissional! 💎**
