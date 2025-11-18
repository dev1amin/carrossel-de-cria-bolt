import React from 'react';
import { ChevronDown, ChevronRight, Layers as LayersIcon, Image as ImageIcon, Type } from 'lucide-react';
import type { CarouselData, ElementType } from '../../../types/carousel';

interface LayersSidebarProps {
  slides: string[];
  carouselData: CarouselData;
  expandedLayers: Set<number>;
  focusedSlide: number;
  selectedElement: { slideIndex: number; element: ElementType };
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onToggleLayer: (index: number) => void;
  onElementClick: (slideIndex: number, element: ElementType) => void;
  onSlideClick: (index: number) => void;
}

export const LayersSidebar: React.FC<LayersSidebarProps> = ({
  slides,
  carouselData,
  expandedLayers,
  focusedSlide,
  selectedElement,
  isMinimized = false,
  onToggleMinimize,
  onToggleLayer,
  onElementClick,
  onSlideClick,
}) => {
  if (isMinimized) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center shrink-0">
        <button
          onClick={onToggleMinimize}
          className="h-14 w-full flex items-center justify-center hover:bg-gray-100 border-b border-gray-200 transition-colors"
          title="Expandir Camadas"
        >
          <LayersIcon className="w-5 h-5 text-neutral-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center">
          <LayersIcon className="w-4 h-4 text-gray-600 mr-2" />
          <h3 className="text-gray-700 font-medium text-sm">Layers</h3>
        </div>
        <button
          onClick={onToggleMinimize}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Minimizar"
        >
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {slides.map((_, index) => {
          const conteudo = (carouselData as any).conteudos[index];
          const isExpanded = expandedLayers.has(index);
          const isFocused = focusedSlide === index;
          return (
            <div key={index} className={`border-b border-gray-200 ${isFocused ? 'bg-gray-50' : ''}`}>
              <button
                onClick={() => {
                  onToggleLayer(index);
                  onSlideClick(index);
                }}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-neutral-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-neutral-500" />
                  )}
                  <LayersIcon className="w-3 h-3 text-blue-400" />
                  <span className="text-gray-700 text-sm">Slide {index + 1}</span>
                </div>
              </button>
              {isExpanded && conteudo && (
                <div className="ml-3 border-l border-neutral-800">
                  <button
                    onClick={() => onElementClick(index, 'background')}
                    className={`w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-gray-100 transition-colors ${
                      selectedElement.slideIndex === index && selectedElement.element === 'background'
                        ? 'bg-blue-50 border-l-2 border-blue-500'
                        : ''
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 text-xs">Background Image/Video</span>
                  </button>
                  <button
                    onClick={() => onElementClick(index, 'title')}
                    className={`w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-gray-100 transition-colors ${
                      selectedElement.slideIndex === index && selectedElement.element === 'title'
                        ? 'bg-blue-50 border-l-2 border-blue-500'
                        : ''
                    }`}
                  >
                    <Type className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 text-xs">Title</span>
                  </button>
                  {conteudo.subtitle && (
                    <button
                      onClick={() => onElementClick(index, 'subtitle')}
                      className={`w-full px-3 py-1.5 flex items-center space-x-2 hover:bg-gray-100 transition-colors ${
                        selectedElement.slideIndex === index && selectedElement.element === 'subtitle'
                          ? 'bg-blue-50 border-l-2 border-blue-500'
                          : ''
                      }`}
                    >
                      <Type className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700 text-xs">Subtitle</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
