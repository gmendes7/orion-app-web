import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface KnowledgeItem {
  id: string;
  user_id: string | null;
  title: string;
  content: string;
  source_type: 'document' | 'url' | 'manual' | 'api' | null;
  source_url: string | null;
  metadata: Json | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SearchResult extends KnowledgeItem {
  similarity: number;
}

export interface UseKnowledgeBaseReturn {
  items: KnowledgeItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addKnowledge: (item: Partial<KnowledgeItem>) => Promise<KnowledgeItem | null>;
  updateKnowledge: (id: string, updates: Partial<KnowledgeItem>) => Promise<boolean>;
  deleteKnowledge: (id: string) => Promise<boolean>;
  searchKnowledge: (query: string, limit?: number) => Promise<SearchResult[]>;
}

export const useKnowledgeBase = (): UseKnowledgeBaseReturn => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Single-user mode
  const user = { id: 'single-user' };

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('knowledge_base')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setItems((data as KnowledgeItem[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar conhecimento';
      setError(message);
      console.error('Error fetching knowledge:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addKnowledge = useCallback(async (item: Partial<KnowledgeItem>): Promise<KnowledgeItem | null> => {
    if (!user) {
      setError('Você precisa estar logado para adicionar conhecimento');
      return null;
    }

    try {
      // Insert the knowledge item
      const insertData = {
        title: item.title || 'Untitled',
        content: item.content || '',
        source_type: item.source_type,
        source_url: item.source_url,
        metadata: item.metadata as Json,
        is_public: item.is_public,
        user_id: user.id,
      };
      const { data, error: insertError } = await supabase
        .from('knowledge_base')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      const newItem = data as KnowledgeItem;

      // Generate embedding in background
      supabase.functions.invoke('generate-embedding', {
        body: {
          text: `${newItem.title}\n\n${newItem.content}`,
          knowledge_id: newItem.id,
          user_id: user.id,
        },
      }).catch(err => console.error('Error generating embedding:', err));

      setItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar conhecimento';
      setError(message);
      console.error('Error adding knowledge:', err);
      return null;
    }
  }, [user]);

  const updateKnowledge = useCallback(async (id: string, updates: Partial<KnowledgeItem>): Promise<boolean> => {
    try {
      const safeUpdates = { ...updates } as Record<string, unknown>;
      if ('metadata' in safeUpdates) safeUpdates.metadata = safeUpdates.metadata as Json;
      const { error: updateError } = await supabase
        .from('knowledge_base')
        .update(safeUpdates as Parameters<typeof supabase.from<'knowledge_base'>>[0] extends { update: (v: infer U) => unknown } ? U : never)
        .eq('id', id);

      if (updateError) throw updateError;

      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));

      // Regenerate embedding if content changed
      if (updates.content || updates.title) {
        const item = items.find(i => i.id === id);
        if (item && user) {
          supabase.functions.invoke('generate-embedding', {
            body: {
              text: `${updates.title || item.title}\n\n${updates.content || item.content}`,
              knowledge_id: id,
              user_id: user.id,
            },
          }).catch(err => console.error('Error regenerating embedding:', err));
        }
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar conhecimento';
      setError(message);
      console.error('Error updating knowledge:', err);
      return false;
    }
  }, [items, user]);

  const deleteKnowledge = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar conhecimento';
      setError(message);
      console.error('Error deleting knowledge:', err);
      return false;
    }
  }, []);

  const searchKnowledge = useCallback(async (query: string, limit = 5): Promise<SearchResult[]> => {
    if (!user) return [];

    try {
      const { data, error: searchError } = await supabase.functions.invoke('semantic-search', {
        body: {
          query,
          limit,
          user_id: user.id,
          search_type: 'knowledge',
        },
      });

      if (searchError) throw searchError;

      return (data?.results as SearchResult[]) || [];
    } catch (err) {
      console.error('Error searching knowledge:', err);
      return [];
    }
  }, [user]);

  return {
    items,
    loading,
    error,
    fetchItems,
    addKnowledge,
    updateKnowledge,
    deleteKnowledge,
    searchKnowledge,
  };
};
