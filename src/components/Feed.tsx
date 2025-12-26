import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Sparkles,
  SlidersHorizontal,
  Search,
  X,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  Clock,
  Flame
} from 'lucide-react';
import { Post, SortOption } from '../types';
import PostCard from './PostCard';
import TemplateSelectionModal, { GenerationOptions } from './carousel/TemplateSelectionModal';
import {
  CarouselViewer,
  type CarouselData as CarouselDataType,
  generateCarousel,
  templateService,
  templateRenderer
} from '../carousel';

// ==================== Mobile Stories Feed Component ====================
interface MobileReelsFeedProps {
  posts: Post[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onGenerateCarousel?: (code: string, templateId: string, postId?: number, options?: GenerationOptions) => void;
  onGenerateClick?: () => void;
  onSavePost?: (postId: number) => void;
  onUnsavePost?: (postId: number) => void;
  showSaveButtons?: boolean;
  showGenerateButtons?: boolean;
  mobileSearchTerm: string;
  setMobileSearchTerm: (t: string) => void;
  mobileSort: SortOption;
  setMobileSort: (s: SortOption) => void;
}

const MobileReelsFeed: React.FC<MobileReelsFeedProps> = ({
  posts,
  currentIndex,
  onIndexChange,
  onGenerateCarousel,
  onGenerateClick,
  onSavePost,
  onUnsavePost,
  showSaveButtons = false,
  showGenerateButtons = true,
  mobileSearchTerm,
  setMobileSearchTerm,
  mobileSort,
  setMobileSort
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState<Record<number, boolean>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);

  const currentPost = posts[currentIndex];

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const goToNext = useCallback(() => {
    if (currentIndex < posts.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, posts.length, onIndexChange]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 50;
    const velocityThreshold = 500;

    if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
      goToNext();
    } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
      goToPrev();
    }
  };

  const handleGenerateClick = () => {
    console.log('🔵 [MOBILE] handleGenerateClick chamado');
    console.log('🔵 [MOBILE] onGenerateClick existe?', !!onGenerateClick);
    console.log('🔵 [MOBILE] currentPost existe?', !!currentPost);
    console.log('🔵 [MOBILE] currentPost:', currentPost);
    
    // No mobile, sempre verifica o tone setup primeiro via onGenerateClick
    if (onGenerateClick) {
      console.log('🟢 [MOBILE] Chamando onGenerateClick para verificar tone setup...');
      onGenerateClick();
      
      // Verifica se precisa de tone setup
      const needsToneSetup = localStorage.getItem('needs_tone_setup');
      console.log('🔍 [MOBILE] needs_tone_setup?', needsToneSetup);
      
      if (needsToneSetup === 'true') {
        console.log('⚠️ [MOBILE] Precisa de tone setup, modal não será aberto');
        return;
      }
    }
    
    // Se não precisa de tone setup (ou não tem onGenerateClick), abre o modal
    if (currentPost) {
      console.log('🟢 [MOBILE] Abrindo modal de seleção de template...');
      setSelectedPost(currentPost);
      setIsModalOpen(true);
    } else {
      console.log('🔴 [MOBILE] Nenhuma ação executada - sem currentPost');
    }
  };

