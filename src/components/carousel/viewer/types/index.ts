/**
 * Tipos e interfaces do Editor de Carrossel
 */

import type { CarouselData, ElementType, ElementStyles } from '../../../../types/carousel';

export interface ViewerState {
  // Zoom e Pan
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
  
  // Slides e seleção
  focusedSlide: number;
  selectedElement: { slideIndex: number; element: ElementType };
  
  // UI States
  expandedLayers: Set<number>;
  isLayersMinimized: boolean;
  isPropertiesMinimized: boolean;
  
  // Edição
  editedContent: Record<string, any>;
  elementStyles: Record<string, ElementStyles>;
  originalStyles: Record<string, ElementStyles>;
  renderedSlides: string[];
  
  // Loading states
  isLoadingProperties: boolean;
  
  // Busca de imagens
  searchKeyword: string;
  searchResults: string[];
  isSearching: boolean;
  uploadedImages: Record<number, string>;
  
  // Salvamento
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  autoDownloadExecuted: boolean;
  contentId: number | undefined;
}

export interface ViewerProps {
  slides: string[];
  carouselData: CarouselData;
  onClose: () => void;
  generatedContentId?: number;
  onSaveSuccess?: () => void;
  autoDownload?: boolean;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export interface ImgDragState {
  wrapper: HTMLElement;
  targetEl: HTMLElement;
  contW: number;
  contH: number;
  imgEl: HTMLImageElement;
  natW: number;
  natH: number;
  displayW: number;
  displayH: number;
  startMouseX: number;
  startMouseY: number;
  startLeft: number;
  startTop: number;
  minLeft: number;
  minTop: number;
  maxLeft: number;
  maxTop: number;
  slideIndex: number;
}

export interface VideoCropState {
  wrapper: HTMLElement;
  targetEl: HTMLElement | null;
  video: HTMLVideoElement;
  contW: number;
  contH: number;
  displayW: number;
  displayH: number;
  startMouseX: number;
  startMouseY: number;
  startLeft: number;
  startTop: number;
  minLeft: number;
  minTop: number;
  maxLeft: number;
  maxTop: number;
  slideIndex: number;
}

export type { CarouselData, ElementType, ElementStyles };
