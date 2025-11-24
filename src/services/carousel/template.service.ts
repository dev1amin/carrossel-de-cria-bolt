import { getCarouselConfig } from '../../config/carousel';

const CACHE_KEY_PREFIX = 'template_cache_';
const CACHE_VERSION = 'v1';
const CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface CachedTemplate {
  slides: string[];
  timestamp: number;
  version: string;
}

export class TemplateService {
  private memoryCache: Map<string, string[]> = new Map();

  private getCacheKey(templateId: string): string {
    return `${CACHE_KEY_PREFIX}${templateId}`;
  }

  private loadFromLocalStorage(templateId: string): string[] | null {
    try {
      const cacheKey = this.getCacheKey(templateId);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const data: CachedTemplate = JSON.parse(cached);
      
      // Verifica versão e expiração
      if (data.version !== CACHE_VERSION) {
        console.log(`Cache version mismatch for template ${templateId}, clearing...`);
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      const now = Date.now();
      if (now - data.timestamp > CACHE_EXPIRATION_MS) {
        console.log(`Cache expired for template ${templateId}, clearing...`);
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      console.log(`✅ Loaded template ${templateId} from localStorage cache`);
      return data.slides;
    } catch (error) {
      console.error(`Error loading template ${templateId} from localStorage:`, error);
      return null;
    }
  }

  private saveToLocalStorage(templateId: string, slides: string[]): void {
    try {
      const cacheKey = this.getCacheKey(templateId);
      const data: CachedTemplate = {
        slides,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(data));
      console.log(`💾 Saved template ${templateId} to localStorage cache`);
    } catch (error) {
      console.error(`Error saving template ${templateId} to localStorage:`, error);
      // Se falhar (quota excedida), limpa caches antigos
      this.clearOldCaches();
    }
  }

  private clearOldCaches(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
      console.log('🗑️ Cleared old template caches from localStorage');
    } catch (error) {
      console.error('Error clearing old caches:', error);
    }
  }

  async fetchTemplate(templateId: string): Promise<string[]> {
    // 1. Verifica cache em memória
    if (this.memoryCache.has(templateId)) {
      console.log(`✅ Using memory cached template ${templateId}`);
      return this.memoryCache.get(templateId)!;
    }

    // 2. Verifica cache em localStorage
    const cachedSlides = this.loadFromLocalStorage(templateId);
    if (cachedSlides) {
      this.memoryCache.set(templateId, cachedSlides);
      return cachedSlides;
    }

    const config = getCarouselConfig();
    const MINIO_ENDPOINT = config.minio.endpoint;
    const MINIO_BUCKET = config.minio.bucket;
    const TOTAL_SLIDES = config.templates.totalSlides;

    const slides: string[] = [];
    const errors: string[] = [];

    console.log(`🔍 Fetching template "${templateId}" from MinIO...`);
    console.log(`📦 MinIO Config:`, { MINIO_ENDPOINT, MINIO_BUCKET, TOTAL_SLIDES });
    console.log(`🎯 Template path will be: ${MINIO_ENDPOINT}/${MINIO_BUCKET}/template${templateId}/`);

    for (let i = 1; i <= TOTAL_SLIDES; i++) {
      const url = `${MINIO_ENDPOINT}/${MINIO_BUCKET}/template${templateId}/Slide ${i}.html`;
      console.log(`📥 Fetching slide ${i}:`, url);

      try {
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
        });

        console.log(`Slide ${i} response:`, response.status, response.ok);

        if (!response.ok) {
          throw new Error(`Failed to fetch slide ${i}: ${response.statusText}`);
        }

        const html = await response.text();
        console.log(`Slide ${i} loaded successfully, length: ${html.length}`);
        slides.push(html);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error loading slide ${i}:`, error);
        errors.push(`Slide ${i}: ${errorMsg}`);
      }
    }

    if (errors.length > 0) {
      console.error('Failed to load slides:', errors);
      throw new Error(`Failed to load some slides:\n${errors.join('\n')}`);
    }

    console.log(`All ${TOTAL_SLIDES} slides loaded successfully for template ${templateId}`);
    
    // 3. Salva em ambos os caches
    this.memoryCache.set(templateId, slides);
    this.saveToLocalStorage(templateId, slides);
    
    return slides;
  }

  clearCache(templateId?: string): void {
    if (templateId) {
      // Limpa cache específico
      this.memoryCache.delete(templateId);
      const cacheKey = this.getCacheKey(templateId);
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ Cleared cache for template ${templateId}`);
    } else {
      // Limpa todos os caches
      this.memoryCache.clear();
      this.clearOldCaches();
      console.log('🗑️ Cleared all template caches');
    }
  }

  getCachedTemplate(templateId: string): string[] | null {
    // Verifica memória primeiro
    if (this.memoryCache.has(templateId)) {
      return this.memoryCache.get(templateId)!;
    }
    
    // Depois localStorage
    return this.loadFromLocalStorage(templateId);
  }

  // Método para pré-carregar templates em background
  async preloadTemplate(templateId: string): Promise<void> {
    if (this.getCachedTemplate(templateId)) {
      console.log(`Template ${templateId} already cached, skipping preload`);
      return;
    }
    
    try {
      console.log(`📦 Preloading template ${templateId}...`);
      await this.fetchTemplate(templateId);
      console.log(`✅ Template ${templateId} preloaded successfully`);
    } catch (error) {
      console.error(`Failed to preload template ${templateId}:`, error);
    }
  }

  // Método para pré-carregar múltiplos templates
  async preloadTemplates(templateIds: string[]): Promise<void> {
    console.log(`📦 Preloading ${templateIds.length} templates...`);
    await Promise.allSettled(
      templateIds.map(id => this.preloadTemplate(id))
    );
    console.log('✅ Template preloading completed');
  }
}

export const templateService = new TemplateService();
