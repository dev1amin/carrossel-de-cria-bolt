/**
 * Carousel Module - Central Export
 * 
 * Este arquivo consolida todas as exportações do módulo de carrossel,
 * substituindo a antiga pasta Carousel-Template
 */

// ==================== Components ====================
export {
  CarouselGenerator,
  CarouselEditorTabs,
  TemplateSelectionModal,
  GenerationQueue,
  CarouselViewer
} from './components/carousel';

export type { 
  CarouselTab,
  GenerationOptions,
  ContentType,
  ScreenCount,
  DescriptionLength,
  CarouselDimension,
  CTAType,
  CTAIntention,
  SourceItem
} from './components/carousel';

// ==================== Services ====================
export * from './services/carousel';

// ==================== Hooks ====================
export * from './hooks/carousel';

// ==================== Types ====================
export * from './types/carousel';

// ==================== Config ====================
export * from './config/carousel';
