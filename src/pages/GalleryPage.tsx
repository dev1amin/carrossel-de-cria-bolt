import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Gallery from '../components/Gallery';
import Navigation from '../components/Navigation';
import LoadingBar from '../components/LoadingBar';
import Toast, { ToastMessage } from '../components/Toast';
import GalleryFilters from '../components/GalleryFilters';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { MouseFollowLight } from '../components/MouseFollowLight';
import { type GenerationOptions } from '../carousel';
import type { CarouselData } from '../carousel';
import { CacheService, CACHE_KEYS } from '../services/cache';
import { useEditorTabs } from '../contexts/EditorTabsContext';
import { useGenerationQueue } from '../contexts/GenerationQueueContext';
import { getGeneratedContent, getGeneratedContentById } from '../services/generatedContent';
import type { GeneratedContent } from '../types/generatedContent';
import { templateService } from '../services/carousel/template.service';
import { templateRenderer } from '../services/carousel/templateRenderer.service';
import { getSavedPosts, type SavedPost } from '../services/feed';
import Feed from '../components/Feed';
import type { Post } from '../types';
import {
  generateCarousel,
  AVAILABLE_TEMPLATES,
  type GenerationQueueItem
} from '../carousel';

interface GalleryCarousel {
  id: string;
  postCode: string;
  templateName: string;
  createdAt: number;
  slides: string[];
  carouselData: CarouselData;
  viewed?: boolean;
  generatedContentId?: number; // ID do GeneratedContent na API
}

