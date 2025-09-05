import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUpload } from '@/components/DocumentUpload';
import { SemanticSearch } from '@/components/SemanticSearch';
import { ImageUploadWidget } from '@/components/ImageUploadWidget';
import { useToast } from '@/integrations/hooks/use-toast';
import { 
  FileText, 
  Search, 
  Image as ImageIcon,
  Database,
  Sparkles,
  Upload
} from 'lucide-react';

const Dashboard = () => {
  const { toast } = useToast();

  const handleDocumentProcessed = (documentId: string, chunksCreated: number) => {
    toast({
      title: "Documento processado!",
      description: `Documento salvo com ${chunksCreated} chunks para busca semântica`,
    });
  };

  const handleImageAnalysisComplete = (analysis: string, imageUrl: string) => {
    toast({
      title: "Imagem analisada!",
      description: "Use a análise no chat para interagir com O.R.I.Ö.N",
    });
  };

  const handleSearchResultSelect = (result: any) => {
    toast({
      title: "Resultado selecionado",
      description: "Use este conteúdo no chat para perguntas específicas",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orion-cosmic-blue to-orion-stellar-gold flex items-center justify-center">
              <Database className="w-5 h-5 text-orion-void" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-orion-stellar-gold stellar-text">
                O.R.I.Ö.N Dashboard
              </h1>
              <p className="text-orion-space-dust">
                Gerencie documentos, imagens e pesquisas semânticas
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-orion-event-horizon border border-orion-cosmic-blue/30">
              <TabsTrigger 
                value="documents" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orion-cosmic-blue data-[state=active]:to-orion-stellar-gold data-[state=active]:text-orion-void"
              >
                <FileText className="w-4 h-4 mr-2" />
                Documentos
              </TabsTrigger>
              <TabsTrigger 
                value="search"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orion-cosmic-blue data-[state=active]:to-orion-stellar-gold data-[state=active]:text-orion-void"
              >
                <Search className="w-4 h-4 mr-2" />
                Busca Semântica
              </TabsTrigger>
              <TabsTrigger 
                value="images"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orion-cosmic-blue data-[state=active]:to-orion-stellar-gold data-[state=active]:text-orion-void"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Análise de Imagens
              </TabsTrigger>
            </TabsList>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DocumentUpload onDocumentProcessed={handleDocumentProcessed} />
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <Card className="p-4 chat-message-orion border-orion-cosmic-blue/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-orion-cosmic-blue/20">
                      <FileText className="w-5 h-5 text-orion-cosmic-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-orion-space-dust">Documentos</p>
                      <p className="text-lg font-semibold text-foreground">-</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 chat-message-orion border-orion-cosmic-blue/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-orion-stellar-gold/20">
                      <Sparkles className="w-5 h-5 text-orion-stellar-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-orion-space-dust">Chunks</p>
                      <p className="text-lg font-semibold text-foreground">-</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 chat-message-orion border-orion-cosmic-blue/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-orion-accretion-disk/20">
                      <Upload className="w-5 h-5 text-orion-accretion-disk" />
                    </div>
                    <div>
                      <p className="text-sm text-orion-space-dust">Último Upload</p>
                      <p className="text-lg font-semibold text-foreground">-</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SemanticSearch onResultSelect={handleSearchResultSelect} />
              </motion.div>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ImageUploadWidget onAnalysisComplete={handleImageAnalysisComplete} />
              </motion.div>

              {/* Instructions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6 chat-message-orion border-orion-cosmic-blue/30">
                  <h4 className="font-semibold text-orion-stellar-gold mb-3">
                    Como usar a Análise de Imagens
                  </h4>
                  <div className="space-y-2 text-sm text-orion-space-dust">
                    <p>• Faça upload de imagens em JPG, PNG ou WebP</p>
                    <p>• A IA analisará automaticamente o conteúdo da imagem</p>
                    <p>• Use a análise no chat para fazer perguntas específicas</p>
                    <p>• Suporte para gráficos, diagramas, textos e objetos</p>
                  </div>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;