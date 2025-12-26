/**
 * Tipos compartilhados para o Carousel Editor v2
 */

import type { CarouselData, ElementStyles } from '../../../../types/carousel';

// === TIPOS DE ELEMENTOS ===
export type EditableElement = 'title' | 'subtitle' | 'nome' | 'arroba' | 'image' | 'background' | 'avatar' | null;

// === ESTADO DO ELEMENTO SELECIONADO ===
export interface SelectedElement {
  slideIndex: number;
  element: EditableElement;
}

// === CONFIGURAÇÕES GLOBAIS ===
export interface GlobalSettings {
  theme: 'light' | 'dark';
  accentColor: string;
  showSlideNumber: boolean;
  showVerifiedBadge: boolean;
  headerScale: number;
  fontStyle: string;
  fontScale: number;
}

// === TOAST ===
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

// === DADOS DO SLIDE ===
export interface SlideData {
  id?: string;
  layoutIndex?: number;
  title?: string;
  subtitle?: string;
  imagem_fundo?: string;
  imagem_fundo2?: string;
  imagem_fundo3?: string;
  thumbnail_url?: string;
  slideBackground?: string;
  blocks?: any[];
  [key: string]: any;
}

// === DADOS GERAIS ===
export interface DadosGerais {
  nome?: string;
  arroba?: string;
  foto_perfil?: string;
  template?: string;
}

// === FLOATING TOOLBAR ===
export interface FloatingToolbarState {
  visible: boolean;
  top: number;
  left: number;
  iframeDoc: Document | null;
  editableEl: HTMLElement | null;
  savedRange: Range | null;
}

// === ESTADO DO CANVAS ===
export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
}

// === ESTADO DO EDITOR ===
export interface EditorState {
  // Canvas
  canvas: CanvasState;
  
  // Slides
  focusedSlide: number;
  selectedElement: SelectedElement;
  renderedSlides: string[];
  
  // Edição
  editedContent: Record<string, any>;
  elementStyles: Record<string, ElementStyles>;
  originalStyles: Record<string, ElementStyles>;
  
  // Upload
  uploadedImages: Record<number, string>;
  
  // Busca
  searchKeyword: string;
  searchResults: string[];
  isSearching: boolean;
  
  // Status
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isExporting: boolean;
  
  // UI
  batchMode: boolean;
  selectedSlides: Set<number>;
  isSidebarMinimized: boolean;
  isPropertiesMinimized: boolean;
  expandedLayers: Set<number>;
  
  // Modals
  isCloneModalOpen: boolean;
  
  // Global Settings
  globalSettings: GlobalSettings;
  
  // Toolbar
  floatingToolbar: FloatingToolbarState;
  
  // Toasts
  toasts: ToastMessage[];
}

// === PROPS DO EDITOR ===
export interface CarouselEditorProps {
  slides: string[];
  carouselData: CarouselData;
  onClose: () => void;
  generatedContentId?: number;
  onSaveSuccess?: () => void;
  autoDownload?: boolean;
}

// === DIMENSÕES DO TEMPLATE ===
export interface TemplateDimensions {
  width: number;
  height: number;
}

// === AÇÕES DO EDITOR ===
export interface EditorActions {
  // Canvas
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragStart: (start: { x: number; y: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  centerSlide: (index: number) => void;
  
  // Slides
  setFocusedSlide: (index: number) => void;
  setSelectedElement: (element: SelectedElement) => void;
  handleSlideClick: (index: number) => void;
  handlePrevSlide: () => void;
  handleNextSlide: () => void;
  
  // Edição
  updateEditedValue: (slideIndex: number, field: string, value: any) => void;
  updateElementStyle: (slideIndex: number, element: EditableElement, prop: keyof ElementStyles, value: string) => void;
  getEditedValue: (slideIndex: number, field: string, defaultValue: any) => any;
  getElementStyle: (slideIndex: number, element: EditableElement) => ElementStyles;
  clearAllSelections: (preserveElement?: HTMLElement | null) => void;
  
  // Slides CRUD
  handleAddSlide: () => void;
  handleCloneSlide: (sourceIndex: number) => void;
  handleDeleteSlide: (index: number) => void;
  handleBatchDelete: () => void;
  
  // Imagens
  handleBackgroundImageChange: (slideIndex: number, imageUrl: string) => void;
  handleImageUpload: (slideIndex: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchImages: () => void;
  handleGenerateAIImage: (slideIndex: number, prompt?: string) => void;
  
  // Persistência
  handleSave: () => Promise<void>;
  handleDownloadCurrent: () => Promise<void>;
  handleDownloadAll: () => Promise<void>;
  
  // UI
  toggleBatchMode: () => void;
  toggleSlideSelection: (index: number) => void;
  setSearchKeyword: (keyword: string) => void;
  toggleSidebar: () => void;
  toggleProperties: () => void;
  
  // Global Settings
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  
  // Toolbar
  showFloatingToolbar: (doc: Document, el: HTMLElement, container: HTMLIFrameElement | HTMLDivElement) => void;
  closeFloatingToolbar: () => void;
  applyTextFormat: (cmd: string) => void;
  updateFloatingToolbarRange: (range: Range) => void;
  
  // Toast
  addToast: (message: string, type: 'success' | 'error') => void;
  removeToast: (id: string) => void;
}

// === CONTEXT TYPE ===
export interface EditorContextType {
  state: EditorState;
  actions: EditorActions;
  refs: EditorRefs;
  data: {
    carouselData: CarouselData;
    activeData: CarouselData;
    templateId: string;
    templateDimensions: TemplateDimensions;
    templateCompatibility: 'video-image' | 'image-only';
    isReactTemplate: boolean;
    contentId?: number;
  };
}

// === REFS ===
export interface EditorRefs {
  containerRef: React.RefObject<HTMLDivElement>;
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>;
  reactSlideRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  selectedImageRefs: React.MutableRefObject<Record<number, HTMLImageElement | null>>;
}

// === DEFAULTS ===
export const DEFAULT_ZOOM = 0.5;

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  theme: 'light',
  accentColor: '#4167B2',
  showSlideNumber: true,
  showVerifiedBadge: true,
  headerScale: 1.0,
  fontStyle: 'sans',
  fontScale: 1.0,
};

export const DEFAULT_FLOATING_TOOLBAR: FloatingToolbarState = {
  visible: false,
  top: 0,
  left: 0,
  iframeDoc: null,
  editableEl: null,
  savedRange: null,
};
