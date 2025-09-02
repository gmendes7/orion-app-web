import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button } from "./ui/button";

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
  handleLogout,
}: OrionSidebarProps) => {
  const { user } = useAuth();

  return (
    <AnimatePresence>
      {(isOpen || window.innerWidth >= 768) && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "bg-card/95 backdrop-blur-xl border-r border-orion-cosmic-blue/30 shadow-2xl",
            "fixed inset-y-0 left-0 z-50 w-80 md:relative md:translate-x-0 md:w-64 lg:w-80",
            "md:flex md:flex-col"
          )}
        >
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
            </div>

            {/* Lista de Conversas */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-orion-stellar-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                conversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer group transition-all duration-200",
                      currentConversationId === conv.id
                        ? "bg-orion-stellar-gold/20 border border-orion-stellar-gold/50 shadow-lg"
                        : "bg-orion-event-horizon hover:bg-orion-cosmic-blue/10 border border-orion-cosmic-blue/20"
                    )}
                    onClick={() => {
                      setCurrentConversationId(conv.id);
                      setIsOpen(false);
                    }}
                  >
                    {/* ... (conteúdo do item da conversa) ... */}
                  </motion.div>
                ))
              )}
            </div>

            {/* User Info and Logout */}
            <div className="p-4 border-t border-orion-cosmic-blue/20">
              {/* ... (conteúdo do rodapé do usuário) ... */}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
NEXT_PUBLIC_SUPABASE_URL=https://wcwwqfiolxcluyuhmxxf.supabase.co ;
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3dxZmlvbHhjbHV5dWhteHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTA4MDMsImV4cCI6MjA3MDY2NjgwM30.IZQUelbBZI492dffw3xd2eYtSn7lx7RcyuKYWtyaDDcimport 

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
  handleLogout,
}: OrionSidebarProps) => {
  const { user } = useAuth();

  return (
    <AnimatePresence>
      {(isOpen || window.innerWidth >= 768) && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "bg-card/95 backdrop-blur-xl border-r border-orion-cosmic-blue/30 shadow-2xl",
            "fixed inset-y-0 left-0 z-50 w-80 md:relative md:translate-x-0 md:w-64 lg:w-80",
            "md:flex md:flex-col"
          )}
        >
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
                  onClick
