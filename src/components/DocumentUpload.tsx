import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/integrations/hooks/use-toast';
import { useDocumentProcessor } from '@/integrations/hooks/useDocumentProcessor';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle,
  Loader2,
  File
} from 'lucide-react';

interface DocumentUploadProps {
  onDocumentProcessed?: (documentId: string, chunksCreated: number) => void;
}

export const DocumentUpload = ({ onDocumentProcessed }: DocumentUploadProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { processDocument, isProcessing } = useDocumentProcessor();

  const handleFileSelect = (file: File) => {
    if (file.type === 'text/plain' || file.type === 'application/pdf') {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.split('.')[0]);
      }
      
      // Read text content
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setContent(text);
        };
        reader.readAsText(file);
      }
    } else {
      toast({
        title: "Arquivo não suportado",
        description: "Por favor, selecione um arquivo .txt ou .pdf",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título e o conteúdo do documento",
        variant: "destructive",
      });
      return;
    }

    const result = await processDocument(content, title, selectedFile?.type || 'text');
    
    if (result.success) {
      toast({
        title: "Documento processado!",
        description: `${result.chunks_created} chunks criados com sucesso`,
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (onDocumentProcessed && result.document_id) {
        onDocumentProcessed(result.document_id, result.chunks_created || 0);
      }
    } else {
      toast({
        title: "Erro ao processar documento",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6 chat-message-orion border-orion-cosmic-blue/30">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-orion-stellar-gold mb-2">
          Upload de Documento
        </h3>
        <p className="text-orion-space-dust">
          Faça upload de documentos para busca semântica e chat com IA
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isDragOver
              ? 'border-orion-stellar-gold bg-orion-stellar-gold/5'
              : 'border-orion-cosmic-blue/30 hover:border-orion-cosmic-blue/50'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
        >
          {selectedFile ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between p-4 bg-orion-event-horizon/50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <File className="w-6 h-6 text-orion-cosmic-blue" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-orion-space-dust">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-orion-space-dust hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <div>
              <Upload className="w-12 h-12 text-orion-cosmic-blue mx-auto mb-4" />
              <p className="text-foreground mb-2">
                Arraste um arquivo aqui ou clique para selecionar
              </p>
              <p className="text-sm text-orion-space-dust mb-4">
                Suporte para arquivos .txt e .pdf (máx. 10MB)
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-orion-cosmic-blue/30 text-orion-cosmic-blue hover:bg-orion-cosmic-blue/10"
              >
                <FileText className="w-4 h-4 mr-2" />
                Selecionar Arquivo
              </Button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-orion-stellar-gold">
            Título do Documento
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título do documento"
            className="bg-orion-event-horizon/50 border-orion-cosmic-blue/30 text-foreground placeholder-orion-space-dust focus:border-orion-stellar-gold/60"
            required
          />
        </div>

        {/* Content Textarea */}
        <div className="space-y-2">
          <Label htmlFor="content" className="text-orion-stellar-gold">
            Conteúdo
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cole ou digite o conteúdo do documento aqui..."
            className="min-h-[200px] bg-orion-event-horizon/50 border-orion-cosmic-blue/30 text-foreground placeholder-orion-space-dust focus:border-orion-stellar-gold/60 resize-none"
            required
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isProcessing || !title.trim() || !content.trim()}
          className="w-full bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold text-orion-void font-semibold rounded-xl hover:opacity-90 transition-all duration-300"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Processar Documento
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};