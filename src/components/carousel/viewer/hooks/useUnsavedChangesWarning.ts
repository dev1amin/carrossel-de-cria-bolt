/**
 * Hook para avisar sobre alterações não salvas
 */

import { useEffect } from 'react';
import { handleBeforeUnload } from '../handlers/saveHandlers';

/**
 * Hook que avisa o usuário antes de sair com alterações não salvas
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean): void {
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      handleBeforeUnload(event, hasUnsavedChanges);
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handler);
    }

    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [hasUnsavedChanges]);
}
