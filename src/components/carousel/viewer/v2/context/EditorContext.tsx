/**
 * EditorContext - Contexto global do Carousel Editor
 * 
 * Este contexto centraliza todo o estado e ações do editor,
 * permitindo que qualquer componente filho acesse e modifique o estado.
 */

import React, { createContext, useContext, useMemo } from 'react';
import type { 
  EditorContextType, 
  CarouselEditorProps,
  EditorState,
  EditorActions,
  EditorRefs,
} from '../types';
import { useEditorState } from '../hooks/useEditorState';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useSlideManager } from '../hooks/useSlideManager';
import { useTextEditor } from '../hooks/useTextEditor';
import { useSaveExport } from '../hooks/useSaveExport';
import { useImageManager } from '../hooks/useImageManager';
import { useTemplateData } from '../hooks/useTemplateData';

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
};

interface EditorProviderProps extends CarouselEditorProps {
  children: React.ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  slides,
  carouselData,
  onClose,
  generatedContentId,
  onSaveSuccess,
  autoDownload = false,
}) => {
  // === DADOS DO TEMPLATE ===
  const templateData = useTemplateData(carouselData, generatedContentId);
  
  // === ESTADO PRINCIPAL ===
  const editorState = useEditorState(slides, templateData.activeData);
  
  // === REFS ===
  const refs: EditorRefs = {
    containerRef: editorState.containerRef,
    iframeRefs: editorState.iframeRefs,
    reactSlideRefs: editorState.reactSlideRefs,
    selectedImageRefs: editorState.selectedImageRefs,
  };
  
  // === INTERAÇÃO COM CANVAS ===
  const canvasInteraction = useCanvasInteraction({
    state: editorState.state,
    dispatch: editorState.dispatch,
    refs,
    templateDimensions: templateData.templateDimensions,
  });
  
  // === GERENCIAMENTO DE SLIDES ===
  const slideManager = useSlideManager({
    state: editorState.state,
    dispatch: editorState.dispatch,
    activeData: templateData.activeData,
    addToast: editorState.addToast,
  });
  
  // === EDITOR DE TEXTO ===
  const textEditor = useTextEditor({
    state: editorState.state,
    dispatch: editorState.dispatch,
    refs,
    templateData: {
      templateId: templateData.templateId,
      isReactTemplate: templateData.isReactTemplate,
      activeData: templateData.activeData,
    },
  });
  
  // === GERENCIAMENTO DE IMAGENS ===
  const imageManager = useImageManager({
    state: editorState.state,
    dispatch: editorState.dispatch,
    refs,
    templateData,
    addToast: editorState.addToast,
  });
  
  // === SAVE/EXPORT ===
  const saveExport = useSaveExport({
    state: editorState.state,
    dispatch: editorState.dispatch,
    refs,
    templateData,
    onSaveSuccess,
    addToast: editorState.addToast,
    onClose,
    autoDownload,
  });
  
  // === MONTA O STATE COMPLETO ===
  const state: EditorState = editorState.state;
  
  // === MONTA AS ACTIONS ===
  const actions: EditorActions = useMemo(() => ({
    // Canvas
    setZoom: canvasInteraction.setZoom,
    setPan: canvasInteraction.setPan,
    setIsDragging: canvasInteraction.setIsDragging,
    setDragStart: canvasInteraction.setDragStart,
    zoomIn: canvasInteraction.zoomIn,
    zoomOut: canvasInteraction.zoomOut,
    centerSlide: canvasInteraction.centerSlide,
    
    // Slides
    setFocusedSlide: slideManager.setFocusedSlide,
    setSelectedElement: slideManager.setSelectedElement,
    handleSlideClick: slideManager.handleSlideClick,
    handlePrevSlide: slideManager.handlePrevSlide,
    handleNextSlide: slideManager.handleNextSlide,
    
    // Edição
    updateEditedValue: textEditor.updateEditedValue,
    updateElementStyle: textEditor.updateElementStyle,
    getEditedValue: textEditor.getEditedValue,
    getElementStyle: textEditor.getElementStyle,
    clearAllSelections: textEditor.clearAllSelections,
    
    // Slides CRUD
    handleAddSlide: slideManager.handleAddSlide,
    handleCloneSlide: slideManager.handleCloneSlide,
    handleDeleteSlide: slideManager.handleDeleteSlide,
    handleBatchDelete: slideManager.handleBatchDelete,
    
    // Imagens
    handleBackgroundImageChange: imageManager.handleBackgroundImageChange,
    handleImageUpload: imageManager.handleImageUpload,
    handleAvatarUpload: imageManager.handleAvatarUpload,
    handleSearchImages: imageManager.handleSearchImages,
    handleGenerateAIImage: imageManager.handleGenerateAIImage,
    
    // Persistência
    handleSave: saveExport.handleSave,
    handleDownloadCurrent: saveExport.handleDownloadCurrent,
    handleDownloadAll: saveExport.handleDownloadAll,
    
    // UI
    toggleBatchMode: slideManager.toggleBatchMode,
    toggleSlideSelection: slideManager.toggleSlideSelection,
    setSearchKeyword: imageManager.setSearchKeyword,
    toggleSidebar: editorState.toggleSidebar,
    toggleProperties: editorState.toggleProperties,
    
    // Global Settings
    updateGlobalSettings: editorState.updateGlobalSettings,
    
    // Toolbar
    showFloatingToolbar: textEditor.showFloatingToolbar,
    closeFloatingToolbar: textEditor.closeFloatingToolbar,
    applyTextFormat: textEditor.applyTextFormat,
    updateFloatingToolbarRange: textEditor.updateFloatingToolbarRange,
        
    // Toast
    addToast: editorState.addToast,
    removeToast: editorState.removeToast,
  }), [
    canvasInteraction,
    slideManager,
    textEditor,
    imageManager,
    saveExport,
    editorState,
  ]);
  
  // === MONTA O CONTEXTO ===
  const contextValue: EditorContextType = useMemo(() => ({
    state,
    actions,
    refs,
    data: {
      carouselData,
      activeData: templateData.activeData,
      templateId: templateData.templateId,
      templateDimensions: templateData.templateDimensions,
      templateCompatibility: templateData.templateCompatibility,
      isReactTemplate: templateData.isReactTemplate,
      contentId: templateData.contentId,
    },
  }), [state, actions, refs, carouselData, templateData]);
  
  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
};

export default EditorContext;
