import React, { useState } from 'react';
import {
  Heart,
  Play,
  Trophy,
  Medal,
  Award,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Info,
  MessageCircle,
  Share2
} from 'lucide-react';
import { TemplateSelectionModal, GenerationOptions } from '../carousel';
import { Post, SortOption } from '../types';
import { formatNumber, isPostOld, getDaysAgo } from '../utils/formatters';
import { saveContent, unsaveContent } from '../services/feed';

interface PostCardProps {
  post: Post;
  index: number;
  activeSort: SortOption; // filtro atual
  onGenerateCarousel?: (code: string, templateId: string, postId?: number, options?: GenerationOptions) => void;
  onGenerateClick?: () => void;
  feedId?: string | null;
  onSavePost?: (postId: number) => void;
  onUnsavePost?: (postId: number) => void;
  showSaveButtons?: boolean;
  showGenerateButtons?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  index,
  activeSort,
  onGenerateCarousel,
  onGenerateClick,
  feedId,
  onSavePost,
  onUnsavePost,
  showSaveButtons = false,
  showGenerateButtons = true
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [isSaving, setIsSaving] = useState(false);

  // Atualizar isSaved quando post.is_saved mudar
  React.useEffect(() => {
    setIsSaved(post.is_saved || false);
  }, [post.is_saved]);

  const handleOpenModal = () => {
    const needsToneSetup = localStorage.getItem('needs_tone_setup');

    if (needsToneSetup === 'false') {
      if (!onGenerateCarousel) return;
      setIsModalOpen(true);
      return;
    }

    if (onGenerateClick) {
      onGenerateClick();
      return;
    }

    if (!onGenerateCarousel) return;
    setIsModalOpen(true);
  };

  const handleSelectTemplate = (templateId: string, options?: GenerationOptions) => {
    console.log('🔄 PostCard - handleSelectTemplate called');
    console.log('🔄 Template ID:', templateId);
    console.log('🔄 Options:', options);
    if (onGenerateCarousel) {
      console.log('🔄 Calling onGenerateCarousel with:', post.code, templateId, post.id, options);
      onGenerateCarousel(post.code, templateId, post.id, options);
    } else {
      console.log('⚠️ onGenerateCarousel is not defined!');
    }
  };

  const handleSaveToggle = async () => {
    if (!post.id) {
      console.error('❌ Post ID is missing');
      return;
    }

    if (isSaving) {
      return;
    }

    setIsSaving(true);

    const previousState = isSaved;
    setIsSaved(!isSaved);

    try {
      if (previousState) {
        if (onUnsavePost) {
          await onUnsavePost(post.id);
        } else {
          await unsaveContent(post.id, feedId!);
        }
      } else {
        if (onSavePost) {
          await onSavePost(post.id);
        } else {
          await saveContent(post.id, feedId!);
        }
      }
    } catch (error) {
      console.error('❌ Error toggling save status:', error);
      setIsSaved(previousState);
    } finally {
      setIsSaving(false);
    }
  };

