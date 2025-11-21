import { API_ENDPOINTS } from '../config/api';
import { LoginCredentials, LoginResponse, ValidateTokenResponse } from '../types/auth';

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
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
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

export const loginWithJWT = async (jwtToken: string): Promise<LoginResponse> => {
  console.log('Making JWT login request');
  
  const response = await fetch(`${API_ENDPOINTS.base}/auth/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('JWT Login API response:', data);

  if (!response.ok || data.error || !data.success) {
    console.error('JWT Login API error:', data.error);
    throw new Error(data.error || 'Invalid JWT token');
  }

  let userData;
  let needsToneSetup = false;

  // Se a resposta tem user_id, precisamos buscar os dados completos do usuário
  if (data.user_id && !data.user) {
    console.log('Fetching complete user data from profile endpoint...');
    
    try {
      const profileResponse = await fetch(API_ENDPOINTS.profile, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      });

      const profileData = await profileResponse.json();
      console.log('Profile API response:', profileData);

      if (profileResponse.ok && profileData.user) {
        userData = profileData.user;
        needsToneSetup = userData.needs_tone_setup || false;
      } else {
        // Se não conseguir buscar o perfil, criar um user básico
        console.warn('Could not fetch user profile, creating basic user object');
        userData = {
          id: data.user_id,
          needs_tone_setup: false
        };
        needsToneSetup = false;
      }
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError);
      // Criar user básico se falhar
      userData = {
        id: data.user_id,
        needs_tone_setup: false
      };
      needsToneSetup = false;
    }
  } else if (data.user) {
    // Resposta completa como esperado
    userData = data.user;
    needsToneSetup = data.user.needs_tone_setup || false;
  } else {
    throw new Error('Invalid API response: no user data found');
  }

  // Armazenar dados no localStorage
  console.log('Storing user data from JWT login');
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('access_token', jwtToken); // Usar o JWT verificado como access_token
  // Note: refresh_token não está disponível na resposta verify, deixar vazio por enquanto
  localStorage.setItem('refresh_token', ''); // TODO: implementar refresh token se necessário
  localStorage.setItem('token_expires_at', ''); // TODO: implementar expiração se necessário
  
  if (needsToneSetup !== undefined) {
    localStorage.setItem('needs_tone_setup', String(needsToneSetup));
  }

  return {
    status: 'success',
    message: data.message || 'Login successful',
    user: userData,
    jwt_token: jwtToken,
    needs_tone_setup: needsToneSetup,
  };
};

export const logout = (): void => {
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expires_at');
};