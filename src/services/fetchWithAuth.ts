/**
 * Fetch wrapper com refresh automático de token
 */

import { getAuthHeaders, refreshToken } from './auth';

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Primeira tentativa
  const headers = { ...getAuthHeaders(), ...options.headers };
  let response = await fetch(url, { ...options, headers });

  // Se der 401 ou Invalid session, tenta renovar token
  if (response.status === 401) {
    console.log('🔄 Token inválido (401), tentando renovar...');
    
    try {
      await refreshToken();
      console.log('✅ Token renovado com sucesso');
      
      // Segunda tentativa com novo token
      const newHeaders = { ...getAuthHeaders(), ...options.headers };
      response = await fetch(url, { ...options, headers: newHeaders });
      
      if (response.status === 401) {
        console.error('❌ Token ainda inválido após refresh, redirecionando para login');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    } catch (err) {
      console.error('❌ Erro ao renovar token:', err);
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}
