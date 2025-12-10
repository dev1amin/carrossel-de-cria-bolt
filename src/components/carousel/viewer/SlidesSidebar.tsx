import React from 'react';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Type, 
  ChevronLeft,
  ArrowLeft,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { CarouselData } from '../../../types/carousel';

interface SlideCardProps {
  index: number;
  conteudo: {
    title?: string;
    subtitle?: string;
    imagem_fundo?: string;
  };
  isActive: boolean;
  isGenerating?: boolean;
  hasError?: boolean;
  isBatchMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onBatchToggle: () => void;
}

const SlideCard: React.FC<SlideCardProps> = ({
  index,
  conteudo,
  isActive,
  isGenerating = false,
  hasError = false,
  isBatchMode,
  isSelected,
  onSelect,
  onDelete,
  onBatchToggle,
}) => {
  const slideType = index === 0 ? 'COVER' : 'CONTENT';
  const hasImage = !!conteudo?.imagem_fundo;
  const previewText = conteudo?.title || conteudo?.subtitle || 'Slide vazio';

  return (
    <div
      onClick={onSelect}
      className={`
        relative p-3 rounded-lg cursor-pointer transition-all duration-200 group
        ${isActive 
          ? 'bg-blue-50 border-2 border-blue-DEFAULT shadow-lg' 
          : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
        }
        ${hasError ? 'border-red-500 bg-red-50' : ''}
        ${isGenerating ? 'animate-pulse' : ''}
      `}
    >
      {/* Batch mode checkbox */}
      {isBatchMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBatchToggle();
          }}
          className="absolute top-2 left-2 z-10"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-blue-DEFAULT" />
          ) : (
            <Square className="w-5 h-5 text-gray-DEFAULT" />
          )}
        </button>
      )}

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 bg-white shadow-sm border border-gray-light hover:bg-red-50 hover:border-red-200 transition-all z-20"
        title="Excluir slide"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>

      {/* Slide number and type */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`
            text-xs font-bold px-2 py-0.5 rounded
            ${isActive ? 'bg-blue-DEFAULT text-white' : 'bg-gray-100 text-gray-700 border border-gray-200'}
          `}>
            {index + 1}
          </span>
          <span className={`
            text-[10px] font-medium uppercase tracking-wide
            ${slideType === 'COVER' ? 'text-blue-dark' : 'text-gray-DEFAULT'}
          `}>
            {slideType}
          </span>
        </div>

        {/* Status indicators - hidden on hover to not conflict with delete */}
        <div className="flex items-center gap-1 group-hover:opacity-0 transition-opacity">
          {isGenerating && (
            <Loader2 className="w-4 h-4 text-blue-DEFAULT animate-spin" />
          )}
          {hasError && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          {hasImage && !isGenerating && !hasError && (
            <ImageIcon className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Preview thumbnail */}
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-light mb-2">
        {hasImage ? (
          <img 
            src={conteudo.imagem_fundo} 
            alt={`Slide ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Type className="w-8 h-8 text-gray-DEFAULT" />
          </div>
        )}

        {/* Loading overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Text preview */}
      <p className="text-xs text-gray-dark line-clamp-2 leading-relaxed">
        {previewText}
      </p>
    </div>
  );
};

interface SlidesSidebarProps {
  slides: string[];
  carouselData: CarouselData;
  focusedSlide: number;
  generatingSlides?: Set<number>;
  errorSlides?: Set<number>;
  batchMode: boolean;
  selectedSlides: Set<number>;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onSlideClick: (index: number) => void;
  onAddSlide?: () => void;
  onDeleteSlide?: (index: number) => void;
  onToggleBatchMode: () => void;
  onToggleSlideSelection: (index: number) => void;
  onBatchDelete?: () => void;
  onBackToSetup?: () => void;
}

export const SlidesSidebar: React.FC<SlidesSidebarProps> = ({
  slides,
  carouselData,
  focusedSlide,
  generatingSlides = new Set(),
  errorSlides = new Set(),
  batchMode,
  selectedSlides,
  isMinimized = false,
  onToggleMinimize,
  onSlideClick,
  onAddSlide,
  onDeleteSlide,
  onToggleBatchMode,
  onToggleSlideSelection,
  onBatchDelete,
  onBackToSetup,
}) => {
  const data = carouselData as any;

  if (isMinimized) {
    return (
      <div className="w-14 bg-white border-r border-gray-light flex flex-col items-center shrink-0">
        <button
          onClick={onToggleMinimize}
          className="h-14 w-full flex items-center justify-center hover:bg-gray-light border-b border-gray-light transition-colors"
          title="Expandir Slides"
        >
          <ChevronLeft className="w-5 h-5 text-gray-DEFAULT rotate-180" />
        </button>
        
        {/* Mini slide indicators */}
        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1.5 w-full">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => onSlideClick(index)}
              className={`
                w-full aspect-square rounded-md flex items-center justify-center text-xs font-bold transition-all border
                ${focusedSlide === index 
                  ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT' 
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                }
              `}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[264px] bg-light border-r border-gray-light flex flex-col shrink-0">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-light flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h3 className="text-gray-dark font-semibold text-sm">Slides</h3>
          <span className="text-xs text-gray-DEFAULT bg-gray-light px-2 py-0.5 rounded-full">
            {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleBatchMode}
            className={`
              p-1.5 rounded transition-colors
              ${batchMode ? 'bg-blue-DEFAULT text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}
            `}
            title="Modo de seleção"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMinimize}
            className="p-1.5 hover:bg-gray-light rounded transition-colors"
            title="Minimizar"
          >
            <ChevronLeft className="w-4 h-4 text-gray-DEFAULT" />
          </button>
        </div>
      </div>

      {/* Batch actions bar */}
      {batchMode && selectedSlides.size > 0 && (
        <div className="px-3 py-2 bg-blue-light/30 border-b border-gray-light flex items-center justify-between">
          <span className="text-xs text-blue-dark font-medium">
            {selectedSlides.size} selecionado(s)
          </span>
          <button
            onClick={onBatchDelete}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Excluir
          </button>
        </div>
      )}

      {/* Slides list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {slides.map((_, index) => {
          const conteudo = data?.conteudos?.[index] || {};
          return (
            <SlideCard
              key={index}
              index={index}
              conteudo={conteudo}
              isActive={focusedSlide === index}
              isGenerating={generatingSlides.has(index)}
              hasError={errorSlides.has(index)}
              isBatchMode={batchMode}
              isSelected={selectedSlides.has(index)}
              onSelect={() => onSlideClick(index)}
              onDelete={() => onDeleteSlide?.(index)}
              onBatchToggle={() => onToggleSlideSelection(index)}
            />
          );
        })}

        {/* Add slide button */}
        <button
          onClick={onAddSlide}
          className="w-full p-4 rounded-lg border-2 border-dashed border-gray-light hover:border-blue-DEFAULT hover:bg-blue-light/10 transition-all flex items-center justify-center gap-2 text-gray-DEFAULT hover:text-blue-DEFAULT"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">Adicionar Slide</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-light bg-white">
        <button
          onClick={onBackToSetup}
          className="w-full py-2.5 px-4 rounded-lg bg-gray-light hover:bg-gray-light/70 text-gray-dark text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Setup
        </button>
      </div>
    </div>
  );
};

export default SlidesSidebar;
