/**
 * CarouselEditor - Componente principal do editor de carrossel v2
 * 
 * Este é o componente de entrada que:
 * 1. Detecta se é mobile ou desktop
 * 2. Inicializa o EditorProvider
 * 3. Renderiza o layout apropriado
 */

import React, { useState, useEffect } from 'react';
import type { CarouselEditorProps } from './types';
import { EditorProvider } from './context/EditorContext';
import { EditorLayout } from './EditorLayout';

// Hook para detectar dispositivos móveis
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Componente wrapper que decide a versão (mobile/desktop)
const CarouselEditor: React.FC<CarouselEditorProps> = (props) => {
  const isMobile = useIsMobile();

  return (
    <EditorProvider {...props}>
      <EditorLayout isMobile={isMobile} onClose={props.onClose} />
    </EditorProvider>
  );
};

export default CarouselEditor;
