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

        // Chamar Edge Function
        console.log("🚀 Enviando para chat-ai...");

        const response = await supabase.functions.invoke("chat-ai", {
          body: {
            messages: conversationHistory,
            systemPrompt: systemPrompt || undefined,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || "Erro ao processar resposta");
        }

        // Processar resposta
        let assistantText = "";

        if (typeof response.data === "string") {
          assistantText = response.data;
        } else if (response.data && typeof response.data === "object") {
          // Tentar extrair texto de diferentes formatos
          const data = response.data as Record<string, unknown>;
          if (data.response) {
            assistantText = String(data.response);
          } else if (data.text) {
            assistantText = String(data.text);
          } else if (data.content) {
            assistantText = String(data.content);
          } else {
            // Tentar como stream
            assistantText = JSON.stringify(data);
          }
        }

        // Criar mensagem do assistente
        const assistantMessage: LocalMessage = {
          id: crypto.randomUUID(),
          text: assistantText || "Desculpe, não consegui processar sua mensagem.",
          isUser: false,
          timestamp: new Date(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        set({ messages: finalMessages, isTyping: false });

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
