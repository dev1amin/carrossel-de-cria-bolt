/**
 * Hook para gerenciar auto-download de slides
 */

import { useEffect } from 'react';
import { handleAutoDownload } from '../handlers/saveHandlers';

/**
 * Hook que executa auto-download dos slides após renderização
 */
export function useAutoDownload(
  autoDownloadExecuted: boolean,
  contentId: number | undefined,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  slideWidth: number,
  slideHeight: number,
  setAutoDownloadExecuted: (value: boolean) => void,
  addToast: (message: string, type: 'success' | 'error') => void,
  enabled: boolean = false
): void {
  useEffect(() => {
    if (!enabled) return;

    handleAutoDownload(
      autoDownloadExecuted,
      contentId,
      iframeRefs,
      slideWidth,
      slideHeight,
      setAutoDownloadExecuted,
      addToast
    );
  }, [
    enabled,
    autoDownloadExecuted,
    contentId,
    iframeRefs,
    slideWidth,
    slideHeight,
    setAutoDownloadExecuted,
    addToast,
  ]);
}
