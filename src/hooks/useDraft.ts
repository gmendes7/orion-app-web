import { useEffect, useState } from "react";

/**
 * Hook para gerenciar o rascunho de uma conversa no localStorage.
 * @param conversationId - O ID da conversa atual.
 */
export const useDraft = (conversationId: string | null) => {
  const [draft, setDraft] = useState("");

  // Carrega o rascunho do localStorage quando a conversa muda
  useEffect(() => {
    if (!conversationId) return;
    const savedDraft = localStorage.getItem(`draft_${conversationId}`);
    setDraft(savedDraft || "");
  }, [conversationId]);

  // Salva o rascunho no localStorage a cada alteração
  useEffect(() => {
    if (!conversationId) return;
    localStorage.setItem(`draft_${conversationId}`, draft);
  }, [draft, conversationId]);

  return { draft, setDraft };
};
