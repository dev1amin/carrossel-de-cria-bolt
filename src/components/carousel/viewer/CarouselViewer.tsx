// CarouselViewer.tsx
// Este arquivo agora usa a arquitetura v2 modular do editor de carrossel

import React from 'react';
import type { CarouselData } from '../../../types/carousel';

// V2 - Nova arquitetura modular
import CarouselEditorV2 from './v2/CarouselEditor';

interface CarouselViewerProps {
  slides: string[];
  carouselData: CarouselData;
  onClose: () => void;
  generatedContentId?: number;
  onSaveSuccess?: () => void;
  autoDownload?: boolean;
}

// Usa a versão V2 (nova arquitetura modular)
const CarouselViewer: React.FC<CarouselViewerProps> = (props) => {
  return <CarouselEditorV2 {...props} />;
};

export default CarouselViewer;
