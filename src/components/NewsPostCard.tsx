import React, { useState } from 'react';
import { Sparkles, Newspaper, Bookmark } from 'lucide-react';
import { TemplateSelectionModal } from '../carousel';
import type { NewsItem } from '../types/news';
import { motion } from 'framer-motion';

interface NewsPostCardProps {
  news: NewsItem;
  index: number;
  onGenerateCarousel?: (newsData: NewsItem, templateId: string) => void;
}

const NewsPostCard: React.FC<NewsPostCardProps> = ({ news, index, onGenerateCarousel }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    if (!onGenerateCarousel) return;
    setIsModalOpen(true);
  };

  const handleSelectTemplate = (templateId: string) => {
    if (onGenerateCarousel) {
      onGenerateCarousel(news, templateId);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const handleOpenOriginal = () => {
    window.open(news.url, '_blank');
  };

  // Limita o conteúdo para exibir apenas o início com "..."
  const getTruncatedContent = (content: string, maxLength: number) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <motion.div
      className="relative w-full max-w-[300px] rounded-2xl overflow-hidden shadow-lg bg-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 py-3 flex items-center justify-between text-gray-800 border-b border-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-purple-400">
            <Newspaper className="w-4 h-4 mr-1" />
            <span className="font-bold text-xs text-gray-400">{news.niches.name}</span>
          </div>
        </div>
        <span className="text-sm text-gray-400 font-bold">{formatTimeAgo(news.publishedAt)}</span>
      </div>

      <div className="relative w-full" style={{ paddingBottom: '140%' }}>
        {/* News Content */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden bg-white">
          {/* Image */}
          {news.image && (
            <div className="relative w-full h-[200px] overflow-hidden bg-white">
              <img
                src={news.image}
                alt={news.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                <span className="px-2 py-0.5 bg-black bg-opacity-60 rounded-lg text-xs text-white font-bold">
                  {getFlagEmoji(news.country)} {news.country.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 bg-black bg-opacity-60 rounded-lg text-xs text-white font-bold">
                  {news.lang.toUpperCase()}
                </span>
              </div>
              {news.recommend && (
                <div className="absolute top-2 right-2">
                  <div className="px-3 py-1.5 bg-gradient-to-r from-primary-500 to-accent-500 backdrop-blur-sm rounded-full text-xs text-white font-bold flex items-center gap-1.5 shadow-glow">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Recomendado pela IA</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div 
            className="p-4 h-[calc(100%-200px)] overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#374151 transparent',
            }}
          >
            <style>{`
              div::-webkit-scrollbar {
                width: 2px;
              }
              div::-webkit-scrollbar-track {
                background: transparent;
              }
              div::-webkit-scrollbar-thumb {
                background-color: #374151;
                border-radius: 10px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background-color: #4B5563;
              }
            `}</style>
            <h3 className="text-gray-900 font-bold text-base mb-2 line-clamp-3">
              {news.title}
            </h3>
            <p className="text-gray-800 text-sm mb-3 line-clamp-3">
              {getTruncatedContent(news.description, 150)}
            </p>
            {news.content && (
              <p className="text-gray-700 text-xs line-clamp-8">
                {getTruncatedContent(news.content, 200)}
              </p>
            )}
          </div>
        </div>

        {/* Buttons Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-50">
          <div className="flex items-center justify-between">
            <div className="bg-white text-gray-900 px-3 py-1.5 rounded-full text-sm flex items-center space-x-2">
              <Newspaper className="w-4 h-4 text-gray-900" />
              <span>#{index + 1}</span>
            </div>
            {onGenerateCarousel && (
              <div className="flex gap-2">
                <button
                  onClick={() => {}}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 px-3 py-1.5 rounded-full text-sm flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
                <button
                  onClick={handleOpenModal}
                  className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-3 py-1.5 rounded-full text-sm flex items-center space-x-2 transition-all shadow-glow hover:shadow-xl"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar</span>
                </button>
              </div>
            )}
          </div>
          {onGenerateCarousel && (
            <TemplateSelectionModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSelectTemplate={handleSelectTemplate}
              postCode={news.id}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NewsPostCard;