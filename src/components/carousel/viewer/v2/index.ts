/**
 * Carousel Editor v2 - Nova arquitetura modular
 * 
 * Esta versão do editor separa responsabilidades em:
 * - Context: Estado global compartilhado
 * - Hooks: Lógica de negócios reutilizável (mobile + desktop)
 * - Components: Componentes de UI
 * 
 * Uso:
 * import CarouselEditor from './v2';
 * <CarouselEditor slides={...} carouselData={...} onClose={...} />
 */

export { default as CarouselEditor } from './CarouselEditor';
export { default } from './CarouselEditor';

// Types
export * from './types';

// Context
export { EditorProvider, useEditor } from './context/EditorContext';

// Hooks
export * from './hooks';

// Components
export { Canvas, CanvasControls, SlideRenderer } from './components/Canvas';
export { EditorToolbar, FloatingToolbar } from './components/Toolbar';
