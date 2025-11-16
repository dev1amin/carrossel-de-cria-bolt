import React, { useState } from 'react';
import { Heart, Play, Trophy, Medal, Award, Sparkles, Bookmark } from 'lucide-react';
import { TemplateSelectionModal } from '../carousel';
import { Post } from '../types';
import { formatNumber } from '../utils/formatters';
import { saveContent, unsaveContent } from '../services/feed';

interface PostCardProps {
  post: Post;
  index: number;
  onGenerateCarousel?: (code: string, templateId: string, postId?: number) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, index, onGenerateCarousel, onShowToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = () => {
    if (!onGenerateCarousel) return;
    setIsModalOpen(true);
  };

  const handleSelectTemplate = (templateId: string) => {
    if (onGenerateCarousel) {
      onGenerateCarousel(post.code, templateId, post.id);
    }
  };

  const handleToggleSave = async () => {
    if (!post.id || isSaving) return;
    
    // Verificar se temos feedId necessário para salvar
    if (!isSaved && !post.feedId) {
      onShowToast?.('Erro: feed_id não disponível', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      if (isSaved) {
        await unsaveContent(post.id);
        setIsSaved(false);
        onShowToast?.('Post removido dos salvos', 'success');
      } else {
        await saveContent(post.id, post.feedId!);
        setIsSaved(true);
        onShowToast?.('Post salvo com sucesso', 'success');
      }
    } catch (error) {
      console.error('Erro ao salvar/remover post:', error);
      onShowToast?.(
        error instanceof Error ? error.message : 'Erro ao processar requisição',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };
  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
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

  const handleOpenOriginal = () => {
    const webFallbackUrl = `https://www.instagram.com/reel/${post.code}`;
    window.open(webFallbackUrl, '_blank');
  };

  return (
    <div className="relative w-full max-w-[300px] bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="flex items-center" style={{ color: 'rgb(255, 0, 0)' }}>
            <Heart className="w-4 h-4 mr-1 fill-current" />
            <span className="font-bold">{formatNumber(post.like_count)}</span>
          </div>
          {post.media_type === 2 && post.play_count && (
            <div className="flex items-center" style={{ color: 'rgb(0, 171, 63)' }}>
              <Play className="w-4 h-4 mr-1 fill-current" />
              <span className="font-bold">{formatNumber(post.play_count)}</span>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-400 font-bold">{formatTimeAgo(post.taken_at)}</span>
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
            <button
              onClick={handleToggleSave}
              disabled={isSaving || !post.id}
              className={`flex-1 px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-all font-medium ${
                isSaved
                  ? 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaving ? 'Salvando...' : isSaved ? 'Salvo' : 'Salvar'}</span>
            </button>
            <button
              onClick={handleOpenModal}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar</span>
            </button>
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
}

export default PostCard;