/**
 * @file dragHandlers.ts
 * @description Handlers para operações de drag de imagens, vídeos e backgrounds
 */

import {
  clamp,
  computeCoverBleed,
  layoutReady,
  ensureImgCropWrapper,
  logd
} from '../viewerUtils';

/** Estado compartilhado de drag (module-level) */
export interface ImgDragState {
  active: boolean;
  kind: 'img' | 'vid' | 'bg';
  mode: 'objpos' | 'resize';
  slideIndex: number;
  doc: Document;
  wrapper: HTMLElement;
  targetEl: HTMLImageElement | HTMLVideoElement | HTMLElement;
  contW: number;
  contH: number;
  natW: number;
  natH: number;
  dispW: number;
  dispH: number;
  minLeft: number;
  minTop: number;
  left: number;
  top: number;
  startX: number;
  startY: number;
}

export interface VideoCropState {
  active: boolean;
}

export const imgDragState = { current: null as ImgDragState | null };
export const videoCropState = { current: null as VideoCropState | null };

/**
 * Inicia o drag de uma imagem para reposicionamento
 */
export async function startImgDrag(
  doc: Document,
  slideIndex: number,
  img: HTMLImageElement,
  ev: MouseEvent
): Promise<void> {
  ev.preventDefault();
  ev.stopPropagation();

  const { wrapper } = ensureImgCropWrapper(doc, img);
  let wr = (wrapper as HTMLElement).getBoundingClientRect();
  if (wr.width === 0 || wr.height === 0) {
    await layoutReady(doc);
    wr = (wrapper as HTMLElement).getBoundingClientRect();
    if (wr.width === 0 || wr.height === 0) return;
  }
  const contW = wr.width, contH = wr.height;
  const natW = img.naturalWidth || contW, natH = img.naturalHeight || contH;

  img.style.setProperty('width', '100%', 'important');
  img.style.setProperty('height', '100%', 'important');
  img.style.setProperty('object-fit', 'cover', 'important');
  img.style.removeProperty('position');
  img.removeAttribute('data-cv-left');
  img.removeAttribute('data-cv-top');

  const { displayW, displayH } = computeCoverBleed(natW, natH, contW, contH, 0);
  const maxOffsetX = Math.max(0, displayW - contW);
  const maxOffsetY = Math.max(0, displayH - contH);

  const cs = doc.defaultView?.getComputedStyle(img);
  const toPerc = (v: string) => v?.trim().endsWith('%') ? parseFloat(v) : 50;
  const obj = (cs?.objectPosition || '50% 50%').split(/\s+/);
  const xPerc = toPerc(obj[0] || '50%');
  const yPerc = toPerc(obj[1] || '50%');
  const leftPx = -maxOffsetX * (xPerc / 100);
  const topPx = -maxOffsetY * (yPerc / 100);

  imgDragState.current = {
    active: true,
    kind: 'img',
    mode: 'objpos',
    slideIndex,
    doc,
    wrapper,
    targetEl: img,
    contW,
    contH,
    natW,
    natH,
    dispW: displayW,
    dispH: displayH,
    minLeft: Math.min(0, contW - displayW),
    minTop: Math.min(0, contH - displayH),
    left: leftPx,
    top: topPx,
    startX: ev.clientX,
    startY: ev.clientY
  };
  logd('start IMG (object-position only)', { slideIndex, contW, contH, displayW, displayH });
}

/**
 * Inicia o drag de um vídeo para reposicionamento
 */
export async function startVideoDrag(
  doc: Document,
  slideIndex: number,
  video: HTMLVideoElement,
  ev: MouseEvent
): Promise<void> {
  ev.preventDefault();
  ev.stopPropagation();

  const host = video.parentElement as HTMLElement | null;
  const cont = host && host.classList.contains('img-crop-wrapper') ? host : (host || video);
  let wr = cont.getBoundingClientRect();
  if (wr.width === 0 || wr.height === 0) {
    await layoutReady(doc);
    wr = cont.getBoundingClientRect();
    if (wr.width === 0 || wr.height === 0) return;
  }

  const contW = wr.width, contH = wr.height;
  const natW = video.videoWidth || contW;
  const natH = video.videoHeight || contH;

  video.style.setProperty('object-fit', 'cover', 'important');
  video.style.setProperty('width', '100%', 'important');
  video.style.setProperty('height', '100%', 'important');
  video.style.setProperty('position', 'absolute', 'important');
  (video.style as any).inset = '0';

  const { displayW, displayH } = computeCoverBleed(natW, natH, contW, contH, 0);
  const maxOffsetX = Math.max(0, displayW - contW);
  const maxOffsetY = Math.max(0, displayH - contH);

  const cs = doc.defaultView?.getComputedStyle(video);
  const toPerc = (v: string) => v?.trim().endsWith('%') ? parseFloat(v) : 50;
  const obj = (cs?.objectPosition || '50% 50%').split(/\s+/);
  const xPerc = toPerc(obj[0] || '50%');
  const yPerc = toPerc(obj[1] || '50%');
  const leftPx = -maxOffsetX * (xPerc / 100);
  const topPx = -maxOffsetY * (yPerc / 100);

  imgDragState.current = {
    active: true,
    kind: 'vid',
    mode: 'objpos',
    slideIndex,
    doc,
    wrapper: cont,
    targetEl: video as any,
    contW,
    contH,
    natW,
    natH,
    dispW: displayW,
    dispH: displayH,
    minLeft: Math.min(0, contW - displayW),
    minTop: Math.min(0, contH - displayH),
    left: leftPx,
    top: topPx,
    startX: ev.clientX,
    startY: ev.clientY
  };
}

