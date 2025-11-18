import React from 'react';
import { X, ZoomIn, ZoomOut, Download, Save } from 'lucide-react';

interface TopBarProps {
  slidesCount: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownload: () => void;
  onClose: () => void;
  onSave?: () => void;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  slidesCount,
  zoom,
  onZoomIn,
  onZoomOut,
  onDownload,
  onClose,
  onSave,
  hasUnsavedChanges = false,
  isSaving = false,
}) => {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center space-x-4">
        <h2 className="text-gray-900 font-semibold">Editor de Carrossel</h2>
        <div className="text-gray-600 text-sm">{slidesCount} slides</div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onZoomOut}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded transition-colors"
          title="Reduzir Zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="bg-gray-100 text-gray-900 px-3 py-1.5 rounded text-xs min-w-[70px] text-center">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={onZoomIn}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded transition-colors"
          title="Aumentar Zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        {onSave && (
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-1.5 rounded transition-colors flex items-center space-x-2 text-sm font-medium ${
              hasUnsavedChanges && !isSaving
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
            }`}
            title={hasUnsavedChanges ? 'Salvar Alterações' : 'Nenhuma alteração para salvar'}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        )}
        <button
          onClick={onDownload}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition-colors flex items-center space-x-2 text-sm"
          title="Baixar Todos os Slides"
        >
          <Download className="w-4 h-4" />
          <span>Baixar</span>
        </button>
        <button
          onClick={onClose}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded transition-colors"
          title="Fechar (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
