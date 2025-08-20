import { useMemo } from 'react';

export const useMarkdownRenderer = () => {
  const renderMarkdown = useMemo(() => {
    return (text: string) => {
      // Renderizar markdown básico para melhor apresentação
      return text
        // Negrito
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Itálico
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
        // Quebras de linha
        .replace(/\n/g, '<br />');
    };
  }, []);

  return { renderMarkdown };
};