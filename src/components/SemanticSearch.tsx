import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSemanticSearch, SearchResult } from '@/integrations/hooks/useSemanticSearch';
import { Search, FileText, ExternalLink, Loader2 } from 'lucide-react';

interface SemanticSearchProps {
  onResultSelect?: (result: SearchResult) => void;
}

export const SemanticSearch = ({ onResultSelect }: SemanticSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const { search, isSearching } = useSemanticSearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    const searchResult = await search(query);
    
    if (searchResult.success) {
      setResults(searchResult.results);
    } else {
      setResults([]);
    }
  };

  const formatSimilarityScore = (score: number) => {
    return `${(score * 100).toFixed(1)}%`;
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 chat-message-orion border-orion-cosmic-blue/30">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-orion-stellar-gold mb-2">
            Busca Semântica
          </h3>
          <p className="text-orion-space-dust">
            Pesquise nos seus documentos usando linguagem natural
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orion-cosmic-blue" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite sua pergunta ou termo de busca..."
              className="pl-10 bg-orion-event-horizon/50 border-orion-cosmic-blue/30 text-foreground placeholder-orion-space-dust focus:border-orion-stellar-gold/60"
              disabled={isSearching}
            />
          </div>
          <Button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="bg-gradient-to-r from-orion-cosmic-blue to-orion-stellar-gold text-orion-void font-semibold rounded-xl hover:opacity-90 transition-all duration-300"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </form>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-orion-stellar-gold">
                Resultados da Busca
              </h4>
              <Badge variant="secondary" className="bg-orion-cosmic-blue/20 text-orion-cosmic-blue border-orion-cosmic-blue/30">
                {results.length} resultado{results.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-3">
              {results.map((result, index) => (
                <motion.div
                  key={`${result.document_id}-${result.chunk_index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="p-4 chat-message-orion border-orion-cosmic-blue/20 hover:border-orion-stellar-gold/50 transition-all duration-300 cursor-pointer"
                    onClick={() => onResultSelect?.(result)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-orion-cosmic-blue" />
                        <h5 className="font-medium text-foreground">
                          {result.document_title}
                        </h5>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs border-orion-stellar-gold/30 text-orion-stellar-gold"
                        >
                          {formatSimilarityScore(result.similarity_score)} match
                        </Badge>
                        <ExternalLink className="w-3 h-3 text-orion-space-dust" />
                      </div>
                    </div>
                    
                    <p className="text-sm text-orion-space-dust leading-relaxed">
                      {truncateText(result.chunk_content)}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-orion-cosmic-blue/20">
                      <span className="text-xs text-orion-space-dust">
                        Chunk #{result.chunk_index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orion-cosmic-blue hover:text-orion-stellar-gold hover:bg-orion-stellar-gold/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onResultSelect?.(result);
                        }}
                      >
                        Usar no Chat
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {results.length === 0 && query && !isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Search className="w-12 h-12 text-orion-space-dust mx-auto mb-4 opacity-50" />
          <p className="text-orion-space-dust">
            Nenhum resultado encontrado para "{query}"
          </p>
        </motion.div>
      )}
    </div>
  );
};