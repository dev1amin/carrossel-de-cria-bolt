/**
 * @file useIframeEvents.ts
 * @description Hook para gerenciar eventos dentro dos iframes dos slides
 */

import { useEffect } from 'react';
import type { ElementStyles, ElementType, CarouselData } from '../../../../types/carousel';
import {
  logc, logb, logd,
  readAndStoreComputedTextStyles,
  cleanupAltArtifacts, installAltCleanupObserver,
  ensureImgCropWrapper,
  ensureHostResizeObserver,
  attachResizePinchers,
  normFill,
} from '../viewerUtils';
import {
  videoCropState,
  startImgDrag,
  startVideoDrag,
  startBgDrag,
  handleDragMove,
  handleDragEnd,
  cleanupDrag
} from '../handlers/dragHandlers';
import { applyStylesFromState } from './useSlideRender';

interface UseIframeEventsParams {
  slides: string[];
  data: CarouselData;
  iframeRefs: React.MutableRefObject<HTMLIFrameElement[]>;
  disposersRef: React.MutableRefObject<Array<() => void>>;
  editedContent: Record<string, any>;
  elementStyles: Record<string, ElementStyles>;
  expandedLayers: Set<number>;
  selectedImageRefs: React.MutableRefObject<Record<number, HTMLImageElement>>;
  setSelectedElement: React.Dispatch<React.SetStateAction<{ slideIndex: number; element: ElementType | null }>>;
  setFocusedSlide: React.Dispatch<React.SetStateAction<number>>;
  setExpandedLayers: React.Dispatch<React.SetStateAction<Set<number>>>;
  setOriginalStyles: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setElementStyles: React.Dispatch<React.SetStateAction<Record<string, ElementStyles>>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  updateEditedValue: (slideIndex: number, field: string, value: string) => void;
  updateElementStyle: (slideIndex: number, element: string, property: string, value: string) => void;
  clearAllSelections: () => void;
  postProcessTemplateVideos: (doc: Document) => void;
}

/**
 * Hook para configurar event listeners nos iframes dos slides
 */
