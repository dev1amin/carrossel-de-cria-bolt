import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Newspaper,
  Image,
  ChevronRight,
  User,
  Ghost,
  PlusCircle,
  Home,
  ChevronDown,
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
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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
      label: 'Criar',
      icon: PlusCircle,
      onClick: () => navigate('/create-carousel'),
    },
    { id: 'news', label: 'Notícias', icon: Newspaper, page: 'news' },
    { id: 'gallery', label: 'Galeria', icon: Image, page: 'gallery' },
  ];

  return (
    <nav
      className="hidden md:flex fixed left-0 top-0 bottom-0 bg-white border-r border-gray-light z-50 flex-col w-20"
    >
      {/* Topo: Logo */}
      <div className="border-b border-gray-light p-4 flex items-center justify-center">
        <Ghost className="w-6 h-6 text-blue flex-shrink-0" />
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
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative ${
                isActive
                  ? 'bg-blue-light text-blue'
                  : 'text-gray hover:text-dark hover:bg-light'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-medium text-center">{item.label}</span>
              {item.id === 'gallery' && unviewedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unviewedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rodapé: User Dropdown */}
      <div className="border-t border-gray-light p-2">
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-light transition-colors w-full"
          >
            <div className="w-8 h-8 rounded-full bg-light flex items-center justify-center">
              <User className="w-4 h-4 text-blue" />
            </div>
            <span className="text-[10px] font-medium text-center">{userName.split(' ')[0]}</span>
            <ChevronDown className={`w-3 h-3 text-gray transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-light rounded-lg shadow-lg z-50">
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsUserDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-light transition-colors rounded-t-lg"
              >
                Configurações
              </button>
              <button
                onClick={() => {
                  navigate('/create-business');
                  setIsUserDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-light transition-colors"
              >
                Criar Business
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('user');
                  navigate('/login');
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;