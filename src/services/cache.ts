interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
  hash?: string;
}

const CACHE_KEYS = {
  FEED: 'feed_data_cache',
  NEWS: 'news_data_cache',
  SETTINGS: 'settings_data_cache',
  GALLERY: 'gallery_data_cache',
  GENERATED_CONTENT: 'generated_content_cache'
} as const;

const CACHE_EXPIRY = {
  FEED: 2 * 60 * 1000,
  NEWS: 5 * 60 * 1000,
  SETTINGS: 5 * 60 * 1000,
  GALLERY: 60 * 60 * 1000,
  GENERATED_CONTENT: 60 * 60 * 1000
} as const;

const DEFAULT_EXPIRY = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB limit

export class CacheService {
  /**
   * Generate a simple hash for data comparison
   */
  private static generateHash(data: any): string {
    try {
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(36);
    } catch {
      return Date.now().toString();
    }
  }

  /**
   * Check if localStorage has enough space
   */
  private static hasStorageSpace(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get total size of localStorage
   */
  private static getStorageSize(): number {
    let size = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return size;
  }

  /**
   * Clear old cache entries if storage is getting full
   */
  private static clearOldCacheIfNeeded(): void {
    try {
      const currentSize = this.getStorageSize();
      if (currentSize > MAX_CACHE_SIZE * 0.8) { // If over 80% full
        const now = Date.now();
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key) && key.includes('_cache')) {
            try {
              const cached = JSON.parse(localStorage[key]);
              if (cached.timestamp && now - cached.timestamp > cached.expiresIn) {
                localStorage.removeItem(key);
              }
            } catch {
              // Skip invalid entries
            }
          }
        }
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  static getExpiryTime(key: string): number {
    return key in CACHE_EXPIRY
      ? CACHE_EXPIRY[key as keyof typeof CACHE_EXPIRY]
      : DEFAULT_EXPIRY;
  }

  /**
   * Set item in cache with hash for comparison
   */
  static setItem<T>(key: string, data: T, expiresIn?: number): boolean {
    try {
      if (!this.hasStorageSpace()) {
        this.clearOldCacheIfNeeded();
      }

      const expiry = expiresIn || CacheService.getExpiryTime(key);
      const hash = this.generateHash(data);

      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        expiresIn: expiry,
        hash
      };

      localStorage.setItem(key, JSON.stringify(cachedData));
      return true;
    } catch (error) {
      console.error('Failed to cache data:', error);
      // Try to free up space and retry once
      try {
        this.clearOldCacheIfNeeded();
        localStorage.setItem(key, JSON.stringify({
          data,
          timestamp: Date.now(),
          expiresIn: expiresIn || DEFAULT_EXPIRY,
          hash: this.generateHash(data)
        }));
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get item from cache (doesn't check expiry, just retrieves)
   */
  static getItem<T>(key: string): T | null {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    try {
      const parsedCache: CachedData<T> = JSON.parse(cached);
      return parsedCache.data;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Get item from cache with expiry check
   */
  static getItemWithExpiry<T>(key: string): T | null {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    try {
      const parsedCache: CachedData<T> = JSON.parse(cached);
      const now = Date.now();
      const isExpired = now - parsedCache.timestamp > parsedCache.expiresIn;

      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }

      return parsedCache.data;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Compare new data with cached data
   * Returns true if data has changed
   */
  static hasDataChanged<T>(key: string, newData: T): boolean {
    const cached = localStorage.getItem(key);
    if (!cached) return true;

    try {
      const parsedCache: CachedData<T> = JSON.parse(cached);
      const newHash = this.generateHash(newData);

      return parsedCache.hash !== newHash;
    } catch {
      return true;
    }
  }

  /**
   * Update cache only if data has changed
   * Returns true if cache was updated
   */
  static updateIfChanged<T>(key: string, newData: T, expiresIn?: number): boolean {
    if (this.hasDataChanged(key, newData)) {
      this.setItem(key, newData, expiresIn);
      return true;
    }
    return false;
  }

  /**
   * Get cached data or fetch new data
   */
  static async getCachedOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    expiresIn?: number
  ): Promise<{ data: T; fromCache: boolean; updated: boolean }> {
    // Get cached data (for offline access)
    const cachedData = this.getItem<T>(key);

    try {
      // Always try to fetch fresh data
      const freshData = await fetchFn();

      // Check if data has changed
      const hasChanged = this.hasDataChanged(key, freshData);

      if (hasChanged) {
        // Update cache with new data
        this.setItem(key, freshData, expiresIn);
        return { data: freshData, fromCache: false, updated: true };
      }

      // Data hasn't changed, return cached version
      return { data: cachedData || freshData, fromCache: true, updated: false };
    } catch (error) {
      console.error('Failed to fetch fresh data:', error);

      // Return cached data if available (offline mode)
      if (cachedData) {
        return { data: cachedData, fromCache: true, updated: false };
      }

      // Re-throw error if no cache available
      throw error;
    }
  }

  static clearItem(key: string): void {
    localStorage.removeItem(key);
  }

  static clearAll(): void {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    const stats: Record<string, any> = {};

    Object.entries(CACHE_KEYS).forEach(([name, key]) => {
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          const age = Date.now() - parsedCache.timestamp;
          stats[name] = {
            exists: true,
            age: Math.floor(age / 1000),
            size: cached.length,
            expired: age > parsedCache.expiresIn
          };
        } catch {
          stats[name] = { exists: false };
        }
      } else {
        stats[name] = { exists: false };
      }
    });

    return stats;
  }
}

export { CACHE_KEYS };
