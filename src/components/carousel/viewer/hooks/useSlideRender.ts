/**
 * @file useSlideRender.ts
 * @description Hook para gerenciar a renderização dos slides no viewer
 */

import type { ElementStyles } from '../../../../types/carousel';

/**
 * Injeta IDs editáveis no HTML do slide
 */
function injectEditableIds(html: string, slideIndex: number, conteudo: any): string {
  // Garante que existe uma tag style
  let result = html;
  if (!/<style[\s>]/i.test(result)) {
    result = result.replace(/<head([^>]*)>/i, `<head$1><style></style>`);
  }

  const titleText = conteudo?.title || '';
  const subtitleText = conteudo?.subtitle || '';

  const addEditableSpan = (text: string, id: string, attr: string) => {
    const lines = text.split('\n').filter((l: string) => l.trim());
    lines.forEach((line: string) => {
      const escaped = line.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(>[^<]*)(${escaped})([^<]*<)`, 'gi');
      result = result.replace(re, (_match, b, t, a) => `${b}<span id="${id}" data-editable="${attr}" contenteditable="false">${t}</span>${a}`);
    });
  };

  if (titleText) addEditableSpan(titleText, `slide-${slideIndex}-title`, 'title');
  if (subtitleText) addEditableSpan(subtitleText, `slide-${slideIndex}-subtitle`, 'subtitle');

  // Injeta estilos base para elementos editáveis
  result = result.replace(/<style>/i, `<style>
    /* Desabilita seleção de texto no editor (exceto quando editando) */
    * {
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
    }
    [contenteditable="true"] {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    }
    
    [data-editable]{cursor:pointer!important;position:relative;display:inline-block!important}
    [data-editable].selected{outline:3px solid #3B82F6!important;outline-offset:2px;z-index:1000}
    [data-editable]:hover:not(.selected){outline:2px solid rgba(59,130,246,.5)!important;outline-offset:2px}
    [data-editable][contenteditable="true"]{outline:3px solid #10B981!important;outline-offset:2px;background:rgba(16,185,129,.1)!important}
    img[data-editable]{display:block!important}
    video[data-editable]{display:block!important}
    html, body { pointer-events: auto !important; }

    html, body { height:100% !important; width:100% !important; margin:0 !important; padding:0 !important; overflow:hidden !important; }
    img, video { max-width:none !important; }

    /* Container de vídeo genérico */
    .video-container{
      position:relative !important;
      display:block !important;
      width:100% !important;
      height:450px;
      border-radius:24px !important;
      overflow:hidden !important;
      margin-top:0 !important;
      box-shadow:0 16px 48px rgba(0,0,0,.18) !important;
    }
    .video-container > video{
      position:absolute !important;
      inset:0 !important;
      width:100% !important;
      height:100% !important;
      object-fit:cover !important;
      display:block !important;
      border-radius:24px !important;
    }
  `);

  return result;
}

/**
 * Aplica estilos salvos aos elementos do slide
 */
export function applyStylesFromState(
  ifr: HTMLIFrameElement,
  slideIndex: number,
  editedContent: Record<string, any>,
  elementStyles: Record<string, ElementStyles>
): void {
  const doc = ifr.contentDocument || ifr.contentWindow?.document;
  if (!doc) return;

  // Aplica estilos de texto editado
  Object.entries(editedContent).forEach(([k, val]) => {
    const [slideStr, field] = k.split('-');
    const idx = Number(slideStr);
    if (idx !== slideIndex || Number.isNaN(idx)) return;
    if (field !== 'title' && field !== 'subtitle') return;

    const el = doc.getElementById(`slide-${slideIndex}-${field}`);
    if (el && typeof val === 'string') el.textContent = val;
  });

  // Aplica estilos CSS salvos
  Object.entries(elementStyles).forEach(([k, sty]) => {
    const [slideStr, field] = k.split('-');
    const idx = Number(slideStr);
    if (idx !== slideIndex || Number.isNaN(idx)) return;

    // Aplicar estilos de texto
    if (field === 'title' || field === 'subtitle') {
      const el = doc.getElementById(`slide-${slideIndex}-${field}`) as HTMLElement | null;
      if (!el) return;

      if (sty.fontSize) el.style.fontSize = sty.fontSize;
      if (sty.fontWeight) el.style.fontWeight = String(sty.fontWeight);
      if (sty.fontStyle) el.style.fontStyle = sty.fontStyle;
      if (sty.textDecoration) el.style.textDecoration = sty.textDecoration;
      if (sty.textAlign) el.style.textAlign = sty.textAlign as any;
      if (sty.color) el.style.color = sty.color;
    }

    // Aplicar estilos de posição da imagem/vídeo/background
    if (field === 'background') {
      const img = doc.querySelector('img[data-editable="image"]') as HTMLImageElement | null;
      if (img && sty.objectPosition) {
        img.style.setProperty('object-position', sty.objectPosition, 'important');
      }

      const video = doc.querySelector('video[data-editable="video"]') as HTMLVideoElement | null;
      if (video && sty.objectPosition) {
        video.style.setProperty('object-position', sty.objectPosition, 'important');
      }

      // Aplica em backgrounds CSS
      if (sty.backgroundPositionX || sty.backgroundPositionY) {
        const bgElements = doc.querySelectorAll('[data-editable="background"], body, div, section, header, main, figure, article');
        bgElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const cs = doc.defaultView?.getComputedStyle(htmlEl);
          if (cs?.backgroundImage?.includes('url(')) {
            if (sty.backgroundPositionX) {
              htmlEl.style.setProperty('background-position-x', sty.backgroundPositionX, 'important');
            }
            if (sty.backgroundPositionY) {
              htmlEl.style.setProperty('background-position-y', sty.backgroundPositionY, 'important');
            }
          }
        });
      }

      // Aplica altura do container se salva
      if (sty.height) {
        const imgWrapper = doc.querySelector('.img-crop-wrapper') as HTMLElement | null;
        const videoContainer = doc.querySelector('.video-container') as HTMLElement | null;
        const container = imgWrapper || videoContainer;
        if (container) {
          container.setAttribute('data-cv-height', sty.height.replace('px', ''));
          container.style.setProperty('height', sty.height, 'important');
        }
      }
    }
  });
}

export { injectEditableIds };
