import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Image, Wrench, LayoutGrid, ChevronLeft, ChevronRight, Download, Edit, Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Navigation from '../components/Navigation';
import SlideRenderer from '../components/SlideRenderer';
import { MouseFollowLight } from '../components/MouseFollowLight';
import { ToneSetupModal } from '../components/ToneSetupModal';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { getGeneratedContent, getGeneratedContentById } from '../services/generatedContent';
import { useEditorTabs } from '../contexts/EditorTabsContext';
import type { CarouselTab } from '../carousel';
import type { GeneratedContent } from '../types/generatedContent';
import type { CarouselData } from '../carousel';
import { templateService } from '../services/carousel/template.service';
import { templateRenderer } from '../services/carousel/templateRenderer.service';
import { CacheService, CACHE_KEYS } from '../services/cache';
import { downloadSlidesAsPNG } from '../services/carousel/download.service';
import { useToneSetup } from '../hooks/useToneSetup';

interface GalleryCarousel {
  id: string;
  postCode: string;
  templateName: string;
  createdAt: number;
  slides: string[];
  carouselData: CarouselData;
  viewed?: boolean;
  generatedContentId?: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [carousels, setCarousels] = useState<GalleryCarousel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiMessage, setAiMessage] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [userName, setUserName] = useState<string>('Usuário');
  const { editorTabs, addEditorTab } = useEditorTabs();

  // Get user name from localStorage (already populated by verify/login)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        // Usar business.name se disponível, senão name do usuário
        const displayName = userData.business?.name || userData.name || 'Usuário';
        console.log('👤 Setting user name from localStorage:', displayName);
        setUserName(displayName);
      } else {
        console.log('👤 No user data in localStorage, using default name');
      }
    } catch (error) {
      console.error('❌ Error reading user data from localStorage:', error);
    }
  }, []);

  const renderSlidesWithTemplate = async (
    conteudos: any[],
    dados_gerais: any,
    templateId: string
  ): Promise<string[]> => {
    try {
      console.log(`🎨 Renderizando com template "${templateId}" para preview na home`);

      const templateSlides = await templateService.fetchTemplate(templateId);

      console.log(`✅ Template "${templateId}" carregado: ${templateSlides.length} slides`);

      const carouselData: CarouselData = {
        conteudos: conteudos,
        dados_gerais: dados_gerais,
      };

      const renderedSlides = templateRenderer.renderAllSlides(templateSlides, carouselData);

      console.log(`✅ ${renderedSlides.length} slides renderizados para preview`);

      return renderedSlides;
    } catch (error) {
      console.error(`❌ Erro ao renderizar template "${templateId}":`, error);

      return conteudos.map((slideData: any) =>
        convertSlideToHTML(slideData)
      );
    }
  };

  const convertSlideToHTML = (slideData: any): string => {
    const { title = '', subtitle = '', imagem_fundo = '', thumbnail_url = '' } = slideData;

    const isVideo = imagem_fundo?.includes('.mp4');
    const backgroundTag = isVideo
      ? `<video autoplay loop muted playsinline class="slide-background" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;"><source src="${imagem_fundo}" type="video/mp4"></video>`
      : `<img src="${imagem_fundo}" alt="Background" class="slide-background" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" />`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      position: relative;
      background: #000;
    }
    .slide-background { z-index: 0; }
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
      z-index: 1;
    }
    .content {
      position: absolute;
      bottom: 80px;
      left: 60px;
      right: 60px;
      z-index: 2;
      color: white;
    }
    .title {
      font-size: 48px;
      font-weight: bold;
      line-height: 1.2;
      margin-bottom: 20px;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
    }
    .subtitle {
      font-size: 28px;
      line-height: 1.4;
      opacity: 0.9;
      text-shadow: 1px 1px 4px rgba(0,0,0,0.8);
    }
    .thumbnail {
      position: absolute;
      top: 40px;
      right: 40px;
      width: 120px;
      height: 120px;
      border-radius: 12px;
      overflow: hidden;
      border: 3px solid rgba(255,255,255,0.2);
      z-index: 2;
    }
    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  </style>
