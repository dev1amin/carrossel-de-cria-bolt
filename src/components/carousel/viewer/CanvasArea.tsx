import React from 'react';

interface CanvasAreaProps {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
  slideWidth: number;
  slideHeight: number;
  gap: number;
  slides: string[];
  renderedSlides: string[];
  focusedSlide: number;
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onBackgroundClick?: () => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  zoom,
  pan,
  isDragging,
  dragStart, // mantido só pela assinatura
  slideWidth,
  slideHeight,
  gap,
  slides,
  renderedSlides,
  focusedSlide,
  iframeRefs,
  containerRef,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onBackgroundClick,
}) => {
  console.log('🎨 CanvasArea renderizado:', {
    renderedSlidesLength: renderedSlides.length,
    slidesLength: slides.length,
    iframeRefsLength: iframeRefs.current.length,
    pan,
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-gray-100 min-h-0"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
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
              (e.target as HTMLElement).className.includes('bg-[radial-gradient'))
          ) {
            onBackgroundClick?.();
          }
        }}
      >
        {/* BG grid pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>

        {/* Container com slides */}
        <div
          className="absolute"
          style={{
            // Origem do mundo: (0,0). Pan desloca o mundo no viewport.
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            left: 0,
            top: 0,
            zIndex: 10,
          }}
        >
          <div className="flex items-start" style={{ gap: `${gap}px` }}>
            {renderedSlides.map((slide, i) => (
              <div
                key={i}
                data-slide-index={i} // usado para debug se precisar
                className={`relative bg-white rounded-lg shadow-2xl overflow-hidden flex-shrink-0 transition-all ${
                  focusedSlide === i ? 'ring-4 ring-blue-500' : ''
                }`}
                style={{ width: `${slideWidth}px`, height: `${slideHeight}px` }}
              >
                <iframe
                  ref={(el) => {
                    iframeRefs.current[i] = el;
                    if (el) {
                      console.log(
                        `🎬 Iframe ${i} criado com srcDoc de ${el.srcdoc?.length || 0} caracteres`,
                      );
                    }
                  }}
                  srcDoc={slide}
                  className="w-full h-full border-0"
                  title={`Slide ${i + 1}`}
                  sandbox="allow-same-origin allow-scripts allow-autoplay"
                  style={{ pointerEvents: 'auto' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* HUD de zoom */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded shadow-lg border border-gray-200 text-xs z-[2]">
          Zoom: {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};