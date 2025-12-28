/**
 * TemplateService - Carrega templates locais via Dynamic Import
 * 
 * OTIMIZADO PARA PERFORMANCE:
 * - Templates são bundled com a aplicação (sem requisições externas)
 * - Dynamic imports para code-splitting (só baixa quando necessário)
 * - Cache em memória para acesso instantâneo após primeiro load
 * - Zero dependência de servidores externos (MinIO removido)
 */

// Mapa de imports dinâmicos para cada template (apenas JSON para templates legados)
// Vite faz code-splitting automático para cada um
// NOTA: Templates 1-8 agora são 100% React (não precisam de JSON)
const templateImports: Record<string, () => Promise<{ default: { slides: string[] } }>> = {
  // Templates 1-8 são React puro, não precisam de JSON
  // Template 9 removido - não existe o arquivo JSON
};

// Templates que usam renderização React (sem iframe, sem JSON)
// Performance: React nativo elimina overhead de iframes e parsing de HTML
export const REACT_TEMPLATES = [
  '1-react',  // Template 1 - Versão React
  '2-react',  // Template 2 - Footer branco com chips azuis
  '3-react',  // Template 3 - Anton SC em fundo preto
  '4-react',  // Template 4 - Fundo roxo (#6750A4)
  '5-react',  // Template 5 - Fundo claro (#F1F1F1) com botão verde
  '6-react',  // Template 6 - Mix de fundos claro/escuro
  '7-react',  // Template 7 - Twitter Dark Mode (1170x1560)
  '8-react',  // Template 8 - Twitter Light Mode (1170x1560)
];

// Mapeamento de IDs legados para IDs React
// Isso garante compatibilidade com dados antigos da API que usam "1", "2", etc.
const LEGACY_TO_REACT_MAP: Record<string, string> = {
  '1': '1-react',
  '2': '2-react',
  '3': '3-react',
  '4': '4-react',
  '5': '5-react',
  '6': '6-react',
  '7': '7-react',
  '8': '8-react',
};

export class TemplateService {
  // Cache em memória - acesso instantâneo após primeiro load
  private memoryCache: Map<string, string[]> = new Map();
  
  // Controle de loading para evitar requisições duplicadas
  private loadingPromises: Map<string, Promise<string[]>> = new Map();

  /**
   * Normaliza o ID do template (mapeia IDs legados para IDs React)
   * Ex: "1" -> "1-react", "2" -> "2-react"
   */
  normalizeTemplateId(templateId: string): string {
    // Se já é um ID React válido, retorna como está
    if (REACT_TEMPLATES.includes(templateId)) {
      return templateId;
    }
    
    // Se é um ID legado (1-8), mapeia para React
    if (LEGACY_TO_REACT_MAP[templateId]) {
      console.log(`🔄 Mapeando template legado "${templateId}" para "${LEGACY_TO_REACT_MAP[templateId]}"`);
      return LEGACY_TO_REACT_MAP[templateId];
    }
    
    // Outros IDs (como "9") permanecem inalterados
    return templateId;
  }

  /**
   * Verifica se um template usa renderização React
   */
  isReactTemplate(templateId: string): boolean {
    const normalizedId = this.normalizeTemplateId(templateId);
    return REACT_TEMPLATES.includes(normalizedId);
  }

  /**
   * Busca um template pelo ID
   * - Primeiro verifica cache em memória (instantâneo)
   * - Depois usa dynamic import (Vite otimiza automaticamente)
   * - Templates React retornam array vazio (renderização é via componentes)
   */
  async fetchTemplate(templateId: string): Promise<string[]> {
    // Normaliza o ID (mapeia IDs legados para React)
    const normalizedId = this.normalizeTemplateId(templateId);
    
    // Templates React não precisam de HTML - renderização é via componentes
    if (REACT_TEMPLATES.includes(normalizedId)) {
      console.log(`⚡ Template ${normalizedId} é React - não precisa de HTML`);
      // Retorna array com 10 slots vazios (para indicar número de slides)
      return Array(10).fill('');
    }

    // 1. Cache em memória = acesso instantâneo
    if (this.memoryCache.has(normalizedId)) {
      console.log(`⚡ Template ${normalizedId} servido do cache (instantâneo)`);
      return this.memoryCache.get(normalizedId)!;
    }

    // 2. Se já está carregando, reutiliza a promise (evita duplicatas)
    if (this.loadingPromises.has(normalizedId)) {
      console.log(`⏳ Template ${normalizedId} já está sendo carregado, aguardando...`);
      return this.loadingPromises.get(normalizedId)!;
    }

    // 3. Verifica se o template existe
    const importFn = templateImports[normalizedId];
    if (!importFn) {
      throw new Error(`Template "${normalizedId}" não encontrado. Templates disponíveis: ${Object.keys(templateImports).join(', ')}, ${REACT_TEMPLATES.join(', ')}`);
    }

    // 4. Carrega via dynamic import
    const loadPromise = (async () => {
      console.log(`📦 Carregando template ${normalizedId} via dynamic import...`);
      const startTime = performance.now();
      
      try {
        const module = await importFn();
        const slides = module.default?.slides || (module as any).slides;
        
        if (!slides || !Array.isArray(slides)) {
          throw new Error(`Template ${normalizedId} não contém array "slides" válido`);
        }

        const loadTime = (performance.now() - startTime).toFixed(2);
        console.log(`✅ Template ${normalizedId} carregado em ${loadTime}ms (${slides.length} slides)`);
        
        // Salva no cache
        this.memoryCache.set(normalizedId, slides);
        
        return slides;
      } finally {
        // Remove da lista de loading
        this.loadingPromises.delete(normalizedId);
      }
    })();

    this.loadingPromises.set(normalizedId, loadPromise);
    return loadPromise;
  }

  /**
   * Limpa o cache de templates
   */
  clearCache(templateId?: string): void {
    if (templateId) {
      this.memoryCache.delete(templateId);
      console.log(`🗑️ Cache limpo para template ${templateId}`);
    } else {
      this.memoryCache.clear();
      console.log('🗑️ Cache de todos os templates limpo');
    }
  }

  /**
   * Retorna template do cache se existir (não faz fetch)
   */
  getCachedTemplate(templateId: string): string[] | null {
    return this.memoryCache.get(templateId) || null;
  }

  /**
   * Pré-carrega um template em background
   */
  async preloadTemplate(templateId: string): Promise<void> {
    if (this.memoryCache.has(templateId)) {
      return; // Já está em cache
    }
    
    try {
      await this.fetchTemplate(templateId);
    } catch (error) {
      console.warn(`Falha ao pré-carregar template ${templateId}:`, error);
    }
  }

  /**
   * Pré-carrega múltiplos templates em paralelo
   */
  async preloadTemplates(templateIds: string[]): Promise<void> {
    console.log(`📦 Pré-carregando ${templateIds.length} templates...`);
    await Promise.allSettled(
      templateIds.map(id => this.preloadTemplate(id))
    );
    console.log('✅ Pré-carregamento concluído');
  }

  /**
   * Retorna lista de IDs de templates disponíveis
   */
  getAvailableTemplates(): string[] {
    return Object.keys(templateImports);
  }
}

export const templateService = new TemplateService();
