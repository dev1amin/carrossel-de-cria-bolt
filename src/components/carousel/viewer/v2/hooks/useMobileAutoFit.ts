/**
 * Hook para ajustar automaticamente o zoom e posição do slide no mobile
 * para que o slide inteiro seja visível sem necessidade de zoom manual
 */

import { useEffect } from 'react';
import { useEditor } from '../context/EditorContext';

export const useMobileAutoFit = (isMobile: boolean) => {
  const { state, actions, data, refs } = useEditor();
  const { templateDimensions } = data;
  const { containerRef } = refs;

  useEffect(() => {
    if (!isMobile || !containerRef?.current) return;

    const fitSlideToScreen = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Adiciona padding para que o slide não encoste nas bordas
      const padding = 40;
      const availableWidth = containerWidth - padding * 2;
      const availableHeight = containerHeight - padding * 2;

      // Calcula o zoom necessário para que o slide caiba na tela
      const scaleX = availableWidth / templateDimensions.width;
      const scaleY = availableHeight / templateDimensions.height;
      const scale = Math.min(scaleX, scaleY, 1); // Não fazer zoom maior que 100%

      // Centraliza o slide
      const scaledWidth = templateDimensions.width * scale;
      const scaledHeight = templateDimensions.height * scale;
      const centerX = (containerWidth - scaledWidth) / 2;
      const centerY = (containerHeight - scaledHeight) / 2;

      // Aplica o zoom e posicionamento
      actions.setZoom(scale);
      actions.setPan({ x: centerX, y: centerY });
    };

    // Executa o ajuste inicial
    const timeout = setTimeout(fitSlideToScreen, 100);

    // Executa novamente quando a orientação da tela mudar
    const handleResize = () => {
      setTimeout(fitSlideToScreen, 100); // Pequeno delay para aguardar o resize completar
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile, templateDimensions, actions, containerRef]);

  // Também reexecuta quando muda de slide
  useEffect(() => {
    if (!isMobile || !containerRef?.current) return;

    const fitSlideToScreen = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      const padding = 40;
      const availableWidth = containerWidth - padding * 2;
      const availableHeight = containerHeight - padding * 2;

      const scaleX = availableWidth / templateDimensions.width;
      const scaleY = availableHeight / templateDimensions.height;
      const scale = Math.min(scaleX, scaleY, 1);

      const scaledWidth = templateDimensions.width * scale;
      const scaledHeight = templateDimensions.height * scale;
      const centerX = (containerWidth - scaledWidth) / 2;
      const centerY = (containerHeight - scaledHeight) / 2;

      actions.setZoom(scale);
      actions.setPan({ x: centerX, y: centerY });
    };

    // Pequeno delay para aguardar a mudança de slide completar
    const timeout = setTimeout(fitSlideToScreen, 100);
    
    return () => clearTimeout(timeout);
  }, [state.focusedSlide, isMobile, templateDimensions, actions, containerRef]);
};