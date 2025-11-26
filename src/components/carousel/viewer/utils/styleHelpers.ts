/**
 * Utilidades para aplicação de estilos nos elementos do slide
 */

import type { ElementStyles } from '../types';

/**
 * Aplica estilos salvos aos elementos do slide
 */
export function applyStylesFromState(
  ifr: HTMLIFrameElement,
  slideIndex: number,
  editedContent: Record<string, any>,
  elementStyles: Record<string, ElementStyles>
) {
  const doc = ifr.contentDocument || ifr.contentWindow?.document;
  if (!doc) return;

  // Aplica estilos de texto editado
  Object.entries(editedContent).forEach(([k, val]) => {
    const [slideStr, field] = k.split('-');
    const idx = Number(slideStr);
    if (idx !== slideIndex || Number.isNaN(idx)) return;
    if (field !== 'title' && field !== 'subtitle') return;

    const el = doc.getElementById(`slide-${slideIndex}-${field}`);
    if (el && typeof val === 'string') {
      el.textContent = val;
    }
  });

  // Aplica estilos CSS salvos
  Object.entries(elementStyles).forEach(([k, sty]) => {
    const [slideStr, field] = k.split('-');
    const idx = Number(slideStr);
    if (idx !== slideIndex || Number.isNaN(idx)) return;

    // Aplicar estilos de texto
    if (field === 'title' || field === 'subtitle') {
      applyTextStyles(doc, slideIndex, field, sty);
    }

    // Aplicar estilos de posição da imagem/vídeo/background
    if (field === 'background') {
      applyBackgroundStyles(doc, sty);
    }
  });
}

/**
 * Aplica estilos em elementos de texto (title/subtitle)
 */
function applyTextStyles(
  doc: Document,
  slideIndex: number,
  field: string,
  styles: ElementStyles
) {
  const el = doc.getElementById(`slide-${slideIndex}-${field}`) as HTMLElement | null;
  if (!el) {
    console.warn(`⚠️ Elemento não encontrado: slide-${slideIndex}-${field}`);
    return;
  }

  if (styles.fontSize) el.style.fontSize = styles.fontSize;
  if (styles.fontWeight) el.style.fontWeight = String(styles.fontWeight);
  if (styles.textAlign) el.style.textAlign = styles.textAlign as any;
  if (styles.color) el.style.color = styles.color;
}

/**
 * Aplica estilos em elementos de background (image/video)
 */
function applyBackgroundStyles(doc: Document, styles: ElementStyles) {
  // Imagem
  const img = doc.querySelector('img[data-editable="image"]') as HTMLImageElement | null;
  if (img && styles.objectPosition) {
    img.style.setProperty('object-position', styles.objectPosition, 'important');
  }

  // Vídeo
  applyVideoStyles(doc, styles);

  // Backgrounds CSS
  if (styles.backgroundPositionX || styles.backgroundPositionY) {
    applyBackgroundPositionStyles(doc, styles);
  }

  // Altura do container
  if (styles.height) {
    applyContainerHeight(doc, styles.height);
  }
}

/**
 * Aplica estilos em vídeos
 */
function applyVideoStyles(doc: Document, styles: ElementStyles) {
  const video = doc.querySelector('video[data-editable="video"]') as HTMLVideoElement | null;
  const videoContainer = doc.querySelector('.video-container') as HTMLElement | null;
  
  if (!video) return;

  // Sempre garantir object-fit: cover e 100%
  video.style.setProperty('object-fit', 'cover', 'important');
  video.style.setProperty('width', '100%', 'important');
  video.style.setProperty('height', '100%', 'important');
  video.style.setProperty('position', 'absolute', 'important');
  (video.style as any).inset = '0';

  // Aplica object-position se houver
  if (styles.objectPosition) {
    video.style.setProperty('object-position', styles.objectPosition, 'important');
  }

  // Aplica border-radius igual ao container
  if (videoContainer) {
    videoContainer.style.setProperty('overflow', 'hidden', 'important');
    const borderRadius = videoContainer.style.borderRadius || 
                        window.getComputedStyle(videoContainer).borderRadius;
    if (borderRadius) {
      video.style.setProperty('border-radius', borderRadius, 'important');
      videoContainer.style.setProperty('border-radius', borderRadius, 'important');
    }
  }
}

/**
 * Aplica background-position em elementos CSS
 */
function applyBackgroundPositionStyles(doc: Document, styles: ElementStyles) {
  const bgElements = doc.querySelectorAll(
    '[data-editable="background"], body, div, section, header, main, figure, article'
  );
  
  bgElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const cs = doc.defaultView?.getComputedStyle(htmlEl);
    
    if (cs?.backgroundImage?.includes('url(')) {
      if (styles.backgroundPositionX) {
        htmlEl.style.setProperty('background-position-x', styles.backgroundPositionX, 'important');
      }
      if (styles.backgroundPositionY) {
        htmlEl.style.setProperty('background-position-y', styles.backgroundPositionY, 'important');
      }
    }
  });
}

/**
 * Aplica altura customizada no container
 */
function applyContainerHeight(doc: Document, height: string) {
  const imgWrapper = doc.querySelector('.img-crop-wrapper') as HTMLElement | null;
  const videoContainer = doc.querySelector('.video-container') as HTMLElement | null;
  const container = imgWrapper || videoContainer;
  
  if (container) {
    container.setAttribute('data-cv-height', height.replace('px', ''));
    container.style.setProperty('height', height, 'important');
  }
}

/**
 * Limpa todas as seleções em todos os slides
 */
export function clearAllSelections(iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>) {
  iframeRefs.current.forEach((ifr) => {
    const d = ifr?.contentDocument || ifr?.contentWindow?.document;
    if (!d) return;

    // Remove classe 'selected' de elementos editáveis
    d.querySelectorAll('[data-editable].selected').forEach((el) => {
      el.classList.remove('selected');
      (el as HTMLElement).style.zIndex = '';
    });

    // Remove seleção de img-crop-wrapper
    d.querySelectorAll('.img-crop-wrapper[data-cv-selected="1"]').forEach((el) => {
      (el as HTMLElement).removeAttribute('data-cv-selected');
    });

    // Remove seleção de video-container
    d.querySelectorAll('.video-container.selected, .video-container[data-cv-selected="1"]').forEach((el) => {
      el.classList.remove('selected');
      (el as HTMLElement).removeAttribute('data-cv-selected');
      (el as HTMLElement).style.zIndex = '';
    });
  });
}
