/**
 * ReactCanvasPreview - Canvas de preview que renderiza slides React
 * 
 * Esta versão substitui iframes por ReactSlideRenderer para:
 * - Melhor performance
 * - Texto mais nítido
 * - Download direto via html-to-image
 */
import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback, useEffect } from 'react';
import { Minus, Plus, GripHorizontal, Move } from 'lucide-react';
import { ReactSlideRenderer, getTemplateDimensions } from '../../../templates/react';
import type { EditableElementType } from '../../../templates/react';

interface SlideData {
  title?: string;
  subtitle?: string;
  imagem_fundo?: string;
  imagem_fundo2?: string;
  imagem_fundo3?: string;
  thumbnail_url?: string;
  [key: string]: any;
}

interface DadosGerais {
  nome?: string;
  arroba?: string;
  foto_perfil?: string;
  template?: string;
}

interface ElementStyles {
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: string;
  color?: string;
  objectPosition?: string;
}

export interface ReactCanvasPreviewProps {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  slideWidth: number;
  slideHeight: number;
  slideIndex: number;
  templateId: string;
  slideData: SlideData;
  dadosGerais: DadosGerais;
  elementStyles?: Record<string, ElementStyles>;
  globalSettings?: {
    theme?: 'light' | 'dark';
    accentColor?: string;
    showSlideNumber?: boolean;
    showVerifiedBadge?: boolean;
    headerScale?: number;
    fontStyle?: string;
    fontScale?: number;
  };
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  slideRef?: (el: HTMLDivElement | null) => void; // Ref callback para capturar o elemento do slide
  selectedElement?: { slideIndex: number; element: EditableElementType };
  onWheel?: (e: React.WheelEvent<HTMLDivElement>) => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onBackgroundClick?: () => void;
  onElementClick?: (elementType: EditableElementType, slideIndex: number, event?: React.MouseEvent) => void;
  onElementDoubleClick?: (elementType: EditableElementType, slideIndex: number, element: HTMLElement) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  setZoom: (zoom: number) => void;
  onImageHeightChange?: (slideIndex: number, height: number) => void;
  onImagePositionChange?: (slideIndex: number, position: string) => void;
}

export interface ReactCanvasPreviewRef {
  getSlideElement: () => HTMLElement | null;
}

