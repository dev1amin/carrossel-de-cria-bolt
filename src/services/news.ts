import { API_BASE_URL } from '../config/api';
import { authenticatedFetch } from '../utils/apiClient';
import type { NewsResponse, NewsQueryParams } from '../types/news';
import { CacheService, CACHE_KEYS } from './cache';

const NEWS_ENDPOINT = `${API_BASE_URL}/news`;

export const getNews = async (params?: NewsQueryParams): Promise<NewsResponse> => {
  const cacheKey = `${CACHE_KEYS.NEWS}_${JSON.stringify(params || {})}`;

  try {
    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    // Try to get cached data first (for immediate display)
    const cachedData = CacheService.getItem<NewsResponse>(cacheKey);

    // Fetch fresh data in background
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.nicheId) queryParams.append('nicheId', params.nicheId);
    if (params?.country) queryParams.append('country', params.country);
    if (params?.lang) queryParams.append('lang', params.lang);

    const url = queryParams.toString()
      ? `${NEWS_ENDPOINT}?${queryParams.toString()}`
      : NEWS_ENDPOINT;

    try {
      const response = await authenticatedFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.statusText}`);
      }

      const freshData: NewsResponse = await response.json();

      // Check if data has changed
      const hasChanged = CacheService.hasDataChanged(cacheKey, freshData);

      if (hasChanged) {
        // Update cache with new data
        CacheService.setItem(cacheKey, freshData);
        console.log('📰 News data updated in cache');
        return freshData;
      } else {
        console.log('📰 News data unchanged, using cache');
        return cachedData || freshData;
      }
    } catch (fetchError) {
      console.error('Error fetching news:', fetchError);

      // Return cached data if available (offline mode)
      if (cachedData) {
        console.log('📰 Using cached news data (offline)');
        return cachedData;
      }

      throw fetchError;
    }
  } catch (error) {
    console.error('Error in getNews:', error);
    throw error;
  }
};
