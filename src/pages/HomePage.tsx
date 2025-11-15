import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Image, Wrench, LayoutGrid, ChevronRight, Search } from 'lucide-react';
import Navigation from '../components/Navigation';

interface GalleryItem {
  id: string;
  postCode: string;
  templateName: string;
  createdAt: number;
  slides: any[];
  carouselData: any;
  viewed: boolean;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadGallery = () => {
      try {
        const stored = localStorage.getItem('gallery');
        if (stored) {
          const items = JSON.parse(stored);
          setGalleryItems(items);
        }
      } catch (error) {
        console.error('Erro ao carregar galeria:', error);
      }
    };

    loadGallery();

    const handleGalleryUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      setGalleryItems(customEvent.detail || []);
    };

    window.addEventListener('gallery:updated', handleGalleryUpdate);
    return () => window.removeEventListener('gallery:updated', handleGalleryUpdate);
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
      label: 'Ferramentas',
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

  const handleGalleryItemClick = (item: GalleryItem) => {
    navigate('/gallery');
  };

  return (
    <div className="flex h-screen">
      <Navigation currentPage="home" />

      <div className="flex-1 overflow-y-auto">
        <div
          className="min-h-screen"
          style={{
            background: 'linear-gradient(135deg, #a0f4f4 0%, #e0d4f7 50%, #d4c5f9 100%)'
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-600">
                  Fique por dentro dos nossos lançamentos
                </h1>
                <ChevronRight className="w-8 h-8 text-blue-600 flex-shrink-0" />
              </div>

              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Busque designs, pastas e uploads"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-gray-700 bg-white shadow-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.route)}
                      className="group flex flex-col items-center gap-2 transition-transform hover:scale-105"
                    >
                      <div
                        className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow relative`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-gray-100 shadow-sm" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recentes</h2>
                <button
                  onClick={() => navigate('/gallery')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                >
                  Ver tudo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {galleryItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum design criado ainda
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comece criando seu primeiro carrossel
                  </p>
                  <button
                    onClick={() => navigate('/create-carousel')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                  >
                    Criar Carrossel
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {galleryItems.slice(0, 12).map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleGalleryItemClick(item)}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all"
                    >
                      {item.slides && item.slides[0] ? (
                        <img
                          src={item.slides[0]}
                          alt={item.templateName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-end">
                        <div className="w-full p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-medium truncate">
                            {item.templateName}
                          </p>
                        </div>
                      </div>
                      {!item.viewed && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
