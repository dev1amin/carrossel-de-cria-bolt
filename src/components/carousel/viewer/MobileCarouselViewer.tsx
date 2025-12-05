// MobileCarouselViewer.tsx - Editor mobile-first para carrosséis
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, 
  Download, 
  Save,
  X,
  Type,
  Image as ImageIcon
} from 'lucide-react';
import type { CarouselData, ElementType } from '../../../types/carousel';
import Toast, { ToastMessage } from '../../Toast';

// Dimensões originais do slide
const SLIDE_WIDTH = 1080;
const SLIDE_HEIGHT = 1350;

// Logs para debug
const log = (area: string, message: string, data?: any) => {
  console.log(`📱 [MobileEditor/${area}]`, message, data ?? '');
};

interface MobileCarouselViewerProps {
  slides: string[];
  carouselData: CarouselData;
  onClose: () => void;
  generatedContentId?: number;
  onSaveSuccess?: () => void;
  onDownload?: () => Promise<void>;
  onSave?: () => Promise<void>;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
}

// Tipo para elemento selecionado
interface SelectedElement {
  slideIndex: number;
  element: ElementType | null;
  elementId?: string;
}

const MobileCarouselViewer: React.FC<MobileCarouselViewerProps> = ({
  slides,
  carouselData,
  onClose,
  generatedContentId: _generatedContentId,
  onSaveSuccess: _onSaveSuccess,
  onDownload,
  onSave,
  hasUnsavedChanges = false,
  isSaving = false,
}) => {
  // Props reservadas para uso futuro
  void _generatedContentId;
  void _onSaveSuccess;
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [propertiesPanelHeight, setPropertiesPanelHeight] = useState(0);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [editedContent, setEditedContent] = useState<Record<string, any>>({});
  const [_isTextEditing, setIsTextEditing] = useState(false);
  const [containerScale, setContainerScale] = useState(0.3);
  const [processedSlides, setProcessedSlides] = useState<string[]>([]);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [customFontSize, setCustomFontSize] = useState('');
  const [currentElementStyles, setCurrentElementStyles] = useState<{
    color: string;
    fontSize: string;
    fontWeight: string;
    textAlign: string;
  }>({ color: '#FFFFFF', fontSize: '18px', fontWeight: '400', textAlign: 'left' });
  
  // Swipe para trocar slide
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const initialPanelHeight = useRef(0);

  const minPanelHeight = 60;
  const maxPanelHeight = 450; // Aumentado para caber controles de imagem

  // Migração de dados
  const data = React.useMemo(() => {
    const d = carouselData as any;
    if (d.conteudos && Array.isArray(d.conteudos)) return carouselData;
    if (d.slides && Array.isArray(d.slides)) {
      return { ...carouselData, conteudos: d.slides };
    }
    return carouselData;
  }, [carouselData]);

  // Função para injetar IDs editáveis nos slides
  const injectEditableIds = useCallback((html: string, slideIndex: number): string => {
    let result = html;
    const conteudo = (data as any).conteudos?.[slideIndex];
    const titleText = conteudo?.title || '';
    const subtitleText = conteudo?.subtitle || '';
    const nomeText = (data as any).dados_gerais?.nome || '';
    const arrobaText = (data as any).dados_gerais?.arroba || '';

    log('Processing', `Processando slide ${slideIndex}`, { 
      titleText: titleText.slice(0, 30), 
      subtitleText: subtitleText.slice(0, 30),
      nomeText,
      arrobaText 
    });

    const addEditableSpan = (text: string, id: string, attr: string) => {
      if (!text) return;
      const searchText = text.trim();
      if (!searchText) return;
      if (result.includes(`data-editable="${attr}"`)) {
        log('Processing', `${attr} já existe no slide ${slideIndex}`);
        return;
      }

      // Estratégia 1: Busca exata >texto<
      const searchPattern = `>${searchText}<`;
      let idx = result.indexOf(searchPattern);
      if (idx !== -1) {
        const before = result.slice(0, idx + 1);
        const after = result.slice(idx + 1 + searchText.length);
        result = `${before}<span id="${id}" data-editable="${attr}" contenteditable="false">${searchText}</span>${after}`;
        log('Processing', `✅ Injetado ${attr} (exato) no slide ${slideIndex}`);
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
        log('Processing', `✅ Injetado ${attr} (regex) no slide ${slideIndex}`);
        return;
      }

      // Estratégia 3: Busca flexível
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
        log('Processing', `✅ Injetado ${attr} (flex) no slide ${slideIndex}`);
        return;
      }

      // Estratégia 4 (arroba com/sem @)
      if (attr === 'arroba') {
        if (!searchText.startsWith('@')) {
          const withAt = `@${searchText}`;
          const atPattern = `>${withAt}<`;
          const atIdx = result.indexOf(atPattern);
          if (atIdx !== -1) {
            const before = result.slice(0, atIdx + 1);
            const after = result.slice(atIdx + 1 + withAt.length);
            result = `${before}<span id="${id}" data-editable="${attr}" contenteditable="false">${withAt}</span>${after}`;
            log('Processing', `✅ Injetado ${attr} (com @) no slide ${slideIndex}`);
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
            log('Processing', `✅ Injetado ${attr} (sem @) no slide ${slideIndex}`);
            return;
          }
        }
      }

      // Estratégia 5: Busca em tags span/p/div
      const tagRe = new RegExp(`(<(?:span|p|div)[^>]*>)\\s*(${escaped})\\s*(<\\/(?:span|p|div)>)`, 'i');
      const tagMatch = result.match(tagRe);
      if (tagMatch && tagMatch.index !== undefined) {
        const openTag = tagMatch[1];
        const matchedText = tagMatch[2];
        const closeTag = tagMatch[3];
        const fullMatchLen = tagMatch[0].length;
        const before = result.slice(0, tagMatch.index);
        const after = result.slice(tagMatch.index + fullMatchLen);
        const newOpenTag = openTag.replace('>', ` id="${id}" data-editable="${attr}" contenteditable="false">`);
        result = `${before}${newOpenTag}${matchedText}${closeTag}${after}`;
        log('Processing', `✅ Injetado ${attr} (na tag) no slide ${slideIndex}`);
        return;
      }

      log('Processing', `⚠️ Não encontrou ${attr} no slide ${slideIndex}: "${searchText}"`);
    };

    // Injeta na ordem correta (elementos mais específicos primeiro)
    if (arrobaText) addEditableSpan(arrobaText, `slide-${slideIndex}-arroba`, 'arroba');
    if (nomeText) addEditableSpan(nomeText, `slide-${slideIndex}-nome`, 'nome');
    if (subtitleText) addEditableSpan(subtitleText, `slide-${slideIndex}-subtitle`, 'subtitle');
    if (titleText) addEditableSpan(titleText, `slide-${slideIndex}-title`, 'title');

    // Adiciona estilos para elementos editáveis
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
      img[data-editable], video[data-editable]{display:block!important}
      html, body { pointer-events: auto !important; margin:0!important;padding:0!important;overflow:hidden!important;}
    `
    );

    // Marca body como background editável
    result = result.replace(
      /<body([^>]*)>/i,
      (m, attrs) =>
        /id=/.test(attrs)
          ? m
          : `<body${attrs} id="slide-${slideIndex}-background" data-editable="background">`
    );

    return result;
  }, [data]);

  // Processa os slides quando carregam
  useEffect(() => {
    log('Processing', 'Iniciando processamento de slides', { count: slides.length });
    const processed = slides.map((s, i) => injectEditableIds(s, i));
    setProcessedSlides(processed);
    log('Processing', 'Slides processados', { count: processed.length });
  }, [slides, injectEditableIds]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const toast: ToastMessage = { id: `toast-${Date.now()}`, message, type };
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Navegação entre slides
  const goToNextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
      setSelectedElement(null);
      setPropertiesPanelHeight(minPanelHeight);
    }
  }, [currentSlide, slides.length]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setSelectedElement(null);
      setPropertiesPanelHeight(minPanelHeight);
    }
  }, [currentSlide]);

  // Swipe handlers para trocar de slide
  const handleSlideTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleSlideTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleSlideTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // mínimo de pixels para considerar swipe
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe para esquerda = próximo slide
        goToNextSlide();
      } else {
        // Swipe para direita = slide anterior
        goToPreviousSlide();
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Função para extrair cores dominantes da imagem de fundo
  const extractColorsFromSlide = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Busca a imagem de fundo principal
    const bgImg = doc.querySelector('img[data-editable="image"]:not([data-protected="true"])') as HTMLImageElement ||
                  doc.querySelector('.img-crop-wrapper img:not([data-protected="true"])') as HTMLImageElement ||
                  doc.querySelector('.cv-bg-wrapper img') as HTMLImageElement;
    
    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      try {
        // Cria um canvas para analisar a imagem
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Reduz o tamanho para performance
        const sampleSize = 50;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        
        ctx.drawImage(bgImg, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;
        
        // Coleta cores com frequência
        const colorCounts: Record<string, number> = {};
        
        for (let i = 0; i < pixels.length; i += 16) { // Amostra a cada 4 pixels
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          
          // Agrupa cores similares (arredonda para múltiplos de 32)
          const rr = Math.round(r / 32) * 32;
          const gg = Math.round(g / 32) * 32;
          const bb = Math.round(b / 32) * 32;
          
          const hex = '#' + [rr, gg, bb].map(x => Math.min(255, x).toString(16).padStart(2, '0')).join('').toUpperCase();
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }
        
        // Ordena por frequência
        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([color]) => color);
        
        // Pega as cores mais frequentes + complementares
        const dominantColors = sortedColors.slice(0, 4);
        
        // Adiciona branco e preto (sempre úteis para texto)
        const finalColors = new Set<string>();
        finalColors.add('#FFFFFF');
        finalColors.add('#000000');
        
        // Adiciona cores dominantes
        dominantColors.forEach(c => finalColors.add(c));
        
        // Adiciona cores complementares (invertidas) para contraste
        dominantColors.slice(0, 2).forEach(color => {
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          const inverted = '#' + [255 - r, 255 - g, 255 - b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
          finalColors.add(inverted);
        });
        
        setExtractedColors(Array.from(finalColors).slice(0, 8));
        log('Colors', 'Cores extraídas da imagem de fundo', Array.from(finalColors));
      } catch (e) {
        log('Colors', 'Erro ao extrair cores da imagem (CORS?)', e);
        // Fallback para cores padrão
        setExtractedColors(['#FFFFFF', '#000000', '#4167B2', '#FF6B6B', '#4ECDC4', '#FFE66D', '#F4F4F4', '#333333']);
      }
    } else {
      // Fallback: extrai cores dos elementos existentes
      const colors = new Set<string>();
      colors.add('#FFFFFF');
      colors.add('#000000');
      colors.add('#4167B2');
      
      const textElements = doc.querySelectorAll('[data-editable]');
      textElements.forEach(el => {
        const style = (iframe.contentWindow as any)?.getComputedStyle(el);
        if (style) {
          const color = style.color;
          const bgColor = style.backgroundColor;
          if (color && color !== 'rgba(0, 0, 0, 0)') {
            colors.add(rgbToHex(color));
          }
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
            colors.add(rgbToHex(bgColor));
          }
        }
      });
      
      setExtractedColors(Array.from(colors).slice(0, 8));
      log('Colors', 'Cores extraídas dos elementos', Array.from(colors));
    }
  }, []);

  // Converte rgb para hex
  const rgbToHex = (rgb: string): string => {
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return rgb;
    const [r, g, b] = match.map(Number);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  // Detecta os estilos atuais do elemento selecionado
  const detectCurrentElementStyles = useCallback(() => {
    if (!selectedElement?.elementId) return;
    
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const el = doc.querySelector(`#${selectedElement.elementId}`) || 
               doc.querySelector(`[data-editable="${selectedElement.element}"].selected`);
    
    if (!el) return;
    
    const computedStyle = iframe.contentWindow?.getComputedStyle(el as Element);
    if (!computedStyle) return;
    
    const color = rgbToHex(computedStyle.color || '#FFFFFF');
    const fontSize = computedStyle.fontSize || '18px';
    const fontWeight = computedStyle.fontWeight || '400';
    const textAlign = computedStyle.textAlign || 'left';
    
    const newStyles = { color, fontSize, fontWeight, textAlign };
    setCurrentElementStyles(newStyles);
    
    // Também atualiza o editedContent se não estiver definido
    setEditedContent(prev => {
      const updates: Record<string, string> = {};
      if (!prev[`${currentSlide}-${selectedElement.element}-color`]) {
        updates[`${currentSlide}-${selectedElement.element}-color`] = color;
      }
      if (!prev[`${currentSlide}-${selectedElement.element}-fontSize`]) {
        updates[`${currentSlide}-${selectedElement.element}-fontSize`] = fontSize;
      }
      if (!prev[`${currentSlide}-${selectedElement.element}-fontWeight`]) {
        updates[`${currentSlide}-${selectedElement.element}-fontWeight`] = fontWeight;
      }
      if (!prev[`${currentSlide}-${selectedElement.element}-textAlign`]) {
        updates[`${currentSlide}-${selectedElement.element}-textAlign`] = textAlign;
      }
      return { ...prev, ...updates };
    });
    
    log('Styles', 'Estilos detectados do elemento', newStyles);
  }, [selectedElement, currentSlide]);

  // Detecta estilos quando elemento é selecionado
  useEffect(() => {
    if (selectedElement) {
      detectCurrentElementStyles();
    }
  }, [selectedElement, detectCurrentElementStyles]);

  // Aplica mudanças no iframe
  const applyStyleToElement = useCallback((property: string, value: string) => {
    const iframe = iframeRef.current;
    if (!iframe || !selectedElement) return;
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const el = doc.querySelector(`#${selectedElement.elementId}`) || 
               doc.querySelector(`[data-editable="${selectedElement.element}"].selected`);
    
    if (!el) {
      log('ApplyStyle', 'Elemento não encontrado', selectedElement);
      return;
    }

    log('ApplyStyle', 'Aplicando estilo', { property, value, elementId: selectedElement.elementId });
    
    (el as HTMLElement).style[property as any] = value;
    
    // Salva no estado
    setEditedContent(prev => ({
      ...prev,
      [`${currentSlide}-${selectedElement.element}-${property}`]: value
    }));
  }, [selectedElement, currentSlide]);

  // Aplica mudança de imagem de fundo (não afeta avatar)
  const applyBackgroundImage = useCallback((imageUrl: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Procura APENAS a imagem de fundo principal, NÃO o avatar
    // Avatar geralmente tem classe específica ou está em container menor
    const mainImage = doc.querySelector('img[data-editable="image"]:not([data-editable="avatar"])') ||
                      doc.querySelector('.img-crop-wrapper img') ||
                      doc.querySelector('img.background-image') ||
                      doc.querySelector('img[style*="object-fit"]');
    
    // Fallback: pega a maior imagem (provavelmente o fundo)
    let targetImg = mainImage;
    if (!targetImg) {
      const allImages = Array.from(doc.querySelectorAll('img'));
      // Filtra imagens pequenas (avatares são geralmente < 200px)
      const largeImages = allImages.filter(img => {
        const rect = img.getBoundingClientRect();
        return rect.width > 200 && rect.height > 200;
      });
      if (largeImages.length > 0) {
        targetImg = largeImages[0];
      }
    }

    if (targetImg) {
      (targetImg as HTMLImageElement).src = imageUrl;
      log('ApplyBackground', 'Imagem de fundo atualizada', { imageUrl });
    } else {
      // Se não encontrou imagem, aplica no body
      const body = doc.body;
      if (body) {
        body.style.backgroundImage = `url(${imageUrl})`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        log('ApplyBackground', 'Background do body atualizado', { imageUrl });
      }
    }

    setEditedContent(prev => ({
      ...prev,
      [`${currentSlide}-background-image`]: imageUrl
    }));
  }, [currentSlide]);

  // Aplica posição da imagem - converte posições para porcentagem
  const applyImagePosition = useCallback((position: string) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Mapeia posições semânticas para porcentagens object-position
    const positionMap: Record<string, string> = {
      'top left': '0% 0%',
      'top center': '50% 0%',
      'top right': '100% 0%',
      'center left': '0% 50%',
      'center center': '50% 50%',
      'center right': '100% 50%',
      'bottom left': '0% 100%',
      'bottom center': '50% 100%',
      'bottom right': '100% 100%',
      'center': '50% 50%',
      'top': '50% 0%',
      'bottom': '50% 100%',
      'left': '0% 50%',
      'right': '100% 50%'
    };
    
    const objectPosition = positionMap[position] || position;
    
    // Busca a imagem de fundo (NÃO avatar)
    const img = doc.querySelector('img[data-editable="image"]:not([data-protected="true"])') as HTMLImageElement ||
                doc.querySelector('.img-crop-wrapper img:not([data-protected="true"])') as HTMLImageElement ||
                doc.querySelector('.cv-bg-wrapper img') as HTMLImageElement;
    
    if (img) {
      img.style.objectPosition = objectPosition;
      log('ApplyPosition', 'Posição aplicada na imagem', { position, objectPosition, imgSrc: img.src?.slice(0, 50) });
    } else {
      log('ApplyPosition', 'AVISO: Imagem de fundo não encontrada');
    }

    // Também aplica ao background do body se existir
    const body = doc.body;
    if (body) {
      body.style.backgroundPosition = objectPosition;
    }

    setEditedContent(prev => ({
      ...prev,
      [`${currentSlide}-background-position`]: position
    }));
  }, [currentSlide]);

  // Extrai cores quando o slide carrega
  useEffect(() => {
    const timer = setTimeout(() => {
      extractColorsFromSlide();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentSlide, extractColorsFromSlide]);

  // Inicializa a altura do painel
  useEffect(() => {
    setPropertiesPanelHeight(minPanelHeight);
    log('Init', 'Componente montado', { slidesCount: slides.length });
  }, [slides.length]);

  // Calcula a escala do container baseado no tamanho disponível
  useEffect(() => {
    const calculateScale = () => {
      const container = slideContainerRef.current;
      if (!container) {
        log('Scale', 'Container ref não disponível ainda');
        return;
      }
      
      // Pega dimensões disponíveis (descontando padding de 16px cada lado)
      const containerWidth = container.clientWidth - 32;
      const containerHeight = container.clientHeight - 32;
      
      // Se não tem dimensões válidas, usa valores default
      if (containerWidth <= 0 || containerHeight <= 0) {
        log('Scale', 'Dimensões inválidas, usando default', { containerWidth, containerHeight });
        setContainerScale(0.25);
        return;
      }
      
      // Calcula escala para caber no container mantendo proporção
      const scaleX = containerWidth / SLIDE_WIDTH;
      const scaleY = containerHeight / SLIDE_HEIGHT;
      
      // Usa o MENOR scale para garantir que cabe completamente
      // Mínimo de 0.15, máximo de 0.45 para mobile (dá margem para pinças)
      const newScale = Math.max(0.15, Math.min(0.45, Math.min(scaleX, scaleY) * 0.90));
      
      log('Scale', 'Calculando escala', { 
        containerWidth, 
        containerHeight, 
        scaleX: scaleX.toFixed(3), 
        scaleY: scaleY.toFixed(3), 
        finalScale: newScale.toFixed(3) 
      });
      
      setContainerScale(newScale);
    };

    // Aguarda um pouco para o layout estar pronto
    const timer = setTimeout(calculateScale, 100);
    
    window.addEventListener('resize', calculateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateScale);
    };
  }, []);

  // Injeta estilos e handlers no iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      log('IframeWiring', 'Iframe ref não encontrado');
      return;
    }

    const handleLoad = () => {
      log('IframeWiring', 'Iframe carregado, configurando handlers');
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        log('IframeWiring', 'ERRO: Não foi possível acessar o documento do iframe');
        return;
      }

      // Injeta estilos de seleção - usando cores do site (#4167B2)
      const existingStyle = doc.getElementById('mobile-editor-styles');
      if (existingStyle) existingStyle.remove();
      
      const style = doc.createElement('style');
      style.id = 'mobile-editor-styles';
      style.textContent = `
        * { 
          user-select: none !important; 
          -webkit-user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        [data-editable] { 
          cursor: pointer !important; 
          transition: outline 0.2s ease, transform 0.1s ease;
          -webkit-tap-highlight-color: rgba(65, 103, 178, 0.3);
        }
        [data-editable].selected { 
          outline: 4px solid #4167B2 !important; 
          outline-offset: 6px;
          position: relative;
          z-index: 100;
        }
        [data-editable]:active:not(.selected) { 
          outline: 3px solid rgba(65, 103, 178, 0.6) !important; 
          outline-offset: 4px;
          transform: scale(0.98);
        }
        [data-editable][contenteditable="true"] {
          outline: 4px solid #4167B2 !important;
          outline-offset: 6px;
          user-select: text !important;
          -webkit-user-select: text !important;
          background: rgba(65, 103, 178, 0.1);
        }
        html, body { 
          overflow: hidden !important; 
          touch-action: manipulation;
          -webkit-overflow-scrolling: touch;
        }
        /* Garante que elementos internos tenham pointer-events */
        [data-editable]:not(body) {
          pointer-events: auto !important;
          z-index: 10;
        }
        /* Estilo para pinças de resize - posicionadas FORA do container */
        .cv-resize-handle {
          position: absolute;
          left: 0;
          right: 0;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          cursor: ns-resize;
          touch-action: none;
          pointer-events: auto;
          background: transparent;
        }
        .cv-resize-handle-bar {
          width: 60%;
          max-width: 140px;
          height: 10px;
          background: #4167B2;
          border-radius: 9999px;
          box-shadow: 0 2px 12px rgba(65, 103, 178, 0.6);
          border: 2px solid white;
        }
        .cv-resize-handle.north {
          top: -44px;
        }
        .cv-resize-handle.south {
          bottom: -44px;
        }
        /* Container selecionado com borda */
        .cv-image-container-selected {
          outline: 3px solid #4167B2 !important;
          outline-offset: -3px;
        }
      `;
      doc.head.appendChild(style);

      // ========== SISTEMA DE PINÇAS VISUAIS (como no desktop) ==========
      let activePinchers: { north: HTMLElement; south: HTMLElement; container: HTMLElement; cleanup: () => void } | null = null;

      const removePinchers = () => {
        if (activePinchers) {
          activePinchers.cleanup();
          try { activePinchers.north.remove(); } catch {}
          try { activePinchers.south.remove(); } catch {}
          activePinchers.container.classList.remove('cv-image-container-selected');
          activePinchers = null;
          log('Pinchers', 'Pinças removidas');
        }
      };

      const createPinchers = (container: HTMLElement, targetImg?: HTMLImageElement) => {
        removePinchers();
        log('Pinchers', '=== CRIANDO PINÇAS ===');
        log('Pinchers', 'Container:', { className: container.className, tagName: container.tagName, id: container.id });
        log('Pinchers', 'Imagem alvo passada:', targetImg ? targetImg.src?.slice(0, 50) : 'NENHUMA');
        
        // Garante que o container tem position relative
        const cs = doc.defaultView?.getComputedStyle(container);
        if (cs?.position === 'static') {
          container.style.position = 'relative';
        }
        
        // Garante altura em pixels
        const rect = container.getBoundingClientRect();
        log('Pinchers', 'Container rect:', { width: rect.width, height: rect.height, top: rect.top });
        const currentHeight = parseFloat(container.getAttribute('data-cv-height') || '') || rect.height;
        container.style.setProperty('height', `${Math.round(currentHeight)}px`, 'important');
        container.style.setProperty('overflow', 'visible', 'important'); // Permite que as pinças sejam visíveis
        container.setAttribute('data-cv-height', String(Math.round(currentHeight)));
        
        // Usa a imagem alvo passada, NÃO busca qualquer img no container
        // Isso evita afetar o avatar ou outras imagens
        const img = targetImg;
        if (img) {
          log('Pinchers', 'Aplicando estilos na imagem de fundo:', { src: img.src?.slice(0, 50) });
          img.style.setProperty('width', '100%', 'important');
          img.style.setProperty('height', '100%', 'important');
          img.style.setProperty('object-fit', 'cover', 'important');
        } else {
          log('Pinchers', 'AVISO: Nenhuma imagem alvo especificada!');
        }
        
        // Adiciona classe de seleção
        container.classList.add('cv-image-container-selected');
        
        // Cria pinça norte (em cima)
        const north = doc.createElement('div');
        north.className = 'cv-resize-handle north';
        const northBar = doc.createElement('div');
        northBar.className = 'cv-resize-handle-bar';
        north.appendChild(northBar);
        
        // Cria pinça sul (embaixo)
        const south = doc.createElement('div');
        south.className = 'cv-resize-handle south';
        const southBar = doc.createElement('div');
        southBar.className = 'cv-resize-handle-bar';
        south.appendChild(southBar);
        
        // Adiciona ao container
        container.appendChild(north);
        container.appendChild(south);
        
        // Estado do resize
        let resizeState: { active: boolean; startY: number; startHeight: number; direction: 'north' | 'south' } | null = null;
        
        // Handler genérico para início do resize
        const startResize = (direction: 'north' | 'south', clientY: number) => {
          const h = parseFloat(container.getAttribute('data-cv-height') || '') || container.getBoundingClientRect().height;
          resizeState = { active: true, startY: clientY, startHeight: h, direction };
          log('Resize', 'Iniciado', { direction, startHeight: h });
        };
        
        // Handlers de touch
        const onTouchStartNorth = (e: TouchEvent) => {
          e.preventDefault();
          e.stopPropagation();
          startResize('north', e.touches[0].clientY);
        };
        
        const onTouchStartSouth = (e: TouchEvent) => {
          e.preventDefault();
          e.stopPropagation();
          startResize('south', e.touches[0].clientY);
        };
        
        const onTouchMove = (e: TouchEvent) => {
          if (!resizeState?.active) return;
          e.preventDefault();
          
          const touch = e.touches[0];
          const dy = touch.clientY - resizeState.startY;
          const delta = resizeState.direction === 'north' ? -dy : dy;
          const newHeight = Math.max(120, Math.min(1200, resizeState.startHeight + delta));
          
          container.style.setProperty('height', `${Math.round(newHeight)}px`, 'important');
          container.setAttribute('data-cv-height', String(Math.round(newHeight)));
          
          // Sincroniza a imagem
          if (img) {
            (img as HTMLElement).style.setProperty('width', '100%', 'important');
            (img as HTMLElement).style.setProperty('height', '100%', 'important');
            (img as HTMLElement).style.setProperty('object-fit', 'cover', 'important');
          }
        };
        
        const onTouchEnd = () => {
          if (resizeState?.active) {
            const finalHeight = parseFloat(container.getAttribute('data-cv-height') || '');
            log('Resize', 'Finalizado', { height: finalHeight });
            setEditedContent(prev => ({
              ...prev,
              [`${currentSlide}-container-height`]: finalHeight
            }));
          }
          resizeState = null;
        };
        
        // Adiciona listeners
        north.addEventListener('touchstart', onTouchStartNorth, { passive: false });
        south.addEventListener('touchstart', onTouchStartSouth, { passive: false });
        doc.addEventListener('touchmove', onTouchMove, { passive: false });
        doc.addEventListener('touchend', onTouchEnd, { passive: false });
        
        const cleanup = () => {
          north.removeEventListener('touchstart', onTouchStartNorth);
          south.removeEventListener('touchstart', onTouchStartSouth);
          doc.removeEventListener('touchmove', onTouchMove);
          doc.removeEventListener('touchend', onTouchEnd);
        };
        
        activePinchers = { north, south, container, cleanup };
        log('Pinchers', 'Pinças criadas com sucesso');
      };
      
      // ========== SISTEMA DE DRAG DA IMAGEM (object-position) ==========
      const imgDragState = {
        active: false,
        startX: 0,
        startY: 0,
        startPosX: 50,
        startPosY: 50,
        maxOffsetX: 0,
        maxOffsetY: 0,
        left: 0,
        top: 0,
        minLeft: 0,
        minTop: 0,
        targetImg: null as HTMLImageElement | null
      };
      
      const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
      
      const computeBleed = (natW: number, natH: number, contW: number, contH: number) => {
        const imgAspect = natW / natH;
        const contAspect = contW / contH;
        let displayW: number, displayH: number;
        if (imgAspect > contAspect) {
          displayH = contH;
          displayW = contH * imgAspect;
        } else {
          displayW = contW;
          displayH = contW / imgAspect;
        }
        return { displayW, displayH };
      };
      
      const startImageDrag = (img: HTMLImageElement, clientX: number, clientY: number) => {
        const container = img.closest('.img-crop-wrapper') as HTMLElement || img.parentElement;
        if (!container) return;
        
        const contRect = container.getBoundingClientRect();
        const natW = img.naturalWidth || contRect.width;
        const natH = img.naturalHeight || contRect.height;
        
        // Garante estilos da imagem
        img.style.setProperty('width', '100%', 'important');
        img.style.setProperty('height', '100%', 'important');
        img.style.setProperty('object-fit', 'cover', 'important');
        
        const { displayW, displayH } = computeBleed(natW, natH, contRect.width, contRect.height);
        const maxOffsetX = Math.max(0, displayW - contRect.width);
        const maxOffsetY = Math.max(0, displayH - contRect.height);
        
        // Parse object-position atual
        const cs = doc.defaultView?.getComputedStyle(img);
        const toPerc = (v: string) => v?.trim().endsWith('%') ? parseFloat(v) : 50;
        const obj = (cs?.objectPosition || '50% 50%').split(/\s+/);
        const xPerc = toPerc(obj[0] || '50%');
        const yPerc = toPerc(obj[1] || '50%');
        
        // Converte porcentagem para posição em pixels
        const leftPx = -maxOffsetX * (xPerc / 100);
        const topPx = -maxOffsetY * (yPerc / 100);
        
        imgDragState.active = true;
        imgDragState.startX = clientX;
        imgDragState.startY = clientY;
        imgDragState.startPosX = xPerc;
        imgDragState.startPosY = yPerc;
        imgDragState.maxOffsetX = maxOffsetX;
        imgDragState.maxOffsetY = maxOffsetY;
        imgDragState.left = leftPx;
        imgDragState.top = topPx;
        imgDragState.minLeft = Math.min(0, contRect.width - displayW);
        imgDragState.minTop = Math.min(0, contRect.height - displayH);
        imgDragState.targetImg = img;
        
        log('ImageDrag', 'Iniciado', { xPerc, yPerc, maxOffsetX, maxOffsetY, displayW, displayH });
      };
      
      const moveImageDrag = (clientX: number, clientY: number) => {
        if (!imgDragState.active || !imgDragState.targetImg) return;
        
        const dx = clientX - imgDragState.startX;
        const dy = clientY - imgDragState.startY;
        
        const nextLeft = clamp(imgDragState.left + dx, imgDragState.minLeft, 0);
        const nextTop = clamp(imgDragState.top + dy, imgDragState.minTop, 0);
        
        const xPerc = imgDragState.maxOffsetX ? (-nextLeft / imgDragState.maxOffsetX) * 100 : 50;
        const yPerc = imgDragState.maxOffsetY ? (-nextTop / imgDragState.maxOffsetY) * 100 : 50;
        
        imgDragState.targetImg.style.objectPosition = `${xPerc}% ${yPerc}%`;
      };
      
      const endImageDrag = () => {
        if (imgDragState.active && imgDragState.targetImg) {
          const cs = doc.defaultView?.getComputedStyle(imgDragState.targetImg);
          const finalPos = cs?.objectPosition || '50% 50%';
          log('ImageDrag', 'Finalizado', { objectPosition: finalPos });
          setEditedContent(prev => ({
            ...prev,
            [`${currentSlide}-image-objectPosition`]: finalPos
          }));
        }
        imgDragState.active = false;
        imgDragState.targetImg = null;
      };
      
      // ========== FIM DOS SISTEMAS ==========

      // Encontra todos os elementos editáveis
      const editables = doc.querySelectorAll('[data-editable]');
      log('IframeWiring', `Encontrados ${editables.length} elementos editáveis`);

      // Lista os elementos para debug
      editables.forEach((el: Element, index: number) => {
        const type = el.getAttribute('data-editable');
        const id = el.id || `elem-${index}`;
        log('IframeWiring', `  [${index}] ${type} - id: ${id}`);
      });

      // Handler unificado para seleção de elementos
      const handleElementSelect = (el: Element, e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const editableType = el.getAttribute('data-editable') as ElementType | null;
        const elementId = el.id || `element-${Date.now()}`;
        
        log('Selection', 'Elemento tocado', { 
          type: editableType, 
          id: elementId,
          tagName: el.tagName,
          className: el.className
        });
        
        // Remove seleção anterior e pinças
        doc.querySelectorAll('[data-editable].selected').forEach(sel => {
          sel.classList.remove('selected');
          (sel as HTMLElement).setAttribute('contenteditable', 'false');
        });
        removePinchers();

        // Adiciona seleção ao elemento atual
        el.classList.add('selected');
        log('Selection', 'Classe .selected adicionada');

        // Determina se é texto
        const isText = editableType && ['title', 'subtitle', 'nome', 'arroba'].includes(editableType);
        
        // Avatar = só permite upload, sem pinças
        const isAvatar = editableType === 'avatar' || 
                        (el as HTMLElement).getAttribute('data-protected') === 'true' ||
                        el.className?.toLowerCase().includes('avatar');
        
        // Imagem de fundo = é uma IMG que NÃO é avatar/protegida
        // Nota: data-editable="image" não está no tipo ElementType, mas está no DOM
        const dataEditableValue = (el as HTMLElement).getAttribute('data-editable');
        const isBackgroundImage = (dataEditableValue === 'image' && !isAvatar) || 
                                  (el.tagName === 'IMG' && !isAvatar && (el as HTMLElement).getAttribute('data-protected') !== 'true');
        
        // Background do body = procura a imagem de fundo dentro
        const isBodyBackground = editableType === 'background';
        
        log('Selection', 'Tipo detectado:', { isText, isAvatar, isBackgroundImage, isBodyBackground, editableType, dataEditableValue, tagName: el.tagName });
        
        if (isText) {
          log('Selection', 'Elemento de texto - habilitando edição inline');
          (el as HTMLElement).setAttribute('contenteditable', 'true');
          (el as HTMLElement).focus();
          
          // Move o cursor para o FINAL do texto
          const range = doc.createRange();
          const selection = doc.defaultView?.getSelection();
          if (selection && el.childNodes.length > 0) {
            range.selectNodeContents(el);
            range.collapse(false); // false = colapsa no final
            selection.removeAllRanges();
            selection.addRange(range);
            log('Selection', 'Cursor movido para o final do texto');
          }
          
          setIsTextEditing(true);
          setPropertiesPanelHeight(maxPanelHeight);
        } else if (isAvatar) {
          // Avatar - só abre painel para upload, sem pinças
          log('Selection', 'Avatar selecionado - apenas upload disponível');
          setIsTextEditing(false);
          setPropertiesPanelHeight(maxPanelHeight);
          // Não cria pinças para avatar
        } else if (isBackgroundImage || isBodyBackground) {
          log('Selection', '=== IMAGEM DE FUNDO SELECIONADA - BUSCANDO CONTAINER ===');
          setIsTextEditing(false);
          setPropertiesPanelHeight(maxPanelHeight);
          
          // Encontra a imagem de fundo específica
          let imageContainer: HTMLElement | null = null;
          let targetImg: HTMLImageElement | null = null;
          
          if (isBackgroundImage && el.tagName === 'IMG') {
            // Clicou diretamente na imagem de fundo
            targetImg = el as HTMLImageElement;
          } else if (isBodyBackground) {
            // Clicou no background do body - procura a imagem de fundo
            log('Selection', 'Background do body clicado - procurando imagem de fundo');
            
            // Busca imagem com data-editable="image" que NÃO seja avatar/protegida
            targetImg = doc.querySelector('img[data-editable="image"]:not([data-protected="true"])') as HTMLImageElement ||
                       doc.querySelector('.img-crop-wrapper img:not([data-protected="true"])') as HTMLImageElement;
            
            // Se não encontrou, busca a maior imagem no documento (excluindo avatares)
            if (!targetImg) {
              const allImgs = Array.from(doc.querySelectorAll('img:not([data-protected="true"]):not([data-editable="avatar"])'));
              let largestImg: HTMLImageElement | null = null;
              let largestArea = 0;
              
              for (const img of allImgs) {
                const rect = img.getBoundingClientRect();
                const area = rect.width * rect.height;
                // Ignora imagens pequenas (avatares têm menos de 150px)
                if (area > largestArea && rect.width > 150 && rect.height > 150) {
                  largestArea = area;
                  largestImg = img as HTMLImageElement;
                }
              }
              targetImg = largestImg;
            }
          }
          
          log('Selection', 'Imagem de fundo encontrada:', targetImg ? targetImg.src?.slice(0, 60) : 'NENHUMA');
          
          // Se encontrou a imagem, verifica/cria o container apropriado
          if (targetImg) {
            // Primeiro verifica se já tem um wrapper específico
            const existingWrapper = targetImg.closest('.img-crop-wrapper') as HTMLElement;
            
            if (existingWrapper) {
              // Usa o wrapper existente
              imageContainer = existingWrapper;
              log('Selection', 'Usando wrapper existente:', existingWrapper.className);
            } else {
              // Cria um wrapper específico para esta imagem
              // Isso evita afetar outros elementos como o avatar
              const wrapper = doc.createElement('div');
              wrapper.className = 'img-crop-wrapper cv-bg-wrapper';
              wrapper.style.cssText = `
                position: relative;
                width: 100%;
                height: ${targetImg.getBoundingClientRect().height}px;
                overflow: hidden;
              `;
              
              // Insere o wrapper no lugar da imagem
              targetImg.parentElement?.insertBefore(wrapper, targetImg);
              wrapper.appendChild(targetImg);
              
              imageContainer = wrapper;
              log('Selection', 'Wrapper criado para imagem de fundo');
            }
          }
          log('Selection', 'Container final para pinças:', imageContainer ? {
            tag: imageContainer.tagName,
            class: imageContainer.className,
            id: imageContainer.id
          } : 'NULO');
          
          if (imageContainer && targetImg) {
            log('Selection', '>>> CHAMANDO createPinchers com imagem específica <<<');
            createPinchers(imageContainer, targetImg);
          } else {
            log('Selection', 'ERRO: Não foi possível encontrar container ou imagem para pinças', {
              container: !!imageContainer,
              targetImg: !!targetImg
            });
          }
        } else {
          log('Selection', 'Elemento não-texto - abrindo painel');
          setIsTextEditing(false);
          setPropertiesPanelHeight(maxPanelHeight);
        }

        const newSelection: SelectedElement = {
          slideIndex: currentSlide,
          element: editableType,
          elementId
        };
        
        log('Selection', 'Atualizando estado selectedElement', newSelection);
        setSelectedElement(newSelection);
      };

      // Event delegation - usa um único listener no documento
      // e encontra o elemento [data-editable] mais específico (mais interno)
      const handleDocumentEvent = (e: Event) => {
        const target = e.target as Element;
        log('DocEvent', '=== EVENTO CAPTURADO ===', { 
          type: e.type, 
          target: target.tagName,
          targetClass: (target as HTMLElement).className 
        });
        
        // Encontra o elemento [data-editable] mais próximo do target
        // (que NÃO seja o body, se houver um mais específico)
        const editableElement = target.closest('[data-editable]');
        
        log('DocEvent', 'Elemento editável encontrado:', editableElement ? {
          tag: editableElement.tagName,
          type: editableElement.getAttribute('data-editable')
        } : 'NENHUM');
        
        if (!editableElement) {
          // Clicou fora de qualquer elemento editável
          log('Background', 'Toque fora de elementos editáveis - removendo seleção');
          doc.querySelectorAll('[data-editable].selected').forEach(sel => {
            sel.classList.remove('selected');
            (sel as HTMLElement).setAttribute('contenteditable', 'false');
          });
          removePinchers();
          setSelectedElement(null);
          setIsTextEditing(false);
          setPropertiesPanelHeight(minPanelHeight);
          return;
        }

        const editableType = editableElement.getAttribute('data-editable');
        
        // Se o elemento mais próximo é o body (background), verifica se há outro mais específico
        if (editableType === 'background') {
          log('DocEvent', 'Background detectado - buscando elemento mais específico');
          // Procura por qualquer outro elemento editável que contenha o target
          const allEditables = Array.from(doc.querySelectorAll('[data-editable]:not(body)'));
          log('DocEvent', 'Elementos editáveis encontrados:', allEditables.length);
          
          for (const el of allEditables) {
            const rect = el.getBoundingClientRect();
            const touch = e instanceof TouchEvent ? e.changedTouches[0] : e as MouseEvent;
            const x = touch.clientX;
            const y = touch.clientY;
            
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
              log('Selection', 'Encontrado elemento mais específico que background', {
                type: el.getAttribute('data-editable'),
                id: el.id
              });
              handleElementSelect(el, e);
              return;
            }
          }
          
          // Se não encontrou elemento mais específico, é de fato o background
          log('DocEvent', 'Nenhum elemento mais específico - tratando como background');
        }

        // Usa o elemento encontrado
        handleElementSelect(editableElement, e);
      };

      // Adiciona listeners no documento
      doc.addEventListener('touchend', handleDocumentEvent, { passive: false, capture: true });
      doc.addEventListener('click', handleDocumentEvent, { capture: true });

      // ========== HANDLERS DE TOUCH PARA ARRASTAR IMAGEM DE FUNDO ==========
      // Usa touchstart para detectar quando o usuário quer arrastar a imagem
      const onDocTouchStart = (e: TouchEvent) => {
        const target = e.target as Element;
        
        // Ignora se tocar nas pinças (elas têm seu próprio handler de resize)
        if (target.closest('.cv-resize-handle')) {
          log('TouchStart', 'Toque nas pinças - ignorando para drag');
          return;
        }
        
        // Procura imagem de fundo (NÃO avatar, NÃO protegida)
        let img: HTMLImageElement | null = target.closest('img:not([data-protected="true"]):not([data-editable="avatar"])') as HTMLImageElement;
        
        // Se não encontrou diretamente, busca a imagem de fundo principal
        if (!img) {
          img = doc.querySelector('img[data-editable="image"]:not([data-protected="true"])') as HTMLImageElement ||
               doc.querySelector('.img-crop-wrapper img:not([data-protected="true"])') as HTMLImageElement;
        }
        
        // Ignora se é avatar/protegido
        if (img && (img.getAttribute('data-protected') === 'true' || 
                   img.getAttribute('data-editable') === 'avatar' ||
                   img.className?.toLowerCase().includes('avatar'))) {
          log('TouchStart', 'Imagem é avatar/protegida - ignorando drag');
          return;
        }
        
        log('TouchStart', 'Imagem de fundo para drag:', img ? 'encontrada' : 'não encontrada');
        
        if (!img) return;
        
        // Verifica se tocou dentro da área da imagem
        const imgRect = img.getBoundingClientRect();
        const touch = e.touches[0];
        
        const inBounds = touch.clientX >= imgRect.left && touch.clientX <= imgRect.right &&
            touch.clientY >= imgRect.top && touch.clientY <= imgRect.bottom;
        
        log('TouchStart', 'Dentro da imagem?', inBounds);
        log('TouchStart', 'activePinchers existe?', !!activePinchers);
        
        if (inBounds && activePinchers) {
          log('TouchStart', '>>> INICIANDO DRAG DA IMAGEM DE FUNDO <<<');
          e.preventDefault();
          startImageDrag(img, touch.clientX, touch.clientY);
        }
      };
      
      const onDocTouchMove = (e: TouchEvent) => {
        if (imgDragState.active) {
          e.preventDefault();
          const touch = e.touches[0];
          moveImageDrag(touch.clientX, touch.clientY);
        }
      };
      
      const onDocTouchEnd = () => {
        if (imgDragState.active) {
          endImageDrag();
        }
      };
      
      doc.addEventListener('touchstart', onDocTouchStart, { passive: false });
      doc.addEventListener('touchmove', onDocTouchMove, { passive: false });
      doc.addEventListener('touchend', onDocTouchEnd, { passive: false });
      
      // ========== FIM DOS HANDLERS DE TOUCH ==========
      // ========== FIM DOS HANDLERS DE DRAG/PINCH ==========

      // Blur handler para textos editáveis
      doc.addEventListener('blur', (e) => {
        const target = e.target as Element;
        if (target.hasAttribute?.('data-editable')) {
          const editableType = target.getAttribute('data-editable') as ElementType | null;
          if (editableType && ['title', 'subtitle', 'nome', 'arroba'].includes(editableType)) {
            log('Blur', 'Texto perdeu foco', { type: editableType });
            (target as HTMLElement).setAttribute('contenteditable', 'false');
            setIsTextEditing(false);
            
            // Salva o conteúdo editado
            const newValue = (target as HTMLElement).textContent || '';
            setEditedContent(prev => ({
              ...prev,
              [`${currentSlide}-${editableType}`]: newValue
            }));
          }
        }
      }, true);

      log('IframeWiring', 'Configuração completa!');
    };

    // Aguarda o iframe carregar
    iframe.addEventListener('load', handleLoad);
    
    // Se o iframe já está carregado, executa agora
    if (iframe.contentDocument?.readyState === 'complete') {
      log('IframeWiring', 'Iframe já carregado, executando handleLoad');
      handleLoad();
    }

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [currentSlide, minPanelHeight, maxPanelHeight]);

  // Touch handlers para arrastar o painel
  const handlePanelTouchStart = (e: React.TouchEvent) => {
    setIsDraggingPanel(true);
    touchStartY.current = e.touches[0].clientY;
    initialPanelHeight.current = propertiesPanelHeight;
  };

  const handlePanelTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingPanel) return;
    const deltaY = touchStartY.current - e.touches[0].clientY;
    const newHeight = Math.min(maxPanelHeight, Math.max(minPanelHeight, initialPanelHeight.current + deltaY));
    setPropertiesPanelHeight(newHeight);
  };

  const handlePanelTouchEnd = () => {
    setIsDraggingPanel(false);
    // Snap para posição mais próxima
    if (propertiesPanelHeight < (minPanelHeight + maxPanelHeight) / 2) {
      setPropertiesPanelHeight(minPanelHeight);
    } else {
      setPropertiesPanelHeight(maxPanelHeight);
    }
  };

  // Handlers de ações
  const handleDownload = async () => {
    setShowMenu(false);
    if (onDownload) {
      try {
        await onDownload();
        addToast('Slides baixados com sucesso!', 'success');
      } catch (error) {
        addToast('Erro ao baixar slides', 'error');
      }
    }
  };

  const handleSave = async () => {
    setShowMenu(false);
    if (onSave) {
      try {
        await onSave();
        addToast('Alterações salvas!', 'success');
      } catch (error) {
        addToast('Erro ao salvar', 'error');
      }
    }
  };

  // Renderiza slide atual (usa slides processados)
  const currentSlideHtml = processedSlides[currentSlide] || slides[currentSlide] || '';

  return (
    <div className="fixed inset-0 bg-light flex flex-col z-[1000]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-light shadow-sm">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-lg hover:bg-light transition-colors"
        >
          <X className="w-5 h-5 text-gray-dark" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-dark font-medium">
            Slide {currentSlide + 1} de {slides.length}
          </span>
          {hasUnsavedChanges && (
            <span className="w-2 h-2 bg-blue rounded-full" />
          )}
        </div>

        <button
          onClick={() => setShowMenu(true)}
          className="p-2 -mr-2 rounded-lg hover:bg-light transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-dark" />
        </button>
      </div>

      {/* Área do slide com swipe */}
      <div 
        ref={slideContainerRef}
        className="flex-1 flex items-center justify-center p-2 overflow-visible relative bg-light"
        onTouchStart={handleSlideTouchStart}
        onTouchMove={handleSlideTouchMove}
        onTouchEnd={handleSlideTouchEnd}
      >
        {/* Container do iframe - wrapper que define tamanho escalado */}
        <div 
          className="relative bg-white rounded-xl shadow-2xl"
          style={{
            width: Math.floor(SLIDE_WIDTH * containerScale),
            height: Math.floor(SLIDE_HEIGHT * containerScale),
            overflow: 'visible', // Permite que pinças apareçam fora
          }}
        >
          {/* Iframe renderizado em tamanho original e escalado para caber */}
          <iframe
            ref={iframeRef}
            srcDoc={currentSlideHtml}
            className="border-0 absolute top-0 left-0"
            style={{
              width: SLIDE_WIDTH,
              height: SLIDE_HEIGHT,
              transform: `scale(${containerScale})`,
              transformOrigin: 'top left',
              pointerEvents: 'auto'
            }}
            title={`Slide ${currentSlide + 1}`}
          />
        </div>
      </div>

      {/* Indicadores de slide */}
      <div className="flex justify-center gap-1.5 py-2 bg-white">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentSlide(idx);
              setSelectedElement(null);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentSlide ? 'bg-blue w-6' : 'bg-gray-light'
            }`}
          />
        ))}
      </div>

      {/* Painel de propriedades (arrastável) */}
      <motion.div
        ref={panelRef}
        className="bg-white rounded-t-2xl border-t border-gray-light shadow-card"
        style={{ height: propertiesPanelHeight }}
        animate={{ height: propertiesPanelHeight }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Handle de arrastar */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handlePanelTouchStart}
          onTouchMove={handlePanelTouchMove}
          onTouchEnd={handlePanelTouchEnd}
        >
          <div className="w-10 h-1 bg-gray-light rounded-full" />
        </div>

        {/* Conteúdo do painel */}
        {propertiesPanelHeight > minPanelHeight + 20 && selectedElement && (
          <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: propertiesPanelHeight - 50 }}>
            <h3 className="text-dark font-medium mb-3 flex items-center gap-2">
              {selectedElement.element === 'background' && <ImageIcon className="w-4 h-4" />}
              {selectedElement.element === 'title' && <Type className="w-4 h-4" />}
              {selectedElement.element === 'subtitle' && <Type className="w-4 h-4" />}
              {selectedElement.element === 'nome' && <Type className="w-4 h-4" />}
              {selectedElement.element === 'arroba' && <Type className="w-4 h-4" />}
              <span className="capitalize">
                {selectedElement.element === 'background' ? 'Imagem de Fundo' : 
                 selectedElement.element === 'title' ? 'Título' :
                 selectedElement.element === 'subtitle' ? 'Subtítulo' :
                 selectedElement.element === 'nome' ? 'Nome' :
                 selectedElement.element === 'arroba' ? 'Arroba' :
                 selectedElement.element}
              </span>
            </h3>

            {/* Propriedades para imagem/background */}
            {selectedElement.element === 'background' && (
              <div className="space-y-4">
                {/* Imagens disponíveis */}
                {(() => {
                  const slideData = (data as any).conteudos?.[currentSlide];
                  const images: { url: string; label: string }[] = [];
                  
                  if (slideData?.imagem_fundo) {
                    images.push({ url: slideData.imagem_fundo, label: 'Img 1' });
                  }
                  if (slideData?.imagem_fundo2) {
                    images.push({ url: slideData.imagem_fundo2, label: 'Img 2' });
                  }
                  if (slideData?.imagem_fundo3) {
                    images.push({ url: slideData.imagem_fundo3, label: 'Img 3' });
                  }

                  if (images.length > 0) {
                    return (
                      <div>
                        <label className="text-gray text-sm mb-2 block">Escolher imagem</label>
                        <div className="grid grid-cols-3 gap-2">
                          {images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => applyBackgroundImage(img.url)}
                              className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-light hover:border-blue active:scale-95 transition-all"
                            >
                              <img 
                                src={img.url} 
                                alt={img.label}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 text-white text-xs text-center">
                                {img.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Upload de imagem */}
                <div>
                  <label className="text-gray text-sm mb-2 block">Enviar nova imagem</label>
                  <button 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            applyBackgroundImage(dataUrl);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-light hover:bg-blue-light border-2 border-dashed border-gray-light hover:border-blue rounded-xl text-gray-dark text-sm transition-all"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>Escolher arquivo</span>
                  </button>
                </div>

                {/* Ajuste de posição - botões rápidos */}
                <div>
                  <label className="text-gray text-sm mb-2 block">Posição rápida</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Topo', value: 'center top' },
                      { label: 'Centro', value: 'center center' },
                      { label: 'Base', value: 'center bottom' }
                    ].map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => applyImagePosition(pos.value)}
                        className={`py-2 px-3 bg-light hover:bg-blue-light active:bg-blue active:text-white rounded-lg text-dark text-sm transition-all border border-gray-light ${
                          editedContent[`${currentSlide}-background-position`] === pos.value ? 'bg-blue text-white' : ''
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instruções de gestos - como no desktop */}
                <div className="bg-blue-light/50 rounded-xl p-4 space-y-3">
                  <p className="text-dark text-sm font-medium">📱 Ajuste direto no slide:</p>
                  <div className="space-y-2 text-sm text-gray-dark">
                    <div className="flex items-start gap-2">
                      <span className="text-blue">☝️</span>
                      <span><strong>1 dedo:</strong> Arraste na imagem para reposicionar</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue">✌️</span>
                      <span><strong>2 dedos:</strong> Pinça para aumentar/diminuir o container</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray mt-2">
                    💡 Funciona igual ao desktop - toque e arraste diretamente na imagem acima!
                  </p>
                </div>

                {/* Botão para resetar posição */}
                <button
                  onClick={() => {
                    // Reseta object-position para centro
                    const iframe = iframeRef.current;
                    if (!iframe) return;
                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (!doc) return;
                    
                    // Busca a imagem de fundo (NÃO avatar)
                    const img = doc.querySelector('img[data-editable="image"]:not([data-protected="true"])') ||
                                doc.querySelector('.img-crop-wrapper img:not([data-protected="true"])') ||
                                doc.querySelector('.cv-bg-wrapper img');
                    if (img) {
                      (img as HTMLElement).style.objectPosition = '50% 50%';
                      log('Reset', 'Posição resetada para centro');
                    }
                    
                    applyImagePosition('center center');
                  }}
                  className="w-full py-3 text-sm text-blue hover:bg-blue-light rounded-xl transition-colors border border-blue/30"
                >
                  Resetar posição da imagem
                </button>
              </div>
            )}

            {/* Propriedades para texto */}
            {selectedElement.element && ['title', 'subtitle', 'nome', 'arroba'].includes(selectedElement.element) && (
              <div className="space-y-4">
                <p className="text-gray text-sm bg-light p-3 rounded-lg">
                  💡 Toque no texto no slide para editar diretamente
                </p>

                {/* Cor do texto - usando cores extraídas da imagem de fundo */}
                <div>
                  <label className="text-gray text-sm mb-2 block">Cor do texto</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editedContent[`${currentSlide}-${selectedElement.element}-color`] || currentElementStyles.color}
                      onChange={(e) => applyStyleToElement('color', e.target.value)}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-gray-light"
                    />
                    <div className="flex-1 grid grid-cols-6 gap-1">
                      {(extractedColors.length > 0 ? extractedColors : ['#FFFFFF', '#000000', '#4167B2', '#FF6B6B', '#4ECDC4', '#FFE66D']).map(color => {
                        const currentColor = editedContent[`${currentSlide}-${selectedElement.element}-color`] || currentElementStyles.color;
                        const isSelected = currentColor.toUpperCase() === color.toUpperCase();
                        return (
                          <button
                            key={color}
                            onClick={() => applyStyleToElement('color', color)}
                            className={`w-full aspect-square rounded-lg border-2 hover:scale-110 transition-transform ${
                              isSelected
                                ? 'border-blue ring-2 ring-blue/30' 
                                : 'border-gray-light'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tamanho da fonte - com custom */}
                <div>
                  <label className="text-gray text-sm mb-2 block">Tamanho da fonte</label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {[
                      { label: 'P', value: '14px' },
                      { label: 'M', value: '18px' },
                      { label: 'G', value: '24px' },
                      { label: 'GG', value: '32px' },
                      { label: 'XG', value: '48px' }
                    ].map((size) => {
                      const currentSize = editedContent[`${currentSlide}-${selectedElement.element}-fontSize`] || currentElementStyles.fontSize;
                      // Compara valores numéricos (ignora 'px')
                      const currentNum = parseInt(currentSize);
                      const sizeNum = parseInt(size.value);
                      const isSelected = currentNum === sizeNum;
                      return (
                        <button
                          key={size.value}
                          onClick={() => applyStyleToElement('fontSize', size.value)}
                          className={`py-2 px-2 rounded-lg text-sm transition-all border ${
                            isSelected
                              ? 'bg-blue text-white border-blue' 
                              : 'bg-light hover:bg-blue-light text-dark border-gray-light'
                          }`}
                        >
                          {size.label}
                        </button>
                      );
                    })}
                  </div>
                  {/* Custom size input */}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Custom (px)"
                      value={customFontSize}
                      onChange={(e) => setCustomFontSize(e.target.value)}
                      className="flex-1 px-3 py-2 bg-light border border-gray-light rounded-lg text-sm text-dark"
                    />
                    <button
                      onClick={() => {
                        if (customFontSize) {
                          applyStyleToElement('fontSize', `${customFontSize}px`);
                        }
                      }}
                      className="px-4 py-2 bg-blue text-white rounded-lg text-sm hover:bg-blue-dark transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>

                {/* Peso da fonte */}
                <div>
                  <label className="text-gray text-sm mb-2 block">Peso</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Normal', value: '400' },
                      { label: 'Médio', value: '600' },
                      { label: 'Negrito', value: '700' }
                    ].map((weight) => {
                      const currentWeight = editedContent[`${currentSlide}-${selectedElement.element}-fontWeight`] || currentElementStyles.fontWeight;
                      // Normaliza peso (700, bold, etc.)
                      const normalizedCurrent = String(currentWeight).replace('bold', '700').replace('normal', '400');
                      const isSelected = normalizedCurrent === weight.value || 
                                        (parseInt(normalizedCurrent) >= 600 && weight.value === '700') ||
                                        (parseInt(normalizedCurrent) >= 500 && parseInt(normalizedCurrent) < 600 && weight.value === '600');
                      return (
                        <button
                          key={weight.value}
                          onClick={() => applyStyleToElement('fontWeight', weight.value)}
                          className={`py-2 px-3 rounded-lg text-sm transition-all border ${
                            isSelected
                              ? 'bg-blue text-white border-blue' 
                              : 'bg-light hover:bg-blue-light text-dark border-gray-light'
                          }`}
                          style={{ fontWeight: weight.value }}
                        >
                          {weight.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Alinhamento */}
                <div>
                  <label className="text-gray text-sm mb-2 block">Alinhamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '⬅️', value: 'left', title: 'Esquerda' },
                      { label: '↔️', value: 'center', title: 'Centro' },
                      { label: '➡️', value: 'right', title: 'Direita' }
                    ].map((align) => {
                      const currentAlign = editedContent[`${currentSlide}-${selectedElement.element}-textAlign`] || currentElementStyles.textAlign;
                      // Normaliza alinhamento (start = left, etc.)
                      const normalizedAlign = currentAlign.replace('start', 'left').replace('end', 'right');
                      const isSelected = normalizedAlign === align.value;
                      return (
                        <button
                          key={align.value}
                          onClick={() => applyStyleToElement('textAlign', align.value)}
                          className={`py-2 px-3 rounded-lg text-lg transition-all border ${
                            isSelected
                              ? 'bg-blue border-blue' 
                              : 'bg-light hover:bg-blue-light border-gray-light'
                          }`}
                          title={align.title}
                        >
                          {align.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instrução quando painel está minimizado */}
        {propertiesPanelHeight <= minPanelHeight + 20 && (
          <div className="px-4 text-center">
            <p className="text-gray text-xs">
              {selectedElement 
                ? 'Arraste para cima para ver propriedades' 
                : 'Toque em um elemento para editar'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Menu de opções (3 pontinhos) */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[1001]"
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[1002] safe-area-bottom shadow-2xl"
            >
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-light rounded-full" />
              </div>

              <div className="px-4 pb-6 space-y-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-4 w-full py-3 px-4 bg-blue hover:bg-blue-dark rounded-xl transition-colors"
                >
                  <Download className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">Baixar slides</span>
                </button>

                {onSave && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-4 w-full py-3 px-4 bg-light hover:bg-blue-light border border-gray-light rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-blue/30 border-t-blue rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5 text-blue" />
                    )}
                    <span className="text-dark font-medium">
                      {isSaving ? 'Salvando...' : 'Salvar alterações'}
                    </span>
                    {hasUnsavedChanges && (
                      <span className="ml-auto w-2 h-2 bg-blue rounded-full" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 w-full py-3 px-4 bg-light hover:bg-gray-light rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-dark" />
                  <span className="text-gray-dark font-medium">Cancelar</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default MobileCarouselViewer;