/**
 * Inicia o drag de um background CSS para reposicionamento
 */
export async function startBgDrag(
  doc: Document,
  slideIndex: number,
  cont: HTMLElement,
  ev: MouseEvent
): Promise<void> {
  ev.preventDefault();
  ev.stopPropagation();
  const cs = doc.defaultView?.getComputedStyle(cont);

  // Extrai todas as URLs do backgroundImage (pode ter linear-gradient + url)
  const backgroundImage = cs?.backgroundImage || '';
  console.log('🖼️ startBgDrag - backgroundImage:', backgroundImage);

  const urlMatches = backgroundImage.match(/url\(["']?([^)"']+)["']?\)/gi);
  console.log('🔍 URLs encontradas:', urlMatches);

  if (!urlMatches || urlMatches.length === 0) {
    console.warn('❌ Nenhuma URL encontrada no background');
    return;
  }

  // Pega a última URL (geralmente é a imagem de fundo real, depois dos gradientes)
  const lastUrlMatch = urlMatches[urlMatches.length - 1];
  const bg = lastUrlMatch.match(/url\(["']?([^)"']+)["']?\)/i)?.[1];

  console.log('✅ URL da imagem extraída:', bg);

  if (!bg) {
    console.warn('❌ Falha ao extrair URL');
    return;
  }

  let r = cont.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) {
    await layoutReady(doc);
    r = cont.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
  }

  const tmp = new Image();
  tmp.crossOrigin = 'anonymous';
  tmp.src = bg;

  const go = (useFallback = false) => {
    // Se CORS falhou ou imagem não carregou, usa dimensões estimadas baseadas no container
    let natW: number, natH: number;

    if (useFallback || !tmp.naturalWidth || !tmp.naturalHeight) {
      // Estimativa: assume proporção 16:9 ou usa dimensões do container
      const aspectRatio = 16 / 9;
      if (r.width / r.height > aspectRatio) {
        // Container mais largo que 16:9
        natW = r.width;
        natH = r.width / aspectRatio;
      } else {
        // Container mais alto que 16:9
        natH = r.height;
        natW = r.height * aspectRatio;
      }
      console.warn('⚠️ Usando dimensões estimadas (CORS ou erro):', { natW, natH });
    } else {
      natW = tmp.naturalWidth;
      natH = tmp.naturalHeight;
    }

    const { displayW, displayH } = computeCoverBleed(natW, natH, r.width, r.height, 2);
    const maxX = Math.max(0, displayW - r.width), maxY = Math.max(0, displayH - r.height);
    const toPerc = (v: string) => v.endsWith('%') ? parseFloat(v) / 100 : 0.5;
    const posX = cs?.backgroundPositionX || '50%', posY = cs?.backgroundPositionY || '50%';
    const leftPx = -maxX * toPerc(posX), topPx = -maxY * toPerc(posY);

    imgDragState.current = {
      active: true,
      kind: 'bg',
      mode: 'objpos',
      slideIndex,
      doc,
      wrapper: cont,
      targetEl: cont,
      contW: r.width,
      contH: r.height,
      natW,
      natH,
      dispW: displayW,
      dispH: displayH,
      minLeft: Math.min(0, r.width - displayW),
      minTop: Math.min(0, r.height - displayH),
      left: leftPx,
      top: topPx,
      startX: ev.clientX,
      startY: ev.clientY
    };
    console.log('✅ Background drag INICIADO:', {
      slideIndex,
      contW: r.width,
      contH: r.height,
      displayW,
      displayH,
      natW,
      natH,
      usedFallback: useFallback,
      element: cont.tagName,
      backgroundImage: cs?.backgroundImage.substring(0, 80)
    });
    logd('start BG', { slideIndex, contW: r.width, contH: r.height, displayW, displayH });
  };

  console.log('📥 Carregando imagem do background:', bg);
  if (tmp.complete && tmp.naturalWidth) {
    console.log('✅ Imagem já estava carregada');
    go();
  } else {
    console.log('⏳ Aguardando carregamento da imagem...');

    // Timeout: se não carregar em 2 segundos, usa fallback
    const timeout = setTimeout(() => {
      console.warn('⏱️ Timeout ao carregar imagem, usando fallback');
      go(true);
    }, 2000);

    tmp.onload = () => {
      clearTimeout(timeout);
      console.log('✅ Imagem carregada:', { width: tmp.naturalWidth, height: tmp.naturalHeight });
      go();
    };
    tmp.onerror = () => {
      clearTimeout(timeout);
      console.warn('❌ Erro ao carregar imagem, usando fallback');
      go(true);
    };
  }
}

