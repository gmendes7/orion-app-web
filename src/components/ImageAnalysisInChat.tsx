import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useImageUpload } from '@/integrations/hooks/useImageUpload';
import { useToast } from '@/integrations/hooks/use-toast';
import { Image as ImageIcon, X, Loader2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageAnalysisInChatProps {
  onAnalysisComplete: (analysis: string) => void;
}

/**
 * 🖼️ Componente de Análise de Imagem no Chat
 * 
 * Permite upload rápido de imagens durante a conversa
 * para análise automática pela IA.
 * 
 * Features:
 * - Drag & drop
 * - Preview da imagem
 * - Análise automática via edge function
 * - Feedback visual do processo
 */
export const ImageAnalysisInChat = ({ onAnalysisComplete }: ImageAnalysisInChatProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
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
    maxSize: 10,
    onAnalysisComplete: (analysis) => {
      onAnalysisComplete(analysis);
      toast({
        title: "Imagem analisada!",
        description: "Confira a análise abaixo",
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
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <AnimatePresence>
        {!uploadedImage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative overflow-hidden
                border-2 border-dashed transition-all duration-300 cursor-pointer
                ${isDragging 
                  ? 'border-orion-stellar-gold bg-orion-stellar-gold/10 scale-[1.02]' 
                  : 'border-orion-cosmic-blue/30 hover:border-orion-stellar-gold/50 hover:bg-orion-cosmic-blue/5'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-6 text-center space-y-3">
                <div className={`
                  w-12 h-12 mx-auto rounded-xl flex items-center justify-center
                  ${isDragging ? 'bg-orion-stellar-gold/20' : 'bg-orion-cosmic-blue/20'}
                `}>
                  <Upload className={`w-6 h-6 ${isDragging ? 'text-orion-stellar-gold' : 'text-orion-cosmic-blue'}`} />
                </div>
                
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isDragging ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
                  </p>
                  <p className="text-xs text-orion-space-dust mt-1">
                    PNG, JPG ou WEBP (máx. 10MB)
                  </p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview */}
      <AnimatePresence>
        {uploadedImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="relative overflow-hidden border-orion-cosmic-blue/30">
              {/* Close Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={clearImage}
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-orion-void/80 hover:bg-orion-void/90 text-orion-stellar-gold"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Image */}
              <div className="relative aspect-video bg-orion-event-horizon">
                <img
                  src={uploadedImage.preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                
                {/* Loading Overlay */}
                {(isUploading || isAnalyzing) && (
                  <div className="absolute inset-0 bg-orion-void/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-orion-stellar-gold animate-spin mb-2" />
                    <p className="text-sm text-orion-stellar-gold">
                      {isUploading ? 'Enviando...' : 'Analisando imagem...'}
                    </p>
                  </div>
                )}
              </div>

              {/* Analysis Result */}
              {uploadedImage.analysis && (
                <div className="p-4 bg-gradient-to-r from-orion-cosmic-blue/10 to-orion-stellar-gold/10 border-t border-orion-cosmic-blue/20">
                  <div className="flex items-start gap-2">
                    <ImageIcon className="w-4 h-4 text-orion-stellar-gold mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground leading-relaxed">
                      {uploadedImage.analysis}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-3 bg-destructive/10 border-destructive/30">
            <p className="text-sm text-destructive">{error}</p>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