  // taken_at já vem em segundos Unix do serviço
  const formatTimeAgo = (rawTimestamp: number | null | undefined) => {
    if (rawTimestamp === null || rawTimestamp === undefined) {
      return '';
    }

    const timestamp = Number(rawTimestamp);

    if (!Number.isFinite(timestamp)) {
      console.warn('❌ Invalid taken_at value in PostCard:', rawTimestamp);
      return '';
    }

    const now = Math.floor(Date.now() / 1000); // segundos
    let diff = now - timestamp;

    if (!Number.isFinite(diff) || diff < 0) {
      diff = 0;
    }

    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes}m ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diff / 86400);
      return `${days}d ago`;
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-4 h-4 text-white" />;
      case 1:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 2:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return <Award className="w-4 h-4 text-white" />;
    }
  };

  // Ícone + valor principal para filtros que NÃO são "popular"
  let PrimaryIcon: React.ElementType = Heart;
  let primaryValue: string = formatNumber(post.like_count);
  let primaryColor = 'rgb(255, 0, 0)'; // padrão vermelho

  switch (activeSort) {
    case 'likes':
      PrimaryIcon = Heart;
      primaryValue = formatNumber(post.like_count);
      primaryColor = 'rgb(255, 0, 0)'; // vermelho
      break;
    case 'comments':
      PrimaryIcon = MessageCircle;
      primaryValue = formatNumber(post.comment_count);
      primaryColor = 'rgb(0, 171, 63)'; // verde (mesmo do play)
      break;
    case 'shares':
      PrimaryIcon = Share2;
      primaryValue = formatNumber(post.reshare_count);
      primaryColor = 'rgb(59, 130, 246)'; // azul
      break;
    case 'latest':
    case 'saved':
    default:
      PrimaryIcon = Heart;
      primaryValue = formatNumber(post.like_count);
      primaryColor = 'rgb(255, 0, 0)';
      break;
  }

  const textMetricStyle: React.CSSProperties = {
    color: 'rgb(156 163 175 / var(--tw-text-opacity, 1))'
  };

  return (
    <div className="relative w-full max-w-[300px] bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-gray-100">
        <div className="flex items-center space-x-4">
          {/* TOPO DO CARD */}
          {activeSort === 'popular' ? (
            // 🔹 Maior engajamento: TODAS as métricas, ícones preenchidos
            <div className="flex items-center space-x-3">
              {/* Likes - vermelho */}
              <div className="flex items-center">
                <Heart
                  className="w-4 h-4 mr-1 fill-current"
                  style={{ color: 'rgb(255, 0, 0)' }}
                />
                <span className="font-bold" style={textMetricStyle}>
                  {formatNumber(post.like_count)}
                </span>
              </div>
              {/* Comentários - verde */}
              <div className="flex items-center">
                <MessageCircle
                  className="w-4 h-4 mr-1 fill-current"
                  style={{ color: 'rgb(0, 171, 63)' }}
                />
                <span className="font-bold" style={textMetricStyle}>
                  {formatNumber(post.comment_count)}
                </span>
              </div>
              {/* Shares - azul */}
              <div className="flex items-center">
                <Share2
                  className="w-4 h-4 mr-1 fill-current"
                  style={{ color: 'rgb(59, 130, 246)' }}
                />
                <span className="font-bold" style={textMetricStyle}>
                  {formatNumber(post.reshare_count)}
                </span>
              </div>
              {/* Plays se for vídeo */}
              {post.media_type === 2 && post.play_count && (
                <div className="flex items-center">
                  <Play
                    className="w-4 h-4 mr-1 fill-current"
                    style={{ color: 'rgb(255, 0, 0)' }}
                  />
                  <span className="font-bold" style={textMetricStyle}>
                    {formatNumber(post.play_count)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            // 🔹 Outros filtros: ícone + número, com cores específicas
            <div className="flex items-center" style={{ color: primaryColor }}>
              <PrimaryIcon className="w-4 h-4 mr-1 fill-current" />
              <span className="font-bold" style={textMetricStyle}>
                {primaryValue}
              </span>
            </div>
          )}

          {post.recommend && (
            <div className="relative group">
              <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full cursor-help">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[999]">
                Recomendado pela IA
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
              </div>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-400 font-bold">
          {formatTimeAgo(post.taken_at)}
        </span>
      </div>

      <div className="relative w-full" style={{ paddingBottom: '140%' }}>
        <iframe
          src={`https://www.instagram.com/p/${post.code}/embed`}
          allow="autoplay; encrypted-media"
          scrolling="no"
          className="absolute top-0 left-0 w-full"
          style={{
            height: '800px',
            maxWidth: '300px',
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }}
        />
        {index < 3 && (
          <div className="absolute bottom-4 right-4 z-50">
            <div className="bg-gray-900/80 backdrop-blur-sm text-white p-2 rounded-full flex items-center justify-center">
              {getRankIcon(index)}
            </div>
          </div>
        )}
      </div>

      {onGenerateCarousel && (
        <div className="p-3 bg-white border-t border-gray-100" style={{ zIndex: 99 }}>
          <div className="flex gap-2">
            {showSaveButtons && (
              <button
                onClick={handleSaveToggle}
                disabled={isSaving}
                className={`flex-1 px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-all font-medium ${
                  isSaved
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{isSaved ? 'Salvo' : 'Salvar'}</span>
              </button>
            )}
            {showGenerateButtons && (
              <div className="flex gap-1">
                {isPostOld(post.taken_at) && (
                  <div className="relative group">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors cursor-help">
                      <Info className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[999]">
                      O post foi postado a {getDaysAgo(post.taken_at)} dias atrás
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleOpenModal}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar</span>
                </button>
              </div>
            )}
          </div>
          <TemplateSelectionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelectTemplate={handleSelectTemplate}
            postCode={post.code}
          />
        </div>
      )}
    </div>
  );
};

export default PostCard;