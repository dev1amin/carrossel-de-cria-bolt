/**
 * MobileEditor - Layout mobile inspirado no Canva
 * - Canvas principal ocupando toda a tela
 * - Navegação por slides com setinhas laterais
 * - Menu contextual baseado na seleção
 * - Toolbar superior com ações principais
 */

import React, { memo, useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  MoreVertical, 
  Download, 
  Trash2, 
  Plus,
  ArrowLeft,
  Save,
  Loader2
} from 'lucide-react';
import { useEditor } from './context/EditorContext';
import { Canvas } from './components/Canvas';
import { FloatingToolbar } from './components/Toolbar';
import { MobileContextMenu } from './MobileContextMenu';
import Toast from '../../../Toast';

interface MobileEditorProps {
  onClose: () => void;
}

export const MobileEditor: React.FC<MobileEditorProps> = memo(({ onClose }) => {
  const { state, actions } = useEditor();
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  const {
    focusedSlide,
    renderedSlides,
    hasUnsavedChanges,
    isSaving,
    isExporting,
    toasts,
  } = state;
  
  const canNavigateUp = focusedSlide > 0;
  const canNavigateDown = focusedSlide < renderedSlides.length - 1;
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header Mobile */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 relative z-10">
        {/* Voltar */}
        <button
          onClick={() => {
            if (hasUnsavedChanges) {
              if (confirm('Você tem alterações não salvas. Deseja sair mesmo assim?')) {
                onClose();
              }
            } else {
              onClose();
            }
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        
        {/* Título */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-900">
            Slide {focusedSlide + 1} de {renderedSlides.length}
          </h1>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600">• Não salvo</span>
          )}
        </div>
        
        {/* Menu de ações */}
        <div className="relative">
          <button
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-6 h-6 text-gray-700" />
          </button>
          
          {/* Dropdown de ações */}
          {showActionsMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
              <button
                onClick={() => {
                  actions.handleSave();
                  setShowActionsMenu(false);
                }}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>Salvar</span>
              </button>
              
              <div className="h-px bg-gray-100 my-1" />
              
              <button
                onClick={() => {
                  actions.handleDownloadCurrent();
                  setShowActionsMenu(false);
                }}
                disabled={isExporting}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                <span>Baixar este slide</span>
              </button>
              
              <button
                onClick={() => {
                  actions.handleDownloadAll();
                  setShowActionsMenu(false);
                }}
                disabled={isExporting}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                <span>Baixar todos os slides</span>
              </button>
              
              <div className="h-px bg-gray-100 my-1" />
              
              <button
                onClick={() => {
                  actions.handleAddSlide();
                  setShowActionsMenu(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50"
              >
                <Plus className="w-5 h-5" />
                <span>Adicionar slide</span>
              </button>
              
              {renderedSlides.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja deletar este slide?')) {
                      actions.handleDeleteSlide(focusedSlide);
                    }
                    setShowActionsMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Deletar slide</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Canvas Principal */}
      <div className="flex-1 relative">
        {/* Canvas */}
        <Canvas />
        
        {/* Navegação de Slides - Setinhas Laterais */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
          <button
            onClick={actions.handlePrevSlide}
            disabled={!canNavigateUp}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
              canNavigateUp 
                ? 'bg-white text-gray-700 hover:bg-gray-50' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          
          <div className="w-12 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-xs font-medium text-gray-700">
              {focusedSlide + 1}
            </span>
          </div>
          
          <button
            onClick={actions.handleNextSlide}
            disabled={!canNavigateDown}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
              canNavigateDown 
                ? 'bg-white text-gray-700 hover:bg-gray-50' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
        
        {/* Overlay para fechar menus */}
        {showActionsMenu && (
          <div 
            className="absolute inset-0 z-10"
            onClick={() => setShowActionsMenu(false)}
          />
        )}
      </div>
      
      {/* Menu Contextual */}
      <MobileContextMenu />
      
      {/* Floating Toolbar */}
      <FloatingToolbar />
      
      {/* Toasts */}
      <Toast toasts={toasts} onRemove={actions.removeToast} />
    </div>
  );
});

MobileEditor.displayName = 'MobileEditor';