export const ReactCanvasPreview = forwardRef<ReactCanvasPreviewRef, ReactCanvasPreviewProps>(({
  zoom,
  pan,
  isDragging,
  slideWidth,
  slideHeight,
  slideIndex,
  templateId,
  slideData,
  dadosGerais,
  elementStyles = {},  globalSettings,  containerRef,
  slideRef: externalSlideRef,
  selectedElement,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onBackgroundClick,
  onElementClick,
  onElementDoubleClick,
  onZoomIn,
  onZoomOut,
  setZoom,
  onImageHeightChange,
  onImagePositionChange,
}, ref) => {
  const internalSlideRef = useRef<HTMLDivElement>(null);
  const zoomPercentage = Math.round(zoom * 100);
  
  // Estado para pinças de redimensionamento
  const [imageElement, setImageElement] = useState<HTMLElement | null>(null);
  const [isDraggingPinch, setIsDraggingPinch] = useState<'top' | 'bottom' | 'image' | null>(null);
  const dragStartY = useRef(0);
  const startHeight = useRef(0);
  const startPositionY = useRef(50);
  
  // Callback ref que combina ref interna e externa
  const setSlideRef = (el: HTMLDivElement | null) => {
    (internalSlideRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (externalSlideRef) {
      externalSlideRef(el);
    }
  };
  
  // Obtém dimensões do template
  const templateDims = getTemplateDimensions(templateId.replace('-react', ''));
  
  // Encontra o elemento de imagem selecionado
  useEffect(() => {
    if (selectedElement?.element === 'background' || selectedElement?.element === 'image') {
      const slideEl = internalSlideRef.current;
      if (slideEl) {
        const imgEl = slideEl.querySelector('[data-editable="image"]') as HTMLElement;
        setImageElement(imgEl);
        console.log('📷 Elemento de imagem encontrado:', imgEl);
      }
    } else {
      setImageElement(null);
    }
  }, [selectedElement]);
  
  // Handlers para as pinças
  const handlePinchStart = useCallback((type: 'top' | 'bottom' | 'image', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPinch(type);
    dragStartY.current = e.clientY;
    
    if (imageElement) {
      startHeight.current = imageElement.offsetHeight;
      
      // Extrai posição Y atual
      const style = window.getComputedStyle(imageElement);
      const objPos = style.objectPosition || 'center center';
      const parts = objPos.split(' ');
      const yPart = parts[1] || '50%';
      startPositionY.current = parseFloat(yPart.replace('%', '')) || 50;
    }
    
    console.log('📌 Pinch início:', type, { startHeight: startHeight.current, startPositionY: startPositionY.current });
  }, [imageElement]);
  
  // Efeito para drag das pinças
  useEffect(() => {
    if (!isDraggingPinch || !imageElement) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY.current;
      
      if (isDraggingPinch === 'top') {
        const newHeight = Math.max(200, Math.min(1000, startHeight.current - deltaY));
        imageElement.style.height = `${newHeight}px`;
        onImageHeightChange?.(slideIndex, newHeight);
        console.log('📌 Pinça TOP: altura', newHeight);
      } else if (isDraggingPinch === 'bottom') {
        const newHeight = Math.max(200, Math.min(1000, startHeight.current + deltaY));
        imageElement.style.height = `${newHeight}px`;
        onImageHeightChange?.(slideIndex, newHeight);
        console.log('📌 Pinça BOTTOM: altura', newHeight);
      } else if (isDraggingPinch === 'image') {
        const newPositionY = Math.max(0, Math.min(100, startPositionY.current - deltaY / 5));
        const positionStr = `center ${newPositionY}%`;
        imageElement.style.objectPosition = positionStr;
        onImagePositionChange?.(slideIndex, positionStr);
        console.log('🖼️ Drag imagem: posição', positionStr);
      }
    };
    
    const handleMouseUp = () => {
      console.log('✅ Fim do drag pinça');
      setIsDraggingPinch(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPinch, imageElement, slideIndex, onImageHeightChange, onImagePositionChange]);
  
  // Calcula posição das pinças
  const getPincherPositions = useCallback(() => {
    if (!imageElement || !internalSlideRef.current) return null;
    
    const imgRect = imageElement.getBoundingClientRect();
    const slideRect = internalSlideRef.current.getBoundingClientRect();
    
    // Posição relativa ao slide
    const top = (imgRect.top - slideRect.top) / zoom;
    const left = (imgRect.left - slideRect.left) / zoom;
    const width = imgRect.width / zoom;
    const height = imgRect.height / zoom;
    
    return { top, left, width, height };
  }, [imageElement, zoom]);
  
  const pincherPositions = getPincherPositions();
  
  // Expõe método para obter o elemento do slide (para download)
  useImperativeHandle(ref, () => ({
    getSlideElement: () => internalSlideRef.current,
  }), []);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-light">
      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative min-h-0"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onClick={(e) => {
          if (
            e.target === e.currentTarget ||
            (typeof (e.target as HTMLElement).className === 'string' &&
              (e.target as HTMLElement).className.includes('canvas-bg'))
          ) {
            onBackgroundClick?.();
          }
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none canvas-bg">
          <div 
            className="w-full h-full" 
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Slide container */}
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            zoom: zoom,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out, zoom 0.2s ease-out',
            left: 0,
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Single slide preview - React version */}
          <div
            ref={setSlideRef}
            id={`slide-preview-${slideIndex}`}
            className="relative bg-white rounded-xl shadow-2xl overflow-hidden flex-shrink-0"
            style={{ 
              width: `${templateDims.width}px`, 
              height: `${templateDims.height}px`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <ReactSlideRenderer
              templateId={templateId}
              slideIndex={slideIndex}
              slideData={slideData}
              dadosGerais={dadosGerais}
              styles={elementStyles}
              globalSettings={globalSettings}
              containerWidth={templateDims.width}
              containerHeight={templateDims.height}
              onElementClick={onElementClick}
              onElementDoubleClick={onElementDoubleClick}
            />
            
            {/* Pinças de redimensionamento de imagem */}
            {pincherPositions && imageElement && (selectedElement?.element === 'background' || selectedElement?.element === 'image') && (
              <>
                {/* Pinça superior */}
                <div
                  className="absolute z-[1001] flex items-center justify-center cursor-ns-resize"
                  style={{
                    top: pincherPositions.top - 10,
                    left: pincherPositions.left + pincherPositions.width / 2 - 30,
                    width: 60,
                    height: 20,
                    backgroundColor: 'rgba(65, 103, 178, 0.9)',
                    borderRadius: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                  onMouseDown={(e) => handlePinchStart('top', e)}
                  title="Arraste para redimensionar"
                >
                  <GripHorizontal className="w-4 h-4 text-white" />
                </div>
                
                {/* Pinça inferior */}
                <div
                  className="absolute z-[1001] flex items-center justify-center cursor-ns-resize"
                  style={{
                    top: pincherPositions.top + pincherPositions.height - 10,
                    left: pincherPositions.left + pincherPositions.width / 2 - 30,
                    width: 60,
                    height: 20,
                    backgroundColor: 'rgba(65, 103, 178, 0.9)',
                    borderRadius: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                  onMouseDown={(e) => handlePinchStart('bottom', e)}
                  title="Arraste para redimensionar"
                >
                  <GripHorizontal className="w-4 h-4 text-white" />
                </div>
                
                {/* Área de drag para ajustar posição */}
                <div
                  className="absolute z-[1000] cursor-move"
                  style={{
                    top: pincherPositions.top + 30,
                    left: pincherPositions.left + 30,
                    width: pincherPositions.width - 60,
                    height: pincherPositions.height - 60,
                    background: isDraggingPinch === 'image' ? 'rgba(65, 103, 178, 0.1)' : 'transparent',
                    borderRadius: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseDown={(e) => handlePinchStart('image', e)}
                  title="Arraste para ajustar posição da imagem"
                >
                  {isDraggingPinch === 'image' && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="bg-blue-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-lg">
                        <Move className="w-4 h-4" />
                        Arrastando...
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Zoom controls - bottom center */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-light px-3 py-2">
            <button
              onClick={onZoomOut}
              className="p-1.5 rounded-lg hover:bg-gray-light transition-colors text-gray-dark"
              title="Diminuir zoom"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            {/* Zoom slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={100}
                value={zoomPercentage}
                onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
                className="w-24 h-1.5 bg-gray-light rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-blue-DEFAULT
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                "
              />
              <span className="text-sm font-medium text-gray-dark min-w-[48px] text-center">
                {zoomPercentage}%
              </span>
            </div>

            <button
              onClick={onZoomIn}
              className="p-1.5 rounded-lg hover:bg-gray-light transition-colors text-gray-dark"
              title="Aumentar zoom"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide info - top left */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-light px-3 py-1.5">
            <span className="text-sm font-medium text-gray-dark">
              Slide {slideIndex + 1}
            </span>
            <span className="text-xs text-gray-DEFAULT ml-2">
              {slideWidth} × {slideHeight}px
            </span>
            <span className="text-xs text-green-600 ml-2 font-medium">
              React
            </span>
          </div>
        </div>

        {/* Keyboard shortcuts hint - bottom right */}
        <div className="absolute bottom-6 right-4 z-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-light px-3 py-2 text-xs text-gray-DEFAULT">
            <p><kbd className="font-mono bg-gray-light px-1 rounded">Ctrl</kbd> + Scroll = Zoom</p>
            <p className="mt-1"><kbd className="font-mono bg-gray-light px-1 rounded">Shift</kbd> + Scroll = Pan horizontal</p>
          </div>
        </div>
      </div>
    </div>
  );
});

ReactCanvasPreview.displayName = 'ReactCanvasPreview';

export default ReactCanvasPreview;
