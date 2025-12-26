// Main components
export { default as CarouselViewer } from './CarouselViewer';
export { SlidesSidebar } from './SlidesSidebar';
export { EditorToolbar } from './EditorToolbar';
export { CanvasPreview } from './CanvasPreview';
export { RightPropertiesPanel } from './RightPropertiesPanel';
export { EditorGallery } from './EditorGallery';

// V2 - Nova arquitetura modular
export { default as NewCarouselViewer } from './v2/CarouselEditor';
export { default as CarouselEditorV2 } from './v2/CarouselEditor';
export { EditorProvider, useEditor } from './v2/context/EditorContext';

// Types
export * from './types';

// Hooks
export { useViewerState } from './hooks/useViewerState';
export { useContentId } from './hooks/useContentId';
export { useAutoDownload } from './hooks/useAutoDownload';
export { useIframeEventListeners } from './hooks/useIframeEventListeners';
export { useUnsavedChangesWarning } from './hooks/useUnsavedChangesWarning';

// Utils
export * from './utils/constants';
export * from './utils/iframeHelpers';

// Handlers
export * from './handlers/selectionHandlers';
export * from './handlers/saveHandlers';
export * from './handlers/dragHandlers';
