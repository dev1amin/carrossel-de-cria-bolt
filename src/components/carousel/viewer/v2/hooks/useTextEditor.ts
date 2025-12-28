/**
 * useTextEditor - Hook para edição de texto inline e formatação
 * Corrigido:
 * - showFloatingToolbar: cálculo de posição correto (sem somar offsets errados / sem zoom)
 * - suporte real a iframe (offset do frameElement)
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

export const useTextEditor = ({ state, dispatch, refs, templateData }: UseTextEditorProps) => {
  const { editedContent, elementStyles, originalStyles, floatingToolbar } = state;
  const { iframeRefs } = refs;

  // === HELPERS ===
  const getElementKey = useCallback((slideIndex: number, element: EditableElement) => {
    return `${slideIndex}-${element}`;
  }, []);

  // === GETTERS ===
  const getEditedValue = useCallback(
    (slideIndex: number, field: string, defaultValue: any) => {
      const key = `${slideIndex}-${field}`;
      return editedContent[key] !== undefined ? editedContent[key] : defaultValue;
    },
    [editedContent]
  );

  const getElementStyle = useCallback(
    (slideIndex: number, element: EditableElement): ElementStyles => {
      const key = getElementKey(slideIndex, element);
      if (elementStyles[key]) return elementStyles[key];
      if (originalStyles[key]) return originalStyles[key];

      if (element === 'background') {
        return {
          backgroundColor: '#000000',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
        };
      }

      return {};
    },
    [elementStyles, originalStyles, getElementKey]
  );

  // === SETTERS ===
  const updateEditedValue = useCallback(
    (slideIndex: number, field: string, value: any) => {
      // Para nome/arroba, atualiza globalmente
      if (field === 'nome' || field === 'arroba') {
        const activeData = templateData.activeData;
        if (activeData?.dados_gerais) {
          activeData.dados_gerais[field] = value;
        }
        dispatch({ type: 'UPDATE_EDITED_CONTENT', payload: { key: `global-${field}`, value } });
        return;
      }

      dispatch({ type: 'UPDATE_EDITED_CONTENT', payload: { key: `${slideIndex}-${field}`, value } });
    },
    [dispatch, templateData]
  );

  const updateElementStyle = useCallback(
    (slideIndex: number, element: EditableElement, prop: keyof ElementStyles, value: string) => {
      const key = getElementKey(slideIndex, element);
      const currentStyles = getElementStyle(slideIndex, element);

      dispatch({
        type: 'UPDATE_ELEMENT_STYLE',
        payload: { key, styles: { ...currentStyles, [prop]: value } },
      });
    },
    [dispatch, getElementKey, getElementStyle]
  );

  // === CLEAR SELECTIONS ===
  const clearAllSelections = useCallback(
    (preserveElement?: HTMLElement | null) => {
      iframeRefs.current.forEach((ifr) => {
        const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
        if (!doc) return;

        doc.querySelectorAll('[data-editable].selected').forEach((el) => {
          if (preserveElement && el === preserveElement) return;
          el.classList.remove('selected');
          (el as HTMLElement).style.zIndex = '';
        });

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
    },
    [iframeRefs]
  );

  // === FLOATING TOOLBAR ===
  const showFloatingToolbar = useCallback(
    (doc: Document, editableEl: HTMLElement, containerElement: HTMLElement) => {
      const selection = doc.getSelection();
      let savedRange: Range | null = null;

      if (selection && selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }

      const hasTextSelection = !!(selection && selection.rangeCount > 0 && selection.toString().length > 0);

      // getBoundingClientRect já está no viewport do "doc" correspondente.
      const baseRect = hasTextSelection && savedRange ? savedRange.getBoundingClientRect() : editableEl.getBoundingClientRect();

      // Se for iframe, precisamos somar o offset do frame no viewport do window principal
      // Preferir frameElement real
      const frameEl = (doc.defaultView?.frameElement as HTMLElement | null) || null;
      const isIframe = !!frameEl;

      const frameRect = isIframe ? frameEl!.getBoundingClientRect() : { top: 0, left: 0 };

      // Se você passou containerElement no caso de iframe (ex.: wrapper), usa o maior/mais correto.
      // Mas o frameElement normalmente é a verdade.
      const fallbackContainerRect = !isIframe ? { top: 0, left: 0 } : containerElement.getBoundingClientRect();

      const offsetTop = isIframe ? frameRect.top : 0;
      const offsetLeft = isIframe ? frameRect.left : 0;

      // Se o frameRect vier "zerado" por algum motivo, cai no container
      const finalTopOffset = isIframe && (offsetTop === 0 && offsetLeft === 0) ? fallbackContainerRect.top : offsetTop;
      const finalLeftOffset = isIframe && (offsetTop === 0 && offsetLeft === 0) ? fallbackContainerRect.left : offsetLeft;

      let top = finalTopOffset + baseRect.top - 48;
      let left = finalLeftOffset + baseRect.left + baseRect.width / 2;

      // Clamp na tela
      const margin = 10;
      top = Math.max(margin, Math.min(window.innerHeight - 60, top));
      left = Math.max(100, Math.min(window.innerWidth - 100, left));

      dispatch({
        type: 'SET_FLOATING_TOOLBAR',
        payload: {
          visible: true,
          top,
          left,
          iframeDoc: doc,
          editableEl,
          savedRange,
        },
      });
    },
    [dispatch]
  );

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

  const applyTextFormat = useCallback(
    (cmd: string) => {
      const { iframeDoc, editableEl, savedRange } = floatingToolbar;
      if (!iframeDoc || !editableEl) return;

      const selection = iframeDoc.getSelection();
      if (!selection) return;

      // Restaura seleção salva (se existir)
      if (savedRange) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      }

      iframeDoc.execCommand(cmd, false);

      dispatch({ type: 'SET_HAS_UNSAVED_CHANGES', payload: true });

      // Atualiza range salvo
      if (selection.rangeCount > 0) {
        dispatch({
          type: 'SET_FLOATING_TOOLBAR',
          payload: {
            ...floatingToolbar,
            savedRange: selection.getRangeAt(0).cloneRange(),
          },
        });
      }

      editableEl.focus();
    },
    [dispatch, floatingToolbar]
  );

  const updateFloatingToolbarRange = useCallback(
    (range: Range) => {
      dispatch({
        type: 'SET_FLOATING_TOOLBAR',
        payload: {
          ...floatingToolbar,
          savedRange: range,
        },
      });
    },
    [dispatch, floatingToolbar]
  );

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