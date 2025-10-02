import { supabase } from "@/integrations/supabase/client";
import { EDGE_FUNCTIONS, API_CONFIG, SUPABASE_CONFIG } from "@/lib/supabaseConfig";
import { create } from "zustand";

/**
 * 💬 Chat Store - Gerenciamento de Estado do Chat
 * 
 * Store Zustand que gerencia todo o estado e lógica do chat:
 * - Conversas (criação, listagem, deleção, renomeação)
 * - Mensagens (envio, streaming, histórico)
 * - UI (sidebar, áudio, carregamento)
 * 
 * Arquitetura:
 * - Estado reativo com Zustand
 * - Comunicação com Supabase (DB + Edge Functions)
 * - Streaming de respostas da IA em tempo real
 * - Controle de abort para cancelamento
 */

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
interface Conversation {
  id: string;
  title?: string;
  [key: string]: unknown;
}

interface ChatState {
  conversations: Conversation[];
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
    console.log("🗃️ ChatStore - Inicializando...");

    try {
      console.log("🗃️ ChatStore - Buscando conversas no Supabase...");
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("❌ ChatStore - Erro ao buscar conversas:", error);
        throw error;
      }

      console.log(
        "🗃️ ChatStore - Conversas encontradas:",
        conversations?.length || 0
      );

      if (conversations && (conversations as Conversation[]).length > 0) {
        console.log(
          "🗃️ ChatStore - Definindo primeira conversa como ativa:",
          (conversations as Conversation[])[0].id
        );
        set({
          conversations: conversations as Conversation[],
          conversationsLoading: false,
        });
        get().setCurrentConversationId((conversations as Conversation[])[0].id);
      } else {
        // Se não há conversas, cria uma nova e a define como ativa
        console.log(
          "🗃️ ChatStore - Nenhuma conversa encontrada, criando nova..."
        );
        await get().createConversation("Nova Conversa");
      }
    } catch (error: unknown) {
      console.error("❌ ChatStore - Erro crítico na inicialização:", error);
      set({
        error: error instanceof Error ? error : new Error(String(error)),
        conversationsLoading: false,
      });
    }
  },

  /**
   * Define a conversa ativa e busca suas mensagens.
   */
  setCurrentConversationId: async (id: string | null) => {
    set({
      currentConversationId: id,
      messages: [],
      conversationsLoading: id !== null,
    });

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
      } catch (error: unknown) {
        const e = error instanceof Error ? error : new Error(String(error));
        set({ error: e, conversationsLoading: false });
        console.error("Erro ao buscar mensagens:", e);
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

<<<<<<< HEAD
      // Constrói a URL da API dinamicamente com base no ambiente
      let response: Response | { data?: unknown; error?: unknown } | null =
        null;
      if (import.meta.env.DEV) {
        const apiUrl = "/api/chat-ai"; // proxy in dev
        response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: conversationHistory }),
          signal: abortController.signal,
        });
      } else {
        // In production use the Supabase client which will not embed the anon key in the built bundle
        const invoked: unknown = await supabase.functions.invoke("chat-ai", {
          body: { messages: conversationHistory },
        });
        const invokedResult = invoked as { data?: unknown; error?: unknown };
        if (invokedResult?.error) throw invokedResult.error;

        // Normalize possible return shapes
        if (typeof invokedResult.data === "string") {
          const encoder = new TextEncoder();
          const uint8 = encoder.encode(invokedResult.data as string);
          response = new Response(uint8);
        } else if (
          invokedResult.data &&
          typeof invokedResult.data === "object" &&
          // guard: check for a 'body' property that is likely a ReadableStream
          Object.prototype.hasOwnProperty.call(invokedResult.data, "body")
        ) {
          // If the SDK returned a body stream, attempt to use it
          const dataObj = invokedResult.data as { body?: unknown };
          const body = dataObj.body;
          if (body instanceof Response) {
            response = body;
          } else if (body && typeof (body as any).getReader === "function") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            response = new Response(body as any);
          } else {
            throw new Error("Unsupported body type from chat function");
          }
        } else {
          throw new Error("Unsupported response from chat function");
        }
      }
=======
      // ⚡ Chama a edge function do Supabase para processar a mensagem
      console.log('📤 Enviando mensagem para edge function chat-ai...');
      
      // 🔄 Usa streaming direto da edge function para resposta em tempo real
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(EDGE_FUNCTIONS.chatAI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || SUPABASE_CONFIG.anonKey}`,
        },
        body: JSON.stringify({ messages: conversationHistory }),
        signal: abortController.signal,
      });
>>>>>>> b31039c6d1458bd03a714a75579f77202a6ce713

      if (!response.ok || !response.body) {
        throw new Error("Falha ao conectar com a API.");
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
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Streaming foi abortado.");
      } else {
        const e = error instanceof Error ? error : new Error(String(error));
        set({ error: e });
        console.error("Erro no streaming da mensagem:", e);
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
   * ✅ CORRIGIDO: Adiciona user_id explicitamente e valida autenticação
   */
  createConversation: async (title: string) => {
    try {
      // ✅ CRÍTICO: Verificar se usuário está autenticado
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error('❌ ChatStore - Usuário não autenticado ao criar conversa');
        throw new Error('Usuário não autenticado. Faça login para criar conversas.');
      }

      console.log('✅ ChatStore - Criando conversa para usuário:', userData.user.id);

      const { data, error } = await supabase
        .from("conversations")
        .insert({ 
          title,
          user_id: userData.user.id // ✅ CRÍTICO: Incluir user_id explicitamente
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          conversations: [data, ...state.conversations],
        }));
        get().setCurrentConversationId(data.id);
      }
    } catch (error: unknown) {
      const e = error instanceof Error ? error : new Error(String(error));
      set({ error: e });
      console.error("Erro ao criar conversa:", e);
    }
  },

  /**
   * Deleta uma conversa e suas mensagens do banco de dados.
   */
  deleteConversation: async (id: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);
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
    } catch (error: unknown) {
      const e = error instanceof Error ? error : new Error(String(error));
      set({ error: e });
      console.error("Erro ao deletar conversa:", e);
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
    } catch (error: unknown) {
      const e = error instanceof Error ? error : new Error(String(error));
      set({ error: e });
      console.error("Erro ao renomear conversa:", e);
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
