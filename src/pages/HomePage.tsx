import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Image, Wrench, LayoutGrid, ChevronLeft, ChevronRight, Download, Edit, Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Navigation from '../components/Navigation';
import SlideRenderer from '../components/SlideRenderer';
import { MouseFollowLight } from '../components/MouseFollowLight';
import { ToneSetupModal } from '../components/ToneSetupModal';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { getGeneratedContent, getGeneratedContentById } from '../services/generatedContent';
import { useEditorTabs } from '../contexts/EditorTabsContext';
import type { CarouselTab } from '../carousel';
import type { GeneratedContent } from '../types/generatedContent';
import type { CarouselData } from '../carousel';
import { templateService } from '../services/carousel/template.service';
import { templateRenderer } from '../services/carousel/templateRenderer.service';
import { CacheService, CACHE_KEYS } from '../services/cache';
import { downloadSlidesAsPNG } from '../services/carousel/download.service';
import { useToneSetup } from '../hooks/useToneSetup';
import { API_ENDPOINTS } from '../config/api';

interface GalleryCarousel {
  id: string;
  postCode: string;
  templateName: string;
  createdAt: number;
  slides: string[];
  carouselData: CarouselData;
  viewed?: boolean;
  generatedContentId?: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [carousels, setCarousels] = useState<GalleryCarousel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiMessage, setAiMessage] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [userName, setUserName] = useState<string>('Usuário');
  const { editorTabs, addEditorTab, setShouldShowEditor } = useEditorTabs();

  // Fetch user profile to get the business name
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.log('👤 No token found, using default name');
          return;
        }

        console.log('🔍 Fetching user profile for HomePage');
        const response = await fetch(API_ENDPOINTS.profile, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log('📋 Profile data received:', profileData);
          
          // API pode retornar { user: {...} } ou diretamente {...}
          const userData = profileData.user || profileData;
          
          if (userData) {
            // Usar business.name se disponível, senão name do usuário
            const displayName = userData.business?.name || userData.name || 'Usuário';
            console.log('👤 Setting user name to:', displayName);
            setUserName(displayName);
            
            // Atualizar localStorage também
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } else {
          console.warn('⚠️ Failed to fetch profile:', response.status);
        }
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const renderSlidesWithTemplate = async (
    conteudos: any[],
    dados_gerais: any,
    templateId: string
  ): Promise<string[]> => {
    try {
      console.log(`🎨 Renderizando com template "${templateId}" para preview na home`);

      const templateSlides = await templateService.fetchTemplate(templateId);

      console.log(`✅ Template "${templateId}" carregado: ${templateSlides.length} slides`);

      const carouselData: CarouselData = {
        conteudos: conteudos,
        dados_gerais: dados_gerais,
      };

      const renderedSlides = templateRenderer.renderAllSlides(templateSlides, carouselData);

      console.log(`✅ ${renderedSlides.length} slides renderizados para preview`);

      return renderedSlides;
    } catch (error) {
      console.error(`❌ Erro ao renderizar template "${templateId}":`, error);

      return conteudos.map((slideData: any) =>
        convertSlideToHTML(slideData)
      );
    }
  };

  const convertSlideToHTML = (slideData: any): string => {
    const { title = '', subtitle = '', imagem_fundo = '', thumbnail_url = '' } = slideData;

    const isVideo = imagem_fundo?.includes('.mp4');
    const backgroundTag = isVideo
      ? `<video autoplay loop muted playsinline class="slide-background" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;"><source src="${imagem_fundo}" type="video/mp4"></video>`
      : `<img src="${imagem_fundo}" alt="Background" class="slide-background" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" />`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      position: relative;
      background: #000;
    }
    .slide-background { z-index: 0; }
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
      z-index: 1;
    }
    .content {
      position: absolute;
      bottom: 80px;
      left: 60px;
      right: 60px;
      z-index: 2;
      color: white;
    }
    .title {
      font-size: 48px;
      font-weight: bold;
      line-height: 1.2;
      margin-bottom: 20px;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
    }
    .subtitle {
      font-size: 28px;
      line-height: 1.4;
      opacity: 0.9;
      text-shadow: 1px 1px 4px rgba(0,0,0,0.8);
    }
    .thumbnail {
      position: absolute;
      top: 40px;
      right: 40px;
      width: 120px;
      height: 120px;
      border-radius: 12px;
      overflow: hidden;
      border: 3px solid rgba(255,255,255,0.2);
      z-index: 2;
    }
    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  </style>
