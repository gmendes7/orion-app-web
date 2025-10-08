import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import { Plus, X, Database, LogOut, User, Shield, Key } from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  title?: string;
  updated_at?: string;
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
  const [username, setUsername] = useState<string>('');

  // Busca o username do perfil do usuário
  useEffect(() => {
    const fetchUsername = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (data?.username) {
          setUsername(data.username);
        }
      }
    };
    fetchUsername();
  }, [user?.id]);

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
                    {username || user?.email}
                  </p>
                  <p className="text-[10px] sm:text-xs text-orion-space-dust truncate">
                    O.R.I.Ö.N Assistant
                  </p>
                </div>
              </div>
              
              {/* Privacy Button */}
              <Button
                onClick={() => setShowPrivacyPolicy(true)}
                variant="outline"
                className="w-full border-orion-cosmic-blue/30 text-orion-space-dust hover:bg-orion-cosmic-blue/10 hover:text-orion-stellar-gold text-xs h-8"
                size="sm"
              >
                <Shield className="w-3.5 h-3.5 mr-2" />
                <span>Privacidade e LGPD</span>
              </Button>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 text-xs h-8"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
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
