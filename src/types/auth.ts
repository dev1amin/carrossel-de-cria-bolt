export interface LoginResponse {
  status: string;
  message: string;
  jwt_token: string;
  user: User;
  needs_business_setup?: boolean;
  needs_tone_setup?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  instagram?: string;
  logo_url?: string;
  plan?: string;
  needs_business_setup?: boolean;
  needs_tone_setup?: boolean;
  selected_business_id?: string;
  business?: {
    id: string;
    name: string;
  };
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: User;
  error?: string;
}