/**
 * Handlers para seleção e foco de elementos no editor
 */

// import { clearAllSelections } from '../utils/styleHelpers';
import {
  getIframeDocument,
  getSlideElements,
  selectElementInIframe,
  clearSelectionInIframe,
  isTextElement,
  isImageElement,
  isVideoElement,
  getFontFamily,
  getTextAlign,
  getElementColor,
  getBackgroundColor,
  getFontSize,
  getPositionStyles,
} from '../utils/iframeHelpers';

/**
 * Lida com o clique em um elemento dentro de um slide
 */
export function handleElementClick(
  event: MouseEvent,
  slideIndex: number,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  setSelectedElement: (value: { slideIndex: number; element: any }) => void,
  setFocusedSlide: (value: number) => void,
  setIsLoadingProperties: (value: boolean) => void,
  setElementStyles: (value: any) => void,
  setOriginalStyles: (value: any) => void
): void {
  const target = event.target as HTMLElement;
  
  // Ignora cliques no body
  if (target.tagName.toLowerCase() === 'body') {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  // Remove seleção anterior de todos os iframes
  iframeRefs.current.forEach((iframe) => {
    clearSelectionInIframe(iframe);
  });

  // Seleciona o elemento clicado
  const iframe = iframeRefs.current[slideIndex];
  if (iframe) {
    selectElementInIframe(iframe, target);
  }

  // Atualiza estado
  setFocusedSlide(slideIndex);
  setSelectedElement({ slideIndex, element: target });
  setIsLoadingProperties(true);

  // Carrega propriedades do elemento
  setTimeout(() => {
    const styles = extractElementStyles(target);
    setElementStyles(styles);
    setOriginalStyles(styles);
    setIsLoadingProperties(false);
  }, 100);
}

/**
 * Extrai estilos de um elemento para exibição no painel de propriedades
 */
function extractElementStyles(element: HTMLElement): Record<string, any> {
  const styles: Record<string, any> = {};
  const elementId = element.id;

  // Estilos de texto
  if (isTextElement(element)) {
    styles.fontFamily = getFontFamily(element);
    styles.fontSize = getFontSize(element);
    styles.color = getElementColor(element);
    styles.textAlign = getTextAlign(element);
    styles.fontWeight = window.getComputedStyle(element).fontWeight;
    styles.fontStyle = window.getComputedStyle(element).fontStyle;
    styles.textDecoration = window.getComputedStyle(element).textDecoration;
  }

  // Estilos de imagem
  if (isImageElement(element)) {
    const img = element as HTMLImageElement;
    styles.src = img.src;
    styles.alt = img.alt;
    styles.objectFit = window.getComputedStyle(element).objectFit;
  }

  // Estilos de vídeo
  if (isVideoElement(element)) {
    const video = element as HTMLVideoElement;
    styles.src = video.src;
    styles.autoplay = video.autoplay;
    styles.loop = video.loop;
    styles.muted = video.muted;
  }

  // Estilos de fundo
  const bgColor = getBackgroundColor(element);
  if (bgColor) {
    styles.backgroundColor = bgColor;
  }

  const bgImage = window.getComputedStyle(element).backgroundImage;
  if (bgImage && bgImage !== 'none') {
    styles.backgroundImage = bgImage;
    styles.backgroundSize = window.getComputedStyle(element).backgroundSize;
    styles.backgroundPosition = window.getComputedStyle(element).backgroundPosition;
    styles.backgroundRepeat = window.getComputedStyle(element).backgroundRepeat;
  }

  // Estilos de posição e dimensões
  const positionStyles = getPositionStyles(element);
  Object.assign(styles, positionStyles);

  // Bordas
  styles.borderRadius = window.getComputedStyle(element).borderRadius;
  styles.border = window.getComputedStyle(element).border;

  // Opacidade
  styles.opacity = window.getComputedStyle(element).opacity;

  // ID e classes
  styles.id = elementId;
  styles.className = element.className;

  return styles;
}

/**
 * Lida com a mudança de slide focado
 */
export function handleSlideClick(
  slideIndex: number,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  setFocusedSlide: (value: number) => void,
  setSelectedElement: (value: { slideIndex: number; element: any }) => void
): void {
  // Remove seleção de todos os iframes
  iframeRefs.current.forEach((iframe) => {
    clearSelectionInIframe(iframe);
  });

  setFocusedSlide(slideIndex);
  setSelectedElement({ slideIndex, element: null });
}

/**
 * Lida com a seleção de um elemento a partir do painel de layers
 */
export function handleLayerElementClick(
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  setSelectedElement: (value: { slideIndex: number; element: any }) => void,
  setFocusedSlide: (value: number) => void,
  setIsLoadingProperties: (value: boolean) => void,
  setElementStyles: (value: any) => void,
  setOriginalStyles: (value: any) => void
): void {
  const iframe = iframeRefs.current[slideIndex];
  if (!iframe) return;

  const doc = getIframeDocument(iframe);
  if (!doc) return;

  const element = doc.getElementById(elementId);
  if (!element) return;

  // Remove seleção anterior
  iframeRefs.current.forEach((iframe) => {
    clearSelectionInIframe(iframe);
  });

  // Seleciona elemento
  selectElementInIframe(iframe, element as HTMLElement);

  // Atualiza estado
  setFocusedSlide(slideIndex);
  setSelectedElement({ slideIndex, element });
  setIsLoadingProperties(true);

  // Carrega propriedades
  setTimeout(() => {
    const styles = extractElementStyles(element as HTMLElement);
    setElementStyles(styles);
    setOriginalStyles(styles);
    setIsLoadingProperties(false);
  }, 100);
}

/**
 * Remove a seleção de elemento
 */
export function handleClearSelection(
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  setSelectedElement: (value: { slideIndex: number; element: any }) => void
): void {
  // Remove seleção de todos os iframes
  iframeRefs.current.forEach((iframe) => {
    clearSelectionInIframe(iframe);
  });

  setSelectedElement({ slideIndex: 0, element: null });
}

/**
 * Obtém todos os elementos de um slide para exibição no painel de layers
 */
export function getSlideElementsData(
  slideIndex: number,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>
): Array<{ id: string; type: string; label: string }> {
  const iframe = iframeRefs.current[slideIndex];
  if (!iframe) return [];

  const elements = getSlideElements(iframe);
  
  return elements
    .filter((el) => el.id) // Apenas elementos com ID
    .map((el) => {
      const htmlEl = el as HTMLElement;
      let type = 'element';
      let label = el.id;

      if (isTextElement(el)) {
        type = 'text';
        label = htmlEl.textContent?.slice(0, 30) || el.id;
      } else if (isImageElement(el)) {
        type = 'image';
        label = (el as HTMLImageElement).alt || el.id;
      } else if (isVideoElement(el)) {
        type = 'video';
        label = el.id;
      }

      return { id: el.id, type, label };
    });
}

/**
 * Toggle de expansão de layer no painel
 */
export function toggleLayerExpansion(
  slideIndex: number,
  expandedLayers: Set<number>,
  setExpandedLayers: (value: Set<number>) => void
): void {
  const newExpanded = new Set(expandedLayers);
  
  if (newExpanded.has(slideIndex)) {
    newExpanded.delete(slideIndex);
  } else {
    newExpanded.add(slideIndex);
  }
  
  setExpandedLayers(newExpanded);
}
