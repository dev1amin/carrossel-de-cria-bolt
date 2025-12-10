import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface CanvasPreviewProps {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  slideWidth: number;
  slideHeight: number;
  slideIndex: number;
  renderedSlide: string;
  iframeRef: ((el: HTMLIFrameElement | null) => void) | React.RefObject<HTMLIFrameElement>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  onWheel?: (e: React.WheelEvent<HTMLDivElement>) => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onBackgroundClick?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  setZoom: (zoom: number) => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  zoom,
  pan,
  isDragging,
  slideWidth,
  slideHeight,
  slideIndex,
  renderedSlide,
  iframeRef,
  containerRef,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onBackgroundClick,
  onZoomIn,
  onZoomOut,
  setZoom,
}) => {
  const zoomPercentage = Math.round(zoom * 100);

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
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)
              `,
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
          {/* Single slide preview */}
          <div
            id={`slide-preview-${slideIndex}`}
            className="relative bg-white rounded-xl shadow-2xl overflow-hidden flex-shrink-0"
            style={{ 
              width: `${slideWidth}px`, 
              height: `${slideHeight}px`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <iframe
              ref={typeof iframeRef === 'function' ? iframeRef : (iframeRef as React.LegacyRef<HTMLIFrameElement>)}
              srcDoc={renderedSlide}
              className="w-full h-full border-0"
              title={`Slide ${slideIndex + 1}`}
              sandbox="allow-same-origin allow-scripts allow-autoplay"
              style={{ pointerEvents: 'auto' }}
            />
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
};

export default CanvasPreview;
