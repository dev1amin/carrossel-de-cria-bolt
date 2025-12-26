/**
 * ImageResizePinchers - Pinças de redimensionamento de imagem
 * Permite ajustar altura da imagem arrastando pinças no topo e base
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GripHorizontal } from 'lucide-react';

interface ImageResizePinchersProps {
  isVisible: boolean;
  containerRef: React.RefObject<HTMLElement>;
  imageElement: HTMLElement | null;
  onHeightChange: (newHeight: number) => void;
  onPositionYChange: (positionY: string) => void;
  minHeight?: number;
  maxHeight?: number;
}

export const ImageResizePinchers: React.FC<ImageResizePinchersProps> = ({
  isVisible,
  containerRef,
  imageElement,
  onHeightChange,
  onPositionYChange,
  minHeight = 200,
  maxHeight = 1350,
}) => {
  const [isDraggingTop, setIsDraggingTop] = useState(false);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartY = useRef(0);
  const startHeight = useRef(0);
  const startPositionY = useRef(0);

  const handleTopMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingTop(true);
    dragStartY.current = e.clientY;
    startHeight.current = imageElement?.offsetHeight || 450;
    console.log('📌 Pinça TOP: início drag', { startHeight: startHeight.current });
  }, [imageElement]);

  const handleBottomMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingBottom(true);
    dragStartY.current = e.clientY;
    startHeight.current = imageElement?.offsetHeight || 450;
    console.log('📌 Pinça BOTTOM: início drag', { startHeight: startHeight.current });
  }, [imageElement]);

  const handleImageDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
    dragStartY.current = e.clientY;
    
    // Extrai posição Y atual
    const style = window.getComputedStyle(imageElement!);
    const bgPos = style.backgroundPosition || style.objectPosition || 'center center';
    const parts = bgPos.split(' ');
    const yPart = parts[1] || '50%';
    startPositionY.current = parseFloat(yPart) || 50;
    console.log('🖼️ Drag imagem: início', { startPositionY: startPositionY.current });
  }, [imageElement]);

  useEffect(() => {
    if (!isDraggingTop && !isDraggingBottom && !isDraggingImage) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY.current;

      if (isDraggingTop) {
        // Arrasta para cima = aumenta altura, para baixo = diminui
        const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight.current - deltaY));
        console.log('📌 Pinça TOP: nova altura', newHeight);
        onHeightChange(newHeight);
      } else if (isDraggingBottom) {
        // Arrasta para baixo = aumenta altura, para cima = diminui
        const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight.current + deltaY));
        console.log('📌 Pinça BOTTOM: nova altura', newHeight);
        onHeightChange(newHeight);
      } else if (isDraggingImage) {
        // Drag da imagem = ajusta object-position Y
        // deltaY negativo = subiu (mostra mais da parte inferior)
        // deltaY positivo = desceu (mostra mais da parte superior)
        const newPositionY = Math.max(0, Math.min(100, startPositionY.current - deltaY / 5));
        const positionStr = `center ${newPositionY}%`;
        console.log('🖼️ Drag imagem: nova posição', positionStr);
        onPositionYChange(positionStr);
      }
    };

    const handleMouseUp = () => {
      console.log('✅ Fim do drag');
      setIsDraggingTop(false);
      setIsDraggingBottom(false);
      setIsDraggingImage(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTop, isDraggingBottom, isDraggingImage, onHeightChange, onPositionYChange, minHeight, maxHeight]);

  if (!isVisible || !imageElement) return null;

  // Calcula posição das pinças baseado no elemento de imagem
  const rect = imageElement.getBoundingClientRect();
  const containerRect = containerRef.current?.getBoundingClientRect();
  
  if (!containerRect) return null;

  // Posições relativas ao container
  const top = rect.top - containerRect.top;
  const left = rect.left - containerRect.left;
  const width = rect.width;
  const height = rect.height;

  const pinchStyle: React.CSSProperties = {
    position: 'absolute',
    left: left + width / 2 - 30,
    width: 60,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(65, 103, 178, 0.9)',
    borderRadius: 10,
    cursor: 'ns-resize',
    zIndex: 1001,
    transition: isDraggingTop || isDraggingBottom ? 'none' : 'opacity 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  };

  return (
    <>
      {/* Pinça superior */}
      <div
        style={{
          ...pinchStyle,
          top: top - 10,
        }}
        onMouseDown={handleTopMouseDown}
        title="Arraste para redimensionar"
      >
        <GripHorizontal className="w-4 h-4 text-white" />
      </div>

      {/* Pinça inferior */}
      <div
        style={{
          ...pinchStyle,
          top: top + height - 10,
        }}
        onMouseDown={handleBottomMouseDown}
        title="Arraste para redimensionar"
      >
        <GripHorizontal className="w-4 h-4 text-white" />
      </div>

      {/* Área de drag da imagem (centro) */}
      <div
        style={{
          position: 'absolute',
          left: left + 20,
          top: top + 20,
          width: width - 40,
          height: height - 40,
          cursor: 'move',
          zIndex: 1000,
          // Visual feedback sutil
          background: isDraggingImage ? 'rgba(65, 103, 178, 0.1)' : 'transparent',
          borderRadius: 8,
          transition: 'background 0.2s',
        }}
        onMouseDown={handleImageDragStart}
        title="Arraste para ajustar posição da imagem"
      >
        {/* Ícone central quando hover/drag */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            opacity: isDraggingImage ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <div className="bg-blue-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-lg">
            <GripHorizontal className="w-4 h-4" />
            Arrastando...
          </div>
        </div>
      </div>
    </>
  );
};

export default ImageResizePinchers;
