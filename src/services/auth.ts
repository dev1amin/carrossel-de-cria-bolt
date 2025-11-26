import { API_ENDPOINTS } from '../config/api';
import { LoginCredentials, LoginResponse, ValidateTokenResponse, User } from '../types/auth';

// Logout deve vir primeiro para ser usado em outras funções
export const logout = (): void => {
  // Remove todos os dados do localStorage
  localStorage.clear();
  console.log('🚪 Logout: Todos os dados do localStorage foram removidos');
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  console.log('Making login request to:', API_ENDPOINTS.login);
  
  const response = await fetch(API_ENDPOINTS.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();
  console.log('Login API response:', data);

  if (!response.ok || data.error) {
    console.error('Login API error:', data.error);
    throw new Error(data.error || 'Invalid credentials');
  }

  // Nova API retorna: { message, user, access_token, refresh_token, expires_at }
  // needs_tone_setup vem dentro de user
  if (data.user && data.access_token) {
    console.log('Storing user data in localStorage');
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('token_expires_at', data.expires_at.toString());
    
    // Store needs_tone_setup flag from user object
    if (data.user.needs_tone_setup !== undefined) {
      console.log('📝 Salvando needs_tone_setup:', data.user.needs_tone_setup);
      localStorage.setItem('needs_tone_setup', String(data.user.needs_tone_setup));
    }
    
    // Store post_count from user object
    if (data.user.post_count !== undefined) {
      console.log('📝 Salvando post_count:', data.user.post_count);
      localStorage.setItem('post_count', String(data.user.post_count));
    }
  }

  return {
    status: 'success',
    message: data.message || 'Login successful',
    user: data.user,
    jwt_token: data.access_token, // Manter compatibilidade com código existente
    needs_tone_setup: data.user.needs_tone_setup,
  };
};

export const refreshToken = async (): Promise<string> => {
  const refresh_token = localStorage.getItem('refresh_token');
  
  if (!refresh_token) {
    throw new Error('No refresh token found');
  }

  const response = await fetch(API_ENDPOINTS.refresh, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    // Se refresh falhar, limpa tudo
    logout();
    throw new Error(data.error || 'Invalid refresh token');
  }

  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('token_expires_at', data.expires_at.toString());

  return data.access_token;
};

export const validateToken = async (): Promise<ValidateTokenResponse> => {
  const token = localStorage.getItem('access_token');
  const expiresAt = localStorage.getItem('token_expires_at');
  
  console.log('Validating token:', token ? 'Token exists' : 'No token');
  
  if (!token) {
    throw new Error('No token found');
  }

  // Verificar se o token expirou
  if (expiresAt && Date.now() / 1000 > parseInt(expiresAt)) {
    console.log('Token expired, attempting refresh...');
    try {
      await refreshToken();
      return { valid: true };
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Token expired and refresh failed');
    }
  }

  return { valid: true };
};

export const verifyToken = async (jwtToken: string): Promise<ValidateTokenResponse> => {
  console.log('Verifying JWT token');
  
  const response = await fetch(API_ENDPOINTS.verify, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
    },
  });

  const data = await response.json();
  console.log('Verify API response:', data);

  if (!response.ok || data.error) {
    console.error('Verify API error:', data.error);
    throw new Error(data.error || 'Invalid token');
  }

  // Nova resposta do verify vem no mesmo formato do login:
  // { message, user, access_token, refresh_token, expires_at }
  if (data.user && data.access_token) {
    console.log('✅ Verify successful, storing complete user data');
    
    // Store all tokens and user data
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('access_token', data.access_token);
    
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    
    if (data.expires_at) {
      localStorage.setItem('token_expires_at', data.expires_at.toString());
    }

    // Store needs_tone_setup flag from user object
    if (data.user.needs_tone_setup !== undefined) {
      console.log('📝 Salvando needs_tone_setup:', data.user.needs_tone_setup);
      localStorage.setItem('needs_tone_setup', String(data.user.needs_tone_setup));
    }
    
    // Store post_count from user object
    if (data.user.post_count !== undefined) {
      console.log('📝 Salvando post_count:', data.user.post_count);
      localStorage.setItem('post_count', String(data.user.post_count));
    }

    console.log('💾 Complete user data stored:', {
      userName: data.user.name,
      userId: data.user.id,
      selectedBusinessId: data.user.selected_business_id,
      needsToneSetup: data.user.needs_tone_setup,
      needsBusinessSetup: data.user.needs_business_setup
    });

    return { valid: true, user: data.user };
  }

  throw new Error('Token verification failed');
};

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const isAuthenticated = (): boolean => {
  const isAuth = Boolean(localStorage.getItem('access_token'));
  console.log('Checking authentication:', isAuth);
  return isAuth;
};