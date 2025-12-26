/**
 * useSlideManager - Hook para gerenciar slides (CRUD, navegação, seleção)
 */

import { useCallback } from 'react';
import type { EditorState, SelectedElement } from '../types';
import type { EditorDispatch } from './useEditorState';
import type { CarouselData } from '../../../../../types/carousel';

interface UseSlideManagerProps {
  state: EditorState;
  dispatch: EditorDispatch;
  activeData: CarouselData;
  addToast: (message: string, type: 'success' | 'error') => void;
}

export const useSlideManager = ({
  state,
  dispatch,
  activeData,
  addToast,
}: UseSlideManagerProps) => {
  const { focusedSlide, selectedElement, renderedSlides, batchMode, selectedSlides, elementStyles } =
    state;

  // Gerador de ID único
  const createId = () =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // === SETTERS ===
  const setFocusedSlide = useCallback(
    (index: number) => {
      dispatch({ type: 'SET_FOCUSED_SLIDE', payload: index });
    },
    [dispatch]
  );

  const setSelectedElement = useCallback(
    (element: SelectedElement) => {
      dispatch({ type: 'SET_SELECTED_ELEMENT', payload: element });
    },
    [dispatch]
  );

  // === NAVEGAÇÃO ===
  const handleSlideClick = useCallback(
    (index: number) => {
      setFocusedSlide(index);
      setSelectedElement({ slideIndex: index, element: null });
    },
    [setFocusedSlide, setSelectedElement]
  );

  const handlePrevSlide = useCallback(() => {
    if (focusedSlide > 0) {
      handleSlideClick(focusedSlide - 1);
    }
  }, [focusedSlide, handleSlideClick]);

  const handleNextSlide = useCallback(() => {
    if (focusedSlide < renderedSlides.length - 1) {
      handleSlideClick(focusedSlide + 1);
    }
  }, [focusedSlide, renderedSlides.length, handleSlideClick]);

  // === BATCH MODE ===
  const toggleBatchMode = useCallback(() => {
    dispatch({ type: 'SET_BATCH_MODE', payload: !batchMode });
    if (batchMode) {
      dispatch({ type: 'SET_SELECTED_SLIDES', payload: new Set() });
    }
  }, [dispatch, batchMode]);

  const toggleSlideSelection = useCallback(
    (index: number) => {
      dispatch({ type: 'TOGGLE_SLIDE_SELECTION', payload: index });
    },
    [dispatch]
  );

  // === CRUD ===
  const handleAddSlide = useCallback(() => {
    dispatch({ type: 'SET_IS_CLONE_MODAL_OPEN', payload: true });
  }, [dispatch]);

  const handleCloneSlide = useCallback(
    (sourceIndex: number) => {
      const conteudos = (activeData as any).conteudos;
      const sourceConteudo = conteudos?.[sourceIndex];
      const sourceRenderedHtml = renderedSlides[sourceIndex];

      if (!sourceConteudo) {
        addToast('Erro ao clonar slide', 'error');
        return;
      }

      // Deep copy do conteúdo
      const clonedConteudo = JSON.parse(JSON.stringify(sourceConteudo));

      // FIX: id novo e layoutIndex preservado
      clonedConteudo.id = createId();
      clonedConteudo.layoutIndex = sourceConteudo.layoutIndex ?? sourceIndex;

      // Adiciona ao array de conteúdos
      conteudos.push(clonedConteudo);

      // Atualiza rendered slides
      const newRendered = [...renderedSlides, sourceRenderedHtml];
      dispatch({ type: 'SET_RENDERED_SLIDES', payload: newRendered });

      // Copia estilos do slide fonte
      const newIndex = newRendered.length - 1;
      const newStyles = { ...elementStyles };
      Object.entries(elementStyles).forEach(([key, styles]) => {
        const [slideStr, field] = key.split('-');
        if (parseInt(slideStr, 10) === sourceIndex) {
          newStyles[`${newIndex}-${field}`] = { ...(styles as any) };
        }
      });
      dispatch({ type: 'SET_ELEMENT_STYLES', payload: newStyles });

      // Foca no novo slide
      setFocusedSlide(newIndex);
      setSelectedElement({ slideIndex: newIndex, element: null });

      dispatch({ type: 'SET_IS_CLONE_MODAL_OPEN', payload: false });
      dispatch({ type: 'SET_HAS_UNSAVED_CHANGES', payload: true });
      addToast(`Slide ${sourceIndex + 1} duplicado!`, 'success');
    },
    [activeData, renderedSlides, elementStyles, dispatch, setFocusedSlide, setSelectedElement, addToast]
  );

  const handleDeleteSlide = useCallback(
    (index: number) => {
      console.log('🗑️ handleDeleteSlide:', { index, totalSlides: renderedSlides.length });

      if (renderedSlides.length <= 1) {
        addToast('Não é possível deletar o último slide', 'error');
        return;
      }

      // Remove do activeData
      const conteudos = (activeData as any).conteudos;
      conteudos.splice(index, 1);

      // Dispatch atômico
      dispatch({ type: 'DELETE_SLIDE_FULL', payload: index });
      addToast('Slide deletado com sucesso!', 'success');
    },
    [renderedSlides.length, activeData, dispatch, addToast]
  );

  const handleBatchDelete = useCallback(() => {
    const indicesToDelete = Array.from(selectedSlides).sort((a, b) => b - a);

    if (indicesToDelete.length === 0) return;
    if (indicesToDelete.length >= renderedSlides.length) {
      addToast('Não é possível excluir todos os slides', 'error');
      return;
    }

    // Remove do activeData (em ordem decrescente)
    const conteudos = (activeData as any).conteudos;
    indicesToDelete.forEach((index) => {
      conteudos.splice(index, 1);
    });

    // Dispatch em ordem decrescente
    indicesToDelete.forEach((i) => dispatch({ type: 'DELETE_SLIDE_FULL', payload: i }));

    dispatch({ type: 'SET_SELECTED_SLIDES', payload: new Set() });
    dispatch({ type: 'SET_BATCH_MODE', payload: false });
    addToast(`${indicesToDelete.length} slide(s) excluído(s)`, 'success');
  }, [selectedSlides, renderedSlides.length, activeData, dispatch, addToast]);

  return {
    // State
    focusedSlide,
    selectedElement,
    batchMode,
    selectedSlides,

    // Setters
    setFocusedSlide,
    setSelectedElement,

    // Navigation
    handleSlideClick,
    handlePrevSlide,
    handleNextSlide,

    // Batch
    toggleBatchMode,
    toggleSlideSelection,

    // CRUD
    handleAddSlide,
    handleCloneSlide,
    handleDeleteSlide,
    handleBatchDelete,
  };
};