export function useIframeEvents({
  slides,
  data,
  iframeRefs,
  disposersRef,
  editedContent,
  elementStyles,
  expandedLayers,
  selectedImageRefs,
  setSelectedElement,
  setFocusedSlide,
  setExpandedLayers,
  setOriginalStyles,
  setElementStyles,
  setHasUnsavedChanges,
  updateEditedValue,
  updateElementStyle,
  clearAllSelections,
  postProcessTemplateVideos,
}: UseIframeEventsParams) {

  useEffect(() => {
    const disposers = disposersRef.current;

    const wireIframe = (ifr: HTMLIFrameElement, slideIndex: number) => {
      const doc = ifr?.contentDocument;
      if (!doc || !ifr.contentWindow) {
        logd('no doc', { slideIndex, ifr });
        return;
      }

      // Post-process template videos
      postProcessTemplateVideos(doc);

      // Cleanup de artifacts de alt e instalação do observer
      try { cleanupAltArtifacts(doc.body); } catch {}
      try { installAltCleanupObserver(doc); } catch {}

      // Aplica estilos salvos após o iframe carregar
      setTimeout(() => {
        applyStylesFromState(ifr, slideIndex, editedContent, elementStyles);
      }, 100);

      // === Event Handlers ===

      const onClickCapture = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();

        clearAllSelections();

        const target = ev.target as HTMLElement;
        if (!target) return;

        // === SELEÇÃO DE VIDEO ===
        const videoEl = target.closest('video[data-editable="video"]') as HTMLVideoElement | null;
        const videoContainer = target.closest('.video-container') as HTMLElement | null;
        
        if (videoEl || videoContainer) {
          const container = videoContainer || videoEl?.parentElement;
          if (container) {
            container.classList.add('selected');
            container.setAttribute('data-cv-selected', '1');
            (container as HTMLElement).style.zIndex = '1000';
            
            ensureHostResizeObserver(container);
            normFill(container);
            
            setSelectedElement({ slideIndex, element: 'background' });
            setFocusedSlide(slideIndex);
            if (!expandedLayers.has(slideIndex)) setExpandedLayers(s => new Set(s).add(slideIndex));
            logc('select video container', { slideIndex, container: container.className });
            return;
          }
        }

        // === SELEÇÃO DE IMAGEM ===
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

          // Garante que os estilos preservados sejam reaplicados após seleção
          const originalBorderRadius = w.getAttribute('data-original-border-radius');
          const originalMarginTop = w.getAttribute('data-original-margin-top');
          if (originalBorderRadius) {
            w.style.borderRadius = originalBorderRadius;
          }
          if (originalMarginTop) {
            w.style.marginTop = originalMarginTop;
          }

          setSelectedElement({ slideIndex, element: 'background' });
          setFocusedSlide(slideIndex);
          selectedImageRefs.current[slideIndex] = clickedImg;
          if (!expandedLayers.has(slideIndex)) setExpandedLayers(s => new Set(s).add(slideIndex));
          logc('select image', { slideIndex, id: clickedImg.id });
          return;
        }

        // === SELEÇÃO DE TEXTO ===
        const el = target.closest<HTMLElement>('[data-editable]');
        
        // Se não encontrou elemento com data-editable, verifica background-image CSS
        if (!el) {
          let bgImageElement: HTMLElement | null = target;
          let bgDepth = 0;
          while (bgImageElement && bgImageElement !== doc.body.parentElement && bgDepth < 15) {
            const computedStyle = doc.defaultView?.getComputedStyle(bgImageElement);
            const bgImage = computedStyle?.backgroundImage || '';
            if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
              // Encontrou elemento com background-image
              bgImageElement.classList.add('selected');
              bgImageElement.style.zIndex = '1000';
              bgImageElement.setAttribute('data-cv-selected', '1');
              setSelectedElement({ slideIndex, element: 'background' });
              setFocusedSlide(slideIndex);
              if (!expandedLayers.has(slideIndex)) setExpandedLayers(s => new Set(s).add(slideIndex));
              logc('select bg-image element', { slideIndex, tagName: bgImageElement.tagName, bgImage: bgImage.substring(0, 80) });
              return;
            }
            bgImageElement = bgImageElement.parentElement;
            bgDepth++;
          }
          return;
        }
        (el as HTMLElement).style.pointerEvents = 'auto';

        const type = el.getAttribute('data-editable');
        if (type === 'title' || type === 'subtitle') {
          el.classList.add('selected');
          (el as HTMLElement).style.zIndex = '1000';
          setSelectedElement({ slideIndex, element: type as any });
          setFocusedSlide(slideIndex);
          if (!expandedLayers.has(slideIndex)) setExpandedLayers(s => new Set(s).add(slideIndex));
          try {
            readAndStoreComputedTextStyles(
              doc,
              slideIndex,
              type as 'title' | 'subtitle',
              setOriginalStyles
            );
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
        const el = t?.closest<HTMLElement>('[data-editable="title"],[data-editable="subtitle"]');
        if (!el) return;
        ev.preventDefault();
        ev.stopPropagation();
        el.setAttribute('contenteditable', 'true');
        (el as HTMLElement).focus();
        const range = doc.createRange();
        range.selectNodeContents(el);
        const sel = ifr.contentWindow?.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
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
        console.log('🖱️ onMouseDownCapture chamado', { target: (ev.target as HTMLElement)?.tagName });

        if (videoCropState.current?.active) return;
        const t = ev.target as HTMLElement | null;
        if (!t) return;

        const vid = t.closest('video[data-editable="video"]') as HTMLVideoElement | null;
        if (vid) {
          console.log('🎬 Iniciando drag de vídeo');
          void startVideoDrag(doc, slideIndex, vid, ev);
          return;
        }

        const img = t.closest('img[data-editable="image"]') as HTMLImageElement | null;
        if (img) {
          console.log('🖼️ Iniciando drag de imagem');
          void startImgDrag(doc, slideIndex, img, ev);
          return;
        }

        console.log('🔍 Procurando por elemento com background...');

        // ESTRATÉGIA 1: Procura por elemento .bg no mesmo container
        const bgDiv = doc.querySelector('.bg') as HTMLElement | null;
        if (bgDiv) {
          const cs = doc.defaultView?.getComputedStyle(bgDiv);
          const bgImage = cs?.backgroundImage || '';
          console.log('🎨 Encontrado .bg div:', bgImage.substring(0, 80));

          if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
            console.log('🎯 Usando .bg div para drag');
            void startBgDrag(doc, slideIndex, bgDiv, ev);
            return;
          }
        }

        // ESTRATÉGIA 2: Verifica o body
        if (doc.body) {
          const csBody = doc.defaultView?.getComputedStyle(doc.body);
          const bgImageBody = csBody?.backgroundImage || '';
          console.log('🎨 Verificando body:', bgImageBody.substring(0, 80));

          if (bgImageBody && bgImageBody !== 'none' && bgImageBody.includes('url(')) {
            console.log('🎯 Usando body para drag');
            void startBgDrag(doc, slideIndex, doc.body, ev);
            return;
          }
        }

        // ESTRATÉGIA 3: Procura subindo na árvore DOM
        let bgEl: HTMLElement | null = t;
        let depth = 0;
        while (bgEl && bgEl !== doc.body.parentElement && depth < 20) {
          const cs = doc.defaultView?.getComputedStyle(bgEl);
          const bgImage = cs?.backgroundImage || '';

          console.log(`  📊 Nível ${depth}: ${bgEl.tagName}.${bgEl.className} - bg: ${bgImage.substring(0, 50)}...`);

          if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
            console.log('🎯 Encontrado elemento com background na árvore:', {
              element: bgEl.tagName,
              className: bgEl.className,
              id: bgEl.id,
              backgroundImage: bgImage
            });
            void startBgDrag(doc, slideIndex, bgEl, ev);
            return;
          }

          bgEl = bgEl.parentElement;
          depth++;
        }

        console.log('❌ Nenhum elemento com background encontrado após todas as estratégias');
      };

      const onMove = (ev: MouseEvent) => {
        handleDragMove(ev, doc);
      };

      const onUp = () => {
        handleDragEnd(doc, setElementStyles, setHasUnsavedChanges);
      };

      const onCleanupDrag = () => {
        cleanupDrag(doc);
      };

      // Registra todos os event listeners
      doc.addEventListener('click', onClickCapture, true);
      doc.addEventListener('dblclick', onDblClick, true);
      doc.addEventListener('blur', onBlur, true);
      doc.addEventListener('mousedown', onMouseDownCapture, true);
      doc.addEventListener('mousemove', onMove);
      doc.addEventListener('mouseup', onUp);
      ifr.contentWindow?.addEventListener('blur', onCleanupDrag);
      doc.addEventListener('mouseleave', onCleanupDrag);

      disposers.push(() => {
        try { doc.removeEventListener('click', onClickCapture, true); } catch {}
        try { doc.removeEventListener('dblclick', onDblClick, true); } catch {}
        try { doc.removeEventListener('blur', onBlur, true); } catch {}
        try { doc.removeEventListener('mousedown', onMouseDownCapture, true); } catch {}
        try { doc.removeEventListener('mousemove', onMove); } catch {}
        try { doc.removeEventListener('mouseup', onUp); } catch {}
        try { ifr.contentWindow?.removeEventListener('blur', onCleanupDrag); } catch {}
        try { doc.removeEventListener('mouseleave', onCleanupDrag); } catch {}
      });

      logb('delegation wired', { slideIndex });
    };

    // Wire all iframes
    const timer = setTimeout(() => {
      iframeRefs.current.forEach((ifr, i) => {
        if (ifr) wireIframe(ifr, i);
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      disposers.forEach(fn => { try { fn(); } catch {} });
      disposers.length = 0;
    };
  }, [slides, data]); // Re-wire quando slides ou data mudam
}