</head>
<body>
  ${backgroundTag}
  <div class="overlay"></div>
  ${thumbnail_url ? `<div class="thumbnail"><img src="${thumbnail_url}" alt="Thumbnail" /></div>` : ''}
  <div class="content">
    ${title ? `<div class="title">${title}</div>` : ''}
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
  </div>
</body>
</html>
    `.trim();
  };

  const convertAPIToGalleryCarousel = async (apiContent: GeneratedContent): Promise<GalleryCarousel | null> => {
    try {
      const result = apiContent.result;

      console.log('📦 Convertendo conteúdo da API (HomePage):', {
        id: apiContent.id,
        media_type: apiContent.media_type,
        provider_type: apiContent.provider_type,
        result_keys: result ? Object.keys(result) : []
      });

      if (!result) {
        console.warn('⚠️ API content missing result:', apiContent);
        return null;
      }

      let slides: string[] = [];
      let carouselData: any = {};

      if (result.conteudos && Array.isArray(result.conteudos)) {
        console.log(`✅ Encontrados ${result.conteudos.length} slides no formato 'conteudos'`);

        const templateId = result.dados_gerais?.template || '2';
        console.log(`🎨 Template detectado: "${templateId}"`);

        slides = await renderSlidesWithTemplate(
          result.conteudos,
          result.dados_gerais || {},
          templateId
        );

        carouselData = {
          conteudos: result.conteudos,
          dados_gerais: result.dados_gerais || {},
          styles: result.styles || {},
        };
      }
      else if (result.slides && Array.isArray(result.slides)) {
        console.log(`✅ Encontrados ${result.slides.length} slides no formato antigo`);
        slides = result.slides;
        carouselData = result.metadata || result;
      }
      else {
        console.warn('⚠️ Formato desconhecido de resultado:', result);
        return null;
      }

      if (slides.length === 0) {
        console.warn('⚠️ Nenhum slide encontrado');
        return null;
      }

      const carousel: GalleryCarousel = {
        id: `api-${apiContent.id}`,
        postCode: apiContent.content_id?.toString() || String(apiContent.id),
        templateName: `${apiContent.media_type} - ${apiContent.provider_type}`,
        createdAt: new Date(apiContent.created_at).getTime(),
        slides: slides,
        carouselData: carouselData as CarouselData,
        viewed: false,
        generatedContentId: apiContent.id,
      };

      console.log('✅ Carrossel convertido (HomePage):', {
        id: carousel.id,
        slides_count: carousel.slides.length,
        templateName: carousel.templateName
      });

      return carousel;
    } catch (err) {
      console.error('❌ Erro ao converter conteúdo da API:', err, apiContent);
      return null;
    }
  };

  useEffect(() => {
    const loadCarouselsFromAPI = async () => {
      const cacheKey = `${CACHE_KEYS.GENERATED_CONTENT}_home`;

      // Check if we have cached data first
      const cachedCarousels = CacheService.getItem<GalleryCarousel[]>(cacheKey);

      if (cachedCarousels && cachedCarousels.length > 0) {
        // Display cached data immediately (no loading state)
        console.log('📦 Mostrando cache da HomePage enquanto busca dados frescos');
        setCarousels(cachedCarousels);
        setIsLoading(false);
      } else {
        // No cache, show loading
        setIsLoading(true);
      }

      // ALWAYS fetch fresh data from API
      try {
        console.log('🔄 Buscando dados frescos da API para HomePage...');

        const response = await getGeneratedContent({ page: 1, limit: 100 });

        console.log('✅ Resposta da API (HomePage):', response);

        const apiCarouselsPromises = response.data.map(content =>
          convertAPIToGalleryCarousel(content)
        );
        const apiCarouselsResults = await Promise.all(apiCarouselsPromises);
        const apiCarousels = apiCarouselsResults.filter((c): c is GalleryCarousel => c !== null);

        console.log(`✅ ${apiCarousels.length} carrosséis recebidos da API (HomePage)`);

        // Check if data has changed
        if (CacheService.hasDataChanged(cacheKey, apiCarousels)) {
          console.log('🔄 Dados da HomePage mudaram, atualizando cache e UI');
          CacheService.setItem(cacheKey, apiCarousels);
          setCarousels(apiCarousels);
        } else {
          console.log('✅ Dados da HomePage não mudaram, mantendo cache');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar carrosséis da API:', err);
        // Keep cached data if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    loadCarouselsFromAPI();
  }, []);

  const menuItems = [
    {
      id: 'feed',
      label: 'Feed',
      icon: LayoutGrid,
      color: 'from-blue-500 to-blue-600',
      route: '/feed'
    },
    {
      id: 'news',
      label: 'Notícias',
      icon: Newspaper,
      color: 'from-purple-500 to-purple-600',
      route: '/news'
    },
    {
      id: 'tools',
      label: 'Criar',
      icon: Wrench,
      color: 'from-pink-500 to-pink-600',
      route: '/create-carousel'
    },
    {
      id: 'gallery',
      label: 'Galeria',
      icon: Image,
      color: 'from-indigo-500 to-indigo-600',
      route: '/gallery'
    }
  ];

  const handleMenuClick = (route: string) => {
    navigate(route);
  };

  const handleViewCarousel = async (carousel: GalleryCarousel) => {
    if (!carousel.slides || !carousel.carouselData) {
      alert('Erro: Dados do carrossel não encontrados.');
      return;
    }

    const tabId = `home-${carousel.id}`;
    
    // Check if tab already exists - if so, skip API call and just activate it
    const existingTab = editorTabs.find(t => t.id === tabId);
    if (existingTab) {
      console.log('♻️ Aba já existe, reutilizando dados em cache:', tabId);
      addEditorTab(existingTab);
      navigate(`/editor/${encodeURIComponent(tabId)}`);
      return;
    }

    let carouselData = carousel.carouselData;
    let slides = carousel.slides;

    if (carousel.generatedContentId) {
      try {
        console.log('🔄 Buscando dados atualizados da API...');
        const freshData = await getGeneratedContentById(carousel.generatedContentId);

        if (freshData.success && freshData.data.result) {
          const apiData = freshData.data.result as any;

          if (apiData.conteudos && apiData.dados_gerais) {
            carouselData = {
              conteudos: apiData.conteudos,
              dados_gerais: apiData.dados_gerais,
              styles: apiData.styles || {},
            } as CarouselData;

            const templateId = apiData.dados_gerais.template || '2';
            slides = await renderSlidesWithTemplate(
              apiData.conteudos,
              apiData.dados_gerais,
              templateId
            );

            console.log('✅ Dados atualizados carregados da API');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados atualizados:', error);
      }
    }

    const newTab: CarouselTab = {
      id: tabId,
      slides: slides,
      carouselData: carouselData,
      title: carousel.templateName,
      generatedContentId: carousel.generatedContentId,
    };

    addEditorTab(newTab);
    navigate(`/editor/${encodeURIComponent(tabId)}`);
  };

  const handleDownload = async (carousel: GalleryCarousel) => {
    if (!carousel.slides || carousel.slides.length === 0) {
      alert('Erro: Nenhum slide encontrado para download.');
      return;
    }

    setDownloadingId(carousel.id);
    setDownloadProgress({ current: 0, total: carousel.slides.length });

    try {
      await downloadSlidesAsPNG(
        carousel.slides,
        (current, total) => {
          setDownloadProgress({ current, total });
        }
      );
      
      // Success message
      alert(`✅ ${carousel.slides.length} slides baixados com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao baixar slides:', error);
      alert('Erro ao baixar slides. Verifique o console para mais detalhes.');
    } finally {
      setDownloadingId(null);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aiMessage.trim()) {
      const messageToSend = aiMessage.trim();
      
      // Verifica se precisa configurar tom de voz
      const needsToneSetup = localStorage.getItem('needs_tone_setup');
      if (needsToneSetup === 'true') {
        console.log('🚫 Bloqueando envio de mensagem - tom de voz não configurado');
        // Dispara evento para o HomePageWrapper abrir o modal
        window.dispatchEvent(new CustomEvent('showToneSetup'));
        return;
      }
      
      // Limpa o input imediatamente
      setAiMessage('');
      
      // Gera um ID temporário para navegar imediatamente
      const tempId = 'creating';
      
      // REDIRECIONA IMEDIATAMENTE com ID temporário na URL
      navigate(`/chatbot/${tempId}`, { 
        state: { 
          isCreatingConversation: true,
          initialMessage: messageToSend
        } 
      });
      
      // Processa tudo em sequência (uma requisição depende da outra)
      (async () => {
        try {
          const { createConversation } = await import('../services/conversations');
          const { createConversationMessage, sendChatMessage } = await import('../services/chatbot');
          
          console.log('🔄 1/4 - Criando nova conversa...');
          
          // PASSO 1: Cria uma nova conversa (AGUARDA)
          const newConversation = await createConversation();
          console.log('✅ 1/4 - Nova conversa criada:', newConversation.id);
          
          // Atualiza a URL com o ID real da conversa
          navigate(`/chatbot/${newConversation.id}`, { 
            state: { 
              initialMessage: messageToSend,
              isProcessing: true
            },
            replace: true // Substitui o estado anterior
          });
          
          console.log('🔄 2/4 - Salvando mensagem do usuário...');
          
          // PASSO 2: Salva a mensagem do usuário na API (AGUARDA)
          await createConversationMessage(newConversation.id, {
            sender_type: 'user',
            message_text: messageToSend,
          });
          console.log('✅ 2/4 - Mensagem do usuário salva');
          
          console.log('🔄 3/4 - Enviando para o chatbot...');
          
          // PASSO 3: Envia para o chatbot e aguarda resposta (AGUARDA)
          const userStr = localStorage.getItem('user');
          const userId = userStr ? JSON.parse(userStr).id : 'unknown';
          
          const responses = await sendChatMessage(userId, messageToSend, newConversation.id);
          console.log('✅ 3/4 - Resposta do chatbot recebida:', responses);
          
          console.log('🔄 4/4 - Salvando resposta do assistente...');
          
          // PASSO 4: Salva a resposta do assistente na API (AGUARDA)
          if (responses && responses.length > 0) {
            const assistantContent = responses.map(r => r.output).join('\n\n');
            await createConversationMessage(newConversation.id, {
              sender_type: 'bot',
              message_text: assistantContent,
            });
            console.log('✅ 4/4 - Resposta do assistente salva');
          }
          
          console.log('✅ Processo completo! A página do chatbot irá recarregar as mensagens.');
          
        } catch (error) {
          console.error('❌ Erro no processo:', error);
          // O ChatBotPage deve mostrar o erro ao usuário
        }
      })();
    }
  };

  return (
    <div className="flex h-screen">
      <Navigation currentPage="home" />

      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white relative ml-0 md:ml-16">
        {/* MouseFollowLight - sempre atrás de tudo */}
        <MouseFollowLight zIndex={-1} />

        {/* Grid de quadrados - igual ao Feed */}
        <div
          className="pointer-events-none fixed top-0 left-0 md:left-20 right-0 bottom-0 opacity-60"
          style={{
            backgroundImage: `linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
            zIndex: 0,
          }}
        />

        {/* Glow superior - igual ao Feed */}
        <div
          className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 30%, rgba(255,255,255,0) 70%)",
            filter: "blur(70px)",
            animation: "glowDown 3s ease-in-out infinite",
            zIndex: 0,
          }}
        />

        {/* Orbs decorativas - igual ao Feed */}
        <div
          className="fixed pointer-events-none"
          style={{
            top: '10%',
            left: '8%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.15,
            filter: 'blur(80px)',
            animation: 'float 8s ease-in-out infinite',
            zIndex: 0,
          }}
        />

        <div
          className="fixed pointer-events-none"
          style={{
            bottom: '15%',
            right: '10%',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'linear-gradient(to bottom left, #6a82fb, #fc9d9a)',
            opacity: 0.12,
            filter: 'blur(60px)',
            animation: 'float 6s ease-in-out infinite reverse',
            zIndex: 0,
          }}
        />

        {/* Hero Section - Impactante */}
        <section className="relative px-4 md:px-8 pt-8 pb-6 md:pt-16 md:pb-12 z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue/10 border border-blue/20 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-blue" />
              <span className="text-sm font-medium text-blue">Powered by AI</span>
            </motion.div>

            {/* Título principal */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-dark mb-4 md:mb-6 leading-tight"
            >
              Olá, <span className="text-blue">{userName}</span>! 👋
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-dark mb-8 md:mb-10 max-w-2xl mx-auto"
            >
              Crie carrosséis incríveis para suas redes sociais em segundos com inteligência artificial
            </motion.p>

            {/* CTA Principal - Input de AI */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleAISubmit}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                
                <div className="relative bg-white rounded-2xl border-2 border-gray-200 shadow-xl group-hover:border-blue/50 transition-colors">
                  <div className="flex items-center gap-3 p-2 md:p-3">
                    <div className="hidden md:flex w-12 h-12 bg-gradient-to-br from-blue to-purple-500 rounded-xl items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ex: Crie um carrossel sobre dicas de produtividade..."
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      className="flex-1 text-base md:text-lg outline-none bg-transparent placeholder:text-gray-400 py-2"
                    />
                    <button
                      type="submit"
                      disabled={!aiMessage.trim()}
                      className="flex items-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-blue to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue/25"
                    >
                      <Send className="w-5 h-5" />
                      <span className="hidden sm:inline">Criar</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.form>

            {/* Quick actions - Mais visíveis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-3 md:gap-4"
            >
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    onClick={() => handleMenuClick(item.route)}
                    className="group flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 hover:border-blue/30 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <span className="text-sm md:text-base font-medium text-gray-700">{item.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Seção de Carrosséis Recentes */}
        <section className="relative px-4 md:px-8 py-8 md:py-12 z-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8"
            >
              {/* Header da seção */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue to-purple-500 rounded-xl flex items-center justify-center">
                    <Image className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Seus Carrosséis</h2>
                    <p className="text-sm text-gray-500">Criações recentes</p>
                  </div>
                </div>
                {carousels.length > 0 && (
                  <button
                    onClick={() => navigate('/gallery')}
                    className="text-blue hover:text-blue-dark font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Ver todos
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Conteúdo */}
              {isLoading ? (
                <SkeletonGrid count={4} type="home" />
              ) : carousels.length === 0 ? (
                <div className="text-center py-12 md:py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue/10 to-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-blue" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Comece sua jornada criativa
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Use o campo acima para descrever o carrossel que você quer criar. Nossa IA faz o resto!
                  </p>
                  <button
                    onClick={() => navigate('/create-carousel')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue/25 transition-all"
                  >
                    <Wrench className="w-5 h-5" />
                    Criar Primeiro Carrossel
                  </button>
                </div>
              ) : (
                <CarouselSlider
                  carousels={carousels}
                  onEdit={handleViewCarousel}
                  onDownload={handleDownload}
                  downloadingId={downloadingId}
                  downloadProgress={downloadProgress}
                />
              )}
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

interface GalleryItemProps {
  carousel: GalleryCarousel;
  onEdit: (carousel: GalleryCarousel) => void;
  onDownload: (carousel: GalleryCarousel) => void;
  downloadingId: string | null;
  downloadProgress: { current: number; total: number } | null;
}

interface CarouselSliderProps {
  carousels: GalleryCarousel[];
  onEdit: (carousel: GalleryCarousel) => void;
  onDownload: (carousel: GalleryCarousel) => void;
  downloadingId: string | null;
  downloadProgress: { current: number; total: number } | null;
}

const CarouselSlider: React.FC<CarouselSliderProps> = ({ carousels, onEdit, onDownload, downloadingId, downloadProgress }) => {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 4;
  const visibleCarousels = carousels.slice(startIndex, startIndex + itemsPerPage);
  const canGoNext = startIndex + itemsPerPage < carousels.length;
  const canGoPrev = startIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      setStartIndex(prev => prev + itemsPerPage);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setStartIndex(prev => Math.max(0, prev - itemsPerPage));
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
        {visibleCarousels.map((carousel) => (
          <GalleryItem
            key={carousel.id}
            carousel={carousel}
            onEdit={onEdit}
            onDownload={onDownload}
            downloadingId={downloadingId}
            downloadProgress={downloadProgress}
          />
        ))}
      </div>
      
      {carousels.length > itemsPerPage && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className={`p-2 rounded-full transition-all ${
              canGoPrev
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`p-2 rounded-full transition-all ${
              canGoNext
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

const GalleryItem: React.FC<GalleryItemProps> = ({ carousel, onEdit, onDownload, downloadingId, downloadProgress }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % carousel.slides.length);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + carousel.slides.length) % carousel.slides.length);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <motion.div
      className="w-full bg-white rounded-lg overflow-hidden border border-gray-light shadow-md relative z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="relative w-full bg-black overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{
          height: 0,
          paddingTop: 'calc(1350 / 1080 * 100%)',
          position: 'relative',
          width: '100%',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {carousel.slides[currentSlide].includes('iframe') ? (
            <iframe
              src={carousel.slides[currentSlide]}
              title={`Slide ${currentSlide}`}
              className="w-full h-full"
              style={{
                border: 'none',
                objectFit: 'contain',
                height: '100%',
              }}
            />
          ) : (
            <SlideRenderer
              key={`${carousel.id}-slide-${currentSlide}`}
              slideContent={carousel.slides[currentSlide]}
              slideIndex={currentSlide}
              styles={carousel.carouselData?.styles || {}}
              className="w-full h-full object-none"
            />
          )}
        </div>

        {carousel.slides.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-all z-10 pointer-events-auto"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={nextSlide}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-all z-10 pointer-events-auto"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        {carousel.slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {carousel.slides.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-800">
        <div className="mb-3">
          <p className="text-xs text-zinc-500 mt-0.5">
            {new Date(carousel.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })} • {carousel.slides.length} slides
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(carousel)}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => onDownload(carousel)}
            disabled={downloadingId === carousel.id}
            className="flex items-center justify-center gap-2 bg-blue text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-dark transition-colors border border-blue disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadingId === carousel.id ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {downloadProgress && (
                  <span className="text-xs">{downloadProgress.current}/{downloadProgress.total}</span>
                )}
              </>
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const HomePageWrapper: React.FC = () => {
  // Use useToneSetup to show popup automatically when user enters home without tone setup
  const { showToneModal, closeToneModal, completeToneSetup } = useToneSetup();
  const [forceShowModal, setForceShowModal] = useState(false);
  
  // Escuta evento customizado para forçar abertura do modal
  useEffect(() => {
    const handleShowToneSetup = () => {
      console.log('📢 Evento showToneSetup recebido, abrindo modal');
      setForceShowModal(true);
    };
    
    window.addEventListener('showToneSetup', handleShowToneSetup);
    return () => window.removeEventListener('showToneSetup', handleShowToneSetup);
  }, []);
  
  const handleClose = () => {
    setForceShowModal(false);
    closeToneModal();
  };
  
  const handleComplete = () => {
    setForceShowModal(false);
    completeToneSetup();
  };
  
  return (
    <>
      <HomePage />
      <ToneSetupModal
        isOpen={showToneModal || forceShowModal}
        onClose={handleClose}
        onComplete={handleComplete}
      />
    </>
  );
};

export default HomePageWrapper;
