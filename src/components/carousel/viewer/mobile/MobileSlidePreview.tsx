/**
 * MobileSlidePreview - Preview do slide com iframe
 * Inclui navegação por swipe e toque para seleção
 * Corrigido para funcionar como o desktop
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ElementType } from '../../../../types/carousel';
import { TEMPLATE_DIMENSIONS } from '../../../../types/carousel';
import type { SelectedElement } from './types';

// Dimensões padrão do slide (templates 7 e 8 têm dimensões diferentes)
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1350;

interface MobileSlidePreviewProps {
  renderedSlides: string[];
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
  selectedElement: SelectedElement;
  setSelectedElement: (element: SelectedElement) => void;
  onElementClick: (slideIndex: number, element: ElementType, elementId?: string) => void;
  onTextEdit: (slideIndex: number, element: ElementType) => void;
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>;
  templateId?: string;
}

export const MobileSlidePreview: React.FC<MobileSlidePreviewProps> = ({
  renderedSlides,
  currentSlide,
  setCurrentSlide,
  selectedElement: _selectedElement,
  setSelectedElement: _setSelectedElement,
  onElementClick,
  onTextEdit,
  iframeRefs,
  templateId = '1',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
  const [dragDirection, setDragDirection] = React.useState<'left' | 'right' | null>(null);
  const eventHandlersRef = useRef<Map<number, { click: (e: MouseEvent) => void; dblclick: (e: MouseEvent) => void }>>(new Map());

  // Obtém dimensões do template (templates 7 e 8 são diferentes)
  const slideDimensions = TEMPLATE_DIMENSIONS[templateId] || { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  const SLIDE_WIDTH = slideDimensions.width;
  const SLIDE_HEIGHT = slideDimensions.height;

  // Calcula escala do slide para caber na tela - CENTRALIZADO
  const scale = React.useMemo(() => {
    if (!containerSize.width || !containerSize.height) return 0.35;
    
    const padding = 32; // Padding horizontal
    const availableWidth = containerSize.width - padding * 2;
    const availableHeight = containerSize.height - 60; // Espaço para navegação e indicadores
    
    const scaleX = availableWidth / SLIDE_WIDTH;
    const scaleY = availableHeight / SLIDE_HEIGHT;
    
    return Math.min(scaleX, scaleY, 0.5); // Max scale 0.5 para mobile
  }, [containerSize, SLIDE_WIDTH, SLIDE_HEIGHT]);

  // Mede o container
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Navegação por swipe
  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = 500;

    if (Math.abs(info.velocity.x) > velocity || Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0 && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (info.offset.x < 0 && currentSlide < renderedSlides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      }
    }
    
    setDragDirection(null);
  }, [currentSlide, renderedSlides.length, setCurrentSlide]);

  const handleDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 10) {
      setDragDirection(info.offset.x > 0 ? 'right' : 'left');
    }
  }, []);

  // Navegação por botões
  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToNextSlide = () => {
    if (currentSlide < renderedSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  // Configura eventos no iframe - como o desktop faz
  const setupIframeEvents = useCallback((iframe: HTMLIFrameElement, slideIndex: number) => {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Remove handlers anteriores se existirem
    const existing = eventHandlersRef.current.get(slideIndex);
    if (existing) {
      try {
        doc.removeEventListener('click', existing.click, true);
        doc.removeEventListener('dblclick', existing.dblclick, true);
      } catch {}
    }

    // Handler para cliques em elementos editáveis
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      let editable = target.closest('[data-editable]') as HTMLElement;
      
      // Se não encontrou elemento com data-editable, verifica background-image CSS
      if (!editable) {
        let bgImageElement: HTMLElement | null = target;
        let bgDepth = 0;
        while (bgImageElement && bgImageElement !== doc.body.parentElement && bgDepth < 15) {
          const computedStyle = doc.defaultView?.getComputedStyle(bgImageElement);
          const bgImage = computedStyle?.backgroundImage || '';
          if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
            // Encontrou elemento com background-image - usa ele como editável
            editable = bgImageElement;
            break;
          }
          bgImageElement = bgImageElement.parentElement;
          bgDepth++;
        }
      }
      
      if (editable) {
        e.preventDefault();
        e.stopPropagation();
        
        // Se não tem data-editable, assume que é background-image
        const editableType = (editable.getAttribute('data-editable') || 'background') as ElementType;
        const editableId = editable.id;
        
        // Remove seleção anterior de todos os iframes
        iframeRefs.current.forEach((ifr) => {
          const d = ifr?.contentDocument || ifr?.contentWindow?.document;
          if (d) {
            d.querySelectorAll('[data-editable].selected, [data-cv-selected]').forEach((el) => {
              el.classList.remove('selected');
              el.removeAttribute('data-cv-selected');
            });
          }
        });
        
        // Adiciona seleção
        editable.classList.add('selected');
        editable.setAttribute('data-cv-selected', '1');
        
        console.log('📱 [Mobile] Click:', { slideIndex, editableType, editableId });
        onElementClick(slideIndex, editableType, editableId);
      }
    };

    // Handler para duplo clique (edição de texto)
    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const editable = target.closest('[data-editable]') as HTMLElement;
      
      if (editable) {
        const editableType = editable.getAttribute('data-editable') as ElementType;
        
        // Só permite edição de texto (não imagem/background)
        if (editableType && !['background', 'image', 'video', 'avatar'].includes(editableType)) {
          e.preventDefault();
          e.stopPropagation();
          
          // Ativa edição
          editable.setAttribute('contenteditable', 'true');
          editable.focus();
          
          // Seleciona todo o texto
          const selection = doc.getSelection();
          const range = doc.createRange();
          range.selectNodeContents(editable);
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          console.log('📱 [Mobile] DblClick (edit):', { slideIndex, editableType });
          onTextEdit(slideIndex, editableType);
        }
      }
    };

    // Registra os handlers com capture: true (como o desktop faz)
    doc.addEventListener('click', handleClick, true);
    doc.addEventListener('dblclick', handleDblClick, true);

    // Salva referência para cleanup
    eventHandlersRef.current.set(slideIndex, { click: handleClick, dblclick: handleDblClick });
  }, [onElementClick, onTextEdit, iframeRefs]);

  // Configura eventos quando o iframe carrega
  const handleIframeLoad = useCallback((slideIndex: number) => {
    const iframe = iframeRefs.current[slideIndex];
    if (!iframe) return;
    
    // Aguarda um pouco para garantir que o documento está pronto
    setTimeout(() => {
      setupIframeEvents(iframe, slideIndex);
    }, 100);
  }, [setupIframeEvents, iframeRefs]);

  // Cleanup de eventos ao desmontar
  useEffect(() => {
    return () => {
      eventHandlersRef.current.clear();
    };
  }, []);

  // Re-configura eventos quando o slide muda
  useEffect(() => {
    const iframe = iframeRefs.current[currentSlide];
    if (iframe) {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc && doc.readyState === 'complete') {
        setupIframeEvents(iframe, currentSlide);
      }
    }
  }, [currentSlide, setupIframeEvents, iframeRefs]);

  // Calcula dimensões do container do slide para centralização perfeita
  const slideContainerWidth = SLIDE_WIDTH * scale;
  const slideContainerHeight = SLIDE_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Navigation arrows - posicionadas ao lado do slide */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 z-20 pointer-events-none">
        <button
          onClick={goToPrevSlide}
          disabled={currentSlide === 0}
          className={`p-2 rounded-full bg-[#1a1a2e]/80 backdrop-blur-sm transition-all pointer-events-auto ${
            currentSlide === 0 ? 'opacity-30' : 'opacity-100 active:scale-95'
          }`}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={goToNextSlide}
          disabled={currentSlide === renderedSlides.length - 1}
          className={`p-2 rounded-full bg-[#1a1a2e]/80 backdrop-blur-sm transition-all pointer-events-auto ${
            currentSlide === renderedSlides.length - 1 ? 'opacity-30' : 'opacity-100 active:scale-95'
          }`}
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Slide carousel - centralizado vertical e horizontalmente */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative flex items-center justify-center"
        style={{
          width: slideContainerWidth,
          height: slideContainerHeight,
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentSlide}
            initial={{ 
              opacity: 0, 
              x: dragDirection === 'right' ? -100 : 100,
              scale: 0.9 
            }}
            animate={{ 
              opacity: 1, 
              x: 0,
              scale: 1 
            }}
            exit={{ 
              opacity: 0, 
              x: dragDirection === 'left' ? -100 : 100,
              scale: 0.9 
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{
              boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            <iframe
              ref={(el) => {
                iframeRefs.current[currentSlide] = el;
              }}
              srcDoc={renderedSlides[currentSlide]}
              onLoad={() => handleIframeLoad(currentSlide)}
              className="w-full h-full border-0"
              style={{
                width: SLIDE_WIDTH,
                height: SLIDE_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
              sandbox="allow-same-origin allow-scripts"
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
        {renderedSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentSlide 
                ? 'w-6 bg-blue-DEFAULT' 
                : 'w-1.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default MobileSlidePreview;
