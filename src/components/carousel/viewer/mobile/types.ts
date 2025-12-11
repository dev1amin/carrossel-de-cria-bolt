/**
 * Tipos específicos para o editor mobile de carrossel
 */

import type { CarouselData, ElementType } from '../../../../types/carousel';

// Elemento selecionado no editor
export interface SelectedElement {
  slideIndex: number;
  element: ElementType | null;
  elementId?: string;
}

// Props do viewer mobile principal
export interface MobileViewerProps {
  slides: string[];
  carouselData: CarouselData;
  onClose: () => void;
  generatedContentId?: number;
  onSaveSuccess?: () => void;
  autoDownload?: boolean;
}

// Configurações globais do carrossel
export interface GlobalSettings {
  theme: 'light' | 'dark';
  accentColor: string;
  showSlideNumber: boolean;
  showVerifiedBadge: boolean;
}

// Estado do painel de propriedades
export interface PropertiesPanelState {
  isOpen: boolean;
  activeTab: 'text' | 'image' | 'settings';
  height: number;
}

// Estado do slide actions sheet
export interface SlideActionsState {
  isOpen: boolean;
  slideIndex: number;
}

// Estilos de texto atuais
export interface TextFormattingState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  color: string;
  fontSize: string;
  textAlign: 'left' | 'center' | 'right';
}

// Toast message type
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

// Swipe direction
export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

// Imagem da busca
export interface SearchImage {
  url: string;
  thumbnail?: string;
  alt?: string;
}
