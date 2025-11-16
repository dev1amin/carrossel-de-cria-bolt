export interface Post {
  id?: number; // ID do post da API
  feedId?: string; // ID do feed (necessário para salvar)
  code: string;
  text: string;
  taken_at: number;
  username: string;
  image_url: string;
  likeScore: number;
  playScore: number;
  video_url: string | null;
  like_count: number;
  media_type: number; // 1 = image, 2 = video
  play_count: number;
  commentScore: number;
  overallScore: number;
  recencyScore: number;
  reshareScore: number;
  comment_count: number;
  reshare_count: number;
  isSaved?: boolean; // Indica se o post está salvo
  savedAt?: string; // Data de salvamento (para posts salvos)
}

export type SortOption = 'latest' | 'popular' | 'likes' | 'comments' | 'shares' | 'saved';

// Re-export types from other modules
export * from './generatedContent';