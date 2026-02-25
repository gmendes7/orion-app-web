/**
 * 💬 Local Chat Store - Gerenciamento de Estado Local do Chat
 * 
 * Store Zustand que gerencia o chat LOCALMENTE sem necessidade de autenticação.
 * Ideal para o modo JARVIS single-user.
 * 
 * Features:
 * - Conversas persistidas em localStorage
 * - Comunicação com Edge Functions (chat-ai)
 * - Streaming de respostas
 * - Sem dependência de user_id
 */

import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

// ============= TIPOS =============

interface LocalMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface LocalConversation {
  id: string;
  title: string;
  updatedAt: Date;
  messages: LocalMessage[];
}

interface LocalChatState {
  conversations: LocalConversation[];
  currentConversationId: string | null;
  messages: LocalMessage[];
  isStreaming: boolean;
  isTyping: boolean;
  isLoading: boolean;
  error: Error | null;
  abortController: AbortController | null;
  audioEnabled: boolean;
  sidebarOpen: boolean;
}

interface LocalChatActions {
  initialize: () => void;
  setCurrentConversationId: (id: string | null) => void;
  sendMessage: (content: string, systemPrompt?: string) => Promise<void>;
  stopStreaming: () => void;
  createConversation: (title: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  clearError: () => void;
}

// ============= STORAGE =============

const STORAGE_KEY = "jarvis_local_conversations";

function loadConversationsFromStorage(): LocalConversation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reconstruct dates
      return parsed.map((conv: Record<string, unknown>) => ({
        ...conv,
        updatedAt: new Date(conv.updatedAt as string),
        messages: ((conv.messages as Array<Record<string, unknown>>) || []).map(
          (msg: Record<string, unknown>) => ({
            ...msg,
            timestamp: new Date(msg.timestamp as string),
          })
        ),
      }));
    }
  } catch (error) {
    console.error("Erro ao carregar conversas:", error);
  }
  return [];
}

function saveConversationsToStorage(conversations: LocalConversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Erro ao salvar conversas:", error);
  }
}

// ============= STORE =============

