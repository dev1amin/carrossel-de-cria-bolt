import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, Sparkles, Music2 } from 'lucide-react';
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

// ==================== Mobile Reels Feed Component ====================
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
  showGenerateButtons = true
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

  const currentPost = posts[currentIndex];

  // Formatar números grandes (1.2K, 1.2M, etc)
  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Handle touch events para swipe vertical
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const timeDiff = Date.now() - touchStartTime.current;
    const velocity = Math.abs(diff) / timeDiff;
    
    // Swipe rápido ou distância suficiente
    if (velocity > 0.5 || Math.abs(diff) > 80) {
      if (diff > 0 && currentIndex < posts.length - 1) {
        // Swipe up - próximo
        onIndexChange(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe down - anterior
        onIndexChange(currentIndex - 1);
      }
    }
  };

  // Handler para gerar carrossel
  const handleGenerateClick = () => {
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    
    if (needsToneSetup === 'false' && currentPost) {
      setSelectedPost(currentPost);
      setIsModalOpen(true);
    } else if (onGenerateClick) {
      onGenerateClick();
    } else if (currentPost) {
      setSelectedPost(currentPost);
      setIsModalOpen(true);
    }
  };

  const handleSelectTemplate = (templateId: string, options?: GenerationOptions) => {
    if (onGenerateCarousel && selectedPost) {
      onGenerateCarousel(selectedPost.code, templateId, selectedPost.id, options);
    }
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // Handler para salvar/dessalvar
  const handleToggleSave = () => {
    if (!currentPost || currentPost.id === undefined) return;
    if (currentPost.is_saved) {
      onUnsavePost?.(currentPost.id);
    } else {
      onSavePost?.(currentPost.id);
    }
  };

  if (!currentPost) return null;

  // Determinar se é vídeo ou imagem
  const isVideo = currentPost.media_type === 2 || (currentPost.video_url && currentPost.video_url !== currentPost.image_url);
  const mediaUrl = isVideo ? currentPost.video_url : currentPost.image_url;

  return (
    <>
      <div 
        ref={containerRef}
        className="fixed inset-0 bg-black"
        style={{ bottom: '64px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Media Background (Imagem ou Vídeo fullscreen) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPost.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {isVideo && mediaUrl ? (
              <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : mediaUrl ? (
              <img
                src={mediaUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800" />
            )}
            {/* Gradient overlay para legibilidade do texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          </motion.div>
        </AnimatePresence>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-3 pb-2 px-4 safe-area-top">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-base">Reels</span>
            <span className="text-white/70 text-sm">
              {currentIndex + 1}/{posts.length}
            </span>
          </div>
        </div>

        {/* Right Side Actions (Instagram style) */}
        <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-5">
          {/* Likes */}
          <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(currentPost.like_count)}</span>
          </button>

          {/* Comments */}
          <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(currentPost.comment_count)}</span>
          </button>

          {/* Shares */}
          <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Send className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-xs font-medium">{formatCount(currentPost.reshare_count)}</span>
          </button>

          {/* Save */}
          {showSaveButtons && (
            <button 
              onClick={handleToggleSave}
              className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <Bookmark className={`w-7 h-7 ${currentPost.is_saved ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
              </div>
              <span className="text-white text-xs font-medium">Salvar</span>
            </button>
          )}

          {/* Generate Carousel Button */}
          {showGenerateButtons && (
            <button 
              onClick={handleGenerateClick}
              className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium">Gerar</span>
            </button>
          )}
        </div>

        {/* Bottom Info (Username + Description) */}
        <div className="absolute left-0 right-16 bottom-4 z-20 px-4">
          {/* Username */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {currentPost.username.substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
            <span className="text-white font-semibold text-sm">@{currentPost.username.substring(0, 15)}</span>
            <button className="ml-2 px-3 py-1 border border-white/50 rounded-md text-white text-xs font-medium">
              Seguir
            </button>
          </div>

          {/* Description */}
          <div 
            className={`${isDescExpanded ? '' : 'line-clamp-2'}`}
            onClick={() => setIsDescExpanded(!isDescExpanded)}
          >
            <p className="text-white text-sm leading-relaxed">
              {currentPost.text}
            </p>
          </div>
          {currentPost.text.length > 100 && !isDescExpanded && (
            <button 
              onClick={() => setIsDescExpanded(true)}
              className="text-white/60 text-sm mt-1"
            >
              ... mais
            </button>
          )}

          {/* Music indicator (simulated) */}
          <div className="flex items-center gap-2 mt-3">
            <Music2 className="w-4 h-4 text-white" />
            <div className="flex-1 overflow-hidden">
              <p className="text-white text-xs truncate animate-marquee">
                🎵 Áudio original - @{currentPost.username}
              </p>
            </div>
          </div>
        </div>

        {/* Swipe hint */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 opacity-50">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-white/40 text-xs flex flex-col items-center"
          >
            <span>↑</span>
            <span>Deslize</span>
          </motion.div>
        </div>
      </div>

      {/* Template Selection Modal */}
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

  // Detecta mudanças de tamanho de tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Calcula o ranking absoluto de um post baseado em overallScore
   */
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
        const templateSlides = await templateService.fetchTemplate(responseTemplateId);
        const rendered = templateRenderer.renderAllSlides(templateSlides, carouselData);

        setRenderedSlides(rendered);
        setCarouselData(carouselData);
      }
    } catch (error) {
      console.error('Failed to generate carousel:', error);
      alert('Erro ao gerar carrossel. Verifique o console para mais detalhes.');
    }
  };

  // Filtra e ordena posts
  useEffect(() => {
    let result = [...posts];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(post =>
        post.username.toLowerCase().includes(term) ||
        post.text.toLowerCase().includes(term)
      );
    }

    if (activeSort === 'saved') {
      result = result.filter(post => post.is_saved === true);
    } else {
      result.sort((a, b) => {
        switch (activeSort) {
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
  }, [posts, searchTerm, activeSort]);

  // Empty state
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
            : searchTerm
            ? `Nenhum post corresponde à sua busca por "${searchTerm}".`
            : activeSort === 'saved'
            ? 'Você ainda não salvou nenhum post.'
            : 'Nenhum post corresponde aos filtros selecionados.'}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Carousel Viewer Modal */}
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

      {/* ============= MOBILE FEED (Reels Style - Fullscreen) ============= */}
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
        />
      ) : (
        /* ============= DESKTOP FEED (Grid) ============= */
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
