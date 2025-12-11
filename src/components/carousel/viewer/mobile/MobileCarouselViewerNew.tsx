/**
 * MobileCarouselViewerNew - Editor mobile completo reescrito do zero
 * Funcionalidades espelhadas do desktop com UI adaptada para mobile
 * Usa framer-motion para animações
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CarouselData, ElementType } from '../../../../types/carousel';
import { TEMPLATE_DIMENSIONS } from '../../../../types/carousel';
import { templateRenderer, templateService, searchImages } from '../../../../services/carousel';
import { getGeneratedContentById, updateGeneratedContent, getGeneratedContent } from '../../../../services/generatedContent';
import Toast from '../../../Toast';

// Componentes mobile
import { MobileHeader } from './MobileHeader';
import { MobileSlidePreview } from './MobileSlidePreview';
import { MobileBottomBar, type TextEditMode } from './MobileBottomBar';
import { MobileFloatingToolbar } from './MobileFloatingToolbar';
import { MobilePropertiesPanel } from './MobilePropertiesPanel';
import { MobileSlideActions } from './MobileSlideActions';
import { MobileSlidesPanel } from './MobileSlidesPanel';
import { MobileDownloadModal } from './MobileDownloadModal';
import { MobileTextSubPanel } from './MobileTextSubPanel';

// Hooks e utilitários
import { useMobileEditorState } from './useMobileEditorState';
import type { GlobalSettings } from './types';

import { downloadSlidesAsPNG } from '../../../../services/carousel/download.service';


interface MobileCarouselViewerNewProps {
  slides: string[];
  carouselData: CarouselData;
  onClose: () => void;
  generatedContentId?: number;
  onSaveSuccess?: () => void;
  autoDownload?: boolean;
}

// Constantes
const AUTO_SAVE_THRESHOLD = 5; // Salva automaticamente a cada 5 modificações

export const MobileCarouselViewerNew: React.FC<MobileCarouselViewerNewProps> = ({
  slides,
  carouselData,
  onClose,
  generatedContentId,
  onSaveSuccess,
  autoDownload = false,
}) => {
  // === MIGRAÇÃO DE DADOS ===
  const migratedData = React.useMemo(() => {
    const data = carouselData as any;
    if (data.conteudos && Array.isArray(data.conteudos)) return carouselData;
    if (data.slides && Array.isArray(data.slides)) {
      return { ...carouselData, conteudos: data.slides };
    }
    return null;
  }, [carouselData]);

  if (!migratedData || !(migratedData as any).conteudos) {
    return (
      <div className="fixed inset-0 bg-[#0d0d1a] z-50 flex items-center justify-center">
        <div className="bg-[#1a1a2e] p-6 rounded-2xl max-w-sm text-center">
          <h2 className="text-white text-xl font-bold mb-4">Erro ao carregar</h2>
          <p className="text-white/70 mb-6">Dados do carrossel incompatíveis.</p>
          <button
            onClick={onClose}
            className="bg-blue-DEFAULT text-white px-6 py-3 rounded-xl font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const data = migratedData;

  // === ESTADO PRINCIPAL ===
  const editorState = useMobileEditorState({
    slides,
    carouselData: data,
    generatedContentId,
  });

  const {
    currentSlide,
    setCurrentSlide,
    renderedSlides,
    setRenderedSlides,
    totalSlides,
    selectedElement,
    setSelectedElement,
    editedContent,
    setEditedContent,
    elementStyles,
    setElementStyles: _setElementStyles,
    uploadedImages,
    setUploadedImages,
    searchKeyword,
    setSearchKeyword,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isSaving,
    setIsSaving,
    contentId,
    setContentId,
    modificationCount,
    setModificationCount,
    globalSettings,
    updateGlobalSettings,
    toasts,
    addToast,
    removeToast,
    textFormatting,
    setTextFormatting: _setTextFormatting,
    detectTextFormatting,
    isPropertiesPanelOpen,
    setIsPropertiesPanelOpen,
    isSlideActionsOpen,
    setIsSlideActionsOpen,
    isTextEditing,
    setIsTextEditing,
    iframeRefs,
    containerRef,
    userHasMadeChangesRef,
    updateEditedValue,
    updateElementStyle: _updateElementStyle,
    getEditedValue,
    getElementStyle: _getElementStyle,
    clearAllSelections,
  } = editorState;

  // === ESTADOS LOCAIS ===
  const [isLoadingFreshData, setIsLoadingFreshData] = useState(false);
  const [freshCarouselData, setFreshCarouselData] = useState<CarouselData | null>(null);
  const [autoDownloadExecuted, setAutoDownloadExecuted] = useState(false);
  const [dataFetchKey, setDataFetchKey] = useState(0); // Force refetch on mount
  
  // Novos estados para painéis
  const [isSlidesPanelOpen, setIsSlidesPanelOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<'image' | 'text' | 'settings' | null>(null);
  
  // Estados para edição de texto na barra inferior
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [textEditMode, setTextEditMode] = useState<TextEditMode | null>(null);
  const [currentFontSize, setCurrentFontSize] = useState('16px');
  const [currentFontFamily, setCurrentFontFamily] = useState('inherit');

  // === TEMPLATE CONFIG ===
  const templateId = (data as any).dados_gerais?.template || '1';
  const templateDimensions = TEMPLATE_DIMENSIONS[templateId] || { width: 1080, height: 1350 };
  const slideWidth = templateDimensions.width;
  const slideHeight = templateDimensions.height;

  // === FORÇA REFETCH AO MONTAR ===
  useEffect(() => {
    // Incrementa a key para forçar refetch quando componente monta
    setDataFetchKey(prev => prev + 1);
    // Reset estado de mudanças do usuário
    userHasMadeChangesRef.current = false;
  }, []);

  // === BUSCA DADOS ATUALIZADOS (SEMPRE ao montar) ===
  useEffect(() => {
    const fetchFreshData = async () => {
      const idToFetch = generatedContentId || contentId;
      if (!idToFetch) {
        console.log('📱 [Mobile] Sem ID para buscar dados');
        return;
      }

      setIsLoadingFreshData(true);

      try {
        console.log('📱 [Mobile] Buscando dados atualizados da API para ID:', idToFetch);
        const response = await getGeneratedContentById(idToFetch);

        if (response.success && response.data?.result) {
          const apiData = response.data.result as any;

          if (apiData.conteudos && apiData.dados_gerais) {
            console.log('✅ [Mobile] Dados atualizados recebidos da API:', {
              nome: apiData.dados_gerais.nome,
              arroba: apiData.dados_gerais.arroba,
              template: apiData.dados_gerais.template,
              slidesCount: apiData.conteudos.length
            });

            const updatedData = {
              conteudos: apiData.conteudos,
              dados_gerais: apiData.dados_gerais,
              styles: apiData.styles || {},
            } as CarouselData;

            setFreshCarouselData(updatedData);

            // Re-renderiza slides com dados frescos
            const newTemplateId = apiData.dados_gerais.template || '2';
            const templateHtml = await templateService.fetchTemplate(newTemplateId);

            if (templateHtml?.length > 0) {
              const newRenderedSlides = templateRenderer.renderAllSlides(templateHtml, updatedData);
              const processedSlides = newRenderedSlides.map((s, i) => 
                injectEditableIds(s, i, updatedData)
              );
              setRenderedSlides(processedSlides);
              console.log('✅ [Mobile] Slides re-renderizados com dados frescos');
            }

            addToast('Dados carregados!', 'success');
          }
        }
      } catch (error) {
        console.error('❌ [Mobile] Erro ao buscar dados:', error);
      } finally {
        setIsLoadingFreshData(false);
      }
    };

    // Só busca quando dataFetchKey > 0 (após o primeiro useEffect rodar)
    if (dataFetchKey > 0) {
      fetchFreshData();
    }
  }, [dataFetchKey, generatedContentId, contentId]);

  // Use fresh data quando disponível
  const activeData = freshCarouselData || data;

  // === BUSCA CONTENT ID ===
  useEffect(() => {
    if (contentId) return;

    const firstTitle = (data as any).conteudos?.[0]?.title;
    if (!firstTitle) return;

    const fetchContentId = async () => {
      try {
        const response = await getGeneratedContent({ limit: 100 });
        const matchingContent = response.data?.find((content: any) => {
          try {
            const result = typeof content.result === 'string'
              ? JSON.parse(content.result)
              : content.result;
            return result?.conteudos?.[0]?.title === firstTitle;
          } catch {
            return false;
          }
        });

        if (matchingContent) {
          setContentId(matchingContent.id);
        }
      } catch (error) {
        console.error('❌ [Mobile] Erro ao buscar contentId:', error);
      }
    };

    fetchContentId();
  }, []);

  // === INJEÇÃO DE IDs EDITÁVEIS ===
  const injectEditableIds = useCallback((html: string, slideIndex: number, sourceData: CarouselData): string => {
    let result = html;
    const d = sourceData as any;
    const conteudo = d.conteudos?.[slideIndex];
    const titleText = conteudo?.title || '';
    const subtitleText = conteudo?.subtitle || '';
    const nomeText = d.dados_gerais?.nome || '';
    const arrobaText = d.dados_gerais?.arroba || '';

    const getPlainText = (htmlOrText: string): string => {
      if (!htmlOrText) return '';
      if (/<\w+[^>]*>/.test(htmlOrText)) {
        const temp = document.createElement('div');
        temp.innerHTML = htmlOrText;
        return temp.textContent || '';
      }
      return htmlOrText;
    };

    const addEditableSpan = (text: string, id: string, attr: string) => {
      if (!text) return;
      const searchText = text.trim();
      if (!searchText || result.includes(`data-editable="${attr}"`)) return;

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
      }
    };

    if (arrobaText) addEditableSpan(arrobaText, `slide-${slideIndex}-arroba`, 'arroba');
    if (nomeText) addEditableSpan(nomeText, `slide-${slideIndex}-nome`, 'nome');

    const subtitlePlain = getPlainText(subtitleText);
    const titlePlain = getPlainText(titleText);

    if (subtitlePlain) addEditableSpan(subtitlePlain, `slide-${slideIndex}-subtitle`, 'subtitle');
    if (titlePlain) addEditableSpan(titlePlain, `slide-${slideIndex}-title`, 'title');

    // Injeta HTML formatado se existir
    if (titleText && /<\w+[^>]*>/.test(titleText)) {
      const titleRegex = new RegExp(
        `(<span[^>]*id="slide-${slideIndex}-title"[^>]*>)([\\s\\S]*?)(<\\/span>)`,
        'i'
      );
      if (titleRegex.test(result)) {
        result = result.replace(titleRegex, `$1${titleText}$3`);
      }
    }
    if (subtitleText && /<\w+[^>]*>/.test(subtitleText)) {
      const subtitleRegex = new RegExp(
        `(<span[^>]*id="slide-${slideIndex}-subtitle"[^>]*>)([\\s\\S]*?)(<\\/span>)`,
        'i'
      );
      if (subtitleRegex.test(result)) {
        result = result.replace(subtitleRegex, `$1${subtitleText}$3`);
      }
    }

    // Adiciona estilos CSS
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
    `
    );

    return result.replace(
      /<body([^>]*)>/i,
      (m, attrs) =>
        /id=/.test(attrs)
          ? m
          : `<body${attrs} id="slide-${slideIndex}-background" data-editable="background">`
    );
  }, []);

  // === PROCESSA SLIDES INICIAIS ===
  useEffect(() => {
    const processedSlides = slides.map((s, i) => injectEditableIds(s, i, activeData));
    setRenderedSlides(processedSlides);
  }, [slides, activeData, injectEditableIds]);

  // === AUTO-SAVE ===
  useEffect(() => {
    if (modificationCount > 0 && modificationCount % AUTO_SAVE_THRESHOLD === 0) {
      handleSave();
    }
  }, [modificationCount]);

  // === HANDLERS ===
  const handleSave = useCallback(async () => {
    if (!contentId) {
      addToast('ID do conteúdo não encontrado', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedConteudos = (activeData as any).conteudos.map((conteudo: any, index: number) => {
        const updatedConteudo = { ...conteudo };

        // Captura conteúdo formatado do iframe
        const ifr = iframeRefs.current[index];
        const doc = ifr?.contentDocument || ifr?.contentWindow?.document;

        if (doc) {
          const titleEl = doc.querySelector('[data-editable="title"]');
          if (titleEl) updatedConteudo.title = titleEl.innerHTML || conteudo.title;

          const subtitleEl = doc.querySelector('[data-editable="subtitle"]');
          if (subtitleEl) updatedConteudo.subtitle = subtitleEl.innerHTML || conteudo.subtitle;

          const slideEl = doc.querySelector('.slide') as HTMLElement;
          const targetEl = slideEl || doc.body;
          const cs = doc.defaultView?.getComputedStyle(targetEl);
          const bgColor = cs?.backgroundColor;
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            updatedConteudo.slideBackground = bgColor;
          }
        }

        // Coleta estilos do slide
        const slideStyles: Record<string, any> = {};
        Object.entries(elementStyles).forEach(([key, styleObj]) => {
          const [slideIndexStr, elementType] = key.split('-');
          if (parseInt(slideIndexStr, 10) === index) {
            slideStyles[elementType] = styleObj;
          }
        });

        if (Object.keys(slideStyles).length > 0) {
          updatedConteudo.styles = slideStyles;
        }

        // Background image
        const bgKey = `${index}-background`;
        const selectedBg = editedContent[bgKey] || uploadedImages[index];
        if (selectedBg) {
          updatedConteudo.imagem_fundo = selectedBg;
        }

        return updatedConteudo;
      });

      const result = {
        dados_gerais: (activeData as any).dados_gerais,
        conteudos: updatedConteudos,
      };

      await updateGeneratedContent(contentId, { result });

      setEditedContent({});
      setUploadedImages({});
      setHasUnsavedChanges(false);
      addToast('Salvo com sucesso!', 'success');

      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error('❌ [Mobile] Erro ao salvar:', error);
      addToast('Erro ao salvar', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [contentId, activeData, editedContent, elementStyles, uploadedImages, addToast, onSaveSuccess]);

  const handleDownload = useCallback(async (singleSlideIndex?: number) => {
    try {
      addToast('Preparando download...', 'success');

      // 1. Captura o HTML atualizado de cada iframe (como o desktop faz)
      const capturedSlides: string[] = [];
      
      // Se for download de slide único, processa apenas esse slide
      const indicesToProcess = singleSlideIndex !== undefined 
        ? [singleSlideIndex] 
        : Array.from({ length: renderedSlides.length }, (_, i) => i);

      for (const i of indicesToProcess) {
        const ifr = iframeRefs.current[i];
        
        if (ifr) {
          const doc = ifr.contentDocument || ifr.contentWindow?.document;
          
          if (doc) {
            // Captura o HTML atualizado do DOM do iframe
            const html = doc.documentElement.outerHTML;
            const iframeHTML = `<iframe srcdoc="${html.replace(/"/g, '&quot;')}" class="w-full h-full border-0" title="Slide ${i + 1}" sandbox="allow-same-origin allow-scripts allow-autoplay" style="pointer-events: auto;"></iframe>`;
            capturedSlides.push(iframeHTML);
            console.log(`✅ [Mobile] Capturado iframe do slide ${i + 1}`);
          } else if (renderedSlides[i]) {
            // Fallback para renderedSlides
            const iframeHTML = `<iframe srcdoc="${renderedSlides[i].replace(/"/g, '&quot;')}" class="w-full h-full border-0" title="Slide ${i + 1}" sandbox="allow-same-origin allow-scripts allow-autoplay" style="pointer-events: auto;"></iframe>`;
            capturedSlides.push(iframeHTML);
            console.log(`⚠️ [Mobile] Usando renderedSlides para slide ${i + 1}`);
          }
        } else if (renderedSlides[i]) {
          // Se não há iframe, usa renderedSlides
          const iframeHTML = `<iframe srcdoc="${renderedSlides[i].replace(/"/g, '&quot;')}" class="w-full h-full border-0" title="Slide ${i + 1}" sandbox="allow-same-origin allow-scripts allow-autoplay" style="pointer-events: auto;"></iframe>`;
          capturedSlides.push(iframeHTML);
          console.log(`⚠️ [Mobile] Iframe não encontrado, usando renderedSlides para slide ${i + 1}`);
        }
      }

      if (capturedSlides.length === 0) {
        throw new Error('Nenhum slide capturado para download');
      }

      console.log(`📥 [Mobile] Iniciando download de ${capturedSlides.length} slides...`);
      console.log(`📐 [Mobile] Dimensões: ${slideWidth}x${slideHeight} (template ${templateId})`);
      
      // 2. Chama o serviço de download passando editedContent e elementStyles
      await downloadSlidesAsPNG(capturedSlides, (current, total) => {
        console.log(`📊 Download: ${current}/${total}`);
      }, editedContent, elementStyles);

      const message = singleSlideIndex !== undefined 
        ? 'Slide baixado com sucesso!' 
        : `${capturedSlides.length} slides baixados!`;
      addToast(message, 'success');
    } catch (error) {
      console.error('❌ [Mobile] Erro no download:', error);
      addToast('Erro ao baixar', 'error');
    }
  }, [renderedSlides, addToast, iframeRefs, editedContent, elementStyles, slideWidth, slideHeight, templateId]);

  // Download de slide único
  const handleDownloadSingle = useCallback((slideIndex: number) => {
    handleDownload(slideIndex);
  }, [handleDownload]);

  // === FUNÇÃO PARA DETECTAR FONTE E TAMANHO DO ELEMENTO ===
  const detectElementFontInfo = useCallback((slideIndex: number, elementType: ElementType) => {
    const ifr = iframeRefs.current[slideIndex];
    const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
    const win = ifr?.contentWindow;
    if (!doc || !win) return;

    // Encontra o elemento
    let element: HTMLElement | null = null;
    if (elementType === 'title') {
      element = doc.querySelector('[data-editable="title"]') as HTMLElement ||
                doc.querySelector('[data-element-type="title"]') as HTMLElement ||
                doc.querySelector('.title') as HTMLElement ||
                doc.querySelector('h1') as HTMLElement;
    } else if (elementType === 'subtitle') {
      element = doc.querySelector('[data-editable="subtitle"]') as HTMLElement ||
                doc.querySelector('[data-element-type="subtitle"]') as HTMLElement ||
                doc.querySelector('.subtitle') as HTMLElement;
    } else if (elementType === 'nome') {
      element = doc.querySelector('[data-editable="nome"]') as HTMLElement ||
                doc.querySelector('[data-element-type="nome"]') as HTMLElement ||
                doc.querySelector('.nome') as HTMLElement;
    } else if (elementType === 'arroba') {
      element = doc.querySelector('[data-editable="arroba"]') as HTMLElement ||
                doc.querySelector('[data-element-type="arroba"]') as HTMLElement ||
                doc.querySelector('.arroba') as HTMLElement;
    }

    if (element) {
      const computedStyle = win.getComputedStyle(element);
      const fontSize = computedStyle.fontSize || '16px';
      const fontFamily = computedStyle.fontFamily || 'inherit';
      
      console.log('📱 [Mobile] Detectado fonte:', { fontSize, fontFamily });
      setCurrentFontSize(fontSize);
      setCurrentFontFamily(fontFamily);
    }
  }, []);

  // === HANDLERS DE ELEMENTO ===
  const handleElementClick = useCallback((slideIndex: number, element: ElementType, elementId?: string) => {
    console.log('📱 [Mobile] handleElementClick:', { slideIndex, element, elementId });
    setSelectedElement({ slideIndex, element, elementId });
    setCurrentSlide(slideIndex);

    // Abre painel de propriedades para imagens/background
    if (element === 'background' || element === 'avatar') {
      setActivePanelTab('image');
      setIsPropertiesPanelOpen(true);
      setIsTextSelected(false);
    }
    
    // Para texto (title, subtitle, nome, arroba), ativa modo de texto na barra inferior
    if (element === 'title' || element === 'subtitle' || element === 'nome' || element === 'arroba') {
      setIsTextSelected(true);
      setIsPropertiesPanelOpen(false); // Fecha painel se estiver aberto
      // Detecta a fonte e tamanho atual do elemento
      detectElementFontInfo(slideIndex, element);
    }
  }, [detectElementFontInfo]);

  const handleTextEdit = useCallback((slideIndex: number, element: ElementType) => {
    setIsTextEditing(true);
    setSelectedElement({ slideIndex, element });
    detectTextFormatting();
  }, [detectTextFormatting]);

  // === HANDLERS DE FORMATAÇÃO ===
  const handleApplyTextStyle = useCallback((style: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    const ifr = iframeRefs.current[currentSlide];
    const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
    if (!doc) return;

    const commandMap: Record<string, string> = {
      'bold': 'bold',
      'italic': 'italic',
      'underline': 'underline',
      'strikethrough': 'strikeThrough',
    };

    try {
      doc.execCommand(commandMap[style], false);
      detectTextFormatting();
      setHasUnsavedChanges(true);
      userHasMadeChangesRef.current = true;
      setModificationCount((prev) => prev + 1);
    } catch (e) {
      console.warn('execCommand failed:', e);
    }
  }, [currentSlide, detectTextFormatting]);

  const handleApplyAlign = useCallback((align: 'left' | 'center' | 'right') => {
    const ifr = iframeRefs.current[currentSlide];
    const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
    if (!doc) return;

    const alignCommand = align === 'left' ? 'justifyLeft' : align === 'center' ? 'justifyCenter' : 'justifyRight';

    try {
      doc.execCommand(alignCommand, false);
      detectTextFormatting();
      setHasUnsavedChanges(true);
      userHasMadeChangesRef.current = true;
    } catch (e) {
      console.warn('align failed:', e);
    }
  }, [currentSlide, detectTextFormatting]);

  const handleColorChange = useCallback((color: string) => {
    const ifr = iframeRefs.current[currentSlide];
    const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
    if (!doc) return;

    // Pega o elemento selecionado e aplica a cor diretamente
    const selection = ifr?.contentWindow?.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === 1 
        ? container as HTMLElement 
        : container.parentElement;
      
      if (element) {
        element.style.setProperty('color', color, 'important');
        const children = element.querySelectorAll('*');
        children.forEach((child: Element) => {
          (child as HTMLElement).style.setProperty('color', color, 'important');
        });
      }
    }
    
    detectTextFormatting();
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
  }, [currentSlide, detectTextFormatting]);

  // === FUNÇÃO PARA SELECIONAR TODO O TEXTO DO ELEMENTO ===
  const selectElementText = useCallback((slideIndex: number, elementType: ElementType): HTMLElement | null => {
    const ifr = iframeRefs.current[slideIndex];
    const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
    const win = ifr?.contentWindow;
    if (!doc || !win) return null;

    // Encontra o elemento baseado no tipo - seletores ordenados por prioridade
    // Primeiro tenta data-editable específico, depois data-element-type, depois classe
    let element: HTMLElement | null = null;
    
    // Seletores específicos para cada tipo - tenta um por vez para evitar conflitos
    if (elementType === 'title') {
      element = doc.querySelector('[data-editable="title"]') as HTMLElement ||
                doc.querySelector('[data-element-type="title"]') as HTMLElement ||
                doc.querySelector('.title') as HTMLElement ||
                doc.querySelector('h1') as HTMLElement ||
                doc.querySelector('h2') as HTMLElement;
    } else if (elementType === 'subtitle') {
      element = doc.querySelector('[data-editable="subtitle"]') as HTMLElement ||
                doc.querySelector('[data-element-type="subtitle"]') as HTMLElement ||
                doc.querySelector('.subtitle') as HTMLElement;
      // Não usa 'p' genérico para subtitle pois pode pegar title
    } else if (elementType === 'nome') {
      element = doc.querySelector('[data-editable="nome"]') as HTMLElement ||
                doc.querySelector('[data-element-type="nome"]') as HTMLElement ||
                doc.querySelector('.nome') as HTMLElement;
    } else if (elementType === 'arroba') {
      element = doc.querySelector('[data-editable="arroba"]') as HTMLElement ||
                doc.querySelector('[data-element-type="arroba"]') as HTMLElement ||
                doc.querySelector('.arroba') as HTMLElement;
    }

    if (!element) return null;

    // Seleciona todo o texto do elemento
    const range = doc.createRange();
    range.selectNodeContents(element);
    const selection = win.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    return element;
  }, []);

  // === HANDLERS MELHORADOS QUE SELECIONAM O TEXTO ANTES DE APLICAR ===
  const handleApplyTextStyleWithSelection = useCallback((style: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    if (!selectedElement) return;
    
    const element = selectElementText(selectedElement.slideIndex, selectedElement.element);
    if (!element) return;

    // Aplica estilos diretamente no elemento usando style
    const styleMap: Record<string, { property: string; value: string; inverse: string }> = {
      'bold': { property: 'fontWeight', value: 'bold', inverse: 'normal' },
      'italic': { property: 'fontStyle', value: 'italic', inverse: 'normal' },
      'underline': { property: 'textDecoration', value: 'underline', inverse: 'none' },
      'strikethrough': { property: 'textDecoration', value: 'line-through', inverse: 'none' },
    };

    const styleConfig = styleMap[style];
    if (!styleConfig) return;

    // Toggle: se já está aplicado, remove
    const currentValue = element.style[styleConfig.property as any];
    const isApplied = currentValue === styleConfig.value || 
                      (style === 'strikethrough' && currentValue?.includes('line-through')) ||
                      (style === 'underline' && currentValue?.includes('underline'));
    
    if (isApplied) {
      element.style.setProperty(styleConfig.property.replace(/([A-Z])/g, '-$1').toLowerCase(), styleConfig.inverse, 'important');
    } else {
      element.style.setProperty(styleConfig.property.replace(/([A-Z])/g, '-$1').toLowerCase(), styleConfig.value, 'important');
    }
    
    detectTextFormatting();
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
    setModificationCount((prev) => prev + 1);
  }, [selectedElement, selectElementText, detectTextFormatting]);

  const handleApplyAlignWithSelection = useCallback((align: 'left' | 'center' | 'right') => {
    if (!selectedElement) return;
    
    const element = selectElementText(selectedElement.slideIndex, selectedElement.element);
    if (!element) return;

    // Aplica alinhamento diretamente no elemento
    element.style.setProperty('text-align', align, 'important');
    
    detectTextFormatting();
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
  }, [selectedElement, selectElementText, detectTextFormatting]);

  const handleColorChangeWithSelection = useCallback((color: string) => {
    if (!selectedElement) return;
    
    const element = selectElementText(selectedElement.slideIndex, selectedElement.element);
    if (!element) return;

    // Aplica a cor diretamente no elemento com !important para sobrepor dark/light mode
    element.style.setProperty('color', color, 'important');
    
    // Também aplica nos filhos que podem ter cor diferente
    const children = element.querySelectorAll('*');
    children.forEach((child: Element) => {
      (child as HTMLElement).style.setProperty('color', color, 'important');
    });
    
    detectTextFormatting();
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
  }, [selectedElement, selectElementText, detectTextFormatting]);

  // === HANDLERS DE FONTE ===
  const handleFontSizeChange = useCallback((fontSize: string) => {
    if (!selectedElement) return;
    
    const element = selectElementText(selectedElement.slideIndex, selectedElement.element);
    if (!element) return;

    element.style.fontSize = fontSize;
    setCurrentFontSize(fontSize);
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
  }, [selectedElement, selectElementText]);

  const handleFontFamilyChange = useCallback((fontFamily: string) => {
    if (!selectedElement) return;
    
    const element = selectElementText(selectedElement.slideIndex, selectedElement.element);
    if (!element) return;

    element.style.fontFamily = fontFamily;
    setCurrentFontFamily(fontFamily);
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
  }, [selectedElement, selectElementText]);

  // === HANDLER PARA LIMPAR SELEÇÃO DE TEXTO ===
  const handleClearTextSelection = useCallback(() => {
    setIsTextSelected(false);
    setTextEditMode(null);
    setSelectedElement({ slideIndex: currentSlide, element: null });
  }, [currentSlide]);

  // === HANDLER PARA ENTRAR NO MODO EDIÇÃO DE TEXTO ===
  const handleEnterTextEditMode = useCallback(() => {
    if (!selectedElement || !selectedElement.element) return;
    
    const ifr = iframeRefs.current[selectedElement.slideIndex];
    const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
    if (!doc) return;

    // Encontra o elemento baseado no tipo
    let element: HTMLElement | null = null;
    const elementType = selectedElement.element;
    
    if (elementType === 'title') {
      element = doc.querySelector('[data-editable="title"]') as HTMLElement ||
                doc.querySelector('[data-element-type="title"]') as HTMLElement ||
                doc.querySelector('.title') as HTMLElement ||
                doc.querySelector('h1') as HTMLElement;
    } else if (elementType === 'subtitle') {
      element = doc.querySelector('[data-editable="subtitle"]') as HTMLElement ||
                doc.querySelector('[data-element-type="subtitle"]') as HTMLElement ||
                doc.querySelector('.subtitle') as HTMLElement;
    } else if (elementType === 'nome') {
      element = doc.querySelector('[data-editable="nome"]') as HTMLElement ||
                doc.querySelector('[data-element-type="nome"]') as HTMLElement ||
                doc.querySelector('.nome') as HTMLElement;
    } else if (elementType === 'arroba') {
      element = doc.querySelector('[data-editable="arroba"]') as HTMLElement ||
                doc.querySelector('[data-element-type="arroba"]') as HTMLElement ||
                doc.querySelector('.arroba') as HTMLElement;
    }

    if (element) {
      // Habilita edição no elemento
      element.setAttribute('contenteditable', 'true');
      element.style.outline = '2px solid #4167B2';
      element.style.outlineOffset = '2px';
      element.focus();
      
      // Seleciona todo o texto para facilitar edição
      const range = doc.createRange();
      range.selectNodeContents(element);
      const selection = ifr?.contentWindow?.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // Handler para quando sair da edição
      const handleBlur = () => {
        element!.removeAttribute('contenteditable');
        element!.style.outline = '';
        element!.style.outlineOffset = '';
        
        // Salva o conteúdo editado
        const newText = element!.textContent || '';
        updateEditedValue(selectedElement.slideIndex, elementType as string, newText);
        
        setHasUnsavedChanges(true);
        userHasMadeChangesRef.current = true;
        
        element!.removeEventListener('blur', handleBlur);
      };
      
      element.addEventListener('blur', handleBlur);
      
      // Fecha o menu de texto
      setIsTextSelected(false);
    }
  }, [selectedElement, updateEditedValue]);

  // === HANDLERS DE IMAGEM (igual ao desktop) ===
  const handleBackgroundImageChange = useCallback((slideIndex: number, imageUrl: string) => {
    console.log('📱 [Mobile] handleBackgroundImageChange:', { slideIndex, imageUrl: imageUrl.substring(0, 50) });
    
    const ifr = iframeRefs.current[slideIndex];
    const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
    if (!doc) {
      console.warn('📱 [Mobile] Iframe não encontrado, salvando apenas em editedContent');
      updateEditedValue(slideIndex, 'background', imageUrl);
      return;
    }

    // Estratégia 1: Procura imagem editável específica
    const editableImg = doc.querySelector('img[data-editable="image"]') as HTMLImageElement;
    if (editableImg) {
      console.log('📱 [Mobile] Aplicando em img[data-editable="image"]');
      editableImg.src = imageUrl;
      editableImg.removeAttribute('srcset');
      editableImg.removeAttribute('sizes');
      editableImg.style.objectFit = 'cover';
      editableImg.style.objectPosition = 'center';
      updateEditedValue(slideIndex, 'background', imageUrl);
      setIsPropertiesPanelOpen(false);
      addToast('Imagem aplicada!', 'success');
      return;
    }

    // Estratégia 2: Procura qualquer imagem grande (não avatar/logo)
    const allImages = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[];
    const mainImage = allImages.find(img => {
      const isProtected = img.getAttribute('data-protected') === 'true';
      const isLarge = img.offsetWidth > 100 && img.offsetHeight > 100;
      return !isProtected && isLarge;
    });

    if (mainImage) {
      console.log('📱 [Mobile] Aplicando em imagem principal encontrada');
      mainImage.src = imageUrl;
      mainImage.removeAttribute('srcset');
      mainImage.removeAttribute('sizes');
      mainImage.style.objectFit = 'cover';
      mainImage.style.objectPosition = 'center';
      updateEditedValue(slideIndex, 'background', imageUrl);
      setIsPropertiesPanelOpen(false);
      addToast('Imagem aplicada!', 'success');
      return;
    }

    // Estratégia 3: Procura elemento .bg com background-image
    const bgDiv = doc.querySelector('.bg') as HTMLElement;
    if (bgDiv) {
      console.log('📱 [Mobile] Aplicando como background em .bg');
      bgDiv.style.backgroundImage = `url(${imageUrl})`;
      bgDiv.style.backgroundSize = 'cover';
      bgDiv.style.backgroundPosition = 'center';
      updateEditedValue(slideIndex, 'background', imageUrl);
      setIsPropertiesPanelOpen(false);
      addToast('Imagem aplicada!', 'success');
      return;
    }

    // Estratégia 4: Aplica no body como fallback
    console.log('📱 [Mobile] Aplicando como background no body (fallback)');
    doc.body.style.backgroundImage = `url(${imageUrl})`;
    doc.body.style.backgroundSize = 'cover';
    doc.body.style.backgroundPosition = 'center';
    
    updateEditedValue(slideIndex, 'background', imageUrl);
    setIsPropertiesPanelOpen(false);
    addToast('Imagem aplicada!', 'success');
  }, [updateEditedValue, addToast]);

  const handleSearchImages = useCallback(async () => {
    if (!searchKeyword.trim()) return;

    setIsSearching(true);
    try {
      const images = await searchImages(searchKeyword);
      setSearchResults(images.slice(0, 20));
    } catch (error) {
      console.error('❌ [Mobile] Erro na busca:', error);
      addToast('Erro ao buscar imagens', 'error');
    } finally {
      setIsSearching(false);
    }
  }, [searchKeyword, addToast]);

  const handleImageUpload = useCallback((slideIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadedImages((prev) => ({ ...prev, [slideIndex]: dataUrl }));
      handleBackgroundImageChange(slideIndex, dataUrl);
    };
    reader.readAsDataURL(file);
  }, [handleBackgroundImageChange]);

  // === HANDLERS DE DADOS GLOBAIS (igual ao desktop) ===
  const handleUpdateNome = useCallback((nome: string) => {
    console.log('📱 [Mobile] handleUpdateNome chamado com:', nome);
    
    // Atualiza editedContent para todos os slides (igual ao desktop)
    setEditedContent((prev) => {
      const updated = { ...prev };
      for (let i = 0; i < renderedSlides.length; i++) {
        updated[`${i}-nome`] = nome;
      }
      console.log('📱 [Mobile] editedContent atualizado:', updated);
      return updated;
    });

    // Atualiza dados_gerais
    if ((activeData as any).dados_gerais) {
      (activeData as any).dados_gerais.nome = nome;
    }

    // Atualiza o nome em todos os iframes
    iframeRefs.current.forEach((ifr, index) => {
      const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
      if (!doc) return;

      const nomeEl = doc.querySelector('[data-editable="nome"]');
      console.log(`📱 [Mobile] Iframe ${index} - nomeEl encontrado:`, !!nomeEl, nomeEl?.textContent);
      if (nomeEl) {
        nomeEl.textContent = nome;
      }
    });

    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
    setModificationCount((prev) => prev + 1);
  }, [renderedSlides.length, activeData]);

  const handleUpdateArroba = useCallback((arroba: string) => {
    console.log('📱 [Mobile] handleUpdateArroba chamado com:', arroba);
    
    // Atualiza editedContent para todos os slides (igual ao desktop)
    setEditedContent((prev) => {
      const updated = { ...prev };
      for (let i = 0; i < renderedSlides.length; i++) {
        updated[`${i}-arroba`] = arroba;
      }
      console.log('📱 [Mobile] editedContent atualizado:', updated);
      return updated;
    });

    // Atualiza dados_gerais
    if ((activeData as any).dados_gerais) {
      (activeData as any).dados_gerais.arroba = arroba;
    }

    // Atualiza o arroba em todos os iframes
    iframeRefs.current.forEach((ifr, index) => {
      const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
      if (!doc) return;

      const arrobaEl = doc.querySelector('[data-editable="arroba"]');
      console.log(`📱 [Mobile] Iframe ${index} - arrobaEl encontrado:`, !!arrobaEl, arrobaEl?.textContent);
      if (arrobaEl) {
        arrobaEl.textContent = arroba;
      }
    });

    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
    setModificationCount((prev) => prev + 1);
  }, [renderedSlides.length, activeData]);

  // Função para ler valores diretamente do iframe (valor real no slide)
  const getSlideValue = useCallback((type: 'nome' | 'arroba'): string => {
    // Tenta ler do primeiro iframe disponível
    const iframe = iframeRefs.current[0];
    if (!iframe) {
      console.log(`📱 [Mobile] getSlideValue(${type}): Nenhum iframe disponível`);
      return '';
    }
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      console.log(`📱 [Mobile] getSlideValue(${type}): Documento não acessível`);
      return '';
    }
    
    const element = doc.querySelector(`[data-editable="${type}"]`);
    const value = element?.textContent?.trim() || '';
    console.log(`📱 [Mobile] getSlideValue(${type}): Valor lido do iframe:`, value);
    return value;
  }, []);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;

      // Atualiza o avatar/logo em todos os iframes
      iframeRefs.current.forEach((ifr) => {
        const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
        if (!doc) return;

        const avatarImg = doc.querySelector('img[data-protected="true"]') as HTMLImageElement;
        if (avatarImg) {
          avatarImg.src = dataUrl;
        }
      });

      setHasUnsavedChanges(true);
      userHasMadeChangesRef.current = true;
      setModificationCount((prev) => prev + 1);
      addToast('Logo atualizado!', 'success');
    };
    reader.readAsDataURL(file);
  }, [addToast]);

  // === HANDLERS DE SLIDE ===
  const handleCloneSlide = useCallback((sourceIndex: number, targetPosition: 'before' | 'after' | number) => {
    const newSlides = [...renderedSlides];
    const sourceSlide = renderedSlides[sourceIndex];
    
    let insertIndex: number;
    if (targetPosition === 'before') {
      insertIndex = sourceIndex;
    } else if (targetPosition === 'after') {
      insertIndex = sourceIndex + 1;
    } else {
      insertIndex = targetPosition;
    }

    newSlides.splice(insertIndex, 0, sourceSlide);
    setRenderedSlides(newSlides);
    setCurrentSlide(insertIndex);
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
    addToast('Slide clonado!', 'success');
  }, [renderedSlides, addToast]);

  const handleDeleteSlide = useCallback((slideIndex: number) => {
    if (renderedSlides.length <= 1) {
      addToast('Não é possível deletar o único slide', 'error');
      return;
    }

    const newSlides = renderedSlides.filter((_, i) => i !== slideIndex);
    setRenderedSlides(newSlides);
    
    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1);
    }
    
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
    addToast('Slide removido!', 'success');
  }, [renderedSlides, currentSlide, addToast]);

  // === HANDLER DE GLOBAL SETTINGS (IGUAL AO DESKTOP) ===
  const handleUpdateGlobalSettings = useCallback((settings: Partial<GlobalSettings>) => {
    updateGlobalSettings(settings);

    // Aplica tema light/dark nos iframes (somente para templates 7 e 8)
    if (settings.theme && (templateId === '7' || templateId === '8')) {
      const isDark = settings.theme === 'dark';
      const bgColor = isDark ? '#000000' : '#ffffff';
      const textColor = isDark ? '#ffffff' : '#000000';

      // Aplica em TODOS os iframes
      iframeRefs.current.forEach((ifr) => {
        const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
        if (!doc) return;

        // Aplica no .slide se existir, senão no body
        const slideEl = doc.querySelector('.slide') as HTMLElement;
        const targetEl = slideEl || doc.body;

        targetEl.style.setProperty('background-color', bgColor, 'important');

        // Aplica cor do texto em todos os elementos de texto
        doc.querySelectorAll(
          'h1, h2, h3, h4, h5, h6, p, span, div, [data-editable="title"], [data-editable="subtitle"], [data-editable="nome"], [data-editable="arroba"]'
        ).forEach((el) => {
          const htmlEl = el as HTMLElement;
          // Não altera elementos com background-image
          const cs = doc.defaultView?.getComputedStyle(htmlEl);
          if (!cs?.backgroundImage || cs.backgroundImage === 'none') {
            htmlEl.style.setProperty('color', textColor, 'important');
          }
        });
      });

      // Salva a cor de fundo no elementStyles para persistir no save
      renderedSlides.forEach((_, index) => {
        _setElementStyles((prev: Record<string, any>) => ({
          ...prev,
          [`${index}-slideBackground`]: { backgroundColor: bgColor },
        }));
      });
      
      setHasUnsavedChanges(true);
      userHasMadeChangesRef.current = true;
    }

    // Aplica showSlideNumber
    if (settings.showSlideNumber !== undefined) {
      iframeRefs.current.forEach((ifr) => {
        const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
        if (!doc) return;

        const slideNumEl = doc.querySelector('[data-editable="slide-number"]');
        if (slideNumEl) {
          (slideNumEl as HTMLElement).style.display = settings.showSlideNumber ? '' : 'none';
        }
      });
    }

    // Aplica showVerifiedBadge (igual ao desktop)
    if (settings.showVerifiedBadge !== undefined) {
      iframeRefs.current.forEach((ifr) => {
        const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
        if (!doc) return;

        // Procura o avatar ou elemento do perfil
        const avatar = doc.querySelector('img[data-protected="true"]') as HTMLElement;
        if (!avatar) return;

        const parent = avatar.parentElement;
        if (!parent) return;

        const badgeId = 'verified-badge-icon';
        const existingBadge = doc.getElementById(badgeId);

        if (settings.showVerifiedBadge) {
          if (!existingBadge) {
            const badge = doc.createElement('div');
            badge.id = badgeId;
            badge.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#1DA1F2" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));">
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
              </svg>
            `;
            badge.style.cssText = 'position: absolute; bottom: -2px; right: -2px; z-index: 100; pointer-events: none;';
            parent.style.position = 'relative';
            parent.appendChild(badge);
          }
        } else {
          if (existingBadge) {
            existingBadge.remove();
          }
        }
      });
      
      setHasUnsavedChanges(true);
      userHasMadeChangesRef.current = true;
    }
  }, [updateGlobalSettings, templateId, renderedSlides, _setElementStyles]);

  // === AUTO DOWNLOAD ===
  useEffect(() => {
    if (autoDownload && !autoDownloadExecuted && renderedSlides.length > 0) {
      setAutoDownloadExecuted(true);
      setTimeout(() => handleDownload(), 1000);
    }
  }, [autoDownload, autoDownloadExecuted, renderedSlides.length, handleDownload]);

  // === RENDER ===
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0d0d1a] z-50 flex flex-col"
      ref={containerRef}
    >
      {/* Header */}
      <MobileHeader
        onClose={onClose}
        onSave={handleSave}
        onDownload={() => setIsDownloadModalOpen(true)}
        onOpenMenu={() => setIsSlideActionsOpen(true)}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
      />

      {/* Slide Preview - Main area */}
      <div className="flex-1 pt-16 pb-20 flex items-center justify-center">
        <MobileSlidePreview
          renderedSlides={renderedSlides}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          onElementClick={handleElementClick}
          onTextEdit={handleTextEdit}
          iframeRefs={iframeRefs}
          templateId={templateId}
        />
      </div>

      {/* Bottom Bar - mostra opções de texto quando um texto está selecionado */}
      <MobileBottomBar
        onOpenPanel={(tab) => {
          setActivePanelTab(tab);
          setIsPropertiesPanelOpen(true);
          setIsTextSelected(false);
        }}
        onOpenSlides={() => setIsSlidesPanelOpen(true)}
        hasSelectedElement={!!selectedElement.element}
        selectedElementType={selectedElement.element}
        activeTab={activePanelTab}
        isTextSelected={isTextSelected}
        onTextEditModeSelect={(mode) => setTextEditMode(mode)}
        onEnterTextEditMode={handleEnterTextEditMode}
        onClearTextSelection={handleClearTextSelection}
      />

      {/* Sub-painel de texto (fonte, tamanho, cor, formato) */}
      <MobileTextSubPanel
        isOpen={textEditMode !== null}
        editMode={textEditMode}
        onClose={() => setTextEditMode(null)}
        textFormatting={textFormatting}
        currentFontSize={currentFontSize}
        currentFontFamily={currentFontFamily}
        onFontFamilyChange={handleFontFamilyChange}
        onFontSizeChange={handleFontSizeChange}
        onColorChange={handleColorChangeWithSelection}
        onApplyTextStyle={handleApplyTextStyleWithSelection}
        onApplyAlign={handleApplyAlignWithSelection}
      />

      {/* Floating Toolbar (for text editing) */}
      <MobileFloatingToolbar
        isVisible={isTextEditing}
        formatting={textFormatting}
        onApplyStyle={handleApplyTextStyle}
        onApplyAlign={handleApplyAlign}
        onColorChange={handleColorChange}
        onClose={() => {
          setIsTextEditing(false);
          clearAllSelections();
        }}
      />

      {/* Properties Panel */}
      <MobilePropertiesPanel
        isOpen={isPropertiesPanelOpen}
        onClose={() => {
          setIsPropertiesPanelOpen(false);
          setActivePanelTab(null);
        }}
        initialTab={activePanelTab || 'image'}
        selectedElement={selectedElement}
        carouselData={activeData}
        globalSettings={globalSettings}
        editedContent={editedContent}
        uploadedImages={uploadedImages}
        searchKeyword={searchKeyword}
        searchResults={searchResults}
        isSearching={isSearching}
        onUpdateGlobalSettings={handleUpdateGlobalSettings}
        onBackgroundImageChange={handleBackgroundImageChange}
        onSearchKeywordChange={setSearchKeyword}
        onSearchImages={handleSearchImages}
        onImageUpload={handleImageUpload}
        getEditedValue={getEditedValue}
        getSlideValue={getSlideValue}
        // Props de ajustes globais
        onUpdateNome={handleUpdateNome}
        onUpdateArroba={handleUpdateArroba}
        onLogoUpload={handleLogoUpload}
      />

      {/* Slides Panel - Grid de slides para navegação */}
      <MobileSlidesPanel
        isOpen={isSlidesPanelOpen}
        onClose={() => setIsSlidesPanelOpen(false)}
        renderedSlides={renderedSlides}
        currentSlide={currentSlide}
        carouselData={activeData}
        onSlideSelect={setCurrentSlide}
        onDeleteSlide={handleDeleteSlide}
        onCloneSlide={(index) => handleCloneSlide(index, 'after')}
      />

      {/* Download Modal - Opções de download */}
      <MobileDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownloadCurrent={() => {
          setIsDownloadModalOpen(false);
          handleDownloadSingle(currentSlide);
        }}
        onDownloadAll={() => {
          setIsDownloadModalOpen(false);
          handleDownload();
        }}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        isDownloading={isDownloading}
      />

      {/* Slide Actions (clone, delete) */}
      <MobileSlideActions
        isOpen={isSlideActionsOpen}
        onClose={() => setIsSlideActionsOpen(false)}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        onCloneSlide={handleCloneSlide}
        onDeleteSlide={handleDeleteSlide}
        onDownloadSlide={handleDownloadSingle}
        canDelete={renderedSlides.length > 1}
      />

      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoadingFreshData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center"
          >
            <div className="bg-[#1a1a2e] p-6 rounded-2xl flex flex-col items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-8 h-8 border-2 border-blue-DEFAULT border-t-transparent rounded-full"
              />
              <p className="text-white text-sm">Carregando...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileCarouselViewerNew;
