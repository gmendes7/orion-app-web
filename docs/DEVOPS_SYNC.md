# ORION DevOps Sync Guide (Node + Git + GitHub Desktop)

## 1) Diagnóstico rápido (sempre execute primeiro)

```bash
pwd
ls -la
npm run env:doctor
```

Verifique se:
- você está no diretório correto do projeto;
- existe `.git` na raiz;
- `git remote -v` aponta para o repositório esperado;
- a branch ativa é a mesma usada no GitHub Desktop.

## 2) Erro `vite: not found`

Causas comuns:
- `node_modules` ausente;
- dependências de desenvolvimento não instaladas;
- comando rodado fora da pasta do repositório.

Correção:

```bash
npm install
npm run dev
```

Se necessário:

```bash
npm install vite --save-dev
```

## 3) Sincronização Git manual

```bash
git status
git add .
git commit -m "auto-update"
git push
```

## 4) Sincronização via script

Scripts disponíveis:

- `npm run sync` → fluxo direto `add/commit/push`.
- `npm run sync:safe` → só sincroniza quando há mudança local.
- `npm run sync:watch` → verifica alterações periodicamente e tenta sincronizar.

## 5) Configuração de remote (quando necessário)

Se `git remote -v` estiver vazio, configure:

```bash
git remote add origin <URL_DO_REPOSITORIO>
git push -u origin <SUA_BRANCH>
```

## 6) Compatibilidade com GitHub Desktop

O caminho em `pwd` deve ser o mesmo repositório aberto no GitHub Desktop.
Se forem diferentes, abra no Desktop exatamente a pasta retornada por `pwd`.

## 7) Boas práticas para "nunca perder sincronização"

- Sempre commitar em branch de trabalho específica.
- Rodar `npm run env:doctor` antes de iniciar desenvolvimento.
- Usar `npm run sync:safe` com frequência em vez de commit manual sem revisão.
- Evitar usar `sync:watch` em mudanças muito sensíveis sem revisão (ele faz push automático).
