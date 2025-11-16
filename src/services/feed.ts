import { API_ENDPOINTS } from '../config/api';
import { authenticatedFetch } from '../utils/apiClient';
import { Post } from '../types';
import { CacheService, CACHE_KEYS } from './cache';
import { getAuthHeaders } from './auth';

interface FeedResponse {
  message: string;
  feed_id: string | null;
  feed: FeedItem[];
}

interface FeedItem {
  rank: number;
  score: number;
  is_saved: boolean;
  influencer_id: string;
  recommend: boolean;
  influencer_content: {
    id: number;
    platform: string;
    code: string;
    text: string;
    content_url: string;
    media_type: number;
    product_type: string;
    published_at: string;
    like_count: number;
    comment_count: number;
    play_count: number;
    reshare_count: number;
    like_score: number;
    comment_score: number;
    play_score: number;
    reshare_score: number;
    recency_score: number;
    overall_score: number;
  };
}

// Converter FeedItem da nova API para Post do formato antigo
const convertFeedItemToPost = (item: FeedItem): Post => {
  const content = item.influencer_content;
  return {
    id: content.id, // ID do post para enviar ao generateCarousel
    code: content.code,
    text: content.text,
    taken_at: new Date(content.published_at).getTime() / 1000, // Converter para timestamp Unix
    username: item.influencer_id, // Usar ID do influenciador como username temporariamente
    image_url: content.content_url,
    video_url: content.media_type === 8 ? content.content_url : null,
    media_type: content.media_type,
    like_count: content.like_count,
    comment_count: content.comment_count,
    play_count: content.play_count,
    reshare_count: content.reshare_count,
    likeScore: content.like_score,
    commentScore: content.comment_score,
    playScore: content.play_score,
    reshareScore: content.reshare_score,
    recencyScore: content.recency_score,
    overallScore: content.overall_score,
    isSaved: item.is_saved, // Incluir status de salvamento
  };
};

export const getFeed = async (forceUpdate: boolean = false): Promise<Post[]> => {
  // Get cached data first (for immediate display)
  const cachedFeed = CacheService.getItem<Post[]>(CACHE_KEYS.FEED);

  // Always try to fetch fresh data unless force update
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.feed, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    // Se retornar 404 ou erro de "No feeds found", cria um novo feed automaticamente
    if (!response.ok) {
      const error = await response.json();

      // Verifica se é erro de feed não encontrado
      if (error.error && error.error.includes('No feeds found')) {
        console.log('📭 Nenhum feed encontrado. Criando feed automaticamente...');

        try {
          // Tenta criar um novo feed
          const posts = await createFeed();
          console.log('✅ Feed criado com sucesso!');
          return posts;
        } catch (createError: any) {
          console.error('❌ Erro ao criar feed automaticamente:', createError);

          // Return cached data if available
          if (cachedFeed) {
            console.log('🔄 Using cached feed data');
            return cachedFeed;
          }

          throw new Error(createError.message || 'Failed to create feed');
        }
      }

      // If it's another type of error and we have cache, return it
      if (cachedFeed) {
        console.log('🔄 Using cached feed data (error)');
        return cachedFeed;
      }

      throw new Error(error.error || 'Failed to fetch feed');
    }

    const data: FeedResponse = await response.json();

    // Converter itens do feed para o formato Post, incluindo feedId
    const posts = data.feed.map(item => ({
      ...convertFeedItemToPost(item),
      feedId: data.feed_id || undefined,
    }));

    // Check if data has changed
    const hasChanged = CacheService.hasDataChanged(CACHE_KEYS.FEED, posts);

    if (hasChanged || forceUpdate) {
      // Update cache with new data
      CacheService.setItem(CACHE_KEYS.FEED, posts);
      console.log('📥 Feed data updated in cache');
      return posts;
    } else {
      console.log('📥 Feed data unchanged, using cache');
      return cachedFeed || posts;
    }
  } catch (error) {
    console.error('Error fetching feed:', error);

    // Return cached data if available (offline mode)
    if (cachedFeed) {
      console.log('📥 Using cached feed data (offline)');
      return cachedFeed;
    }

    throw error;
  }
};

