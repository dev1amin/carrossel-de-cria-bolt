/**
 * Business Images API Service
 * Gerenciamento de imagens do business (upload, listagem, deleção)
 */

import { API_ENDPOINTS } from '../config/api';
import { fetchWithAuth } from './fetchWithAuth';
import type {
  BusinessImageUploadResponse,
  BusinessImagesListResponse,
  BusinessImagesDeleteResponse,
  BusinessImageUploadRequest,
} from '../types/business';

/**
 * Faz upload de uma imagem para o business selecionado
 * @param data - Dados do upload (file, label?, alt_text?)
 * @returns Dados da imagem criada (id, url, created_at)
 */
export const uploadBusinessImage = async (
  data: BusinessImageUploadRequest
): Promise<BusinessImageUploadResponse> => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  const formData = new FormData();
  formData.append('file', data.file);
  
  if (data.label) {
    formData.append('label', data.label);
  }
  
  if (data.alt_text) {
    formData.append('alt_text', data.alt_text);
  }

  // Usar fetch diretamente em vez de fetchWithAuth para evitar Content-Type: application/json
  // O browser vai definir Content-Type: multipart/form-data automaticamente
  const response = await fetch(API_ENDPOINTS.businessImages, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // NÃO definir Content-Type - deixar o browser definir automaticamente para multipart/form-data
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 413) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
    }
    
    if (response.status === 400) {
      throw new Error(errorData.error || 'Dados inválidos. Verifique o arquivo e tente novamente.');
    }
    
    if (response.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    throw new Error(errorData.error || 'Erro ao fazer upload da imagem');
  }

  const result: BusinessImageUploadResponse = await response.json();
  return result;
};

/**
 * Lista todas as imagens do business selecionado
 * @param limit - Quantidade máxima de imagens (1-100, default: 50)
 * @returns Lista de imagens com total
 */
export const listBusinessImages = async (
  limit: number = 50
): Promise<BusinessImagesListResponse> => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  // Garante que limit está entre 1 e 100
  const validLimit = Math.max(1, Math.min(100, limit));

  const response = await fetchWithAuth(
    `${API_ENDPOINTS.businessImages}?limit=${validLimit}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 400) {
      throw new Error(errorData.error || 'Nenhum business selecionado. Selecione um business primeiro.');
    }
    
    if (response.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    throw new Error(errorData.error || 'Erro ao carregar imagens');
  }

  const result: BusinessImagesListResponse = await response.json();
  return result;
};

/**
 * Deleta múltiplas imagens em lote
 * @param imageIds - Array de IDs das imagens a deletar
 * @returns Resultado da deleção (deleted_count, failed)
 */
export const deleteBusinessImages = async (
  imageIds: string[]
): Promise<BusinessImagesDeleteResponse> => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  if (!imageIds || imageIds.length === 0) {
    throw new Error('Selecione pelo menos uma imagem para deletar');
  }

  const response = await fetchWithAuth(API_ENDPOINTS.businessImages, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image_ids: imageIds }),
  });

  if (!response.ok && response.status !== 207) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 400) {
      throw new Error(errorData.error || 'Dados inválidos. Verifique os IDs das imagens.');
    }
    
    if (response.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    throw new Error(errorData.error || 'Erro ao deletar imagens');
  }

  const result: BusinessImagesDeleteResponse = await response.json();
  return result;
};

/**
 * Deleta uma única imagem
 * @param imageId - ID da imagem a deletar
 * @returns true se deletou com sucesso
 */
export const deleteBusinessImage = async (imageId: string): Promise<boolean> => {
  const result = await deleteBusinessImages([imageId]);
  return result.deleted_count > 0;
};

/**
 * Formata o tamanho do arquivo em bytes para string legível
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Valida se o arquivo é uma imagem válida para upload
 * @param file - Arquivo a validar
 * @returns Objeto com isValid e mensagem de erro se inválido
 */
export const validateImageFile = (
  file: File
): { isValid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Tipo de arquivo inválido. Use JPEG, PNG, GIF ou WebP.',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Arquivo muito grande (${formatFileSize(file.size)}). Máximo: 10MB.`,
    };
  }

  return { isValid: true };
};
