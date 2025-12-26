/**
 * useEditorState - Hook principal para gerenciar o estado do editor
 *
 * Centraliza todos os estados e disponibiliza para os outros hooks
 */

import { useReducer, useRef, useCallback, useEffect } from 'react';
import type {
  EditorState,
  ToastMessage,
  GlobalSettings,
  SelectedElement,
  FloatingToolbarState,
} from '../types';
import { DEFAULT_ZOOM, DEFAULT_GLOBAL_SETTINGS, DEFAULT_FLOATING_TOOLBAR } from '../types';
import type { CarouselData, ElementStyles } from '../../../../../types/carousel';

// === ACTION TYPES ===
type EditorAction =
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'SET_IS_DRAGGING'; payload: boolean }
  | { type: 'SET_DRAG_START'; payload: { x: number; y: number } }
  | { type: 'SET_FOCUSED_SLIDE'; payload: number }
  | { type: 'SET_SELECTED_ELEMENT'; payload: SelectedElement }
  | { type: 'SET_RENDERED_SLIDES'; payload: string[] }
  | { type: 'SET_EDITED_CONTENT'; payload: Record<string, any> }
  | { type: 'UPDATE_EDITED_CONTENT'; payload: { key: string; value: any } }
  | { type: 'SET_ELEMENT_STYLES'; payload: Record<string, ElementStyles> }
  | { type: 'UPDATE_ELEMENT_STYLE'; payload: { key: string; styles: ElementStyles } }
  | { type: 'SET_ORIGINAL_STYLES'; payload: Record<string, ElementStyles> }
  | { type: 'SET_UPLOADED_IMAGES'; payload: Record<number, string> }
  | { type: 'UPDATE_UPLOADED_IMAGE'; payload: { index: number; url: string } }
  | { type: 'SET_SEARCH_KEYWORD'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: string[] }
  | { type: 'SET_IS_SEARCHING'; payload: boolean }
  | { type: 'SET_HAS_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'SET_IS_SAVING'; payload: boolean }
  | { type: 'SET_IS_EXPORTING'; payload: boolean }
  | { type: 'SET_BATCH_MODE'; payload: boolean }
  | { type: 'SET_SELECTED_SLIDES'; payload: Set<number> }
  | { type: 'TOGGLE_SLIDE_SELECTION'; payload: number }
  | { type: 'SET_IS_SIDEBAR_MINIMIZED'; payload: boolean }
  | { type: 'SET_IS_PROPERTIES_MINIMIZED'; payload: boolean }
  | { type: 'SET_EXPANDED_LAYERS'; payload: Set<number> }
  | { type: 'TOGGLE_LAYER'; payload: number }
  | { type: 'SET_IS_CLONE_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_GLOBAL_SETTINGS'; payload: GlobalSettings }
  | { type: 'UPDATE_GLOBAL_SETTINGS'; payload: Partial<GlobalSettings> }
  | { type: 'SET_FLOATING_TOOLBAR'; payload: FloatingToolbarState }
  | { type: 'ADD_TOAST'; payload: ToastMessage }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'DELETE_SLIDE_FULL'; payload: number }
  | { type: 'RESET_STATE' };

// === INITIAL STATE ===
const createInitialState = (slides: string[]): EditorState => ({
  canvas: {
    zoom: DEFAULT_ZOOM,
    pan: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  },
  focusedSlide: 0,
  selectedElement: { slideIndex: 0, element: null },
  renderedSlides: slides,
  editedContent: {},
  elementStyles: {},
  originalStyles: {},
  uploadedImages: {},
  searchKeyword: '',
  searchResults: [],
  isSearching: false,
  hasUnsavedChanges: false,
  isSaving: false,
  isExporting: false,
  batchMode: false,
  selectedSlides: new Set(),
  isSidebarMinimized: false,
  isPropertiesMinimized: false,
  expandedLayers: new Set([0]),
  isCloneModalOpen: false,
  globalSettings: DEFAULT_GLOBAL_SETTINGS,
  floatingToolbar: DEFAULT_FLOATING_TOOLBAR,
  toasts: [],
});

