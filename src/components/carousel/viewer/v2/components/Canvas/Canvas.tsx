/**
 * Canvas - Container do canvas de edição
 */

import React, { memo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { CanvasControls } from './CanvasControls';
import { SlideRenderer } from './SlideRenderer';

export const Canvas: React.FC = memo(() => {
  const { state, actions, refs, data } = useEditor();
  
  const { canvas, focusedSlide } = state;
  const { zoom, pan, isDragging, dragStart } = canvas;
  const { templateDimensions } = data;
  const { containerRef } = refs;
  
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-light">
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative min-h-0"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
        }}
        onMouseDown={(e) => {
          if (e.button === 0 && e.target === e.currentTarget) {
            actions.setIsDragging(true);
            actions.setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
          }
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            actions.setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
          }
        }}
        onMouseUp={(e) => {
          actions.setIsDragging(false);
          // Se clicar no canvas (área de fundo), remove a seleção do elemento
          if (e.target === e.currentTarget) {
            actions.setSelectedElement({ slideIndex: focusedSlide, element: null });
          }
        }}
        onMouseLeave={() => actions.setIsDragging(false)}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none">
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
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            left: 0,
            top: 0,
            zIndex: 10,
          }}
        >
          <SlideRenderer />
        </div>

        {/* Zoom controls */}
        <CanvasControls />

        {/* Slide info */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-light px-3 py-1.5">
            <span className="text-sm font-medium text-gray-dark">
              Slide {focusedSlide + 1}
            </span>
            <span className="text-xs text-gray-DEFAULT ml-2">
              {templateDimensions.width} × {templateDimensions.height}px
            </span>
            {data.isReactTemplate && (
              <span className="text-xs text-blue-500 ml-2 font-medium">
                React
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';
