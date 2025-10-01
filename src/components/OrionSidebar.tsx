import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import { Plus, X, Database, LogOut, User, Shield } from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { useState } from "react";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
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
  handleLogout,
}: OrionSidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  return (
    <AnimatePresence>
      {(isOpen || window.innerWidth >= 768) && (
        <div className="fixed inset-y-0 left-0 z-50 w-80 md:relative md:translate-x-0 md:w-64 lg:w-80 bg-card/95 backdrop-blur-xl border-r border-orion-cosmic-blue/30 shadow-2xl md:flex md:flex-col">
          <div className="flex flex-col h-full">
            {/* Header do Sidebar */}
            <div className="p-4 border-b border-orion-cosmic-blue/20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-orion-stellar-gold">
                  Conversas
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="md:hidden text-orion-cosmic-blue hover:text-orion-stellar-gold"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <Button
                onClick={createNewConversation}
                className="w-full mt-3 bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold hover:opacity-90 text-orion-void font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conversa
              </Button>

              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="w-full mt-2 border-orion-cosmic-blue/30 text-orion-cosmic-blue hover:bg-orion-cosmic-blue/10"
              >
                <Database className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
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
            <div className="p-4 border-t border-orion-cosmic-blue/20 space-y-2">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orion-cosmic-blue to-orion-stellar-gold flex items-center justify-center">
                  <User className="w-4 h-4 text-orion-void" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-orion-space-dust">
                    O.R.I.Ö.N Assistant
                  </p>
                </div>
              </div>
              
              {/* Privacy Button */}
              <Button
                onClick={() => setShowPrivacyPolicy(true)}
                variant="outline"
                className="w-full border-orion-cosmic-blue/30 text-orion-space-dust hover:bg-orion-cosmic-blue/10 hover:text-orion-stellar-gold"
                size="sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                <span className="text-xs">Privacidade e LGPD</span>
              </Button>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
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