// === REDUCER ===
const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    // Canvas
    case 'SET_ZOOM':
      return { ...state, canvas: { ...state.canvas, zoom: action.payload } };
    case 'SET_PAN':
      return { ...state, canvas: { ...state.canvas, pan: action.payload } };
    case 'SET_IS_DRAGGING':
      return { ...state, canvas: { ...state.canvas, isDragging: action.payload } };
    case 'SET_DRAG_START':
      return { ...state, canvas: { ...state.canvas, dragStart: action.payload } };

    // Slides
    case 'SET_FOCUSED_SLIDE':
      return { ...state, focusedSlide: action.payload };
    case 'SET_SELECTED_ELEMENT':
      return { ...state, selectedElement: action.payload };
    case 'SET_RENDERED_SLIDES':
      return { ...state, renderedSlides: action.payload };

    // Edição
    case 'SET_EDITED_CONTENT':
      return { ...state, editedContent: action.payload };
    case 'UPDATE_EDITED_CONTENT':
      return {
        ...state,
        editedContent: { ...state.editedContent, [action.payload.key]: action.payload.value },
        hasUnsavedChanges: true,
      };
    case 'SET_ELEMENT_STYLES':
      return { ...state, elementStyles: action.payload };
    case 'UPDATE_ELEMENT_STYLE':
      return {
        ...state,
        elementStyles: { ...state.elementStyles, [action.payload.key]: action.payload.styles },
        hasUnsavedChanges: true,
      };
    case 'SET_ORIGINAL_STYLES':
      return { ...state, originalStyles: action.payload };

    // Upload
    case 'SET_UPLOADED_IMAGES':
      return { ...state, uploadedImages: action.payload };
    case 'UPDATE_UPLOADED_IMAGE':
      return {
        ...state,
        uploadedImages: { ...state.uploadedImages, [action.payload.index]: action.payload.url },
        hasUnsavedChanges: true,
      };

    // Busca
    case 'SET_SEARCH_KEYWORD':
      return { ...state, searchKeyword: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'SET_IS_SEARCHING':
      return { ...state, isSearching: action.payload };

    // Status
    case 'SET_HAS_UNSAVED_CHANGES':
      return { ...state, hasUnsavedChanges: action.payload };
    case 'SET_IS_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_IS_EXPORTING':
      return { ...state, isExporting: action.payload };

    // UI
    case 'SET_BATCH_MODE':
      return { ...state, batchMode: action.payload };
    case 'SET_SELECTED_SLIDES':
      return { ...state, selectedSlides: action.payload };
    case 'TOGGLE_SLIDE_SELECTION': {
      const newSet = new Set(state.selectedSlides);
      if (newSet.has(action.payload)) {
        newSet.delete(action.payload);
      } else {
        newSet.add(action.payload);
      }
      return { ...state, selectedSlides: newSet };
    }
    case 'SET_IS_SIDEBAR_MINIMIZED':
      return { ...state, isSidebarMinimized: action.payload };
    case 'SET_IS_PROPERTIES_MINIMIZED':
      return { ...state, isPropertiesMinimized: action.payload };
    case 'SET_EXPANDED_LAYERS':
      return { ...state, expandedLayers: action.payload };
    case 'TOGGLE_LAYER': {
      const newSet = new Set(state.expandedLayers);
      if (newSet.has(action.payload)) {
        newSet.delete(action.payload);
      } else {
        newSet.add(action.payload);
      }
      return { ...state, expandedLayers: newSet };
    }

    // Modals
    case 'SET_IS_CLONE_MODAL_OPEN':
      return { ...state, isCloneModalOpen: action.payload };

    // Global Settings
    case 'SET_GLOBAL_SETTINGS':
      return { ...state, globalSettings: action.payload };
    case 'UPDATE_GLOBAL_SETTINGS':
      return {
        ...state,
        globalSettings: { ...state.globalSettings, ...action.payload },
        hasUnsavedChanges: true,
      };

    // Floating Toolbar
    case 'SET_FLOATING_TOOLBAR':
      return { ...state, floatingToolbar: action.payload };

    // Toasts
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };

    // Reset
    case 'RESET_STATE':
      return createInitialState(state.renderedSlides);

    // Delete atômico (FIX REAL)
    case 'DELETE_SLIDE_FULL': {
      const index = action.payload;

      const slides = state.renderedSlides.filter((_, i) => i !== index);

      // REINDEX CORRETO: "0-title" / "1-subtitle" etc.
      const reindex = (obj: Record<string, any>) => {
        const out: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          const m = key.match(/^(\d+)-(.+)$/);
          if (m) {
            const oldIdx = parseInt(m[1], 10);
            const rest = m[2];

            if (oldIdx === index) continue; // drop deletado
            if (oldIdx > index) out[`${oldIdx - 1}-${rest}`] = value; // shift
            else out[key] = value;
            continue;
          }

          // chave global
          out[key] = value;
        }
        return out;
      };

      let focused = state.focusedSlide;
      if (focused >= slides.length) focused = slides.length - 1;
      else if (focused > index) focused = focused - 1;

      const reindexSet = (set: Set<number>) =>
        new Set(Array.from(set).filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));

      const reindexUploadedImages = (imgs: Record<number, string>) => {
        const out: Record<number, string> = {};
        Object.entries(imgs).forEach(([k, url]) => {
          const oldIdx = Number(k);
          if (oldIdx === index) return;
          const newIdx = oldIdx > index ? oldIdx - 1 : oldIdx;
          out[newIdx] = url;
        });
        return out;
      };

      return {
        ...state,
        renderedSlides: slides,

        editedContent: reindex(state.editedContent),
        elementStyles: reindex(state.elementStyles),
        originalStyles: reindex(state.originalStyles),
        uploadedImages: reindexUploadedImages(state.uploadedImages),

        focusedSlide: focused,
        selectedElement: { slideIndex: focused, element: null },

        selectedSlides: reindexSet(state.selectedSlides),
        expandedLayers: reindexSet(state.expandedLayers),

        hasUnsavedChanges: true,
      };
    }

    default:
      return state;
  }
};

