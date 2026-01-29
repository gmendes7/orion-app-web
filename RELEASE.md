# Release Management

Guia para gerenciar releases do O.R.I.O.N.X

## Versionamento

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs

## Processo de Release

### 1. Preparação

```bash
# Atualizar branch principal
git checkout main
git pull origin main

# Certificar de que testes passam
npm run test
npm run lint
npm run build
```

### 2. Bump de Versão

```bash
# Patch release (1.0.0 → 1.0.1)
npm run release:patch

# Minor release (1.0.0 → 1.1.0)
npm run release:minor

# Major release (1.0.0 → 2.0.0)
npm run release:major
```

### 3. Atualizar CHANGELOG

```bash
# Editar CHANGELOG.md com as mudanças
nano CHANGELOG.md

# Commit das mudanças
git add CHANGELOG.md package.json package-lock.json
git commit -m "chore: release v1.0.1"
```

### 4. Criar Tag

```bash
# Criar tag anotada
git tag -a v1.0.1 -m "Release version 1.0.1"

# Verificar tag
git show v1.0.1
```

### 5. Push

```bash
# Push das mudanças
git push origin main

# Push das tags
git push origin --tags
```

### 6. GitHub Release

1. Ir para [Releases](https://github.com/usuario/orion/releases)
2. Clicar em "Create a new release"
3. Selecionar tag criada
4. Adicionar título e descrição
5. Publicar release

## Checklist de Release

- [ ] Todos os testes passam (`npm run test`)
- [ ] Linter está limpo (`npm run lint`)
- [ ] Build executa sem erros (`npm run build`)
- [ ] CHANGELOG.md está atualizado
- [ ] Versão em package.json está correta
- [ ] Git tags estão criadas
- [ ] GitHub Release está publicado
- [ ] Deploy em produção completado

## Versionamento de Pré-Release

Para releases beta/alpha:

```bash
# Beta
npm version 1.0.0-beta.1

# Alpha
npm version 1.0.0-alpha.1

# RC (Release Candidate)
npm version 1.0.0-rc.1
```

## Comunicação

Após cada release:

1. **Notificar contribuidores** via email/Discord
2. **Publicar changelog** em social media
3. **Documentar mudanças** em CHANGELOG.md
4. **Atualizar documentação** se necessário

## Rollback

Se um release tiver problemas:

```bash
# Remover a tag local
git tag -d v1.0.1

# Remover a tag remota
git push origin :refs/tags/v1.0.1

# Reverter commits
git revert <commit-hash>

# Ou resetar se não foi merged ainda
git reset --hard origin/main
```

## Changelog Format

```markdown
## [1.0.1] - 2026-01-29

### Adicionado

- Nova funcionalidade X

### Melhorado

- Melhoria em Y

### Corrigido

- Bug fix Z

### Quebras de Mudanças

- Nenhuma
```

## Automação com CI/CD

Integrar com GitHub Actions:

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: softprops/action-gh-release@v1
        with:
          files: dist/**
```

---

**Manter releases bem documentadas e comunicadas!**
