/**
 * MobileCarouselEditor.tsx
 * Editor de carrossel otimizado para mobile com design mobile-first
 * Mostra slide por slide em fullscreen com swipe navigation
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Type,
  Image,
  Palette,
  RotateCcw,
  Check,
  Share2,
  ZoomIn,
  ZoomOut,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold
} from 'lucide-react';
import { CarouselData } from '../../../types/carousel';
import { downloadSingleSlideAsPNG, downloadSlidesAsPNG } from '../../../services/carousel/download.service';

interface MobileCarouselEditorProps {
  slides: string[];
  carouselData: CarouselData;
  onClose: () => void;
  generatedContentId?: number;
  onSaveSuccess?: () => void;
  autoDownload?: boolean;
}

type EditableType = 'title' | 'subtitle' | 'arroba' | 'nome' | 'image' | 'background' | 'avatar';
type EditMode = 'view' | 'text' | 'image' | 'style';

interface SelectedElement {
  type: EditableType;
  slideIndex: number;
  element: HTMLElement | null;
}

const COLORS = [
  '#FFFFFF', '#000000', '#EF4444', '#F97316', '#EAB308', 
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px', '48px'];

// Log quando o módulo é carregado
console.log('📦 [MobileCarouselEditor/viewer] MÓDULO CARREGADO');

const MobileCarouselEditor: React.FC<MobileCarouselEditorProps> = ({
  slides,
  carouselData,
  onClose,
  autoDownload = false,
}) => {
  // LOG: Componente montado
  console.log('✅📱 [MobileCarouselEditor/viewer] COMPONENTE RENDERIZADO', {
    slidesCount: slides.length,
    autoDownload,
    carouselDataKeys: Object.keys(carouselData || {})
  });

  // Core states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('view');
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // UI states
  const [isDownloading, setIsDownloading] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [currentColor, setCurrentColor] = useState('#FFFFFF');
  const [currentFontSize, setCurrentFontSize] = useState('16px');
  const [currentAlign, setCurrentAlign] = useState<'left' | 'center' | 'right'>('left');
  const [isBold, setIsBold] = useState(false);
  
  // Refs
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  
  const totalSlides = slides.length;
  
  // Carousel data migration
  const data = React.useMemo(() => {
    const d = carouselData as any;
    if (d.conteudos && Array.isArray(d.conteudos)) return carouselData;
    if (d.slides && Array.isArray(d.slides)) {
      return { ...carouselData, conteudos: d.slides };
    }
    return carouselData;
  }, [carouselData]);

  // Navigate between slides
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
      clearSelection();
    }
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % totalSlides);
  }, [currentSlide, totalSlides, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide === 0 ? totalSlides - 1 : currentSlide - 1);
  }, [currentSlide, totalSlides, goToSlide]);

  // Touch/swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = Math.abs(touchStart.y - touchEnd.y);
    
    // Only horizontal swipe (ignore vertical)
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    
    setTouchStart(null);
  }, [touchStart, nextSlide, prevSlide]);

  // Clear selection
  const clearSelection = useCallback(() => {
    iframeRefs.current.forEach((iframe) => {
      const doc = iframe?.contentDocument;
      if (doc) {
        doc.querySelectorAll('[data-mobile-selected="true"]').forEach((el) => {
          (el as HTMLElement).style.outline = '';
          (el as HTMLElement).style.boxShadow = '';
          el.removeAttribute('data-mobile-selected');
        });
      }
    });
    setSelectedElement(null);
    setEditMode('view');
    setShowStylePanel(false);
  }, []);

  // Handle element click
  const handleElementClick = useCallback((type: EditableType, slideIndex: number, element: HTMLElement) => {
    // Clear previous selection
    clearSelection();
    
    // Style the selected element
    element.style.outline = '3px solid #8B5CF6';
    element.style.boxShadow = '0 0 0 6px rgba(139, 92, 246, 0.3)';
    element.setAttribute('data-mobile-selected', 'true');
    
    setSelectedElement({ type, slideIndex, element });
    
    // Set edit mode based on element type
    if (type === 'title' || type === 'subtitle' || type === 'arroba' || type === 'nome') {
      setEditMode('text');
      // Read current styles
      const computed = window.getComputedStyle(element);
      setCurrentColor(computed.color);
      setCurrentFontSize(computed.fontSize);
      setCurrentAlign(computed.textAlign as 'left' | 'center' | 'right');
      setIsBold(parseInt(computed.fontWeight) >= 600);
    } else if (type === 'image' || type === 'avatar' || type === 'background') {
      setEditMode('image');
    }
  }, [clearSelection]);

  // Apply text style
  const applyTextStyle = useCallback((property: 'color' | 'fontSize' | 'textAlign' | 'fontWeight', value: string) => {
    if (!selectedElement?.element) return;
    
    const el = selectedElement.element;
    
    switch (property) {
      case 'color':
        el.style.color = value;
        setCurrentColor(value);
        break;
      case 'fontSize':
        el.style.fontSize = value;
        setCurrentFontSize(value);
        break;
      case 'textAlign':
        el.style.textAlign = value;
        setCurrentAlign(value as 'left' | 'center' | 'right');
        break;
      case 'fontWeight':
        el.style.fontWeight = value;
        setIsBold(value === 'bold' || value === '700');
        break;
    }
    
    setHasChanges(true);
  }, [selectedElement]);

  // Download handlers
  const handleDownloadAll = useCallback(async () => {
    setIsDownloading(true);
    try {
      await downloadSlidesAsPNG(slides, (current, total) => {
        console.log(`📥 Baixando ${current}/${total}`);
      });
    } catch (error) {
      console.error('Erro ao baixar:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [slides]);

  const handleDownloadCurrent = useCallback(async () => {
    setIsDownloading(true);
    try {
      await downloadSingleSlideAsPNG(slides[currentSlide], currentSlide + 1);
    } catch (error) {
      console.error('Erro ao baixar:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [slides, currentSlide]);

  // Share handler
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Carrossel',
          text: 'Confira meu carrossel!',
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  }, []);

  // Setup iframes with click handlers
  useEffect(() => {
    const setupIframe = (index: number) => {
      const iframe = iframeRefs.current[index];
      if (!iframe) return;

      const setup = () => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;

        // Write HTML
        doc.open();
        doc.write(slides[index]);
        doc.close();

        // Wait for load
        setTimeout(() => {
          const body = doc.body;
          if (!body) return;

          // Find editable elements
          const title = doc.getElementById(`slide-${index}-title`) || 
                       doc.querySelector('[data-editable="title"]') as HTMLElement;
          const subtitle = doc.getElementById(`slide-${index}-subtitle`) || 
                          doc.querySelector('[data-editable="subtitle"]') as HTMLElement;
          const arroba = doc.querySelector('[data-editable="arroba"]') as HTMLElement;
          const nome = doc.querySelector('[data-editable="nome"]') as HTMLElement;
          const avatar = doc.querySelector('[data-editable="avatar"], img.avatar') as HTMLElement;
          const image = doc.querySelector('[data-editable="image"], img:not(.avatar)') as HTMLElement;

          // Helper to setup element
          const setupElement = (el: HTMLElement | null, type: EditableType) => {
            if (!el) return;
            
            el.style.cursor = 'pointer';
            el.style.transition = 'all 0.2s ease';
            
            if (type === 'title' || type === 'subtitle' || type === 'arroba' || type === 'nome') {
              el.setAttribute('contenteditable', 'true');
              el.style.outline = 'none';
              
              el.addEventListener('focus', (e) => {
                e.stopPropagation();
                handleElementClick(type, index, el);
              });
              
              el.addEventListener('input', () => {
                const key = `${index}-${type}`;
                setEditedContent((prev) => ({ ...prev, [key]: el.textContent || '' }));
                setHasChanges(true);
              });
            }
            
            el.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleElementClick(type, index, el);
            });
          };

          setupElement(title, 'title');
          setupElement(subtitle, 'subtitle');
          setupElement(arroba, 'arroba');
          setupElement(nome, 'nome');
          setupElement(avatar, 'avatar');
          if (image && image !== avatar) {
            setupElement(image, 'image');
          }

          // Click on body to clear selection
          body.addEventListener('click', (e) => {
            if (e.target === body) {
              clearSelection();
            }
          });

          // Add selection styles
          const style = doc.createElement('style');
          style.textContent = `
            * { -webkit-tap-highlight-color: transparent; }
            [data-mobile-selected="true"] {
              outline: 3px solid #8B5CF6 !important;
              box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.3) !important;
            }
            [contenteditable="true"]:focus {
              outline: 2px solid #8B5CF6 !important;
            }
            body { 
              user-select: none; 
              -webkit-user-select: none;
              overflow: hidden;
            }
          `;
          doc.head.appendChild(style);
        }, 100);
      };

      if (iframe.contentDocument?.readyState === 'complete') {
        setup();
      } else {
        iframe.onload = setup;
      }
    };

    slides.forEach((_, index) => setupIframe(index));
  }, [slides, handleElementClick, clearSelection]);

  // Auto download
  useEffect(() => {
    if (autoDownload && slides.length > 0) {
      handleDownloadAll();
    }
  }, [autoDownload, slides.length, handleDownloadAll]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-[9999] flex flex-col"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-sm border-b border-white/10 safe-area-top">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {navigator.share && (
            <button
              onClick={handleShare}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          )}
          <button
            onClick={handleDownloadCurrent}
            disabled={isDownloading}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 disabled:opacity-50"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Main slide area */}
      <main 
        ref={slideContainerRef}
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide container with horizontal scroll */}
        <div 
          className="absolute inset-0 flex items-center justify-center p-4"
          onClick={() => editMode !== 'view' && clearSelection()}
        >
          {/* Current slide */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div 
              className="relative bg-neutral-900 rounded-xl overflow-hidden shadow-2xl"
              style={{
                width: 'min(100%, calc((100vh - 200px) * 0.8))',
                aspectRatio: '4/5',
                maxHeight: 'calc(100vh - 200px)',
              }}
            >
              <iframe
                ref={(el) => { iframeRefs.current[currentSlide] = el; }}
                className="w-full h-full border-0"
                title={`Slide ${currentSlide + 1}`}
                sandbox="allow-same-origin allow-scripts"
              />
              
              {/* Slide number badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <span className="text-white text-xs font-medium">
                  Slide {currentSlide + 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        {currentSlide > 0 && (
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm active:bg-black/70 z-10"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}
        
        {currentSlide < totalSlides - 1 && (
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm active:bg-black/70 z-10"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Downloading overlay */}
        {isDownloading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm">Baixando...</span>
            </div>
          </div>
        )}
      </main>

      {/* Slide indicators */}
      <div className="flex-shrink-0 flex items-center justify-center gap-1.5 py-3 bg-black/90">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentSlide 
                ? 'w-6 bg-white' 
                : 'w-1.5 bg-white/30 active:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Bottom toolbar */}
      <footer className="flex-shrink-0 bg-neutral-900 border-t border-white/10 safe-area-bottom">
        {/* Mode tabs */}
        <div className="flex items-center border-b border-white/10">
          <button
            onClick={() => setShowStylePanel(false)}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              !showStylePanel ? 'text-white bg-white/10' : 'text-white/60'
            }`}
          >
            Editar
          </button>
          {selectedElement && (editMode === 'text') && (
            <button
              onClick={() => setShowStylePanel(true)}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                showStylePanel ? 'text-white bg-white/10' : 'text-white/60'
              }`}
            >
              Estilo
            </button>
          )}
        </div>

        {/* Style panel */}
        {showStylePanel && selectedElement && editMode === 'text' && (
          <div className="p-4 space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Colors */}
            <div>
              <label className="text-white/60 text-xs mb-2 block">Cor</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => applyTextStyle('color', color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${
                      currentColor === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className="text-white/60 text-xs mb-2 block">Tamanho</label>
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => applyTextStyle('fontSize', size)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentFontSize === size 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white/10 text-white/80'
                    }`}
                  >
                    {parseInt(size)}
                  </button>
                ))}
              </div>
            </div>

            {/* Alignment & Bold */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => applyTextStyle('textAlign', 'left')}
                  className={`p-2 rounded ${currentAlign === 'left' ? 'bg-purple-600' : ''}`}
                >
                  <AlignLeft className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => applyTextStyle('textAlign', 'center')}
                  className={`p-2 rounded ${currentAlign === 'center' ? 'bg-purple-600' : ''}`}
                >
                  <AlignCenter className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => applyTextStyle('textAlign', 'right')}
                  className={`p-2 rounded ${currentAlign === 'right' ? 'bg-purple-600' : ''}`}
                >
                  <AlignRight className="w-4 h-4 text-white" />
                </button>
              </div>
              
              <button
                onClick={() => applyTextStyle('fontWeight', isBold ? 'normal' : 'bold')}
                className={`p-2 rounded-lg ${isBold ? 'bg-purple-600' : 'bg-white/10'}`}
              >
                <Bold className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Main actions */}
        {!showStylePanel && (
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              {/* Info text */}
              <div className="flex-1">
                {selectedElement ? (
                  <p className="text-white/60 text-sm">
                    Editando: <span className="text-white font-medium capitalize">{selectedElement.type}</span>
                  </p>
                ) : (
                  <p className="text-white/60 text-sm">
                    Toque em um elemento para editar
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {selectedElement && (
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm active:bg-white/20"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={handleDownloadAll}
                  disabled={isDownloading}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm flex items-center gap-2 active:opacity-90 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Baixar Todos
                </button>
              </div>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default MobileCarouselEditor;
