// NewCarouselViewer.tsx - Nova versão com UI/UX renovada
// Mantém 100% das funcionalidades existentes, apenas reorganiza a interface visual

import React, { useEffect, useCallback, useState } from 'react';
import type { CarouselData, ElementType, ElementStyles } from '../../../types/carousel';
import { AVAILABLE_TEMPLATES, TEMPLATE_DIMENSIONS } from '../../../types/carousel';
import type { BlockSlideContent } from '../../../types/blocks';
import { isBlockSlide } from '../../../types/blocks';
import { searchImages, templateRenderer } from '../../../services/carousel';
import { getGeneratedContent, getGeneratedContentById } from '../../../services/generatedContent';
import Toast from '../../Toast';

// Novos componentes de UI
import { SlidesSidebar } from './SlidesSidebar';
import { EditorToolbar } from './EditorToolbar';
import { CanvasPreview } from './CanvasPreview';
import { RightPropertiesPanel } from './RightPropertiesPanel';
import { MobileCarouselViewerNew } from './mobile';
import { SlideCloneModal } from './SlideCloneModal';

// Block-based slide components
import { BlocksCanvas } from '../blocks';

// Hooks e utilitários existentes (mantidos 100%)
import {
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

// Hook para detectar dispositivos móveis
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Wrapper que decide qual viewer usar baseado no dispositivo
const NewCarouselViewer: React.FC<CarouselViewerProps> = (props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileCarouselViewerNew {...props} />;
  }

  return <DesktopCarouselViewer {...props} />;
};

// Interface para configurações globais
interface GlobalSettings {
  theme: 'light' | 'dark';
  accentColor: string;
  showSlideNumber: boolean;
  showVerifiedBadge: boolean;
  headerScale: number;
  fontStyle: string;
  fontScale: number;
}