/**
 * Processa movimento de drag (mouse move)
 */
export function handleDragMove(ev: MouseEvent, doc: Document): void {
  const st = imgDragState.current;
  if (!st || !st.active) return;
  if (st.doc !== doc) return;

  const dx = ev.clientX - st.startX;
  const dy = ev.clientY - st.startY;
  const nextLeft = clamp(st.left + dx, st.minLeft, 0);
  const nextTop = clamp(st.top + dy, st.minTop, 0);

  const maxOffsetX = Math.max(0, st.dispW - st.contW);
  const maxOffsetY = Math.max(0, st.dispH - st.contH);
  const xPerc = maxOffsetX ? (-nextLeft / maxOffsetX) * 100 : 50;
  const yPerc = maxOffsetY ? (-nextTop / maxOffsetY) * 100 : 50;

  if (st.kind === 'img') {
    (st.targetEl as HTMLImageElement).style.objectPosition = `${xPerc}% ${yPerc}%`;
    return;
  }

  if (st.kind === 'vid') {
    (st.targetEl as HTMLVideoElement).style.objectPosition = `${xPerc}% ${yPerc}%`;
    return;
  }

  if (st.kind === 'bg') {
    (st.targetEl as HTMLElement).style.setProperty('background-position-x', `${xPerc}%`, 'important');
    (st.targetEl as HTMLElement).style.setProperty('background-position-y', `${yPerc}%`, 'important');
    return;
  }
}

/**
 * Finaliza o drag e salva as posições
 * @returns Objeto com informações da posição salva ou null
 */
export function handleDragEnd(
  doc: Document,
  setElementStyles: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>
): { slideIndex: number; position: Record<string, string> } | null {
  if (!imgDragState.current?.active || imgDragState.current.doc !== doc) {
    return null;
  }

  const dragState = imgDragState.current;
  const dragSlideIndex = dragState.slideIndex;
  const key = `${dragSlideIndex}-background`;
  let result: { slideIndex: number; position: Record<string, string> } | null = null;

  if (dragState.kind === 'img' && dragState.mode === 'objpos') {
    const el = dragState.targetEl as HTMLImageElement;
    const computedStyle = doc.defaultView?.getComputedStyle(el);
    const objectPosition = computedStyle?.objectPosition || '50% 50%';

    // Salva a posição da imagem nos estilos
    setElementStyles(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        objectPosition: objectPosition
      }
    }));
    setHasUnsavedChanges(true);

    el.removeAttribute('data-cv-left');
    el.removeAttribute('data-cv-top');
    logd('saved img position', { slideIndex: dragSlideIndex, objectPosition });
    result = { slideIndex: dragSlideIndex, position: { objectPosition } };
  } else if (dragState.kind === 'bg' && dragState.mode === 'objpos') {
    const el = dragState.targetEl as HTMLElement;
    const computedStyle = doc.defaultView?.getComputedStyle(el);
    const backgroundPositionX = computedStyle?.backgroundPositionX || '50%';
    const backgroundPositionY = computedStyle?.backgroundPositionY || '50%';

    // Salva a posição do background nos estilos
    setElementStyles(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        backgroundPositionX: backgroundPositionX,
        backgroundPositionY: backgroundPositionY
      }
    }));
    setHasUnsavedChanges(true);

    logd('saved bg position', { slideIndex: dragSlideIndex, backgroundPositionX, backgroundPositionY });
    result = { slideIndex: dragSlideIndex, position: { backgroundPositionX, backgroundPositionY } };
  } else if (dragState.kind === 'vid' && dragState.mode === 'objpos') {
    const el = dragState.targetEl as HTMLVideoElement;
    const computedStyle = doc.defaultView?.getComputedStyle(el);
    const objectPosition = computedStyle?.objectPosition || '50% 50%';

    // Salva a posição do vídeo nos estilos
    setElementStyles(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        objectPosition: objectPosition
      }
    }));
    setHasUnsavedChanges(true);

    logd('saved video position', { slideIndex: dragSlideIndex, objectPosition });
    result = { slideIndex: dragSlideIndex, position: { objectPosition } };
  }

  logd('end IMG/BG', { slideIndex: dragSlideIndex });
  imgDragState.current = null;
  return result;
}

/**
 * Limpa o estado de drag
 */
export function cleanupDrag(doc: Document): void {
  if (imgDragState.current?.doc === doc) {
    imgDragState.current = null;
  }
}
