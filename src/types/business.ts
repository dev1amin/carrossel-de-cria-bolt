export interface Business {
  id: string;
  user_id: string;
  name?: string;
  website?: string;
  instagram_username?: string;
  main_objective?: string;
  mission_short?: string;
  tone_formality: 'formal' | 'neutral' | 'informal';
  tone_emotion: 'rational' | 'balanced' | 'emotional';
  tone_rhythm: 'direct' | 'fluid' | 'narrative';
  keywords_must: string[];
  keywords_avoid: string[];
  language_code: 'pt' | 'en' | 'es' | 'fr';
  writing_notes?: string;
  updated_at: string;
}

export interface CreateBusinessRequest {
  name?: string;
  website?: string;
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
}

export interface BusinessResponse {
  success: boolean;
  message: string;
  data: Business;
}

export interface BusinessListResponse {
  success: boolean;
  data: Business[];
}

export interface BusinessValidationError {
  field: string;
  message: string;
}

export interface BusinessErrorResponse {
  success: false;
  message: string;
  errors?: BusinessValidationError[];
}

export interface FormQuestion {
  key: keyof CreateBusinessRequest;
  question: string;
  type: 'text' | 'select' | 'array_text';
  options: Array<{ label: string; value: string }>;
}

// ==================== Business Images ====================

export interface BusinessImage {
  id: string;
  url: string;
  label?: string | null;
  alt_text?: string | null;
  mime_type: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  created_at: string;
}

export interface BusinessImageUploadResponse {
  id: string;
  url: string;
  created_at: string;
}

export interface BusinessImagesListResponse {
  total: number;
  images: BusinessImage[];
}

export interface BusinessImagesDeleteResponse {
  deleted_count: number;
  failed: Array<{
    id: string;
    reason: string;
  }>;
}

export interface BusinessImageUploadRequest {
  file: File;
  label?: string;
  alt_text?: string;
}
