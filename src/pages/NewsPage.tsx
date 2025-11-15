import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '../components/Navigation';
import LoadingBar from '../components/LoadingBar';
import NewsPostCard from '../components/NewsPostCard';
import NewsFilters from '../components/NewsFilters';
import Toast, { ToastMessage } from '../components/Toast';
import { getNews } from '../services/news';
import type { NewsItem, NewsFilters as NewsFiltersType, NewsPagination } from '../types/news';
import type { GenerationQueueItem } from '../carousel';
import { 
  templateService, 
  templateRenderer, 
  generateCarousel, 
  AVAILABLE_TEMPLATES,
  CarouselEditorTabs
} from '../carousel';
import { useEditorTabs } from '../contexts/EditorTabsContext';
import { useGenerationQueue } from '../contexts/GenerationQueueContext';

interface NewsPageProps {
  unviewedCount?: number;
}

const NewsPage: React.FC<NewsPageProps> = ({ unviewedCount = 0 }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filters, setFilters] = useState<NewsFiltersType>({ countries: [], languages: [] });
  const [pagination, setPagination] = useState<NewsPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  const loadNews = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getNews({
        page,
        limit: 20,
        country: selectedCountry || undefined,
        lang: selectedLanguage || undefined,
      });

      setNews(response.data);
      setFilters(response.filters);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news');
      console.error('Error loading news:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToast = (message: string, type: 'success' | 'error') => {
    const toast: ToastMessage = { id: `toast-${Date.now()}`, message, type };
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleGenerateCarousel = async (newsData: NewsItem, templateId: string) => {
    console.log('🚀 NewsPage: handleGenerateCarousel iniciado', { newsData, templateId });
    
    const template = AVAILABLE_TEMPLATES.find(t => t.id === templateId);
    const queueItem: GenerationQueueItem = {
      id: `news-${newsData.id}-${templateId}-${Date.now()}`,
      postCode: newsData.id,
      templateId,
      templateName: template?.name || `Template ${templateId}`,
      status: 'generating',
      createdAt: Date.now(),
    };

    addToQueue(queueItem);
    console.log('✅ Item adicionado à fila:', queueItem.id);

    try {
      const jwtToken = localStorage.getItem('access_token');
      
      // Monta o payload com os dados da notícia
      const newsPayload = {
        id: newsData.id,
        title: newsData.title,
        description: newsData.description,
        content: newsData.content,
        url: newsData.url,
        image: newsData.image,
        publishedAt: newsData.publishedAt,
        country: newsData.country,
        lang: newsData.lang,
        niche: newsData.niches.name,
        type: 'news' as const,
      };
      
      console.log(`⏳ Chamando generateCarousel para notícia: ${newsData.id} com template: ${templateId}`);
      console.log('📦 Payload:', newsPayload);
      
      const result = await generateCarousel(newsData.id, templateId, jwtToken || undefined, undefined, newsPayload);
      console.log('✅ Carousel generated successfully:', result);

      if (!result) {
        console.error('❌ Result é null ou undefined');
        addToast('Erro: resposta vazia do servidor', 'error');
        updateQueueItem(queueItem.id, { status: 'error', errorMessage: 'Resposta vazia do servidor' });
        return;
      }

      const resultArray = Array.isArray(result) ? result : [result];
      console.log('✅ resultArray:', resultArray);

      if (resultArray.length === 0) {
        console.error('❌ Array de resultado vazio');
        addToast('Erro: nenhum dado retornado', 'error');
        updateQueueItem(queueItem.id, { status: 'error', errorMessage: 'Nenhum dado retornado' });
        return;
      }

      const carouselData = resultArray[0];
      console.log('✅ carouselData extraído:', carouselData);

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
      console.log('✅ Slides renderizados:', rendered.length);

      const galleryItem = {
        id: queueItem.id,
        postCode: newsData.id,
        templateName: queueItem.templateName,
        createdAt: Date.now(),
        slides: rendered,
        carouselData,
        viewed: false,
      };
      console.log('✅ Item de galeria criado:', galleryItem.id);

      try {
        console.log('⏳ Importando CacheService...');
        const { CacheService, CACHE_KEYS } = await import('../services/cache');
        console.log('✅ CacheService importado');
        
        const existing = CacheService.getItem<any[]>(CACHE_KEYS.GALLERY) || [];
        console.log('✅ Galeria existente no cache:', existing.length, 'itens');
        
        const updated = [galleryItem, ...existing];
        console.log('✅ Nova galeria terá:', updated.length, 'itens');
        
        CacheService.setItem(CACHE_KEYS.GALLERY, updated);
        console.log('✅ Galeria salva no cache');
        
        window.dispatchEvent(new CustomEvent('gallery:updated', { detail: updated }));
        console.log('✅ Evento gallery:updated disparado com', updated.length, 'itens');
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

  // Carrega notícias inicial
  useEffect(() => {
    loadNews(1);
  }, []);

  // Recarrega quando filtros mudam
  useEffect(() => {
    loadNews(1);
  }, [selectedCountry, selectedLanguage]);

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      loadNews(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      loadNews(pagination.page + 1);
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
      <h3 className="text-gray text-lg font-medium mb-2">Nenhuma notícia encontrada</h3>
      <p className="text-gray text-sm text-center max-w-md">
        Não há notícias disponíveis para os filtros selecionados ou você ainda não configurou seus niches.
      </p>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-light text-dark flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => loadNews(1)}
            className="mt-4 text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Uso do useMemo para evitar re-renderização do menu
  const memoizedNavigation = useMemo(() => <Navigation currentPage="news" unviewedCount={unviewedCount} />, [unviewedCount]);

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

        <main className={`${generationQueue.length > 0 ? 'mt-20' : ''} bg-white`}>
        <section className="relative pb-[5rem]">
            <div
              className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] pointer-events-none"
              style={{
                background: "radial-gradient(circle at 40% 30%, rgba(244, 114, 182, 0.35) 0%, rgba(168, 85, 247, 0.3) 30%, rgba(59, 130, 246, 0.25) 50%, rgba(255,255,255,0) 70%)",
                filter: "blur(80px)",
                animation: "glowDown 3s ease-in-out infinite"
              }}
            />

            <div
              className="pointer-events-none absolute top-0 left-0 right-0 opacity-40"
              style={{
                backgroundImage: `linear-gradient(rgba(244, 114, 182, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)`,
                backgroundSize: "50px 50px",
                height: "280px",
              }}
            />

            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: "280px",
                height: "80px",
                background: "linear-gradient(to bottom, rgba(249,250,251,0) 0%, rgba(249,250,251,1) 100%)"
              }}
            />

            <div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: "360px",
                height: "60px",
                background: "linear-gradient(to bottom, rgba(249,250,251,0.3) 0%, rgba(249,250,251,1) 100%)"
              }}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-8 pt-[6rem] pb-[4rem] space-y-6">
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-3">
                  Separamos as melhores notícias pra você!
                </h1>
              </div>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-8" style={{ marginTop: '-90px' }}>
            <div className="mb-6 flex justify-between items-center relative z-10">
              <p className="text-lg md:text-xl text-gray-dark font-medium">
                Aqui está o seu feed de notícias!
              </p>
              {(filters.countries.length > 0 || filters.languages.length > 0) && (
                <NewsFilters
                  filters={filters}
                  selectedCountry={selectedCountry}
                  selectedLanguage={selectedLanguage}
                  onCountryChange={setSelectedCountry}
                  onLanguageChange={setSelectedLanguage}
                />
              )}
            </div>
            {news.length === 0 && !isLoading ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
                  <AnimatePresence>
                    {news.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex justify-center"
                      >
                        <NewsPostCard
                          news={item}
                          index={index}
                          onGenerateCarousel={handleGenerateCarousel}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Paginação */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                    <button
                      onClick={handlePreviousPage}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-white hover:bg-light disabled:opacity-50 disabled:cursor-not-allowed border border-gray-light rounded-lg text-dark transition-colors"
                    >
                      Anterior
                    </button>
                    
                    <span className="text-gray">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 bg-white hover:bg-light disabled:opacity-50 disabled:cursor-not-allowed border border-gray-light rounded-lg text-dark transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default NewsPage;