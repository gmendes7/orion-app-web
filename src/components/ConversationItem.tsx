import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Conversation {
  id: string;
  title?: string;
  updated_at?: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  isCurrent: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: () => void;
}

export const ConversationItem = ({
  conversation,
  isCurrent,
  onSelect,
  onDelete,
  onRename,
}: ConversationItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg cursor-pointer group transition-all duration-200 flex items-center justify-between",
        isCurrent
          ? "bg-orion-stellar-gold/20 border border-orion-stellar-gold/50 shadow-lg"
          : "bg-orion-event-horizon hover:bg-orion-cosmic-blue/10 border border-orion-cosmic-blue/20"
      )}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-orion-stellar-gold truncate">
          {conversation.title || "Nova Conversa"}
        </p>
        <p className="text-xs text-yellow-500 mt-1">
          {conversation.updated_at
            ? new Date(conversation.updated_at).toLocaleDateString("pt-BR")
            : "Agora"}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-orion-cosmic-blue/20 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4 text-orion-space-dust" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="w-4 h-4 mr-2" />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-red-500">
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};
