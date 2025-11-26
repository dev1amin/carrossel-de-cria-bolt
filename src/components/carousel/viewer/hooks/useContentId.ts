/**
 * Hook para buscar e gerenciar o ID de conteúdo gerado
 */

import { useEffect } from 'react';

/**
 * Hook que busca o generatedContentId se não foi fornecido nas props
 */
export function useContentId(
  initialContentId: number | undefined,
  setContentId: (id: number | undefined) => void,
  addToast: (message: string, type: 'success' | 'error') => void
): void {
  useEffect(() => {
    if (initialContentId) {
      setContentId(initialContentId);
      return;
    }

    // Se não tem ID, tenta buscar da query string
    const searchParams = new URLSearchParams(window.location.search);
    const idFromQuery = searchParams.get('contentId');

    if (idFromQuery) {
      const parsedId = parseInt(idFromQuery, 10);
      if (!isNaN(parsedId)) {
        setContentId(parsedId);
      }
    }
  }, [initialContentId, setContentId, addToast]);
}