// Componente Desktop - Nova UI com 3 painéis
const DesktopCarouselViewer: React.FC<CarouselViewerProps> = ({
  slides,
  carouselData,
  onClose,
  generatedContentId,
  onSaveSuccess,
  autoDownload = false,
}) => {
  console.log('🎨 NewCarouselViewer montado:', {
    slidesLength: slides?.length,
    hasCarouselData: !!carouselData,
    generatedContentId,
  });

  // === ESTADOS ADICIONAIS PARA NOVA UI ===
  const [batchMode, setBatchMode] = useState(false);
  const [selectedSlides, setSelectedSlides] = useState<Set<number>>(new Set());
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [generatingSlides, setGeneratingSlides] = useState<Set<number>>(new Set());
  const [errorSlides] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [modificationCount, setModificationCount] = useState(0); // Contador para auto-save
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false); // Modal para clonar slide
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    theme: 'light',
    accentColor: '#4167B2',
    showSlideNumber: true,
    showVerifiedBadge: true,
    headerScale: 1.0,
    fontStyle: 'sans',
    fontScale: 1.0,
  });

  // Ref para handleSave (para usar antes de ser declarado)
  const handleSaveRef = React.useRef<(() => Promise<void>) | null>(null);

  // === MIGRAÇÃO DE FORMATO (mantido 100%) ===
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
    console.error('❌ NewCarouselViewer: data.conteudos não encontrado:', carouselData);
    return (
      <div className="fixed inset-0 bg-light z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md text-center border border-gray-light">
          <h2 className="text-gray-dark text-xl font-bold mb-4">Erro ao carregar carrossel</h2>
          <p className="text-gray-DEFAULT mb-6">
            Os dados do carrossel estão em um formato incompatível.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-DEFAULT text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-dark transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const data = migratedData;

  // === TEMPLATE CONFIG (mantido 100%) ===
  const templateCompatibility = React.useMemo(() => {
    const templateId = (data as any).dados_gerais?.template || '1';
    const template = AVAILABLE_TEMPLATES.find((t) => t.id === templateId);
    return template?.compatibility || 'video-image';
  }, [(data as any).dados_gerais?.template]);

  useEffect(() => {
    templateRenderer.setTemplateCompatibility(templateCompatibility);
  }, [templateCompatibility]);

  const templateId = (data as any).dados_gerais?.template || '1';
  const templateDimensions = TEMPLATE_DIMENSIONS[templateId] || {
    width: 1080,
    height: 1350,
  };
  const slideWidth = templateDimensions.width;
  const slideHeight = templateDimensions.height;

  // === ESTADO CENTRAL (mantido 100%) ===
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
    isLayersMinimized: _isLayersMinimized,
    setIsLayersMinimized: _setIsLayersMinimized,
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
    setIsLoadingProperties: _setIsLoadingProperties,
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

  const hasInitialCenteredRef = React.useRef(false);

  // === CENTRALIZAÇÃO (mantido 100%) ===
  const centerSlide = useCallback(
    (_index: number) => {
      const container = containerRef.current;
      if (!container || !slides.length) return;

      const rect = container.getBoundingClientRect();
      const viewportWidth = rect.width;
      const viewportHeight = rect.height;

      const slideWorldCenterX = slideWidth / 2;
      const slideWorldCenterY = slideHeight / 2;

      const panX = viewportWidth / 2 - zoom * slideWorldCenterX;
      const panY = viewportHeight / 2 - zoom * slideWorldCenterY;

      setPan({ x: panX, y: panY });
    },
    [containerRef, slides.length, slideWidth, slideHeight, zoom, setPan],
  );

  // === AVISO DE MUDANÇAS (mantido 100%) ===
  useUnsavedChangesWarning(hasUnsavedChanges);

  // === BUSCA DADOS ATUALIZADOS AO ABRIR EDITOR ===
  const [isLoadingFreshData, setIsLoadingFreshData] = useState(false);
  const [freshCarouselData, setFreshCarouselData] = useState<CarouselData | null>(null);
  const hasFetchedRef = React.useRef(false);
  // Flag para saber se o usuário já fez alterações (se sim, não sobrescreve com dados da API)
  const userHasMadeChangesRef = React.useRef(false);

  useEffect(() => {
    // Buscar dados atualizados sempre que o editor abrir
    const fetchFreshData = async () => {
      // Usar o generatedContentId passado por props ou o encontrado posteriormente
      const idToFetch = generatedContentId || contentId;
      
      if (!idToFetch || hasFetchedRef.current) return;
      
      hasFetchedRef.current = true;
      setIsLoadingFreshData(true);
      
      try {
        console.log('🔄 Buscando dados atualizados do carrossel...', { idToFetch });
        const response = await getGeneratedContentById(idToFetch);
        
        if (response.success && response.data?.result) {
          const apiData = response.data.result as any;
          
          if (apiData.conteudos && apiData.dados_gerais) {
            console.log('✅ Dados atualizados recebidos da API');
            console.log('📝 Conteúdos com title:', apiData.conteudos.map((c: any) => c.title));
            
            // Atualizar carouselData com dados frescos
            const updatedCarouselData = {
              conteudos: apiData.conteudos,
              dados_gerais: apiData.dados_gerais,
              styles: apiData.styles || {},
            } as CarouselData;
            
            setFreshCarouselData(updatedCarouselData);
            
            // Só re-renderiza slides se o usuário ainda não fez alterações
            if (!userHasMadeChangesRef.current) {
              // Renderizar slides atualizados
              const newTemplateId = apiData.dados_gerais.template || '2';
              const templateHtml = await templateRenderer.fetchTemplate(newTemplateId);
              
              if (templateHtml && templateHtml.length > 0) {
                const newRenderedSlides = templateRenderer.renderAllSlides(templateHtml, updatedCarouselData);
                setRenderedSlides(newRenderedSlides);
                console.log('✅ Slides re-renderizados com dados atualizados:', newRenderedSlides.length);
              }
              
              // Aplicar estilos salvos na API
              if (apiData.styles && typeof apiData.styles === 'object') {
                setElementStyles(apiData.styles);
                console.log('✅ Estilos aplicados:', Object.keys(apiData.styles).length, 'elementos');
              }
              
              // Aplicar estilos de cada conteúdo (novo formato: styles dentro de cada conteudo)
              apiData.conteudos.forEach((conteudo: any, index: number) => {
                if (conteudo.styles && typeof conteudo.styles === 'object') {
                  const stylesFromConteudo = conteudo.styles;
                  
                  if (stylesFromConteudo.titleColor || stylesFromConteudo.titleBackground) {
                    setElementStyles((prev: Record<string, any>) => ({
                      ...prev,
                      [`${index}-title`]: {
                        ...(prev[`${index}-title`] || {}),
                        color: stylesFromConteudo.titleColor || prev[`${index}-title`]?.color,
                        background: stylesFromConteudo.titleBackground || prev[`${index}-title`]?.background,
                      },
                    }));
                  }
                  
                  if (stylesFromConteudo.subtitleColor || stylesFromConteudo.subtitleBackground) {
                    setElementStyles((prev: Record<string, any>) => ({
                      ...prev,
                      [`${index}-subtitle`]: {
                        ...(prev[`${index}-subtitle`] || {}),
                        color: stylesFromConteudo.subtitleColor || prev[`${index}-subtitle`]?.color,
                        background: stylesFromConteudo.subtitleBackground || prev[`${index}-subtitle`]?.background,
                      },
                    }));
                  }
                  
                  if (stylesFromConteudo.slideBackground) {
                    setElementStyles((prev: Record<string, any>) => ({
                      ...prev,
                      [`${index}-slideBackground`]: { backgroundColor: stylesFromConteudo.slideBackground },
                    }));
                  }
                }
              });
              
              addToast('Dados atualizados carregados!', 'success');
            } else {
              console.log('⚠️ Usuário já fez alterações, não sobrescrevendo com dados da API');
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados atualizados:', error);
        // Continua com os dados existentes se falhar
      } finally {
        setIsLoadingFreshData(false);
      }
    };
    
    fetchFreshData();
  }, [generatedContentId, contentId]);

  // Use freshCarouselData quando disponível, senão use data original
  const activeData = freshCarouselData || data;

  // === BUSCA DE CONTENT ID (mantido 100%) ===
  useEffect(() => {
    if (contentId) return;

    const firstTitle = (data as any).conteudos?.[0]?.title;
    if (!firstTitle) return;

    const fetchContentId = async () => {
      try {
        const response = await getGeneratedContent({ limit: 100 });
        const matchingContent = response.data?.find((content: any) => {
          try {
            const result =
              typeof content.result === 'string'
                ? JSON.parse(content.result)
                : content.result;
            const contentFirstTitle = result?.conteudos?.[0]?.title;
            return contentFirstTitle === firstTitle;
          } catch {
            return false;
          }
        });

        if (matchingContent) {
          setContentId(matchingContent.id);
          addToast('ID do conteúdo encontrado!', 'success');
        }
      } catch (error) {
        console.error('❌ Erro ao buscar generatedContentId:', error);
      }
    };

    fetchContentId();
  }, []);

  // === LIMPA SELEÇÕES (mantido 100% com ajuste: não remove mais contenteditable) ===
  const clearAllSelections = (preserveElement?: HTMLElement | null) => {
    iframeRefs.current.forEach((ifr) => {
      const d = ifr?.contentDocument || ifr?.contentWindow?.document;
      if (!d) return;

      // Remove seleção de elementos editáveis
      d.querySelectorAll('[data-editable].selected').forEach((el) => {
        if (preserveElement && el === preserveElement) return;
        el.classList.remove('selected');
        (el as HTMLElement).style.zIndex = '';
      });

      // Limpa outline/background mas NÃO remove mais contenteditable
      d.querySelectorAll('[contenteditable="true"]').forEach((el) => {
        if (preserveElement && el === preserveElement) return;
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.outlineOffset = '';
        (el as HTMLElement).style.background = '';
      });

      d.querySelectorAll('.img-crop-wrapper[data-cv-selected="1"]').forEach((el) => {
        (el as HTMLElement).removeAttribute('data-cv-selected');
      });
      d.querySelectorAll(
        '.video-container.selected, .video-container[data-cv-selected="1"]',
      ).forEach((el) => {
        el.classList.remove('selected');
        (el as HTMLElement).removeAttribute('data-cv-selected');
        (el as HTMLElement).style.zIndex = '';
      });
      try {
        disposePinchersInDoc(d);
      } catch {}
    });
  };

  // === REFLEXO DE EDIÇÕES NO IFRAME (mantido 100%) ===
// === REFLEXO DE EDIÇÕES NO IFRAME (mantido 100% com proteção de estilos inline) ===
useEffect(() => {
  Object.entries(editedContent).forEach(([k, val]) => {
    const [slideStr, field] = k.split('-');
    const slideIndex = Number(slideStr);
    if (Number.isNaN(slideIndex)) return;
    if (field !== 'title' && field !== 'subtitle' && field !== 'nome' && field !== 'arroba')
      return;

    const ifr = iframeRefs.current[slideIndex];
    const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
    const el = doc?.getElementById(`slide-${slideIndex}-${field}`) as HTMLElement | null;

    if (el && typeof val === 'string') {
      // Se já existe formatação rica (b, i, span com style etc), NÃO sobrescreve com textContent,
      // porque isso apagaria os estilos aplicados pelo execCommand
      const hasRichFormatting = !!el.querySelector(
        'b,strong,i,em,u,s,strike,span[style]'
      );

      if (hasRichFormatting) {
        // Deixa o DOM como fonte da verdade pra esse elemento
        return;
      }

      // Caso não tenha formatação rica, pode atualizar normalmente
      el.textContent = val;
    }
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
      if (sty.fontStyle) el.style.fontStyle = sty.fontStyle;
      if (sty.textDecoration) el.style.textDecoration = sty.textDecoration;
      if (sty.textAlign) el.style.textAlign = sty.textAlign as any;
      if (sty.color) el.style.color = sty.color;
    }

    if (field === 'background') {
      const img = doc.querySelector('img[data-editable="image"]') as HTMLImageElement | null;
      if (img && sty.objectPosition) {
        img.style.setProperty('object-position', sty.objectPosition, 'important');
      }

      const video = doc.querySelector('video[data-editable="video"]') as HTMLVideoElement | null;
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

  // === INJEÇÃO DE IDs / STYLE (mantido 100%) ===
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
    const conteudo = (activeData as any).conteudos[slideIndex];
    const titleText = conteudo?.title || '';
    const subtitleText = conteudo?.subtitle || '';
    const nomeText = (activeData as any).dados_gerais?.nome || '';
    const arrobaText = (activeData as any).dados_gerais?.arroba || '';

    const addEditableSpan = (text: string, id: string, attr: string) => {
      if (!text) return;
      const searchText = text.trim();
      if (!searchText) return;
      if (result.includes(`data-editable="${attr}"`)) return;

      const searchPattern = `>${searchText}<`;
      let idx = result.indexOf(searchPattern);

      if (idx !== -1) {
        const before = result.slice(0, idx + 1);
        const after = result.slice(idx + 1 + searchText.length);
        result = `${before}<span id="${id}" data-editable="${attr}" contenteditable="false">${searchText}</span>${after}`;
        return;
      }

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
        return;
      }

      const flexRe = new RegExp(`>([^<]*)(${escaped})([^<]*)<`, 'i');
      const flexMatch = result.match(flexRe);
      if (flexMatch && flexMatch.index !== undefined) {
        const beforeText = flexMatch[1];
        const matchedText = flexMatch[2];
        const afterText = flexMatch[3];
        const fullMatchLen = flexMatch[0].length;
        const before = result.slice(0, flexMatch.index + 1);
        const after = result.slice(flexMatch.index + fullMatchLen - 1);
        result = `${before}${beforeText}<span id="${id}" data-editable="${attr}" contenteditable="false">${matchedText}</span>${afterText}${after}`;
        return;
      }

      if (attr === 'arroba') {
        if (!searchText.startsWith('@')) {
          const withAt = `@${searchText}`;
          const atPattern = `>${withAt}<`;
          const atIdx = result.indexOf(atPattern);
          if (atIdx !== -1) {
            const before = result.slice(0, atIdx + 1);
            const after = result.slice(atIdx + 1 + withAt.length);
            result = `${before}<span id="${id}" data-editable="${attr}" contenteditable="false">${withAt}</span>${after}`;
            return;
          }

          const escapedWithAt = withAt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const flexAtRe = new RegExp(
            `>([^<]*)(${escapedWithAt})([^<]*)<`,
            'i',
          );
          const flexAtMatch = result.match(flexAtRe);
          if (flexAtMatch && flexAtMatch.index !== undefined) {
            const beforeText = flexAtMatch[1];
            const matchedText = flexAtMatch[2];
            const afterText = flexAtMatch[3];
            const fullMatchLen = flexAtMatch[0].length;
            const before = result.slice(0, flexAtMatch.index + 1);
            const after = result.slice(flexAtMatch.index + fullMatchLen - 1);
            result = `${before}${beforeText}<span id="${id}" data-editable="${attr}" contenteditable="false">${matchedText}</span>${afterText}${after}`;
            return;
          }
        }

        if (searchText.startsWith('@')) {
          const withoutAt = searchText.slice(1);
          const usernameIdx = result.indexOf(`>${withoutAt}<`);
          if (usernameIdx !== -1) {
            const before = result.slice(0, usernameIdx + 1);
            const after = result.slice(usernameIdx + 1 + withoutAt.length);
            result = `${before}<span id="${id}" data-editable="${attr}" contenteditable="false">${withoutAt}</span>${after}`;
            return;
          }
        }
      }

      const tagRe = new RegExp(
        '(<(?:span|p|div)[^>]*>)\\s*(' +
          escaped +
          ')\\s*(<\\/(?:span|p|div)>)',
        'i',
      );
      const tagMatch = result.match(tagRe);
      if (tagMatch && tagMatch.index !== undefined) {
        const openTag = tagMatch[1];
        const matchedText = tagMatch[2];
        const closeTag = tagMatch[3];
        const fullMatchLen = tagMatch[0].length;
        const before = result.slice(0, tagMatch.index);
        const after = result.slice(tagMatch.index + fullMatchLen);
        const newOpenTag = openTag.replace(
          '>',
          ` id="${id}" data-editable="${attr}" contenteditable="false">`,
        );
        result = `${before}${newOpenTag}${matchedText}${closeTag}${after}`;
        return;
      }
    };

    if (arrobaText)
      addEditableSpan(arrobaText, `slide-${slideIndex}-arroba`, 'arroba');
    if (nomeText)
      addEditableSpan(nomeText, `slide-${slideIndex}-nome`, 'nome');
    
    // Para subtitle e title: extrai o texto puro para buscar no template
    // O title/subtitle pode conter HTML (bold, italic, etc) - nesse caso precisamos extrair o texto puro
    const getPlainText = (htmlOrText: string): string => {
      if (!htmlOrText) return '';
      // Se contém tags HTML, extrai o texto
      if (/<\w+[^>]*>/.test(htmlOrText)) {
        const temp = document.createElement('div');
        temp.innerHTML = htmlOrText;
        return temp.textContent || '';
      }
      return htmlOrText;
    };
    
    const subtitlePlain = getPlainText(subtitleText);
    const titlePlain = getPlainText(titleText);
    
    if (subtitlePlain)
      addEditableSpan(
        subtitlePlain,
        `slide-${slideIndex}-subtitle`,
        'subtitle',
      );
    if (titlePlain)
      addEditableSpan(titlePlain, `slide-${slideIndex}-title`, 'title');

    // Se title/subtitle contém HTML formatado, substitui o conteúdo interno pelo HTML formatado
    if (titleText && /<\w+[^>]*>/.test(titleText)) {
      // Regex que captura tudo entre a tag de abertura e fechamento do span
      const titleRegex = new RegExp(
        `(<span[^>]*id="slide-${slideIndex}-title"[^>]*>)([\\s\\S]*?)(<\\/span>)`,
        'i'
      );
      if (titleRegex.test(result)) {
        result = result.replace(titleRegex, `$1${titleText}$3`);
        console.log(`🔤 Injetando HTML formatado no title do slide ${slideIndex}:`, titleText);
      }
    }
    if (subtitleText && /<\w+[^>]*>/.test(subtitleText)) {
      // Regex que captura tudo entre a tag de abertura e fechamento do span
      const subtitleRegex = new RegExp(
        `(<span[^>]*id="slide-${slideIndex}-subtitle"[^>]*>)([\\s\\S]*?)(<\\/span>)`,
        'i'
      );
      if (subtitleRegex.test(result)) {
        result = result.replace(subtitleRegex, `$1${subtitleText}$3`);
        console.log(`🔤 Injetando HTML formatado no subtitle do slide ${slideIndex}:`, subtitleText);
      }
    }

    result = result.replace(
      /<style>/i,
      `<style>
      * { user-select: none !important; }
      [contenteditable="true"] { user-select: text !important; }
      [data-editable]{cursor:pointer!important;position:relative;display:inline-block!important;pointer-events:auto!important}
      [data-editable].selected{outline:3px solid #4167B2!important;outline-offset:2px;z-index:1000}
      [data-editable]:hover:not(.selected){outline:2px solid rgba(65,103,178,.5)!important;outline-offset:2px}
      [data-editable][contenteditable="true"]{outline:3px solid #10B981!important;outline-offset:2px;background:rgba(16,185,129,.1)!important}
      [data-editable="nome"],[data-editable="arroba"]{z-index:100!important;pointer-events:auto!important}
      img[data-editable], video[data-editable]{display:block!important;pointer-events:auto!important;cursor:pointer!important}
      img[data-editable="image"]{pointer-events:auto!important;cursor:pointer!important;position:relative;z-index:10}
      .img-crop-wrapper{pointer-events:auto!important;cursor:pointer!important;position:relative;z-index:10}
      html, body { pointer-events: auto !important; margin:0!important;padding:0!important;overflow:hidden!important;}
      img, video { max-width:none !important; }
      .video-container{position:relative!important;display:block!important;width:100%!important;height:450px;border-radius:24px!important;overflow:hidden!important;margin-top:0!important;box-shadow:0 16px 48px rgba(0,0,0,.18)!important;}
      .video-container > video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;border-radius:24px!important;}
      video[data-editable="video"]:not(.video-container video){width:100%!important;height:450px;object-fit:cover!important;display:block!important;border-radius:24px!important;margin-top:0!important;box-shadow:0 16px 48px rgba(0,0,0,.18)!important;}
      .img-crop-wrapper img, img[data-editable="image"]{margin-top:0!important;transform:none!important;filter:none!important;object-fit:cover!important;}
      .img-crop-wrapper[data-cv-selected="1"], .video-container.selected, .video-container[data-cv-selected="1"]{outline:3px solid #4167B2!important;outline-offset:2px;z-index:1000;}
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

  // === PROCESSA SLIDES ===
  // Sempre re-renderiza do template + aplica formatações salvas via injectEditableIds
  useEffect(() => {
    // Processa os slides originais - o title/subtitle já contém HTML formatado
    const processedSlides = slides.map((s, i) =>
      injectEditableIds(stripAltGarbage(s), i),
    );

    setRenderedSlides(processedSlides);

    setSelectedElement({ slideIndex: 0, element: null });
    setFocusedSlide(0);
    setElementStyles({});
    setOriginalStyles({});
    selectedImageRefs.current = {};

    // Carrega estilos salvos - agora estão DENTRO de cada conteudo
    const loadedStyles: Record<string, ElementStyles> = {};
    (activeData as any).conteudos?.forEach((conteudo: any, slideIndex: number) => {
      if (conteudo.styles) {
        Object.entries(conteudo.styles).forEach(([elementType, styles]: [string, any]) => {
          const key = `${slideIndex}-${elementType}`;
          loadedStyles[key] = styles as ElementStyles;
        });
      }
    });
    
    if (Object.keys(loadedStyles).length > 0) {
      setElementStyles(loadedStyles);
    }

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
  }, [slides]);

  // === CENTRALIZAÇÃO INICIAL ===
  useEffect(() => {
    if (!renderedSlides.length) return;
    if (hasInitialCenteredRef.current) return;

    hasInitialCenteredRef.current = true;

    requestAnimationFrame(() => {
      centerSlide(0);
    });
  }, [renderedSlides.length, centerSlide]);

  // === APLICA ESTILOS DE FUNDO SALVOS ===
  // Este efeito aplica slideBackground e outros estilos salvos quando os iframes carregam
  useEffect(() => {
    if (!renderedSlides.length) return;
    
    // Aguarda os iframes carregarem
    const timeout = setTimeout(() => {
      const conteudos = (activeData as any).conteudos;
      if (!conteudos) return;

      iframeRefs.current.forEach((ifr, index) => {
        if (!ifr?.contentDocument) return;
        const doc = ifr.contentDocument;
        const conteudo = conteudos[index];
        
        if (!conteudo) return;

        // Aplica cor de fundo do slide (salva em conteudo.slideBackground)
        if (conteudo.slideBackground) {
          const slideEl = doc.querySelector('.slide') as HTMLElement;
          const targetEl = slideEl || doc.body;
          targetEl.style.setProperty('background-color', conteudo.slideBackground, 'important');
          console.log(`🎨 Aplicando cor de fundo salva ao slide ${index}:`, conteudo.slideBackground);
        }
        
        // === APLICA HTML FORMATADO (bold, italic, etc) ===
        // Se o title/subtitle contém HTML, injeta diretamente no elemento
        const titleEl = doc.querySelector('[data-editable="title"]') as HTMLElement;
        if (titleEl && conteudo.title && /<\w+[^>]*>/.test(conteudo.title)) {
          titleEl.innerHTML = conteudo.title;
          console.log(`🔤 Aplicando HTML formatado no title do slide ${index}:`, conteudo.title);
        }
        
        const subtitleEl = doc.querySelector('[data-editable="subtitle"]') as HTMLElement;
        if (subtitleEl && conteudo.subtitle && /<\w+[^>]*>/.test(conteudo.subtitle)) {
          subtitleEl.innerHTML = conteudo.subtitle;
          console.log(`🔤 Aplicando HTML formatado no subtitle do slide ${index}:`, conteudo.subtitle);
        }
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [renderedSlides, activeData]);

  // Reset ao trocar de carrossel
  useEffect(() => {
    setFocusedSlide(0);
    setSelectedElement({ slideIndex: 0, element: null });
    setElementStyles({});
    setOriginalStyles({});
    setEditedContent({});
    hasInitialCenteredRef.current = false;
  }, [slides]);

  // === VÍDEOS / PLACEHOLDER (mantido 100%) ===
  const postProcessTemplateVideos = (doc: Document) => {
    Array.from(doc.querySelectorAll<HTMLElement>('.video-container')).forEach(
      (host) => {
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
      },
    );

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
        const conteudo = (activeData as any).conteudos?.[slideIndex];
        if (!conteudo) return;

        const hasImages = [
          conteudo.imagem_fundo,
          conteudo.imagem_fundo2,
          conteudo.imagem_fundo3,
          uploadedImages[slideIndex],
        ].some((img) => img && img !== PLACEHOLDER_IMAGE);

        if (!hasImages) {
          applyBackgroundImageImmediate(
            slideIndex,
            PLACEHOLDER_IMAGE,
            iframeRefs.current,
          );
        }
      });
    }, 800);

    return () => clearTimeout(timeout);
  }, [slides, data, uploadedImages]);

  // === HANDLERS DE SLIDE ===
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
    
    // Aplica HTML formatado ao mudar de slide (para garantir que bold/italic apareçam)
    setTimeout(() => {
      const ifr = iframeRefs.current[index];
      const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
      const conteudo = (activeData as any).conteudos?.[index];
      
      if (doc && conteudo) {
        // Aplica HTML formatado no title se existir
        const titleEl = doc.querySelector('[data-editable="title"]') as HTMLElement;
        if (titleEl && conteudo.title && /<\w+[^>]*>/.test(conteudo.title)) {
          titleEl.innerHTML = conteudo.title;
        }
        
        // Aplica HTML formatado no subtitle se existir
        const subtitleEl = doc.querySelector('[data-editable="subtitle"]') as HTMLElement;
        if (subtitleEl && conteudo.subtitle && /<\w+[^>]*>/.test(conteudo.subtitle)) {
          subtitleEl.innerHTML = conteudo.subtitle;
        }
      }
    }, 100);
  };

  const handleCanvasBackgroundClick = useCallback(() => {
    if (!isPropertiesMinimized && selectedElement.element) {
      clearAllSelections();
      setSelectedElement({ slideIndex: selectedElement.slideIndex, element: null });
    }
  }, [isPropertiesMinimized, selectedElement]);

  // === HELPERS DE ESTADO (mantido 100%) ===
  const getElementKey = (slideIndex: number, element: ElementType) =>
    `${slideIndex}-${element}`;
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
      if (field === 'nome') (activeData as any).dados_gerais.nome = value;
      if (field === 'arroba') (activeData as any).dados_gerais.arroba = value;
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

  // === WIRING DOS IFRAMES (mantido 100%) ===
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
    updateElementStyle: (
      slideIndex: number,
      element: string,
      property: string,
      value: string,
    ) => {
      updateElementStyle(
        slideIndex,
        element as ElementType,
        property as keyof ElementStyles,
        value,
      );
    },
    postProcessTemplateVideos,
  });

  // Estado para toolbar flutuante
  const [floatingToolbar, setFloatingToolbar] = useState<{
    visible: boolean;
    top: number;
    left: number;
    iframeDoc: Document | null;
    editableEl: HTMLElement | null;
    savedRange: Range | null;
  }>({
    visible: false,
    top: 0,
    left: 0,
    iframeDoc: null,
    editableEl: null,
    savedRange: null,
  });

  // Função para mostrar toolbar flutuante de formatação
  const showFloatingToolbar = (
    iframeDoc: Document,
    editableEl: HTMLElement,
    iframeElement: HTMLIFrameElement,
  ) => {
    // Salva a seleção atual
    const selection = iframeDoc.getSelection();
    let savedRange: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }

    // Pega o rect do iframe no documento principal
    // Este já inclui o transform (pan + scale) aplicado no container pai
    const iframeRect = iframeElement.getBoundingClientRect();

    // Usa o zoom do viewer diretamente (é o scale aplicado ao container)
    const scale = zoom;

    let top = 0;
    let left = 0;

    if (savedRange && selection && selection.toString().length > 0) {
      // Pega o rect da seleção dentro do iframe
      // IMPORTANTE: Este rect está em coordenadas do documento do iframe (tamanho original, 1080x1350)
      const selectionRect = savedRange.getBoundingClientRect();

      // Para converter para coordenadas da página principal:
      // - iframeRect.top/left já são coordenadas escaladas e transladadas
      // - selectionRect são coordenadas internas do iframe, precisam ser escaladas
      top = iframeRect.top + selectionRect.top * scale - 48;
      left =
        iframeRect.left +
        selectionRect.left * scale +
        (selectionRect.width * scale) / 2;
    } else {
      // Usa o elemento editável
      const elRect = editableEl.getBoundingClientRect();
      top = iframeRect.top + elRect.top * scale - 48;
      left =
        iframeRect.left + elRect.left * scale + (elRect.width * scale) / 2;
    }

    // Garante que não fique fora da tela
    if (top < 10) top = 55;
    if (left < 100) left = 100;
    if (left > window.innerWidth - 100) left = window.innerWidth - 100;

    setFloatingToolbar({
      visible: true,
      top,
      left,
      iframeDoc,
      editableEl,
      savedRange,
    });
  };

  // Função para aplicar formatação
  const applyTextFormat = (cmd: string) => {
    const { iframeDoc, editableEl, savedRange } = floatingToolbar;
    if (!iframeDoc || !editableEl) return;

    const selection = iframeDoc.getSelection();

    // Restaura a seleção salva
    if (savedRange && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }

    // Aplica o comando - isso modifica o DOM diretamente no iframe
    iframeDoc.execCommand(cmd, false);

    // Marca que houve alterações
    setHasUnsavedChanges(true);

    // Incrementa contador de modificações para auto-save
    setModificationCount((prev) => {
      const newCount = prev + 1;
      // Auto-save a cada 2 modificações
      if (newCount >= 2) {
        setTimeout(() => {
          handleSaveRef.current?.();
        }, 500);
        return 0;
      }
      return newCount;
    });

    // Atualiza a seleção salva
    if (selection && selection.rangeCount > 0) {
      setFloatingToolbar((prev) => ({
        ...prev,
        savedRange: selection.getRangeAt(0).cloneRange(),
      }));
    }

    editableEl.focus();
  };

const closeFloatingToolbar = useCallback(() => {
  setFloatingToolbar((currentToolbar) => {
    const { editableEl, iframeDoc } = currentToolbar;

    if (iframeDoc && editableEl) {
      try {
        // Encerra modo edição (tira o verde)
        editableEl.removeAttribute('contenteditable');
        editableEl.style.cursor = 'pointer';
        editableEl.style.outline = '';
        editableEl.style.outlineOffset = '';

        // NÃO atualiza renderedSlides aqui pra não forçar reload do iframe
        // O HTML com bold/itálico continua só no DOM do iframe e será capturado no handleSave/export
        iframeDoc.querySelectorAll('[data-cv-selected]').forEach((el) => {
          (el as HTMLElement).removeAttribute('data-cv-selected');
          (el as HTMLElement).style.outline = '';
        });
      } catch (e) {
        console.error('Erro ao fechar toolbar:', e);
      }
    }

    return {
      visible: false,
      top: 0,
      left: 0,
      iframeDoc: null,
      editableEl: null,
      savedRange: null,
    };
  });
}, []);


  // Refs para acessar valores atuais em closures dos event handlers
  const floatingToolbarRef = React.useRef(floatingToolbar);
  const closeFloatingToolbarRef = React.useRef(closeFloatingToolbar);

  // Mantém as refs atualizadas
  React.useEffect(() => {
    floatingToolbarRef.current = floatingToolbar;
  }, [floatingToolbar]);

  React.useEffect(() => {
    closeFloatingToolbarRef.current = closeFloatingToolbar;
  }, [closeFloatingToolbar]);

  // Effect para fechar toolbar com Escape ou clique fora
  useEffect(() => {
    if (!floatingToolbar.visible) return;

    const { editableEl, iframeDoc } = floatingToolbar;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFloatingToolbar();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Se clicou na toolbar, ignora
      if (target.closest('[data-floating-toolbar]')) return;
      // Se clicou no iframe do slide atual, o listener do iframe vai tratar
      const ifr = iframeRefs.current[focusedSlide];
      if (ifr && ifr.contains(target)) return;
      // Fecha a toolbar (clicou fora do iframe e da toolbar)
      closeFloatingToolbar();
    };

    // Handler para cliques DENTRO do iframe
    const handleIframeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Se clicou no elemento editável atual ou dentro dele, ignora
      if (
        editableEl &&
        (editableEl === target ||
          editableEl.contains(target) ||
          target.closest('[contenteditable="true"]'))
      ) {
        return;
      }
      // Clicou em outro lugar do iframe, fecha a toolbar e salva
      closeFloatingToolbar();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Adiciona listener no iframe para cliques em outros elementos
    if (iframeDoc) {
      iframeDoc.addEventListener('mousedown', handleIframeClick);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      if (iframeDoc) {
        iframeDoc.removeEventListener('mousedown', handleIframeClick);
      }
    };
  }, [
    floatingToolbar.visible,
    floatingToolbar.editableEl,
    floatingToolbar.iframeDoc,
    focusedSlide,
    closeFloatingToolbar,
  ]);

  // Função legada para compatibilidade (não usada mais)
  const injectFloatingToolbar = (doc: Document, editableEl: HTMLElement) => {
    const ifr = iframeRefs.current[focusedSlide];
    if (ifr) {
      showFloatingToolbar(doc, editableEl, ifr);
    }
  };

  // Re-wire o iframe atual quando o focusedSlide muda
  useEffect(() => {
    const ifr = iframeRefs.current[focusedSlide];
    if (!ifr) return;

    let cleanupFn: (() => void) | undefined;

    const setupCurrentIframe = () => {
      const doc = ifr.contentDocument || ifr.contentWindow?.document;
      if (!doc) return;

      // Garante que os elementos editáveis tenham pointer-events
      doc.querySelectorAll('[data-editable]').forEach((el) => {
        (el as HTMLElement).style.pointerEvents = 'auto';
      });

      // === APLICA TEMA ATUAL (para templates 7 e 8) ===
      if ((templateId === '7' || templateId === '8') && globalSettings.theme) {
        const isDark = globalSettings.theme === 'dark';
        const bgColor = isDark ? '#000000' : '#ffffff';
        const textColor = isDark ? '#ffffff' : '#000000';

        // Aplica no .slide se existir, senão no body
        const slideEl = doc.querySelector('.slide') as HTMLElement;
        const targetEl = slideEl || doc.body;

        targetEl.style.setProperty('background-color', bgColor, 'important');

        // Aplica cor do texto em todos os elementos de texto
        doc
          .querySelectorAll(
            'h1, h2, h3, h4, h5, h6, p, span, div, [data-editable="title"], [data-editable="subtitle"], [data-editable="nome"], [data-editable="arroba"]',
          )
          .forEach((el) => {
            const htmlEl = el as HTMLElement;
            // Não altera elementos com background-image
            const cs = doc.defaultView?.getComputedStyle(htmlEl);
            if (!cs?.backgroundImage || cs.backgroundImage === 'none') {
              htmlEl.style.setProperty('color', textColor, 'important');
            }
          });
      }

      // === DOUBLE-CLICK PARA EDIÇÃO ===
      const onDblClickHandler = (ev: MouseEvent) => {
        const target = ev.target as HTMLElement | null;
        if (!target) return;

        const el = target.closest<HTMLElement>(
          '[data-editable="title"],[data-editable="subtitle"],[data-editable="nome"],[data-editable="arroba"]',
        );
        if (!el) return;

        ev.stopPropagation();

        // Se já está em modo de edição, deixa o navegador cuidar da seleção
        if (el.getAttribute('contenteditable') === 'true') {
          return;
        }

        ev.preventDefault();

        // Limpa outras seleções mas preserva este elemento
        clearAllSelections(el);

        // Habilita edição - o CSS já define o outline verde para contenteditable="true"
        el.setAttribute('contenteditable', 'true');
        el.style.cursor = 'text';
        el.focus();

        // Posiciona o cursor no final do texto
        const range = doc.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const selection = doc.defaultView?.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // Mostra toolbar flutuante de formatação
        const ifrEl = iframeRefs.current[focusedSlide];
        if (ifrEl) {
          showFloatingToolbar(doc, el, ifrEl);
        }
      };

      // Configura event listeners para seleção de elementos
// Configura event listeners para seleção de elementos
const onClickHandler = (ev: MouseEvent) => {
  const target = ev.target as HTMLElement | null;
  if (!target) return;

  // 1) Se clicou dentro de um elemento em modo de edição, não faz NADA
  // Deixa digitar / mover cursor / selecionar texto
  const contentEditableEl = target.closest<HTMLElement>('[contenteditable="true"]');
  if (contentEditableEl) {
    ev.stopPropagation();
    return;
  }

  // 2) Clicou FORA de qualquer contenteditable → encerra o modo edição
  // Pega o elemento atualmente em edição (via ref ou varredura no doc)
  const activeEditable =
    floatingToolbarRef.current.editableEl ||
    doc.querySelector<HTMLElement>('[data-editable][contenteditable="true"]');

  if (activeEditable) {
    activeEditable.removeAttribute('contenteditable');
    activeEditable.style.cursor = 'pointer';
    activeEditable.style.outline = '';
    activeEditable.style.outlineOffset = '';
  }

  // Fecha toolbar se estiver aberta
  if (floatingToolbarRef.current.visible && closeFloatingToolbarRef.current) {
    closeFloatingToolbarRef.current();
  }

  // Limpa seleções visuais (mas agora não mexe em contenteditable)
  clearAllSelections();

  // 3) Verifica se clicou em um elemento editável de texto (seleção, não edição)
  const el = target.closest<HTMLElement>(
    '[data-editable="title"],[data-editable="subtitle"],[data-editable="nome"],[data-editable="arroba"]'
  );
  if (el) {
    ev.preventDefault();
    ev.stopPropagation();

    const type = el.getAttribute('data-editable');
    el.classList.add('selected');
    (el as HTMLElement).style.zIndex = '1000';

    setSelectedElement({
      slideIndex: focusedSlide,
      element: type as ElementType,
    });
    return;
  }

  // 4) Imagem
  const wrapper = target.closest('.img-crop-wrapper') as HTMLElement | null;
  const clickedImg = (wrapper?.querySelector('img[data-editable="image"]') ??
    target.closest('img[data-editable="image"]')) as HTMLImageElement | null;

  if (clickedImg) {
    ev.preventDefault();
    ev.stopPropagation();

    if (wrapper) {
      wrapper.setAttribute('data-cv-selected', '1');
    }

    setSelectedElement({ slideIndex: focusedSlide, element: 'background' });
    return;
  }

  // 5) Vídeo
  const clickedVideo = target.closest('video') as HTMLVideoElement | null;
  if (clickedVideo) {
    const host = clickedVideo.parentElement as HTMLElement | null;
    if (host) {
      host.classList.add('selected');
      host.setAttribute('data-cv-selected', '1');
    }

    setSelectedElement({ slideIndex: focusedSlide, element: 'background' });
    return;
  }

  // 6) Avatar
  const clickedAvatar = target.closest('img[data-protected="true"]') as HTMLImageElement | null;
  if (clickedAvatar) {
    setSelectedElement({ slideIndex: focusedSlide, element: 'avatar' });
    return;
  }
};

      // Handler para mostrar toolbar flutuante quando selecionar texto
      const onMouseUpHandler = () => {
        const selection = doc.getSelection();
        if (!selection || selection.toString().length === 0) return;

        const anchorNode = selection.anchorNode;
        if (!anchorNode) return;

        const editableEl = (
          anchorNode.nodeType === Node.ELEMENT_NODE
            ? (anchorNode as HTMLElement)
            : anchorNode.parentElement
        )?.closest<HTMLElement>(
          '[data-editable="title"],[data-editable="subtitle"],[data-editable="nome"],[data-editable="arroba"]',
        );

        if (editableEl && editableEl.getAttribute('contenteditable') === 'true') {
          const ifr = iframeRefs.current[focusedSlide];
          if (ifr) {
            showFloatingToolbar(doc, editableEl, ifr);
          }
        }
      };

      // Adiciona event listeners
      doc.addEventListener('click', onClickHandler, true);
      doc.addEventListener('dblclick', onDblClickHandler, true);
      doc.addEventListener('mouseup', onMouseUpHandler);

      // Retorna função de cleanup
      cleanupFn = () => {
        try {
          doc.removeEventListener('click', onClickHandler, true);
          doc.removeEventListener('dblclick', onDblClickHandler, true);
          doc.removeEventListener('mouseup', onMouseUpHandler);
        } catch {}
      };
    };

    // Espera o iframe carregar
    const timeoutId = setTimeout(() => {
      if (ifr.contentDocument?.readyState === 'complete') {
        setupCurrentIframe();
      } else {
        ifr.addEventListener('load', setupCurrentIframe, { once: true });
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      cleanupFn?.();
    };
  }, [
    focusedSlide,
    renderedSlides,
    clearAllSelections,
    setSelectedElement,
    globalSettings.theme,
    templateId,
  ]);

  // === BACKGROUND MEDIA (mantido 100%) ===
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

  // === BUSCA DE IMAGENS (mantido 100%) ===
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

  // === UPLOAD (mantido 100%) ===
  const handleImageUpload = (
    slideIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      updateEditedValue(0, 'avatar_url', url);

      iframeRefs.current.forEach((ifr, _slideIndex) => {
        const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
        if (!doc) return;

        const avatarImgs = doc.querySelectorAll('img[data-protected="true"]');
        avatarImgs.forEach((img) => {
          const imgEl = img as HTMLImageElement;
          const rect = imgEl.getBoundingClientRect();
          const cs = doc.defaultView?.getComputedStyle(imgEl);
          const borderRadius = cs?.borderRadius || '';
          const isRounded =
            borderRadius.includes('50%') ||
            borderRadius.includes('9999') ||
            parseInt(borderRadius) > 50;
          const isSmall = rect.width < 150 && rect.height < 150;

          if (isSmall && isRounded) {
            imgEl.src = url;
          }
        });
      });

      setHasUnsavedChanges(true);
      addToast('Avatar atualizado!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // === DETECTA MUDANÇAS (mantido 100%) ===
  useEffect(() => {
    const hasContentChanges = Object.keys(editedContent).length > 0;
    const hasStyleChanges = Object.keys(elementStyles).length > 0;
    const hasImageChanges = Object.keys(uploadedImages).length > 0;
    const hasChanges = hasContentChanges || hasStyleChanges || hasImageChanges;
    
    // Marca que o usuário fez alterações (para não sobrescrever com dados da API)
    if (hasChanges) {
      userHasMadeChangesRef.current = true;
    }
    
    setHasUnsavedChanges(hasChanges);
  }, [editedContent, elementStyles, uploadedImages, contentId]);

  // === SALVAMENTO / DOWNLOAD (mantido 100%) ===
  const { handleSave, handleDownloadAll } = useSaveDownload({
    data: activeData,
    slides,
    renderedSlides,
    editedContent,
    elementStyles,
    uploadedImages,
    contentId,
    iframeRefs: iframeRefs as React.MutableRefObject<(HTMLIFrameElement | null)[]>,
    slideWidth,
    slideHeight,
    setEditedContent,
    setUploadedImages,
    setHasUnsavedChanges,
    setIsSaving,
    addToast,
    onSaveSuccess,
  });

  // Atualiza a ref do handleSave para uso em outros lugares
  React.useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // Download do slide atual - usa o mesmo método do download all
  const handleDownloadCurrent = async () => {
    setIsExporting(true);
    try {
      // Usa o serviço de download existente com apenas o slide atual
      const { downloadSlidesAsPNG } = await import(
        '../../../services/carousel/download.service'
      );

      const currentSlide = renderedSlides[focusedSlide];
      if (!currentSlide) throw new Error('Slide não encontrado');

      await downloadSlidesAsPNG(
        [currentSlide],
        undefined, // onProgress
        editedContent,
        elementStyles,
      );

      addToast('Slide exportado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      addToast('Erro ao exportar slide', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // === AUTO-DOWNLOAD (mantido 100%) ===
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
  }, [
    autoDownload,
    autoDownloadExecuted,
    renderedSlides.length,
    handleDownloadAll,
    onClose,
  ]);

  // === WHEEL EVENT HANDLER (com passive: false para permitir preventDefault) ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
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
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerRef, pan, zoom, setZoom, setPan]);

  // === HANDLERS DA NOVA UI ===
  const handleToggleBatchMode = () => {
    setBatchMode(!batchMode);
    if (batchMode) setSelectedSlides(new Set());
  };

  const handleToggleSlideSelection = (index: number) => {
    const newSet = new Set(selectedSlides);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedSlides(newSet);
  };

  const handleBatchDelete = () => {
    // Converte para array e ordena de forma decrescente para não afetar os índices
    const indicesToDelete = Array.from(selectedSlides).sort((a, b) => b - a);
    const indicesToDeleteSet = new Set(indicesToDelete);

    // Remove slides dos dados
    const newConteudos = [...(activeData as any).conteudos];
    const newRenderedSlides = [...renderedSlides];

    indicesToDelete.forEach((index) => {
      newConteudos.splice(index, 1);
      newRenderedSlides.splice(index, 1);
    });

    (activeData as any).conteudos = newConteudos;
    setRenderedSlides(newRenderedSlides);

    // Recalcula o mapeamento de índices antigos para novos
    const indexMapping: Record<number, number> = {};
    let newIndex = 0;
    for (let oldIndex = 0; oldIndex < renderedSlides.length; oldIndex++) {
      if (!indicesToDeleteSet.has(oldIndex)) {
        indexMapping[oldIndex] = newIndex;
        newIndex++;
      }
    }

    // Reindexa os estilos
    setElementStyles((prev) => {
      const updated: Record<string, any> = {};
      Object.entries(prev).forEach(([key, styles]) => {
        const [slideStr, field] = key.split('-');
        const slideIndex = parseInt(slideStr);
        
        if (indicesToDeleteSet.has(slideIndex)) {
          // Remove estilos dos slides excluídos
          return;
        }
        
        const mappedIndex = indexMapping[slideIndex];
        if (mappedIndex !== undefined) {
          updated[`${mappedIndex}-${field}`] = styles;
        }
      });
      return updated;
    });

    // Reindexa o editedContent
    setEditedContent((prev) => {
      const updated: Record<string, any> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const [slideStr, field] = key.split('-');
        const slideIndex = parseInt(slideStr);
        
        if (indicesToDeleteSet.has(slideIndex)) {
          // Remove conteúdo dos slides excluídos
          return;
        }
        
        const mappedIndex = indexMapping[slideIndex];
        if (mappedIndex !== undefined) {
          updated[`${mappedIndex}-${field}`] = value;
        }
      });
      return updated;
    });

    // Ajusta o slide focado se necessário
    const newFocusedSlide = Math.min(focusedSlide, newConteudos.length - 1);
    setFocusedSlide(Math.max(0, newFocusedSlide));
    setSelectedElement({ slideIndex: Math.max(0, newFocusedSlide), element: null });

    setSelectedSlides(new Set());
    setBatchMode(false);
    setHasUnsavedChanges(true);
    addToast(`${indicesToDelete.length} slide(s) excluído(s)`, 'success');
  };

  // Abre o modal para selecionar qual slide clonar
  const handleAddSlide = () => {
    setIsCloneModalOpen(true);
  };

  // Clona o slide selecionado e adiciona como novo slide
  const handleCloneSlide = (sourceIndex: number) => {
    const sourceConteudo = (activeData as any).conteudos[sourceIndex];
    const sourceRenderedHtml = renderedSlides[sourceIndex];

    if (!sourceConteudo) {
      addToast('Erro ao clonar slide', 'error');
      return;
    }

    // Faz uma cópia profunda do conteúdo do slide
    const clonedConteudo = JSON.parse(JSON.stringify(sourceConteudo));

    // Adiciona o conteúdo clonado
    (activeData as any).conteudos.push(clonedConteudo);

    // Clona o HTML renderizado também (para manter estilos/formatação)
    const newRendered = [...renderedSlides, sourceRenderedHtml];
    setRenderedSlides(newRendered);

    // Copia os estilos do slide fonte para o novo slide
    const newIndex = newRendered.length - 1;
    Object.entries(elementStyles).forEach(([key, styles]) => {
      const [slideStr, field] = key.split('-');
      if (parseInt(slideStr) === sourceIndex) {
        const newKey = `${newIndex}-${field}`;
        setElementStyles((prev) => ({
          ...prev,
          [newKey]: { ...styles },
        }));
      }
    });

    // Foca no novo slide
    setFocusedSlide(newIndex);
    setSelectedElement({ slideIndex: newIndex, element: null });
    setHasUnsavedChanges(true);
    setIsCloneModalOpen(false);
    addToast(`Slide ${sourceIndex + 1} duplicado!`, 'success');
  };

  const handleDeleteSlide = (index: number) => {
    if (renderedSlides.length <= 1) {
      addToast('Não é possível excluir o último slide', 'error');
      return;
    }

    // Remove o slide dos conteúdos
    const newConteudos = [...(activeData as any).conteudos];
    newConteudos.splice(index, 1);
    (activeData as any).conteudos = newConteudos;

    // Remove o HTML renderizado
    const newRenderedSlides = [...renderedSlides];
    newRenderedSlides.splice(index, 1);
    setRenderedSlides(newRenderedSlides);

    // Reindexa os estilos: remove estilos do slide excluído e ajusta índices dos slides seguintes
    setElementStyles((prev) => {
      const updated: Record<string, any> = {};
      Object.entries(prev).forEach(([key, styles]) => {
        const [slideStr, field] = key.split('-');
        const slideIndex = parseInt(slideStr);
        
        if (slideIndex === index) {
          // Remove estilos do slide excluído
          return;
        } else if (slideIndex > index) {
          // Reindexar slides após o excluído
          updated[`${slideIndex - 1}-${field}`] = styles;
        } else {
          // Mantém slides anteriores
          updated[key] = styles;
        }
      });
      return updated;
    });

    // Reindexa o editedContent também
    setEditedContent((prev) => {
      const updated: Record<string, any> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const [slideStr, field] = key.split('-');
        const slideIndex = parseInt(slideStr);
        
        if (slideIndex === index) {
          // Remove conteúdo do slide excluído
          return;
        } else if (slideIndex > index) {
          // Reindexar slides após o excluído
          updated[`${slideIndex - 1}-${field}`] = value;
        } else {
          // Mantém slides anteriores
          updated[key] = value;
        }
      });
      return updated;
    });

    // Ajusta o slide focado
    const newFocusedSlide = Math.min(focusedSlide, newConteudos.length - 1);
    setFocusedSlide(Math.max(0, newFocusedSlide));
    setSelectedElement({ slideIndex: Math.max(0, newFocusedSlide), element: null });

    setHasUnsavedChanges(true);
    addToast(`Slide ${index + 1} excluído`, 'success');
  };

  const handleBackToSetup = () => {
    onClose();
  };

  const handlePrevSlide = () => {
    if (focusedSlide > 0) {
      handleSlideClick(focusedSlide - 1);
    }
  };

  const handleNextSlide = () => {
    if (focusedSlide < slides.length - 1) {
      handleSlideClick(focusedSlide + 1);
    }
  };

  const handleUpdateGlobalSettings = (settings: Partial<GlobalSettings>) => {
    setGlobalSettings((prev) => {
      const newSettings = { ...prev, ...settings };

      // Aplica tema light/dark nos iframes (somente para templates 7 e 8)
      if (settings.theme && (templateId === '7' || templateId === '8')) {
        const isDark = settings.theme === 'dark';
        const bgColor = isDark ? '#000000' : '#ffffff';
        const textColor = isDark ? '#ffffff' : '#000000';

        // Atualiza a cor de fundo no estado também
        newSettings.accentColor = bgColor;

        // Aplica em TODOS os iframes
        iframeRefs.current.forEach((ifr) => {
          const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
          if (!doc) return;

          // Aplica no .slide se existir, senão no body
          const slideEl = doc.querySelector('.slide') as HTMLElement;
          const targetEl = slideEl || doc.body;

          targetEl.style.setProperty('background-color', bgColor, 'important');

          // Aplica cor do texto em todos os elementos de texto
          doc
            .querySelectorAll(
              'h1, h2, h3, h4, h5, h6, p, span, div, [data-editable="title"], [data-editable="subtitle"], [data-editable="nome"], [data-editable="arroba"]',
            )
            .forEach((el) => {
              const htmlEl = el as HTMLElement;
              // Não altera elementos com background-image
              const cs = doc.defaultView?.getComputedStyle(htmlEl);
              if (!cs?.backgroundImage || cs.backgroundImage === 'none') {
                htmlEl.style.setProperty('color', textColor, 'important');
              }
            });
        });
      }

      // Aplica cor de fundo nos iframes
      if (settings.accentColor && typeof settings.accentColor === 'string') {
        const bgColor = settings.accentColor;
        iframeRefs.current.forEach((ifr) => {
          const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
          if (!doc) return;

          // Aplica cor de fundo no .slide se existir
          const slideEl = doc.querySelector('.slide') as HTMLElement;
          if (slideEl) {
            slideEl.style.setProperty('background-color', bgColor, 'important');
          } else {
            doc.body.style.setProperty('background-color', bgColor, 'important');
          }
        });
      }

      // IMPORTANTE: Salva a cor de fundo no elementStyles para persistir no save
      if (settings.accentColor || settings.theme) {
        const bgColor = settings.theme 
          ? (settings.theme === 'dark' ? '#000000' : '#ffffff')
          : settings.accentColor;
        
        if (bgColor) {
          // Atualiza elementStyles para TODOS os slides com a nova cor de fundo
          renderedSlides.forEach((_, index) => {
            setElementStyles((prev) => ({
              ...prev,
              [`${index}-slideBackground`]: { backgroundColor: bgColor },
            }));
          });
          console.log('🎨 Cor de fundo atualizada no elementStyles:', bgColor);
        }
      }

      // === BADGE VERIFICADO ===
      if (settings.showVerifiedBadge !== undefined) {
        iframeRefs.current.forEach((ifr) => {
          const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
          if (!doc) return;

          // Procura o avatar ou elemento do perfil
          const avatar = doc.querySelector('img[data-protected="true"]') as HTMLElement;
          if (!avatar) return;

          const parent = avatar.parentElement;
          if (!parent) return;

          // ID único para o badge
          const badgeId = 'verified-badge-icon';
          const existingBadge = doc.getElementById(badgeId);

          if (settings.showVerifiedBadge) {
            // Adiciona badge se não existir
            if (!existingBadge) {
              // Cria o SVG do badge verificado
              const badge = doc.createElement('div');
              badge.id = badgeId;
              badge.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#1DA1F2" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                </svg>
              `;
              badge.style.cssText = 'position:absolute;bottom:-2px;right:-2px;z-index:100;pointer-events:none;';
              
              // Garante que o parent seja relative
              parent.style.position = 'relative';
              parent.appendChild(badge);
              console.log('✅ Badge verificado adicionado');
            }
          } else {
            // Remove badge se existir
            if (existingBadge) {
              existingBadge.remove();
              console.log('❌ Badge verificado removido');
            }
          }
        });
      }

      return newSettings;
    });
    setHasUnsavedChanges(true);
  };

  // Extrai cor de fundo atual do slide (da classe .slide)
  useEffect(() => {
    const extractBackgroundColor = () => {
      const ifr = iframeRefs.current[focusedSlide];
      const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
      if (!doc) return;

      // Tenta encontrar o elemento .slide primeiro
      const slideEl = doc.querySelector('.slide') as HTMLElement;
      const targetEl = slideEl || doc.body;

      const cs = doc.defaultView?.getComputedStyle(targetEl);
      const bgColor = cs?.backgroundColor;

      if (
        bgColor &&
        bgColor !== 'rgba(0, 0, 0, 0)' &&
        bgColor !== 'transparent'
      ) {
        // Converte para hex
        const rgb = bgColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const hex =
            '#' +
            rgb
              .slice(0, 3)
              .map((x) => parseInt(x).toString(16).padStart(2, '0'))
              .join('');
          setGlobalSettings((prev) => ({ ...prev, accentColor: hex }));
        }
      }
    };

    // Aguarda o iframe carregar
    const timeout = setTimeout(extractBackgroundColor, 500);
    return () => clearTimeout(timeout);
  }, [focusedSlide, renderedSlides]);

  const handleGenerateAIImage = (slideIndex: number, _prompt?: string) => {
    setGeneratingSlides((prev) => new Set(prev).add(slideIndex));
    addToast(`Gerando imagem para slide ${slideIndex + 1}...`, 'success');

    // Simula geração (em produção, chamaria a API)
    setTimeout(() => {
      setGeneratingSlides((prev) => {
        const newSet = new Set(prev);
        newSet.delete(slideIndex);
        return newSet;
      });
      addToast('Imagem gerada com sucesso!', 'success');
    }, 3000);
  };

  // === RENDER ===
  return (
    <div
      className="fixed inset-0 bg-light flex z-50"
      style={{ left: window.innerWidth >= 768 ? '81px' : '0' }}
    >
      {/* SIDEBAR ESQUERDA - Lista de Slides */}
      <SlidesSidebar
        slides={slides}
        carouselData={data}
        focusedSlide={focusedSlide}
        generatingSlides={generatingSlides}
        errorSlides={errorSlides}
        batchMode={batchMode}
        selectedSlides={selectedSlides}
        isMinimized={isSidebarMinimized}
        onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
        onSlideClick={handleSlideClick}
        onAddSlide={handleAddSlide}
        onDeleteSlide={handleDeleteSlide}
        onToggleBatchMode={handleToggleBatchMode}
        onToggleSlideSelection={handleToggleSlideSelection}
        onBatchDelete={handleBatchDelete}
        onBackToSetup={handleBackToSetup}
      />

      {/* ÁREA CENTRAL - Canvas + Toolbar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar superior */}
        <EditorToolbar
          slidesCount={slides.length}
          currentSlide={focusedSlide}
          zoom={zoom}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          isExporting={isExporting}
          onZoomIn={() => zoomIn(zoom, setZoom)}
          onZoomOut={() => zoomOut(zoom, setZoom)}
          onPrevSlide={handlePrevSlide}
          onNextSlide={handleNextSlide}
          onDownloadCurrent={handleDownloadCurrent}
          onDownloadAll={handleDownloadAll}
          onSave={handleSave}
          onClose={onClose}
        />

        {/* Canvas Preview - apenas o slide ativo */}
        {/* Verifica se o slide atual é baseado em blocos ou template */}
        {(() => {
          const currentConteudo = (activeData as any).conteudos[focusedSlide];
          const isBlockBasedSlide = isBlockSlide(currentConteudo);

          if (isBlockBasedSlide) {
            // Renderiza BlocksCanvas para slides baseados em blocos
            return (
              <div className="flex-1 flex flex-col min-w-0 bg-light">
                {/* Canvas area for blocks */}
                <div
                  ref={containerRef}
                  className="flex-1 overflow-hidden relative min-h-0"
                  style={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                  }}
                  onMouseDown={(e) => {
                    if (e.button === 0 && e.target === e.currentTarget) {
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
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <div 
                      className="w-full h-full" 
                      style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)`,
                        backgroundSize: '24px 24px',
                      }}
                    />
                  </div>

                  {/* Slide container */}
                  <div
                    className="absolute"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: '0 0',
                      transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                      left: 0,
                      top: 0,
                      zIndex: 10,
                    }}
                  >
                    <div
                      className="relative bg-white rounded-xl shadow-2xl overflow-hidden flex-shrink-0"
                      style={{ 
                        width: `${slideWidth}px`, 
                        height: `${slideHeight}px`,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <BlocksCanvas
                        slideIndex={focusedSlide}
                        conteudo={currentConteudo}
                        onChangeBlocks={(blocks) => {
                          (activeData as any).conteudos[focusedSlide] = {
                            ...currentConteudo,
                            blocks,
                          };
                          setHasUnsavedChanges(true);
                        }}
                        width={slideWidth}
                        height={slideHeight}
                        backgroundColor={currentConteudo.backgroundColor || '#ffffff'}
                      />
                    </div>
                  </div>

                  {/* Zoom controls - bottom center */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-light px-3 py-2">
                      <button
                        onClick={() => zoomOut(zoom, setZoom)}
                        className="p-1.5 rounded-lg hover:bg-gray-light transition-colors text-gray-dark"
                      >
                        <span className="w-4 h-4 block text-center">−</span>
                      </button>
                      <span className="text-sm font-medium text-gray-dark min-w-[48px] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={() => zoomIn(zoom, setZoom)}
                        className="p-1.5 rounded-lg hover:bg-gray-light transition-colors text-gray-dark"
                      >
                        <span className="w-4 h-4 block text-center">+</span>
                      </button>
                    </div>
                  </div>

                  {/* Slide info - top left */}
                  <div className="absolute top-4 left-4 z-20">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-light px-3 py-1.5">
                      <span className="text-sm font-medium text-gray-dark">
                        Slide {focusedSlide + 1}
                      </span>
                      <span className="text-xs text-gray-DEFAULT ml-2">
                        {slideWidth} × {slideHeight}px
                      </span>
                      <span className="text-xs text-blue-500 ml-2 font-medium">
                        Blocos
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Renderiza CanvasPreview para slides de template (comportamento original)
          return (
            <CanvasPreview
              zoom={zoom}
              pan={pan}
              isDragging={isDragging}
              slideWidth={slideWidth}
              slideHeight={slideHeight}
              slideIndex={focusedSlide}
              renderedSlide={renderedSlides[focusedSlide] || ''}
              iframeRef={(el) => {
                if (el) {
                  iframeRefs.current[focusedSlide] = el;
                }
              }}
              containerRef={containerRef}
              onWheel={undefined}
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
              onBackgroundClick={handleCanvasBackgroundClick}
              onZoomIn={() => zoomIn(zoom, setZoom)}
              onZoomOut={() => zoomOut(zoom, setZoom)}
              setZoom={setZoom}
            />
          );
        })()}
      </div>

      {/* PAINEL DIREITO - Propriedades */}
      <RightPropertiesPanel
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
        globalSettings={globalSettings}
        iframeRefs={iframeRefs}
        onToggleMinimize={() => setIsPropertiesMinimized(!isPropertiesMinimized)}
        onUpdateEditedValue={updateEditedValue}
        onUpdateElementStyle={updateElementStyle}
        onBackgroundImageChange={handleBackgroundImageChange}
        onAvatarUpload={handleAvatarUpload}
        onSearchKeywordChange={setSearchKeyword}
        onSearchImages={handleSearchImages}
        onImageUpload={handleImageUpload}
        onGenerateAIImage={handleGenerateAIImage}
        getElementStyle={getElementStyle}
        getEditedValue={getEditedValue}
        onUpdateGlobalSettings={handleUpdateGlobalSettings}
      />

      {/* Floating Toolbar para formatação de texto */}
      {floatingToolbar.visible && (
        <div
          data-floating-toolbar="true"
          className="fixed z-[10001] flex items-center gap-1 px-2 py-1.5 rounded-lg"
          style={{
            top: floatingToolbar.top,
            left: floatingToolbar.left,
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            boxShadow:
              '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            fontFamily:
              'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Seta apontando para baixo */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: '-6px',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1a1a1a',
            }}
          />

          {/* Botões de formatação */}
          {[
            {
              cmd: 'bold',
              label: 'B',
              title: 'Negrito',
              fontWeight: '700' as const,
            },
            {
              cmd: 'italic',
              label: 'I',
              title: 'Itálico',
              fontStyle: 'italic' as const,
            },
            {
              cmd: 'underline',
              label: 'U',
              title: 'Sublinhado',
              textDecoration: 'underline' as const,
            },
            {
              cmd: 'strikeThrough',
              label: 'S',
              title: 'Tachado',
              textDecoration: 'line-through' as const,
            },
          ].map(({ cmd, label, title, fontWeight, fontStyle, textDecoration }) => (
            <button
              key={cmd}
              title={title}
              className="w-7 h-7 flex items-center justify-center rounded text-white text-sm transition-all"
              style={{
                background: 'transparent',
                fontWeight: fontWeight || '400',
                fontStyle: fontStyle || 'normal',
                textDecoration: textDecoration || 'none',
                fontFamily: 'Georgia, Times, serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(79, 130, 242, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                applyTextFormat(cmd);
              }}
            >
              {label}
            </button>
          ))}

          {/* Botão fechar */}
          <button
            title="Fechar"
            className="w-6 h-6 flex items-center justify-center rounded text-white/40 text-xs transition-all hover:bg-red-500/50 hover:text-white ml-1"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeFloatingToolbar();
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal para clonar slide */}
      <SlideCloneModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onSelectSlide={handleCloneSlide}
        slides={renderedSlides}
        carouselData={data}
      />

      {/* Toasts */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Hidden iframes para slides não ativos (necessário para export) */}
      <div className="hidden">
        {renderedSlides.map((slide, i) => {
          // Não renderiza o iframe hidden do slide focado - ele é renderizado no CanvasPreview
          if (i === focusedSlide) return null;
          return (
            <iframe
              key={i}
              ref={(el) => {
                if (el && i !== focusedSlide) {
                  iframeRefs.current[i] = el;
                }
              }}
              srcDoc={slide}
              className="w-full h-full border-0"
              title={`Slide ${i + 1}`}
              sandbox="allow-same-origin allow-scripts allow-autoplay"
              style={{
                width: `${slideWidth}px`,
                height: `${slideHeight}px`,
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default NewCarouselViewer;