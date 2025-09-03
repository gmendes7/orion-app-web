import { supabase } from "@/integrations/supabase/client";
import { create } from "zustand";
import { type Message as DBMessage } from "./useConversations";

interface DisplayMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatState {
  conversations: any[];
  currentConversationId: string | null;
  messages: DisplayMessage[];
  isStreaming: boolean;
  isTyping: boolean;
  conversationsLoading: boolean;
  error: Error | null;
}

interface ChatActions {
  initialize: () => Promise<void>;
  setCurrentConversationId: (id: string | null) => void;
  sendMessage: (messageContent: string) => Promise<void>;
  stopStreaming: () => void;
  createConversation: (title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
}

const abortController = new AbortController();

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // Initial State
  conversations: [],
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  isTyping: false,
  conversationsLoading: true,
  error: null,

  // Actions
  initialize: async () => {
    try {
      const { data: conversations } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      set({ conversations: conversations || [], conversationsLoading: false });

      if (conversations && conversations.length > 0) {
        get().setCurrentConversationId(conversations[0].id);
      } else {
        await get().createConversation("Nova Conversa");
      }
    } catch (error: any) {
      set({ error, conversationsLoading: false });
    }
  },

  setCurrentConversationId: async (id: string | null) => {
    set({ currentConversationId: id, messages: [] });
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

        if (displayMessages.length === 0) {
          displayMessages.push({
            id: "welcome",
            text: "Olá! Sou o **O.R.I.Ö.N**, seu assistente de IA futurista. Como posso ajudar você hoje? ✨",
            isUser: false,
            timestamp: new Date(),
          });
        }
        set({ messages: displayMessages });
      } catch (error: any) {
        set({ error });
      }
    }
  },

  sendMessage: async (messageContent: string) => {
    const { currentConversationId, messages } = get();
    if (!messageContent.trim() || !currentConversationId) return;

    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      text: messageContent,
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    set({ messages: updatedMessages, isStreaming: true, isTyping: true });

    await supabase.from("messages").insert({
      conversation_id: currentConversationId,
      content: messageContent,
      is_user: true,
    });

    try {
      const conversation = updatedMessages.map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(response.statusText || "Falha ao conectar com a API.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponseText = "";
      const assistantMessageId = crypto.randomUUID();

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

      await supabase.from("messages").insert({
        conversation_id: currentConversationId,
        content: assistantResponseText,
        is_user: false,
      });
    } catch (error: any) {
      if (error.name === "AbortError") return;
      set({ error });
    } finally {
      set({ isStreaming: false, isTyping: false });
    }
  },

  stopStreaming: () => {
    abortController.abort();
    set({ isStreaming: false });
  },

  // Placeholder actions to be implemented
  createConversation: async (title: string) => {
    console.log("createConversation", title);
  },
  deleteConversation: async (id: string) => {
    console.log("deleteConversation", id);
  },
  renameConversation: async (id: string, newTitle: string) => {
    console.log("renameConversation", id, newTitle);
  },
}));
