/**
 * useImageDrag - Hook para gerenciar drag de imagens para ajustar object-position
 */

import { useCallback, useRef, useState } from 'react';

interface UseImageDragProps {
  onPositionChange: (position: string) => void;
}

export const useImageDrag = ({ onPositionChange }: UseImageDragProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; initialX: number; initialY: number } | null>(null);
  
  const handleImageMouseDown = useCallback((e: React.MouseEvent, currentPosition: string = 'center center') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Parse posição atual
    const parts = currentPosition.split(' ');
    let initialX = 50; // center
    let initialY = 50; // center
    
    if (parts[0]) {
      if (parts[0] === 'left') initialX = 0;
      else if (parts[0] === 'right') initialX = 100;
      else if (parts[0] === 'center') initialX = 50;
      else initialX = parseFloat(parts[0]);
    }
    
    if (parts[1]) {
      if (parts[1] === 'top') initialY = 0;
      else if (parts[1] === 'bottom') initialY = 100;
      else if (parts[1] === 'center') initialY = 50;
      else initialY = parseFloat(parts[1]);
    }
    
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX,
      initialY,
    };
    
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      
      const deltaX = moveEvent.clientX - dragStartRef.current.x;
      const deltaY = moveEvent.clientY - dragStartRef.current.y;
      
      // Converte delta de pixels para porcentagem (sensibilidade ajustável)
      const sensitivity = 0.1;
      const newX = Math.max(0, Math.min(100, dragStartRef.current.initialX + deltaX * sensitivity));
      const newY = Math.max(0, Math.min(100, dragStartRef.current.initialY + deltaY * sensitivity));
      
      // Formata a nova posição
      const newPosition = `${newX.toFixed(1)}% ${newY.toFixed(1)}%`;
      onPositionChange(newPosition);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onPositionChange]);
  
  return {
    isDragging,
    handleImageMouseDown,
  };
};
