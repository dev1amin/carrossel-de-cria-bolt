import { API_ENDPOINTS } from '../config/api';
import { authenticatedFetch } from '../utils/apiClient';
import { 
  UserSettings, 
  Business, 
  Influencer,
  Niche,
  UpdateBusinessRequest,
  UpdateBusinessResponse,
  AddInfluencerRequest,
  AddInfluencerResponse,
  AddNichesRequest,
  AddNichesResponse,
  RemoveNichesRequest
} from '../types/settings';
import { CacheService, CACHE_KEYS } from './cache';
import { getAuthHeaders } from './auth';

interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  created_at: string;
  selected_business_id: string;
  business: Business;
  niche: string | null;
  niches: Niche[];
  influencers: Influencer[];
}

// ========== USER SETTINGS ==========

export const getUserSettings = async (): Promise<UserSettings> => {
  // Tentar obter do cache primeiro
  const cachedSettings = CacheService.getItem<UserSettings>(CACHE_KEYS.SETTINGS);
  if (cachedSettings) {
    return cachedSettings;
  }

  const response = await authenticatedFetch(API_ENDPOINTS.profile, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user settings');
  }

  const data: ProfileResponse = await response.json();
  
  // A resposta já está no formato correto
  const settings: UserSettings = {
    id: data.id,
    email: data.email,
    name: data.name,
    created_at: data.created_at,
    selected_business_id: data.selected_business_id,
    business: data.business,
    niche: data.niche,
    niches: data.niches || [],
    influencers: data.influencers || [],
  };
  
  // Salvar no cache
  CacheService.setItem(CACHE_KEYS.SETTINGS, settings);
  
  return settings;
};

export const updateUserSettings = async (updates: Partial<UserSettings>): Promise<{ saved: boolean }> => {
  const body: Record<string, unknown> = {};

  // Atualizar nome se fornecido
  if (updates.name) {
    body.name = updates.name;
  }

  const response = await authenticatedFetch(API_ENDPOINTS.profile, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update settings');
  }

  // Limpar cache para forçar reload
  CacheService.clearItem(CACHE_KEYS.SETTINGS);

  return { saved: true };
};

/**
 * Seleciona um business para o usuário
 */
export const selectBusiness = async (businessId: string): Promise<{ saved: boolean }> => {
  const response = await authenticatedFetch(API_ENDPOINTS.profile, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ selected_business_id: businessId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to select business');
  }

  // Limpar cache para forçar reload
  CacheService.clearItem(CACHE_KEYS.SETTINGS);

  // Atualizar localStorage com o novo selected_business_id
  const userData = localStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);
    user.selected_business_id = businessId;
    localStorage.setItem('user', JSON.stringify(user));
  }

  return { saved: true };
};

// ========== BUSINESS ==========

/**
 * Atualiza os dados do business selecionado
 * O businessId NÃO é enviado - vem do token/session
 * 
 * @param updates - Campos a atualizar (todos opcionais)
 * @param logoFile - Arquivo de logo (opcional) - se presente, usa FormData
 */
export const updateBusiness = async (
  updates: UpdateBusinessRequest,
  logoFile?: File
): Promise<UpdateBusinessResponse> => {
  let requestBody: FormData | string;
  let headers: HeadersInit;

  if (logoFile) {
    // Com logo - usar multipart/form-data
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    // Adicionar outros campos como texto no form-data
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Arrays podem ser enviados como string separada por vírgula
          formData.append(key, value.join(','));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    requestBody = formData;
    // Não definir Content-Type - o browser define automaticamente com boundary
    headers = {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    };
  } else {
    // Sem logo - usar JSON
    requestBody = JSON.stringify(updates);
    headers = getAuthHeaders();
  }

  const response = await authenticatedFetch(API_ENDPOINTS.business, {
    method: 'PUT',
    headers,
    body: requestBody,
  });

  const data = await response.json();

  if (!response.ok) {
    // Tratar diferentes tipos de erro
    if (data.errors) {
      // Erro de validação
      const errorMessages = data.errors.map((e: { msg: string }) => e.msg).join(', ');
      throw new Error(errorMessages);
    }
    throw new Error(data.message || data.error || 'Failed to update business');
  }

  // Limpar cache para forçar reload
  CacheService.clearItem(CACHE_KEYS.SETTINGS);

  return data;
};

/**
 * Helper para atualizar campos individuais do business
 */
export const updateBusinessField = async (
  field: keyof Business, 
  value: string | string[] | null
): Promise<{ saved: boolean }> => {
  await updateBusiness({ [field]: value } as UpdateBusinessRequest);
  return { saved: true };
};

// ========== INFLUENCERS ==========

/**
 * Adiciona um influenciador aos favoritos do business selecionado
 * 
 * @param data - Dados do influenciador (handle obrigatório)
 */
