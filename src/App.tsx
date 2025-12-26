import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { configureCarousel } from './carousel';
import { EditorTabsProvider } from './contexts/EditorTabsContext';
import { GenerationQueueProvider, useGenerationQueue } from './contexts/GenerationQueueContext';
import { GenerationQueue } from './carousel';
import type { GenerationQueueItem } from './carousel';
import { MouseFollowLight } from './components/MouseFollowLight';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import NewsPage from './pages/NewsPage';
import GalleryPage from './pages/GalleryPage';
import StatsPage from './pages/StatsPage';
import SettingsPageContainer from './pages/SettingsPageContainer';
import CreateCarouselPage from './pages/CreateCarouselPage';
import ChatBotPageWithConversations from './pages/ChatBotPageWithConversations';
import EditorPage from './pages/EditorPage';
import CarouselPreviewPage from './pages/CarouselPreviewPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';

// Componente interno para usar o hook da fila
function AppContent() {
  const { generationQueue, removeFromQueue } = useGenerationQueue();
  const navigate = useNavigate();

  const handleViewCarousel = (item: GenerationQueueItem) => {
    console.log('👁️ handleViewCarousel chamado:', { 
      id: item.id, 
      hasSlides: !!item.slides, 
      hasCarouselData: !!item.carouselData,
      slidesLength: item.slides?.length,
      item 
    });

    if (!item.slides || !item.carouselData) {
      console.error('❌ Item da fila não tem dados de carrossel:', item);
      alert('Erro: Dados do carrossel não encontrados. Tente gerar novamente.');
      return;
    }

    // Navega para a página de preview ao invés do editor
    navigate(`/carousel-preview/${encodeURIComponent(item.id)}`, {
      state: {
        slides: item.slides,
        carouselData: item.carouselData,
        title: item.templateName,
        generatedContentId: item.generatedContentId,
        fromQueue: true,
        queueItemId: item.id,
        description: (item.carouselData as any)?.description || '',
      }
    });
  };

  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isEditorPage = location.pathname.startsWith('/editor');

  return (
    <>
      {/* Luz global que acompanha o mouse - não aparece no login e editor */}
      {!isLoginPage && !isEditorPage && <MouseFollowLight zIndex={-1} />}

      {/* Fila global - renderizada fora das rotas */}
      <GenerationQueue 
        items={generationQueue}
        onRemoveItem={removeFromQueue}
        onViewCarousel={handleViewCarousel}
      />
      
      <Routes>
        {/* Rota de Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rota Raiz */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/create-carousel" element={<CreateCarouselPage />} />
          <Route path="/chatbot" element={<ChatBotPageWithConversations />} />
          <Route path="/chatbot/:conversationId" element={<ChatBotPageWithConversations />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPageContainer />} />
          <Route path="/carousel-preview/:previewId" element={<CarouselPreviewPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/editor/:tabId" element={<EditorPage />} />
        </Route>

        {/* Página 404 para rotas não encontradas */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

function App() {
  useEffect(() => {
    configureCarousel({
      webhook: {
        generateCarousel: 'https://api.workez.online/webhook/generateCarousel',
        searchImages: 'https://api.workez.online/webhook/searchImages',
      },
    });
  }, []);

  return (
    <EditorTabsProvider>
      <GenerationQueueProvider>
        <AppContent />
      </GenerationQueueProvider>
    </EditorTabsProvider>
  );
}

export default App;