export const useLocalChatStore = create<LocalChatState & LocalChatActions>(
  (set, get) => ({
    // --- Estado Inicial ---
    conversations: [],
    currentConversationId: null,
    messages: [],
    isStreaming: false,
    isTyping: false,
    isLoading: false,
    error: null,
    abortController: null,
    audioEnabled: true,
    sidebarOpen: false,

    // --- Ações ---

    initialize: () => {
      console.log("🗃️ LocalChatStore - Inicializando...");

      const conversations = loadConversationsFromStorage();

      if (conversations.length > 0) {
        const firstConv = conversations[0];
        set({
          conversations,
          currentConversationId: firstConv.id,
          messages: firstConv.messages,
          isLoading: false,
        });
        console.log(
          "🗃️ LocalChatStore - Conversa ativa:",
          firstConv.title
        );
      } else {
        // Criar primeira conversa
        const newConv: LocalConversation = {
          id: crypto.randomUUID(),
          title: "Nova Conversa",
          updatedAt: new Date(),
          messages: [
            {
              id: "welcome",
              text: "Olá! Sou o **O.R.I.Ö.N**, seu assistente de IA pessoal. Como posso ajudar você hoje? ✨",
              isUser: false,
              timestamp: new Date(),
            },
          ],
        };

        set({
          conversations: [newConv],
          currentConversationId: newConv.id,
          messages: newConv.messages,
          isLoading: false,
        });

        saveConversationsToStorage([newConv]);
        console.log("🗃️ LocalChatStore - Nova conversa criada");
      }
    },

    setCurrentConversationId: (id: string | null) => {
      if (!id) {
        set({ currentConversationId: null, messages: [] });
        return;
      }

      const conversation = get().conversations.find((c) => c.id === id);
      if (conversation) {
        set({
          currentConversationId: id,
          messages: conversation.messages,
        });
      }
    },

    sendMessage: async (content: string, systemPrompt?: string) => {
      const { currentConversationId, messages, conversations } = get();
      if (!content.trim() || !currentConversationId) return;

      const abortController = new AbortController();
      set({ isStreaming: true, isTyping: true, abortController, error: null });

      // Criar mensagem do usuário
      const userMessage: LocalMessage = {
        id: crypto.randomUUID(),
        text: content,
        isUser: true,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      set({ messages: updatedMessages });

      // Atualizar conversa no storage
      const updatedConversations = conversations.map((c) =>
        c.id === currentConversationId
          ? { ...c, messages: updatedMessages, updatedAt: new Date() }
          : c
      );
      saveConversationsToStorage(updatedConversations);
      set({ conversations: updatedConversations });

      try {
        // Preparar histórico
        const conversationHistory = updatedMessages.map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.text,
        }));

        // Streaming via fetch direto (supabase.functions.invoke não suporta streaming)
        console.log("🚀 Enviando para chat-ai (streaming)...");

        const SUPABASE_URL = "https://wcwwqfiolxcluyuhmxxf.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3dxZmlvbHhjbHV5dWhteHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTA4MDMsImV4cCI6MjA3MDY2NjgwM30.IZQUelbBZI492dffw3xd2eYtSn7lx7RcyuKYWtyaDDc";

        const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-ai`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: conversationHistory,
            systemPrompt: systemPrompt || undefined,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.text();
          let errorMsg = "Erro ao processar resposta";
          try {
            const parsed = JSON.parse(errorData);
            errorMsg = parsed.message || parsed.error || errorMsg;
          } catch { errorMsg = errorData || errorMsg; }
          throw new Error(errorMsg);
        }

        // Streaming token-by-token
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Stream não disponível");

        const decoder = new TextDecoder();
        const assistantMsgId = crypto.randomUUID();
        let assistantText = "";

        // Create initial assistant message
        const assistantMessage: LocalMessage = {
          id: assistantMsgId,
          text: "",
          isUser: false,
          timestamp: new Date(),
        };
        set({ messages: [...updatedMessages, assistantMessage], isTyping: false });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantText += chunk;

          // Update the assistant message progressively
          const progressMessages = [
            ...updatedMessages,
            { ...assistantMessage, text: assistantText },
          ];
          set({ messages: progressMessages });
        }

        // Final save
        if (!assistantText.trim()) {
          assistantText = "Desculpe, não consegui processar sua mensagem.";
        }

        const finalMessages = [
          ...updatedMessages,
          { ...assistantMessage, text: assistantText },
        ];
        set({ messages: finalMessages });

        // Salvar
        const finalConversations = get().conversations.map((c) =>
          c.id === currentConversationId
            ? { ...c, messages: finalMessages, updatedAt: new Date() }
            : c
        );
        saveConversationsToStorage(finalConversations);
        set({ conversations: finalConversations });

        console.log("✅ Resposta recebida");
      } catch (error) {
        console.error("❌ Erro ao enviar mensagem:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";

        // Adicionar mensagem de erro
        const errorMsg: LocalMessage = {
          id: crypto.randomUUID(),
          text: `⚠️ Erro: ${errorMessage}`,
          isUser: false,
          timestamp: new Date(),
        };

        set({
          messages: [...get().messages, errorMsg],
          error: error instanceof Error ? error : new Error(errorMessage),
        });
      } finally {
        set({ isStreaming: false, isTyping: false, abortController: null });
      }
    },

    stopStreaming: () => {
      const { abortController } = get();
      if (abortController) {
        abortController.abort();
      }
      set({ isStreaming: false, isTyping: false });
    },

    createConversation: (title: string) => {
      const newConv: LocalConversation = {
        id: crypto.randomUUID(),
        title,
        updatedAt: new Date(),
        messages: [
          {
            id: "welcome",
            text: "Olá! Como posso ajudar você? ✨",
            isUser: false,
            timestamp: new Date(),
          },
        ],
      };

      const updatedConversations = [newConv, ...get().conversations];
      saveConversationsToStorage(updatedConversations);

      set({
        conversations: updatedConversations,
        currentConversationId: newConv.id,
        messages: newConv.messages,
      });
    },

    deleteConversation: (id: string) => {
      const { conversations, currentConversationId } = get();
      const updated = conversations.filter((c) => c.id !== id);

      if (updated.length === 0) {
        // Criar nova conversa se deletar a última
        const newConv: LocalConversation = {
          id: crypto.randomUUID(),
          title: "Nova Conversa",
          updatedAt: new Date(),
          messages: [
            {
              id: "welcome",
              text: "Olá! Como posso ajudar? ✨",
              isUser: false,
              timestamp: new Date(),
            },
          ],
        };
        saveConversationsToStorage([newConv]);
        set({
          conversations: [newConv],
          currentConversationId: newConv.id,
          messages: newConv.messages,
        });
      } else {
        saveConversationsToStorage(updated);

        if (currentConversationId === id) {
          set({
            conversations: updated,
            currentConversationId: updated[0].id,
            messages: updated[0].messages,
          });
        } else {
          set({ conversations: updated });
        }
      }
    },

    renameConversation: (id: string, newTitle: string) => {
      const updated = get().conversations.map((c) =>
        c.id === id ? { ...c, title: newTitle, updatedAt: new Date() } : c
      );
      saveConversationsToStorage(updated);
      set({ conversations: updated });
    },

    setAudioEnabled: (enabled: boolean) => {
      set({ audioEnabled: enabled });
    },

    setSidebarOpen: (open: boolean) => {
      set({ sidebarOpen: open });
    },

    clearError: () => {
      set({ error: null });
    },
  })
);

export default useLocalChatStore;
