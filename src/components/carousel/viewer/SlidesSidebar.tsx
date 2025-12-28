import React, { useContext } from 'react';
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

// ✅ Context opcional (não explode fora do Provider)
import EditorContext from "./v2/context/EditorContext";

interface SlideCardProps {
  index: number;
  conteudo: {
    id?: string;
    layoutIndex?: number;
    title?: string;
    subtitle?: string;
    imagem_fundo?: string;
    thumbnail_url?: string;
  };
  isActive: boolean;
  isGenerating?: boolean;
  hasError?: boolean;
  isBatchMode: boolean;
  isSelected: boolean;
  canDelete: boolean;
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
  canDelete,
  onSelect,
  onDelete,
  onBatchToggle,
}) => {
  const slideType = index === 0 ? 'COVER' : 'CONTENT';
  const hasImage = !!(conteudo?.thumbnail_url || conteudo?.imagem_fundo);
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
          if (canDelete) onDelete();
        }}
        disabled={!canDelete}
        className={`
          absolute top-2 right-2 p-1.5 rounded-md bg-white shadow-sm border border-gray-light transition-all z-20
          ${canDelete ? 'opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-200' : 'opacity-40 cursor-not-allowed'}
        `}
        title={canDelete ? "Excluir slide" : "Não é possível deletar o último slide"}
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

        {/* Status indicators */}
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
            src={conteudo.thumbnail_url || conteudo.imagem_fundo}
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
  // ⚠️ Esses props viram fallback. Se estiver dentro do EditorProvider, ele usa o Context.
  slides: string[];
  carouselData: CarouselData;

  focusedSlide: number;
  generatingSlides?: Set<number>;
  errorSlides?: Set<number>;
  batchMode: boolean;
  selectedSlides: Set<number>;
  isMinimized?: boolean;
  isMobile?: boolean; // Nova prop para mobile
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
  slides: slidesProp,
  carouselData: carouselDataProp,
  focusedSlide: focusedSlideProp,
  generatingSlides = new Set(),
  errorSlides = new Set(),
  batchMode: batchModeProp,
  selectedSlides: selectedSlidesProp,
  isMinimized = false,
  isMobile = false,
  onToggleMinimize,
  onSlideClick,
  onAddSlide,
  onDeleteSlide,
  onToggleBatchMode,
  onToggleSlideSelection,
  onBatchDelete,
  onBackToSetup,
}) => {
  const ctx = useContext(EditorContext);

  // ✅ Fonte real de verdade (Context) — fallback para props se não tiver Provider
  const effectiveSlides = ctx?.state?.renderedSlides ?? slidesProp;
  const effectiveFocused = ctx?.state?.focusedSlide ?? focusedSlideProp;
  const effectiveBatchMode = ctx?.state?.batchMode ?? batchModeProp;
  const effectiveSelectedSlides = ctx?.state?.selectedSlides ?? selectedSlidesProp;
  const effectiveEditedContent = ctx?.state?.editedContent ?? {};
  const effectiveActiveData = (ctx?.data?.activeData ?? carouselDataProp) as any;

  const conteudos: any[] = effectiveActiveData?.conteudos ?? [];
  const canDelete = effectiveSlides.length > 1;

  // Preview mesclado (pega edits)
  const getPreviewConteudo = (index: number) => {
    const c = conteudos?.[index] ?? {};
    return {
      ...c,
      title: effectiveEditedContent[`${index}-title`] ?? c.title,
      subtitle: effectiveEditedContent[`${index}-subtitle`] ?? c.subtitle,
      imagem_fundo: effectiveEditedContent[`${index}-background`] ?? c.imagem_fundo,
    };
  };

  // Layout mobile: em modo minimizado, mostra horizontal no topo
  if (isMobile) {
    if (isMinimized) {
      return (
        <div className="h-16 bg-white border-b border-gray-light flex items-center shrink-0">
          <button
            onClick={onToggleMinimize}
            className="h-full px-4 flex items-center justify-center hover:bg-gray-light border-r border-gray-light transition-colors"
            title="Expandir Slides"
          >
            <ChevronLeft className="w-5 h-5 text-gray-DEFAULT -rotate-90" />
          </button>
          
          <div className="flex-1 overflow-x-auto py-2 px-2 flex space-x-2 mobile-scroll">
            {effectiveSlides.map((_, index) => {
              const c = conteudos?.[index];
              const key = c?.id ?? `${index}-${effectiveSlides.length}`;
              return (
                <button
                  key={key}
                  onClick={() => onSlideClick(index)}
                  className={`
                    w-12 h-12 rounded-md flex items-center justify-center text-xs font-bold transition-all border flex-shrink-0
                    ${effectiveFocused === index
                      ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                    }
                  `}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Layout mobile expandido: sidebar cobrindo parte da tela
    return (
      <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-light border-r border-gray-light flex flex-col shrink-0 z-30 shadow-lg">
        {/* Header Mobile */}
        <div className="h-16 bg-white border-b border-gray-light flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h3 className="text-gray-dark font-semibold text-base">Slides</h3>
            <span className="text-sm text-gray-DEFAULT bg-gray-light px-2 py-1 rounded-full">
              {effectiveSlides.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleBatchMode}
              className={`
                p-2 rounded transition-colors
                ${effectiveBatchMode ? 'bg-blue-DEFAULT text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}
              `}
              title="Modo de seleção"
            >
              <CheckSquare className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleMinimize}
              className="p-2 hover:bg-gray-light rounded transition-colors"
              title="Minimizar"
            >
              <ChevronLeft className="w-5 h-5 text-gray-DEFAULT rotate-90" />
            </button>
          </div>
        </div>

        {/* Resto do conteúdo igual ao desktop, mas com espaçamentos mobile */}
        {effectiveBatchMode && effectiveSelectedSlides.size > 0 && (
          <div className="px-4 py-3 bg-blue-light/30 border-b border-gray-light flex items-center justify-between">
            <span className="text-sm text-blue-dark font-medium">
              {effectiveSelectedSlides.size} selecionado(s)
            </span>
            <button
              onClick={onBatchDelete}
              className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        )}

        {/* Slides list mobile */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 mobile-scroll">
          {effectiveSlides.map((_, index) => {
            const conteudo = getPreviewConteudo(index);
            const key = conteudo?.id ?? `${index}-${effectiveSlides.length}`;

            return (
              <SlideCard
                key={key}
                index={index}
                conteudo={conteudo}
                isActive={effectiveFocused === index}
                isGenerating={generatingSlides.has(index)}
                hasError={errorSlides.has(index)}
                isBatchMode={effectiveBatchMode}
                isSelected={effectiveSelectedSlides.has(index)}
                canDelete={canDelete}
                onSelect={() => onSlideClick(index)}
                onDelete={() => onDeleteSlide?.(index)}
                onBatchToggle={() => onToggleSlideSelection(index)}
              />
            );
          })}

          {/* Add slide button mobile */}
          <button
            onClick={onAddSlide}
            className="w-full p-5 rounded-lg border-2 border-dashed border-gray-light hover:border-blue-DEFAULT hover:bg-blue-light/10 transition-all flex items-center justify-center gap-3 text-gray-DEFAULT hover:text-blue-DEFAULT"
          >
            <Plus className="w-6 h-6" />
            <span className="text-base font-medium">Adicionar Slide</span>
          </button>
        </div>

        {/* Footer mobile */}
        <div className="p-4 border-t border-gray-light bg-white">
          <button
            onClick={onBackToSetup}
            className="w-full py-3 px-4 rounded-lg bg-gray-light hover:bg-gray-light/70 text-gray-dark text-base font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Setup
          </button>
        </div>
      </div>
    );
  }

  // Layout Desktop
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

        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1.5 w-full">
          {effectiveSlides.map((_, index) => {
            const c = conteudos?.[index];
            const key = c?.id ?? `${index}-${effectiveSlides.length}`;
            return (
              <button
                key={key}
                onClick={() => onSlideClick(index)}
                className={`
                  w-full aspect-square rounded-md flex items-center justify-center text-xs font-bold transition-all border
                  ${effectiveFocused === index
                    ? 'bg-blue-DEFAULT text-white border-blue-DEFAULT'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                  }
                `}
              >
                {index + 1}
              </button>
            );
          })}
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
            {effectiveSlides.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleBatchMode}
            className={`
              p-1.5 rounded transition-colors
              ${effectiveBatchMode ? 'bg-blue-DEFAULT text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}
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
      {effectiveBatchMode && effectiveSelectedSlides.size > 0 && (
        <div className="px-3 py-2 bg-blue-light/30 border-b border-gray-light flex items-center justify-between">
          <span className="text-xs text-blue-dark font-medium">
            {effectiveSelectedSlides.size} selecionado(s)
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
        {effectiveSlides.map((_, index) => {
          const conteudo = getPreviewConteudo(index);
          const key = conteudo?.id ?? `${index}-${effectiveSlides.length}`;

          return (
            <SlideCard
              key={key}
              index={index}
              conteudo={conteudo}
              isActive={effectiveFocused === index}
              isGenerating={generatingSlides.has(index)}
              hasError={errorSlides.has(index)}
              isBatchMode={effectiveBatchMode}
              isSelected={effectiveSelectedSlides.has(index)}
              canDelete={canDelete}
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