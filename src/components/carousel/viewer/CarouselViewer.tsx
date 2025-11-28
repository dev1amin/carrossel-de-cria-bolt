// CarouselViewer.tsx
import React, { useEffect, useCallback } from 'react';
import type { CarouselData, ElementType, ElementStyles } from '../../../types/carousel';
import { AVAILABLE_TEMPLATES, TEMPLATE_DIMENSIONS } from '../../../types/carousel';
import { searchImages, templateRenderer } from '../../../services/carousel';
import { getGeneratedContent } from '../../../services/generatedContent';
import Toast from '../../Toast';
import { TopBar } from './TopBar';
import { LayersSidebar } from './LayersSidebar';
import { PropertiesPanel } from './PropertiesPanel';
import { CanvasArea } from './CanvasArea';
import {
  logd,
  readAndStoreComputedTextStyles,
  cleanupAltArtifacts,
  forceVideoStyle,
  attachPlayOverlay,
  ensureHostResizeObserver,
  disposePinchersInDoc,
  normFill,
  applyBackgroundImageImmediate,
} from './viewerUtils';

import { useViewerState } from './hooks/useViewerState';
import { useUnsavedChangesWarning } from './hooks/useUnsavedChangesWarning';
import { useIframeWiring } from './hooks/useIframeWiring';
import { useBackgroundMedia } from './hooks/useBackgroundMedia';
import { useSaveDownload } from './hooks/useSaveDownload';
import {
  handleZoomIn as zoomIn,
  handleZoomOut as zoomOut,
} from './handlers/zoomHandlers';

interface CarouselViewerProps {
  slides: string[];
  carouselData: CarouselData;
  onClose: () => void;
  generatedContentId?: number;
  onSaveSuccess?: () => void;
  autoDownload?: boolean;
}

