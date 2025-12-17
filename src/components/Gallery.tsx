import { motion } from 'framer-motion';
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, Image, Trash2 } from 'lucide-react';
import SlideRenderer from './SlideRenderer';
import { deleteGeneratedContent } from '../services/generatedContent';
import { TEMPLATE_DIMENSIONS } from '../types/carousel';

interface GalleryCarousel {
  id: string;
  postCode: string;
  templateName: string;
  createdAt: number;
  slides: string[];
  carouselData: any;
  viewed?: boolean;
  generatedContentId?: number; // ID do GeneratedContent na API
}

interface GalleryProps {
  carousels: GalleryCarousel[];
  onViewCarousel: (carousel: GalleryCarousel) => void;
  onDeleteCarousel?: (carouselId: string) => void;
}

interface GalleryItemProps {
  carousel: GalleryCarousel;
  onView: (carousel: GalleryCarousel) => void;
  onDownload: (carousel: GalleryCarousel) => void;
  onDelete?: (carousel: GalleryCarousel) => void;
}

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-gray">
      <Image className="w-16 h-16 mb-4 opacity-50" />
      <p className="text-lg">Nenhum carrossel foi gerado ainda</p>
    </div>
  );
};

const Gallery: React.FC<GalleryProps> = ({ carousels, onViewCarousel, onDeleteCarousel }) => {
  const handleDownload = async (carousel: GalleryCarousel) => {
    // TODO: Implementar download real dos slides
    console.log('Download carousel:', carousel.id);
    alert('Funcionalidade de download em desenvolvimento');
  };

  const handleDelete = async (carousel: GalleryCarousel) => {
    if (!carousel.generatedContentId) {
      alert('Não é possível deletar: ID do conteúdo não encontrado.');
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja deletar este carrossel? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      await deleteGeneratedContent(carousel.generatedContentId);
      if (onDeleteCarousel) {
        onDeleteCarousel(carousel.id);
      }
    } catch (error) {
      console.error('Erro ao deletar carrossel:', error);
      alert('Erro ao deletar carrossel: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  return (
    <main className="container mx-auto px-4 pt-4">
      {carousels.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
          {carousels.map((carousel) => (
            <GalleryItem
              key={carousel.id}
              carousel={carousel}
              onView={onViewCarousel}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </main>
  );
};

const GalleryItem = ({ carousel, onView, onDownload, onDelete }: GalleryItemProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detecta o template e calcula a proporção correta
  const templateInfo = useMemo(() => {
    const templateId = carousel.carouselData?.dados_gerais?.template || '1';
    const dimensions = TEMPLATE_DIMENSIONS[templateId] || { width: 1080, height: 1350 };
    return {
      templateId,
      width: dimensions.width,
      height: dimensions.height,
      aspectRatio: dimensions.height / dimensions.width // Para paddingTop em %
    };
  }, [carousel.carouselData]);

  // Log dos estilos para debug
  console.log(`🎨 [GalleryItem] Carrossel ${carousel.id} - Slide ${currentSlide} - Template ${templateInfo.templateId}:`, {
    dimensions: `${templateInfo.width}x${templateInfo.height}`,
    aspectRatio: templateInfo.aspectRatio
  });

  // Distância mínima de swipe (em px)
  const minSwipeDistance = 50;

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % carousel.slides.length);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + carousel.slides.length) % carousel.slides.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
<motion.div
  className="w-full max-w-[320px] bg-white rounded-lg overflow-hidden border border-gray-light shadow-md"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Carrossel navegável */}
  <div
    className="relative w-full bg-black overflow-hidden cursor-grab active:cursor-grabbing select-none"
    style={{
      height: 0,
      paddingTop: `${templateInfo.aspectRatio * 100}%`, // Proporção dinâmica baseada no template
      position: 'relative',
      width: '100%',
    }}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
  >
    {/* Slide atual */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Verifica se é um iframe ou outro tipo de conteúdo */}
      {carousel.slides[currentSlide].includes('iframe') ? (
        <iframe
          src={carousel.slides[currentSlide]}
          title={`Slide ${currentSlide}`}
          className="w-full h-full"
          style={{
            border: 'none',
          }}
        />
      ) : (
        <SlideRenderer
          key={`${carousel.id}-slide-${currentSlide}`}
          slideContent={carousel.slides[currentSlide]}
          slideIndex={currentSlide}
          styles={carousel.carouselData?.styles || {}}
          className="w-full h-full"
        />
      )}
    </div>

    {/* Setas de navegação - apenas em desktop */}
    {carousel.slides.length > 1 && (
      <>
        <button
          onClick={prevSlide}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-all z-10 pointer-events-auto"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={nextSlide}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-all z-10 pointer-events-auto"
          aria-label="Próximo slide"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </>
    )}

    {/* Indicador de slides */}
    {carousel.slides.length > 1 && (
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {carousel.slides.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>
    )}
  </div>

  {/* Botões de ação */}
  <div className="p-3 border-t border-zinc-800">
    {/* Info do carrossel */}
    <div className="mb-3">
      <p className="text-xs text-zinc-500 mt-0.5">
        {new Date(carousel.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })} • {carousel.slides.length} slides
      </p>
    </div>

    {/* Botões */}
    <div className="flex gap-2">
      {carousel.id.startsWith('saved-') ? (
        <button
          disabled
          className="flex-1 flex items-center justify-center gap-2 bg-gray-300 text-gray-500 font-medium py-2.5 px-4 rounded-lg cursor-not-allowed"
        >
          <Eye className="w-4 h-4" />
          Post Salvo
        </button>
      ) : (
        <button
          onClick={() => onView(carousel)}
          className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-zinc-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Ver
        </button>
      )}
      <button
        onClick={() => onDownload(carousel)}
        className="flex items-center justify-center gap-2 bg-zinc-800 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
      >
        <Download className="w-4 h-4" />
      </button>
      {onDelete && carousel.generatedContentId && (
        <button
          onClick={async () => {
            setIsDeleting(true);
            try {
              await onDelete(carousel);
            } finally {
              setIsDeleting(false);
            }
          }}
          disabled={isDeleting}
          className="flex items-center justify-center gap-2 bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Deletar carrossel"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
</motion.div>

  );
};

export default Gallery;