import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useImageUpload } from '@/integrations/hooks/useImageUpload';
import { useToast } from '@/integrations/hooks/use-toast';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Loader2,
  Eye,
  Sparkles
} from 'lucide-react';

interface ImageUploadWidgetProps {
  onAnalysisComplete?: (analysis: string, imageUrl: string) => void;
}

export const ImageUploadWidget = ({ onAnalysisComplete }: ImageUploadWidgetProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { 
    uploadImage, 
    clearImage, 
    uploadedImage, 
    state, 
    error,
    isUploading,
    isAnalyzing 
  } = useImageUpload({
    maxSize: 10, // 10MB
    onAnalysisComplete: (analysis) => {
      if (uploadedImage?.preview) {
        onAnalysisComplete?.(analysis, uploadedImage.preview);
      }
      toast({
        title: "Imagem analisada!",
        description: "A análise da imagem foi concluída com sucesso",
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      uploadImage(file);
    }
  };

  if (error) {
    toast({
      title: "Erro no upload",
      description: error,
      variant: "destructive",
    });
  }

  return (
    <Card className="p-6 chat-message-orion border-orion-cosmic-blue/30">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-orion-stellar-gold mb-2">
          Análise de Imagem
        </h3>
        <p className="text-orion-space-dust text-sm">
          Faça upload de uma imagem para análise com IA
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!uploadedImage ? (
          <motion.div
            key="upload-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-2 border-dashed border-orion-cosmic-blue/30 rounded-xl p-8 text-center hover:border-orion-cosmic-blue/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <ImageIcon className="w-12 h-12 text-orion-cosmic-blue mx-auto mb-4" />
            <p className="text-foreground mb-2">
              Arraste uma imagem aqui ou clique para selecionar
            </p>
            <p className="text-sm text-orion-space-dust mb-4">
              JPG, PNG ou WebP (máx. 10MB)
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-orion-cosmic-blue/30 text-orion-cosmic-blue hover:bg-orion-cosmic-blue/10"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Imagem
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        ) : (
          <motion.div
            key="image-preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            {/* Image Preview */}
            <div className="relative rounded-xl overflow-hidden bg-orion-event-horizon/30">
              <img
                src={uploadedImage.preview}
                alt="Imagem enviada"
                className="w-full h-48 object-cover"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center space-x-2 py-4">
              {isUploading && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-orion-cosmic-blue" />
                  <span className="text-orion-cosmic-blue">Enviando...</span>
                </>
              )}
              
              {isAnalyzing && (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse text-orion-stellar-gold" />
                  <span className="text-orion-stellar-gold">Analisando...</span>
                </>
              )}
              
              {state === 'complete' && uploadedImage.analysis && (
                <>
                  <Eye className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Análise concluída!</span>
                </>
              )}
            </div>

            {/* Analysis Result */}
            {uploadedImage.analysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orion-event-horizon/50 rounded-xl p-4 border border-orion-cosmic-blue/20"
              >
                <h4 className="font-medium text-orion-stellar-gold mb-2">
                  Análise da Imagem:
                </h4>
                <p className="text-sm text-orion-space-dust leading-relaxed">
                  {uploadedImage.analysis}
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-orion-cosmic-blue/30 text-orion-cosmic-blue hover:bg-orion-cosmic-blue/10"
              >
                <Upload className="w-4 h-4 mr-2" />
                Nova Imagem
              </Button>
              
              {uploadedImage.analysis && (
                <Button
                  onClick={() => onAnalysisComplete?.(uploadedImage.analysis!, uploadedImage.preview)}
                  className="flex-1 bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold text-orion-void font-semibold"
                >
                  Usar no Chat
                </Button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};