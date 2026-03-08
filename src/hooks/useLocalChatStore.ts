/**
 * 💬 Local Chat Store - Gerenciamento de Estado Local do Chat
 * 
 * Store Zustand que gerencia o chat LOCALMENTE sem necessidade de autenticação.
 * Ideal para o modo JARVIS single-user.
 */

import { create } from "zustand";
import { checkRateLimit } from "@/lib/security";

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

// ============= CONSTANTS =============

const STORAGE_KEY = "jarvis_local_conversations";
const MAX_MESSAGE_LENGTH = 8000;
const MAX_CONVERSATIONS = 100;
const MAX_MESSAGES_PER_CONVERSATION = 200;

// ============= STORAGE =============

function loadConversationsFromStorage(): LocalConversation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    
    return parsed.slice(0, MAX_CONVERSATIONS).map((conv: Record<string, unknown>) => ({
      ...conv,
      updatedAt: new Date(conv.updatedAt as string),
      messages: ((conv.messages as Array<Record<string, unknown>>) || [])
        .slice(-MAX_MESSAGES_PER_CONVERSATION)
        .map((msg: Record<string, unknown>) => ({
          ...msg,
          timestamp: new Date(msg.timestamp as string),
        })),
    }));
  } catch {
    console.error("Erro ao carregar conversas — resetando storage");
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveConversationsToStorage(conversations: LocalConversation[]): void {
  try {
    const trimmed = conversations.slice(0, MAX_CONVERSATIONS).map(c => ({
      ...c,
      messages: c.messages.slice(-MAX_MESSAGES_PER_CONVERSATION),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      // Trim oldest conversations to free space
      const reduced = conversations.slice(0, Math.floor(conversations.length / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
    }
    console.error("Erro ao salvar conversas:", error);
  }
}

// ============= HELPERS =============

function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase não configurado. Verifique as variáveis de ambiente.");
  }
  return { url, key };
}

function sanitizeInput(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim();
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
      const conversations = loadConversationsFromStorage();

      if (conversations.length > 0) {
        const firstConv = conversations[0];
        set({
          conversations,
          currentConversationId: firstConv.id,
          messages: firstConv.messages,
          isLoading: false,
        });
      } else {
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
      
      // ── Input validation & rate limiting ──
      const sanitized = sanitizeInput(content);
      if (!sanitized || sanitized.length > MAX_MESSAGE_LENGTH || !currentConversationId) return;

      const rateCheck = checkRateLimit("sendMessage", 20, 60000);
      if (!rateCheck.allowed) {
        set({ error: new Error(`Rate limit: aguarde ${Math.ceil(rateCheck.resetIn / 1000)}s`) });
        return;
      }

      const abortController = new AbortController();
      set({ isStreaming: true, isTyping: true, abortController, error: null });

      const userMessage: LocalMessage = {
        id: crypto.randomUUID(),
        text: sanitized,
        isUser: true,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      set({ messages: updatedMessages });

      // Persist user message immediately
      const updatedConversations = conversations.map((c) =>
        c.id === currentConversationId
          ? { ...c, messages: updatedMessages, updatedAt: new Date() }
          : c
      );
      saveConversationsToStorage(updatedConversations);
      set({ conversations: updatedConversations });

      try {
        const { url, key } = getSupabaseConfig();

        // Prepare history (limit context window)
        const conversationHistory = updatedMessages
          .slice(-30)
          .map((msg) => ({
            role: msg.isUser ? "user" : "assistant",
            content: msg.text,
          }));

        const response = await fetch(`${url}/functions/v1/chat-ai`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": `Bearer ${key}`,
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

        // ── Streaming token-by-token ──
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Stream não disponível");

        const decoder = new TextDecoder();
        const assistantMsgId = crypto.randomUUID();
        let assistantText = "";

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

          set({
            messages: [
              ...updatedMessages,
              { ...assistantMessage, text: assistantText },
            ],
          });
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

        const finalConversations = get().conversations.map((c) =>
          c.id === currentConversationId
            ? { ...c, messages: finalMessages, updatedAt: new Date() }
            : c
        );
        saveConversationsToStorage(finalConversations);
        set({ conversations: finalConversations });

      } catch (error) {
        if ((error as Error).name === "AbortError") return;

        console.error("❌ Erro ao enviar mensagem:", (error as Error).message);

        const errorMsg: LocalMessage = {
          id: crypto.randomUUID(),
          text: `⚠️ Erro: ${(error as Error).message || "Erro desconhecido"}`,
          isUser: false,
          timestamp: new Date(),
        };

        set({
          messages: [...get().messages, errorMsg],
          error: error instanceof Error ? error : new Error("Erro desconhecido"),
        });
      } finally {
        set({ isStreaming: false, isTyping: false, abortController: null });
      }
    },

    stopStreaming: () => {
      const { abortController } = get();
      if (abortController) abortController.abort();
      set({ isStreaming: false, isTyping: false });
    },

    createConversation: (title: string) => {
      const sanitizedTitle = sanitizeInput(title).substring(0, 100) || "Nova Conversa";
      
      const newConv: LocalConversation = {
        id: crypto.randomUUID(),
        title: sanitizedTitle,
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

      const updatedConversations = [newConv, ...get().conversations].slice(0, MAX_CONVERSATIONS);
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
      const sanitizedTitle = sanitizeInput(newTitle).substring(0, 100) || "Conversa";
      const updated = get().conversations.map((c) =>
        c.id === id ? { ...c, title: sanitizedTitle, updatedAt: new Date() } : c
      );
      saveConversationsToStorage(updated);
      set({ conversations: updated });
    },

    setAudioEnabled: (enabled: boolean) => set({ audioEnabled: enabled }),
    setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
    clearError: () => set({ error: null }),
  })
);

export default useLocalChatStore;