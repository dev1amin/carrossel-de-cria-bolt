import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Feed from '../components/Feed';
import Navigation from '../components/Navigation';
import LoadingBar from '../components/LoadingBar';
import FilterBar from '../components/FilterBar';
import Toast, { ToastMessage } from '../components/Toast';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { CacheService, CACHE_KEYS } from '../services/cache';
import { SortOption, Post } from '../types';
import type { GenerationQueueItem } from '../carousel';
import { getFeed } from '../services/feed';
import {
  templateService,
  templateRenderer,
  generateCarousel,
  AVAILABLE_TEMPLATES,
  CarouselEditorTabs
} from '../carousel';
import { useEditorTabs } from '../contexts/EditorTabsContext';
import { useGenerationQueue } from '../contexts/GenerationQueueContext';

interface FeedPageProps {
  unviewedCount?: number;
}

const FeedPage: React.FC<FeedPageProps> = ({ unviewedCount = 0 }) => {
  const [activeSort, setActiveSort] = useState<SortOption>('popular');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    editorTabs,
    closeEditorTab,
    closeAllEditorTabs,
    shouldShowEditor,
    setShouldShowEditor
  } = useEditorTabs();

  const { addToQueue, updateQueueItem, generationQueue } = useGenerationQueue();

  useEffect(() => {
    setShouldShowEditor(false);
  }, [setShouldShowEditor]);

  useEffect(() => {
    const loadFeed = async () => {
      // Check if we have cached data first
      const cachedPosts = CacheService.getItem<Post[]>(CACHE_KEYS.FEED);

      if (cachedPosts && cachedPosts.length > 0) {
        // Display cached data immediately (no loading state)
        console.log('📦 Mostrando cache do feed enquanto busca dados frescos');
        setPosts(cachedPosts);
        setIsLoading(false);
      } else {
        // No cache, show loading
        setIsLoading(true);
      }

      // ALWAYS fetch fresh data from API
      setError(null);
      try {
        console.log('🔄 Buscando dados frescos da API para feed...');
        const feedData = await getFeed(true); // Force update to always fetch
        console.log('✅ Feed recebido da API:', feedData.length, 'posts');
        
        // Check if data has changed (getFeed already handles this internally)
        // Just update the state with fresh data
        setPosts(feedData);
      } catch (err) {
        console.error('❌ Erro ao carregar feed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load feed';

        if (errorMessage.includes('adicionar pelo menos 1 influenciador')) {
          setError(
            'Você precisa adicionar pelo menos 1 influenciador como interesse antes de gerar seu feed. Configure isso nas configurações do seu business.'
          );
        } else if (errorMessage.includes('Feed generation failed')) {
          setError('Não foi possível gerar seu feed no momento. Tente novamente em alguns instantes.');
        } else {
          setError(errorMessage);
        }
        // Keep cached data if fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    loadFeed();
  }, []);

  const addToast = (message: string, type: 'success' | 'error') => {
    const toast: ToastMessage = { id: `toast-${Date.now()}`, message, type };
    setToasts((prev) => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleGenerateCarousel = async (code: string, templateId: string, postId?: number) => {
    console.log('🚀 FeedPage: handleGenerateCarousel iniciado', { code, templateId, postId });

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
      const result = await generateCarousel(code, templateId, jwtToken || undefined, postId);
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

      const templateSlides = await templateService.fetchTemplate(responseTemplateId);
      console.log('✅ Template obtido, total de slides:', templateSlides?.length || 0);

      const rendered = templateRenderer.renderAllSlides(templateSlides, carouselData);

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
        
        // Invalidar cache da HomePage para forçar atualização
        CacheService.clearItem(`${CACHE_KEYS.GENERATED_CONTENT}_home`);
        console.log('🔄 Cache da HomePage invalidado');
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

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-light mb-4"
      >
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" />
        <path d="M15 18h-5" />
        <path d="M10 6h8v4h-8V6Z" />
      </svg>
      <h3 className="text-gray text-lg font-medium mb-2">Nenhum post encontrado</h3>
      <p className="text-gray text-sm text-center max-w-md">
        Não há posts disponíveis no feed no momento.
      </p>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-light text-dark flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const memoizedNavigation = useMemo(() => <Navigation currentPage="feed" unviewedCount={unviewedCount} />, [unviewedCount]);

  return (
    <div className="flex h-screen bg-white">
      {memoizedNavigation}
      <div className="flex-1">
        {shouldShowEditor && (
          <CarouselEditorTabs
            tabs={editorTabs}
            onCloseTab={closeEditorTab}
            onCloseAll={closeAllEditorTabs}
            onEditorsClosed={() => setShouldShowEditor(false)}
          />
        )}
        <Toast toasts={toasts} onRemove={removeToast} />
        <LoadingBar isLoading={isLoading} />

        <main className={`${generationQueue.length > 0 ? 'mt-20' : ''}`}>
          <section className="relative pb-[5rem]">
            <div
              className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 30%, rgba(255,255,255,0) 70%)",
                filter: "blur(70px)",
                animation: "glowDown 3s ease-in-out infinite"
              }}
            />

            <div
              className="pointer-events-none absolute top-0 left-0 right-0 opacity-60"
              style={{
                backgroundImage: `linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)`,
                backgroundSize: "50px 50px",
                height: "280px",
              }}
            />

            <div
              className="absolute pointer-events-none"
              style={{
                top: '10%',
                left: '12%',
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
              className="absolute pointer-events-none"
              style={{
                top: '50%',
                right: '10%',
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
              className="absolute pointer-events-none"
              style={{
                bottom: '15%',
                left: '20%',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
                opacity: 0.2,
                filter: 'blur(60px)',
                animation: 'float 12s ease-in-out infinite',
              }}
            />


            <div className="relative z-10 max-w-5xl mx-auto px-8 pt-[6rem] pb-[4rem] space-y-6">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-3">
                  Seu Feed Personalizado
                </h1>
              </div>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-8" style={{ marginTop: '-90px' }}>
            <div className="mb-6 flex justify-between items-center relative z-10">
              <p className="text-lg md:text-xl text-gray-dark font-medium">
                Aqui está o seu feed de posts!
              </p>
              <FilterBar activeSort={activeSort} onSortChange={setActiveSort} />
            </div>

            {isLoading && posts.length === 0 ? (
              <SkeletonGrid count={8} type="post" />
            ) : posts.length === 0 ? (
              <EmptyState />
            ) : (
              <Feed
                posts={posts}
                searchTerm=""
                activeSort={activeSort}
                onGenerateCarousel={handleGenerateCarousel}
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default FeedPage;
