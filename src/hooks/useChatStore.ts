import { supabase } from "@/integrations/supabase/client";
import { create } from "zustand";

// Define a interface para uma mensagem no banco de dados (para clareza)
interface DBMessage {
  id: string;
  created_at: string;
  content: string;
  is_user: boolean;
  conversation_id: string;
}

// Define a interface para uma mensagem exibida na UI
interface DisplayMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Define a interface para o estado do chat
interface ChatState {
  conversations: any[]; // Idealmente, teria uma interface Conversation
  currentConversationId: string | null;
  messages: DisplayMessage[];
  isStreaming: boolean;
  isTyping: boolean;
  conversationsLoading: boolean;
  error: Error | null;
  abortController: AbortController | null; // Controlador para parar o streaming
  audioEnabled: boolean;
  sidebarOpen: boolean;
}

// Define a interface para as ações do chat
interface ChatActions {
  initialize: () => Promise<void>;
  setCurrentConversationId: (id: string | null) => void;
  sendMessage: (messageContent: string) => Promise<void>;
  stopStreaming: () => void;
  createConversation: (title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  setAudioEnabled: (enabled: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // --- Estado Inicial ---
  conversations: [],
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  isTyping: false,
  conversationsLoading: true,
  error: null,

  abortController: null,

  audioEnabled: true,
  sidebarOpen: false,


  // --- Ações ---

  /**
   * Inicializa o store, buscando as conversas do usuário.
   * Se não houver conversas, cria uma nova.
   */
  initialize: async () => {
    try {
      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (conversations && conversations.length > 0) {
        set({ conversations, conversationsLoading: false });
        get().setCurrentConversationId(conversations[0].id);
      } else {
        // Se não há conversas, cria uma nova e a define como ativa
        await get().createConversation("Nova Conversa");
      }
    } catch (error: any) {
      set({ error, conversationsLoading: false });
      console.error("Erro ao inicializar conversas:", error);
    }
  },

  /**
   * Define a conversa ativa e busca suas mensagens.
   */
  setCurrentConversationId: async (id: string | null) => {
    set({ currentConversationId: id, messages: [], conversationsLoading: id !== null });

    if (id) {
      try {
        const { data: dbMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", id)
          .order("created_at", { ascending: true });

        const displayMessages: DisplayMessage[] = (dbMessages || []).map(
          (msg: DBMessage) => ({
            id: msg.id,
            text: msg.content,
            isUser: msg.is_user,
            timestamp: new Date(msg.created_at),
          })
        );

        // Adiciona uma mensagem de boas-vindas se a conversa estiver vazia
        if (displayMessages.length === 0) {
          displayMessages.push({
            id: "welcome-message",
            text: "Olá! Sou o **O.R.I.Ö.N**, seu assistente de IA futurista. Como posso ajudar você hoje? ✨",
            isUser: false,
            timestamp: new Date(),
          });
        }
        set({ messages: displayMessages, conversationsLoading: false });
      } catch (error: any) {
        set({ error, conversationsLoading: false });
        console.error("Erro ao buscar mensagens:", error);
      }
    } else {
        set({ conversationsLoading: false });
    }
  },

  /**
   * Envia uma mensagem do usuário e busca a resposta do assistente.
   */
  sendMessage: async (messageContent: string) => {
    const { currentConversationId, messages } = get();
    if (!messageContent.trim() || !currentConversationId) return;

    // Cria um novo AbortController para esta requisição específica
    const abortController = new AbortController();
    set({ isStreaming: true, isTyping: true, abortController });

    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      text: messageContent,
      isUser: true,
      timestamp: new Date(),
    };

    // Adiciona a mensagem do usuário à UI imediatamente
    set({ messages: [...messages, userMessage] });

    // Salva a mensagem do usuário no banco de dados
    await supabase.from("messages").insert({
      conversation_id: currentConversationId,
      content: messageContent,
      is_user: true,
    });

    try {
      const conversationHistory = get().messages.map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text,
      }));

      // Constrói a URL da API dinamicamente com base no ambiente
      const apiUrl = import.meta.env.DEV
        ? "/api/chat-ai" // Usa o proxy no desenvolvimento
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`; // Usa a URL absoluta em produção

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // A chave anon do Supabase é necessária para chamar a função diretamente em produção
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: conversationHistory }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(response.statusText || "Falha ao conectar com a API.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponseText = "";
      const assistantMessageId = crypto.randomUUID();

      // Adiciona um placeholder para a mensagem do assistente
      set((state) => ({
        isTyping: false,
        messages: [
          ...state.messages,
          {
            id: assistantMessageId,
            text: "",
            isUser: false,
            timestamp: new Date(),
          },
        ],
      }));

      // Processa o stream da resposta
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantResponseText += decoder.decode(value);
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, text: assistantResponseText }
              : msg
          ),
        }));
      }

      // Salva a resposta completa do assistente no banco de dados
      await supabase.from("messages").insert({
        conversation_id: currentConversationId,
        content: assistantResponseText,
        is_user: false,
      });
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Streaming foi abortado.");
      } else {
        set({ error });
        console.error("Erro no streaming da mensagem:", error);
      }
    } finally {
      set({ isStreaming: false, isTyping: false, abortController: null });
    }
  },

  /**
   * Para a geração de resposta da IA em andamento.
   */
  stopStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isStreaming: false, isTyping: false });
  },

  /**
   * Cria uma nova conversa no banco de dados e a define como ativa.
   */
  createConversation: async (title: string) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ title })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          conversations: [data, ...state.conversations],
        }));
        get().setCurrentConversationId(data.id);
      }
    } catch (error: any) {
      set({ error });
      console.error("Erro ao criar conversa:", error);
    }
  },

  /**
   * Deleta uma conversa e suas mensagens do banco de dados.
   */
  deleteConversation: async (id: string) => {
    try {
      const { error } = await supabase.from("conversations").delete().eq("id", id);
      if (error) throw error;

      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
      }));

      // Se a conversa deletada era a ativa, seleciona outra ou cria uma nova
      if (get().currentConversationId === id) {
        const remainingConversations = get().conversations;
        if (remainingConversations.length > 0) {
          get().setCurrentConversationId(remainingConversations[0].id);
        } else {
          await get().createConversation("Nova Conversa");
        }
      }
    } catch (error: any) {
      set({ error });
      console.error("Erro ao deletar conversa:", error);
    }
  },

  /**
   * Renomeia uma conversa no banco de dados.
   */
  renameConversation: async (id: string, newTitle: string) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? data : c
          ),
        }));
      }
    } catch (error: any) {
      set({ error });
      console.error("Erro ao renomear conversa:", error);
    }
  },

  // UI State Actions
  setAudioEnabled: (enabled: boolean) => {
    set({ audioEnabled: enabled });
  },
  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },
}));

