import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PromptVersion {
  id: string;
  agent_id: string;
  version_number: number;
  system_prompt: string;
  change_description: string | null;
  created_by: string | null;
  created_at: string;
  is_active: boolean;
}

export const usePromptVersions = (agentId: string | null) => {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!agentId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('agent_prompt_versions')
        .select('*')
        .eq('agent_id', agentId)
        .order('version_number', { ascending: false });

      if (fetchError) throw fetchError;
      setVersions((data as PromptVersion[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar versões';
      setError(message);
      console.error('Error fetching prompt versions:', err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const revertToVersion = useCallback(async (versionId: string): Promise<boolean> => {
    if (!agentId) return false;

    try {
      // Find the version to revert to
      const version = versions.find(v => v.id === versionId);
      if (!version) throw new Error('Versão não encontrada');

      // Update the agent with the old prompt (this will trigger a new version automatically)
      const { error: updateError } = await supabase
        .from('ai_agents')
        .update({ 
          system_prompt: version.system_prompt,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId);

      if (updateError) throw updateError;

      // Refresh versions
      await fetchVersions();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reverter versão';
      setError(message);
      console.error('Error reverting to version:', err);
      return false;
    }
  }, [agentId, versions, fetchVersions]);

  const deleteVersion = useCallback(async (versionId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('agent_prompt_versions')
        .delete()
        .eq('id', versionId);

      if (deleteError) throw deleteError;

      setVersions(prev => prev.filter(v => v.id !== versionId));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar versão';
      setError(message);
      console.error('Error deleting version:', err);
      return false;
    }
  }, []);

  return {
    versions,
    loading,
    error,
    fetchVersions,
    revertToVersion,
    deleteVersion,
  };
};
