import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import type { CarouselData } from '../../../types/carousel';

interface SlideCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSlide: (index: number) => void;
  slides: string[];
  carouselData: CarouselData;
}

export const SlideCloneModal: React.FC<SlideCloneModalProps> = ({
  isOpen,
  onClose,
  onSelectSlide,
  slides,
  carouselData,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const data = carouselData as any;

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onSelectSlide(selectedIndex);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-light">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Copy className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-dark">Duplicar Slide</h2>
              <p className="text-sm text-gray-DEFAULT">Selecione qual slide deseja duplicar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-light rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-DEFAULT" />
          </button>
        </div>

        {/* Content - Grid de slides */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4">
            {slides.map((_, index) => {
              const conteudo = data?.conteudos?.[index] || {};
              const slideType = index === 0 ? 'Capa' : `Slide ${index + 1}`;
              const hasImage = !!conteudo?.imagem_fundo;
              const isSelected = selectedIndex === index;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`
                    relative p-3 rounded-xl border-2 transition-all duration-200 text-left
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 mb-2">
                    {hasImage ? (
                      <img 
                        src={conteudo.imagem_fundo} 
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-3xl font-bold text-gray-300">{index + 1}</span>
                      </div>
                    )}

                    {/* Overlay com número */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-white text-xs font-medium">
                      {slideType}
                    </div>
                  </div>

                  {/* Title preview */}
                  <p className="text-sm text-gray-dark font-medium line-clamp-2">
                    {conteudo?.title || 'Slide sem título'}
                  </p>
                  {conteudo?.subtitle && (
                    <p className="text-xs text-gray-DEFAULT line-clamp-1 mt-0.5">
                      {conteudo.subtitle}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-light bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIndex === null}
            className={`
              px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2
              ${selectedIndex !== null
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Copy className="w-4 h-4" />
            Duplicar Slide
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlideCloneModal;
