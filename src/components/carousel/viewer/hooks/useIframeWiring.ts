/**
 * @file useIframeWiring.ts
 * @description Hook para configurar e gerenciar eventos dos iframes dos slides.
 * Este hook encapsula toda a lógica de:
 * - Setup inicial de iframes (IDs editáveis, estilos)
 * - Event listeners para seleção, edição e drag
 * - Processamento de vídeos e imagens
 * - Sincronização de estilos
 */

import { useEffect } from 'react';
import type { ElementType, ElementStyles } from '../../../../types/carousel';
import {
  logc, logd, logb,
  isImgurUrl,
  isLogoOrAvatar,
  clamp, computeCoverBleed, layoutReady,
  readAndStoreComputedTextStyles,
  cleanupAltArtifacts, installAltCleanupObserver,
  ensureImgCropWrapper,
  ensureHostResizeObserver,
  attachResizePinchers,
  normFill,
} from '../viewerUtils';
import { imgDragState, videoCropState } from '../handlers/dragHandlers';
import { applyStylesFromState } from './useSlideRender';

interface UseIframeWiringParams {
  renderedSlides: string[];
  editedContent: Record<string, any>;
  elementStyles: Record<string, ElementStyles>;
  expandedLayers: Set<number>;
  iframeRefs: React.MutableRefObject<HTMLIFrameElement[]>;
  selectedImageRefs: React.MutableRefObject<Record<number, HTMLImageElement | null>>;
  disposersRef: React.MutableRefObject<Array<() => void>>;
  setSelectedElement: (value: { slideIndex: number; element: ElementType | null }) => void;
  setFocusedSlide: (value: number) => void;
  setExpandedLayers: React.Dispatch<React.SetStateAction<Set<number>>>;
  setOriginalStyles: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setElementStyles: React.Dispatch<React.SetStateAction<Record<string, ElementStyles>>>;
  setHasUnsavedChanges: (value: boolean) => void;
  clearAllSelections: () => void;
  updateEditedValue: (slideIndex: number, field: string, value: string) => void;
  updateElementStyle: (slideIndex: number, element: string, property: string, value: string) => void;
  postProcessTemplateVideos: (doc: Document) => void;
}

/**
 * Hook para configurar event listeners e lógica de interação nos iframes
 */
