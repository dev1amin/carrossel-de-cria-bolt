import React, { useState, useEffect, useCallback } from 'react';
import { Building, Users, Target } from 'lucide-react';
import Navigation from './Navigation';
import { MouseFollowLight } from './MouseFollowLight';
import { getUserSettings } from '../services/settings';
import { UserSettings } from '../types/settings';

interface SettingsPageProps {
  onPageChange: (page: 'feed' | 'settings') => void;
  setIsLoading: (loading: boolean) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onPageChange, setIsLoading }) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('negocio');

  const loadUserSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await getUserSettings();
      setUserSettings(settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsPageLoading(false);
      setIsLoading(false);
    }
  }, [setIsLoading]);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <div className="container mx-auto">
          <div className="flex items-center mb-8">
            <button onClick={() => onPageChange('feed')} className="text-gray-900 hover:text-blue-600 transition-colors">
              {/* ArrowLeft icon if needed */}
            </button>
            <h1 className="text-xl font-semibold ml-4">Configurações</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Navigation currentPage="settings" unviewedCount={0} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white relative ml-16">
        <MouseFollowLight zIndex={-1} />

        <div
          className="pointer-events-none fixed top-0 left-0 md:left-20 right-0 bottom-0 opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '10%',
            left: '8%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.3,
            filter: 'blur(80px)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '5%',
            right: '12%',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.25,
            filter: 'blur(70px)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '40%',
            left: '5%',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.2,
            filter: 'blur(75px)',
            animation: 'float 11s ease-in-out infinite',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '45%',
            right: '8%',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.28,
            filter: 'blur(65px)',
            animation: 'float 9s ease-in-out infinite reverse',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '15%',
            left: '15%',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.22,
            filter: 'blur(70px)',
            animation: 'float 12s ease-in-out infinite',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '20%',
            right: '20%',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.26,
            filter: 'blur(68px)',
            animation: 'float 13s ease-in-out infinite reverse',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '25%',
            left: '45%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.18,
            filter: 'blur(60px)',
            animation: 'float 10s ease-in-out infinite',
          }}
        />

        <div
          className="absolute pointer-events-none"
          style={{
            top: '70%',
            left: '35%',
            width: '230px',
            height: '230px',
            borderRadius: '50%',
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.24,
            filter: 'blur(72px)',
            animation: 'float 14s ease-in-out infinite reverse',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 py-12 relative">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-dark mb-12">
              Configurações
            </h1>
          </div>

          {/* Profile Square */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50 mb-8 relative z-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Perfil</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="text-lg font-semibold text-gray-900">{userSettings?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{userSettings?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data de Criação da Conta</p>
                <p className="text-lg font-semibold text-gray-900">{userSettings ? new Date(userSettings.created_at).toLocaleDateString('pt-BR') : ''}</p>
              </div>
            </div>
          </div>

          {/* Tabbed Square */}
          <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 relative z-10">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button 
                  onClick={() => setActiveTab('negocio')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === 'negocio' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Building className="h-4 w-4" />
                  <span>Negócio</span>
                </button>
                <button 
                  onClick={() => setActiveTab('influenciadores')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === 'influenciadores' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Influenciadores</span>
                </button>
                <button 
                  onClick={() => setActiveTab('nicho')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === 'nicho' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Target className="h-4 w-4" />
                  <span>Nicho</span>
                </button>
              </nav>
            </div>
            <div className="p-8">
              {activeTab === 'negocio' && userSettings && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-900">Negócio ({userSettings.business.name})</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600">Nome da Empresa</p>
                        <p className="text-lg font-semibold text-gray-900">{userSettings.business.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Website</p>
                        <p className="text-lg font-semibold text-gray-900">
                          <a href={userSettings.business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {userSettings.business.website}
                          </a>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">LinkedIn</p>
                        <p className="text-lg font-semibold text-gray-900">
                          <a href={`https://www.linkedin.com/company/${userSettings.business.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {userSettings.business.linkedin}
                          </a>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Instagram</p>
                        <p className="text-lg font-semibold text-gray-900">
                          <a href={`https://www.instagram.com/${userSettings.business.instagram}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {userSettings.business.instagram}
                          </a>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Objetivo da Empresa</p>
                        <p className="text-lg font-semibold text-gray-900">{userSettings.business.objective}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tom de Voz</p>
                        <p className="text-lg font-semibold text-gray-900">{userSettings.business.voice_tone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Social</p>
                        <p className="text-lg font-semibold text-gray-900">{userSettings.business.social_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Público-Alvo</p>
                        <p className="text-lg font-semibold text-gray-900">{userSettings.business.target_audience}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Posicionamento de Marca</p>
                        <p className="text-lg font-semibold text-gray-900">{userSettings.business.brand_positioning}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'influenciadores' && userSettings && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-900">Influenciadores</h2>
                    <div className="space-y-4">
                      {userSettings.influencers.map((influencer, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Influenciador</p>
                            <p className="text-lg font-semibold text-gray-900">{influencer.display_name}</p>
                            <p className="text-sm text-gray-600">Instagram</p>
                            <p className="text-lg font-semibold text-gray-900">
                              <a href={`https://www.instagram.com/${influencer.instagram_username}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                @{influencer.instagram_username}
                              </a>
                            </p>
                            <p className="text-sm text-gray-600">Data de Adição</p>
                            <p className="text-lg font-semibold text-gray-900">{new Date(influencer.added_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'nicho' && userSettings && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-gray-900">Nicho</h2>
                    <div className="space-y-4">
                      {userSettings.niches.map((niche, index) => (
                        <div key={index}>
                          <p className="text-sm text-gray-600">Nicho</p>
                          <p className="text-lg font-semibold text-gray-900">{niche.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
