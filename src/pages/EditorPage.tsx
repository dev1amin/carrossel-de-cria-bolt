import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorTabs } from '../contexts/EditorTabsContext';
import Navigation from '../components/Navigation';
import CarouselViewer from '../components/carousel/viewer/CarouselViewer';
import { X } from 'lucide-react';

const EditorPage: React.FC = () => {
  const { tabId } = useParams<{ tabId?: string }>();
  const navigate = useNavigate();
  const { 
    editorTabs, 
    closeEditorTab, 
    closeAllEditorTabs,
    activeTabId,
    setActiveTabId 
  } = useEditorTabs();

  // Se há um tabId na URL, ativa essa aba
  useEffect(() => {
    if (tabId && editorTabs.find(t => t.id === tabId)) {
      setActiveTabId(tabId);
    } else if (editorTabs.length > 0 && !tabId) {
      // Se não há tabId na URL mas há abas, redireciona para a primeira
      navigate(`/editor/${encodeURIComponent(editorTabs[0].id)}`, { replace: true });
    } else if (editorTabs.length === 0) {
      // Se não há abas, volta para home
      navigate('/home', { replace: true });
    }
  }, [tabId, editorTabs, setActiveTabId, navigate]);

  // Atualiza a URL quando a aba ativa muda
  useEffect(() => {
    if (activeTabId && editorTabs.find(t => t.id === activeTabId)) {
      const currentPath = `/editor/${encodeURIComponent(activeTabId)}`;
      if (window.location.pathname !== currentPath) {
        navigate(currentPath, { replace: true });
      }
    }
  }, [activeTabId, editorTabs, navigate]);

  const activeTab = useMemo(() => {
    return editorTabs.find(t => t.id === activeTabId) || editorTabs[0];
  }, [editorTabs, activeTabId]);

  const handleTabClick = (id: string) => {
    setActiveTabId(id);
    navigate(`/editor/${encodeURIComponent(id)}`, { replace: true });
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeEditorTab(id);
    
    // Se fechou a aba ativa, navega para outra
    if (id === activeTabId) {
      const remainingTabs = editorTabs.filter(t => t.id !== id);
      if (remainingTabs.length > 0) {
        const nextTab = remainingTabs[0];
        navigate(`/editor/${encodeURIComponent(nextTab.id)}`, { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }
  };

  const handleCloseAll = () => {
    closeAllEditorTabs();
    navigate('/home', { replace: true });
  };

  const handleCloseEditor = () => {
    // Volta para a página anterior ou home
    navigate(-1);
  };

  const memoizedNavigation = useMemo(() => (
    <Navigation currentPage="tools" />
  ), []);

  if (editorTabs.length === 0) {
    return (
      <div className="flex bg-light">
        {memoizedNavigation}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">Nenhum carrossel aberto para edição</p>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Voltar para Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {memoizedNavigation}
      
      <div className="flex-1 flex flex-col ml-0 md:ml-20">
        {/* Barra de abas */}
        <div 
          className="bg-gray-50 border-b border-gray-200 flex items-center overflow-x-auto" 
          style={{ minHeight: '48px' }}
        >
          <div className="flex items-center">
            {editorTabs.map((tab) => (
              <div
                key={tab.id}
                className={`group flex items-center gap-2 px-4 py-3 border-r border-gray-200 transition-colors relative cursor-pointer ${
                  activeTabId === tab.id
                    ? 'bg-white text-gray-900 font-medium border-b-2 border-b-blue-500'
                    : 'bg-gray-50 text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
                onClick={() => handleTabClick(tab.id)}
              >
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {tab.title}
                </span>
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${
                    activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  aria-label="Fechar aba"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Botão fechar todas as abas */}
          {editorTabs.length > 1 && (
            <button
              onClick={handleCloseAll}
              className="ml-auto px-4 py-2 text-gray-600 hover:text-gray-900 text-xs transition-colors"
            >
              Fechar todas
            </button>
          )}
        </div>

        {/* Conteúdo da aba ativa */}
        <div className="flex-1 relative overflow-hidden">
          {activeTab && (
            <CarouselViewer
              slides={activeTab.slides}
              carouselData={activeTab.carouselData}
              onClose={handleCloseEditor}
              generatedContentId={activeTab.generatedContentId}
              autoDownload={activeTab.autoDownload}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
