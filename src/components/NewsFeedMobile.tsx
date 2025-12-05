import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ExternalLink, Bookmark, Share2, Globe } from 'lucide-react';
import { TemplateSelectionModal, GenerationOptions } from '../carousel';
import type { NewsItem } from '../types/news';

interface NewsFeedMobileProps {
  news: NewsItem[];
  onGenerateCarousel?: (newsData: NewsItem, templateId: string, options?: GenerationOptions) => void;
  onGenerateClick?: () => void;
}

const NewsFeedMobile: React.FC<NewsFeedMobileProps> = ({
  news,
  onGenerateCarousel,
  onGenerateClick
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validNews, setValidNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

  // Valida imagens ao montar
  useEffect(() => {
    const validateAllImages = async () => {
      setIsLoading(true);
      const validItems: NewsItem[] = [];
      
      const batchSize = 10;
      for (let i = 0; i < news.length; i += batchSize) {
        const batch = news.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (item) => {
            if (item.image) {
              return new Promise<NewsItem | null>((resolve) => {
                const img = new Image();
                img.onload = () => resolve(item);
                img.onerror = () => resolve(null);
                setTimeout(() => resolve(null), 5000);
                img.src = item.image;
              });
            }
            return null;
          })
        );
        
        results.forEach(item => {
          if (item) validItems.push(item);
        });
      }
      
      setValidNews(validItems);
      setIsLoading(false);
    };

    if (news.length > 0) {
      validateAllImages();
    } else {
      setIsLoading(false);
    }
  }, [news]);

  // Touch handlers com detecção de velocidade
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const timeDiff = Date.now() - touchStartTime.current;
    const velocity = Math.abs(diff) / timeDiff;
    
    if (velocity > 0.5 || Math.abs(diff) > 80) {
      if (diff > 0 && currentIndex < validNews.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsDescExpanded(false);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setIsDescExpanded(false);
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const handleOpenModal = (newsItem: NewsItem) => {
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    
    if (needsToneSetup === 'false') {
      setSelectedNews(newsItem);
      setIsModalOpen(true);
    } else if (onGenerateClick) {
      onGenerateClick();
    } else {
      setSelectedNews(newsItem);
      setIsModalOpen(true);
    }
  };

  const handleSelectTemplate = (templateId: string, options?: GenerationOptions) => {
    if (onGenerateCarousel && selectedNews) {
      onGenerateCarousel(selectedNews, templateId, options);
    }
    setIsModalOpen(false);
    setSelectedNews(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center" style={{ bottom: '64px' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80">Carregando notícias...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (validNews.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4" style={{ bottom: '64px' }}>
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-white text-lg font-medium mb-2">Nenhuma notícia disponível</p>
          <p className="text-gray-400 text-sm">Configure seus nichos nas configurações</p>
        </div>
      </div>
    );
  }

  const currentNews = validNews[currentIndex];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black"
        style={{ bottom: '64px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Fullscreen Image Background */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNews.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <img
              src={currentNews.image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x1200?text=Imagem+não+disponível';
              }}
            />
            {/* Gradient overlays para legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
          </motion.div>
        </AnimatePresence>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-3 pb-2 px-4 safe-area-top">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-base">Notícias</span>
            <span className="text-white/70 text-sm">
              {currentIndex + 1}/{validNews.length}
            </span>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="absolute right-3 bottom-36 z-20 flex flex-col items-center gap-5">
          {/* Open Original Link */}
          <a 
            href={currentNews.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Link</span>
          </a>

          {/* Share */}
          <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Enviar</span>
          </button>

          {/* Save */}
          <button className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Salvar</span>
          </button>

          {/* Generate Carousel */}
          <button 
            onClick={() => handleOpenModal(currentNews)}
            className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Gerar</span>
          </button>
        </div>

        {/* Bottom Info */}
        <div className="absolute left-0 right-16 bottom-6 z-20 px-4">
          {/* Source / Niche badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/80 backdrop-blur-sm rounded-full">
              <span className="text-white text-xs font-medium">{currentNews.niches.name}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full">
              <Globe className="w-3 h-3 text-white/80" />
              <span className="text-white/80 text-xs">
                {getFlagEmoji(currentNews.country)} {currentNews.country.toUpperCase()}
              </span>
            </div>
            <span className="text-white/60 text-xs ml-auto">
              {formatTimeAgo(currentNews.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-white font-bold text-lg leading-tight mb-2">
            {currentNews.title}
          </h2>

          {/* Description */}
          <div 
            className={`${isDescExpanded ? '' : 'line-clamp-2'}`}
            onClick={() => setIsDescExpanded(!isDescExpanded)}
          >
            <p className="text-white/80 text-sm leading-relaxed">
              {currentNews.description}
            </p>
          </div>
          {currentNews.description && currentNews.description.length > 100 && !isDescExpanded && (
            <button 
              onClick={() => setIsDescExpanded(true)}
              className="text-white/50 text-sm mt-1"
            >
              ... ver mais
            </button>
          )}

          {/* Content preview */}
          {isDescExpanded && currentNews.content && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-white/60 text-xs mt-2 line-clamp-4"
            >
              {currentNews.content}
            </motion.p>
          )}
        </div>

        {/* Swipe hint */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 opacity-40">
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
      {selectedNews && (
        <TemplateSelectionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNews(null);
          }}
          onSelectTemplate={handleSelectTemplate}
          postCode={selectedNews.id}
        />
      )}
    </>
  );
};

export default NewsFeedMobile;
