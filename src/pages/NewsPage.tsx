import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '../components/Navigation';
import LoadingBar from '../components/LoadingBar';
import NewsCard from '../components/NewsCard';
import Toast, { ToastMessage } from '../components/Toast';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { MouseFollowLight } from '../components/MouseFollowLight';
import { ToneSetupModal } from '../components/ToneSetupModal';
import { getNews } from '../services/news';
import { CacheService, CACHE_KEYS } from '../services/cache';
import type { NewsItem, NewsFilters as NewsFiltersType, NewsPagination } from '../types/news';
import type { GenerationQueueItem, GenerationOptions, CarouselTab } from '../carousel';
import {
  templateService,
  templateRenderer,
  generateCarousel,
  AVAILABLE_TEMPLATES,
} from '../carousel';
import { useEditorTabs } from '../contexts/EditorTabsContext';
import { useGenerationQueue } from '../contexts/GenerationQueueContext';
import { useToneSetupAutoShow as useToneSetup } from '../hooks/useToneSetupVariants';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const navigate = useNavigate();

  const { addEditorTab } = useEditorTabs();
  
  const { showToneModal, checkToneSetupBeforeAction, closeToneModal, completeToneSetup } = useToneSetup();
  
  const { addToQueue, updateQueueItem, generationQueue } = useGenerationQueue();
  
  // Detecta mudanças de tamanho de tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadNews = async (page: number = 1) => {
    const cacheKey = `${CACHE_KEYS.NEWS}_${JSON.stringify({ page, country: selectedCountry, lang: selectedLanguage })}`;

    // Check if we have cached data first
    const cachedData = CacheService.getItem<any>(cacheKey);

    if (cachedData && cachedData.data && cachedData.data.length > 0) {
      // Display cached data immediately
      console.log('📦 Usando dados em cache de notícias');
      setNews(cachedData.data);
      setFilters(cachedData.filters || { countries: [], languages: [] });
      setPagination(cachedData.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      setIsLoading(false);
      return;
    }

    // No cache, show loading and fetch
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

      // Cache the entire response
      CacheService.setItem(cacheKey, response);
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

  const handleGenerateClick = () => {
    // Check if tone setup is needed before showing template modal
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    if (needsToneSetup === 'true') {
      checkToneSetupBeforeAction(() => {});
      return;
    }
    // If tone setup is not needed, the modal will be opened by the NewsPostCard component
  };

  const handleGenerateCarousel = async (newsData: NewsItem, templateId: string, options?: GenerationOptions) => {
    // Check if tone setup is needed before generating carousel
    const needsToneSetup = localStorage.getItem('needs_tone_setup');
    if (needsToneSetup === 'true') {
      checkToneSetupBeforeAction(() => {});
      return;
    }

    console.log('🚀 NewsPage: handleGenerateCarousel iniciado', { newsData, templateId, options });
    
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
      
      const result = await generateCarousel(newsData.id, templateId, jwtToken || undefined, undefined, newsPayload, options);
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

  // Extrair niches únicos das notícias
  const availableNiches = useMemo(() => {
    const nichesSet = new Set<string>();
    news.forEach(item => {
      if (item.niches?.name) {
        nichesSet.add(item.niches.name);
      }
    });
    return Array.from(nichesSet).sort();
  }, [news]);

  // Filtrar notícias por busca e niche
  const displayNews = useMemo(() => {
    let filtered = [...news];
    
    // Filtro por busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      );
    }
    
    // Filtro por niche
    if (selectedNiche) {
      filtered = filtered.filter(item => item.niches?.name === selectedNiche);
    }
    
    return filtered;
  }, [news, searchTerm, selectedNiche]);

  return (
    <div className="flex min-h-screen bg-white overflow-x-hidden">
      {memoizedNavigation}
      <div className="flex-1 md:ml-20">
        <Toast toasts={toasts} onRemove={removeToast} />
        <LoadingBar isLoading={isLoading} />

        {/* Mobile & Desktop Layout with same style */}
        <main className={`min-h-screen ${isMobile ? 'pb-16' : 'pb-8'} bg-gray-50`}>
          {/* Header com Filtros e Busca */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-6">
              <div className="flex flex-col gap-4">
                {/* Título */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Notícias
                </h1>

                {/* Barra de Busca e Filtros */}
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Campo de Busca */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar notícias..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 placeholder-gray-400"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Filtro por Tema */}
                  <div className="w-full md:w-64">
                    <select
                      value={selectedNiche}
                      onChange={(e) => setSelectedNiche(e.target.value)}
                      className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                    >
                      <option value="">Todos os temas</option>
                      {availableNiches.map((niche) => (
                        <option key={niche} value={niche}>
                          {niche}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botão Limpar Filtros */}
                  {(searchTerm || selectedNiche) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedNiche('');
                      }}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Contador de Resultados */}
                <div className="text-sm text-gray-600">
                  {displayNews.length} {displayNews.length === 1 ? 'notícia encontrada' : 'notícias encontradas'}
                  {(searchTerm || selectedNiche) && ` de ${news.length} total`}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="max-w-6xl mx-auto px-4 py-6">
            {isLoading && news.length === 0 ? (
              <SkeletonGrid count={6} type="news" />
            ) : displayNews.length === 0 ? (
              <div className="text-center py-20">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma notícia encontrada</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || selectedNiche
                    ? 'Tente ajustar os filtros de busca'
                    : 'Não há notícias disponíveis no momento'}
                </p>
              </div>
            ) : (
              <div className="space-y-0 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <AnimatePresence>
                  {displayNews.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="px-6"
                    >
                      <NewsCard
                        news={item}
                        onGenerateCarousel={handleGenerateCarousel}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={handlePreviousPage}
                  disabled={pagination.page === 1}
                  className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-700 font-medium transition-colors shadow-sm"
                >
                  Anterior
                </button>

                <span className="text-gray-600 font-medium">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-700 font-medium transition-colors shadow-sm"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <ToneSetupModal
        isOpen={showToneModal}
        onClose={closeToneModal}
        onComplete={completeToneSetup}
      />
    </div>
  );
};

export default NewsPage;