import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, MessageSquare, Instagram, ArrowRight, X, Plus, Trash2 } from 'lucide-react';
import Navigation from '../components/Navigation';
import { MouseFollowLight } from '../components/MouseFollowLight';
import { ToneSetupModal } from '../components/ToneSetupModal';
import { TemplateSelectionModal } from '../components/carousel';
import { useGenerationQueue } from '../contexts/GenerationQueueContext';
import { useToneSetupOnDemand as useToneSetup } from '../hooks/useToneSetupVariants';
import { generateCarousel, AVAILABLE_TEMPLATES } from '../carousel';
import { templateService } from '../services/carousel';
import type { GenerationQueueItem } from '../carousel';
import type { GenerationOptions } from '../components/carousel/TemplateSelectionModal';

const CreateCarouselPage: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'instagram' | 'website' | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [multipleLinks, setMultipleLinks] = useState<string[]>([]); // Para múltiplos links
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [pendingInstagramCode, setPendingInstagramCode] = useState<string | null>(null);
  const [pendingWebsiteLink, setPendingWebsiteLink] = useState<string | null>(null);
  const [pendingMultipleLinks, setPendingMultipleLinks] = useState<string[]>([]); // Links adicionais pendentes
  const navigate = useNavigate();
  const { addToQueue, updateQueueItem, removeFromQueue } = useGenerationQueue();
  const { showToneModal, checkToneSetupBeforeAction, closeToneModal, completeToneSetup } = useToneSetup();

  const handleOpenModal = (type: 'instagram' | 'website') => {
    // Check tone setup before opening modal
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    if (needsToneSetup === 'true') {
      checkToneSetupBeforeAction(() => {});
      return;
    }

    setActiveModal(type);
    setLinkInput('');
    setMultipleLinks([]);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setLinkInput('');
    setMultipleLinks([]);
  };

  const extractInstagramCode = (url: string): string | null => {
    try {
      const match = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Erro ao extrair código do Instagram:', error);
      return null;
    }
  };

  // Limites de fontes
  const MAX_INSTAGRAM_SOURCES = 2;
  const MAX_WEBSITE_SOURCES = 5;

  const handleAddLink = () => {
    if (!linkInput.trim()) return;

    if (activeModal === 'instagram') {
      // Verificar limite de Instagram (máximo 2)
      if (multipleLinks.length >= MAX_INSTAGRAM_SOURCES - 1) {
        alert(`Limite atingido! Você pode adicionar no máximo ${MAX_INSTAGRAM_SOURCES} posts do Instagram.`);
        return;
      }
      const code = extractInstagramCode(linkInput);
      if (!code) {
        alert('Link do Instagram inválido. Use um link como: https://www.instagram.com/p/CODE/');
        return;
      }
      setMultipleLinks(prev => [...prev, linkInput.trim()]);
    } else {
      // Verificar limite de links (máximo 5)
      if (multipleLinks.length >= MAX_WEBSITE_SOURCES - 1) {
        alert(`Limite atingido! Você pode adicionar no máximo ${MAX_WEBSITE_SOURCES} links.`);
        return;
      }
      setMultipleLinks(prev => [...prev, linkInput.trim()]);
    }
    setLinkInput('');
  };

  const handleRemoveLink = (index: number) => {
    setMultipleLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitLink = () => {
    // Se não tem link atual nem links na lista, retorna
    if (!linkInput.trim() && multipleLinks.length === 0) return;

    // Check tone setup before proceeding
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    if (needsToneSetup === 'true') {
      handleCloseModal();
      checkToneSetupBeforeAction(() => {});
      return;
    }

    // Combina o link atual com os links da lista
    const allLinks = [...multipleLinks];
    if (linkInput.trim()) {
      allLinks.push(linkInput.trim());
    }

    if (activeModal === 'instagram') {
      // Extrai os códigos de todos os links do Instagram
      const codes = allLinks.map(extractInstagramCode).filter((code): code is string => code !== null);
      if (codes.length === 0) {
        alert('Nenhum link do Instagram válido. Use links como: https://www.instagram.com/p/CODE/');
        return;
      }
      setPendingInstagramCode(codes[0]);
      if (codes.length > 1) {
        setPendingMultipleLinks(codes.slice(1));
      }
      handleCloseModal();
      setIsTemplateModalOpen(true);
    } else if (activeModal === 'website') {
      setPendingWebsiteLink(allLinks[0]);
      if (allLinks.length > 1) {
        setPendingMultipleLinks(allLinks.slice(1));
      }
      handleCloseModal();
      setIsTemplateModalOpen(true);
    }
  };

  const handleTemplateSelect = async (templateId: string, options?: GenerationOptions) => {
    setIsTemplateModalOpen(false);
    const template = AVAILABLE_TEMPLATES.find(t => t.id === templateId);
    const isInstagram = !!pendingInstagramCode;
    const postCode = pendingInstagramCode || pendingWebsiteLink || 'link';

    console.log('🚀 CreateCarouselPage: handleTemplateSelect iniciado', { templateId, options });

    const queueItem: GenerationQueueItem = {
      id: `${isInstagram ? 'instagram' : 'website'}-${postCode}-${templateId}-${Date.now()}`,
      postCode: postCode,
      templateId,
      templateName: template?.name || `Template ${templateId}`,
      status: 'generating',
      createdAt: Date.now(),
    };

    addToQueue(queueItem);

    try {
      const jwtToken = localStorage.getItem('access_token');
      let result;

      if (isInstagram) {
        // Passa as options do template para o generateCarousel
        result = await generateCarousel(pendingInstagramCode!, templateId, jwtToken || undefined, undefined, undefined, options);
      } else {
        const newsData = {
          id: pendingWebsiteLink!,
          title: '',
          description: '',
          content: '',
          url: pendingWebsiteLink!,
          image: '',
          publishedAt: new Date().toISOString(),
          country: '',
          lang: 'pt',
          niche: '',
          type: 'news' as const,
        };
        // Passa as options do template para o generateCarousel
        result = await generateCarousel(pendingWebsiteLink!, templateId, jwtToken || undefined, undefined, newsData, options);
      }

      if (!result) {
        alert('Erro: resposta vazia do servidor');
        removeFromQueue(queueItem.id);
        return;
      }

      const resultArray = Array.isArray(result) ? result : [result];

      if (resultArray.length === 0) {
        alert('Erro: nenhum dado retornado');
        removeFromQueue(queueItem.id);
        return;
      }

      const carouselData = resultArray[0];
      const generatedContentId = (carouselData as any).id || (carouselData as any).content_id || (carouselData as any).generated_content_id;

      if (!carouselData || !carouselData.dados_gerais) {
        alert('Erro: formato de dados inválido');
        removeFromQueue(queueItem.id);
        return;
      }

      const responseTemplateId = carouselData.dados_gerais.template;
      const templateSlides = await templateService.fetchTemplate(responseTemplateId);

      if (!templateSlides || templateSlides.length === 0) {
        alert('Erro ao carregar template');
        removeFromQueue(queueItem.id);
        return;
      }

      const { templateRenderer } = await import('../services/carousel');
      const renderedSlides = templateRenderer.renderAllSlides(templateSlides, carouselData);

      updateQueueItem(queueItem.id, {
        status: 'completed',
        slides: renderedSlides,
        carouselData,
        generatedContentId,
      });
    } catch (error) {
      console.error('❌ Erro ao gerar carrossel:', error);
      alert('Erro ao gerar carrossel. Verifique o console para mais detalhes.');
      removeFromQueue(queueItem.id);
    } finally {
      setPendingInstagramCode(null);
      setPendingWebsiteLink(null);
    }
  };

  const handleGoToChat = () => {
    // Check tone setup before going to chat
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    if (needsToneSetup === 'true') {
      checkToneSetupBeforeAction(() => {});
      return;
    }
    
    navigate('/chatbot');
  };

  const cards = [
    {
      id: 'instagram',
      title: 'Link do Instagram',
      description: 'Cole o link de um carrossel do Instagram',
      icon: Instagram,
      color: 'from-pink-500 to-pink-600',
      backgroundColor: 'bg-pink-500', // cor de fundo rosa
      onClick: () => handleOpenModal('instagram'),
    },
    {
      id: 'website',
      title: 'Link de Site',
      description: 'Cole o link de um site para criar carrossel',
      icon: Link2,
      color: 'from-blue-500 to-cyan-500',
      backgroundColor: 'bg-blue-500', // cor de fundo azul
      onClick: () => handleOpenModal('website'),
    },
    {
      id: 'chat',
      title: 'Conversar com Agente',
      description: 'Crie carrosséis conversando com IA',
      icon: MessageSquare,
      color: 'from-green-500 to-emerald-500',
      backgroundColor: 'bg-green-500', // cor de fundo verde
      onClick: handleGoToChat,
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation currentPage="chatbot" />

      <div className="md:ml-16 relative flex-1 overflow-hidden">
        <MouseFollowLight zIndex={-1} />
        {/* Grid Background */}
        <div
          className="pointer-events-none fixed top-0 left-0 md:left-20 right-0 bottom-0 opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Light Orbs */}
        <div
          className="fixed pointer-events-none"
          style={{
            top: '10%',
            left: '8%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.3,
            filter: 'blur(80px)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />

        <div
          className="fixed pointer-events-none"
          style={{
            top: '5%',
            right: '12%',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.25,
            filter: 'blur(70px)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />

        <div
          className="fixed pointer-events-none"
          style={{
            top: '40%',
            left: '5%',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.2,
            filter: 'blur(75px)',
            animation: 'float 11s ease-in-out infinite',
          }}
        />

        <div
          className="fixed pointer-events-none"
          style={{
            top: '45%',
            right: '8%',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.28,
            filter: 'blur(65px)',
            animation: 'float 9s ease-in-out infinite reverse',
          }}
        />

        <div
          className="fixed pointer-events-none"
          style={{
            bottom: '15%',
            left: '15%',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.22,
            filter: 'blur(70px)',
            animation: 'float 12s ease-in-out infinite',
          }}
        />

        <div
          className="fixed pointer-events-none"
          style={{
            bottom: '20%',
            right: '20%',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.26,
            filter: 'blur(68px)',
            animation: 'float 13s ease-in-out infinite reverse',
          }}
        />

        <div
          className="fixed pointer-events-none"
          style={{
            top: '25%',
            left: '45%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.18,
            filter: 'blur(60px)',
            animation: 'float 10s ease-in-out infinite',
          }}
        />

        <div
          className="fixed pointer-events-none"
          style={{
            top: '70%',
            left: '35%',
            width: '230px',
            height: '230px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.24,
            filter: 'blur(72px)',
            animation: 'float 14s ease-in-out infinite reverse',
          }}
        />

        {/* Main Content */}
        <main className="px-6 py-12 min-h-screen flex flex-col justify-center items-center relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Grid de Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    onClick={card.onClick}
                    className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    {/* Gradient Background (subtle) */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-full ${card.backgroundColor} flex items-center justify-center group-hover:bg-opacity-70 transition-colors`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900">
                        {card.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                        {card.description}
                      </p>
                      
                      {/* Arrow */}
                      <div className="pt-2">
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info Text */}
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm">
                Escolha uma das opções acima para começar a criar seu carrossel
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Input de Link */}
      {activeModal && (
        <div 
          className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="bg-white border border-gray-200 rounded-3xl max-w-lg w-full p-8 relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500/30 to-accent-500/30 border border-primary-500/50 flex items-center justify-center mx-auto mb-6">
              {activeModal === 'instagram' ? (
                <Instagram className="w-8 h-8 text-primary-400" />
              ) : (
                <Link2 className="w-8 h-8 text-primary-400" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {activeModal === 'instagram' ? 'Link do Instagram' : 'Link do Site'}
            </h2>

            {/* Description */}
            <p className="text-gray-600 text-center mb-6">
              {activeModal === 'instagram' 
                ? 'Cole o link do carrossel do Instagram que você deseja recriar'
                : 'Cole o link do site que você deseja transformar em carrossel'
              }
            </p>

            {/* Input */}
            <div className="space-y-4">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (e.shiftKey || e.ctrlKey) {
                      handleAddLink();
                    } else {
                      handleSubmitLink();
                    }
                  }
                }}
                placeholder={activeModal === 'instagram' 
                  ? 'https://www.instagram.com/p/...'
                  : 'https://exemplo.com/artigo'
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400"
                autoFocus
              />

              {/* Add Link Button */}
              <button
                onClick={handleAddLink}
                disabled={!linkInput.trim()}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Adicionar mais um link (Ctrl+Enter)
              </button>

              {/* Links List */}
              {multipleLinks.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Links adicionados ({multipleLinks.length}):
                  </p>
                  {multipleLinks.map((link, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200"
                    >
                      <span className="text-sm text-gray-600 truncate flex-1">
                        {link}
                      </span>
                      <button
                        onClick={() => handleRemoveLink(index)}
                        className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border border-gray-300 hover:bg-gray-100 text-gray-900 rounded-xl font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitLink}
                  disabled={!linkInput.trim() && multipleLinks.length === 0}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-xl font-semibold transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {multipleLinks.length > 0 
                    ? `Processar ${multipleLinks.length + (linkInput.trim() ? 1 : 0)} Links`
                    : 'Processar Link'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Template */}
      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setPendingInstagramCode(null);
          setPendingWebsiteLink(null);
          setPendingMultipleLinks([]);
        }}
        onSelectTemplate={handleTemplateSelect}
        postCode={pendingInstagramCode || pendingWebsiteLink || ''}
        multipleLinks={pendingMultipleLinks}
      />
      
      <ToneSetupModal
        isOpen={showToneModal}
        onClose={closeToneModal}
        onComplete={completeToneSetup}
      />
    </div>
  );
};

export default CreateCarouselPage;