import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Image, Wrench, LayoutGrid, ChevronLeft, ChevronRight, Download, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Navigation from '../components/Navigation';
import SlideRenderer from '../components/SlideRenderer';
import { deleteGeneratedContent } from '../services/generatedContent';
import { useEditorTabs } from '../contexts/EditorTabsContext';
import type { CarouselTab } from '../carousel';

interface GalleryCarousel {
  id: string;
  postCode: string;
  templateName: string;
  createdAt: number;
  slides: string[];
  carouselData: any;
  viewed?: boolean;
  generatedContentId?: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [carousels, setCarousels] = useState<GalleryCarousel[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { addEditorTab, setShouldShowEditor } = useEditorTabs();

  const getUserName = (): string => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.name || user.username || 'Usuário';
      }
    } catch (error) {
      console.error('Erro ao obter nome do usuário:', error);
    }
    return 'Usuário';
  };

  const userName = getUserName();

  useEffect(() => {
    const loadGallery = () => {
      try {
        const stored = localStorage.getItem('gallery');
        if (stored) {
          const items = JSON.parse(stored);
          setCarousels(items);
        }
      } catch (error) {
        console.error('Erro ao carregar galeria:', error);
      }
    };

    loadGallery();

    const handleGalleryUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      setCarousels(customEvent.detail || []);
    };

    window.addEventListener('gallery:updated', handleGalleryUpdate);
    return () => window.removeEventListener('gallery:updated', handleGalleryUpdate);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const menuItems = [
    {
      id: 'feed',
      label: 'Feed',
      icon: LayoutGrid,
      color: 'from-blue-500 to-blue-600',
      route: '/feed'
    },
    {
      id: 'news',
      label: 'Notícias',
      icon: Newspaper,
      color: 'from-purple-500 to-purple-600',
      route: '/news'
    },
    {
      id: 'tools',
      label: 'Ferramentas',
      icon: Wrench,
      color: 'from-pink-500 to-pink-600',
      route: '/create-carousel'
    },
    {
      id: 'gallery',
      label: 'Galeria',
      icon: Image,
      color: 'from-indigo-500 to-indigo-600',
      route: '/gallery'
    }
  ];

  const handleMenuClick = (route: string) => {
    navigate(route);
  };

  const handleViewCarousel = (carousel: GalleryCarousel) => {
    if (!carousel.slides || !carousel.carouselData) {
      alert('Erro: Dados do carrossel não encontrados.');
      return;
    }

    const newTab: CarouselTab = {
      id: `home-${carousel.id}`,
      slides: carousel.slides,
      carouselData: carousel.carouselData,
      title: carousel.templateName,
      generatedContentId: carousel.generatedContentId,
    };

    addEditorTab(newTab);
    setShouldShowEditor(true);
  };

  const handleDownload = async (carousel: GalleryCarousel) => {
    console.log('Download carousel:', carousel.id);
    alert('Funcionalidade de download em desenvolvimento');
  };

  const handleDeleteCarousel = async (carousel: GalleryCarousel) => {
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

      const updatedCarousels = carousels.filter(c => c.id !== carousel.id);
      setCarousels(updatedCarousels);

      localStorage.setItem('gallery', JSON.stringify(updatedCarousels));
      window.dispatchEvent(new CustomEvent('gallery:updated', { detail: updatedCarousels }));
    } catch (error) {
      console.error('Erro ao deletar carrossel:', error);
      alert('Erro ao deletar carrossel: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  return (
    <div className="flex h-screen">
      <Navigation currentPage="home" />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-white relative"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: `${mousePosition.x * 0.02}px ${mousePosition.y * 0.02}px`,
          transition: 'background-position 0.1s ease-out',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12 relative">
          <div className="text-center mb-12">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-8"
              style={{ fontFamily: '"Shadows Into Light", cursive' }}
            >
              Bem vindo de volta {userName}!
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.route)}
                    className="group flex flex-col items-center gap-2 transition-transform hover:scale-105"
                  >
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recentes</h2>
          </div>

          {carousels.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Image className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum design criado ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Comece criando seu primeiro carrossel
              </p>
              <button
                onClick={() => navigate('/create-carousel')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
              >
                Criar Carrossel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {carousels.map((carousel) => (
                <GalleryItem
                  key={carousel.id}
                  carousel={carousel}
                  onEdit={handleViewCarousel}
                  onDownload={handleDownload}
                  onDelete={handleDeleteCarousel}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface GalleryItemProps {
  carousel: GalleryCarousel;
  onEdit: (carousel: GalleryCarousel) => void;
  onDownload: (carousel: GalleryCarousel) => void;
  onDelete: (carousel: GalleryCarousel) => void;
}

const GalleryItem: React.FC<GalleryItemProps> = ({ carousel, onEdit, onDownload, onDelete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      className="w-full bg-white rounded-lg overflow-hidden border border-gray-light shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="relative w-full bg-black overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{
          height: 0,
          paddingTop: 'calc(1350 / 1080 * 100%)',
          position: 'relative',
          width: '100%',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {carousel.slides[currentSlide].includes('iframe') ? (
            <iframe
              src={carousel.slides[currentSlide]}
              title={`Slide ${currentSlide}`}
              className="w-full h-full"
              style={{
                border: 'none',
                objectFit: 'contain',
                height: '100%',
              }}
            />
          ) : (
            <SlideRenderer
              key={`${carousel.id}-slide-${currentSlide}`}
              slideContent={carousel.slides[currentSlide]}
              slideIndex={currentSlide}
              styles={carousel.carouselData?.styles || {}}
              className="w-full h-full object-none"
            />
          )}
        </div>

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

      <div className="p-3 border-t border-zinc-800">
        <div className="mb-3">
          <p className="text-xs text-zinc-500 mt-0.5">
            {new Date(carousel.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })} • {carousel.slides.length} slides
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(carousel)}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-zinc-200 transition-colors border border-gray-200"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => onDownload(carousel)}
            className="flex items-center justify-center gap-2 bg-zinc-800 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            <Download className="w-4 h-4" />
          </button>
          {carousel.generatedContentId && (
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

export default HomePage;