// === HOOK ===
export const useEditorState = (slides: string[], activeData: CarouselData) => {
  // State via reducer
  const [state, dispatch] = useReducer(editorReducer, slides, createInitialState);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const reactSlideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const selectedImageRefs = useRef<Record<number, HTMLImageElement | null>>({});
  const disposersRef = useRef<Array<() => void>>([]);
  const lastSearchIdRef = useRef(0);

  // Toast helpers
  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });

    // Auto-remove after 3s
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  // UI toggles
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'SET_IS_SIDEBAR_MINIMIZED', payload: !state.isSidebarMinimized });
  }, [state.isSidebarMinimized]);

  const toggleProperties = useCallback(() => {
    dispatch({ type: 'SET_IS_PROPERTIES_MINIMIZED', payload: !state.isPropertiesMinimized });
  }, [state.isPropertiesMinimized]);

  // Global settings
  const updateGlobalSettings = useCallback((settings: Partial<GlobalSettings>) => {
    dispatch({ type: 'UPDATE_GLOBAL_SETTINGS', payload: settings });
  }, []);

  // Carrega estilos salvos do activeData
  useEffect(() => {
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
      dispatch({ type: 'SET_ELEMENT_STYLES', payload: loadedStyles });
    }
  }, [activeData]);

  return {
    state,
    dispatch,
    containerRef,
    iframeRefs,
    reactSlideRefs,
    selectedImageRefs,
    disposersRef,
    lastSearchIdRef,
    addToast,
    removeToast,
    toggleSidebar,
    toggleProperties,
    updateGlobalSettings,
  };
};

export type EditorDispatch = React.Dispatch<EditorAction>;