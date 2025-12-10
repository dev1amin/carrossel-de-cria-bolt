import React from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Save, 
  Undo2, 
  Redo2,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FolderDown,
  Loader2,
} from 'lucide-react';

interface EditorToolbarProps {
  slidesCount: number;
  currentSlide: number;
  zoom: number;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isExporting: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClose: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  slidesCount,
  currentSlide,
  zoom,
  hasUnsavedChanges,
  isSaving,
  isExporting,
  onZoomIn,
  onZoomOut,
  onPrevSlide,
  onNextSlide,
  onDownloadCurrent,
  onDownloadAll,
  onSave,
  onUndo,
  onRedo,
  onClose,
  canUndo = false,
  canRedo = false,
}) => {
  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="h-14 bg-white border-b border-gray-light flex items-center justify-between px-4 shrink-0">
      {/* Left section - Title and slide navigation */}
      <div className="flex items-center gap-4">
        <h2 className="text-gray-dark font-semibold text-base">
          Editor de Carrossel
        </h2>
        
        {/* Slide navigation */}
        <div className="flex items-center gap-2 bg-light rounded-lg px-2 py-1">
          <button
            onClick={onPrevSlide}
            disabled={currentSlide === 0}
            className="p-1 rounded hover:bg-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Slide anterior"
          >
            <ChevronLeft className="w-4 h-4 text-gray-dark" />
          </button>
          <span className="text-sm text-gray-dark min-w-[60px] text-center">
            <span className="font-medium">{currentSlide + 1}</span>
            <span className="text-gray-DEFAULT"> / {slidesCount}</span>
          </span>
          <button
            onClick={onNextSlide}
            disabled={currentSlide === slidesCount - 1}
            className="p-1 rounded hover:bg-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Próximo slide"
          >
            <ChevronRight className="w-4 h-4 text-gray-dark" />
          </button>
        </div>
      </div>

      {/* Center section - Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className="p-2 rounded-lg hover:bg-gray-light transition-colors"
          title="Diminuir zoom"
        >
          <ZoomOut className="w-4 h-4 text-gray-dark" />
        </button>
        
        <div className="bg-light px-3 py-1.5 rounded-lg min-w-[70px] text-center">
          <span className="text-sm font-medium text-gray-dark">{zoomPercentage}%</span>
        </div>
        
        <button
          onClick={onZoomIn}
          className="p-2 rounded-lg hover:bg-gray-light transition-colors"
          title="Aumentar zoom"
        >
          <ZoomIn className="w-4 h-4 text-gray-dark" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-light mx-2" />

        {/* Undo/Redo */}
        {onUndo && onRedo && (
          <>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-lg hover:bg-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Desfazer (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4 text-gray-dark" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-lg hover:bg-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Refazer (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4 text-gray-dark" />
            </button>
            <div className="w-px h-6 bg-gray-light mx-2" />
          </>
        )}
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        {/* Save button */}
        <button
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${hasUnsavedChanges && !isSaving
              ? 'bg-blue-DEFAULT text-white hover:bg-blue-dark shadow-sm'
              : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }
          `}
          title={hasUnsavedChanges ? 'Salvar alterações' : 'Nenhuma alteração para salvar'}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </>
          )}
        </button>

        {/* Download dropdown */}
        <div className="relative group">
          <button
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-light hover:bg-gray-light/70 text-gray-dark text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Exportar</span>
          </button>
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-light opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <button
              onClick={onDownloadCurrent}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-dark hover:bg-gray-light/50 transition-colors rounded-t-lg"
            >
              <FileDown className="w-4 h-4" />
              <span>Slide atual (PNG)</span>
            </button>
            <button
              onClick={onDownloadAll}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-dark hover:bg-gray-light/50 transition-colors rounded-b-lg"
            >
              <FolderDown className="w-4 h-4" />
              <span>Todos os slides (ZIP)</span>
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-light transition-colors ml-2"
          title="Fechar editor (Esc)"
        >
          <X className="w-5 h-5 text-gray-dark" />
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;
