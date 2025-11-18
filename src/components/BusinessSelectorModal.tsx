import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Building2, Loader2 } from 'lucide-react';
import { getBusinessList } from '../services/business';
import { selectBusiness } from '../services/settings';
import type { Business } from '../types/settings';

interface BusinessSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessSelected: () => void;
}

export const BusinessSelectorModal: React.FC<BusinessSelectorModalProps> = ({
  isOpen,
  onClose,
  onBusinessSelected
}) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBusinesses();
    }
  }, [isOpen]);

  const loadBusinesses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getBusinessList();
      setBusinesses(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar businesses:', error);
      setError('Erro ao carregar lista de negócios. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBusiness = async (businessId: string) => {
    setIsSelecting(true);
    setError(null);

    try {
      await selectBusiness(businessId);
      console.log('✅ Business selecionado com sucesso');
      onBusinessSelected();
    } catch (error) {
      console.error('Erro ao selecionar business:', error);
      setError('Erro ao selecionar negócio. Tente novamente.');
    } finally {
      setIsSelecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Selecionar Negócio</h2>
              <p className="text-sm text-gray-600">Escolha qual negócio usar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando negócios...</span>
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Você ainda não tem nenhum negócio cadastrado.</p>
              <p className="text-sm text-gray-500">Crie um negócio primeiro para continuar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Selecione o negócio que deseja usar para configurar o tom de voz:
              </p>

              {businesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => handleSelectBusiness(business.id)}
                  disabled={isSelecting}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{business.name}</h3>
                      {business.website && (
                        <p className="text-sm text-gray-600">{business.website}</p>
                      )}
                      {business.instagram_username && (
                        <p className="text-sm text-gray-500">@{business.instagram_username}</p>
                      )}
                    </div>
                    {isSelecting ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};