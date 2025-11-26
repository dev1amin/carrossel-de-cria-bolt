/**
 * Hook para configurar event listeners nos iframes
 */

import { useEffect } from 'react';
import { waitForIframeLoad, injectStylesIntoIframe } from '../utils/iframeHelpers';
import { handleElementClick } from '../handlers/selectionHandlers';

/**
 * Estilos CSS para injetar nos iframes
 */
const IFRAME_STYLES = `
  * {
    cursor: default;
    user-select: none;
  }
  
  .selected-element {
    outline: 2px solid #3b82f6 !important;
    outline-offset: 2px;
  }
  
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  
  [contenteditable="true"] {
    cursor: text;
    user-select: text;
  }
`;

/**
 * Hook que configura event listeners e estilos dos iframes
 */
export function useIframeEventListeners(
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  renderedSlides: string[],
  setSelectedElement: (value: { slideIndex: number; element: any }) => void,
  setFocusedSlide: (value: number) => void,
  setIsLoadingProperties: (value: boolean) => void,
  setElementStyles: (value: any) => void,
  setOriginalStyles: (value: any) => void,
  disposersRef: React.MutableRefObject<Array<() => void>>
): void {
  useEffect(() => {
    // Limpa listeners anteriores
    disposersRef.current.forEach((dispose) => dispose());
    disposersRef.current = [];

    // Configura cada iframe
    iframeRefs.current.forEach((iframe, slideIndex) => {
      if (!iframe) return;

      waitForIframeLoad(iframe).then(() => {
        // Injeta estilos
        injectStylesIntoIframe(iframe, IFRAME_STYLES);

        // Adiciona event listener para cliques
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        const clickHandler = (event: MouseEvent) => {
          handleElementClick(
            event,
            slideIndex,
            iframeRefs,
            setSelectedElement,
            setFocusedSlide,
            setIsLoadingProperties,
            setElementStyles,
            setOriginalStyles
          );
        };

        doc.addEventListener('click', clickHandler);

        // Adiciona disposer para cleanup
        disposersRef.current.push(() => {
          doc.removeEventListener('click', clickHandler);
        });
      });
    });

    // Cleanup na desmontagem
    return () => {
      disposersRef.current.forEach((dispose) => dispose());
      disposersRef.current = [];
    };
  }, [
    renderedSlides,
    iframeRefs,
    setSelectedElement,
    setFocusedSlide,
    setIsLoadingProperties,
    setElementStyles,
    setOriginalStyles,
    disposersRef,
  ]);
}
