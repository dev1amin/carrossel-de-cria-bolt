import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useAnimation } from 'framer-motion';
import { Post, SortOption } from '../types';
import PostCard from './PostCard';
import {
  CarouselViewer,
  type CarouselData as CarouselDataType,
  type GenerationOptions,
  generateCarousel,
  templateService,
  templateRenderer
} from '../carousel';

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
  const feedRef = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth <= 768;
  const sortingInProgress = useRef(false);
  const dragY = useMotionValue(0);
  const controls = useAnimation();

  /**
   * Calcula o ranking absoluto de um post baseado em overallScore
   * Retorna a posição do post quando todos os posts são ordenados por overallScore
   * Isso garante que os top 3 posts sempre tenham os ícones, independente do filtro
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
      console.log('Generation options:', options);
      const result = await generateCarousel(code, templateId, undefined, postId, undefined, options);
      console.log('Carousel generated successfully:', result);

      if (result && result.length > 0) {
        const carouselData = result[0];
        const responseTemplateId = carouselData.dados_gerais.template;

        console.log(`Fetching template ${responseTemplateId}...`);
        const templateSlides = await templateService.fetchTemplate(responseTemplateId);

        console.log('Rendering slides with data...');
        const rendered = templateRenderer.renderAllSlides(templateSlides, carouselData);

        setRenderedSlides(rendered);
        setCarouselData(carouselData);
      }
    } catch (error) {
      console.error('Failed to generate carousel:', error);
      alert('Erro ao gerar carrossel. Verifique o console para mais detalhes.');
    }
  };

  useEffect(() => {
    console.log(`[Sort] Applying sort: ${activeSort}`);
    console.log(`[Sort] Total posts before filter:`, posts.length);
    let result = [...posts];

    // Removido filtro de media_type para mostrar todos os posts
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(post =>
        post.username.toLowerCase().includes(term) ||
        post.text.toLowerCase().includes(term)
      );
      console.log(`[Sort] After search filter:`, result.length);
    }

    // Filter for saved posts if 'saved' sort is active
    if (activeSort === 'saved') {
      result = result.filter(post => post.is_saved === true);
      console.log(`[Sort] After saved filter:`, result.length);
    } else {
      // Apply sorting for other options
      console.log(`[Sort] Sorting by:`, activeSort);
      result.sort((a, b) => {
        let comparison = 0;
        switch (activeSort) {
          case 'latest':
            // taken_at já vem normalizado em segundos pelo serviço
            comparison = (b.taken_at || 0) - (a.taken_at || 0);
            break;
          case 'popular':
            comparison = b.overallScore - a.overallScore;
            break;
          case 'likes':
            comparison = b.like_count - a.like_count;
            break;
          case 'comments':
            comparison = b.comment_count - a.comment_count;
            break;
          case 'shares':
            comparison = b.reshare_count - a.reshare_count;
            break;
          default:
            comparison = 0;
        }
        return comparison;
      });
      console.log(
        `[Sort] First 4 posts after sort:`,
        result.slice(0, 4).map(p => ({
          code: p.code,
          likes: p.like_count,
          overall: p.overallScore,
          taken_at: p.taken_at
        }))
      );
    }

    console.log(`[Sort] Final count:`, result.length);
    console.log(`[Sort] New post order: ${result.map(p => p.code).join(', ')}`);
    setFilteredPosts(result);

    // Reset to top quando sort muda
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setCurrentIndex(0);
  }, [posts, searchTerm, activeSort]);

  useEffect(() => {
    if (isMobile && feedRef.current) {
      document.body.style.overflow = 'hidden';

      const handleScroll = () => {
        if (feedRef.current && !sortingInProgress.current) {
          const scrollTop = feedRef.current.scrollTop;
          const itemHeight = window.innerHeight - 112;
          const newIndex = Math.round(scrollTop / itemHeight);
          const boundedIndex = Math.max(0, Math.min(newIndex, filteredPosts.length - 1));

          if (boundedIndex !== currentIndex) {
            console.log(`[Display] Current slide: ${boundedIndex}`);
            setCurrentIndex(boundedIndex);
          }
        }
      };

      const feedElement = feedRef.current;
      feedElement.addEventListener('scroll', handleScroll);

      return () => {
        feedElement.removeEventListener('scroll', handleScroll);
        document.body.style.overflow = 'auto';
      };
    }
  }, [isMobile, currentIndex, filteredPosts.length]);

  const handleDragEnd = async (_: unknown, info: { velocity: { y: number }; offset: { y: number } }) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    const itemHeight = window.innerHeight - 112;

    let direction = 0;
    if (Math.abs(velocity) > 500 || Math.abs(offset) > 50) {
      direction = velocity < 0 ? 1 : -1;
    }

    const targetIndex = Math.max(0, Math.min(currentIndex - direction, filteredPosts.length - 1));

    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: targetIndex * itemHeight,
        behavior: 'smooth'
      });
    }

    await controls.start({ y: 0 });
    setCurrentIndex(targetIndex);
  };

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
      <div>
        {filteredPosts.length > 0 ? (
          <div
            ref={feedRef}
            className={`container mx-auto ${isMobile ? 'px-0' : 'px-4'} py-2`}
          >
            {isMobile ? (
              <div className="snap-y snap-mandatory h-[calc(100vh-7rem)] overflow-y-auto">
                {filteredPosts.map(post => (
                  <motion.div
                    key={`${post.id}-${post.code}`}
                    className="snap-start h-[calc(100vh-7rem)] w-full flex items-start justify-center"
                    style={{ y: dragY }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    animate={controls}
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
              </div>
            ) : (
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
            )}
          </div>
        ) : (
          <div className="container mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
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
                ? 'Você ainda não tem posts no seu feed. Configure seus interesses nas configurações para começar a ver conteúdo.'
                : searchTerm
                ? `Nenhum post corresponde à sua busca por "${searchTerm}".`
                : activeSort === 'saved'
                ? 'Você ainda não salvou nenhum post. Clique no botão "Salvar" em um post para adicioná-lo aos seus salvos.'
                : 'Nenhum post corresponde aos filtros selecionados.'
              }
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Feed;