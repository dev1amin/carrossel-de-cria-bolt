/**
 * Utilitários para manipulação de iframes e elementos internos
 */

import { FONT_FAMILIES, TEXT_ALIGN_OPTIONS } from './constants';

/**
 * Obtém o documento de um iframe
 */
export function getIframeDocument(iframe: HTMLIFrameElement | null): Document | null {
  if (!iframe) return null;
  return iframe.contentDocument || iframe.contentWindow?.document || null;
}

/**
 * Obtém todos os elementos de um slide
 */
export function getSlideElements(iframe: HTMLIFrameElement | null): Element[] {
  const doc = getIframeDocument(iframe);
  if (!doc) return [];
  
  const body = doc.body;
  if (!body) return [];

  return Array.from(body.children);
}

/**
 * Obtém elemento por ID dentro de um iframe
 */
export function getElementByIdInIframe(
  iframe: HTMLIFrameElement | null,
  elementId: string
): HTMLElement | null {
  const doc = getIframeDocument(iframe);
  if (!doc) return null;
  
  return doc.getElementById(elementId);
}

/**
 * Verifica se um elemento é de texto
 */
export function isTextElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'p' || tagName === 'h1' || tagName === 'h2' || 
         tagName === 'h3' || tagName === 'span' || tagName === 'div';
}

/**
 * Verifica se um elemento é uma imagem
 */
export function isImageElement(element: Element): boolean {
  return element.tagName.toLowerCase() === 'img';
}

/**
 * Verifica se um elemento é um vídeo
 */
export function isVideoElement(element: Element): boolean {
  return element.tagName.toLowerCase() === 'video';
}

/**
 * Obtém a fonte de um elemento de texto
 */
export function getFontFamily(element: HTMLElement): string {
  const computedStyle = window.getComputedStyle(element);
  const fontFamily = computedStyle.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
  
  // Verifica se a fonte está na lista de fontes disponíveis
  const matchedFont = FONT_FAMILIES.find(
    (font) => font.toLowerCase() === fontFamily.toLowerCase()
  );
  
  return matchedFont || fontFamily;
}

/**
 * Obtém o alinhamento de texto de um elemento
 */
export function getTextAlign(element: HTMLElement): string {
  const computedStyle = window.getComputedStyle(element);
  const textAlign = computedStyle.textAlign;
  
  // Verifica se o alinhamento está nas opções disponíveis
  const matchedAlign = TEXT_ALIGN_OPTIONS.find(
    (align) => align === textAlign
  );
  
  return matchedAlign || 'left';
}

/**
 * Converte RGB para HEX
 */
export function rgbToHex(rgb: string): string {
  if (rgb.startsWith('#')) return rgb;
  
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '#000000';
  
  const [r, g, b] = result.map(Number);
  return '#' + [r, g, b]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * Obtém a cor de um elemento
 */
export function getElementColor(element: HTMLElement): string {
  const computedStyle = window.getComputedStyle(element);
  const color = computedStyle.color;
  return rgbToHex(color);
}

/**
 * Obtém a cor de fundo de um elemento
 */
export function getBackgroundColor(element: HTMLElement): string {
  const computedStyle = window.getComputedStyle(element);
  const bgColor = computedStyle.backgroundColor;
  
  // Se for transparente, retorna string vazia
  if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
    return '';
  }
  
  return rgbToHex(bgColor);
}

/**
 * Obtém o tamanho da fonte em pixels
 */
export function getFontSize(element: HTMLElement): number {
  const computedStyle = window.getComputedStyle(element);
  const fontSize = computedStyle.fontSize;
  return parseInt(fontSize, 10);
}

/**
 * Obtém estilos de posicionamento de um elemento
 */
export function getPositionStyles(element: HTMLElement): {
  top: string;
  left: string;
  width: string;
  height: string;
  position: string;
} {
  const computedStyle = window.getComputedStyle(element);
  
  return {
    top: element.style.top || computedStyle.top,
    left: element.style.left || computedStyle.left,
    width: element.style.width || computedStyle.width,
    height: element.style.height || computedStyle.height,
    position: element.style.position || computedStyle.position,
  };
}

/**
 * Seleciona um elemento dentro de um iframe
 */
export function selectElementInIframe(
  iframe: HTMLIFrameElement | null,
  element: HTMLElement
): void {
  const doc = getIframeDocument(iframe);
  if (!doc) return;

  // Remove seleção anterior
  const previousSelected = doc.querySelector('.selected-element');
  if (previousSelected) {
    previousSelected.classList.remove('selected-element');
  }

  // Adiciona classe de seleção
  element.classList.add('selected-element');
}

/**
 * Remove seleção de todos os elementos em um iframe
 */
export function clearSelectionInIframe(iframe: HTMLIFrameElement | null): void {
  const doc = getIframeDocument(iframe);
  if (!doc) return;

  const selected = doc.querySelectorAll('.selected-element');
  selected.forEach((el) => el.classList.remove('selected-element'));
}

/**
 * Injeta estilos CSS em um iframe
 */
export function injectStylesIntoIframe(
  iframe: HTMLIFrameElement | null,
  styles: string
): void {
  const doc = getIframeDocument(iframe);
  if (!doc) return;

  // Verifica se já existe uma tag de estilo injetada
  let styleTag = doc.getElementById('injected-styles') as HTMLStyleElement;
  
  if (!styleTag) {
    styleTag = doc.createElement('style');
    styleTag.id = 'injected-styles';
    doc.head.appendChild(styleTag);
  }

  styleTag.textContent = styles;
}

/**
 * Obtém HTML serializado de um iframe
 */
export function getIframeHTML(iframe: HTMLIFrameElement | null): string {
  const doc = getIframeDocument(iframe);
  if (!doc) return '';

  return doc.documentElement.outerHTML;
}

/**
 * Define HTML em um iframe
 */
export function setIframeHTML(
  iframe: HTMLIFrameElement | null,
  html: string
): void {
  const doc = getIframeDocument(iframe);
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();
}

/**
 * Espera o iframe carregar
 */
export function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve) => {
    if (iframe.contentDocument?.readyState === 'complete') {
      resolve();
    } else {
      iframe.addEventListener('load', () => resolve(), { once: true });
    }
  });
}

/**
 * Obtém dimensões reais de um elemento dentro do iframe
 */
export function getElementDimensions(element: HTMLElement): {
  width: number;
  height: number;
  top: number;
  left: number;
} {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  return {
    width: parseFloat(computedStyle.width) || rect.width,
    height: parseFloat(computedStyle.height) || rect.height,
    top: parseFloat(element.style.top) || 0,
    left: parseFloat(element.style.left) || 0,
  };
}
