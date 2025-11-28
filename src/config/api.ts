export const API_BASE_URL = 'https://carousel-api-sepia.vercel.app/api';

export const API_ENDPOINTS = {
  base: API_BASE_URL,
  // Auth
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  refresh: `${API_BASE_URL}/auth/refresh`,
  verify: `${API_BASE_URL}/auth/verify`,
  // Users
  profile: `${API_BASE_URL}/user/profile`,
  profileInfluencers: `${API_BASE_URL}/user/profile/influencers`,
  profileInfluencer: (influencerId: string) => `${API_BASE_URL}/user/profile/influencers/${influencerId}`,
  profileNiches: `${API_BASE_URL}/user/profile/niches`,
  // Feed
  feed: `${API_BASE_URL}/feed`,
  feedSave: `${API_BASE_URL}/feed/save`,
  feedSaved: `${API_BASE_URL}/feed/saved`,
  // Generated Content
  generatedContent: `${API_BASE_URL}/generated-content`,
  generatedContentStats: `${API_BASE_URL}/generated-content/stats`,
  // Business
  business: `${API_BASE_URL}/business`,
  businessForms: (key: string) => `${API_BASE_URL}/business/forms/${key}`,
  businessToneOfVoice: `${API_BASE_URL}/business/tone-of-voice`,
  // Conversations
  conversations: `${API_BASE_URL}/conversations`,
  conversation: (id: string) => `${API_BASE_URL}/conversations/${id}`,
  conversationTokens: (id: string) => `${API_BASE_URL}/conversations/${id}/tokens`,
  conversationMessages: (id: string) => `${API_BASE_URL}/conversations/${id}/messages`,
  conversationMessage: (conversationId: string, messageId: string) => 
    `${API_BASE_URL}/conversations/${conversationId}/messages/${messageId}`,
} as const;