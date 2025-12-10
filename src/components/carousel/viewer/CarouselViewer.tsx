// CarouselViewer.tsx
// Este arquivo agora usa a nova UI/UX do editor de carrossel
// Mantém 100% das funcionalidades existentes com interface visual renovada

import React from 'react';
import NewCarouselViewer from './NewCarouselViewer';
import type { CarouselData } from '../../../types/carousel';

interface CarouselViewerProps {
  slides: string[];
  carouselData: CarouselData;
  onClose: () => void;
  generatedContentId?: number;
  onSaveSuccess?: () => void;
  autoDownload?: boolean;
}

// Wrapper que usa a nova versão do viewer
const CarouselViewer: React.FC<CarouselViewerProps> = (props) => {
  return <NewCarouselViewer {...props} />;
};

export default CarouselViewer;
