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
    // BACKEND REAL: manda taken_at (number em segundos)
    taken_at?: number;
    // Pode existir em algumas versões da API
    published_at?: string;
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

/**
 * Remove posts duplicados baseado no code (Instagram shortcode)
 * Logs são gerados para debug quando duplicatas são encontradas
 */
const deduplicatePosts = (posts: Post[]): Post[] => {
  const seen = new Set<string>();
  return posts.filter(post => {
    if (seen.has(post.code)) {
      console.warn(`🔄 Post duplicado removido: ${post.code} (ID: ${post.id})`);
      return false;
    }
    seen.add(post.code);
    return true;
  });
};

// Normaliza taken_at vindo da API para timestamp Unix em segundos
const normalizeTakenAt = (content: FeedItem['influencer_content']): number => {
  // 1) Preferir taken_at numérico se existir
  if (content.taken_at !== undefined && content.taken_at !== null) {
    let t = Number(content.taken_at);
    if (!Number.isFinite(t)) {
      console.warn('❌ taken_at inválido em influencer_content:', content.taken_at);
      return 0;
    }
    // Se vier em ms por erro futuro, converte
    if (t > 1e12) {
      t = Math.floor(t / 1000);
    }
    return t;
  }

  // 2) Fallback para published_at (ISO string) se existir
  if (content.published_at) {
    const ms = Date.parse(content.published_at);
    if (!Number.isFinite(ms)) {
      console.warn('❌ published_at inválido em influencer_content:', content.published_at);
      return 0;
    }
    return Math.floor(ms / 1000);
  }

  // 3) Sem nada, volta 0
  console.warn('⚠️ Nenhum taken_at/published_at encontrado em influencer_content:', content);
  return 0;
};

// Converter FeedItem da nova API para Post do formato antigo
const convertFeedItemToPost = (item: FeedItem): Post => {
  const content = item.influencer_content;

  const takenAt = normalizeTakenAt(content);

  return {
    id: content.id, // ID do post para enviar ao generateCarousel
    code: content.code,
    text: content.text,
    taken_at: takenAt,
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
    recommend: item.recommend,
    is_saved: item.is_saved,
  };
};

export const getFeed = async (forceUpdate: boolean = false): Promise<{ posts: Post[], feed_id: string | null }> => {
  // Get cached data first (for immediate display)
  const cachedFeed = CacheService.getItem<Post[]>(CACHE_KEYS.FEED);

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
          const result = await createFeed();
          console.log('✅ Feed criado com sucesso!');
          return result;
        } catch (createError: any) {
          console.error('❌ Erro ao criar feed automaticamente:', createError);

          // Return cached data if available
          if (cachedFeed) {
            console.log('🔄 Using cached feed data');
            return { posts: cachedFeed, feed_id: null };
          }

          throw new Error(createError.message || 'Failed to create feed');
        }
      }

      // If it's another type of error and we have cache, return it
      if (cachedFeed) {
        console.log('🔄 Using cached feed data (error)');
        return { posts: cachedFeed, feed_id: null };
      }

      throw new Error(error.error || 'Failed to fetch feed');
    }

    const data: FeedResponse = await response.json();

    // Converter itens do feed para o formato Post
    let posts = data.feed.map(convertFeedItemToPost);
    
    // Remover posts duplicados
    posts = deduplicatePosts(posts);

    // Check if data has changed
    const hasChanged = CacheService.hasDataChanged(CACHE_KEYS.FEED, posts);

    if (hasChanged || forceUpdate) {
      // Update cache with new data
      CacheService.setItem(CACHE_KEYS.FEED, posts);
      console.log('📥 Feed data updated in cache');
      return { posts, feed_id: data.feed_id };
    } else {
      console.log('📥 Feed data unchanged, using cache');
      return { posts: cachedFeed || posts, feed_id: data.feed_id };
    }
  } catch (error) {
    console.error('Error fetching feed:', error);

    // Return cached data if available (offline mode)
    if (cachedFeed) {
      console.log('📥 Using cached feed data (offline)');
      return { posts: cachedFeed, feed_id: null };
    }

    throw error;
  }
};

export const createFeed = async (): Promise<{ posts: Post[], feed_id: string | null }> => {
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
  
  // Converter itens do feed para o formato Post
  let posts = data.feed.map(convertFeedItemToPost);
  
  // Remover posts duplicados
  posts = deduplicatePosts(posts);
  
  // Salvar no cache
  CacheService.setItem(CACHE_KEYS.FEED, posts);
  
  return { posts, feed_id: data.feed_id };
};

export const saveContent = async (contentId: number, feedId: string): Promise<void> => {
  const response = await authenticatedFetch(API_ENDPOINTS.feedSave, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content_id: contentId, feed_id: feedId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save content');
  }

  // Invalidar cache do feed
  CacheService.clearItem(CACHE_KEYS.FEED);
};

export const unsaveContent = async (contentId: number, feedId: string): Promise<void> => {
  const response = await authenticatedFetch(API_ENDPOINTS.feedSave, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content_id: contentId, feed_id: feedId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unsave content');
  }

  // Invalidar cache do feed
  CacheService.clearItem(CACHE_KEYS.FEED);
};

// ====== SALVOS ======

export interface SavedPost {
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
    profile_url: string | null;
    platform: string;
  };
}

interface SavedPostApiResponse {
  message: string;
  saved_items: {
    data: SavedPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export const getSavedPosts = async (
  page: number = 1,
  limit: number = 20
): Promise<SavedPost[]> => {
  const response = await authenticatedFetch(
    `${API_ENDPOINTS.feedSaved}?page=${page}&limit=${limit}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch saved posts');
  }

  const data: SavedPostApiResponse = await response.json();

  // API real: { message, saved_items: { data: [...], pagination: {...} } }
  const savedPosts = data.saved_items?.data ?? [];

  return savedPosts;
};