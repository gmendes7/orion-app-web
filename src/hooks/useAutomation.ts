import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AutomationTask {
  id: string;
  user_id: string;
  agent_id: string | null;
  name: string;
  description: string | null;
  trigger_type: 'schedule' | 'event' | 'webhook' | 'manual';
  trigger_config: Record<string, unknown>;
  action_type: 'message' | 'api_call' | 'email' | 'notification' | 'custom';
  action_config: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskExecutionLog {
  id: string;
  task_id: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface UseAutomationReturn {
  tasks: AutomationTask[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (task: Partial<AutomationTask>) => Promise<AutomationTask | null>;
  updateTask: (id: string, updates: Partial<AutomationTask>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  executeTask: (id: string) => Promise<TaskExecutionLog | null>;
  getTaskLogs: (taskId: string) => Promise<TaskExecutionLog[]>;
}

export const useAutomation = (): UseAutomationReturn => {
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('automation_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTasks((data as AutomationTask[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar tarefas';
      setError(message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (task: Partial<AutomationTask>): Promise<AutomationTask | null> => {
    if (!user) {
      setError('Você precisa estar logado para criar tarefas');
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('automation_tasks')
        .insert({
          ...task,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newTask = data as AutomationTask;
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      setError(message);
      console.error('Error creating task:', err);
      return null;
    }
  }, [user]);

  const updateTask = useCallback(async (id: string, updates: Partial<AutomationTask>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('automation_tasks')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setError(message);
      console.error('Error updating task:', err);
      return false;
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('automation_tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTasks(prev => prev.filter(task => task.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar tarefa';
      setError(message);
      console.error('Error deleting task:', err);
      return false;
    }
  }, []);

  const executeTask = useCallback(async (id: string): Promise<TaskExecutionLog | null> => {
    try {
      const { data, error: execError } = await supabase.functions.invoke('execute-action', {
        body: { task_id: id },
      });

      if (execError) throw execError;

      // Update task last_run_at
      await updateTask(id, { 
        last_run_at: new Date().toISOString(),
        run_count: (tasks.find(t => t.id === id)?.run_count || 0) + 1,
      });

      return data as TaskExecutionLog;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao executar tarefa';
      setError(message);
      console.error('Error executing task:', err);
      return null;
    }
  }, [tasks, updateTask]);

  const getTaskLogs = useCallback(async (taskId: string): Promise<TaskExecutionLog[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('task_execution_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      return (data as TaskExecutionLog[]) || [];
    } catch (err) {
      console.error('Error fetching task logs:', err);
      return [];
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    executeTask,
    getTaskLogs,
  };
};
