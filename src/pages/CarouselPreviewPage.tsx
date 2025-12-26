import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Edit3,
  Send,
  MessageCircle,
  X,
  FileText,
  Loader2,
  Heart,
  MessageCircle as CommentIcon,
  Send as ShareIcon,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Instagram icon component
const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);
import Navigation from '../components/Navigation';
import SlideRenderer from '../components/SlideRenderer';
import { useEditorTabs } from '../contexts/EditorTabsContext';
import { useGenerationQueue } from '../contexts/GenerationQueueContext';
import type { CarouselData, CarouselTab } from '../types/carousel';
import { TEMPLATE_DIMENSIONS } from '../types/carousel';
import { getGeneratedContentById } from '../services/generatedContent';

interface CarouselPreviewState {
  slides: string[];
  carouselData: CarouselData | any; // deixa flexível porque seu pipeline varia
  title: string;
  generatedContentId?: number;
  fromQueue?: boolean;
  queueItemId?: string;
  description?: string; // <- descrição “final” (do generated_content.data.description)
}

type ChatMsg = { role: 'user' | 'assistant'; content: string };

const CarouselPreviewPage: React.FC = () => {
  const { previewId } = useParams<{ previewId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addEditorTab } = useEditorTabs();
  const { removeFromQueue } = useGenerationQueue();

  const [carouselState, setCarouselState] = useState<CarouselPreviewState | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstagramPreviewOpen, setIsInstagramPreviewOpen] = useState(false);
  const [currentPreviewSlide, setCurrentPreviewSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const slidesContainerRef = useRef<HTMLDivElement>(null);

  // Altura visual responsiva baseada na viewport
  const [visualHeight, setVisualHeight] = useState(350);

  useEffect(() => {
    const updateVisualHeight = () => {
      if (window.innerWidth < 640) {
        setVisualHeight(280);
      } else if (window.innerWidth < 1024) {
        setVisualHeight(320);
      } else {
        setVisualHeight(380);
      }
    };

    updateVisualHeight();
    window.addEventListener('resize', updateVisualHeight);
    return () => window.removeEventListener('resize', updateVisualHeight);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 1) carrega o state vindo da navegação
  useEffect(() => {
    const state = location.state as CarouselPreviewState | undefined;

    if (state && state.slides && state.carouselData) {
      setCarouselState(state);

      if (state.fromQueue && state.queueItemId) {
        removeFromQueue(state.queueItemId);
      }
    } else {
      navigate('/gallery', { replace: true });
    }
  }, [location.state, navigate, removeFromQueue]);

  // 2) Se não veio description no state, tenta buscar pelo generatedContentId ou previewId
  useEffect(() => {
    const hydrateDescription = async () => {
      if (!carouselState) return;

      // já tem no state? acabou.
      if (typeof carouselState.description === 'string' && carouselState.description.trim()) return;

      const idFromState = carouselState.generatedContentId;
      const idFromParams = previewId ? Number(previewId) : null;

      const id = Number.isFinite(idFromState as number)
        ? (idFromState as number)
        : Number.isFinite(idFromParams as number)
          ? (idFromParams as number)
          : null;

      if (!id) return;

      try {
        const response = await getGeneratedContentById(id);

        if (!response?.success || !response.data) {
          console.error('Falha ao buscar generated-content: resposta inválida', response);
          return;
        }

        const apiData = response.data as any;
        const rawResult = apiData?.result;
        let parsedResult: any = rawResult;

        if (rawResult && typeof rawResult === 'string') {
          try {
            parsedResult = JSON.parse(rawResult);
          } catch (parseError) {
            console.warn('Não foi possível parsear result do generated content como JSON:', parseError);
          }
        }

        const descriptionCandidates = [
          apiData?.description,
          parsedResult?.description,
          parsedResult?.dados_gerais?.description,
          parsedResult?.dados_gerais?.resumo,
          parsedResult?.dados_gerais?.descricao,
          parsedResult?.metadata?.descricao,
        ];

        const description = descriptionCandidates.find(
          (value): value is string => typeof value === 'string' && value.trim().length > 0,
        );

        if (description) {
          setCarouselState(prev => (prev ? { ...prev, description: description.trim() } : prev));
        } else {
          console.warn('Generated content não retornou descrição utilizável para o preview');
        }
      } catch (e) {
        console.error('Erro ao hidratar descrição via generated-content API:', e);
      }
    };

    hydrateDescription();
  }, [carouselState, previewId]);

  // Determina o template ID e as dimensões corretas
  const templateInfo = useMemo(() => {
    if (!carouselState?.carouselData) {
      return { templateId: '1', width: 1080, height: 1350, aspectRatio: '1080 / 1350' };
    }

    const data: any = carouselState.carouselData;
    const templateId = data?.dados_gerais?.template || '1';
    const dimensions = TEMPLATE_DIMENSIONS[templateId] || { width: 1080, height: 1350 };

    return {
      templateId,
      width: dimensions.width,
      height: dimensions.height,
      aspectRatio: `${dimensions.width} / ${dimensions.height}`
    };
  }, [carouselState?.carouselData]);

  /**
   * Resolver da descrição:
   * - prioridade: carouselState.description (vinda do generated_content.data.description)
   * - fallback: algumas pipelines colocam em carouselData.description ou outros caminhos
   */
  const description = useMemo(() => {
    if (!carouselState) return '';

    const direct = carouselState.description;
    if (typeof direct === 'string' && direct.trim()) return direct;

    const data: any = carouselState.carouselData;

    // Fallbacks (defensivo)
    if (typeof data?.description === 'string' && data.description.trim()) return data.description;
    if (typeof data?.dados_gerais?.description === 'string' && data.dados_gerais.description.trim()) {
      return data.dados_gerais.description;
    }

    // Se alguém salvou a resposta inteira dentro de carouselData por engano
    if (typeof data?.data?.description === 'string' && data.data.description.trim()) return data.data.description;

    return '';
  }, [carouselState]);

  /**
   * Extrai arroba e foto de perfil dos dados_gerais
   */
  const profileInfo = useMemo(() => {
    if (!carouselState?.carouselData) {
      return { arroba: 'carrossel.cria', fotoPerfil: '' };
    }

    const data: any = carouselState.carouselData;
    const arroba = data?.dados_gerais?.arroba || 'carrossel.cria';
    const fotoPerfil = data?.dados_gerais?.foto_perfil || data?.dados_gerais?.logo || '';

    return { arroba, fotoPerfil };
  }, [carouselState?.carouselData]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!slidesContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - slidesContainerRef.current.offsetLeft);
    setScrollLeft(slidesContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !slidesContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - slidesContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    slidesContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleOpenEditor = () => {
    if (!carouselState) return;

    const newTab: CarouselTab = {
      id: `preview-${previewId || Date.now()}`,
      slides: carouselState.slides,
      carouselData: carouselState.carouselData,
      title: carouselState.title,
      generatedContentId: carouselState.generatedContentId
    };

    addEditorTab(newTab);
    navigate(`/editor/${encodeURIComponent(newTab.id)}`);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert('Funcionalidade de download em desenvolvimento');
    }, 1000);
  };

  const handlePreview = () => {
    setCurrentPreviewSlide(0);
    setIsInstagramPreviewOpen(true);
  };

  const handlePrevSlide = () => {
    setCurrentPreviewSlide((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextSlide = () => {
    if (!carouselState) return;
    setCurrentPreviewSlide((prev) => 
      prev < carouselState.slides.length - 1 ? prev + 1 : prev
    );
  };

  // Componente auxiliar para o avatar do Instagram
  const ProfileAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
    const sizeClass = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
    const innerSizeClass = size === 'sm' ? 'text-[10px]' : 'text-xs';
    
    if (profileInfo.fotoPerfil) {
      return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5`}>
          <div className="w-full h-full rounded-full bg-white p-0.5">
            <img 
              src={profileInfo.fotoPerfil} 
              alt={profileInfo.arroba}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                // Fallback para inicial se a imagem falhar
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className={`${innerSizeClass} font-semibold text-gray-600`}>
                {profileInfo.arroba.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5`}>
        <div className="w-full h-full rounded-full bg-white p-0.5">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className={`${innerSizeClass} font-semibold text-gray-600`}>
              {profileInfo.arroba.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Esta funcionalidade de edição via chat está em desenvolvimento. Em breve você poderá editar seus slides através de comandos de texto!'
        }
      ]);
    }, 1000);
  };

  const memoizedNavigation = useMemo(() => <Navigation currentPage="gallery" />, []);

  if (!carouselState) {
    return (
      <div className="flex min-h-screen bg-white">
        {memoizedNavigation}
        <div className="flex-1 ml-0 md:ml-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Carregando carrossel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {memoizedNavigation}

      <div className="flex-1 ml-0 md:ml-20 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline text-sm font-medium">Voltar</span>
              </button>

              <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                {carouselState.title}
              </h1>

              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/25"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              <div className="hidden lg:block w-20" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Slides Canvas */}
          <section
            className="w-full relative overflow-hidden"
            style={{
              background: 'white',
              minHeight: '350px'
            }}
          >
            {/* Dot grid background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />

            {/* Soft blue glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.08) 0%, transparent 70%)'
              }}
            />

            {/* Horizontal scrollable slides container with drag */}
            <div
              ref={slidesContainerRef}
              className={`relative z-10 flex items-center gap-4 sm:gap-6 overflow-x-auto px-6 sm:px-10 py-8 sm:py-10 select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {carouselState.slides.map((slide, index) => {
                // Calcula a largura visual mantendo a proporção do template
                const aspectRatio = templateInfo.width / templateInfo.height;
                const visualWidth = visualHeight * aspectRatio;

                return (
                  <div
                    key={index}
                    className="flex-shrink-0 transition-shadow duration-200 hover:shadow-2xl"
                    style={{
                      width: `${visualWidth}px`,
                      height: `${visualHeight}px`
                    }}
                  >
                    <div
                      className="relative rounded-xl overflow-hidden shadow-lg border-2 border-gray-100 bg-gray-50"
                      style={{
                        width: `${visualWidth}px`,
                        height: `${visualHeight}px`,
                        overflow: 'hidden'
                      }}
                    >
                      {/* SlideRenderer agora aplica zoom automaticamente */}
                      <SlideRenderer
                        slideContent={slide}
                        slideIndex={index}
                        styles={carouselState.carouselData?.styles || {}}
                        templateId={templateInfo.templateId}
                        className="w-full h-full pointer-events-none"
                      />

                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-blue-500 text-white text-xs font-bold shadow-md z-10">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Slide counter */}
            <div className="relative z-10 text-center pb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-gray-600 text-sm font-medium shadow-sm">
                <span className="text-blue-600 font-bold">{carouselState.slides.length}</span>
                <span>slides</span>
              </span>
            </div>
          </section>

          {/* Bottom Section */}
          <section className="flex-1 px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 border-t border-gray-100">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
                {/* Description Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-white">
                    <div className="p-2 bg-blue-500 rounded-xl">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="font-semibold text-gray-900">Descrição do Post</h2>
                  </div>

                  <div className="p-5 max-h-[220px] sm:max-h-[280px] overflow-y-auto">
                    {description ? (
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                        {description}
                      </p>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-400 text-sm">Nenhuma descrição disponível</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Chat Card - Desktop */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="hidden lg:flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-white">
                    <div className="p-2 bg-blue-600 rounded-xl">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">Chat de Edição</h2>
                      <p className="text-xs text-gray-500">Peça alterações nos slides</p>
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto max-h-[180px] sm:max-h-[200px] space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-6">
                        <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-400 text-sm">Envie uma mensagem para editar</p>
                        <p className="text-gray-300 text-xs mt-1">Ex: "Mude o título do slide 1..."</p>
                      </div>
                    ) : (
                      <>
                        {chatMessages.map((msg, index) => (
                          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                                msg.role === 'user'
                                  ? 'bg-blue-500 text-white rounded-br-md'
                                  : 'bg-gray-100 text-gray-700 rounded-bl-md'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </>
                    )}
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChatMessage();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!chatMessage.trim()}
                        className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/10"
                >
                  {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {isDownloading ? 'Baixando...' : 'Download'}
                </button>

                <button
                  onClick={handlePreview}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                    color: 'white'
                  }}
                >
                  <InstagramIcon className="w-5 h-5" />
                  Preview Instagram
                </button>

                <button
                  onClick={handleOpenEditor}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/25 transition-all"
                >
                  <Edit3 className="w-5 h-5" />
                  Abrir Editor
                </button>
              </motion.div>
            </div>
          </section>
        </main>

        {/* Instagram Preview Modal */}
        <AnimatePresence>
          {isInstagramPreviewOpen && carouselState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
              onClick={() => setIsInstagramPreviewOpen(false)}
            >
              {/* Close button */}
              <button
                onClick={() => setIsInstagramPreviewOpen(false)}
                className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-50"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Instagram Post Container - Desktop Layout */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="hidden md:flex bg-black rounded-sm overflow-hidden"
                style={{
                  // Altura máxima de 85vh, largura calculada baseada no aspect ratio
                  maxHeight: '85vh',
                  // Para templates 1-6 (1080x1350 = 0.8 ratio), o post é mais "quadrado"
                  // Para templates 7-9 (1170x1560 = 0.75 ratio), o post é mais vertical
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Left side - Image/Carousel */}
                <div 
                  className="relative bg-black flex items-center justify-center overflow-hidden"
                  style={{
                    // A largura é calculada baseada no aspect ratio do template
                    // Templates 1-6: 1080/1350 = 0.8, Templates 7-9: 1170/1560 = 0.75
                    aspectRatio: templateInfo.aspectRatio,
                    height: '85vh',
                    maxHeight: '85vh'
                  }}
                >
                  {/* Carousel Navigation */}
                  {currentPreviewSlide > 0 && (
                    <button
                      onClick={handlePrevSlide}
                      className="absolute left-2 z-20 p-1.5 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-800" />
                    </button>
                  )}
                  {currentPreviewSlide < carouselState.slides.length - 1 && (
                    <button
                      onClick={handleNextSlide}
                      className="absolute right-2 z-20 p-1.5 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-800" />
                    </button>
                  )}

                  {/* Slide Image - Container com aspect ratio correto do template */}
                  <div className="w-full h-full">
                    <SlideRenderer
                      slideContent={carouselState.slides[currentPreviewSlide]}
                      slideIndex={currentPreviewSlide}
                      styles={carouselState.carouselData?.styles || {}}
                      templateId={templateInfo.templateId}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Carousel Dots */}
                  {carouselState.slides.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                      {carouselState.slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPreviewSlide(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            idx === currentPreviewSlide
                              ? 'bg-[#0095f6] scale-110'
                              : 'bg-white/60 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side - Post details */}
                <div 
                  className="bg-white flex flex-col border-l border-gray-200"
                  style={{ width: '340px', minWidth: '300px', maxWidth: '400px' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-3.5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar size="md" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{profileInfo.arroba}</p>
                        <p className="text-xs text-gray-500">Original audio</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-gray-900" />
                    </button>
                  </div>

                  {/* Description/Comments area */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {/* Original post caption */}
                    <div className="flex gap-3 mb-4">
                      <div className="flex-shrink-0">
                        <ProfileAvatar size="md" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-semibold mr-1">{profileInfo.arroba}</span>
                          <span className="whitespace-pre-wrap">{description || 'Sem descrição'}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">2h</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-200">
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-4">
                        <button className="hover:opacity-60 transition-opacity">
                          <Heart className="w-6 h-6 text-gray-900" />
                        </button>
                        <button className="hover:opacity-60 transition-opacity">
                          <CommentIcon className="w-6 h-6 text-gray-900" />
                        </button>
                        <button className="hover:opacity-60 transition-opacity">
                          <ShareIcon className="w-6 h-6 text-gray-900" />
                        </button>
                      </div>
                      <button className="hover:opacity-60 transition-opacity">
                        <Bookmark className="w-6 h-6 text-gray-900" />
                      </button>
                    </div>

                    {/* Likes */}
                    <div className="px-4 pb-2">
                      <p className="text-sm font-semibold text-gray-900">1,234 curtidas</p>
                    </div>

                    {/* Timestamp */}
                    <div className="px-4 pb-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">2 HORAS ATRÁS</p>
                    </div>

                    {/* Add comment */}
                    <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Adicione um comentário..."
                        className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                        readOnly
                      />
                      <button className="text-[#0095f6] font-semibold text-sm opacity-50">
                        Publicar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Instagram Post Container - Mobile Layout */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                className="md:hidden w-full h-full bg-white overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Header */}
                <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                  <button
                    onClick={() => setIsInstagramPreviewOpen(false)}
                    className="p-1"
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                  </button>
                  <span className="font-semibold text-gray-900">Publicação</span>
                  <div className="w-6" />
                </div>

                {/* Post Header */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <ProfileAvatar size="md" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{profileInfo.arroba}</p>
                    </div>
                  </div>
                  <button className="p-2">
                    <MoreHorizontal className="w-5 h-5 text-gray-900" />
                  </button>
                </div>

                {/* Image Carousel */}
                <div 
                  className="relative w-full bg-black overflow-hidden"
                  style={{ aspectRatio: templateInfo.aspectRatio }}
                >
                  {/* Navigation buttons */}
                  {currentPreviewSlide > 0 && (
                    <button
                      onClick={handlePrevSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-white/90 rounded-full shadow-lg"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-800" />
                    </button>
                  )}
                  {currentPreviewSlide < carouselState.slides.length - 1 && (
                    <button
                      onClick={handleNextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-white/90 rounded-full shadow-lg"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-800" />
                    </button>
                  )}

                  {/* Slide counter */}
                  {carouselState.slides.length > 1 && (
                    <div className="absolute top-3 right-3 z-20 px-2.5 py-1 bg-black/70 rounded-full">
                      <span className="text-xs text-white font-medium">
                        {currentPreviewSlide + 1}/{carouselState.slides.length}
                      </span>
                    </div>
                  )}

                  {/* Slide */}
                  <div className="w-full h-full">
                    <SlideRenderer
                      slideContent={carouselState.slides[currentPreviewSlide]}
                      slideIndex={currentPreviewSlide}
                      styles={carouselState.carouselData?.styles || {}}
                      templateId={templateInfo.templateId}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Carousel Dots - Mobile */}
                {carouselState.slides.length > 1 && (
                  <div className="flex justify-center gap-1 py-2 bg-white">
                    {carouselState.slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPreviewSlide(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentPreviewSlide
                            ? 'bg-[#0095f6]'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}

                  </div>
                )}

                {/* Actions - Mobile */}
                <div className="flex items-center justify-between px-3 py-2 bg-white">
                  <div className="flex items-center gap-4">
                    <button>
                      <Heart className="w-6 h-6 text-gray-900" />
                    </button>
                    <button>
                      <CommentIcon className="w-6 h-6 text-gray-900" />
                    </button>
                    <button>
                      <ShareIcon className="w-6 h-6 text-gray-900" />
                    </button>
                  </div>
                  <button>
                    <Bookmark className="w-6 h-6 text-gray-900" />
                  </button>
                </div>

                {/* Likes */}
                <div className="px-3 py-1 bg-white">
                  <p className="text-sm font-semibold text-gray-900">1,234 curtidas</p>
                </div>

                {/* Caption */}
                <div className="px-3 py-2 bg-white">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold mr-1">{profileInfo.arroba}</span>
                    <span className="whitespace-pre-wrap">{description ? (description.length > 100 ? description.substring(0, 100) + '...' : description) : 'Sem descrição'}</span>
                    {description && description.length > 100 && (
                      <button className="text-gray-400 ml-1">mais</button>
                    )}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="px-3 pb-4 bg-white">
                  <p className="text-[10px] text-gray-400 uppercase">2 horas atrás</p>
                </div>

                {/* Add comment - Mobile */}
                <div className="sticky bottom-0 flex items-center gap-3 px-3 py-3 bg-white border-t border-gray-200">
                  <ProfileAvatar size="sm" />
                  <input
                    type="text"
                    placeholder="Adicione um comentário..."
                    className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                    readOnly
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat mobile overlay */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsChatOpen(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden shadow-2xl"
                style={{ height: '75vh' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col h-full">
                  <div className="flex justify-center py-3">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                  </div>

                  <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-xl">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Chat de Edição</h3>
                        <p className="text-xs text-gray-500">Peça alterações nos slides</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 text-base">Envie uma mensagem para editar</p>
                        <p className="text-gray-400 text-sm mt-2">Ex: "Mude o título do slide 1..."</p>
                      </div>
                    ) : (
                      <>
                        {chatMessages.map((msg, index) => (
                          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                                msg.role === 'user'
                                  ? 'bg-blue-500 text-white rounded-br-md'
                                  : 'bg-gray-100 text-gray-700 rounded-bl-md'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </>
                    )}
                  </div>

                  <div className="p-5 border-t border-gray-100 bg-gray-50 pb-8">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChatMessage();
                      }}
                      className="flex gap-3"
                    >
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-base text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <button
                        type="submit"
                        disabled={!chatMessage.trim()}
                        className="p-3.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-40"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom CSS */}
      <style>{`
        /* Hide scrollbar for slides container */
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CarouselPreviewPage;