export const createFeed = async (): Promise<Post[]> => {
  const response = await authenticatedFetch(API_ENDPOINTS.feed, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create feed');
  }

  const data: FeedResponse = await response.json();
  
  // Converter itens do feed para o formato Post, incluindo feedId
  const posts = data.feed.map(item => ({
    ...convertFeedItemToPost(item),
    feedId: data.feed_id || undefined,
  }));
  
  // Salvar no cache
  CacheService.setItem(CACHE_KEYS.FEED, posts);
  
  return posts;
};

export const saveContent = async (contentId: number, feedId: string): Promise<void> => {
  const response = await authenticatedFetch(API_ENDPOINTS.feedSave, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ 
      feed_id: feedId,
      content_id: contentId 
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save content');
  }

  // Invalidar cache do feed
  CacheService.clearItem(CACHE_KEYS.FEED);
};

export const unsaveContent = async (contentId: number): Promise<void> => {
  const response = await authenticatedFetch(API_ENDPOINTS.feedSave, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content_id: contentId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unsave content');
  }

  // Invalidar cache do feed
  CacheService.clearItem(CACHE_KEYS.FEED);
};

interface SavedContentItem {
  saved_at: string;
  id: number;
  influencer_id: string;
  content_url: string;
  product_type: string;
  text: string;
  platform: string;
  published_at: string;
  like_count: number;
  play_count: number;
  comment_count: number;
  overall_score: number;
  influencer: {
    id: string;
    handle: string;
    display_name: string;
    profile_url: string;
    platform: string;
  };
}

interface SavedContentResponse {
  success: boolean;
  data: SavedContentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Converter SavedContentItem para Post
const convertSavedItemToPost = (item: SavedContentItem): Post => {
  // Para posts salvos, usamos a URL direta da imagem
  // Não tentamos extrair código porque content_url é a URL da imagem, não do post
  const code = `saved-${item.id}`; // Código único para posts salvos
  
  // Determinar media_type baseado em product_type
  // carousel_container, reels = 8 (video/carousel), outros = 1 (image)
  const isVideoOrCarousel = item.product_type === 'reels' || item.product_type === 'carousel_container';
  
  return {
    id: item.id,
    code: code,
    text: item.text,
    taken_at: new Date(item.published_at).getTime() / 1000,
    username: item.influencer?.handle || item.influencer_id,
    image_url: item.content_url,
    video_url: isVideoOrCarousel ? item.content_url : null,
    media_type: isVideoOrCarousel ? 8 : 1,
    like_count: item.like_count,
    comment_count: item.comment_count,
    play_count: item.play_count || 0,
    reshare_count: 0, // Não disponível em saved items
    likeScore: 0,
    commentScore: 0,
    playScore: 0,
    reshareScore: 0,
    recencyScore: 0,
    overallScore: item.overall_score,
    isSaved: true, // Posts salvos sempre marcados como salvos
    savedAt: item.saved_at,
  };
};

export const getSavedContent = async (page: number = 1, limit: number = 20): Promise<SavedContentResponse> => {
  const response = await authenticatedFetch(
    `${API_ENDPOINTS.feedSaved}?page=${page}&limit=${limit}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch saved content');
  }

  return await response.json();
};

// Função auxiliar para obter posts salvos no formato Post[]
export const getSavedPosts = async (page: number = 1, limit: number = 20): Promise<{ posts: Post[]; pagination: SavedContentResponse['pagination'] }> => {
  console.log('🔍 getSavedPosts: Iniciando requisição...');
  const data = await getSavedContent(page, limit);
  console.log('✅ getSavedPosts: Resposta recebida:', data);
  const posts = data.data.map(convertSavedItemToPost);
  console.log('✅ getSavedPosts: Posts convertidos:', posts);
  return { posts, pagination: data.pagination };
};