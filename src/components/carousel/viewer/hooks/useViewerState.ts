/**
 * Hook principal para gerenciar o estado do editor de carrossel
 */

import { useState, useRef } from 'react';
import type { ViewerState, ToastMessage } from '../types';
import { DEFAULT_ZOOM } from '../utils/constants';

export function useViewerState(
  slides: string[],
  generatedContentId?: number
): ViewerState & {
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  selectedImageRefs: React.MutableRefObject<Record<number, HTMLImageElement | null>>;
  lastSearchId: React.MutableRefObject<number>;
  disposersRef: React.MutableRefObject<Array<() => void>>;
  toasts: ToastMessage[];
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setDragStart: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setFocusedSlide: React.Dispatch<React.SetStateAction<number>>;
  setSelectedElement: React.Dispatch<React.SetStateAction<{ slideIndex: number; element: any }>>;
  setExpandedLayers: React.Dispatch<React.SetStateAction<Set<number>>>;
  setIsLayersMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPropertiesMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  setEditedContent: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setElementStyles: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setOriginalStyles: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setRenderedSlides: React.Dispatch<React.SetStateAction<string[]>>;
  setIsLoadingProperties: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  setSearchResults: React.Dispatch<React.SetStateAction<string[]>>;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
  setUploadedImages: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoDownloadExecuted: React.Dispatch<React.SetStateAction<boolean>>;
  setContentId: React.Dispatch<React.SetStateAction<number | undefined>>;
  setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>;
  addToast: (message: string, type: 'success' | 'error') => void;
  removeToast: (id: string) => void;
} {
  // Zoom e Pan
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Slides e seleção
  const [focusedSlide, setFocusedSlide] = useState<number>(0);
  const [selectedElement, setSelectedElement] = useState<{ slideIndex: number; element: any }>({
    slideIndex: 0,
    element: null,
  });

  // UI States
  const [expandedLayers, setExpandedLayers] = useState<Set<number>>(new Set([0]));
  const [isLayersMinimized, setIsLayersMinimized] = useState(false);
  const [isPropertiesMinimized, setIsPropertiesMinimized] = useState(false);

  // Edição
  const [editedContent, setEditedContent] = useState<Record<string, any>>({});
  const [elementStyles, setElementStyles] = useState<Record<string, any>>({});
  const [originalStyles, setOriginalStyles] = useState<Record<string, any>>({});
  const [renderedSlides, setRenderedSlides] = useState<string[]>(slides);

  // Loading states
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  // Busca de imagens
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Record<number, string>>({});

  // Salvamento
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoDownloadExecuted, setAutoDownloadExecuted] = useState(false);
  const [contentId, setContentId] = useState<number | undefined>(generatedContentId);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Refs
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>(new Array(slides.length).fill(null));
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedImageRefs = useRef<Record<number, HTMLImageElement | null>>({});
  const lastSearchId = useRef(0);
  const disposersRef = useRef<Array<() => void>>([]);

  /** Helper: Adicionar toast */
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    zoom,
    pan,
    isDragging,
    dragStart,
    focusedSlide,
    selectedElement,
    expandedLayers,
    isLayersMinimized,
    isPropertiesMinimized,
    editedContent,
    elementStyles,
    originalStyles,
    renderedSlides,
    isLoadingProperties,
    searchKeyword,
    searchResults,
    isSearching,
    uploadedImages,
    hasUnsavedChanges,
    isSaving,
    autoDownloadExecuted,
    contentId,
    iframeRefs,
    containerRef,
    selectedImageRefs,
    lastSearchId,
    disposersRef,
    toasts,
    setZoom,
    setPan,
    setIsDragging,
    setDragStart,
    setFocusedSlide,
    setSelectedElement,
    setExpandedLayers,
    setIsLayersMinimized,
    setIsPropertiesMinimized,
    setEditedContent,
    setElementStyles,
    setOriginalStyles,
    setRenderedSlides,
    setIsLoadingProperties,
    setSearchKeyword,
    setSearchResults,
    setIsSearching,
    setUploadedImages,
    setHasUnsavedChanges,
    setIsSaving,
    setAutoDownloadExecuted,
    setContentId,
    setToasts,
    addToast,
    removeToast,
  };
}
