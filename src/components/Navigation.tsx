import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Grid,
  Newspaper,
  Image,
  User,
  PlusCircle,
  Home,
  Settings,
  LogOut,
  Layers,
  X,
} from 'lucide-react';
import { logout } from '../services/auth';
import { useEditorTabs } from '../contexts/EditorTabsContext';

interface NavigationProps {
  currentPage?: 'home' | 'feed' | 'settings' | 'gallery' | 'news' | 'chatbot' | 'tools';
  onPageChange?: (
    page: 'home' | 'feed' | 'settings' | 'gallery' | 'news' | 'chatbot' | 'tools',
  ) => void;
  unviewedCount?: number;
}

type MenuItem =
  | {
      id: string;
      label: string;
      icon: React.ComponentType<any>;
      page: 'home' | 'feed' | 'settings' | 'gallery' | 'news' | 'chatbot';
    }
  | {
      id: string;
      label: string;
      icon: React.ComponentType<any>;
      onClick: () => void;
    };

// Logo SVG
const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 300 328"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M154.148 326.382L262.952 263.564C268.484 260.371 268.484 252.389 262.952 249.195L154.148 186.378C151.58 184.898 148.419 184.898 145.851 186.378L37.0479 249.195C31.5153 252.389 31.5153 260.371 37.0479 263.564L145.851 326.382C148.419 327.862 151.58 327.862 154.148 326.382Z"
      fill="url(#paint0_linear_58_2)"
    />
    <path
      d="M0 196.76V71.1259C0 68.1613 1.58249 65.4216 4.14637 63.9413L112.95 1.12415C118.482 -2.06946 125.393 1.92153 125.393 8.30875V133.943C125.393 136.908 123.811 139.647 121.247 141.128L12.4432 203.945C6.91062 207.138 0 203.147 0 196.76Z"
      fill="url(#paint1_linear_58_2)"
    />
    <path
      d="M287.557 203.945L178.753 141.128C176.185 139.647 174.607 136.908 174.607 133.943V8.30875C174.607 1.92153 181.522 -2.06946 187.05 1.12415L295.854 63.9413C298.422 65.4216 300 68.1613 300 71.1259V196.76C300 203.147 293.085 207.138 287.557 203.945Z"
      fill="url(#paint2_linear_58_2)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_58_2"
        x1="30.9696"
        y1="214.239"
        x2="77.6859"
        y2="355.591"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#0047BB" />
        <stop offset="1" stopColor="#005CF2" />
        <stop offset="1" stopColor="#4D90FF" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_58_2"
        x1="-1.03273"
        y1="41.7734"
        x2="111.241"
        y2="167.916"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#0047BB" />
        <stop offset="1" stopColor="#005CF2" />
        <stop offset="1" stopColor="#4D90FF" />
      </linearGradient>
      <linearGradient
        id="paint2_linear_58_2"
        x1="173.574"
        y1="41.7734"
        x2="285.848"
        y2="167.916"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#0047BB" />
        <stop offset="1" stopColor="#005CF2" />
        <stop offset="1" stopColor="#4D90FF" />
      </linearGradient>
    </defs>
  </svg>
);

const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  onPageChange,
  unviewedCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { editorTabs, activeTabId } = useEditorTabs();

  const hasOpenEditor = editorTabs.length > 0;

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
    setIsUserMenuOpen(false);
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

  // Itens principais do menu (visíveis na barra)
  const mainMenuItems: MenuItem[] = [
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

  // Verifica se uma página está ativa
  const isPageActive = (item: MenuItem): boolean => {
    if ('page' in item && currentPage === item.page) return true;
    if (item.id === 'tools' && location.pathname === '/create-carousel') return true;
    return false;
  };

  return (
    <>
      {/* ============= DESKTOP NAVIGATION ============= */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-gray-200 z-50 flex-col">
        {/* Logo */}
        <div className="flex border-b border-gray-200 p-4 items-center justify-center">
          <LogoIcon className="w-6 h-6 flex-shrink-0" />
        </div>

        {/* Menu Items */}
        <div className="flex-1 flex flex-col py-4 space-y-2 px-2">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isPageActive(item);

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
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[10px] font-medium text-center whitespace-nowrap">
                  {item.label}
                </span>
                {item.id === 'gallery' && unviewedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unviewedCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Botão do Editor - Desktop */}
          {hasOpenEditor && (
            <button
              onClick={() => {
                const targetTabId = activeTabId || editorTabs[0]?.id;
                if (targetTabId) {
                  navigate(`/editor/${encodeURIComponent(targetTabId)}`);
                } else {
                  navigate('/editor');
                }
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors relative ${
                location.pathname.startsWith('/editor')
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-medium text-center whitespace-nowrap">
                Editor
              </span>
              <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                {editorTabs.length}
              </span>
            </button>
          )}
        </div>

        {/* User Menu - Desktop */}
        <div className="border-t border-gray-200 p-2">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[10px] font-medium text-center whitespace-nowrap text-gray-700">
                {userName.split(' ')[0]}
              </span>
            </button>

            {/* Dropdown Menu Desktop */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 w-full text-left text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Configurações</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ============= MOBILE NAVIGATION ============= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1 max-w-full overflow-hidden">
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isPageActive(item);

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
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 transition-colors relative ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-[10px] font-medium truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.label}
                </span>
                {item.id === 'gallery' && unviewedCount > 0 && (
                  <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">
                    {unviewedCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Botão do Editor - Mobile (se houver) */}
          {hasOpenEditor && (
            <button
              onClick={() => {
                const targetTabId = activeTabId || editorTabs[0]?.id;
                if (targetTabId) {
                  navigate(`/editor/${encodeURIComponent(targetTabId)}`);
                } else {
                  navigate('/editor');
                }
              }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 transition-colors relative ${
                location.pathname.startsWith('/editor')
                  ? 'text-purple-600'
                  : 'text-gray-500'
              }`}
            >
              <Layers className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate">Editor</span>
              <span className="absolute top-1 right-1/4 bg-purple-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">
                {editorTabs.length}
              </span>
            </button>
          )}

          {/* User Button - Mobile */}
          <button
            onClick={() => setIsUserMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 transition-colors text-gray-500"
          >
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-[10px] font-medium truncate">Perfil</span>
          </button>
        </div>
      </nav>

      {/* Mobile User Menu Modal */}
      {isUserMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsUserMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl safe-area-bottom animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-sm text-gray-500">Minha conta</p>
              </div>
              <button
                onClick={() => setIsUserMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Menu Options */}
            <div className="py-2">
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsUserMenuOpen(false);
                }}
                className="flex items-center gap-4 px-4 py-3 w-full text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-base font-medium text-gray-700">Configurações</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-4 px-4 py-3 w-full text-left hover:bg-red-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-base font-medium text-red-600">Sair da conta</span>
              </button>
            </div>

            {/* Bottom Spacing */}
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* Overlay para fechar dropdown desktop */}
      {isUserMenuOpen && (
        <div 
          className="hidden md:block fixed inset-0 z-40" 
          onClick={() => setIsUserMenuOpen(false)} 
        />
      )}
    </>
  );
};

export default Navigation;
