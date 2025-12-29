import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, BarChart3, CheckSquare, Settings, ChevronDown, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAIAgents, AIAgent } from '@/hooks/useAIAgents';
import { cn } from '@/lib/utils';
import { AgentConfigModal } from './AgentConfigModal';

interface AgentSelectorProps {
  selectedAgent: AIAgent | null;
  onSelectAgent: (agent: AIAgent | null) => void;
  className?: string;
}

const agentIcons: Record<AIAgent['type'], React.ReactNode> = {
  support: <Bot className="w-4 h-4" />,
  automation: <Settings className="w-4 h-4" />,
  task: <CheckSquare className="w-4 h-4" />,
  analysis: <BarChart3 className="w-4 h-4" />,
  custom: <Sparkles className="w-4 h-4" />,
};

const agentTypeLabels: Record<AIAgent['type'], string> = {
  support: 'Suporte',
  automation: 'Automação',
  task: 'Tarefas',
  analysis: 'Análise',
  custom: 'Personalizado',
};

export const AgentSelector = ({ selectedAgent, onSelectAgent, className }: AgentSelectorProps) => {
  const { agents, loading, refetch } = useAIAgents();
  const [isOpen, setIsOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);

  const groupedAgents = agents.reduce((acc, agent) => {
    if (!acc[agent.type]) {
      acc[agent.type] = [];
    }
    acc[agent.type].push(agent);
    return acc;
  }, {} as Record<AIAgent['type'], AIAgent[]>);

  const handleCreateNew = () => {
    setEditingAgent(null);
    setConfigModalOpen(true);
    setIsOpen(false);
  };

  const handleEditAgent = (e: React.MouseEvent, agent: AIAgent) => {
    e.stopPropagation();
    setEditingAgent(agent);
    setConfigModalOpen(true);
    setIsOpen(false);
  };

  const handleConfigSuccess = () => {
    refetch();
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 px-3 py-2 h-auto",
              "bg-orion-event-horizon/50 hover:bg-orion-event-horizon",
              "border border-primary/20 hover:border-primary/40",
              "text-orion-stellar-gold transition-all duration-300",
              className
            )}
            disabled={loading}
          >
            {selectedAgent ? (
              <>
                {agentIcons[selectedAgent.type]}
                <span className="text-sm truncate max-w-[120px]">{selectedAgent.name}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Orion Padrão</span>
              </>
            )}
            <ChevronDown className={cn(
              "w-3 h-3 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-72 bg-card/95 backdrop-blur-xl border-primary/20"
        >
          <DropdownMenuLabel className="text-primary flex items-center justify-between">
            <span>Selecionar Agente IA</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateNew}
              className="h-6 px-2 text-xs hover:bg-primary/10"
            >
              <Plus className="w-3 h-3 mr-1" />
              Novo
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              onSelectAgent(null);
              setIsOpen(false);
            }}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              !selectedAgent && "bg-primary/10"
            )}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <div className="flex flex-col flex-1">
              <span className="font-medium">Orion Padrão</span>
              <span className="text-xs text-muted-foreground">
                Assistente geral inteligente
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <AnimatePresence>
            {Object.entries(groupedAgents).map(([type, typeAgents]) => (
              <div key={type}>
                <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide py-1">
                  {agentTypeLabels[type as AIAgent['type']]}
                </DropdownMenuLabel>
                {typeAgents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        onSelectAgent(agent);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer group",
                        selectedAgent?.id === agent.id && "bg-primary/10"
                      )}
                    >
                      {agentIcons[agent.type]}
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{agent.name}</span>
                        {agent.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {agent.description}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleEditAgent(e, agent)}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </DropdownMenuItem>
                  </motion.div>
                ))}
              </div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando agentes...
            </div>
          )}

          {!loading && agents.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Nenhum agente personalizado</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNew}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Criar primeiro agente
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AgentConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        editingAgent={editingAgent}
        onSuccess={handleConfigSuccess}
      />
    </>
  );
};
