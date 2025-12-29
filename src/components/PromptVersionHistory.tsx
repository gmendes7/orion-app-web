import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, RotateCcw, Trash2, Eye, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { usePromptVersions, PromptVersion } from '@/hooks/usePromptVersions';
import { useToast } from '@/integrations/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PromptVersionHistoryProps {
  agentId: string | null;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRevert?: () => void;
}

export const PromptVersionHistory = ({
  agentId,
  agentName,
  open,
  onOpenChange,
  onRevert,
}: PromptVersionHistoryProps) => {
  const { versions, loading, fetchVersions, revertToVersion, deleteVersion } = usePromptVersions(agentId);
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<PromptVersion | null>(null);

  useEffect(() => {
    if (open && agentId) {
      fetchVersions();
    }
  }, [open, agentId, fetchVersions]);

  const handleRevert = async (version: PromptVersion) => {
    const success = await revertToVersion(version.id);
    if (success) {
      toast({
        title: 'Versão restaurada',
        description: `Prompt revertido para a versão ${version.version_number}`,
      });
      onRevert?.();
    } else {
      toast({
        title: 'Erro ao reverter',
        description: 'Não foi possível reverter para esta versão',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (version: PromptVersion) => {
    if (version.is_active) {
      toast({
        title: 'Não é possível deletar',
        description: 'Não é possível deletar a versão ativa',
        variant: 'destructive',
      });
      return;
    }

    const success = await deleteVersion(version.id);
    if (success) {
      toast({
        title: 'Versão removida',
        description: `Versão ${version.version_number} foi removida`,
      });
    } else {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover esta versão',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] bg-card/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <History className="w-5 h-5" />
              Histórico de Versões
            </DialogTitle>
            <DialogDescription>
              Versões do prompt do agente "{agentName}"
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma versão encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {versions.map((version, index) => (
                    <motion.div
                      key={version.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Collapsible
                        open={expandedId === version.id}
                        onOpenChange={(isOpen) => setExpandedId(isOpen ? version.id : null)}
                      >
                        <div className={cn(
                          "rounded-xl border transition-all",
                          version.is_active 
                            ? "border-primary/50 bg-primary/5" 
                            : "border-border/50 bg-background/50"
                        )}>
                          <CollapsibleTrigger asChild>
                            <button className="w-full p-3 sm:p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors rounded-xl">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm sm:text-base">
                                    Versão {version.version_number}
                                  </span>
                                  {version.is_active && (
                                    <Badge variant="default" className="text-xs">
                                      Ativa
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(version.created_at)}
                                </div>
                                {version.change_description && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {version.change_description}
                                  </p>
                                )}
                              </div>
                              {expandedId === version.id ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="px-3 pb-3 sm:px-4 sm:pb-4 space-y-3">
                              <div className="bg-muted/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                                  {version.system_prompt}
                                </pre>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewVersion(version)}
                                  className="text-xs h-8"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver completo
                                </Button>
                                
                                {!version.is_active && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRevert(version)}
                                      className="text-xs h-8 text-primary border-primary/30 hover:bg-primary/10"
                                    >
                                      <RotateCcw className="w-3 h-3 mr-1" />
                                      Restaurar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(version)}
                                      className="text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Excluir
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] bg-card/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-primary">
              Versão {previewVersion?.version_number} - Preview
            </DialogTitle>
            <DialogDescription>
              {previewVersion && formatDate(previewVersion.created_at)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/30 rounded-lg p-4">
              {previewVersion?.system_prompt}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};