export function useIframeWiring({
  renderedSlides,
  editedContent,
  elementStyles,
  expandedLayers,
  iframeRefs,
  selectedImageRefs,
  disposersRef,
  setSelectedElement,
  setFocusedSlide,
  setExpandedLayers,
  setOriginalStyles,
  setElementStyles,
  setHasUnsavedChanges,
  clearAllSelections,
  updateEditedValue,
  updateElementStyle,
  postProcessTemplateVideos,
}: UseIframeWiringParams) {
  useEffect(() => {
    const disposers = disposersRef.current;

    // === Drag Functions ===
    const startImgDrag = async (doc: Document, slideIndex: number, img: HTMLImageElement, ev: MouseEvent) => {
      ev.preventDefault(); ev.stopPropagation();

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
      const topPx  = -maxOffsetY * (yPerc / 100);

      imgDragState.current = {
        active:true, kind:'img', mode:'objpos', slideIndex, doc,
        wrapper, targetEl: img,
        contW, contH, natW, natH, dispW: displayW, dispH: displayH,
        minLeft: Math.min(0, contW - displayW),
        minTop:  Math.min(0, contH - displayH),
        left: leftPx, top: topPx, startX: ev.clientX, startY: ev.clientY
      };
      logd('start IMG (object-position only)', { slideIndex, contW, contH, displayW, displayH });
    };

    const startVideoDrag = async (doc: Document, slideIndex: number, video: HTMLVideoElement, ev: MouseEvent) => {
      ev.preventDefault(); ev.stopPropagation();

      const host = video.parentElement as HTMLElement | null;
      const cont = host && host.classList.contains('img-crop-wrapper') ? host : (host || video);
      let wr = cont.getBoundingClientRect();
      if (wr.width === 0 || wr.height === 0) { await layoutReady(doc); wr = cont.getBoundingClientRect(); if (wr.width === 0 || wr.height === 0) return; }

      const contW = wr.width, contH = wr.height;
      const natW = video.videoWidth || contW;
      const natH = video.videoHeight || contH;

      video.style.setProperty('object-fit','cover','important');
      video.style.setProperty('width','100%','important');
      video.style.setProperty('height','100%','important');
      video.style.setProperty('position','absolute','important');
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
      const topPx  = -maxOffsetY * (yPerc / 100);

      imgDragState.current = {
        active:true, kind:'vid', mode:'objpos',
        slideIndex, doc, wrapper: cont, targetEl: video as any,
        contW, contH, natW, natH, dispW: displayW, dispH: displayH,
        minLeft: Math.min(0, contW - displayW),
        minTop:  Math.min(0, contH - displayH),
        left: leftPx, top: topPx, startX: ev.clientX, startY: ev.clientY
      };
    };

    const startBgDrag = async (doc: Document, slideIndex: number, cont: HTMLElement, ev: MouseEvent) => {
      ev.preventDefault(); ev.stopPropagation();
      const cs = doc.defaultView?.getComputedStyle(cont);
      
      const backgroundImage = cs?.backgroundImage || '';
      const urlMatches = backgroundImage.match(/url\(["']?([^)"']+)["']?\)/gi);
      
      if (!urlMatches || urlMatches.length === 0) return;
      
      const lastUrlMatch = urlMatches[urlMatches.length - 1];
      const bg = lastUrlMatch.match(/url\(["']?([^)"']+)["']?\)/i)?.[1];
      
      if (!bg) return;

      let r = cont.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) { await layoutReady(doc); r = cont.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return; }

      const tmp = new Image(); tmp.crossOrigin = 'anonymous'; tmp.src = bg;
      
      const go = (useFallback = false) => {
        let natW: number, natH: number;
        
        if (useFallback || !tmp.naturalWidth || !tmp.naturalHeight) {
          const aspectRatio = 16 / 9;
          if (r.width / r.height > aspectRatio) {
            natW = r.width;
            natH = r.width / aspectRatio;
          } else {
            natH = r.height;
            natW = r.height * aspectRatio;
          }
        } else {
          natW = tmp.naturalWidth;
          natH = tmp.naturalHeight;
        }
        
        const { displayW, displayH } = computeCoverBleed(natW, natH, r.width, r.height, 2);
        const maxX = Math.max(0, displayW - r.width), maxY = Math.max(0, displayH - r.height);
        const toPerc = (v: string) => v.endsWith('%') ? parseFloat(v)/100 : 0.5;
        const posX = cs?.backgroundPositionX || '50%', posY = cs?.backgroundPositionY || '50%';
        const leftPx = -maxX * toPerc(posX), topPx = -maxY * toPerc(posY);

        imgDragState.current = {
          active:true, kind:'bg', mode:'objpos', slideIndex, doc,
          wrapper: cont, targetEl: cont, contW:r.width, contH:r.height,
          natW, natH, dispW:displayW, dispH:displayH,
          minLeft: Math.min(0, r.width - displayW), minTop: Math.min(0, r.height - displayH),
          left: leftPx, top: topPx, startX: ev.clientX, startY: ev.clientY
        };
        logd('start BG', { slideIndex, contW:r.width, contH:r.height, displayW, displayH });
      };
      
      if (tmp.complete && tmp.naturalWidth) {
        go();
      } else {
        const timeout = setTimeout(() => go(true), 2000);
        tmp.onload = () => { clearTimeout(timeout); go(); };
        tmp.onerror = () => { clearTimeout(timeout); go(true); };
      }
    };

    // === Setup Iframe Function ===
    const setupIframe = (ifr: HTMLIFrameElement, slideIndex: number) => {
      const doc = ifr.contentDocument || ifr.contentWindow?.document;
      if (!doc) return;

      // Process images
      const imgsLocal = Array.from(doc.querySelectorAll('img'));
      let imgIdxLocal = 0;
      imgsLocal.forEach((img) => {
        const im = img as HTMLImageElement;
        // Protege imagens do Imgur (assets do template) e logos/avatares
        if (isImgurUrl(im.src) && !im.getAttribute('data-protected')) {
          im.setAttribute('data-protected', 'true');
        }
        if (isLogoOrAvatar(im, doc) && !im.getAttribute('data-protected')) {
          im.setAttribute('data-protected', 'true');
          logb('Protegendo logo/avatar:', im.src.substring(0, 50));
        }
        // Só marca como editável se NÃO estiver protegida
        if (im.getAttribute('data-protected') !== 'true') {
          im.setAttribute('data-editable', 'image');
          if (!im.id) im.id = `slide-${slideIndex}-img-${imgIdxLocal++}`;
        }
      });
      requestAnimationFrame(() => {
        // Só aplica wrapper em imagens editáveis (não protegidas)
        Array.from(doc.querySelectorAll('img[data-editable="image"]')).forEach((im) => {
          const el = im as HTMLImageElement;
          try { ensureImgCropWrapper(doc, el); } catch {}
        });
      });

      // Process videos
      const vids = Array.from(doc.querySelectorAll('video'));
      let vidIdx = 0;
      vids.forEach((v) => {
        (v as HTMLVideoElement).setAttribute('data-editable', 'video');
        if (!v.id) v.id = `slide-${slideIndex}-vid-${vidIdx++}`;
        (v as HTMLVideoElement).style.objectFit = 'cover';
        (v as HTMLVideoElement).style.width = '100%';
        (v as HTMLVideoElement).style.height = '100%';
        try { (v as HTMLVideoElement).pause(); } catch {}
        try { (v as HTMLVideoElement).load(); } catch {}
      });

      postProcessTemplateVideos(doc);
      try { installAltCleanupObserver(doc); } catch {}
      try { cleanupAltArtifacts(doc.body); } catch {}

      // Capture original text styles
      try {
        readAndStoreComputedTextStyles(doc, slideIndex, 'title', setOriginalStyles);
        readAndStoreComputedTextStyles(doc, slideIndex, 'subtitle', setOriginalStyles);
      } catch (e) {
        console.warn('⚠️ Erro ao capturar estilos originais:', e);
      }

      try { cleanupAltArtifacts(doc.body); } catch {}

      // === Event Handlers ===
      const onClickCapture = (ev: MouseEvent) => {
        const target = ev.target as HTMLElement | null;
        if (!target) return;

        clearAllSelections();

        const clickedVideo = target.closest('video') as HTMLVideoElement | null;
        if (clickedVideo) {
          clickedVideo.setAttribute('data-editable', 'video');
          const host = (clickedVideo.parentElement as HTMLElement | null);
          
          if (host) {
            host.classList.add('selected');
            (host as HTMLElement).style.zIndex = '1000';
            host.setAttribute('data-cv-selected', '1');
            attachResizePinchers(doc, host, (height) => {
              updateElementStyle(slideIndex, 'background', 'height', `${height}px`);
            });
            ensureHostResizeObserver(host);
            normFill(host);
          }
          
          setSelectedElement({ slideIndex, element: 'background' });
          setFocusedSlide(slideIndex);
          if (!expandedLayers.has(slideIndex)) setExpandedLayers(s => new Set(s).add(slideIndex));
          logc('select video', { slideIndex, id: clickedVideo.id });
          return;
        }

        ev.preventDefault();
        ev.stopPropagation();

        const wrapper = target.closest('.img-crop-wrapper') as HTMLElement | null;
        const clickedImg = (wrapper?.querySelector('img[data-editable="image"]') ??
                            target.closest('img')) as HTMLImageElement | null;

        if (clickedImg) {
          const { wrapper: w } = ensureImgCropWrapper(doc, clickedImg);
          w.setAttribute('data-cv-selected', '1');
          attachResizePinchers(doc, w, (height) => {
            updateElementStyle(slideIndex, 'background', 'height', `${height}px`);
          });
          ensureHostResizeObserver(w);
          normFill(w);
          
          const originalBorderRadius = w.getAttribute('data-original-border-radius');
          const originalMarginTop = w.getAttribute('data-original-margin-top');
          if (originalBorderRadius) w.style.borderRadius = originalBorderRadius;
          if (originalMarginTop) w.style.marginTop = originalMarginTop;

          setSelectedElement({ slideIndex, element: 'background' });
          setFocusedSlide(slideIndex);
          selectedImageRefs.current[slideIndex] = clickedImg;
          if (!expandedLayers.has(slideIndex)) setExpandedLayers(s => new Set(s).add(slideIndex));
          logc('select image', { slideIndex, id: clickedImg.id });
          return;
        }

        const el = target.closest<HTMLElement>('[data-editable]');
        if (!el) return;
        (el as HTMLElement).style.pointerEvents = 'auto';

        const type = el.getAttribute('data-editable');
        if (type === 'title' || type === 'subtitle' || type === 'nome' || type === 'arroba') {
          el.classList.add('selected');
          (el as HTMLElement).style.zIndex = '1000';
          setSelectedElement({ slideIndex, element: type as any });
          setFocusedSlide(slideIndex);
          if (!expandedLayers.has(slideIndex)) setExpandedLayers(s => new Set(s).add(slideIndex));
          try {
            if (type === 'title' || type === 'subtitle') {
              readAndStoreComputedTextStyles(doc, slideIndex, type as 'title' | 'subtitle', setOriginalStyles);
            }
          } catch {}
          logc('select text', { slideIndex, type, id: el.id });
        } else if (type === 'video' || type === 'background') {
          el.classList.add('selected');
          (el as HTMLElement).style.zIndex = '1000';
          setSelectedElement({ slideIndex, element: 'background' });
          setFocusedSlide(slideIndex);
          if (!expandedLayers.has(slideIndex)) setExpandedLayers(s => new Set(s).add(slideIndex));
          logc('select bg/video host', { slideIndex, id: el.id, type });
        }
      };

      const onDblClick = (ev: MouseEvent) => {
        const t = ev.target as HTMLElement | null;
        const el = t?.closest<HTMLElement>('[data-editable="title"],[data-editable="subtitle"],[data-editable="nome"],[data-editable="arroba"]');
        if (!el) return;
        ev.preventDefault(); ev.stopPropagation();
        el.setAttribute('contenteditable', 'true');
        (el as HTMLElement).focus();
        const range = doc.createRange(); range.selectNodeContents(el);
        const sel = ifr.contentWindow?.getSelection(); if (sel) { sel.removeAllRanges(); sel.addRange(range); }
      };

      const onBlur = (ev: FocusEvent) => {
        const el = ev.target as HTMLElement;
        if (el?.getAttribute('contenteditable') === 'true') {
          el.setAttribute('contenteditable', 'false');
          updateEditedValue(slideIndex, el.getAttribute('data-editable')!, (el.textContent || ''));
          el.classList.remove('selected');
          el.style.zIndex = '';
        }
      };

      const onMouseDownCapture = (ev: MouseEvent) => {
        if (videoCropState.current?.active) return;
        const t = ev.target as HTMLElement | null;
        if (!t) return;

        const vid = t.closest('video[data-editable="video"]') as HTMLVideoElement | null;
        if (vid) { void startVideoDrag(doc, slideIndex, vid, ev); return; }

        const img = t.closest('img[data-editable="image"]') as HTMLImageElement | null;
        if (img) { void startImgDrag(doc, slideIndex, img, ev); return; }

        // Background drag strategies
        const bgDiv = doc.querySelector('.bg') as HTMLElement | null;
        if (bgDiv) {
          const cs = doc.defaultView?.getComputedStyle(bgDiv);
          const bgImage = cs?.backgroundImage || '';
          if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
            void startBgDrag(doc, slideIndex, bgDiv, ev);
            return;
          }
        }
        
        if (doc.body) {
          const csBody = doc.defaultView?.getComputedStyle(doc.body);
          const bgImageBody = csBody?.backgroundImage || '';
          if (bgImageBody && bgImageBody !== 'none' && bgImageBody.includes('url(')) {
            void startBgDrag(doc, slideIndex, doc.body, ev);
            return;
          }
        }
        
        let bgEl: HTMLElement | null = t;
        let depth = 0;
        while (bgEl && bgEl !== doc.body.parentElement && depth < 20) {
          const cs = doc.defaultView?.getComputedStyle(bgEl);
          const bgImage = cs?.backgroundImage || '';
          if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
            void startBgDrag(doc, slideIndex, bgEl, ev);
            return;
          }
          bgEl = bgEl.parentElement;
          depth++;
        }
      };

      const onMove = (ev: MouseEvent) => {
        const st = imgDragState.current;
        if (!st || !st.active) return;
        if (st.doc !== doc) return;

        const dx = ev.clientX - st.startX;
        const dy = ev.clientY - st.startY;
        const nextLeft = clamp(st.left + dx, st.minLeft, 0);
        const nextTop  = clamp(st.top  + dy, st.minTop,  0);

        const maxOffsetX = Math.max(0, st.dispW - st.contW);
        const maxOffsetY = Math.max(0, st.dispH - st.contH);
        const xPerc = maxOffsetX ? (-nextLeft / maxOffsetX) * 100 : 50;
        const yPerc = maxOffsetY ? (-nextTop  / maxOffsetY) * 100 : 50;

        if (st.kind === 'img') {
          (st.targetEl as HTMLImageElement).style.objectPosition = `${xPerc}% ${yPerc}%`;
        } else if (st.kind === 'vid') {
          (st.targetEl as HTMLVideoElement).style.objectPosition = `${xPerc}% ${yPerc}%`;
        } else if (st.kind === 'bg') {
          (st.targetEl as HTMLElement).style.setProperty('background-position-x', `${xPerc}%`, 'important');
          (st.targetEl as HTMLElement).style.setProperty('background-position-y', `${yPerc}%`, 'important');
        }
      };

      const onUp = () => {
        if (imgDragState.current?.active && imgDragState.current.doc === doc) {
          const dragState = imgDragState.current;
          const dragSlideIndex = dragState.slideIndex;
          const key = `${dragSlideIndex}-background`;
          
          if (dragState.kind === 'img' && dragState.mode === 'objpos') {
            const el = dragState.targetEl as HTMLImageElement;
            const computedStyle = doc.defaultView?.getComputedStyle(el);
            const objectPosition = computedStyle?.objectPosition || '50% 50%';
            
            setElementStyles(prev => ({ ...prev, [key]: { ...prev[key], objectPosition } }));
            setHasUnsavedChanges(true);
            el.removeAttribute('data-cv-left');
            el.removeAttribute('data-cv-top');
            logd('saved img position', { slideIndex: dragSlideIndex, objectPosition });
          } else if (dragState.kind === 'bg' && dragState.mode === 'objpos') {
            const el = dragState.targetEl as HTMLElement;
            const computedStyle = doc.defaultView?.getComputedStyle(el);
            const backgroundPositionX = computedStyle?.backgroundPositionX || '50%';
            const backgroundPositionY = computedStyle?.backgroundPositionY || '50%';
            
            setElementStyles(prev => ({ ...prev, [key]: { ...prev[key], backgroundPositionX, backgroundPositionY } }));
            setHasUnsavedChanges(true);
            logd('saved bg position', { slideIndex: dragSlideIndex, backgroundPositionX, backgroundPositionY });
          } else if (dragState.kind === 'vid' && dragState.mode === 'objpos') {
            const el = dragState.targetEl as HTMLVideoElement;
            const computedStyle = doc.defaultView?.getComputedStyle(el);
            const objectPosition = computedStyle?.objectPosition || '50% 50%';
            
            setElementStyles(prev => ({ ...prev, [key]: { ...prev[key], objectPosition } }));
            setHasUnsavedChanges(true);
            logd('saved video position', { slideIndex: dragSlideIndex, objectPosition });
          }
          
          logd('end IMG/BG', { slideIndex: dragSlideIndex });
          imgDragState.current = null;
        }
      };

      const cleanupDragLocal = () => { if (imgDragState.current?.doc === doc) imgDragState.current = null; };

      doc.addEventListener('click', onClickCapture, true);
      doc.addEventListener('dblclick', onDblClick, true);
      doc.addEventListener('blur', onBlur, true);
      doc.addEventListener('mousedown', onMouseDownCapture, true);
      doc.addEventListener('mousemove', onMove);
      doc.addEventListener('mouseup', onUp);
      ifr.contentWindow?.addEventListener('blur', cleanupDragLocal);
      doc.addEventListener('mouseleave', cleanupDragLocal);

      disposers.push(() => {
        try { doc.removeEventListener('click', onClickCapture, true); } catch {}
        try { doc.removeEventListener('dblclick', onDblClick, true); } catch {}
        try { doc.removeEventListener('blur', onBlur, true); } catch {}
        try { doc.removeEventListener('mousedown', onMouseDownCapture, true); } catch {}
        try { doc.removeEventListener('mousemove', onMove); } catch {}
        try { doc.removeEventListener('mouseup', onUp); } catch {}
        try { ifr.contentWindow?.removeEventListener('blur', cleanupDragLocal); } catch {}
        try { doc.removeEventListener('mouseleave', cleanupDragLocal); } catch {}
      });

      logb('delegation wired', { slideIndex });
    };

    // Cleanup previous disposers
    disposers.forEach(d => d());
    disposers.length = 0;

    iframeRefs.current.forEach((ifr, idx) => { 
      if (ifr) {
        const setup = () => {
          const doc = ifr.contentDocument || ifr.contentWindow?.document;
          if (!doc) return;
          
          setupIframe(ifr, idx);
          applyStylesFromState(ifr, idx, editedContent, elementStyles);
          
          const docForImgs = ifr.contentDocument || ifr.contentWindow?.document;
          if (docForImgs) {
            const imgs = docForImgs.querySelectorAll('img[data-editable="image"]');
            imgs.forEach(img => {
              const imgEl = img as HTMLImageElement;
              if (imgEl.complete) {
                setTimeout(() => applyStylesFromState(ifr, idx, editedContent, elementStyles), 100);
              } else {
                imgEl.addEventListener('load', () => {
                  setTimeout(() => applyStylesFromState(ifr, idx, editedContent, elementStyles), 100);
                }, { once: true });
              }
            });
          }
        };
        
        const delay = idx === 0 ? 150 : 50;
        
        setTimeout(() => {
          const doc = ifr.contentDocument || ifr.contentWindow?.document;
          if (doc && doc.readyState === 'complete') {
            setup();
          } else {
            ifr.addEventListener('load', setup, { once: true });
            setTimeout(() => {
              const docRetry = ifr.contentDocument || ifr.contentWindow?.document;
              if (docRetry && docRetry.readyState === 'complete') {
                setup();
              }
            }, delay + 200);
          }
        }, delay);
      }
    });
    
    return () => { 
      disposers.forEach(d => d()); 
      disposers.length = 0;
    };
  }, [renderedSlides]);
}
