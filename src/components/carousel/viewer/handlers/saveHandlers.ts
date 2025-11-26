/**
 * Handlers para salvamento e download de carrosséis
 * @description Funções utilitárias para operações de salvamento.
 * NOTA: As funções de download que usavam html2canvas foram removidas
 * pois a biblioteca não está instalada. O CarouselViewer usa downloadSlidesAsPNG
 * do serviço de download dedicado.
 */

import { getIframeHTML } from '../utils/iframeHelpers';

/**
 * Verifica se há alterações não salvas antes de sair
 */
export function handleBeforeUnload(
  event: BeforeUnloadEvent,
  hasUnsavedChanges: boolean
): void {
  if (hasUnsavedChanges) {
    event.preventDefault();
    event.returnValue = '';
  }
}

/**
 * Exporta carrossel como JSON
 */
export function handleExportJSON(
  contentId: number | undefined,
  renderedSlides: string[],
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  editedContent: Record<string, any>,
  addToast: (message: string, type: 'success' | 'error') => void
): void {
  try {
    const exportData = {
      contentId,
      slides: iframeRefs.current.map((iframe, index) => {
        if (iframe) {
          return getIframeHTML(iframe);
        }
        return renderedSlides[index] || '';
      }),
      editedContent,
      exportDate: new Date().toISOString(),
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `carousel-${contentId || 'export'}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('Carrossel exportado como JSON', 'success');
  } catch (error) {
    console.error('Erro ao exportar JSON:', error);
    addToast('Erro ao exportar JSON', 'error');
  }
}

/**
 * Exporta HTML de um slide específico
 */
export function handleExportSlideHTML(
  slideIndex: number,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  addToast: (message: string, type: 'success' | 'error') => void
): void {
  const iframe = iframeRefs.current[slideIndex];
  if (!iframe) {
    addToast('Slide não encontrado', 'error');
    return;
  }

  try {
    const html = getIframeHTML(iframe);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `slide-${slideIndex + 1}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast(`HTML do slide ${slideIndex + 1} exportado`, 'success');
  } catch (error) {
    console.error('Erro ao exportar HTML:', error);
    addToast('Erro ao exportar HTML', 'error');
  }
}

/**
 * Descarta alterações e recarrega slides originais
 */
export function handleDiscardChanges(
  originalSlides: string[],
  setRenderedSlides: (value: string[]) => void,
  setEditedContent: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void,
  addToast: (message: string, type: 'success' | 'error') => void
): void {
  if (!confirm('Descartar todas as alterações não salvas?')) {
    return;
  }

  setRenderedSlides([...originalSlides]);
  setEditedContent({});
  setHasUnsavedChanges(false);

  addToast('Alterações descartadas', 'success');
}