</head>
<body>
  ${backgroundTag}
  <div class="overlay"></div>
  ${thumbnail_url ? `<div class="thumbnail"><img src="${thumbnail_url}" alt="Thumbnail" /></div>` : ''}
  <div class="content">
    ${title ? `<div class="title">${title}</div>` : ''}
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
  </div>
</body>
</html>
    `.trim();
  };

  const convertAPIToGalleryCarousel = async (apiContent: GeneratedContent): Promise<GalleryCarousel | null> => {
    try {
      const result = apiContent.result;

      console.log('📦 Convertendo conteúdo da API (HomePage):', {
        id: apiContent.id,
        media_type: apiContent.media_type,
        provider_type: apiContent.provider_type,
        result_keys: result ? Object.keys(result) : []
      });

      if (!result) {
        console.warn('⚠️ API content missing result:', apiContent);
        return null;
      }

      let slides: string[] = [];
      let carouselData: any = {};

      if (result.conteudos && Array.isArray(result.conteudos)) {
        console.log(`✅ Encontrados ${result.conteudos.length} slides no formato 'conteudos'`);

        const templateId = result.dados_gerais?.template || '2';
        console.log(`🎨 Template detectado: "${templateId}"`);

        slides = await renderSlidesWithTemplate(
          result.conteudos,
          result.dados_gerais || {},
          templateId
        );

        carouselData = {
          conteudos: result.conteudos,
          dados_gerais: result.dados_gerais || {},
          styles: result.styles || {},
        };
      }
      else if (result.slides && Array.isArray(result.slides)) {
        console.log(`✅ Encontrados ${result.slides.length} slides no formato antigo`);
        slides = result.slides;
        carouselData = result.metadata || result;
      }
      else {
        console.warn('⚠️ Formato desconhecido de resultado:', result);
        return null;
      }

      if (slides.length === 0) {
        console.warn('⚠️ Nenhum slide encontrado');
        return null;
      }

      const carousel: GalleryCarousel = {
        id: `api-${apiContent.id}`,
        postCode: apiContent.content_id?.toString() || String(apiContent.id),
        templateName: `${apiContent.media_type} - ${apiContent.provider_type}`,
        createdAt: new Date(apiContent.created_at).getTime(),
        slides: slides,
        carouselData: carouselData as CarouselData,
        viewed: false,
        generatedContentId: apiContent.id,
      };

      console.log('✅ Carrossel convertido (HomePage):', {
        id: carousel.id,
        slides_count: carousel.slides.length,
        templateName: carousel.templateName
      });

      return carousel;
    } catch (err) {
      console.error('❌ Erro ao converter conteúdo da API:', err, apiContent);
      return null;
    }
  };

  useEffect(() => {
    const loadCarouselsFromAPI = async () => {
      const cacheKey = `${CACHE_KEYS.GENERATED_CONTENT}_home`;

      // Check if we have cached data first
      const cachedCarousels = CacheService.getItem<GalleryCarousel[]>(cacheKey);

      if (cachedCarousels && cachedCarousels.length > 0) {
        // Display cached data immediately (no loading state)
        console.log('📦 Mostrando cache da HomePage enquanto busca dados frescos');
        setCarousels(cachedCarousels);
        setIsLoading(false);
      } else {
        // No cache, show loading
        setIsLoading(true);
      }

      // ALWAYS fetch fresh data from API
      try {
        console.log('🔄 Buscando dados frescos da API para HomePage...');

        const response = await getGeneratedContent({ page: 1, limit: 100 });

        console.log('✅ Resposta da API (HomePage):', response);

        const apiCarouselsPromises = response.data.map(content =>
          convertAPIToGalleryCarousel(content)
        );
        const apiCarouselsResults = await Promise.all(apiCarouselsPromises);
        const apiCarousels = apiCarouselsResults.filter((c): c is GalleryCarousel => c !== null);

        console.log(`✅ ${apiCarousels.length} carrosséis recebidos da API (HomePage)`);

        // Check if data has changed
        if (CacheService.hasDataChanged(cacheKey, apiCarousels)) {
          console.log('🔄 Dados da HomePage mudaram, atualizando cache e UI');
          CacheService.setItem(cacheKey, apiCarousels);
          setCarousels(apiCarousels);
        } else {
          console.log('✅ Dados da HomePage não mudaram, mantendo cache');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar carrosséis da API:', err);
        // Keep cached data if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    loadCarouselsFromAPI();
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
      label: 'Criar',
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

  const handleViewCarousel = async (carousel: GalleryCarousel) => {
    if (!carousel.slides || !carousel.carouselData) {
      alert('Erro: Dados do carrossel não encontrados.');
      return;
    }

    const tabId = `home-${carousel.id}`;
    
    // Check if tab already exists - if so, skip API call and just activate it
    const existingTab = editorTabs.find(t => t.id === tabId);
    if (existingTab) {
      console.log('♻️ Aba já existe, reutilizando dados em cache:', tabId);
      addEditorTab(existingTab);
      setShouldShowEditor(true);
      return;
    }

    let carouselData = carousel.carouselData;
    let slides = carousel.slides;

    if (carousel.generatedContentId) {
      try {
        console.log('🔄 Buscando dados atualizados da API...');
        const freshData = await getGeneratedContentById(carousel.generatedContentId);

        if (freshData.success && freshData.data.result) {
          const apiData = freshData.data.result as any;

          if (apiData.conteudos && apiData.dados_gerais) {
            carouselData = {
              conteudos: apiData.conteudos,
              dados_gerais: apiData.dados_gerais,
              styles: apiData.styles || {},
            } as CarouselData;

            const templateId = apiData.dados_gerais.template || '2';
            slides = await renderSlidesWithTemplate(
              apiData.conteudos,
              apiData.dados_gerais,
              templateId
            );

            console.log('✅ Dados atualizados carregados da API');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados atualizados:', error);
      }
    }

    const newTab: CarouselTab = {
      id: tabId,
      slides: slides,
      carouselData: carouselData,
      title: carousel.templateName,
      generatedContentId: carousel.generatedContentId,
    };

    addEditorTab(newTab);
    setShouldShowEditor(true);
  };

  const handleDownload = async (carousel: GalleryCarousel) => {
    if (!carousel.slides || carousel.slides.length === 0) {
      alert('Erro: Nenhum slide encontrado para download.');
      return;
    }

    setDownloadingId(carousel.id);
    setDownloadProgress({ current: 0, total: carousel.slides.length });

    try {
      await downloadSlidesAsPNG(
        carousel.slides,
        (current, total) => {
          setDownloadProgress({ current, total });
        }
      );
      
      // Success message
      alert(`✅ ${carousel.slides.length} slides baixados com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao baixar slides:', error);
      alert('Erro ao baixar slides. Verifique o console para mais detalhes.');
    } finally {
      setDownloadingId(null);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiMessage.trim()) {
      navigate('/chatbot', { state: { initialMessage: aiMessage } });
    }
  };

  return (
    <div className="flex h-screen">
      <Navigation currentPage="home" />

      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white relative ml-16">
        <MouseFollowLight zIndex={-1} />

        <div
          className="pointer-events-none fixed top-0 left-0 md:left-20 right-0 bottom-0 opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '10%',
            left: '8%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.3,
            filter: 'blur(80px)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '5%',
            right: '12%',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.25,
            filter: 'blur(70px)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '40%',
            left: '5%',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.2,
            filter: 'blur(75px)',
            animation: 'float 11s ease-in-out infinite',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '45%',
            right: '8%',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.28,
            filter: 'blur(65px)',
            animation: 'float 9s ease-in-out infinite reverse',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '15%',
            left: '15%',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.22,
            filter: 'blur(70px)',
            animation: 'float 12s ease-in-out infinite',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '20%',
            right: '20%',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.26,
            filter: 'blur(68px)',
            animation: 'float 13s ease-in-out infinite reverse',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '25%',
            left: '45%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.18,
            filter: 'blur(60px)',
            animation: 'float 10s ease-in-out infinite',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '70%',
            left: '35%',
            width: '230px',
            height: '230px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.24,
            filter: 'blur(72px)',
            animation: 'float 14s ease-in-out infinite reverse',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 py-12 relative">
          <div className="text-center mb-8">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-12"
              style={{ fontFamily: '"Shadows Into Light", cursive' }}
            >
              Bem-vindo de volta, {userName}!
            </h1>

            <form onSubmit={handleAISubmit} className="max-w-4xl mx-auto mb-16 relative z-10">
              <div
                className="absolute -z-10 pointer-events-none"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '500px',
                  height: '500px',
                  background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 40%, rgba(255,255,255,0) 70%)',
                  filter: 'blur(60px)',
                }}
              />
              <div className="relative bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:border-blue-300 transition-colors z-10">
                <div className="flex items-center gap-3 px-6 py-4">
                  <Sparkles className="w-6 h-6 text-blue-500 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="O que você gostaria de criar hoje?"
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    className="flex-1 text-base md:text-lg outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!aiMessage.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </div>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-6 mb-12 relative z-10">
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

          <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50 min-h-[600px] relative z-10">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Recentes</h2>
              {carousels.length > 0 && (
                <button
                  onClick={() => navigate('/gallery')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Ver todos
                </button>
              )}
            </div>

            {isLoading ? (
              <SkeletonGrid count={4} type="home" />
            ) : carousels.length === 0 ? (
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
              <CarouselSlider
                carousels={carousels}
                onEdit={handleViewCarousel}
                onDownload={handleDownload}
                downloadingId={downloadingId}
                downloadProgress={downloadProgress}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface GalleryItemProps {
  carousel: GalleryCarousel;
  onEdit: (carousel: GalleryCarousel) => void;
  onDownload: (carousel: GalleryCarousel) => void;
  downloadingId: string | null;
  downloadProgress: { current: number; total: number } | null;
}

interface CarouselSliderProps {
  carousels: GalleryCarousel[];
  onEdit: (carousel: GalleryCarousel) => void;
  onDownload: (carousel: GalleryCarousel) => void;
  downloadingId: string | null;
  downloadProgress: { current: number; total: number } | null;
}

const CarouselSlider: React.FC<CarouselSliderProps> = ({ carousels, onEdit, onDownload, downloadingId, downloadProgress }) => {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 4;
  const visibleCarousels = carousels.slice(startIndex, startIndex + itemsPerPage);
  const canGoNext = startIndex + itemsPerPage < carousels.length;
  const canGoPrev = startIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      setStartIndex(prev => prev + itemsPerPage);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setStartIndex(prev => Math.max(0, prev - itemsPerPage));
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
        {visibleCarousels.map((carousel) => (
          <GalleryItem
            key={carousel.id}
            carousel={carousel}
            onEdit={onEdit}
            onDownload={onDownload}
            downloadingId={downloadingId}
            downloadProgress={downloadProgress}
          />
        ))}
      </div>
      
      {carousels.length > itemsPerPage && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`p-2 rounded-full transition-all ${
              canGoPrev
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`p-2 rounded-full transition-all ${
              canGoNext
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

const GalleryItem: React.FC<GalleryItemProps> = ({ carousel, onEdit, onDownload, downloadingId, downloadProgress }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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
      className="w-full bg-white rounded-lg overflow-hidden border border-gray-light shadow-md relative z-10"
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
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => onDownload(carousel)}
            disabled={downloadingId === carousel.id}
            className="flex items-center justify-center gap-2 bg-blue text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-dark transition-colors border border-blue disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingId === carousel.id ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {downloadProgress && (
                  <span className="text-xs">{downloadProgress.current}/{downloadProgress.total}</span>
                )}
              </>
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const HomePageWrapper: React.FC = () => {
  // Use useToneSetup to show popup automatically when user enters home without tone setup
  const { showToneModal, closeToneModal, completeToneSetup } = useToneSetup();
  
  return (
    <>
      <HomePage />
      <ToneSetupModal
        isOpen={showToneModal}
        onClose={closeToneModal}
        onComplete={completeToneSetup}
      />
    </>
  );
};

export default HomePageWrapper;