  const handleSelectTemplate = (templateId: string, options?: GenerationOptions) => {
    if (onGenerateCarousel && selectedPost) {
      onGenerateCarousel(selectedPost.code, templateId, selectedPost.id, options);
    }
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleToggleSave = () => {
    if (!currentPost || currentPost.id === undefined) return;
    if (currentPost.is_saved) onUnsavePost?.(currentPost.id);
    else onSavePost?.(currentPost.id);
  };

  const sortLabels: Record<SortOption, { label: string; icon: React.ReactNode }> = {
    latest: { label: 'Recentes', icon: <Clock className="w-4 h-4" /> },
    popular: { label: 'Popular', icon: <Flame className="w-4 h-4" /> },
    likes: { label: 'Curtidas', icon: <Heart className="w-4 h-4" /> },
    comments: { label: 'Comentários', icon: <MessageCircle className="w-4 h-4" /> },
    shares: { label: 'Shares', icon: <Send className="w-4 h-4" /> },
    saved: { label: 'Salvos', icon: <Bookmark className="w-4 h-4" /> }
  };

  if (!currentPost) return null;

  return (
    <>
      {/* Main container - fundo claro como o site */}
      <div className="fixed inset-0 bg-light overflow-hidden flex flex-col" style={{ bottom: '64px' }}>
        
        {/* Header simples apenas com filtros */}
        <div className="flex-shrink-0 bg-white border-b border-gray-light px-4 py-2 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-900 text-2xl font-bold">Feed</span>
              <span className="text-gray text-xs font-medium">
                {currentIndex + 1} / {posts.length}
              </span>
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              className="w-9 h-9 rounded-full bg-light flex items-center justify-center"
            >
              <SlidersHorizontal className="w-4 h-4 text-gray-dark" />
            </button>
          </div>
        </div>

        {/* Content area - swipeable */}
        <motion.div
          ref={containerRef}
          className="flex-1 overflow-hidden"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          style={{ x: dragX, touchAction: 'pan-y', transform: 'none !important' }}
        >
          <div className="h-full flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPost.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                {/* Embed area - altura fixa de 560px */}
                <div className="flex-shrink-0 bg-white relative" style={{ height: '135vw' }}>
                  {!iframeLoaded[currentIndex] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-light z-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-gray-light border-t-blue rounded-full animate-spin" />
                        <span className="text-gray text-xs">Carregando...</span>
                      </div>
                    </div>
                  )}
                  
                  <iframe
                    key={currentPost.code}
                    src={`https://www.instagram.com/p/${currentPost.code}/embed`}
                    allow="autoplay; encrypted-media"
                    scrolling="no"
                    onLoad={() => setIframeLoaded(prev => ({ ...prev, [currentIndex]: true }))}
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>

                {/* Botões de ação e Métricas juntos */}
                <div className="flex-1 bg-white border-t border-gray-light px-4 py-4 flex flex-col justify-center">
                  {/* Botões */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setDetailsOpen(true)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-light flex items-center justify-center gap-2 active:bg-gray-light transition-colors"
                    >
                      <Eye className="w-4 h-4 text-gray-dark" />
                      <span className="text-gray-dark text-sm font-medium">Ver descrição</span>
                    </button>

                    {showGenerateButtons && (
                      <button
                        onClick={handleGenerateClick}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-blue flex items-center justify-center gap-2 active:bg-blue-dark transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-semibold">Gerar Carrossel</span>
                      </button>
                    )}

                    {showSaveButtons && (
                      <button
                        onClick={handleToggleSave}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                          currentPost.is_saved 
                            ? 'bg-blue text-white' 
                            : 'bg-light text-gray-dark active:bg-gray-light'
                        }`}
                      >
                        <Bookmark className={`w-5 h-5 ${currentPost.is_saved ? 'fill-white' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Métricas maiores */}
                  <div className="flex items-center justify-around">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-red-500" />
                      </div>
                      <span className="text-dark font-bold text-base">{formatCount(currentPost.like_count)}</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-dark font-bold text-base">{formatCount(currentPost.comment_count)}</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                        <Send className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="text-dark font-bold text-base">{formatCount(currentPost.reshare_count)}</span>
                    </div>
                    
                    {currentPost.overallScore && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-amber-600" />
                        </div>
                        <span className="text-dark font-bold text-base">{Math.round(currentPost.overallScore)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Navigation dots */}
        <div className="flex-shrink-0 bg-white py-2 flex items-center justify-center gap-3">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              currentIndex === 0 ? 'bg-light text-gray-light' : 'bg-light text-gray-dark active:bg-gray-light'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex gap-1">
            {posts.slice(Math.max(0, currentIndex - 3), Math.min(posts.length, currentIndex + 4)).map((_, idx) => {
              const actualIdx = Math.max(0, currentIndex - 3) + idx;
              return (
                <button
                  key={actualIdx}
                  onClick={() => onIndexChange(actualIdx)}
                  className={`h-1.5 rounded-full transition-all ${
                    actualIdx === currentIndex 
                      ? 'w-6 bg-blue' 
                      : 'w-1.5 bg-gray-light'
                  }`}
                />
              );
            })}
          </div>
          
          <button
            onClick={goToNext}
            disabled={currentIndex === posts.length - 1}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              currentIndex === posts.length - 1 ? 'bg-light text-gray-light' : 'bg-light text-gray-dark active:bg-gray-light'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Details bottom sheet */}
      <AnimatePresence>
        {detailsOpen && (
          <motion.div
            className="fixed inset-0 z-[100] bg-dark/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailsOpen(false)}
          >
            <motion.div
              className="absolute left-0 right-0 bottom-0 max-h-[75vh] bg-white rounded-t-2xl overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 rounded-full bg-gray-light" />
              </div>

              <div className="px-5 pb-8 overflow-y-auto max-h-[calc(75vh-48px)]">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-dark font-bold text-lg">{currentPost.influencer_name || currentPost.username}</p>
                    <p className="text-gray text-sm">{formatDate(currentPost.taken_at)}</p>
                  </div>
                  <button
                    onClick={() => setDetailsOpen(false)}
                    className="w-9 h-9 rounded-full bg-light flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gray-dark" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  <div className="bg-light rounded-xl p-3 text-center">
                    <Heart className="w-5 h-5 text-gray mx-auto mb-1" />
                    <p className="text-dark font-bold text-sm">{formatCount(currentPost.like_count)}</p>
                    <p className="text-gray text-[10px]">Curtidas</p>
                  </div>
                  <div className="bg-light rounded-xl p-3 text-center">
                    <MessageCircle className="w-5 h-5 text-gray mx-auto mb-1" />
                    <p className="text-dark font-bold text-sm">{formatCount(currentPost.comment_count)}</p>
                    <p className="text-gray text-[10px]">Comentários</p>
                  </div>
                  <div className="bg-light rounded-xl p-3 text-center">
                    <Send className="w-5 h-5 text-gray mx-auto mb-1" />
                    <p className="text-dark font-bold text-sm">{formatCount(currentPost.reshare_count)}</p>
                    <p className="text-gray text-[10px]">Shares</p>
                  </div>
                  <div className="bg-light rounded-xl p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-blue mx-auto mb-1" />
                    <p className="text-dark font-bold text-sm">{Math.round(currentPost.overallScore || 0)}</p>
                    <p className="text-gray text-[10px]">Score</p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-5">
                  <h3 className="text-gray text-xs font-semibold uppercase tracking-wider mb-2">Descrição</h3>
                  <div className="bg-light rounded-xl p-4">
                    <p className="text-dark text-sm leading-relaxed whitespace-pre-wrap">
                      {currentPost.text || 'Sem descrição disponível.'}
                    </p>
                  </div>
                </div>

                {/* Link */}
                <a
                  href={`https://www.instagram.com/p/${currentPost.code}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 rounded-xl bg-blue-light/30 text-center text-blue text-sm font-medium"
                >
                  Ver no Instagram →
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters bottom sheet */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            className="fixed inset-0 z-[100] bg-dark/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFiltersOpen(false)}
          >
            <motion.div
              className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 rounded-full bg-gray-light" />
              </div>

              <div className="px-5 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-dark font-bold text-lg">Filtros</h2>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="w-9 h-9 rounded-full bg-light flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-gray-dark" />
                  </button>
                </div>

                {/* Sort options */}
                <div className="mb-6">
                  <label className="text-gray text-xs font-semibold uppercase tracking-wider mb-3 block">
                    Ordenar por
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setMobileSort(opt)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          mobileSort === opt
                            ? 'bg-blue text-white'
                            : 'bg-light text-gray-dark'
                        }`}
                      >
                        {sortLabels[opt].icon}
                        {sortLabels[opt].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template modal */}
      <TemplateSelectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPost(null);
        }}
        onSelectTemplate={handleSelectTemplate}
        postCode={selectedPost?.code || ''}
      />
    </>
  );
};

// ==================== Main Feed Component ====================

interface FeedProps {
  posts: Post[];
  searchTerm: string;
  activeSort: SortOption;
  onGenerateCarousel?: (code: string, templateId: string, postId?: number, options?: GenerationOptions) => void;
  onGenerateClick?: () => void;
  feedId?: string | null;
  onSavePost?: (postId: number) => void;
  onUnsavePost?: (postId: number) => void;
  showSaveButtons?: boolean;
  showGenerateButtons?: boolean;
}

type CarouselData = CarouselDataType;

const Feed: React.FC<FeedProps> = ({
  posts,
  searchTerm,
  activeSort,
  onGenerateCarousel: onGenerateCarouselProp,
  onGenerateClick,
  feedId,
  onSavePost,
  onUnsavePost,
  showSaveButtons = false,
  showGenerateButtons = true
}) => {
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(posts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [renderedSlides, setRenderedSlides] = useState<string[] | null>(null);
  const [carouselData, setCarouselData] = useState<CarouselData | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // filtros só no mobile (não altera desktop)
  const [mobileSearchTerm, setMobileSearchTerm] = useState<string>('');
  const [mobileSort, setMobileSort] = useState<SortOption>('latest');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileSearchTerm(searchTerm || '');
  }, [searchTerm]);

  useEffect(() => {
    setMobileSort(activeSort);
  }, [activeSort]);

  const getAbsoluteRanking = (post: Post): number => {
    const sortedByScore = [...posts].sort((a, b) => b.overallScore - a.overallScore);
    return sortedByScore.findIndex(p => p.id === post.id);
  };

  const handleGenerateCarousel = async (code: string, templateId: string, postId?: number, options?: GenerationOptions) => {
    if (onGenerateCarouselProp) {
      onGenerateCarouselProp(code, templateId, postId, options);
      return;
    }

    try {
      console.log(`Generating carousel for post: ${code} with template: ${templateId}`);
      const result = await generateCarousel(code, templateId, undefined, postId, undefined, options);

      if (result && result.length > 0) {
        const carouselData = result[0];
        const responseTemplateId = carouselData.dados_gerais.template;
        
        // Normaliza o ID do template (mapeia "1" -> "1-react", etc.)
        const normalizedTemplateId = templateService.normalizeTemplateId(responseTemplateId);
        
        let rendered: string[];
        
        // Se for template React, retorna dados JSON para o ReactSlideRenderer
        if (templateService.isReactTemplate(normalizedTemplateId)) {
          console.log(`⚡ Template React detectado: ${normalizedTemplateId}`);
          rendered = carouselData.conteudos.map((slideData: any, index: number) => 
            JSON.stringify({
              __reactTemplate: true,
              templateId: normalizedTemplateId,
              slideIndex: index,
              slideData: slideData,
              dadosGerais: carouselData.dados_gerais,
            })
          );
        } else {
          const templateSlides = await templateService.fetchTemplate(normalizedTemplateId);
          rendered = templateRenderer.renderAllSlides(templateSlides, carouselData);
        }

        setRenderedSlides(rendered);
        setCarouselData(carouselData);
      }
    } catch (error) {
      console.error('Failed to generate carousel:', error);
      alert('Erro ao gerar carrossel. Verifique o console para mais detalhes.');
    }
  };

  // Filtra e ordena posts (desktop igual ao antigo; mobile usa states próprios)
  useEffect(() => {
    let result = [...posts];

    const effectiveSearch = isMobile ? mobileSearchTerm : searchTerm;
    const effectiveSort = isMobile ? mobileSort : activeSort;

    if (effectiveSearch) {
      const term = effectiveSearch.toLowerCase();
      result = result.filter(post =>
        post.username.toLowerCase().includes(term) ||
        post.text.toLowerCase().includes(term)
      );
    }

    if (effectiveSort === 'saved') {
      result = result.filter(post => post.is_saved === true);
    } else {
      result.sort((a, b) => {
        switch (effectiveSort) {
          case 'latest':
            return (b.taken_at || 0) - (a.taken_at || 0);
          case 'popular':
            return b.overallScore - a.overallScore;
          case 'likes':
            return b.like_count - a.like_count;
          case 'comments':
            return b.comment_count - a.comment_count;
          case 'shares':
            return b.reshare_count - a.reshare_count;
          default:
            return 0;
        }
      });
    }

    setFilteredPosts(result);
    setCurrentIndex(0);
  }, [posts, searchTerm, activeSort, isMobile, mobileSearchTerm, mobileSort]);

  if (filteredPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <svg
          width="100"
          height="100"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400 mb-4"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M7 3v18" />
          <path d="M3 7.5h4" />
          <path d="M3 12h18" />
          <path d="M3 16.5h4" />
          <path d="M17 3v18" />
          <path d="M17 7.5h4" />
          <path d="M17 16.5h4" />
        </svg>
        <h2 className="text-2xl font-semibold mb-2 text-gray-900">
          {posts.length === 0 ? 'Nenhum post disponível' : 'Nenhum post encontrado'}
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          {posts.length === 0
            ? 'Você ainda não tem posts no seu feed. Configure seus interesses nas configurações.'
            : (isMobile ? mobileSearchTerm : searchTerm)
            ? `Nenhum post corresponde à sua busca.`
            : (isMobile ? mobileSort : activeSort) === 'saved'
            ? 'Você ainda não salvou nenhum post.'
            : 'Nenhum post corresponde aos filtros selecionados.'}
        </p>
      </div>
    );
  }

