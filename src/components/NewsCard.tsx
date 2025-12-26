import React, { useState } from 'react';
import type { NewsItem } from '../types/news';
import { TemplateSelectionModal, GenerationOptions, SourceItem } from '../carousel';

interface NewsCardProps {
  news: NewsItem;
  onGenerateCarousel?: (newsData: NewsItem, templateId: string, options?: GenerationOptions) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, onGenerateCarousel }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cria o SourceItem inicial baseado na notícia
  const createInitialSource = (): SourceItem => ({
    type: 'news',
    id: `news-${news.id}`,
    code: news.url,
    title: news.title?.substring(0, 50) || 'Notícia',
    thumbnail: news.image,
    newsData: news,
  });

  const handleOpenModal = () => {
    if (!onGenerateCarousel) return;
    setIsModalOpen(true);
  };

  const handleSelectTemplate = (templateId: string, options?: GenerationOptions) => {
    if (onGenerateCarousel) {
      onGenerateCarousel(news, templateId, options);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hour12 = hours % 12 || 12;
    
    return `${month} ${day}, ${year} ${hour12}:${minutes} ${ampm}`;
  };

  const getAuthorName = (news: NewsItem) => {
    // Se tiver autor real, usar ele, senão criar um nome baseado no nicho
    if (news.niches?.name) {
      const nicheWords = news.niches.name.split(' ');
      return nicheWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Team';
    }
    return 'News Team';
  };

  return (
    <article className="border-b border-gray-200 py-8 first:pt-6 last:border-b-0 last:pb-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Red dot indicator */}
        <div className="flex-shrink-0 mt-2">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 leading-tight hover:text-purple-600 transition-colors cursor-pointer">
            {news.title}
          </h2>

          {/* Author and date */}
          <p className="text-sm text-gray-600 mb-4">
            <span className="">·</span>
            {formatDate(news.publishedAt)}
          </p>

          {/* Description */}
          <p className="text-gray-700 leading-relaxed mb-5 text-base">
            {news.description}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:text-gray-700 transition-colors group text-sm"
            >
              Leia mais
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
            
            {/* Generate Carousel Button */}
            {onGenerateCarousel && (
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Gerar Carrossel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Template */}
      {onGenerateCarousel && (
        <TemplateSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelectTemplate={handleSelectTemplate}
          postCode={news.id}
          initialSource={createInitialSource()}
        />
      )}
    </article>
  );
};

export default NewsCard;
