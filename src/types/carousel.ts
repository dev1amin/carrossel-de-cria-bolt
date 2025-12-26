/**
 * Consolidated Carousel Types
 * Merged from Carousel-Template types
 */

// ==================== Carousel Data ====================

export interface CarouselData {
  dados_gerais: {
    nome: string;
    arroba: string;
    foto_perfil: string;
    template: string;
    description?: string; // Descrição do post (pode vir em dados_gerais)
  };
  conteudos: Array<{
    title: string;
    subtitle?: string;
    imagem_fundo: string;
    thumbnail_url?: string;
    imagem_fundo2?: string;
    imagem_fundo3?: string;
    imagem_fundo4?: string;
    imagem_fundo5?: string;
    imagem_fundo6?: string;
  }>;
  styles?: Record<string, any>; // Estilos salvos por slide: { "0": { "title": {...}, "subtitle": {...} }, "1": {...} }
  description?: string; // Descrição do post (pode vir no nível raiz, abaixo de business_id)
  business_id?: string; // ID do negócio
}

export interface CarouselResponse extends CarouselData {}

// ==================== Element Types ====================

export type ElementType = 'title' | 'subtitle' | 'background' | 'image' | 'nome' | 'arroba' | 'avatar' | null;

export interface ElementStyles {
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string; // 'normal' | 'italic'
  textDecoration?: string; // 'none' | 'underline' | 'line-through'
  textAlign?: string;
  color?: string;
  objectPosition?: string; // Para imagens e vídeos
  backgroundPositionX?: string; // Para backgrounds CSS
  backgroundPositionY?: string; // Para backgrounds CSS
  height?: string; // Para container height
}

// ==================== Template Types ====================

export type TemplateCompatibility = 'video-image' | 'image-only' | 'text-only';

export interface TemplateConfig {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  compatibility: TemplateCompatibility;
  compatibilityLabel: string;
}

export const AVAILABLE_TEMPLATES: TemplateConfig[] = [
  {
    id: '1-react',
    name: 'Template 1',
    thumbnail: 'https://images.pexels.com/photos/7319337/pexels-photo-7319337.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Design moderno e clean',
    compatibility: 'image-only',
    compatibilityLabel: 'Apenas Imagem'
  },
  {
    id: '2-react',
    name: 'Template 2',
    thumbnail: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Bold and vibrant layout',
    compatibility: 'video-image',
    compatibilityLabel: 'Vídeo + Imagem'
  },
  {
    id: '3-react',
    name: 'Template 3',
    thumbnail: 'https://images.pexels.com/photos/6372413/pexels-photo-6372413.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Elegant and professional',
    compatibility: 'video-image',
    compatibilityLabel: 'Vídeo + Imagem'
  },
  {
    id: '4-react',
    name: 'Template 4',
    thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Minimalist style',
    compatibility: 'video-image',
    compatibilityLabel: 'Vídeo + Imagem'
  },
  {
    id: '5-react',
    name: 'Template 5',
    thumbnail: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Dynamic and energetic',
    compatibility: 'text-only',
    compatibilityLabel: 'Apenas Texto'
  },
  {
    id: '6-react',
    name: 'Template 6',
    thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Creative and artistic',
    compatibility: 'video-image',
    compatibilityLabel: 'Vídeo + Imagem'
  },
  {
    id: '7-react',
    name: 'Template 7',
    thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Formato Reels/Twitter - 15 slides (9:16)',
    compatibility: 'video-image',
    compatibilityLabel: 'Vídeo + Imagem'
  },
  {
    id: '8-react',
    name: 'Template 8',
    thumbnail: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Formato Reels/Twitter - 15 slides (9:16)',
    compatibility: 'video-image',
    compatibilityLabel: 'Vídeo + Imagem'
  }
];

// Dimensões específicas por template
// Templates 1-6: Formato padrão Instagram (1080x1350)
// Templates 7-9: Formato vertical para Reels/Stories (1170x1560)
export const TEMPLATE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1': { width: 1080, height: 1350 },
  '1-react': { width: 1080, height: 1350 },
  '2': { width: 1080, height: 1350 },
  '2-react': { width: 1080, height: 1350 },
  '3': { width: 1080, height: 1350 },
  '3-react': { width: 1080, height: 1350 },
  '4': { width: 1080, height: 1350 },
  '4-react': { width: 1080, height: 1350 },
  '5': { width: 1080, height: 1350 },
  '5-react': { width: 1080, height: 1350 },
  '6': { width: 1080, height: 1350 },
  '6-react': { width: 1080, height: 1350 },
  '7': { width: 1170, height: 1560 },
  '7-react': { width: 1170, height: 1560 },
  '8': { width: 1170, height: 1560 },
  '8-react': { width: 1170, height: 1560 },
  '9': { width: 1170, height: 1560 },
};

// ==================== Queue Types ====================

export type QueueStatus = 'generating' | 'completed' | 'error';

export interface GenerationQueueItem {
  id: string;
  postCode: string;
  templateId: string;
  templateName: string;
  status: QueueStatus;
  createdAt: number;
  completedAt?: number;
  errorMessage?: string;
  // Dados do carrossel quando completado
  slides?: string[];
  carouselData?: any;
  generatedContentId?: number; // ID do GeneratedContent na API
}

// ==================== Carousel Tab Types ====================

export interface CarouselTab {
  id: string;
  slides: string[];
  carouselData: CarouselData;
  title: string;
  generatedContentId?: number; // ID do GeneratedContent na API
}

// ==================== Viewer Props ====================

export interface CarouselViewerProps {
  slides: string[];
  carouselData: CarouselData;
  onClose: () => void;
  generatedContentId?: number; // ID do GeneratedContent na API
  onSaveSuccess?: () => void; // Callback chamado após salvar com sucesso
}

// ==================== Image/Video Drag States ====================

export type ImgDragState = {
  active: boolean;
  kind: 'img' | 'bg' | 'vid';
  mode?: 'objpos';
  slideIndex: number;
  doc: Document;
  wrapper: HTMLElement;
  targetEl: HTMLImageElement | HTMLElement;
  contW: number;
  contH: number;
  natW: number;
  natH: number;
  dispW: number;
  dispH: number;
  minLeft: number;
  minTop: number;
  left: number;
  top: number;
  startX: number;
  startY: number;
};

export type VideoCropState = {
  active: boolean;
  slideIndex: number;
  wrapper: HTMLElement;
  video: HTMLVideoElement;
  vW: number;
  vH: number;
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
};
