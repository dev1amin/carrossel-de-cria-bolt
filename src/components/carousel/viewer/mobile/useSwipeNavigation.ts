/**
 * Hook para gerenciar navegação entre slides via swipe no mobile
 */

import { useRef, useCallback } from 'react';
import type { SwipeDirection } from './types';

interface UseSwipeNavigationParams {
  totalSlides: number;
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
  enabled?: boolean;
  threshold?: number;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipeNavigation({
  totalSlides,
  currentSlide,
  setCurrentSlide,
  enabled = true,
  threshold = 50,
}: UseSwipeNavigationParams): SwipeHandlers & { swipeDirection: SwipeDirection } {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const swipeDirectionRef = useRef<SwipeDirection>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    swipeDirectionRef.current = null;
  }, [enabled]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }, [enabled]);

  const onTouchEnd = useCallback((_e: React.TouchEvent) => {
    if (!enabled) return;
    
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    // Determina direção predominante
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Swipe horizontal
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          // Swipe para direita -> slide anterior
          swipeDirectionRef.current = 'right';
          if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
          }
        } else {
          // Swipe para esquerda -> próximo slide
          swipeDirectionRef.current = 'left';
          if (currentSlide < totalSlides - 1) {
            setCurrentSlide(currentSlide + 1);
          }
        }
      }
    } else {
      // Swipe vertical (para abrir/fechar painel)
      if (Math.abs(deltaY) > threshold) {
        swipeDirectionRef.current = deltaY > 0 ? 'down' : 'up';
      }
    }
  }, [enabled, currentSlide, totalSlides, setCurrentSlide, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection: swipeDirectionRef.current,
  };
}
