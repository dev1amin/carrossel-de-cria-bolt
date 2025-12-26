/**
 * useCanvasInteraction - Hook para gerenciar interações com o canvas
 * 
 * Responsável por: zoom, pan, centralização, drag
 */

import { useCallback, useEffect, useRef } from 'react';
import type { EditorState, EditorRefs, TemplateDimensions } from '../types';
import type { EditorDispatch } from './useEditorState';

interface UseCanvasInteractionProps {
  state: EditorState;
  dispatch: EditorDispatch;
  refs: EditorRefs;
  templateDimensions: TemplateDimensions;
}

export const useCanvasInteraction = ({
  state,
  dispatch,
  refs,
  templateDimensions,
}: UseCanvasInteractionProps) => {
  const { canvas, renderedSlides } = state;
  const { zoom, pan, isDragging, dragStart } = canvas;
  const { containerRef } = refs;
  const { width: slideWidth, height: slideHeight } = templateDimensions;
  
  const hasInitialCenteredRef = useRef(false);
  
  // === SETTERS ===
  const setZoom = useCallback((newZoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: Math.min(Math.max(0.1, newZoom), 2) });
  }, [dispatch]);
  
  const setPan = useCallback((newPan: { x: number; y: number }) => {
    dispatch({ type: 'SET_PAN', payload: newPan });
  }, [dispatch]);
  
  const setIsDragging = useCallback((dragging: boolean) => {
    dispatch({ type: 'SET_IS_DRAGGING', payload: dragging });
  }, [dispatch]);
  
  const setDragStart = useCallback((start: { x: number; y: number }) => {
    dispatch({ type: 'SET_DRAG_START', payload: start });
  }, [dispatch]);
  
  // === ZOOM ===
  const zoomIn = useCallback(() => {
    setZoom(Math.min(zoom + 0.1, 2));
  }, [zoom, setZoom]);
  
  const zoomOut = useCallback(() => {
    setZoom(Math.max(zoom - 0.1, 0.1));
  }, [zoom, setZoom]);
  
  // === CENTRALIZAÇÃO ===
  const centerSlide = useCallback((_index: number) => {
    const container = containerRef.current;
    if (!container || !renderedSlides.length) return;
    
    const rect = container.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;
    
    const slideWorldCenterX = slideWidth / 2;
    const slideWorldCenterY = slideHeight / 2;
    
    const panX = viewportWidth / 2 - zoom * slideWorldCenterX;
    const panY = viewportHeight / 2 - zoom * slideWorldCenterY;
    
    setPan({ x: panX, y: panY });
  }, [containerRef, renderedSlides.length, slideWidth, slideHeight, zoom, setPan]);
  
  // === CENTRALIZAÇÃO INICIAL ===
  useEffect(() => {
    if (!renderedSlides.length) return;
    if (hasInitialCenteredRef.current) return;
    
    hasInitialCenteredRef.current = true;
    
    requestAnimationFrame(() => {
      centerSlide(0);
    });
  }, [renderedSlides.length, centerSlide]);
  
  // === WHEEL EVENT ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const newZoom = Math.min(Math.max(0.1, zoom + delta), 2);
        setZoom(newZoom);
        setPan({
          x: e.clientX - rect.left - mouseX * newZoom,
          y: e.clientY - rect.top - mouseY * newZoom,
        });
      } else if (e.shiftKey) {
        e.preventDefault();
        setPan({ x: pan.x - e.deltaY, y: pan.y });
      } else {
        e.preventDefault();
        setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerRef, pan, zoom, setZoom, setPan]);
  
  // === MOUSE HANDLERS PARA DRAG ===
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan, setIsDragging, setDragStart]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart, setPan]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);
  
  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);
  
  return {
    // State
    zoom,
    pan,
    isDragging,
    dragStart,
    
    // Setters
    setZoom,
    setPan,
    setIsDragging,
    setDragStart,
    
    // Actions
    zoomIn,
    zoomOut,
    centerSlide,
    
    // Handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  };
};