  return (
    <>
      {renderedSlides && carouselData && (
        <CarouselViewer
          slides={renderedSlides}
          carouselData={carouselData}
          onClose={() => {
            setRenderedSlides(null);
            setCarouselData(null);
          }}
        />
      )}

      {/* MOBILE */}
      {isMobile ? (
        <MobileReelsFeed
          posts={filteredPosts}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          onGenerateCarousel={handleGenerateCarousel}
          onGenerateClick={onGenerateClick}
          onSavePost={onSavePost}
          onUnsavePost={onUnsavePost}
          showSaveButtons={showSaveButtons}
          showGenerateButtons={showGenerateButtons}
          mobileSearchTerm={mobileSearchTerm}
          setMobileSearchTerm={setMobileSearchTerm}
          mobileSort={mobileSort}
          setMobileSort={setMobileSort}
        />
      ) : (
        /* DESKTOP (EXATAMENTE COMO ESTAVA) */
        <div className="container mx-auto px-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
            <AnimatePresence>
              {filteredPosts.map(post => (
                <motion.div
                  key={`${post.id}-${post.code}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex justify-center"
                >
                  <PostCard
                    post={post}
                    index={getAbsoluteRanking(post)}
                    activeSort={activeSort}
                    onGenerateCarousel={handleGenerateCarousel}
                    onGenerateClick={onGenerateClick}
                    feedId={feedId}
                    onSavePost={onSavePost}
                    onUnsavePost={onUnsavePost}
                    showSaveButtons={showSaveButtons}
                    showGenerateButtons={showGenerateButtons}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
};

export default Feed;