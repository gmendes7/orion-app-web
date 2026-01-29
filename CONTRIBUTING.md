# 🤝 Guia de Contribuição

Primeiro, obrigado por considerar contribuir para O.R.I.O.N.X! É graças a pessoas como você que este projeto fica cada vez melhor.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Processo de Pull Request](#processo-de-pull-request)
- [Padrões de Código](#padrões-de-código)
- [Commits](#commits)
- [Documentação](#documentação)

---

## 📜 Código de Conduta

### Nossas Promessas

Nos comprometerem a manter o O.R.I.O.N.X como uma comunidade aberta e acolhedora para todos.

### Nossos Padrões

Exemplos de comportamento que contribuem para criar um ambiente positivo incluem:

- Usar linguagem acolhedora e inclusiva
- Ser respeitoso com pontos de vista e experiências diferentes
- Aceitar críticas construtivas graciosamente
- Focar no que é melhor para a comunidade
- Mostrar empatia com outros membros da comunidade

Exemplos de comportamento inaceitável incluem:

- Uso de linguagem ou imagens sexualizadas
- Ataques pessoais ou insultos
- Assédio público ou privado
- Publicar informações privadas de terceiros
- Outras condutas que possam ser razoavelmente consideradas inadequadas

---

## 🚀 Como Contribuir

### Reportar Bugs

Antes de reportar um bug, por favor verifique se o problema já não foi reportado. Se encontrar um **duplicado**, adicione um comentário no issue existente em vez de abrir um novo.

Para reportar um bug, abra um novo issue e inclua:

- **Descrição clara e descritiva** do que é o bug
- **Passos para reproduzir** o comportamento
- **Comportamento esperado** vs **comportamento atual**
- **Screenshots/GIFs** se possível
- **Seu ambiente** (OS, navegador, versão Node, etc.)
- **Logs de erro** relevantes

### Sugerir Melhorias

Sugestões de melhorias são sempre bem-vindas! Para sugerir uma melhoria:

1. Abra uma **Discussion** (não um Issue)
2. Descreva a melhor forma possível
3. Forneça exemplos específicos para demonstrar os passos
4. Descreva o comportamento atual e o esperado
5. Explique por que essa melhoria seria útil

---

## 🔄 Processo de Pull Request

1. **Fork o repositório** e crie sua branch a partir de `main`

   ```bash
   git checkout -b feature/sua-feature
   ```

2. **Faça suas mudanças** seguindo os padrões de código

3. **Escreva ou atualize testes** conforme necessário

4. **Atualize a documentação** se houver mudanças externas

5. **Execute testes localmente**

   ```bash
   npm run test
   npm run lint
   ```

6. **Commit suas mudanças** seguindo Conventional Commits

7. **Push para sua fork** e abra um Pull Request

8. **Espere pela revisão** - pode levar alguns dias

### Checklist do PR

- [ ] Meu código segue o padrão de código do projeto
- [ ] Atualizei a documentação conforme necessário
- [ ] Adicionei testes para minhas mudanças
- [ ] Todos os testes passam localmente
- [ ] Meu PR não contém informações sensíveis
- [ ] Titulo e descrição são claros e descritivos

---

## 📝 Padrões de Código

### TypeScript

```typescript
// ✅ BOM: Types explícitos, comentários úteis
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ✅ BOM: Nomes descritivos
const formatChatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString("pt-BR");
};

// ❌ RUIM: Tipos implícitos, nomes curtos
const fmt = (d: any) => {
  return d.toLocaleTimeString();
};
```

### React Components

```tsx
// ✅ BOM: Component bem estruturado
interface ChatInputProps {
  onSubmit: (message: string) => Promise<void>;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  disabled = false,
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSubmit(input);
      setInput("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled || isLoading}
        placeholder="Digite sua mensagem..."
      />
      <button type="submit" disabled={disabled || isLoading}>
        Enviar
      </button>
    </form>
  );
};

export default ChatInput;
```

### Tailwind CSS

```tsx
// ✅ BOM: Classes bem organizadas
<div className="flex flex-col gap-4 rounded-lg bg-card p-6 shadow-lg border border-border/30">
  <h2 className="text-lg font-semibold text-foreground">Título</h2>
  <p className="text-sm text-muted-foreground">Descrição</p>
</div>

// ❌ RUIM: Classes desorganizadas
<div className="p-6 flex gap-4 bg-card shadow-lg flex-col border rounded-lg border-border/30">
```

### Convenções de Nomes

- **Componentes React**: `PascalCase` - `ChatInput.tsx`, `UserProfile.tsx`
- **Funções/variáveis**: `camelCase` - `sendMessage()`, `isLoading`
- **Constantes**: `UPPER_SNAKE_CASE` - `API_ENDPOINT`, `MAX_RETRIES`
- **Tipos/Interfaces**: `PascalCase` - `ChatMessage`, `UserProfile`
- **Hooks customizados**: `useNomeDoHook` - `useChatStore`, `useVoiceInput`

---

## 📌 Commits

Seguimos **Conventional Commits** para mensagens de commit.

### Formato

```
<tipo>(<escopo>): <assunto>

<corpo>

<rodapé>
```

### Tipos Permitidos

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Mudanças na documentação
- **style**: Mudanças de formatação (não afeta lógica)
- **refactor**: Refatoração sem mudanças de funcionalidade
- **perf**: Melhorias de performance
- **test**: Adição ou atualização de testes
- **chore**: Mudanças em build/dependencies
- **ci**: Mudanças em CI/CD

### Exemplos

```bash
# Boa feature
git commit -m "feat(chat): add voice input support

- Added speech-to-text integration
- Added microphone permission handling
- Added voice transcript display

Closes #123"

# Boa correção
git commit -m "fix(auth): resolve login timeout issue

Previously, login requests would timeout after 30s.
Now uses exponential backoff retry strategy.

Fixes #456"

# Boa documentação
git commit -m "docs(readme): add setup instructions"

# Boa refatoração
git commit -m "refactor(hooks): improve useChatStore performance

- Moved state updates to useCallback
- Memoized selectors
- Reduced re-renders by 40%"
```

---

## 📚 Documentação

### Comentários em Código

```typescript
// ✅ BOM: Comentários explicam o "por quê", não o "o quê"
// Limita requisições simultâneas para evitar rate limit do Azure
const MAX_CONCURRENT_REQUESTS = 3;

// ❌ RUIM: Comentário óbvio
// Incrementa o contador
counter++;
```

### JSDoc para Funções Públicas

```typescript
/**
 * Envia uma mensagem de chat para a IA
 *
 * @param message - Texto da mensagem do usuário
 * @param conversationId - ID da conversa (opcional, cria nova se não fornecido)
 * @returns Promise que resolve quando a resposta é recebida
 * @throws {Error} Se a API retornar erro
 *
 * @example
 * const response = await sendChatMessage("Olá, como vai?");
 */
export async function sendChatMessage(
  message: string,
  conversationId?: string,
): Promise<ChatResponse> {
  // implementação
}
```

### README em Pastas

Adicione `README.md` em pastas complexas:

```
src/
├── components/
│   ├── README.md (documenta a estrutura de componentes)
│   ├── chat/
│   ├── ui/
│   └── ...
├── hooks/
│   └── README.md (documenta hooks disponíveis)
└── ...
```

---

## ✅ Checklist Antes de Submeter

- [ ] Seu código segue o padrão de código do projeto
- [ ] Você adicionou testes para suas mudanças
- [ ] Todos os testes passam: `npm run test`
- [ ] Seu código passa no linter: `npm run lint`
- [ ] Você atualizou a documentação relevante
- [ ] Você adicionou uma entrada ao CHANGELOG.md
- [ ] Sua branch está atualizada com `main`
- [ ] Suas mensagens de commit seguem Conventional Commits
- [ ] Seu PR tem título e descrição claros
- [ ] Você não adicionou dependências desnecessárias

---

## 📞 Dúvidas?

- 📧 Email: gabriel@example.com
- 💬 Discussions: [GitHub Discussions](https://github.com/usuario/orion/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/usuario/orion/issues)

---

Obrigado por contribuir! 🎉

**Desenvolvido com ❤️ por Gabriel Mendes**
