/**
 * Hook para gerenciar estado do editor mobile
 * Reutiliza lógica do desktop adaptada para mobile
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { CarouselData, ElementType, ElementStyles } from '../../../../types/carousel';
import type { SelectedElement, GlobalSettings, ToastMessage, TextFormattingState } from './types';

interface UseMobileEditorStateParams {
  slides: string[];
  carouselData: CarouselData;
  generatedContentId?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars

export function useMobileEditorState({
  slides,
  carouselData: _carouselData,
  generatedContentId,
}: UseMobileEditorStateParams) {
  // === Estado de navegação ===
  const [currentSlide, setCurrentSlide] = useState(0);
  const [renderedSlides, setRenderedSlides] = useState<string[]>(slides);

  // === Estado de seleção ===
  const [selectedElement, setSelectedElement] = useState<SelectedElement>({
    slideIndex: 0,
    element: null,
  });

  // === Estado de edição ===
  const [editedContent, setEditedContent] = useState<Record<string, any>>({});
  const [elementStyles, setElementStyles] = useState<Record<string, ElementStyles>>({});
  const [originalStyles, setOriginalStyles] = useState<Record<string, any>>({});
  const [uploadedImages, setUploadedImages] = useState<Record<number, string>>({});

  // === Estado de busca de imagens ===
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // === Estado de salvamento ===
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contentId, setContentId] = useState<number | undefined>(generatedContentId);
  const [modificationCount, setModificationCount] = useState(0);

  // === Configurações globais ===
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    theme: 'light',
    accentColor: '#4167B2',
    showSlideNumber: true,
    showVerifiedBadge: true,
  });

  // === Toasts ===
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // === Estado de formatação de texto atual ===
  const [textFormatting, setTextFormatting] = useState<TextFormattingState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    color: '#FFFFFF',
    fontSize: '18px',
    textAlign: 'left',
  });

  // === UI State ===
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
  const [propertiesPanelHeight, setPropertiesPanelHeight] = useState(300);
  const [isSlideActionsOpen, setIsSlideActionsOpen] = useState(false);
  const [isTextEditing, setIsTextEditing] = useState(false);

  // === Refs ===
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>(new Array(slides.length).fill(null));
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedImageRefs = useRef<Record<number, HTMLImageElement | null>>({});
  const userHasMadeChangesRef = useRef(false);

  // === Helpers de Toast ===
  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    // Limita a 2 toasts máximo
    setToasts((prev) => [...prev.slice(-1), { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // === Helpers de edição ===
  const updateEditedValue = useCallback((slideIndex: number, field: string, value: any) => {
    const key = `${slideIndex}-${field}`;
    setEditedContent((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
    setModificationCount((prev) => prev + 1);
  }, []);

  const updateElementStyle = useCallback((
    slideIndex: number,
    element: ElementType,
    prop: keyof ElementStyles,
    value: string
  ) => {
    const key = `${slideIndex}-${element}`;
    setElementStyles((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [prop]: value },
    }));
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
    setModificationCount((prev) => prev + 1);
  }, []);

  const getEditedValue = useCallback((slideIndex: number, field: string, defaultValue: any) => {
    const key = `${slideIndex}-${field}`;
    return editedContent[key] ?? defaultValue;
  }, [editedContent]);

  const getElementStyle = useCallback((slideIndex: number, element: ElementType): ElementStyles => {
    const key = `${slideIndex}-${element}`;
    return elementStyles[key] || {};
  }, [elementStyles]);

  // === Atualizar configurações globais ===
  const updateGlobalSettings = useCallback((settings: Partial<GlobalSettings>) => {
    setGlobalSettings((prev) => ({ ...prev, ...settings }));
    setHasUnsavedChanges(true);
    userHasMadeChangesRef.current = true;
  }, []);

  // === Limpar seleções ===
  const clearAllSelections = useCallback(() => {
    iframeRefs.current.forEach((ifr) => {
      const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
      if (!doc) return;

      doc.querySelectorAll('[data-editable].selected').forEach((el) => {
        el.classList.remove('selected');
        (el as HTMLElement).style.zIndex = '';
      });

      doc.querySelectorAll('[contenteditable="true"]').forEach((el) => {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.outlineOffset = '';
        (el as HTMLElement).style.background = '';
      });

      doc.querySelectorAll('.img-crop-wrapper[data-cv-selected="1"]').forEach((el) => {
        (el as HTMLElement).removeAttribute('data-cv-selected');
      });

      doc.querySelectorAll('.video-container.selected').forEach((el) => {
        el.classList.remove('selected');
        (el as HTMLElement).style.zIndex = '';
      });
    });

    setSelectedElement({ slideIndex: currentSlide, element: null });
    setIsTextEditing(false);
  }, [currentSlide]);

  // === Detectar estilos do texto selecionado ===
  const detectTextFormatting = useCallback(() => {
    const ifr = iframeRefs.current[currentSlide];
    const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
    if (!doc) return;

    const selection = doc.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const parentElement = container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : container as HTMLElement;

    if (!parentElement) return;

    const computedStyle = doc.defaultView?.getComputedStyle(parentElement);
    if (!computedStyle) return;

    setTextFormatting({
      isBold: computedStyle.fontWeight === '700' || computedStyle.fontWeight === 'bold',
      isItalic: computedStyle.fontStyle === 'italic',
      isUnderline: computedStyle.textDecoration.includes('underline'),
      isStrikethrough: computedStyle.textDecoration.includes('line-through'),
      color: computedStyle.color,
      fontSize: computedStyle.fontSize,
      textAlign: computedStyle.textAlign as 'left' | 'center' | 'right',
    });
  }, [currentSlide]);

  // === Resetar ao trocar slide ===
  useEffect(() => {
    setSelectedElement({ slideIndex: currentSlide, element: null });
    setIsTextEditing(false);
    setIsPropertiesPanelOpen(false);
  }, [currentSlide]);

  return {
    // Estado de navegação
    currentSlide,
    setCurrentSlide,
    renderedSlides,
    setRenderedSlides,
    totalSlides: slides.length,

    // Estado de seleção
    selectedElement,
    setSelectedElement,

    // Estado de edição
    editedContent,
    setEditedContent,
    elementStyles,
    setElementStyles,
    originalStyles,
    setOriginalStyles,
    uploadedImages,
    setUploadedImages,

    // Busca de imagens
    searchKeyword,
    setSearchKeyword,
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,

    // Salvamento
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isSaving,
    setIsSaving,
    contentId,
    setContentId,
    modificationCount,
    setModificationCount,

    // Configurações globais
    globalSettings,
    setGlobalSettings,
    updateGlobalSettings,

    // Toasts
    toasts,
    addToast,
    removeToast,

    // Formatação de texto
    textFormatting,
    setTextFormatting,
    detectTextFormatting,

    // UI State
    isPropertiesPanelOpen,
    setIsPropertiesPanelOpen,
    propertiesPanelHeight,
    setPropertiesPanelHeight,
    isSlideActionsOpen,
    setIsSlideActionsOpen,
    isTextEditing,
    setIsTextEditing,

    // Refs
    iframeRefs,
    containerRef,
    selectedImageRefs,
    userHasMadeChangesRef,

    // Helpers
    updateEditedValue,
    updateElementStyle,
    getEditedValue,
    getElementStyle,
    clearAllSelections,
  };
}
