/**
 * EditorToolbar - Barra de ferramentas superior do editor
 */

import React, { memo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Save, 
  X, 
  Loader2,
  Package
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export const EditorToolbar: React.FC = memo(() => {
  const { state, actions } = useEditor();
  
  const { focusedSlide, hasUnsavedChanges, isSaving, isExporting, renderedSlides } = state;
  const slidesCount = renderedSlides.length;
  
  return (
    <div className={`h-14 bg-white border-b border-gray-light flex items-center justify-between px-4 flex-shrink-0 ${
      'px-4'
    }`}>
      {/* Navegação de slides */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={actions.handlePrevSlide}
            disabled={focusedSlide === 0}
            className={`p-1.5 rounded-lg hover:bg-gray-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              'p-1.5'
            }`}
            title="Slide anterior"
          >
            <ChevronLeft className={'text-gray-dark w-5 h-5'} />
          </button>
          
          <span className={`font-medium text-gray-dark text-center ${
            'text-sm min-w-[80px]'
          }`}>
            {focusedSlide + 1} / {slidesCount}
          </span>
          
          <button
            onClick={actions.handleNextSlide}
            disabled={focusedSlide === slidesCount - 1}
            className={`p-1.5 rounded-lg hover:bg-gray-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              'p-1.5'
            }`}
            title="Próximo slide"
          >
            <ChevronRight className={'text-gray-dark w-5 h-5'} />
          </button>
        </div>
        
        {/* Indicador de mudanças não salvas */}
        {hasUnsavedChanges && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            Não salvo
          </span>
        )}
      </div>
      
      {/* Ações */}
      <div className={'flex items-center gap-2'}>
        {/* Download slide atual */}
        <button
          onClick={actions.handleDownloadCurrent}
          disabled={isExporting}
          className={`flex items-center gap-2 text-sm font-medium text-gray-dark hover:bg-gray-light rounded-lg transition-colors disabled:opacity-50 ${
            'px-3 py-2'
          }`}
          title="Baixar slide atual"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Slide</span>
        </button>
        
        {/* Download todos */}
        <button
          onClick={actions.handleDownloadAll}
          disabled={isExporting}
          className={`flex items-center gap-2 text-sm font-medium text-gray-dark hover:bg-gray-light rounded-lg transition-colors disabled:opacity-50 ${
            'px-3 py-2'
          }`}
          title="Baixar todos os slides"
        >
          <Package className="w-4 h-4" />
          <span className="hidden sm:inline">Todos</span>
        </button>
        
        {/* Salvar */}
        <button
          onClick={actions.handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={`flex items-center gap-2 text-sm font-medium text-white bg-blue-DEFAULT hover:bg-blue-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            'px-4 py-2'
          }`}
          title="Salvar alterações"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Salvar</span>
          {/* Indicador para mudanças não salvas já está acima */}
        </button>
        
        {/* Fechar */}
        <button
          onClick={() => {
            if (hasUnsavedChanges) {
              if (confirm('Você tem alterações não salvas. Deseja sair mesmo assim?')) {
                // onClose será chamado pelo provider
              }
            }
          }}
          className={`text-gray-dark hover:bg-gray-light rounded-lg transition-colors ${
            'p-2'
          }`}
          title="Fechar editor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

EditorToolbar.displayName = 'EditorToolbar';
