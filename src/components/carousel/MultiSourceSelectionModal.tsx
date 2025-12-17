import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Instagram, Link2, FileText, ChevronRight, Newspaper, Image } from 'lucide-react';

export interface SourceItem {
  type: 'post' | 'news' | 'instagram' | 'website';
  id: string;
  code?: string; // Código do Instagram ou URL
  title?: string;
  thumbnail?: string;
  postId?: number;
  newsData?: any;
}

interface MultiSourceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sources: SourceItem[]) => void;
  initialSource: SourceItem;
  sourceType: 'post' | 'news'; // Tipo inicial da fonte (para mostrar opções relevantes)
}

export const MultiSourceSelectionModal: React.FC<MultiSourceSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSource,
  sourceType: _sourceType, // Prefixado com _ para indicar que é usado para tipagem mas não diretamente
}) => {
  const [sources, setSources] = useState<SourceItem[]>([initialSource]);
  const [linkInput, setLinkInput] = useState('');
  const [addingType, setAddingType] = useState<'instagram' | 'website' | null>(null);

  // Limites de fontes
  const MAX_INSTAGRAM_SOURCES = 2;
  const MAX_WEBSITE_SOURCES = 5;

  // Contadores de fontes por tipo
  const instagramSourcesCount = sources.filter(s => s.type === 'instagram').length;
  const websiteSourcesCount = sources.filter(s => s.type === 'website').length;

  const handleAddSource = (type: 'instagram' | 'website') => {
    // Verificar limites antes de permitir adicionar
    if (type === 'instagram' && instagramSourcesCount >= MAX_INSTAGRAM_SOURCES) {
      alert(`Limite atingido! Você pode adicionar no máximo ${MAX_INSTAGRAM_SOURCES} posts do Instagram.`);
      return;
    }
    if (type === 'website' && websiteSourcesCount >= MAX_WEBSITE_SOURCES) {
      alert(`Limite atingido! Você pode adicionar no máximo ${MAX_WEBSITE_SOURCES} links.`);
      return;
    }
    setAddingType(type);
    setLinkInput('');
  };

  const extractInstagramCode = (url: string): string | null => {
    try {
      const match = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  };

  const handleConfirmLink = () => {
    if (!linkInput.trim()) return;

    if (addingType === 'instagram') {
      // Verificar limite novamente
      if (instagramSourcesCount >= MAX_INSTAGRAM_SOURCES) {
        alert(`Limite atingido! Você pode adicionar no máximo ${MAX_INSTAGRAM_SOURCES} posts do Instagram.`);
        setAddingType(null);
        return;
      }
      const code = extractInstagramCode(linkInput);
      if (!code) {
        alert('Link do Instagram inválido. Use um link como: https://www.instagram.com/p/CODE/');
        return;
      }
      setSources(prev => [...prev, {
        type: 'instagram',
        id: `instagram-${code}-${Date.now()}`,
        code,
        title: `Post Instagram: ${code}`,
      }]);
    } else if (addingType === 'website') {
      // Verificar limite novamente
      if (websiteSourcesCount >= MAX_WEBSITE_SOURCES) {
        alert(`Limite atingido! Você pode adicionar no máximo ${MAX_WEBSITE_SOURCES} links.`);
        setAddingType(null);
        return;
      }
      setSources(prev => [...prev, {
        type: 'website',
        id: `website-${Date.now()}`,
        code: linkInput.trim(),
        title: linkInput.trim().substring(0, 50) + (linkInput.length > 50 ? '...' : ''),
      }]);
    }

    setLinkInput('');
    setAddingType(null);
  };

  const handleRemoveSource = (index: number) => {
    if (sources.length <= 1) return; // Não permite remover a última fonte
    setSources(prev => prev.filter((_, i) => i !== index));
  };

  const handleProceed = () => {
    onConfirm(sources);
  };

  const getSourceIcon = (type: SourceItem['type']) => {
    switch (type) {
      case 'post': return <Image className="w-5 h-5" />;
      case 'news': return <Newspaper className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'website': return <Link2 className="w-5 h-5" />;
    }
  };

  const getSourceLabel = (type: SourceItem['type']) => {
    switch (type) {
      case 'post': return 'Post do Feed';
      case 'news': return 'Notícia';
      case 'instagram': return 'Instagram';
      case 'website': return 'Link Externo';
    }
  };

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root') || document.body;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="multi-source-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          key="multi-source-modal"
          initial={{ y: 12, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 8, opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white text-gray-900 shadow-2xl rounded-2xl border border-gray-300 relative w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pronto para gerar!</h2>
              <p className="text-sm text-gray-500 mt-1">
                Você pode gerar agora ou adicionar mais fontes (opcional)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Lista de fontes */}
            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-gray-700">
                ✅ Fonte selecionada
              </label>
              {sources.map((source, index) => (
                <div
                  key={source.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className={`
                    p-2 rounded-lg
                    ${source.type === 'instagram' ? 'bg-pink-100 text-pink-600' : ''}
                    ${source.type === 'website' ? 'bg-blue-100 text-blue-600' : ''}
                    ${source.type === 'post' ? 'bg-purple-100 text-purple-600' : ''}
                    ${source.type === 'news' ? 'bg-green-100 text-green-600' : ''}
                  `}>
                    {getSourceIcon(source.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {source.title || source.code || source.id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getSourceLabel(source.type)}
                    </p>
                  </div>
                  {sources.length > 1 && (
                    <button
                      onClick={() => handleRemoveSource(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Input de link (quando adicionando) */}
            {addingType && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  {addingType === 'instagram' ? (
                    <Instagram className="w-5 h-5 text-pink-500" />
                  ) : (
                    <Link2 className="w-5 h-5 text-blue-500" />
                  )}
                  <span className="font-medium text-gray-900">
                    {addingType === 'instagram' ? 'Adicionar Post do Instagram' : 'Adicionar Link Externo'}
                  </span>
                </div>
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleConfirmLink()}
                  placeholder={addingType === 'instagram'
                    ? 'https://www.instagram.com/p/...'
                    : 'https://exemplo.com/artigo'
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-400 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddingType(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmLink}
                    disabled={!linkInput.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            {/* Botões de adicionar (quando não está adicionando) */}
            {!addingType && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Quer combinar com mais conteúdo? (opcional)
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAddSource('instagram')}
                    disabled={instagramSourcesCount >= MAX_INSTAGRAM_SOURCES}
                    className={`flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl transition-all ${
                      instagramSourcesCount >= MAX_INSTAGRAM_SOURCES 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:border-pink-400 hover:shadow-md'
                    }`}
                  >
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Instagram className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Instagram</p>
                      <p className="text-xs text-gray-500">
                        {instagramSourcesCount >= MAX_INSTAGRAM_SOURCES 
                          ? `Limite: ${MAX_INSTAGRAM_SOURCES}/${MAX_INSTAGRAM_SOURCES}` 
                          : `${instagramSourcesCount}/${MAX_INSTAGRAM_SOURCES} adicionados`}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleAddSource('website')}
                    disabled={websiteSourcesCount >= MAX_WEBSITE_SOURCES}
                    className={`flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl transition-all ${
                      websiteSourcesCount >= MAX_WEBSITE_SOURCES 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Link2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Link Externo</p>
                      <p className="text-xs text-gray-500">
                        {websiteSourcesCount >= MAX_WEBSITE_SOURCES 
                          ? `Limite: ${MAX_WEBSITE_SOURCES}/${MAX_WEBSITE_SOURCES}` 
                          : `${websiteSourcesCount}/${MAX_WEBSITE_SOURCES} adicionados`}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {sources.length === 1 ? (
                  <span>Gere com esta fonte ou adicione mais acima</span>
                ) : (
                  <span className="flex items-center gap-1 text-purple-600 font-medium">
                    <FileText className="w-4 h-4" />
                    {sources.length} fontes combinadas
                  </span>
                )}
              </div>
              <button
                onClick={handleProceed}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 shadow-md transition-all"
              >
                <span>{sources.length === 1 ? 'Gerar Carrossel' : `Gerar com ${sources.length} fontes`}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    modalRoot
  );
};

export default MultiSourceSelectionModal;
