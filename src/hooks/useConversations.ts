import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/integrations/hooks/use-toast';

export interface Message {
  id: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export const useConversations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar conversas do usuário
  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setConversations(data || []);
      
      // Se não há conversa atual e há conversas, selecionar a primeira
      if (!currentConversationId && data && data.length > 0) {
        setCurrentConversationId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast({
        title: "Erro ao carregar conversas",
        description: "Não foi possível carregar suas conversas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      return [];
    }
  };

  // Criar nova conversa
  // ✅ CORRIGIDO: Validação melhorada e tratamento de erros
  const createConversation = async (title: string = 'Nova Conversa') => {
    if (!user) {
      console.error('❌ useConversations - Usuário não autenticado');
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar conversas.",
        variant: "destructive",
      });
      return null;
    }

    try {
      console.log('✅ useConversations - Criando conversa para:', user.id);

      const { data, error } = await supabase
        .from('conversations')
        .insert([
          { 
            user_id: user.id, 
            title,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newConversation = data;
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      
      return newConversation;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast({
        title: "Erro ao criar conversa",
        description: "Não foi possível criar uma nova conversa.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Atualizar título da conversa
  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, title }
            : conv
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar título:', error);
      toast({
        title: "Erro ao atualizar título",
        description: "Não foi possível atualizar o título da conversa.",
        variant: "destructive",
      });
    }
  };

  // Deletar conversa
  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Se a conversa deletada era a atual, selecionar outra
      if (currentConversationId === conversationId) {
        const remaining = conversations.filter(conv => conv.id !== conversationId);
        setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
      toast({
        title: "Erro ao deletar conversa",
        description: "Não foi possível deletar a conversa.",
        variant: "destructive",
      });
    }
  };

  // Salvar mensagem
  const saveMessage = async (conversationId: string, content: string, isUser: boolean) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            content,
            is_user: isUser,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Atualizar updated_at da conversa
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
      setLoading(false);
    }
  }, [user]);

  return {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    loading,
    loadMessages,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    saveMessage,
    refetch: loadConversations,
  };
};