export const addInfluencer = async (data: AddInfluencerRequest): Promise<AddInfluencerResponse> => {
  const response = await authenticatedFetch(API_ENDPOINTS.profileInfluencers, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    // Tratar erro 409 (já favoritado) como caso específico
    if (response.status === 409) {
      throw new Error('ALREADY_FAVORITED');
    }
    
    // Tratar erros de validação
    if (responseData.errors) {
      const errorMessages = responseData.errors.map((e: { msg: string }) => e.msg).join(', ');
      throw new Error(errorMessages);
    }
    
    throw new Error(responseData.error || responseData.message || 'Failed to add influencer');
  }

  // Limpar cache para forçar reload
  CacheService.clearItem(CACHE_KEYS.SETTINGS);

  return responseData;
};

/**
 * Remove um influenciador dos favoritos do business selecionado
 * 
 * @param influencerId - UUID do influenciador
 */
export const removeInfluencer = async (influencerId: string): Promise<{ message: string }> => {
  const response = await authenticatedFetch(API_ENDPOINTS.profileInfluencer(influencerId), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    // Tratar 404 como "já removido" - não é erro fatal
    if (response.status === 404) {
      return { message: 'Influenciador já removido' };
    }
    
    // Tratar erros de validação
    if (data.errors) {
      const errorMessages = data.errors.map((e: { msg: string }) => e.msg).join(', ');
      throw new Error(errorMessages);
    }
    
    throw new Error(data.error || data.message || 'Failed to remove influencer');
  }

  // Limpar cache para forçar reload
  CacheService.clearItem(CACHE_KEYS.SETTINGS);

  return data;
};

// ========== NICHES ==========

/**
 * Adiciona nichos existentes e/ou cria sugestões de nichos customizados
 * Operação em lote - pode enviar múltiplos nichos de uma vez
 * 
 * @param data - niche_id[] para nichos existentes, custom_niche[] para sugestões
 */
export const addNiches = async (data: AddNichesRequest): Promise<AddNichesResponse> => {
  // Validar que pelo menos um array foi enviado
  const hasNicheIds = data.niche_id && data.niche_id.length > 0;
  const hasCustomNiches = data.custom_niche && data.custom_niche.length > 0;
  
  if (!hasNicheIds && !hasCustomNiches) {
    throw new Error('É obrigatório enviar niche_id ou custom_niche com pelo menos 1 item');
  }

  const response = await authenticatedFetch(API_ENDPOINTS.profileNiches, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    // Tratar 404 como nenhum nicho válido processado
    if (response.status === 404) {
      return {
        message: 'Nenhum nicho válido encontrado',
        data: responseData.data || { existing: [], suggestions: [], not_found_niches: [] }
      };
    }
    
    // Tratar erros de validação
    if (responseData.errors) {
      const errorMessages = responseData.errors.map((e: { msg: string }) => e.msg).join(', ');
      throw new Error(errorMessages);
    }
    
    throw new Error(responseData.error || responseData.message || 'Failed to add niches');
  }

  // Limpar cache para forçar reload
  CacheService.clearItem(CACHE_KEYS.SETTINGS);

  return responseData;
};

/**
 * Remove nichos associados e/ou sugestões de nicho em lote
 * Operação idempotente - IDs inexistentes são ignorados silenciosamente
 * 
 * @param data - niche_id[] para nichos existentes, custom_niche_id[] para sugestões
 */
export const removeNiches = async (data: RemoveNichesRequest): Promise<{ message: string }> => {
  // Validar que pelo menos um array foi enviado
  const hasNicheIds = data.niche_id && data.niche_id.length > 0;
  const hasCustomNicheIds = data.custom_niche_id && data.custom_niche_id.length > 0;
  
  if (!hasNicheIds && !hasCustomNicheIds) {
    throw new Error('É obrigatório enviar niche_id ou custom_niche_id com pelo menos 1 item');
  }

  const response = await authenticatedFetch(API_ENDPOINTS.profileNiches, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    // Tratar erros de validação
    if (responseData.errors) {
      const errorMessages = responseData.errors.map((e: { msg: string }) => e.msg).join(', ');
      throw new Error(errorMessages);
    }
    
    throw new Error(responseData.error || responseData.message || 'Failed to remove niches');
  }

  // Limpar cache para forçar reload
  CacheService.clearItem(CACHE_KEYS.SETTINGS);

  return responseData;
};

// ========== LEGACY COMPATIBILITY ==========

/**
 * @deprecated Use updateBusiness ou updateBusinessField diretamente
 */
export const updateUserSetting = async (field: string, value: string): Promise<{ saved: boolean }> => {
  // Mapear campos antigos para nova estrutura
  const fieldMapping: Record<string, keyof Business> = {
    'business_name': 'name',
    'business_website': 'website',
    'business_instagram_username': 'instagram',
    'business_instagram': 'instagram',
  };

  const businessField = fieldMapping[field];
  if (businessField) {
    return updateBusinessField(businessField, value);
  }

  // Se for um campo direto do user (name)
  if (field === 'name') {
    return updateUserSettings({ name: value });
  }

  throw new Error(`Unknown field: ${field}`);
};