const GalleryPage = () => {
  const [galleryCarousels, setGalleryCarousels] = useState<GalleryCarousel[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoadingFromAPI, setIsLoadingFromAPI] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeSort, setActiveSort] = useState<'recent' | 'template' | 'saved'>('recent');
  const navigate = useNavigate();

  // Usa o contexto compartilhado de abas
  const { closeEditorTab } = useEditorTabs();

  // Usa o contexto global da fila
  const { generationQueue, addToQueue, updateQueueItem } = useGenerationQueue();

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  // Função para renderizar slides usando o template correto (local)
  const renderSlidesWithTemplate = async (
    conteudos: any[],
    dados_gerais: any,
    templateId: string
  ): Promise<string[]> => {
    try {
      console.log(`🎨 Renderizando com template "${templateId}" para preview na galeria`);

      // Normaliza o ID do template (mapeia "1" -> "1-react", etc.)
      const normalizedTemplateId = templateService.normalizeTemplateId(templateId);
      
      // Se for template React, retorna dados JSON para o ReactSlideRenderer
      if (templateService.isReactTemplate(normalizedTemplateId)) {
        console.log(`⚡ Template React detectado na galeria: ${normalizedTemplateId}`);
        // Retorna dados JSON com marcador especial para identificar
        return conteudos.map((slideData: any, index: number) => 
          JSON.stringify({
            __reactTemplate: true,
            templateId: normalizedTemplateId,
            slideIndex: index,
            slideData: slideData,
            dadosGerais: dados_gerais,
          })
        );
      }

      // Busca o template local via dynamic import
      const templateSlides = await templateService.fetchTemplate(normalizedTemplateId);

      console.log(`✅ Template "${normalizedTemplateId}" carregado: ${templateSlides.length} slides`);

      // Monta os dados no formato CarouselData
      const carouselData: CarouselData = {
        conteudos: conteudos,
        dados_gerais: dados_gerais,
      };

      // Renderiza cada slide com os dados
      const renderedSlides = templateRenderer.renderAllSlides(templateSlides, carouselData);

      console.log(`✅ ${renderedSlides.length} slides renderizados para preview`);

      return renderedSlides;
    } catch (error) {
      console.error(`❌ Erro ao renderizar template "${templateId}":`, error);

      // Fallback: usa renderização simples
      console.log('⚠️ Usando fallback: renderização simples HTML');
      return conteudos.map((slideData: any, index: number) =>
        convertSlideToHTML(slideData, index)
      );
    }
  };

  // Função para converter um slide JSON em HTML (para preview na galeria)
  const convertSlideToHTML = (slideData: any, index: number): string => {
    const { title = '', subtitle = '', imagem_fundo = '', thumbnail_url = '' } = slideData;

    // Template 2 (usado pela API)
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
    [data-editable] {
      cursor: text;
      transition: outline 0.2s;
    }
    [data-editable]:hover {
      outline: 2px solid rgba(59, 130, 246, 0.5);
    }
    [data-editable].selected {
      outline: 2px solid rgb(59, 130, 246) !important;
    }
  </style>
</head>
<body>
  ${backgroundTag}
  <div class="overlay"></div>
  ${thumbnail_url ? `<div class="thumbnail"><img src="${thumbnail_url}" alt="Thumbnail" /></div>` : ''}
  <div class="content">
    ${title ? `<div id="slide-${index}-title" class="title" data-editable="true" data-element="title">${title}</div>` : ''}
    ${subtitle ? `<div id="slide-${index}-subtitle" class="subtitle" data-editable="true" data-element="subtitle">${subtitle}</div>` : ''}
  </div>
</body>
</html>
    `.trim();
  };

  // Função para converter GeneratedContent da API para GalleryCarousel
  const convertAPIToGalleryCarousel = async (apiContent: GeneratedContent): Promise<GalleryCarousel | null> => {
    try {
      const result = apiContent.result;

      console.log('📦 Convertendo conteúdo da API:', {
        id: apiContent.id,
        media_type: apiContent.media_type,
        provider_type: apiContent.provider_type,
        result_keys: result ? Object.keys(result) : []
      });

      // A API retorna diferentes estruturas dependendo do tipo
      // Exemplo: { conteudos: [...], dados_gerais: {...} }
      if (!result) {
        console.warn('⚠️ API content missing result:', apiContent);
        return null;
      }

      // Extrair slides do formato da API
      let slides: string[] = [];
      let carouselData: any = {};

      // Se tem 'conteudos', é o novo formato
      if (result.conteudos && Array.isArray(result.conteudos)) {
        console.log(`✅ Encontrados ${result.conteudos.length} slides no formato 'conteudos'`);
        console.log(`🎨 [API] Estilos vindos da API:`, result.styles);

        // Extrai o template ID dos dados gerais
        const templateId = result.dados_gerais?.template || '2';
        console.log(`🎨 Template detectado: "${templateId}"`);

        // Renderiza os slides usando o template local
        slides = await renderSlidesWithTemplate(
          result.conteudos,
          result.dados_gerais || {},
          templateId
        );

        carouselData = {
          conteudos: result.conteudos, // Mantém 'conteudos' para o CarouselViewer
          dados_gerais: result.dados_gerais || {}, // dados_gerais já contém template
          styles: result.styles || {}, // IMPORTANTE: Inclui os estilos salvos
        };

        console.log(`🎨 [API] carouselData criado:`, carouselData);
        console.log(`🎨 [API] carouselData.styles:`, carouselData.styles);
      }
      // Formato antigo com 'slides' direto
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
        generatedContentId: apiContent.id, // Adiciona o ID da API
      };

      console.log('✅ Carrossel convertido:', {
        id: carousel.id,
        slides_count: carousel.slides.length,
        templateName: carousel.templateName,
        carouselData_styles: carousel.carouselData?.styles
      });

      return carousel;
    } catch (err) {
      console.error('❌ Erro ao converter conteúdo da API:', err, apiContent);
      return null;
    }
  };

  // Função para converter SavedPost para Post (formato do feed)
  const convertSavedPostToPost = (savedPost: SavedPost): Post => {
    return {
      id: savedPost.id,
      code: savedPost.id.toString(), // Usar ID como code
      text: savedPost.text,
      taken_at: Math.floor(new Date(savedPost.published_at).getTime() / 1000),
      username: savedPost.influencer.handle,
      image_url: savedPost.content_url,
      video_url: savedPost.product_type === 'reels' ? savedPost.content_url : null,
      media_type: savedPost.product_type === 'reels' ? 8 : 1, // 8 para vídeo, 1 para imagem
      like_count: savedPost.like_count,
      comment_count: savedPost.comment_count,
      play_count: savedPost.play_count,
      reshare_count: 0, // Não temos essa info
      likeScore: 0,
      commentScore: 0,
      playScore: 0,
      reshareScore: 0,
      recencyScore: 0,
      overallScore: savedPost.overall_score,
      recommend: false,
      is_saved: true, // Já que são posts salvos
    };
  };

  // Carrega posts salvos e converte para formato do feed
  const loadSavedPostsAsCarousels = async () => {
    setIsLoadingFromAPI(true);
    try {
      console.log('🔄 Carregando posts salvos...');

      const savedPostsData = await getSavedPosts(1, 100);

      console.log(`✅ ${savedPostsData.length} posts salvos carregados`);

      // Converte SavedPost para Post
      const posts = savedPostsData.map(convertSavedPostToPost);

      setSavedPosts(posts);
    } catch (err) {
      console.error('❌ Erro ao carregar posts salvos:', err);
      setSavedPosts([]);
    } finally {
      setIsLoadingFromAPI(false);
    }
  };

  // Carrega carrosséis da API e mescla com cache local
  const loadGalleryFromAPI = async () => {
    // Check if we have cached data first
    const cachedGallery = CacheService.getItem<GalleryCarousel[]>(CACHE_KEYS.GALLERY);

    if (cachedGallery && cachedGallery.length > 0) {
      // Display cached data immediately (no loading state)
      console.log('📦 Mostrando cache da galeria enquanto busca dados frescos');
      setGalleryCarousels(cachedGallery);
      setIsLoadingFromAPI(false);
    } else {
      // No cache, show loading
      setIsLoadingFromAPI(true);
    }

    // ALWAYS fetch fresh data from API
    try {
      console.log('🔄 Buscando dados frescos da API para galeria...');

      const response = await getGeneratedContent({ page: 1, limit: 100 });

      console.log('✅ Resposta da API (Galeria):', response);

      // Converte conteúdos da API para formato da galeria (com templates locais)
      const apiCarouselsPromises = response.data.map(content =>
        convertAPIToGalleryCarousel(content)
      );
      const apiCarouselsResults = await Promise.all(apiCarouselsPromises);
      const apiCarousels = apiCarouselsResults.filter((c): c is GalleryCarousel => c !== null);

      console.log(`✅ ${apiCarousels.length} carrosséis recebidos da API (Galeria)`);

      // Check if data has changed
      if (CacheService.hasDataChanged(CACHE_KEYS.GALLERY, apiCarousels)) {
        console.log('🔄 Dados da galeria mudaram, atualizando cache e UI');
        CacheService.setItem(CACHE_KEYS.GALLERY, apiCarousels);
        setGalleryCarousels(apiCarousels);
      } else {
        console.log('✅ Dados da galeria não mudaram, mantendo cache');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar galeria da API:', err);
      // Keep cached data if fetch fails
    } finally {
      setIsLoadingFromAPI(false);
    }
  };

  // Carrega galeria ao montar o componente e quando o filtro muda
  useEffect(() => {
    if (activeSort === 'saved') {
      loadSavedPostsAsCarousels();
    } else {
      loadGalleryFromAPI();
    }
  }, [activeSort]);

  // Escuta atualizações em tempo real da galeria
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as GalleryCarousel[] | undefined;
        if (detail && Array.isArray(detail)) {
          setGalleryCarousels(detail);
        } else {
          const cached = CacheService.getItem<GalleryCarousel[]>(CACHE_KEYS.GALLERY);
          if (cached) setGalleryCarousels(cached);
        }
      } catch (err) {
        console.warn('Erro no manipulador gallery:updated:', err);
      }
    };
    window.addEventListener('gallery:updated', handler as EventListener);
    return () => window.removeEventListener('gallery:updated', handler as EventListener);
  }, []);

  const addEditorTab = async (carousel: GalleryCarousel) => {
    console.log('👁️ Abrindo carrossel no preview:', {
      id: carousel.id,
      generatedContentId: carousel.generatedContentId,
    });

    // Se tem generatedContentId, buscar dados frescos da API
    let carouselData = carousel.carouselData;
    let slides = carousel.slides;

    if (carousel.generatedContentId) {
      try {
        console.log('🔄 Buscando dados atualizados da API...');
        const freshData = await getGeneratedContentById(carousel.generatedContentId);

        if (freshData.success && freshData.data.result) {
          const apiData = freshData.data.result as any;
          
          // A description está no nível data, NÃO dentro de result
          const descriptionFromApi = freshData.data.description || apiData.description || apiData.dados_gerais?.description || '';
          console.log('📝 Description na resposta da API:', descriptionFromApi ? descriptionFromApi.substring(0, 50) + '...' : 'não encontrada');

          // Atualizar carouselData com dados da API
          if (apiData.conteudos && apiData.dados_gerais) {
            carouselData = {
              conteudos: apiData.conteudos,
              dados_gerais: apiData.dados_gerais,
              styles: apiData.styles || {},
              // Pega description do nível data (fora de result) ou fallbacks
              description: descriptionFromApi,
              business_id: freshData.data.business_id || apiData.business_id,
            } as CarouselData;

            // Renderizar slides atualizados
            const templateId = apiData.dados_gerais.template || '2';
            slides = await renderSlidesWithTemplate(
              apiData.conteudos,
              apiData.dados_gerais,
              templateId
            );

            console.log('✅ Dados atualizados carregados da API');
            console.log('📝 Descrição salva no carouselData:', (carouselData as any).description ? (carouselData as any).description.substring(0, 50) + '...' : 'vazio');
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados atualizados:', error);
        // Continua com os dados do cache se falhar
      }
    }

    // Navega para a página de preview ao invés do editor
    navigate(`/carousel-preview/${encodeURIComponent(carousel.id)}`, {
      state: {
        slides: slides,
        carouselData: carouselData,
        title: carousel.templateName,
        generatedContentId: carousel.generatedContentId,
        fromQueue: false,
        description: (carouselData as any)?.description || '',
      }
    });
  };

  const handleDeleteCarousel = (carouselId: string) => {
    // Remove o carrossel da lista
    setGalleryCarousels(prev => prev.filter(c => c.id !== carouselId));

    // Atualiza o cache
    const updatedCarousels = galleryCarousels.filter(c => c.id !== carouselId);
    CacheService.setItem(CACHE_KEYS.GALLERY, updatedCarousels, 60 * 60 * 1000); // 1 hora

    // Fecha a aba do editor se estiver aberta
    closeEditorTab(`gallery-${carouselId}`);
  };

  const handleGenerateCarousel = async (code: string, templateId: string, postId?: number, options?: GenerationOptions) => {
    // Check if tone setup is needed before generating carousel
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    if (needsToneSetup === 'true') {
      // Para posts salvos, não temos tone setup modal, então continua
    }

    console.log('🚀 GalleryPage: handleGenerateCarousel iniciado', { code, templateId, postId, options });

    const template = AVAILABLE_TEMPLATES.find((t) => t.id === templateId);
    const queueItem: GenerationQueueItem = {
      id: `${code}-${templateId}-${Date.now()}`,
      postCode: code,
      templateId,
      templateName: template?.name || `Template ${templateId}`,
      status: 'generating',
      createdAt: Date.now()
    };

    addToQueue(queueItem);
    console.log('✅ Item adicionado à fila:', queueItem.id);

    try {
      const jwtToken = localStorage.getItem('access_token');

      console.log(
        `⏳ Chamando generateCarousel para post: ${code} com template: ${templateId}, postId: ${postId}, jwt: ${
          jwtToken ? 'presente' : 'ausente'
        }`
      );
      const result = await generateCarousel(code, templateId, jwtToken || undefined, postId, undefined, options);
      console.log('✅ Carousel generated successfully:', result);

      if (!result) {
        console.error('❌ Result é null ou undefined');
        addToast('Erro: resposta vazia do servidor', 'error');
        updateQueueItem(queueItem.id, { status: 'error', errorMessage: 'Resposta vazia do servidor' });
        return;
      }

      const resultArray = Array.isArray(result) ? result : [result];

      if (resultArray.length === 0) {
        console.error('❌ Array de resultado vazio');
        addToast('Erro: nenhum dado retornado', 'error');
        updateQueueItem(queueItem.id, { status: 'error', errorMessage: 'Nenhum dado retornado' });
        return;
      }

      const carouselData = resultArray[0];

      if (!carouselData || !carouselData.dados_gerais) {
        console.error('❌ Dados inválidos:', { carouselData });
        addToast('Erro: formato de dados inválido', 'error');
        updateQueueItem(queueItem.id, {
          status: 'error',
          errorMessage: 'Formato de dados inválido'
        });
        return;
      }

      const responseTemplateId = carouselData.dados_gerais.template;
      console.log(`⏳ Buscando template ${responseTemplateId}...`);

      // Normaliza o ID do template (mapeia "1" -> "1-react", etc.)
      const normalizedTemplateId = templateService.normalizeTemplateId(responseTemplateId);
      
      let rendered: string[];
      
      // Se for template React, retorna dados JSON para o ReactSlideRenderer
      if (templateService.isReactTemplate(normalizedTemplateId)) {
        console.log(`⚡ Template React detectado: ${normalizedTemplateId}`);
        rendered = carouselData.conteudos.map((slideData: any, index: number) => 
          JSON.stringify({
            __reactTemplate: true,
            templateId: normalizedTemplateId,
            slideIndex: index,
            slideData: slideData,
            dadosGerais: carouselData.dados_gerais,
          })
        );
      } else {
        const templateSlides = await templateService.fetchTemplate(normalizedTemplateId);
        console.log('✅ Template obtido, total de slides:', templateSlides?.length || 0);
        rendered = templateRenderer.renderAllSlides(templateSlides, carouselData);
      }

      const galleryItem = {
        id: queueItem.id,
        postCode: code,
        templateName: queueItem.templateName,
        createdAt: Date.now(),
        slides: rendered,
        carouselData,
        viewed: false
      };

      try {
        console.log('⏳ Importando CacheService...');
        const { CacheService, CACHE_KEYS } = await import('../services/cache');
        console.log('✅ CacheService importado');

        const existing = CacheService.getItem<any[]>(CACHE_KEYS.GALLERY) || [];
        const updated = [galleryItem, ...existing];

        CacheService.setItem(CACHE_KEYS.GALLERY, updated);
        window.dispatchEvent(new CustomEvent('gallery:updated', { detail: updated }));
      } catch (err) {
        console.error('❌ Erro ao atualizar cache/dispatch da galeria:', err);
      }

      addToast('Carrossel criado e adicionado à galeria', 'success');
      updateQueueItem(queueItem.id, {
        status: 'completed',
        completedAt: Date.now(),
        slides: rendered,
        carouselData: carouselData
      });
      console.log('🎉 Processo completo!');
    } catch (error) {
      console.error('❌ ERRO em handleGenerateCarousel:', error);
      addToast('Erro ao gerar carrossel. Tente novamente.', 'error');
      updateQueueItem(queueItem.id, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  const handleSavePost = async (postId: number) => {
    try {
      // Como já são posts salvos, não precisamos salvar novamente
      // Mas podemos implementar uma lógica para "desfavoritar" se necessário
      console.log('Post já está salvo:', postId);
    } catch (error) {
      console.error('Erro ao gerenciar save:', error);
    }
  };

  const handleUnsavePost = async (postId: number) => {
    try {
      // Para desmarcar como salvo, podemos recarregar a lista
      console.log('Removendo save do post:', postId);
      // Recarregar posts salvos
      loadSavedPostsAsCarousels();
    } catch (error) {
      console.error('Erro ao remover save:', error);
    }
  };

  const handleSaveSuccess = () => {
    // Recarregar a galeria após salvar um carrossel
    if (activeSort === 'saved') {
      loadSavedPostsAsCarousels();
    } else {
      loadGalleryFromAPI();
    }
  };

  // Uso do useMemo para evitar re-renderização do menu
  const memoizedNavigation = useMemo(() => <Navigation currentPage="gallery" />, []);

  return (
    <div className="flex bg-light">
      {memoizedNavigation}
      <div className="flex-1">
        <Toast toasts={toasts} onRemove={removeToast} />
        <LoadingBar isLoading={isLoadingFromAPI} />

        <main className={`${generationQueue.length > 0 ? 'pt-24' : ''} pb-20 md:pb-0`}>
          <section className="relative pb-[5rem]">
            <MouseFollowLight zIndex={-1} />
            <div
              className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 30%, rgba(255,255,255,0) 70%)",
                filter: "blur(70px)",
                animation: "glowDown 3s ease-in-out infinite"
              }}
            />

            <div
              className="pointer-events-none fixed top-0 left-0 md:left-20 right-0 bottom-0 opacity-60"
              style={{
                backgroundImage: `linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)`,
                backgroundSize: "50px 50px",
              }}
            />

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

            <div
              className="fixed pointer-events-none"
              style={{
                top: '55%',
                right: '15%',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'linear-gradient(to top right, #6a82fb, #fc9d9a, #ff7eb9)',
                opacity: 0.45,
                filter: 'blur(85px)',
                animation: 'float 11s ease-in-out infinite reverse',
              }}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-8 pt-[6rem] pb-[4rem] space-y-6">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-3">
                  Todos os seus posts estão aqui!
                </h1>
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-6" style={{ marginTop: '-90px' }}>
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/50 relative z-10">
              <div className="mb-6 flex justify-between items-center">
                <p className="text-lg md:text-xl text-gray-dark font-medium">
                  Galeria de carrosséis
                </p>
                <GalleryFilters activeSort={activeSort} onSortChange={setActiveSort} />
              </div>
              {isLoadingFromAPI && galleryCarousels.length === 0 && activeSort !== 'saved' ? (
                <SkeletonGrid count={8} type="gallery" />
              ) : activeSort === 'saved' ? (
                <Feed
                  posts={savedPosts}
                  searchTerm=""
                  activeSort={activeSort}
                  onGenerateCarousel={handleGenerateCarousel}
                  onSavePost={handleSavePost}
                  onUnsavePost={handleUnsavePost}
                  showSaveButtons={true}
                  showGenerateButtons={true}
                />
              ) : (
                <Gallery
                  carousels={galleryCarousels}
                  onViewCarousel={addEditorTab}
                  onDeleteCarousel={handleDeleteCarousel}
                />
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default GalleryPage;