/**
 * useTextEditor - Hook para edição de texto inline e formatação
 */

import { useCallback } from 'react';
import type { EditorState, EditorRefs, EditableElement } from '../types';
import type { EditorDispatch } from './useEditorState';
import type { ElementStyles } from '../../../../../types/carousel';
import { DEFAULT_FLOATING_TOOLBAR } from '../types';

interface UseTextEditorProps {
  state: EditorState;
  dispatch: EditorDispatch;
  refs: EditorRefs;
  templateData: {
    templateId: string;
    isReactTemplate: boolean;
    activeData: any;
  };
}

export const useTextEditor = ({
  state,
  dispatch,
  refs,
  templateData,
}: UseTextEditorProps) => {
  const { editedContent, elementStyles, originalStyles, floatingToolbar, renderedSlides } = state;
  const { iframeRefs } = refs;
  
  // === HELPERS ===
  const getElementKey = useCallback((slideIndex: number, element: EditableElement) => {
    return `${slideIndex}-${element}`;
  }, []);
  
  // === GETTERS ===
  const getEditedValue = useCallback((slideIndex: number, field: string, defaultValue: any) => {
    const key = `${slideIndex}-${field}`;
    return editedContent[key] !== undefined ? editedContent[key] : defaultValue;
  }, [editedContent]);
  
  const getElementStyle = useCallback((slideIndex: number, element: EditableElement): ElementStyles => {
    const key = getElementKey(slideIndex, element);
    if (elementStyles[key]) return elementStyles[key];
    if (originalStyles[key]) return originalStyles[key];
    
    // Retorna estilos padrão APENAS para backgrounds (outros elementos retornam vazio)
    if (element === 'background') {
      return {
        backgroundColor: '#000000',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
      };
    }
    
    // Retorna objeto vazio para não sobrescrever estilos originais do template
    return {};
  }, [elementStyles, originalStyles, getElementKey]);
  
  // === SETTERS ===
  const updateEditedValue = useCallback((slideIndex: number, field: string, value: any) => {
    console.log('📝 updateEditedValue:', { slideIndex, field, value });
    
    // Para nome/arroba, atualiza globalmente
    if (field === 'nome' || field === 'arroba') {
      // Atualiza nos dados_gerais do activeData
      const activeData = templateData.activeData;
      if (activeData?.dados_gerais) {
        activeData.dados_gerais[field] = value;
      }
      
      // Marca como global no editedContent
      dispatch({ type: 'UPDATE_EDITED_CONTENT', payload: { key: `global-${field}`, value } });
    } else {
      dispatch({ type: 'UPDATE_EDITED_CONTENT', payload: { key: `${slideIndex}-${field}`, value } });
    }
  }, [dispatch, templateData]);
  
  const updateElementStyle = useCallback((
    slideIndex: number,
    element: EditableElement,
    prop: keyof ElementStyles,
    value: string
  ) => {
    console.log('🎨 updateElementStyle:', { slideIndex, element, prop, value });
    const key = getElementKey(slideIndex, element);
    const currentStyles = getElementStyle(slideIndex, element);
    
    dispatch({
      type: 'UPDATE_ELEMENT_STYLE',
      payload: { key, styles: { ...currentStyles, [prop]: value } }
    });
  }, [dispatch, getElementKey, getElementStyle]);
  
  // === CLEAR SELECTIONS ===
  const clearAllSelections = useCallback((preserveElement?: HTMLElement | null) => {
    iframeRefs.current.forEach((ifr) => {
      const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
      if (!doc) return;
      
      // Remove seleção de elementos editáveis
      doc.querySelectorAll('[data-editable].selected').forEach((el) => {
        if (preserveElement && el === preserveElement) return;
        el.classList.remove('selected');
        (el as HTMLElement).style.zIndex = '';
      });
      
      // Limpa outline/background
      doc.querySelectorAll('[contenteditable="true"]').forEach((el) => {
        if (preserveElement && el === preserveElement) return;
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.outlineOffset = '';
        (el as HTMLElement).style.background = '';
      });
      
      doc.querySelectorAll('.img-crop-wrapper[data-cv-selected="1"]').forEach((el) => {
        (el as HTMLElement).removeAttribute('data-cv-selected');
      });
      
      doc.querySelectorAll('.video-container.selected, .video-container[data-cv-selected="1"]').forEach((el) => {
        el.classList.remove('selected');
        (el as HTMLElement).removeAttribute('data-cv-selected');
        (el as HTMLElement).style.zIndex = '';
      });
    });
  }, [iframeRefs]);
  
  // === FLOATING TOOLBAR ===
  const showFloatingToolbar = useCallback((
    doc: Document,
    editableEl: HTMLElement,
    containerElement: HTMLElement
  ) => {
    console.log('🎯 showFloatingToolbar chamado');
    const selection = doc.getSelection();
    let savedRange: Range | null = null;
    
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
      console.log('✅ Seleção salva:', selection.toString());
    }
    
    const containerRect = containerElement.getBoundingClientRect();
    const scale = state.canvas.zoom;
    
    let top = 0;
    let left = 0;
    
    if (savedRange && selection && selection.toString().length > 0) {
      const selectionRect = savedRange.getBoundingClientRect();
      top = containerRect.top + selectionRect.top * scale - 48;
      left = containerRect.left + selectionRect.left * scale + (selectionRect.width * scale) / 2;
    } else {
      const elRect = editableEl.getBoundingClientRect();
      top = containerRect.top + elRect.top * scale - 48;
      left = containerRect.left + elRect.left * scale + (elRect.width * scale) / 2;
    }
    
    // Garante que não fique fora da tela
    if (top < 10) top = 55;
    if (left < 100) left = 100;
    if (left > window.innerWidth - 100) left = window.innerWidth - 100;
    
    console.log('📍 Mostrando toolbar em:', { top, left, visible: true });
    dispatch({
      type: 'SET_FLOATING_TOOLBAR',
      payload: {
        visible: true,
        top,
        left,
        iframeDoc: doc,
        editableEl,
        savedRange,
      }
    });
  }, [dispatch, state.canvas.zoom]);
  
  const closeFloatingToolbar = useCallback(() => {
    const { editableEl, iframeDoc } = floatingToolbar;
    
    if (iframeDoc && editableEl) {
      try {
        editableEl.removeAttribute('contenteditable');
        editableEl.style.cursor = 'pointer';
        editableEl.style.outline = '';
        editableEl.style.outlineOffset = '';
        
        iframeDoc.querySelectorAll('[data-cv-selected]').forEach((el) => {
          (el as HTMLElement).removeAttribute('data-cv-selected');
          (el as HTMLElement).style.outline = '';
        });
      } catch (e) {
        console.error('Erro ao fechar toolbar:', e);
      }
    }
    
    dispatch({ type: 'SET_FLOATING_TOOLBAR', payload: DEFAULT_FLOATING_TOOLBAR });
  }, [dispatch, floatingToolbar]);
  
  const applyTextFormat = useCallback((cmd: string) => {
    const { iframeDoc, editableEl, savedRange } = floatingToolbar;
    console.log('🎨 applyTextFormat:', { cmd, hasIframe: !!iframeDoc, hasEditable: !!editableEl, hasRange: !!savedRange });
    
    if (!iframeDoc || !editableEl) return;
    
    const selection = iframeDoc.getSelection();
    
    // Restaura seleção
    if (savedRange && selection) {
      console.log('📍 Restaurando seleção no iframe');
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
    
    // Aplica comando
    iframeDoc.execCommand(cmd, false);
    console.log('✅ Comando executado:', cmd);
    
    dispatch({ type: 'SET_HAS_UNSAVED_CHANGES', payload: true });
    
    // Atualiza seleção salva
    if (selection && selection.rangeCount > 0) {
      dispatch({
        type: 'SET_FLOATING_TOOLBAR',
        payload: {
          ...floatingToolbar,
          savedRange: selection.getRangeAt(0).cloneRange(),
        }
      });
    }
    
    editableEl.focus();
  }, [dispatch, floatingToolbar]);
  
  const updateFloatingToolbarRange = useCallback((range: Range) => {
    console.log('✅ Atualizando range da toolbar');
    dispatch({
      type: 'SET_FLOATING_TOOLBAR',
      payload: {
        ...floatingToolbar,
        savedRange: range,
      }
    });
  }, [dispatch, floatingToolbar]);
  
  return {
    // Getters
    getEditedValue,
    getElementStyle,
    
    // Setters
    updateEditedValue,
    updateElementStyle,
    
    // Selection
    clearAllSelections,
    
    // Toolbar
    showFloatingToolbar,
    closeFloatingToolbar,
    applyTextFormat,
    updateFloatingToolbarRange,
    floatingToolbar,
  };
};
