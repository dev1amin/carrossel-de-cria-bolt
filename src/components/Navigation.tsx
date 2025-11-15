import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Newspaper,
  Image,
  ChevronRight,
  User,
  Ghost,
  Plus,
  Home,
} from 'lucide-react';

interface NavigationProps {
  currentPage?: 'home' | 'feed' | 'settings' | 'gallery' | 'news' | 'chatbot' | 'tools';
  onPageChange?: (page: 'home' | 'feed' | 'settings' | 'gallery' | 'news' | 'chatbot' | 'tools') => void;
  unviewedCount?: number;
}

type MenuItem =
  | { id: string; label: string; icon: React.ComponentType<any>; page: 'home' | 'feed' | 'settings' | 'gallery' | 'news' | 'chatbot' }
  | { id: string; label: string; icon: React.ComponentType<any>; onClick: () => void };

const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onPageChange,
  unviewedCount = 0,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const handlePageChange = (
    page: 'home' | 'feed' | 'settings' | 'gallery' | 'news' | 'chatbot' | 'tools',
  ) => {
    onPageChange?.(page);

    switch (page) {
      case 'home':
        navigate('/home');
        break;
      case 'feed':
        navigate('/feed');
        break;
      case 'gallery':
        navigate('/gallery');
        break;
      case 'news':
        navigate('/news');
        break;
      case 'chatbot':
        navigate('/chatbot');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'tools':
        navigate('/create-carousel');
        break;
    }
  };

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Início', icon: Home, page: 'home' },
    { id: 'feed', label: 'Feed', icon: Grid, page: 'feed' },
    {
      id: 'tools',
      label: 'Ferramentas',
      icon: Plus,
      onClick: () => navigate('/create-carousel'),
    },
    { id: 'news', label: 'Notícias', icon: Newspaper, page: 'news' },
    { id: 'gallery', label: 'Galeria', icon: Image, page: 'gallery' },
  ];

  return (
    <nav
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`hidden md:flex fixed left-0 top-0 bottom-0 bg-white border-r border-gray-light z-50 flex-col transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Topo: Logo e Nome */}
      <div className="border-b border-gray-light p-4 flex items-center gap-3 justify-center">
        <Ghost className="w-6 h-6 text-blue flex-shrink-0" />
        {isExpanded && (
          <span className="text-dark font-bold text-lg whitespace-nowrap">
            Content Busters
          </span>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col py-4 space-y-2 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            ('page' in item && currentPage === item.page) ||
            (item.id === 'tools' && window.location.pathname === '/create-carousel');

          const handleClick = () => {
            if ('onClick' in item) {
              item.onClick();
            } else if ('page' in item) {
              handlePageChange(item.page);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-light text-blue'
                  : 'text-gray hover:text-dark hover:bg-light'
              } ${!isExpanded ? 'justify-center' : ''}`}
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              {isExpanded && <span className="font-medium">{item.label}</span>}
              {item.id === 'gallery' && unviewedCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unviewedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rodapé: User e Actions */}
      <div className="border-t border-gray-light p-4 space-y-3">
        {/* User Info */}
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 rounded-full bg-light flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue" />
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-dark text-sm font-medium truncate">
                {userName}
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="text-gray hover:text-dark text-xs flex items-center gap-1 transition-colors"
              >
                Configurações <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Create Carousel Button */}
        {isExpanded && (
          <button
            onClick={() => navigate('/create-carousel')}
            className="w-full bg-blue text-white py-2 px-4 rounded-lg font-medium flex items-center justify-between hover:bg-blue-dark transition-colors"
          >
            <span>Gerar carrossel</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;