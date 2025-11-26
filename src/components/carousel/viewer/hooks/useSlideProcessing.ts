/**
 * Hook para gerenciar processamento de slides e carregamento de estilos
 * Consolida vários useEffects relacionados do CarouselViewer
 */

import { useEffect } from 'react';
import type { CarouselData, ElementStyles } from '../../../../types/carousel';
import { applyBackgroundImageImmediate } from '../viewerUtils';

export interface UseSlideProcessingParams {
  slides: string[];
  data: CarouselData;
  uploadedImages: Record<number, string>;
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>;
  selectedImageRefs: React.MutableRefObject<Record<number, HTMLImageElement | null>>;
  
  // Setters
  setRenderedSlides: (value: string[]) => void;
  setSelectedElement: (value: { slideIndex: number; element: null }) => void;
  setFocusedSlide: (value: number) => void;
  setElementStyles: React.Dispatch<React.SetStateAction<Record<string, ElementStyles>>>;
  setOriginalStyles: React.Dispatch<React.SetStateAction<Record<string, ElementStyles>>>;
  setEditedContent: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  
  // Helpers
  stripAltGarbage: (html: string) => string;
  injectEditableIds: (html: string, slideIndex: number) => string;
}

export function useSlideProcessing({
  slides,
  data,
  uploadedImages,
  iframeRefs,
  selectedImageRefs,
  setRenderedSlides,
  setSelectedElement,
  setFocusedSlide,
  setElementStyles,
  setOriginalStyles,
  setEditedContent,
  stripAltGarbage,
  injectEditableIds,
}: UseSlideProcessingParams) {
  
  /**
   * Processa slides e aplica IDs editáveis
   */
  useEffect(() => {
    const processedSlides = slides.map((s, i) => injectEditableIds(stripAltGarbage(s), i));
    console.log('🔄 Processando slides:', {
      originalSlides: slides.length,
      processedSlides: processedSlides.length,
      firstSlideLength: processedSlides[0]?.length || 0
    });
    setRenderedSlides(processedSlides);
    
    // Limpa todas as seleções e reseta estados ao trocar de aba/slides
    setSelectedElement({ slideIndex: 0, element: null });
    setFocusedSlide(0);
    setElementStyles({});
    setOriginalStyles({});
    selectedImageRefs.current = {};
    
    // Carrega estilos salvos se existirem
    if (data.styles) {
      console.log('📐 Carregando estilos salvos:', data.styles);
      const loadedStyles: Record<string, ElementStyles> = {};
      
      Object.entries(data.styles).forEach(([slideIndex, slideStyles]: [string, any]) => {
        Object.entries(slideStyles).forEach(([elementType, styles]: [string, any]) => {
          const key = `${slideIndex}-${elementType}`;
          loadedStyles[key] = styles as ElementStyles;
        });
      });
      
      console.log('📐 Estilos convertidos para formato interno:', loadedStyles);
      setElementStyles(loadedStyles);
    }
    
    // Força re-setup dos iframes após trocar slides/carrossel
    requestAnimationFrame(() => {
      iframeRefs.current.forEach((ifr) => {
        if (ifr?.contentDocument) {
          const doc = ifr.contentDocument;
          doc.querySelectorAll('[data-editable]').forEach(el => {
            (el as HTMLElement).style.pointerEvents = 'auto';
          });
        }
      });
    });
  }, [slides, data.styles]);

  /**
   * Reseta o slide focado e LIMPA OS ESTILOS quando mudar de carrossel
   */
  useEffect(() => {
    console.log('🎯 Resetando para o primeiro slide e limpando estilos');
    setFocusedSlide(0);
    setSelectedElement({ slideIndex: 0, element: null });
    
    // CRÍTICO: Limpa os estilos editados e originais para evitar vazamento entre carrosséis
    setElementStyles({});
    setOriginalStyles({});
    setEditedContent({});
    
    console.log('✅ Estilos limpos - cada carrossel terá seus próprios estilos');
  }, [slides]);

  /**
   * Carrega os estilos salvos do carrossel quando abre no editor
   */
  useEffect(() => {
    if (!data.styles) {
      console.log('📭 Nenhum estilo salvo encontrado para este carrossel');
      return;
    }

    console.log('📥 Carregando estilos salvos do carrossel:', data.styles);
    
    const loadedStyles: Record<string, ElementStyles> = {};
    
    Object.entries(data.styles).forEach(([slideIndex, slideStyles]: [string, any]) => {
      if (slideStyles && typeof slideStyles === 'object') {
        Object.entries(slideStyles).forEach(([element, styles]: [string, any]) => {
          const key = `${slideIndex}-${element}`;
          loadedStyles[key] = styles as ElementStyles;
        });
      }
    });
    
    setElementStyles(loadedStyles);
    console.log('✅ Estilos carregados:', Object.keys(loadedStyles).length, 'elementos');
  }, [data.styles, slides]);

  /**
   * Aplica imagem placeholder quando não há imagens de fundo
   */
  useEffect(() => {
    const PLACEHOLDER_IMAGE = "https://i.imgur.com/kFVf8q3.png";
    
    const timeout = setTimeout(() => {
      iframeRefs.current.forEach((ifr, slideIndex) => {
        if (!ifr?.contentDocument) return;
        
        const conteudo = data.conteudos?.[slideIndex];
        if (!conteudo) return;
        
        const hasImages = [
          conteudo.imagem_fundo,
          conteudo.imagem_fundo2,
          conteudo.imagem_fundo3,
          uploadedImages[slideIndex]
        ].some(img => img && img !== PLACEHOLDER_IMAGE);
        
        if (!hasImages) {
          console.log(`🖼️ Aplicando placeholder no slide ${slideIndex}`);
          applyBackgroundImageImmediate(slideIndex, PLACEHOLDER_IMAGE, iframeRefs.current);
        }
      });
    }, 800);
    
    return () => clearTimeout(timeout);
  }, [slides, data, uploadedImages]);
}
