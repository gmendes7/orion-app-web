import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, BarChart3, CheckSquare, Settings, X, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAIAgents, AIAgent } from '@/hooks/useAIAgents';
import { useToast } from '@/integrations/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AgentConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAgent?: AIAgent | null;
  onSuccess?: () => void;
}

const agentTypes = [
  { value: 'support', label: 'Suporte', icon: Bot, description: 'Atendimento e ajuda ao usuário' },
  { value: 'automation', label: 'Automação', icon: Settings, description: 'Tarefas automatizadas' },
  { value: 'task', label: 'Tarefas', icon: CheckSquare, description: 'Gerenciamento de tarefas' },
  { value: 'analysis', label: 'Análise', icon: BarChart3, description: 'Análise de dados e insights' },
  { value: 'custom', label: 'Personalizado', icon: Sparkles, description: 'Agente totalmente customizado' },
] as const;

const agentModels = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recomendado)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (Mais Poderoso)' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Rápido)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
  { value: 'openai/gpt-5', label: 'GPT-5 (Premium)' },
];

const defaultPrompts: Record<string, string> = {
  support: `Você é um assistente de suporte amigável e profissional. Sua função é ajudar os usuários com suas dúvidas e problemas de forma clara e objetiva. Sempre:
- Seja cordial e empático
- Forneça respostas precisas e úteis
- Peça esclarecimentos quando necessário
- Ofereça alternativas quando possível`,
  automation: `Você é um especialista em automação de processos. Sua função é ajudar a criar, configurar e otimizar fluxos de trabalho automatizados. Foque em:
- Identificar tarefas repetitivas
- Sugerir automações eficientes
- Explicar configurações de forma clara
- Priorizar produtividade`,
  task: `Você é um gerenciador de tarefas inteligente. Ajude os usuários a organizar, priorizar e acompanhar suas atividades. Sempre:
- Ajude a definir prioridades
- Sugira prazos realistas
- Quebre tarefas grandes em subtarefas
- Acompanhe o progresso`,
  analysis: `Você é um analista de dados especializado. Sua função é interpretar informações, identificar padrões e gerar insights acionáveis. Foque em:
- Analisar dados com precisão
- Identificar tendências e padrões
- Apresentar insights de forma clara
- Sugerir ações baseadas em dados`,
  custom: `Você é um assistente de IA versátil. Adapte suas respostas às necessidades específicas do usuário.`,
};

export const AgentConfigModal = ({
  open,
  onOpenChange,
  editingAgent,
  onSuccess,
}: AgentConfigModalProps) => {
  const { createAgent, updateAgent, deleteAgent, loading } = useAIAgents();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'custom' as AIAgent['type'],
    system_prompt: defaultPrompts.custom,
    model: 'google/gemini-2.5-flash',
    temperature: 0.7,
    max_tokens: 2048,
    is_public: false,
    is_active: true,
  });
  
  const [isDeleting, setIsDeleting] = useState(false);

  // Load editing agent data
  useEffect(() => {
    if (editingAgent) {
      setFormData({
        name: editingAgent.name,
        description: editingAgent.description || '',
        type: editingAgent.type,
        system_prompt: editingAgent.system_prompt,
        model: editingAgent.model || 'google/gemini-2.5-flash',
        temperature: editingAgent.temperature ?? 0.7,
        max_tokens: editingAgent.max_tokens ?? 2048,
        is_public: editingAgent.is_public ?? false,
        is_active: editingAgent.is_active ?? true,
      });
    } else {
      resetForm();
    }
  }, [editingAgent, open]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'custom',
      system_prompt: defaultPrompts.custom,
      model: 'google/gemini-2.5-flash',
      temperature: 0.7,
      max_tokens: 2048,
      is_public: false,
      is_active: true,
    });
  };

  const handleTypeChange = (newType: AIAgent['type']) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      system_prompt: prev.system_prompt === defaultPrompts[prev.type] 
        ? defaultPrompts[newType] 
        : prev.system_prompt,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, insira um nome para o agente.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.system_prompt.trim()) {
      toast({
        title: 'Prompt obrigatório',
        description: 'Por favor, defina um prompt de sistema para o agente.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingAgent) {
        await updateAgent(editingAgent.id, formData);
        toast({
          title: 'Agente atualizado',
          description: `${formData.name} foi atualizado com sucesso.`,
        });
      } else {
        await createAgent(formData);
        toast({
          title: 'Agente criado',
          description: `${formData.name} foi criado com sucesso.`,
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o agente. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!editingAgent) return;
    
    setIsDeleting(true);
    try {
      await deleteAgent(editingAgent.id);
      toast({
        title: 'Agente removido',
        description: `${editingAgent.name} foi removido com sucesso.`,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o agente. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedTypeInfo = agentTypes.find(t => t.value === formData.type);
  const TypeIcon = selectedTypeInfo?.icon || Sparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <TypeIcon className="w-5 h-5" />
            {editingAgent ? 'Editar Agente' : 'Criar Novo Agente'}
          </DialogTitle>
          <DialogDescription>
            Configure um agente de IA personalizado com comportamento específico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Agente *</Label>
              <Input
                id="name"
                placeholder="Ex: Assistente de Vendas"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-background/50 border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Agente</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleTypeChange(value as AIAgent['type'])}
              >
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTypeInfo && (
                <p className="text-xs text-muted-foreground">{selectedTypeInfo.description}</p>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Breve descrição do que este agente faz"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-background/50 border-primary/20"
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="system_prompt">Prompt de Sistema *</Label>
            <Textarea
              id="system_prompt"
              placeholder="Defina a personalidade e comportamento do agente..."
              value={formData.system_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
              className="min-h-[150px] bg-background/50 border-primary/20 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Este prompt define como o agente se comporta e responde. Seja específico e detalhado.
            </p>
          </div>

          {/* Modelo e Configurações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modelo de IA</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
              >
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agentModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Tokens: {formData.max_tokens}</Label>
              <Slider
                value={[formData.max_tokens]}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, max_tokens: value }))}
                min={256}
                max={8192}
                step={256}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">
                Limite de tokens na resposta
              </p>
            </div>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <Label>Temperatura: {formData.temperature.toFixed(1)}</Label>
            <Slider
              value={[formData.temperature]}
              onValueChange={([value]) => setFormData(prev => ({ ...prev, temperature: value }))}
              min={0}
              max={1}
              step={0.1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mais preciso</span>
              <span>Mais criativo</span>
            </div>
          </div>

          {/* Switches */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label className="cursor-pointer">Ativo</Label>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
              />
              <Label className="cursor-pointer">Público (visível para outros usuários)</Label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {editingAgent && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || isDeleting}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Removendo...' : 'Remover'}
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-none bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold text-orion-void"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : editingAgent ? 'Atualizar' : 'Criar Agente'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
