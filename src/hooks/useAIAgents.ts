/**
 * 🤖 useAIAgents - Hook para gerenciar agentes de IA
 * 
 * Versão single-user sem autenticação.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AIAgent {
  id: string;
  name: string;
  description: string | null;
  type: 'support' | 'automation' | 'task' | 'analysis' | 'custom';
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  tools: unknown[];
  is_active: boolean;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseAIAgentsReturn {
  agents: AIAgent[];
  loading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  refetch: () => Promise<void>;
  getAgentById: (id: string) => AIAgent | undefined;
  getAgentsByType: (type: AIAgent['type']) => AIAgent[];
  createAgent: (agent: Partial<AIAgent>) => Promise<AIAgent | null>;
  updateAgent: (id: string, updates: Partial<AIAgent>) => Promise<boolean>;
  deleteAgent: (id: string) => Promise<boolean>;
}

export const useAIAgents = (): UseAIAgentsReturn => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;

      setAgents((data as AIAgent[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar agentes';
      setError(message);
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const getAgentById = useCallback((id: string) => {
    return agents.find(agent => agent.id === id);
  }, [agents]);

  const getAgentsByType = useCallback((type: AIAgent['type']) => {
    return agents.filter(agent => agent.type === type);
  }, [agents]);

  const createAgent = useCallback(async (agent: Partial<AIAgent>): Promise<AIAgent | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('ai_agents')
        .insert({
          ...agent,
          created_by: null, // Single-user mode
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newAgent = data as AIAgent;
      setAgents(prev => [...prev, newAgent]);
      return newAgent;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar agente';
      setError(message);
      console.error('Error creating agent:', err);
      return null;
    }
  }, []);

  const updateAgent = useCallback(async (id: string, updates: Partial<AIAgent>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, ...updates } : agent
      ));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar agente';
      setError(message);
      console.error('Error updating agent:', err);
      return false;
    }
  }, []);

  const deleteAgent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setAgents(prev => prev.filter(agent => agent.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar agente';
      setError(message);
      console.error('Error deleting agent:', err);
      return false;
    }
  }, []);

  return {
    agents,
    loading,
    error,
    fetchAgents,
    refetch: fetchAgents,
    getAgentById,
    getAgentsByType,
    createAgent,
    updateAgent,
    deleteAgent,
  };
};
