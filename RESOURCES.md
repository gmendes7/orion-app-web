# 🔗 Links e Recursos - O.R.I.O.N.X

## 📚 Documentação Interna

| Arquivo                              | Descrição                         | Prioridade |
| ------------------------------------ | --------------------------------- | ---------- |
| [README.md](./README.md)             | Documentação principal do projeto | ⭐⭐⭐     |
| [QUICK_START.md](./QUICK_START.md)   | Guia rápido para começar          | ⭐⭐⭐     |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Como contribuir                   | ⭐⭐⭐     |
| [CHANGELOG.md](./CHANGELOG.md)       | Histórico de versões              | ⭐⭐       |
| [VERSION.md](./VERSION.md)           | Documentação de versionamento     | ⭐⭐       |
| [RELEASE.md](./RELEASE.md)           | Procedimentos de release          | ⭐⭐       |
| [LICENSE](./LICENSE)                 | Licença MIT                       | ⭐         |

## 🛠️ Configurações

| Arquivo                          | Propósito              |
| -------------------------------- | ---------------------- |
| [package.json](./package.json)   | Dependências e scripts |
| [.env.example](./.env.example)   | Variáveis de ambiente  |
| [.prettierrc](./.prettierrc)     | Formatação de código   |
| [.editorconfig](./.editorconfig) | Configuração de editor |
| [.gitignore](./.gitignore)       | Arquivos ignorados     |
| [.version](./.version)           | Tracking de versão     |

---

## 🌐 Links Externos

### Tecnologias Utilizadas

#### Frontend

- [React 18](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Shadcn/UI](https://ui.shadcn.com/) - Component library
- [Radix UI](https://www.radix-ui.com/) - Primitives
- [Framer Motion](https://www.framer.com/motion/) - Animations

#### Backend & Services

- [Supabase](https://supabase.com/) - Database & Auth
- [Azure Cognitive Services](https://azure.microsoft.com/en-us/products/cognitive-services/) - AI
- [Groq](https://console.groq.com/) - LLM
- [N8N](https://n8n.io/) - Automation

#### DevOps & Deployment

- [GitHub](https://github.com/) - Version control
- [Docker](https://www.docker.com/) - Containerization
- [Capacitor](https://capacitorjs.com/) - Mobile framework

---

### Padrões e Convenções

- [Semantic Versioning](https://semver.org/lang/pt-BR/) - Versionamento
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit format
- [EditorConfig](https://editorconfig.org/) - Editor settings
- [Prettier](https://prettier.io/) - Code formatter

---

## 📖 Guias Úteis

### Git & GitHub

- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Creating Tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging)

### TypeScript & React

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/learn)
- [React Hook Form](https://react-hook-form.com/)
- [TypeScript React Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### Web Development

- [MDN Web Docs](https://developer.mozilla.org/)
- [Web.dev](https://web.dev/)
- [CSS Tricks](https://css-tricks.com/)

### Security & Compliance

- [OWASP](https://owasp.org/) - Web security
- [LGPD](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd) - Brazilian data protection

---

## 🚀 Quick Commands

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Quality Assurance

```bash
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues
npm run test         # Run tests
npm run format       # Format code with Prettier
```

### Versioning

```bash
npm run release:patch  # Create patch release
npm run release:minor  # Create minor release
npm run release:major  # Create major release
```

---

## 💡 Development Tips

### Setting Up Your Environment

1. **Install Node.js 18+**

   ```bash
   node --version
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Create .env.local**

   ```bash
   cp .env.example .env.local
   # Edit with your credentials
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

### Before Committing

```bash
# Format code
npm run format

# Fix linting issues
npm run lint:fix

# Run tests
npm run test

# Then commit
git add .
git commit -m "type(scope): description"
```

### Creating a Pull Request

1. Create feature branch

   ```bash
   git checkout -b feature/my-feature
   ```

2. Make changes and commit

   ```bash
   git commit -m "feat(component): add new feature"
   ```

3. Push to your fork

   ```bash
   git push origin feature/my-feature
   ```

4. Open PR on GitHub

---

## 🆘 Common Issues & Solutions

### Issue: `npm install` fails

**Solution:**

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: `.env` variables not loading

**Solution:**

- Rename `.env.local` to `.env` (if needed)
- Restart dev server
- Check variable names in `.env.example`

### Issue: Port 8080 already in use

**Solution:**

```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Issue: Git merge conflicts

**Solution:**

1. Open file with conflict markers
2. Choose version to keep
3. Remove conflict markers
4. Commit changes

---

## 📞 Getting Help

### Documentation

- 📖 [README.md](./README.md) - Start here
- 🚀 [QUICK_START.md](./QUICK_START.md) - Quick guide
- 🤝 [CONTRIBUTING.md](./CONTRIBUTING.md) - Contributing guide

### Communication

- 💬 **Issues**: [GitHub Issues](https://github.com/usuario/orion/issues)
- 💭 **Discussions**: [GitHub Discussions](https://github.com/usuario/orion/discussions)
- 📧 **Email**: gabriel@example.com
- 🐙 **GitHub**: [@seu-usuario](https://github.com/seu-usuario)

### Community

- 🌐 GitHub Stars & Forks
- 🤝 Open Source Community
- 👥 Community Contributions

---

## 📚 Additional Resources

### Learning Resources

- [Scrimba - Learn React](https://scrimba.com/learn/react)
- [Frontend Masters](https://frontendmasters.com/) - Advanced courses
- [Vue vs React Comparison](https://vuejs.org/guide/extras/comparison.html)

### Tools & Extensions

- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Testing

- [Vitest](https://vitest.dev/) - Testing framework
- [React Testing Library](https://testing-library.com/react)
- [Jest](https://jestjs.io/) - Testing platform

---

## 🎯 Project Milestones

- ✅ v1.0.0 (29/01/2026) - Initial professional release
- 📅 v1.1.0 (February) - Improvements & bug fixes
- 📅 v1.2.0 (March) - New features
- 📅 v2.0.0 (H2 2026) - Major redesign

---

## 📄 License & Attribution

This project is licensed under the MIT License - see [LICENSE](./LICENSE) for details.

**Developed by:** Gabriel Mendes Lourenço (18 years old, UNIDERP)

---

<div align="center">

### Have questions?

Check the [documentation](./README.md) or [open an issue](https://github.com/usuario/orion/issues)

**Last Updated:** 29/01/2026 | v1.0.0

</div>
