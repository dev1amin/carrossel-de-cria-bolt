import React, { useState, useEffect, useMemo } from 'react';
import Feed from '../components/Feed';
import Navigation from '../components/Navigation';
import LoadingBar from '../components/LoadingBar';
import FilterBar from '../components/FilterBar';
import Toast, { ToastMessage } from '../components/Toast';
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

  const getUserName = (): string => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.name || user.username || 'Usuário';
      }
    } catch (error) {
      console.error('Erro ao obter nome do usuário:', error);
    }
    return 'Usuário';
  };

  const userName = getUserName();

  useEffect(() => {
    setShouldShowEditor(false);
  }, [setShouldShowEditor]);

  useEffect(() => {
    const loadFeed = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('📥 Carregando feed...');
        const feedData = await getFeed();
        console.log('✅ Feed carregado:', feedData.length, 'posts');
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
    <div className="flex h-screen bg-light">
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
          <section className="relative pb-20 md:pb-24">

            {/* Bola de luz agora com animação de cima para baixo */}
            <div
              className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.2) 50%, rgba(255,255,255,0) 100%)",
                filter: "blur(70px)",
                animation: "glowDown 3s ease-in-out infinite",
              }}
            />

            {/* Quadrados mais visíveis e ocupando mais altura (até metade do carrossel) */}
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(122,95,255,0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(122,95,255,0.5) 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
                height: "100vh",
              }}
            />

            {/* Fade azul para branco no final */}
            <div
              className="absolute inset-0 bottom-0 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, rgba(249,250,251,0) 30%, rgba(249,250,251,0.95) 100%)"
              }}
            />

            {/* Conteúdo normal */}
            <div className="relative max-w-5xl mx-auto px-8 pt-[6rem] pb-[4.5rem] space-y-6">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-3" style={{ fontFamily: '"Shadows Into Light", cursive' }}>
                  Bem vindo de volta {userName}!
                </h1>
                <p className="text-lg md:text-xl text-gray-dark">
                  Aqui está o seu feed de posts!
                </p>
              </div>

              <FilterBar activeSort={activeSort} onSortChange={setActiveSort} />
            </div>

          </section>

          {/* Feed logo em seguida */}
          <section className="max-w-6xl mx-auto px-8 -mt-[6.5rem]">
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <Feed
                posts={posts}
                searchTerm=""
                activeSort={activeSort}
                onGenerateCarousel={handleGenerateCarousel}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default FeedPage;