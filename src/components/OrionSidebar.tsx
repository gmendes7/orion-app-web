/**
 * 🎛️ OrionSidebar - Sidebar do chat JARVIS
 * 
 * Versão single-user sem autenticação.
 */

import { AnimatePresence } from "framer-motion";
import { Plus, X, Database, User, Shield, Key, Bot } from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { useState } from "react";
import { AgentSelector } from "./AgentSelector";
import { useAIAgents, AIAgent } from "@/hooks/useAIAgents";

interface Conversation {
  id: string;
  title?: string;
  updated_at?: string;
  updatedAt?: Date;
}

interface OrionSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string) => void;
  loading: boolean;
  createNewConversation: () => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  handleLogout: () => void;
}

export const OrionSidebar = ({
  isOpen,
  setIsOpen,
  conversations,
  currentConversationId,
  setCurrentConversationId,
  loading,
  createNewConversation,
  deleteConversation,
  renameConversation,
  handleLogout: _handleLogout,
}: OrionSidebarProps) => {
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  // Agent selection for mobile
  const { agents } = useAIAgents();
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  
  const handleSelectAgent = (agent: AIAgent | null) => {
    setSelectedAgent(agent);
  };

  // Username para modo single-user
  const username = "Usuário JARVIS";
  
  // Para compatibilidade - não usamos mais
  void agents;

  return (
    <AnimatePresence>
      {(isOpen || window.innerWidth >= 768) && (
        <div className="fixed inset-y-0 left-0 z-50 w-[280px] xs:w-[300px] sm:w-80 md:relative md:translate-x-0 md:w-64 lg:w-80 bg-card/95 backdrop-blur-xl border-r border-orion-cosmic-blue/30 shadow-2xl md:flex md:flex-col">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header do Sidebar */}
            <div className="p-3 sm:p-4 border-b border-orion-cosmic-blue/20 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-bold text-orion-stellar-gold">
                  Conversas
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="md:hidden text-orion-cosmic-blue hover:text-orion-stellar-gold h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={createNewConversation}
                className="w-full bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold hover:opacity-90 text-orion-void font-medium text-sm h-9"
              >
                <Plus className="w-3.5 h-3.5 mr-2" />
                Nova Conversa
              </Button>

              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="w-full mt-2 border-orion-cosmic-blue/30 text-orion-cosmic-blue hover:bg-orion-cosmic-blue/10 text-sm h-9"
              >
                <Database className="w-3.5 h-3.5 mr-2" />
                Dashboard
              </Button>

              <Button
                onClick={() => navigate('/api-dashboard')}
                variant="outline"
                className="w-full mt-2 border-orion-stellar-gold/30 text-orion-stellar-gold hover:bg-orion-stellar-gold/10 text-sm h-9"
              >
                <Key className="w-3.5 h-3.5 mr-2" />
                API Keys
              </Button>

              {/* Mobile Agent Selector */}
              <div className="mt-3 sm:hidden">
                <p className="text-xs text-orion-space-dust mb-2 flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  Agente IA
                </p>
                <AgentSelector
                  selectedAgent={selectedAgent}
                  onSelectAgent={handleSelectAgent}
                  className="w-full justify-start"
                />
              </div>
            </div>

            {/* Lista de Conversas */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-orion-stellar-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isCurrent={currentConversationId === conv.id}
                    onSelect={() => {
                      setCurrentConversationId(conv.id);
                      setIsOpen(false);
                    }}
                    onDelete={() => deleteConversation(conv.id)}
                    onRename={() => {
                      const newTitle = prompt("Novo título:", conv.title);
                      if (newTitle && newTitle.trim() !== "") {
                        renameConversation(conv.id, newTitle.trim());
                      }
                    }}
                  />
                ))
              )}
            </div>

            {/* User Info and Logout */}
            <div className="p-3 sm:p-4 border-t border-orion-cosmic-blue/20 space-y-2 flex-shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-orion-cosmic-blue to-orion-stellar-gold flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orion-void" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                    {username}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    O.R.I.Ö.N Assistant
                  </p>
                </div>
              </div>
              
              {/* Privacy Button */}
              <Button
                onClick={() => setShowPrivacyPolicy(true)}
                variant="outline"
                className="w-full border-border/30 text-muted-foreground hover:bg-primary/10 hover:text-primary text-xs h-8"
                size="sm"
              >
                <Shield className="w-3.5 h-3.5 mr-2" />
                <span>Privacidade e LGPD</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Privacy Policy Dialog */}
      <PrivacyPolicy 
        open={showPrivacyPolicy} 
        onOpenChange={setShowPrivacyPolicy} 
      />
    </AnimatePresence>
  );
};
