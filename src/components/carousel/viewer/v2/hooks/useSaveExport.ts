/**
 * useSaveExport - Hook para salvar e exportar carrossel
 */

import { useCallback, useEffect, useRef } from 'react';
import type { EditorState, EditorRefs } from '../types';
import type { EditorDispatch } from './useEditorState';
import { updateGeneratedContent } from '../../../../../services/generatedContent';

interface UseSaveExportProps {
  state: EditorState;
  dispatch: EditorDispatch;
  refs: EditorRefs;
  templateData: {
    activeData: any;
    templateId: string;
    isReactTemplate: boolean;
    contentId?: number;
    templateDimensions: { width: number; height: number };
  };
  onSaveSuccess?: () => void;
  addToast: (message: string, type: 'success' | 'error') => void;
  onClose: () => void;
  autoDownload: boolean;
}

export const useSaveExport = ({
  state,
  dispatch,
  refs,
  templateData,
  onSaveSuccess,
  addToast,
  onClose,
  autoDownload,
}: UseSaveExportProps) => {
  const { editedContent, elementStyles, uploadedImages, renderedSlides, focusedSlide } = state;
  const { iframeRefs, reactSlideRefs } = refs;
  const { activeData, isReactTemplate, contentId } = templateData;
  
  const autoDownloadExecutedRef = useRef(false);
  
  // === SAVE ===
  const handleSave = useCallback(async () => {
    if (!contentId) {
      addToast('ID do conteúdo não encontrado', 'error');
      return;
    }
    
    dispatch({ type: 'SET_IS_SAVING', payload: true });
    
    try {
      // Prepara os dados para salvar
      const conteudos = (activeData as any).conteudos.map((conteudo: any, index: number) => {
        // Coleta HTML formatado do iframe (bold, italic, etc)
        const ifr = iframeRefs.current[index];
        const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
        
        let savedTitle = editedContent[`${index}-title`] ?? conteudo.title;
        let savedSubtitle = editedContent[`${index}-subtitle`] ?? conteudo.subtitle;
        
        // Se existir iframe, pega o HTML formatado diretamente
        if (doc) {
          const titleEl = doc.querySelector('[data-editable="title"]');
          const subtitleEl = doc.querySelector('[data-editable="subtitle"]');
          
          if (titleEl) savedTitle = titleEl.innerHTML;
          if (subtitleEl) savedSubtitle = subtitleEl.innerHTML;
        }
        
        // Prepara estilos do slide
        const slideStyles: Record<string, any> = {};
        Object.entries(elementStyles).forEach(([key, styles]) => {
          if (key.startsWith(`${index}-`)) {
            const elementType = key.replace(`${index}-`, '');
            slideStyles[elementType] = styles;
          }
        });
        
        return {
          ...conteudo,
          title: savedTitle,
          subtitle: savedSubtitle,
          imagem_fundo: uploadedImages[index] || editedContent[`${index}-background`] || conteudo.imagem_fundo,
          slideBackground: (elementStyles[`${index}-slideBackground`] as any)?.backgroundColor || editedContent[`${index}-slideBackground`] || conteudo.slideBackground,
          styles: slideStyles,
        };
      });
      
      const dadosGerais = {
        ...(activeData as any).dados_gerais,
        nome: editedContent['0-nome'] ?? (activeData as any).dados_gerais?.nome,
        arroba: editedContent['0-arroba'] ?? (activeData as any).dados_gerais?.arroba,
        foto_perfil: editedContent['0-avatar_url'] ?? (activeData as any).dados_gerais?.foto_perfil,
      };
      
      const dataToSave = {
        conteudos,
        dados_gerais: dadosGerais,
        styles: elementStyles,
      };
      
      console.log('💾 Salvando:', dataToSave);
      
      const response = await updateGeneratedContent(contentId, {
        result: dataToSave as any,
      });
      
      if (response.success) {
        dispatch({ type: 'SET_HAS_UNSAVED_CHANGES', payload: false });
        addToast('Alterações salvas!', 'success');
        onSaveSuccess?.();
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      addToast('Erro ao salvar alterações', 'error');
    } finally {
      dispatch({ type: 'SET_IS_SAVING', payload: false });
    }
  }, [
    contentId,
    activeData,
    editedContent,
    elementStyles,
    uploadedImages,
    iframeRefs,
    dispatch,
    addToast,
    onSaveSuccess,
  ]);
  
  // === DOWNLOAD CURRENT ===
  const handleDownloadCurrent = useCallback(async () => {
    dispatch({ type: 'SET_IS_EXPORTING', payload: true });
    
    try {
      if (isReactTemplate) {
        const { downloadReactSlide } = await import('../../../../../services/carousel/reactDownload.service');
        const slideElement = reactSlideRefs.current[focusedSlide];
        
        if (!slideElement) {
          throw new Error('Elemento do slide não encontrado');
        }
        
        await downloadReactSlide(slideElement, focusedSlide + 1);
      } else {
        const { downloadSlidesAsPNG } = await import('../../../../../services/carousel/download.service');
        const currentSlide = renderedSlides[focusedSlide];
        
        if (!currentSlide) {
          throw new Error('Slide não encontrado');
        }
        
        await downloadSlidesAsPNG([currentSlide], undefined, editedContent, elementStyles);
      }
      
      addToast('Slide exportado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      addToast('Erro ao exportar slide', 'error');
    } finally {
      dispatch({ type: 'SET_IS_EXPORTING', payload: false });
    }
  }, [
    isReactTemplate,
    reactSlideRefs,
    focusedSlide,
    renderedSlides,
    editedContent,
    elementStyles,
    dispatch,
    addToast,
  ]);
  
  // === DOWNLOAD ALL ===
  const handleDownloadAll = useCallback(async () => {
    dispatch({ type: 'SET_IS_EXPORTING', payload: true });
    
    try {
      if (isReactTemplate) {
        const { downloadAllReactSlides } = await import('../../../../../services/carousel/reactDownload.service');
        
        // Filtra refs válidos
        const validRefs = reactSlideRefs.current.filter(Boolean) as HTMLDivElement[];
        
        if (validRefs.length === 0) {
          throw new Error('Nenhum slide encontrado');
        }
        
        await downloadAllReactSlides(validRefs);
      } else {
        const { downloadSlidesAsPNG } = await import('../../../../../services/carousel/download.service');
        await downloadSlidesAsPNG(renderedSlides, undefined, editedContent, elementStyles);
      }
      
      addToast('Todos os slides exportados!', 'success');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      addToast('Erro ao exportar slides', 'error');
    } finally {
      dispatch({ type: 'SET_IS_EXPORTING', payload: false });
    }
  }, [
    isReactTemplate,
    reactSlideRefs,
    renderedSlides,
    editedContent,
    elementStyles,
    dispatch,
    addToast,
  ]);
  
  // === AUTO-DOWNLOAD ===
  useEffect(() => {
    if (!autoDownload || autoDownloadExecutedRef.current || renderedSlides.length === 0) {
      return;
    }
    
    autoDownloadExecutedRef.current = true;
    
    const timer = setTimeout(async () => {
      try {
        await handleDownloadAll();
        onClose();
      } catch (error) {
        console.error('Erro no auto-download:', error);
        onClose();
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [autoDownload, renderedSlides.length, handleDownloadAll, onClose]);
  
  return {
    handleSave,
    handleDownloadCurrent,
    handleDownloadAll,
  };
};