const CarouselViewer: React.FC<CarouselViewerProps> = ({
  slides,
  carouselData,
  onClose,
  generatedContentId,
  onSaveSuccess,
  autoDownload = false,
}) => {
  console.log('🎨 CarouselViewer montado:', {
    slidesLength: slides?.length,
    hasCarouselData: !!carouselData,
    generatedContentId,
    firstSlideLength: slides?.[0]?.length || 0,
  });

  // Migração de formato
  const migratedData = React.useMemo(() => {
    const data = carouselData as any;

    if (data.conteudos && Array.isArray(data.conteudos)) return carouselData;

    if (data.slides && Array.isArray(data.slides)) {
      console.log('🔄 Migrando carouselData.slides para data.conteudos');
      return {
        ...carouselData,
        conteudos: data.slides,
      };
    }

    return null;
  }, [carouselData]);

  if (
    !migratedData ||
    !(migratedData as any).conteudos ||
    !Array.isArray((migratedData as any).conteudos)
  ) {
    console.error('❌ CarouselViewer: data.conteudos não encontrado ou inválido:', carouselData);
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="bg-neutral-900 p-8 rounded-lg max-w-md text-center">
          <h2 className="text-white text-xl font-bold mb-4">Erro ao carregar carrossel</h2>
          <p className="text-neutral-400 mb-6">
            Os dados do carrossel estão em um formato incompatível com o editor.
          </p>
          <button
            onClick={onClose}
            className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const data = migratedData;

  // Compatibilidade do template
  const templateCompatibility = React.useMemo(() => {
    const templateId = (data as any).dados_gerais?.template || '1';
    const template = AVAILABLE_TEMPLATES.find((t) => t.id === templateId);
    return template?.compatibility || 'video-image';
  }, [(data as any).dados_gerais?.template]);

  useEffect(() => {
    templateRenderer.setTemplateCompatibility(templateCompatibility);
    console.log(`🎨 CarouselViewer: Template compatibility set to: ${templateCompatibility}`);
  }, [templateCompatibility]);

  // Dimensões do template
  const templateId = (data as any).dados_gerais?.template || '1';
  const templateDimensions = TEMPLATE_DIMENSIONS[templateId] || { width: 1080, height: 1350 };
  const slideWidth = templateDimensions.width;
  const slideHeight = templateDimensions.height;
  const gap = 40;

  // Estado central do viewer
  const viewerState = useViewerState(slides, generatedContentId);

  const {
    zoom,
    setZoom,
    pan,
    setPan,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    focusedSlide,
    setFocusedSlide,
    selectedElement,
    setSelectedElement,
    expandedLayers,
    setExpandedLayers,
    isLayersMinimized,
    setIsLayersMinimized,
    isPropertiesMinimized,
    setIsPropertiesMinimized,
    editedContent,
    setEditedContent,
    elementStyles,
    setElementStyles,
    originalStyles,
    setOriginalStyles,
    renderedSlides,
    setRenderedSlides,
    isLoadingProperties,
    setIsLoadingProperties,
    searchKeyword,
    setSearchKeyword,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    uploadedImages,
    setUploadedImages,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isSaving,
    setIsSaving,
    autoDownloadExecuted,
    setAutoDownloadExecuted,
    contentId,
    setContentId,
    toasts,
    addToast,
    removeToast,
    iframeRefs,
    containerRef,
    selectedImageRefs,
    lastSearchId,
    disposersRef,
  } = viewerState;

  // Flag para NÃO recentralizar várias vezes
  const hasInitialCenteredRef = React.useRef(false);

  // ========= CENTRALIZAÇÃO MATEMÁTICA (CONSIDERA ZOOM) =========
  const centerSlide = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container || !slides.length) return;

      const rect = container.getBoundingClientRect();
      const viewportWidth = rect.width;
      const viewportHeight = rect.height;

      // Mundo começa em (0,0). Slides enfileirados na horizontal.
      const slideWorldCenterX = index * (slideWidth + gap) + slideWidth / 2;
      const slideWorldCenterY = slideHeight / 2;

      // Com transform: translate(pan) scale(zoom)
      // screenX = pan.x + zoom * worldX
      // Queremos: screenX_center = viewportWidth / 2
      const panX = viewportWidth / 2 - zoom * slideWorldCenterX;
      const panY = viewportHeight / 2 - zoom * slideWorldCenterY;

      console.log('📍 centerSlide (math)', {
        index,
        viewportWidth,
        viewportHeight,
        slideWorldCenterX,
        slideWorldCenterY,
        zoom,
        panX,
        panY,
      });

      setPan({ x: panX, y: panY });
    },
    [containerRef, slides.length, slideWidth, slideHeight, gap, zoom, setPan],
  );

  // Aviso sobre mudanças não salvas
  useUnsavedChangesWarning(hasUnsavedChanges);

  // Busca automática do generatedContentId
  useEffect(() => {
    if (contentId) {
      console.log('✅ generatedContentId já existe:', contentId);
      return;
    }

    const firstTitle = (data as any).conteudos?.[0]?.title;
    if (!firstTitle) {
      console.log('⚠️ Primeiro título não encontrado, não é possível buscar ID');
      return;
    }

    const fetchContentId = async () => {
      try {
        const response = await getGeneratedContent({ limit: 100 });
        const matchingContent = response.data?.find((content: any) => {
          try {
            const result =
              typeof content.result === 'string' ? JSON.parse(content.result) : content.result;
            const contentFirstTitle = result?.conteudos?.[0]?.title;
            return contentFirstTitle === firstTitle;
          } catch {
            return false;
          }
        });

        if (matchingContent) {
          setContentId(matchingContent.id);
          addToast('ID do conteúdo encontrado! Você pode salvar alterações.', 'success');
        }
      } catch (error) {
        console.error('❌ Erro ao buscar generatedContentId:', error);
      }
    };

    fetchContentId();
  }, []); // uma vez

  // Limpa seleções
  const clearAllSelections = () => {
    iframeRefs.current.forEach((ifr) => {
      const d = ifr?.contentDocument || ifr?.contentWindow?.document;
      if (!d) return;
      d.querySelectorAll('[data-editable].selected').forEach((el) => {
        el.classList.remove('selected');
        (el as HTMLElement).style.zIndex = '';
      });
      d.querySelectorAll('.img-crop-wrapper[data-cv-selected="1"]').forEach((el) => {
        (el as HTMLElement).removeAttribute('data-cv-selected');
      });
      d.querySelectorAll('.video-container.selected, .video-container[data-cv-selected="1"]').forEach(
        (el) => {
          el.classList.remove('selected');
          (el as HTMLElement).removeAttribute('data-cv-selected');
          (el as HTMLElement).style.zIndex = '';
        },
      );
      try {
        disposePinchersInDoc(d);
      } catch {}
    });
  };

  // ========= REFLEXO DE EDIÇÕES NO IFRAME =========
  useEffect(() => {
    Object.entries(editedContent).forEach(([k, val]) => {
      const [slideStr, field] = k.split('-');
      const slideIndex = Number(slideStr);
      if (Number.isNaN(slideIndex)) return;
      if (field !== 'title' && field !== 'subtitle' && field !== 'nome' && field !== 'arroba')
        return;

      const ifr = iframeRefs.current[slideIndex];
      const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
      const el = doc?.getElementById(`slide-${slideIndex}-${field}`);
      if (el && typeof val === 'string') el.textContent = val;
    });

    Object.entries(elementStyles).forEach(([k, sty]) => {
      const [slideStr, field] = k.split('-');
      const slideIndex = Number(slideStr);
      if (Number.isNaN(slideIndex)) return;

      const ifr = iframeRefs.current[slideIndex];
      const doc = ifr?.contentDocument || ifr?.contentWindow?.document;

      if (!doc) return;

      if (field === 'title' || field === 'subtitle' || field === 'nome' || field === 'arroba') {
        const el = doc.getElementById(`slide-${slideIndex}-${field}`) as HTMLElement | null;
        if (!el) return;
        if (sty.fontSize) el.style.fontSize = sty.fontSize;
        if (sty.fontWeight) el.style.fontWeight = String(sty.fontWeight);
        if (sty.textAlign) el.style.textAlign = sty.textAlign as any;
        if (sty.color) el.style.color = sty.color;
      }

      if (field === 'background') {
        const img = doc.querySelector('img[data-editable="image"]') as HTMLImageElement | null;
        if (img && sty.objectPosition) {
          img.style.setProperty('object-position', sty.objectPosition, 'important');
        }

        const video = doc.querySelector(
          'video[data-editable="video"]',
        ) as HTMLVideoElement | null;
        if (video && sty.objectPosition) {
          video.style.setProperty('object-position', sty.objectPosition, 'important');
        }

        if (sty.backgroundPositionX || sty.backgroundPositionY) {
          const bgElements = doc.querySelectorAll(
            '[data-editable="background"], body, div, section, header, main, figure, article',
          );
          bgElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const cs = doc.defaultView?.getComputedStyle(htmlEl);
            if (cs?.backgroundImage?.includes('url(')) {
              if (sty.backgroundPositionX) {
                htmlEl.style.setProperty(
                  'background-position-x',
                  sty.backgroundPositionX,
                  'important',
                );
              }
              if (sty.backgroundPositionY) {
                htmlEl.style.setProperty(
                  'background-position-y',
                  sty.backgroundPositionY,
                  'important',
                );
              }
            }
          });
        }
      }
    });
  }, [editedContent, elementStyles]);

  // ========= INJEÇÃO DE IDs / STYLE =========
  const ensureStyleTag = (html: string) => {
    if (!/<style[\s>]/i.test(html)) {
      return html.replace(/<head([^>]*)>/i, `<head$1><style></style>`);
    }
    return html;
  };

  const stripAltGarbage = (html: string) =>
    html.replace(/>\s*alt\s*=\s*(?:""|''|&quot;&quot;)\s*>/gi, '>');

  const injectEditableIds = (html: string, slideIndex: number): string => {
    let result = ensureStyleTag(html);
    const conteudo = data.conteudos[slideIndex];
    const titleText = conteudo?.title || '';
    const subtitleText = conteudo?.subtitle || '';
    const nomeText = data.dados_gerais?.nome || '';
    const arrobaText = data.dados_gerais?.arroba || '';

    const addEditableSpan = (text: string, id: string, attr: string) => {
      if (!text) return;
      const searchText = text.trim();
      if (!searchText) return;
      if (result.includes(`data-editable="${attr}"`)) {
        console.log(`⏭️ ${attr} já injetado no slide ${slideIndex}`);
        return;
      }
      
      console.log(`🔍 Buscando ${attr} no slide ${slideIndex}:`, JSON.stringify(searchText));

      // Estratégia 1: Busca exata >texto<
      const searchPattern = `>${searchText}<`;
      let idx = result.indexOf(searchPattern);

      if (idx !== -1) {
        const before = result.slice(0, idx + 1);
        const after = result.slice(idx + 1 + searchText.length);
        result = `${before}<span id="${id}" data-editable="${attr}" contenteditable="false">${searchText}</span>${after}`;
        console.log(`✅ Injetado ${attr} (exato) no slide ${slideIndex}:`, searchText);
        return;
      }

      // Estratégia 2: Busca com regex normalizado
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const normalizedSearch = escaped.replace(/\s+/g, '\\s*');
      const re = new RegExp(`>(${normalizedSearch})<`, 'i');
      const match = result.match(re);
      if (match && match.index !== undefined) {
        const matchedText = match[1];
        const fullMatch = match[0];
        const before = result.slice(0, match.index + 1);
        const after = result.slice(match.index + fullMatch.length - 1);
        result = `${before}<span id="${id}" data-editable="${attr}" contenteditable="false">${matchedText}</span>${after}`;
        console.log(`✅ Injetado ${attr} (regex) no slide ${slideIndex}:`, matchedText);
        return;
      }
      
      // Estratégia 3: Busca o texto em qualquer lugar entre tags (mais flexível)
      const flexRe = new RegExp(`>([^<]*)(${escaped})([^<]*)<`, 'i');
      const flexMatch = result.match(flexRe);
      if (flexMatch && flexMatch.index !== undefined) {
        const beforeText = flexMatch[1];
        const matchedText = flexMatch[2];
        const afterText = flexMatch[3];
        const fullMatchLen = flexMatch[0].length;
        const before = result.slice(0, flexMatch.index + 1);
        const after = result.slice(flexMatch.index + fullMatchLen - 1);
        // Reconstrói preservando texto antes e depois
        result = `${before}${beforeText}<span id="${id}" data-editable="${attr}" contenteditable="false">${matchedText}</span>${afterText}${after}`;
        console.log(`✅ Injetado ${attr} (flex) no slide ${slideIndex}:`, searchText);
        return;
      }
      
      // Estratégia 4 (para arroba): Tenta variações com @ 
      if (attr === 'arroba') {
        // Se o texto NÃO começa com @, tenta buscar @texto
        if (!searchText.startsWith('@')) {
          const withAt = `@${searchText}`;
          const atPattern = `>${withAt}<`;
          const atIdx = result.indexOf(atPattern);
          if (atIdx !== -1) {
            const before = result.slice(0, atIdx + 1);
            const after = result.slice(atIdx + 1 + withAt.length);
            result = `${before}<span id="${id}" data-editable="${attr}" contenteditable="false">${withAt}</span>${after}`;
            console.log(`✅ Injetado ${attr} (com @ adicionado) no slide ${slideIndex}:`, withAt);
            return;
          }
          
          // Busca flexível com @
          const escapedWithAt = withAt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const flexAtRe = new RegExp(`>([^<]*)(${escapedWithAt})([^<]*)<`, 'i');
          const flexAtMatch = result.match(flexAtRe);
          if (flexAtMatch && flexAtMatch.index !== undefined) {
            const beforeText = flexAtMatch[1];
            const matchedText = flexAtMatch[2];
            const afterText = flexAtMatch[3];
            const fullMatchLen = flexAtMatch[0].length;
            const before = result.slice(0, flexAtMatch.index + 1);
            const after = result.slice(flexAtMatch.index + fullMatchLen - 1);
            result = `${before}${beforeText}<span id="${id}" data-editable="${attr}" contenteditable="false">${matchedText}</span>${afterText}${after}`;
            console.log(`✅ Injetado ${attr} (flex com @) no slide ${slideIndex}:`, matchedText);
            return;
          }
        }
        
        // Se o texto COMEÇA com @, tenta buscar sem o @
        if (searchText.startsWith('@')) {
          const withoutAt = searchText.slice(1);
          const usernameIdx = result.indexOf(`>${withoutAt}<`);
          if (usernameIdx !== -1) {
            const before = result.slice(0, usernameIdx + 1);
            const after = result.slice(usernameIdx + 1 + withoutAt.length);
            result = `${before}<span id="${id}" data-editable="${attr}" contenteditable="false">${withoutAt}</span>${after}`;
            console.log(`✅ Injetado ${attr} (sem @) no slide ${slideIndex}:`, withoutAt);
            return;
          }
        }
      }
      
      // Estratégia 5: Busca por qualquer span/p/div contendo o texto
      const tagRe = new RegExp(`(<(?:span|p|div)[^>]*>)\\s*(${escaped})\\s*(<\\/(?:span|p|div)>)`, 'i');
      const tagMatch = result.match(tagRe);
      if (tagMatch && tagMatch.index !== undefined) {
        const openTag = tagMatch[1];
        const matchedText = tagMatch[2];
        const closeTag = tagMatch[3];
        const fullMatchLen = tagMatch[0].length;
        const before = result.slice(0, tagMatch.index);
        const after = result.slice(tagMatch.index + fullMatchLen);
        
        // Adiciona data-editable à tag existente
        const newOpenTag = openTag.replace('>', ` id="${id}" data-editable="${attr}" contenteditable="false">`);
        result = `${before}${newOpenTag}${matchedText}${closeTag}${after}`;
        console.log(`✅ Injetado ${attr} (na tag) no slide ${slideIndex}:`, matchedText);
        return;
      }
      
      console.warn(`⚠️ Não encontrou ${attr} no slide ${slideIndex}:`, searchText);
      // Log dos primeiros 500 chars do HTML para debug
      if (attr === 'arroba') {
        console.log(`📄 HTML (slide ${slideIndex}):`, result.slice(0, 500));
      }
    };

    if (arrobaText) addEditableSpan(arrobaText, `slide-${slideIndex}-arroba`, 'arroba');
    if (nomeText) addEditableSpan(nomeText, `slide-${slideIndex}-nome`, 'nome');
    if (subtitleText) addEditableSpan(subtitleText, `slide-${slideIndex}-subtitle`, 'subtitle');
    if (titleText) addEditableSpan(titleText, `slide-${slideIndex}-title`, 'title');

    result = result.replace(
      /<style>/i,
      `<style>
      * {
        user-select: none !important;
      }
      [contenteditable="true"] {
        user-select: text !important;
      }
      [data-editable]{cursor:pointer!important;position:relative;display:inline-block!important;pointer-events:auto!important}
      [data-editable].selected{outline:3px solid #3B82F6!important;outline-offset:2px;z-index:1000}
      [data-editable]:hover:not(.selected){outline:2px solid rgba(59,130,246,.5)!important;outline-offset:2px}
      [data-editable][contenteditable="true"]{outline:3px solid #10B981!important;outline-offset:2px;background:rgba(16,185,129,.1)!important}
      [data-editable="nome"],[data-editable="arroba"]{z-index:100!important;pointer-events:auto!important}
      img[data-editable], video[data-editable]{display:block!important}
      html, body { pointer-events: auto !important; margin:0!important;padding:0!important;overflow:hidden!important;}
      img, video { max-width:none !important; }
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
      video[data-editable="video"]:not(.video-container video){
        width:100% !important;
        height:450px;
        object-fit:cover !important;
        display:block !important;
        border-radius:24px !important;
        margin-top:0 !important;
        box-shadow:0 16px 48px rgba(0,0,0,.18) !important;
      }
      .img-crop-wrapper img,
      img[data-editable="image"]{ 
        margin-top:0 !important;
        transform: none !important;
        filter: none !important;
        object-fit: cover !important;
      }
      .img-crop-wrapper[data-cv-selected="1"],
      .video-container.selected,
      .video-container[data-cv-selected="1"]{
        outline:3px solid #3B82F6!important;
        outline-offset:2px;
        z-index:1000;
      }
      .video-container { cursor:pointer!important; }
    `,
    );

    return result.replace(
      /<body([^>]*)>/i,
      (m, attrs) =>
        /id=/.test(attrs)
          ? m
          : `<body${attrs} id="slide-${slideIndex}-background" data-editable="background">`,
    );
  };

  // ========= PROCESSA SLIDES =========
  useEffect(() => {
    const processedSlides = slides.map((s, i) => injectEditableIds(stripAltGarbage(s), i));
    setRenderedSlides(processedSlides);

    setSelectedElement({ slideIndex: 0, element: null });
    setFocusedSlide(0);
    setElementStyles({});
    setOriginalStyles({});
    selectedImageRefs.current = {};

    if (data.styles) {
      const loadedStyles: Record<string, ElementStyles> = {};
      Object.entries(data.styles).forEach(([slideIndex, slideStyles]: [string, any]) => {
        Object.entries(slideStyles).forEach(([elementType, styles]: [string, any]) => {
          const key = `${slideIndex}-${elementType}`;
          loadedStyles[key] = styles as ElementStyles;
        });
      });
      setElementStyles(loadedStyles);
    }

    // Garante pointer-events nos iframes depois que os slides forem montados
    requestAnimationFrame(() => {
      iframeRefs.current.forEach((ifr) => {
        if (ifr?.contentDocument) {
          const doc = ifr.contentDocument;
          doc.querySelectorAll('[data-editable]').forEach((el) => {
            (el as HTMLElement).style.pointerEvents = 'auto';
          });
        }
      });
    });
  }, [slides, data.styles]);

  // ========= CENTRALIZAÇÃO INICIAL (UMA VEZ POR MONTAGEM) =========
  useEffect(() => {
    if (!renderedSlides.length) return;
    if (hasInitialCenteredRef.current) return;

    hasInitialCenteredRef.current = true;

    // Espera um frame pra garantir que o container tem dimensões corretas
    requestAnimationFrame(() => {
      centerSlide(0);
    });
  }, [renderedSlides.length, centerSlide]);

  // Reset ao trocar de carrossel
  useEffect(() => {
    setFocusedSlide(0);
    setSelectedElement({ slideIndex: 0, element: null });
    setElementStyles({});
    setOriginalStyles({});
    setEditedContent({});
    hasInitialCenteredRef.current = false;
  }, [slides]);

  // ========= VÍDEOS / PLACEHOLDER, ETC =========
  const postProcessTemplateVideos = (doc: Document) => {
    Array.from(doc.querySelectorAll<HTMLElement>('.video-container')).forEach((host) => {
      host.style.position = host.style.position || 'relative';
      host.style.overflow = 'hidden';
      (host.style as any).height = (host.style as any).height || '450px';
      const v = host.querySelector('video');
      if (v) {
        v.setAttribute('data-editable', 'video');
        forceVideoStyle(v as HTMLVideoElement);
        (v as HTMLVideoElement).style.position = 'absolute';
        (v as any).style.inset = '0';
        (v as HTMLVideoElement).style.width = '100%';
        (v as HTMLVideoElement).style.height = '100%';
        (v as HTMLVideoElement).style.objectFit = 'cover';
        try {
          (v as HTMLVideoElement).pause();
        } catch {}
        try {
          (v as HTMLVideoElement).load();
        } catch {}
        attachPlayOverlay(doc, host, v as HTMLVideoElement);
        ensureHostResizeObserver(host);
        normFill(host);
      }
    });

    Array.from(doc.querySelectorAll<HTMLVideoElement>('video')).forEach((v) => {
      if (v.closest('.video-container')) return;
      const cs = doc.defaultView?.getComputedStyle(v);
      const parent = v.parentElement;
      const preservedStyles = {
        borderRadius: cs?.borderRadius || '',
        boxShadow: cs?.boxShadow || '',
        marginTop: cs?.marginTop || '',
        width: cs?.width || '100%',
        height: cs?.height || '450px',
      };

      if (!parent || !parent.classList.contains('video-container')) {
        const container = doc.createElement('div');
        container.className = 'video-container';
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.style.width = preservedStyles.width;
        container.style.height = preservedStyles.height;
        if (preservedStyles.borderRadius && preservedStyles.borderRadius !== '0px') {
          container.style.borderRadius = preservedStyles.borderRadius;
        }
        if (preservedStyles.boxShadow && preservedStyles.boxShadow !== 'none') {
          container.style.boxShadow = preservedStyles.boxShadow;
        }
        if (preservedStyles.marginTop && preservedStyles.marginTop !== '0px') {
          container.style.marginTop = preservedStyles.marginTop;
        }
        if (v.parentNode) v.parentNode.replaceChild(container, v);
        container.appendChild(v);
        v.setAttribute('data-editable', 'video');
        forceVideoStyle(v);
        v.style.position = 'absolute';
        (v.style as any).inset = '0';
        v.style.width = '100%';
        v.style.height = '100%';
        v.style.objectFit = 'cover';
        try {
          v.pause();
        } catch {}
        try {
          v.load();
        } catch {}
        attachPlayOverlay(doc, container, v);
        ensureHostResizeObserver(container);
        normFill(container);
      } else {
        v.setAttribute('data-editable', 'video');
        forceVideoStyle(v);
        v.style.width = '100%';
        v.style.height = '450px';
        v.style.objectFit = 'cover';
        try {
          v.pause();
        } catch {}
        try {
          v.load();
        } catch {}
        attachPlayOverlay(doc, parent, v);
        ensureHostResizeObserver(parent);
        normFill(parent);
      }
    });

    try {
      cleanupAltArtifacts(doc.body);
    } catch {}
  };

  // Placeholder de imagem
  useEffect(() => {
    const PLACEHOLDER_IMAGE = 'https://i.imgur.com/kFVf8q3.png';

    const timeout = setTimeout(() => {
      iframeRefs.current.forEach((ifr, slideIndex) => {
        if (!ifr?.contentDocument) return;
        const conteudo = data.conteudos?.[slideIndex];
        if (!conteudo) return;

        const hasImages = [
          conteudo.imagem_fundo,
          conteudo.imagem_fundo2,
          conteudo.imagem_fundo3,
          uploadedImages[slideIndex],
        ].some((img) => img && img !== PLACEHOLDER_IMAGE);

        if (!hasImages) {
          applyBackgroundImageImmediate(slideIndex, PLACEHOLDER_IMAGE, iframeRefs.current);
        }
      });
    }, 800);

    return () => clearTimeout(timeout);
  }, [slides, data, uploadedImages]);

  // ========= Layers =========
  const toggleLayer = (index: number) => {
    const s = new Set(expandedLayers);
    s.has(index) ? s.delete(index) : s.add(index);
    setExpandedLayers(s);
  };

  const handleSlideClick = (index: number) => {
    clearAllSelections();
    setFocusedSlide(index);
    setSelectedElement({ slideIndex: index, element: null });
    selectedImageRefs.current[index] = null;
    centerSlide(index);
  };

  const handleElementClick = (slideIndex: number, element: ElementType) => {
    setIsLoadingProperties(true);
    if (element) setIsPropertiesMinimized(false);
    clearAllSelections();

    const iframe = iframeRefs.current[slideIndex];
    const doc = iframe?.contentDocument || iframe?.contentWindow?.document;

    if (doc && element) {
      let target: HTMLElement | null = null;

      if (element === 'title' || element === 'subtitle' || element === 'nome' || element === 'arroba') {
        target =
          doc.getElementById(`slide-${slideIndex}-${element}`) ||
          (doc.querySelector(`[data-editable="${element}"]`) as HTMLElement | null) ||
          (doc.querySelector(`[id*="${element}"]`) as HTMLElement | null);
      }

      if (target) {
        target.classList.add('selected');
        (target as HTMLElement).style.zIndex = '1000';
        try {
          target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        } catch {}
      } else if (element === 'background') {
        doc.body.classList.add('selected');
        (doc.body as HTMLElement).style.zIndex = '1000';
      }

      if (element === 'title' || element === 'subtitle' || element === 'nome' || element === 'arroba') {
        try {
          readAndStoreComputedTextStyles(
            doc,
            slideIndex,
            element as 'title' | 'subtitle',
            setOriginalStyles,
          );
        } catch {}
      }
    }

    setSelectedElement({ slideIndex, element });
    setFocusedSlide(slideIndex);
    centerSlide(slideIndex);

    if (!expandedLayers.has(slideIndex)) toggleLayer(slideIndex);
    setTimeout(() => setIsLoadingProperties(false), 80);
  };

  // Clique no fundo do canvas
  const handleCanvasBackgroundClick = useCallback(() => {
    if (!isPropertiesMinimized && selectedElement.element) {
      clearAllSelections();
      setSelectedElement({ slideIndex: selectedElement.slideIndex, element: null });
    }
  }, [isPropertiesMinimized, selectedElement]);

  // ========= Helpers de estado =========
  const getElementKey = (slideIndex: number, element: ElementType) => `${slideIndex}-${element}`;
  const getEditedValue = (slideIndex: number, field: string, def: any) => {
    const k = `${slideIndex}-${field}`;
    return editedContent[k] !== undefined ? editedContent[k] : def;
  };
  const updateEditedValue = (slideIndex: number, field: string, value: any) => {
    if (field === 'nome' || field === 'arroba') {
      setEditedContent((prev) => {
        const updated = { ...prev };
        for (let i = 0; i < slides.length; i++) {
          updated[`${i}-${field}`] = value;
        }
        return updated;
      });
      if (field === 'nome') data.dados_gerais.nome = value;
      if (field === 'arroba') data.dados_gerais.arroba = value;
    } else {
      const k = `${slideIndex}-${field}`;
      setEditedContent((prev) => ({ ...prev, [k]: value }));
    }
  };
  const getElementStyle = (slideIndex: number, element: ElementType): ElementStyles => {
    const k = getElementKey(slideIndex, element);
    if (elementStyles[k]) return elementStyles[k];
    if (originalStyles[k]) return originalStyles[k];
    return {
      fontSize: element === 'title' ? '24px' : '16px',
      fontWeight: element === 'title' ? '700' : '400',
      textAlign: 'left',
      color: '#FFFFFF',
    };
  };
  const updateElementStyle = (
    slideIndex: number,
    element: ElementType,
    prop: keyof ElementStyles,
    value: string,
  ) => {
    const k = getElementKey(slideIndex, element);
    setElementStyles((prev) => ({
      ...prev,
      [k]: { ...getElementStyle(slideIndex, element), [prop]: value },
    }));
  };

  // Wiring dos iframes
  useIframeWiring({
    renderedSlides,
    editedContent,
    elementStyles,
    expandedLayers,
    iframeRefs: iframeRefs as React.MutableRefObject<HTMLIFrameElement[]>,
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
    updateElementStyle: (slideIndex: number, element: string, property: string, value: string) => {
      updateElementStyle(slideIndex, element as ElementType, property as keyof ElementStyles, value);
    },
    postProcessTemplateVideos,
  });

  // Background media
  const { handleBackgroundImageChange } = useBackgroundMedia({
    iframeRefs: iframeRefs as React.MutableRefObject<(HTMLIFrameElement | null)[]>,
    selectedImageRefs,
    templateCompatibility,
    expandedLayers,
    setSelectedElement,
    setFocusedSlide,
    setExpandedLayers,
    addToast,
    updateEditedValue,
    updateElementStyle,
    toggleLayer,
    clearAllSelections,
  });

  // Busca imagens
  const handleSearchImages = async () => {
    if (!searchKeyword.trim()) return;
    setIsSearching(true);
    const id = ++lastSearchId.current;
    try {
      const imageUrls = await searchImages(searchKeyword);
      if (id === lastSearchId.current) setSearchResults(imageUrls);
    } catch (e) {
      console.error(e);
    } finally {
      if (id === lastSearchId.current) setIsSearching(false);
    }
  };

  // Upload
  const handleImageUpload = (slideIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setUploadedImages((prev) => ({ ...prev, [slideIndex]: url }));
      handleBackgroundImageChange(slideIndex, url);
    };
    reader.readAsDataURL(file);
  };

  // Upload de Avatar - aplica em todos os slides
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      
      // Atualiza o avatar em dados_gerais
      updateEditedValue(0, 'avatar_url', url);
      
      // Aplica o avatar em todos os iframes
      iframeRefs.current.forEach((ifr, slideIndex) => {
        const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
        if (!doc) return;
        
        // Encontra todas as imagens de avatar/logo (protegidas)
        const avatarImgs = doc.querySelectorAll('img[data-protected="true"]');
        avatarImgs.forEach((img) => {
          const imgEl = img as HTMLImageElement;
          // Verifica se é realmente um avatar (pequeno e circular)
          const rect = imgEl.getBoundingClientRect();
          const cs = doc.defaultView?.getComputedStyle(imgEl);
          const borderRadius = cs?.borderRadius || '';
          const isRounded = borderRadius.includes('50%') || borderRadius.includes('9999') || parseInt(borderRadius) > 50;
          const isSmall = rect.width < 150 && rect.height < 150;
          
          if (isSmall && isRounded) {
            imgEl.src = url;
            console.log(`🎭 Avatar atualizado no slide ${slideIndex}`);
          }
        });
      });
      
      setHasUnsavedChanges(true);
      addToast('Avatar atualizado em todos os slides!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Detecta mudanças
  useEffect(() => {
    const hasContentChanges = Object.keys(editedContent).length > 0;
    const hasStyleChanges = Object.keys(elementStyles).length > 0;
    const hasImageChanges = Object.keys(uploadedImages).length > 0;
    setHasUnsavedChanges(hasContentChanges || hasStyleChanges || hasImageChanges);
  }, [editedContent, elementStyles, uploadedImages, contentId]);

  // Salvamento / download
  const { handleSave, handleDownloadAll } = useSaveDownload({
    data,
    slides,
    renderedSlides,
    editedContent,
    elementStyles,
    uploadedImages,
    contentId,
    iframeRefs: iframeRefs as React.MutableRefObject<(HTMLIFrameElement | null)[]>,
    setEditedContent,
    setUploadedImages,
    setHasUnsavedChanges,
    setIsSaving,
    addToast,
    onSaveSuccess,
  });

  // Auto-download
  useEffect(() => {
    if (
      autoDownload &&
      !autoDownloadExecuted &&
      renderedSlides.length > 0 &&
      iframeRefs.current.some((ifr) => ifr !== null)
    ) {
      setAutoDownloadExecuted(true);
      const timer = setTimeout(async () => {
        try {
          await handleDownloadAll();
          onClose();
        } catch (error) {
          console.error('❌ Erro no auto-download:', error);
          onClose();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload, autoDownloadExecuted, renderedSlides.length, handleDownloadAll, onClose]);

  // ========= Render =========
  return (
    <div className="absolute inset-0 bg-neutral-900 flex" style={{ zIndex: 1 }}>
      <LayersSidebar
        slides={slides}
        carouselData={data}
        expandedLayers={expandedLayers}
        focusedSlide={focusedSlide}
        selectedElement={selectedElement}
        isMinimized={isLayersMinimized}
        onToggleMinimize={() => setIsLayersMinimized(!isLayersMinimized)}
        onToggleLayer={toggleLayer}
        onElementClick={handleElementClick}
        onSlideClick={handleSlideClick}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          slidesCount={slides.length}
          zoom={zoom}
          onZoomIn={() => zoomIn(zoom, setZoom)}
          onZoomOut={() => zoomOut(zoom, setZoom)}
          onDownload={handleDownloadAll}
          onClose={onClose}
          onSave={handleSave}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
        />

        <CanvasArea
          zoom={zoom}
          pan={pan}
          isDragging={isDragging}
          dragStart={dragStart}
          slideWidth={slideWidth}
          slideHeight={slideHeight}
          gap={gap}
          slides={slides}
          renderedSlides={renderedSlides}
          focusedSlide={focusedSlide}
          iframeRefs={iframeRefs}
          containerRef={containerRef}
          onBackgroundClick={handleCanvasBackgroundClick}
          onWheel={(e) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - pan.x) / zoom;
            const mouseY = (e.clientY - rect.top - pan.y) / zoom;

            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.05 : 0.05;
              const newZoom = Math.min(Math.max(0.1, zoom + delta), 2);
              setZoom(newZoom);
              setPan({
                x: e.clientX - rect.left - mouseX * newZoom,
                y: e.clientY - rect.top - mouseY * newZoom,
              });
            } else if (e.shiftKey) {
              e.preventDefault();
              setPan((prev) => ({
                x: prev.x - e.deltaY,
                y: prev.y,
              }));
            } else {
              e.preventDefault();
              setPan((prev) => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY,
              }));
            }
          }}
          onMouseDown={(e) => {
            if (e.button === 0) {
              setIsDragging(true);
              setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            }
          }}
          onMouseMove={(e) => {
            if (isDragging) {
              setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            }
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        />
      </div>

      <PropertiesPanel
        selectedElement={selectedElement}
        carouselData={data}
        editedContent={editedContent}
        isLoadingProperties={isLoadingProperties}
        searchKeyword={searchKeyword}
        searchResults={searchResults}
        isSearching={isSearching}
        uploadedImages={uploadedImages}
        isMinimized={isPropertiesMinimized}
        templateCompatibility={templateCompatibility}
        onToggleMinimize={() => {
          setIsPropertiesMinimized(!isPropertiesMinimized);
          if (!isPropertiesMinimized) {
            setSelectedElement({ slideIndex: 0, element: null });
          }
        }}
        onUpdateEditedValue={updateEditedValue}
        onUpdateElementStyle={updateElementStyle}
        onBackgroundImageChange={handleBackgroundImageChange}
        onAvatarUpload={handleAvatarUpload}
        onSearchKeywordChange={setSearchKeyword}
        onSearchImages={handleSearchImages}
        onImageUpload={handleImageUpload}
        getElementStyle={getElementStyle}
        getEditedValue={getEditedValue}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default CarouselViewer;