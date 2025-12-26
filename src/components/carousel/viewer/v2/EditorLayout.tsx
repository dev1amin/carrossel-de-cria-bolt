/**
 * EditorLayout - Layout principal do editor (compartilhado entre mobile/desktop)
 */

import React, { memo } from 'react';
import { useEditor } from './context/EditorContext';
import { Canvas } from './components/Canvas';
import { EditorToolbar, FloatingToolbar } from './components/Toolbar';
import Toast from '../../../Toast';

// Componentes temporários - serão migrados depois
import { SlidesSidebar } from '../SlidesSidebar';
import { RightPropertiesPanel } from '../RightPropertiesPanel';
import { SlideCloneModal } from '../SlideCloneModal';

interface EditorLayoutProps {
  isMobile: boolean;
  onClose: () => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = memo(({ isMobile, onClose }) => {
  const { state, actions, refs, data } = useEditor();
  
  const {
    focusedSlide,
    renderedSlides,
    batchMode,
    selectedSlides,
    isSidebarMinimized,
    isPropertiesMinimized,
    globalSettings,
    toasts,
    selectedElement,
    editedContent,
    searchKeyword,
    searchResults,
    isSearching,
    uploadedImages,
    isCloneModalOpen,
  } = state;
  
  const {
    carouselData,
    activeData,
    templateCompatibility,
  } = data;
  
  // Conjuntos para estados de loading
  const generatingSlides = new Set<number>();
  const errorSlides = new Set<number>();
  
  // Se dados inválidos, mostra erro
  if (!activeData || !Array.isArray((activeData as any).conteudos)) {
    return (
      <div className="fixed inset-0 bg-light z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md text-center border border-gray-light">
          <h2 className="text-gray-dark text-xl font-bold mb-4">Erro ao carregar carrossel</h2>
          <p className="text-gray-DEFAULT mb-6">
            Os dados do carrossel estão em um formato incompatível.
          </p>
          <button
            onClick={onClose}
            className="bg-blue-DEFAULT text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-dark transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }
  
  // Layout Mobile (em desenvolvimento - por enquanto usa mesmo que desktop)
  if (isMobile) {
    // TODO: Implementar layout mobile específico
    // Por enquanto usa o layout desktop
  }
  
  // Layout Desktop
  return (
    <div
      className="fixed inset-0 bg-light flex z-50"
      style={{ left: window.innerWidth >= 768 ? '81px' : '0' }}
    >
      {/* SIDEBAR ESQUERDA - Lista de Slides */}
      <SlidesSidebar
        slides={renderedSlides}
        carouselData={carouselData}
        focusedSlide={focusedSlide}
        generatingSlides={generatingSlides}
        errorSlides={errorSlides}
        batchMode={batchMode}
        selectedSlides={selectedSlides}
        isMinimized={isSidebarMinimized}
        onToggleMinimize={actions.toggleSidebar}
        onSlideClick={actions.handleSlideClick}
        onAddSlide={actions.handleAddSlide}
        onDeleteSlide={actions.handleDeleteSlide}
        onToggleBatchMode={actions.toggleBatchMode}
        onToggleSlideSelection={actions.toggleSlideSelection}
        onBatchDelete={actions.handleBatchDelete}
        onBackToSetup={onClose}
      />

      {/* ÁREA CENTRAL - Canvas + Toolbar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar superior */}
        <EditorToolbar />

        {/* Canvas Preview */}
        <Canvas />
      </div>

      {/* PAINEL DIREITO - Propriedades */}
      <RightPropertiesPanel
        selectedElement={selectedElement}
        carouselData={carouselData}
        editedContent={editedContent}
        isLoadingProperties={false}
        searchKeyword={searchKeyword}
        searchResults={searchResults}
        isSearching={isSearching}
        uploadedImages={uploadedImages}
        isMinimized={isPropertiesMinimized}
        templateCompatibility={templateCompatibility}
        globalSettings={globalSettings}
        iframeRefs={refs.iframeRefs}
        onToggleMinimize={actions.toggleProperties}
        onUpdateEditedValue={actions.updateEditedValue}
        onUpdateElementStyle={actions.updateElementStyle}
        onBackgroundImageChange={actions.handleBackgroundImageChange}
        onAvatarUpload={actions.handleAvatarUpload}
        onSearchKeywordChange={actions.setSearchKeyword}
        onSearchImages={actions.handleSearchImages}
        onImageUpload={actions.handleImageUpload}
        onGenerateAIImage={actions.handleGenerateAIImage}
        getElementStyle={actions.getElementStyle}
        getEditedValue={actions.getEditedValue}
        onUpdateGlobalSettings={actions.updateGlobalSettings}
      />

      {/* Floating Toolbar */}
      <FloatingToolbar />

      {/* Modal para clonar slide */}
      <SlideCloneModal
        isOpen={isCloneModalOpen}
        onClose={() => actions.setSelectedElement({ slideIndex: focusedSlide, element: null })}
        onSelectSlide={actions.handleCloneSlide}
        slides={renderedSlides}
        carouselData={carouselData}
      />

      {/* Toasts */}
      <Toast toasts={toasts} onRemove={actions.removeToast} />
    </div>
  );
});

EditorLayout.displayName = 'EditorLayout';
