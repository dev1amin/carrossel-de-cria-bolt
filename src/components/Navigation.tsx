import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Newspaper,
  Image,
  User,
  PlusCircle,
  Home,
  ChevronDown,
  Settings,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { logout } from '../services/auth';

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

// Logo com o SVG que você mandou
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
      className="fixed md:left-0 md:top-0 md:bottom-0 bottom-0 left-0 right-0 md:w-20 w-full bg-white border-r md:border-r border-t md:border-t-0 border-gray-light z-50 flex md:flex-col flex-row"
    >
      {/* Topo: Logo (apenas desktop) */}
      <div className="hidden md:flex border-b border-gray-light p-4 items-center justify-center">
        <LogoIcon className="w-6 h-6 flex-shrink-0" />
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex md:flex-col flex-row md:py-4 py-0 md:space-y-2 space-y-0 md:space-x-0 space-x-0 md:px-2 px-0 justify-around md:justify-start">
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
      </div>

      {/* User + opções embaixo, mesmo estilo dos itens de cima */}
      <div className="md:border-t border-t-0 md:border-l-0 border-l border-gray-light md:p-2 p-0 md:w-auto w-16">
        <div className="flex flex-col items-stretch">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-light transition-colors w-full"
          >
            <div className="w-8 h-8 rounded-full bg-light flex items-center justify-center">
              <User className="w-4 h-4 text-blue" />
            </div>
            <span className="text-[10px] font-medium text-center whitespace-nowrap">
              {userName.split(' ')[0]}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-gray transition-transform ${
                isUserDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isUserDropdownOpen && (
            <div className="mt-1 flex flex-col items-center space-y-1">
              <button
                onClick={() => {
                  navigate('/settings');
                  setIsUserDropdownOpen(false);
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-gray hover:text-dark hover:bg-light w-full"
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span className="text-[10px] font-medium text-center whitespace-nowrap">
                  Configurações
                </span>
              </button>

              {/* 
              <button
                onClick={() => {
                  navigate('/create-business');
                  setIsUserDropdownOpen(false);
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-gray hover:text-dark hover:bg-light w-full"
              >
                <Briefcase className="w-5 h-5 flex-shrink-0" />
                <span className="text-[10px] font-medium text-center whitespace-nowrap">
                  Criar Business
                </span>
              </button>
              */}

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-[10px] font-medium text-center whitespace-nowrap">
                  Sair
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;