import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import Navigation from '../components/Navigation';
import PageTitle from '../components/PageTitle';
import { MouseFollowLight } from '../components/MouseFollowLight';
import { getGeneratedContentStats } from '../services/generatedContent';
import type { GeneratedContentStats } from '../types/generatedContent';

const StatsPage: React.FC = () => {
  const [stats, setStats] = useState<GeneratedContentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Carregando estatísticas...');
      const response = await getGeneratedContentStats();
      console.log('✅ Stats recebidas:', response);
      setStats(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stats';
      setError(errorMessage);
      console.error('❌ Erro ao carregar stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-light">
        <Navigation currentPage="settings" />
        <MouseFollowLight />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
            <p className="text-gray">Carregando estatísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex bg-light">
        <Navigation currentPage="settings" />
        <MouseFollowLight />
        <div className="flex-1 ml-16 flex items-center justify-center p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadStats}
              className="w-full text-white bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex bg-light">
        <Navigation currentPage="settings" />
        <MouseFollowLight />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <p className="text-gray">Nenhuma estatística disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-light">
      <Navigation currentPage="settings" />
      <MouseFollowLight />
      <div className="flex-1 ml-16 overflow-y-auto">
        <div>
          <PageTitle title="Estatísticas" />
        </div>
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-blue" />
              <h1 className="text-3xl font-bold text-dark">Estatísticas</h1>
            </div>
            <p className="text-gray">Visão geral dos seus conteúdos gerados</p>
          </div>

          {/* Total Overview */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-light to-light border border-gray-light rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-light p-4 rounded-full">
                  <TrendingUp className="w-8 h-8 text-blue" />
                </div>
                <div>
                  <p className="text-gray text-sm">Total de Conteúdos Gerados</p>
                  <p className="text-dark text-4xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-dark mb-4">Por Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Completed */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray text-sm font-semibold">Completos</span>
                </div>
                <p className="text-dark text-3xl font-bold">{stats.by_status.completed}</p>
                <p className="text-green-600 text-sm mt-2">
                  {stats.total > 0 
                    ? `${Math.round((stats.by_status.completed / stats.total) * 100)}%`
                    : '0%'} do total
                </p>
              </div>

              {/* Pending */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-6 h-6 text-yellow-600" />
                  <span className="text-gray text-sm font-semibold">Pendentes</span>
                </div>
                <p className="text-dark text-3xl font-bold">{stats.by_status.pending}</p>
                <p className="text-yellow-600 text-sm mt-2">
                  {stats.total > 0
                    ? `${Math.round((stats.by_status.pending / stats.total) * 100)}%`
                    : '0%'} do total
                </p>
              </div>

              {/* Failed */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-gray text-sm font-semibold">Falhas</span>
                </div>
                <p className="text-dark text-3xl font-bold">{stats.by_status.failed}</p>
                <p className="text-red-600 text-sm mt-2">
                  {stats.total > 0
                    ? `${Math.round((stats.by_status.failed / stats.total) * 100)}%`
                    : '0%'} do total
                </p>
              </div>
            </div>
          </div>

          {/* Media Type */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-dark mb-4">Por Tipo de Mídia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.by_media_type).map(([type, count]) => (
                <div
                  key={type}
                  className="bg-white border border-gray-light rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-dark capitalize">{type}</span>
                    <span className="text-dark text-2xl font-bold">{count}</span>
                  </div>
                  <div className="mt-2 h-2 bg-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue to-blue-dark"
                      style={{
                        width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-dark mb-4">Por Provider (IA)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.by_provider).map(([provider, count]) => (
                <div
                  key={provider}
                  className="bg-white border border-gray-light rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 text-blue" />
                      <span className="text-gray-dark capitalize">{provider}</span>
                    </div>
                    <span className="text-dark text-2xl font-bold">{count}</span>
                  </div>
                  <div className="mt-2 h-2 bg-light rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-light to-blue"
                      style={{
                        width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-center">
            <button
              onClick={loadStats}
              className="bg-blue hover:bg-blue-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              Atualizar Estatísticas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
