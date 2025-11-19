import React, { useState } from 'react';
import { Heart, Play, Trophy, Medal, Award, Sparkles, Bookmark, BookmarkCheck, Info } from 'lucide-react';
import { TemplateSelectionModal } from '../carousel';
import { Post } from '../types';
import { formatNumber, isPostOld, getDaysAgo } from '../utils/formatters';
import { saveContent, unsaveContent } from '../services/feed';

interface PostCardProps {
  post: Post;
  index: number;
  onGenerateCarousel?: (code: string, templateId: string, postId?: number) => void;
  onGenerateClick?: () => void;
  feedId?: string | null;
}

const PostCard: React.FC<PostCardProps> = ({ post, index, onGenerateCarousel, onGenerateClick, feedId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [isSaving, setIsSaving] = useState(false);

  // Atualizar isSaved quando post.is_saved mudar
  React.useEffect(() => {
    setIsSaved(post.is_saved || false);
  }, [post.is_saved]);

  const handleOpenModal = () => {
    // Verifica se o tone setup já foi completado
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    
    // Se tone setup foi completado (false), abre o modal de template diretamente
    if (needsToneSetup === 'false') {
      console.log('✅ Tone setup completo - abrindo modal de template');
      if (!onGenerateCarousel) return;
      setIsModalOpen(true);
      return;
    }
    
    // Se needs_tone_setup for true ou não existir, delega para o parent component
    // O parent (FeedPage) tem o hook useToneSetupAutoShow que mostrará o modal de tone setup
    console.log('⚠️ Tone setup necessário - delegando para parent component');
    if (onGenerateClick) {
      onGenerateClick();
      return;
    }
    
    // Fallback: se não tiver onGenerateClick, abre o modal diretamente
    // (para casos onde o componente é usado sem o context do tone setup)
    if (!onGenerateCarousel) return;
    setIsModalOpen(true);
  };

  const handleSelectTemplate = (templateId: string) => {
    if (onGenerateCarousel) {
      onGenerateCarousel(post.code, templateId, post.id);
    }
  };

  const handleSaveToggle = async () => {
    console.log('🔍 Save toggle clicked:', { postId: post.id, feedId, isSaving, isSaved });
    
    if (!post.id) {
      console.error('❌ Post ID is missing');
      return;
    }
    
    if (!feedId) {
      console.error('❌ Feed ID is missing');
      return;
    }
    
    if (isSaving) {
      console.log('⏳ Already saving...');
      return;
    }
    
    setIsSaving(true);
    
    // Atualiza o estado local imediatamente para feedback visual
    const previousState = isSaved;
    setIsSaved(!isSaved);
    
    try {
      if (previousState) {
        console.log('🗑️ Removing save for post:', post.id);
        await unsaveContent(post.id, feedId);
        console.log('✅ Successfully unsaved');
      } else {
        console.log('💾 Saving post:', post.id);
        await saveContent(post.id, feedId);
        console.log('✅ Successfully saved');
      }
    } catch (error) {
      console.error('❌ Error toggling save status:', error);
      // Reverte o estado em caso de erro
      setIsSaved(previousState);
      // Optionally show a toast notification here
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    // Garantir que o timestamp esteja em segundos
    const now = Math.floor(Date.now() / 1000);  // timestamp atual em segundos
    const diff = now - timestamp;  // diferença em segundos
    
    if (diff < 3600) {  // Menos de uma hora
      const minutes = Math.floor(diff / 60);
      return `${minutes}m ago`;
    } else if (diff < 86400) {  // Menos de um dia
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    } else {  // Mais de um dia
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