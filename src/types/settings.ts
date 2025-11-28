export interface Niche {
  id: string;
  name: string;
  slug?: string;
  segment_id?: string;
}

export interface NicheSuggestion {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  business_id: string;
}

export interface Influencer {
  influencer_id: string;
  handle: string;
  display_name: string;
  lang?: string;
  country?: string;
  created_at: string;
  // Campos legados para compatibilidade
  instagram_username?: string;
  added_at?: string;
}

export interface Business {
  id: string;
  name?: string;
  logo_url?: string;
  website?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  objective?: string | null;
  voice_tone?: string | null;
  social_type?: 'Marca pessoal' | 'Empresa' | 'Agência' | 'Influenciador' | 'Outro' | null;
  target_audience?: string | null;
  brand_positioning?: string | null;
  forbidden_words?: string[] | null;
  forbidden_topics?: string[] | null;
  preferred_words?: string[] | null;
  // Campos legados
  instagram_username?: string;
  main_objective?: string;
  mission_short?: string;
  tone_formality?: 'formal' | 'neutral' | 'informal';
  tone_emotion?: 'rational' | 'balanced' | 'emotional';
  tone_rhythm?: 'direct' | 'fluid' | 'narrative';
  keywords_must?: string[];
  keywords_avoid?: string[];
  language_code?: 'pt' | 'en' | 'es' | 'fr';
  writing_notes?: string;
  updated_at?: string;
}

export interface UserSettings {
  id: string;
  email: string;
  name: string;
  created_at: string;
  selected_business_id: string;
  business: Business;
  niches: Niche[];
  niche_suggestions?: NicheSuggestion[];
  influencers: Influencer[];
  // Campos que podem vir diretamente no nível do user para compatibilidade
  forbidden_topics?: string[];
  forbidden_words?: string[];
  preferred_words?: string[];
  niche?: string | null;
}

// ========== Request/Response Types ==========

// Business Update
export interface UpdateBusinessRequest {
  name?: string;
  website?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  social_type?: Business['social_type'];
  objective?: string | null;
  brand_positioning?: string | null;
  voice_tone?: string | null;
  target_audience?: string | null;
  forbidden_words?: string[] | string | null;
  forbidden_topics?: string[] | string | null;
  preferred_words?: string[] | string | null;
}

export interface UpdateBusinessResponse {
  success: boolean;
  message: string;
  data?: Business;
}

// Influencer Add
export interface AddInfluencerRequest {
  handle: string;
  display_name?: string;
  lang?: string;
  country?: string;
}

export interface AddInfluencerResponse {
  message: string;
  data: {
    business_id: string;
    influencer_id: string;
    created_at: string;
    handle: string;
    wasCreated: boolean;
  };
}

// Niches Add
export interface AddNichesRequest {
  niche_id?: string[];
  custom_niche?: string[];
}

export interface AddNichesResponse {
  message: string;
  data: {
    existing: Array<{
      type: 'existing';
      niche_id: string;
      niche_name: string;
      business_id: string;
    }>;
    suggestions: Array<{
      type: 'suggestion';
      niche_name: string;
      business_id: string;
      status: string;
    }>;
    not_found_niches: string[];
  };
}

// Niches Remove
export interface RemoveNichesRequest {
  niche_id?: string[];
  custom_niche_id?: string[];
}