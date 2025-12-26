/**
 * ReactDownload Service - Download de slides React sem usar API externa
 * 
 * VANTAGENS:
 * - Não depende de API externa (offline-first)
 * - Captura diretamente do DOM React (mais rápido)
 * - Suporta todos os estilos CSS aplicados
 * - Qualidade consistente
 * 
 * LIMITAÇÕES:
 * - Vídeos precisam de tratamento especial (captura frame estático ou usa API para MP4)
 */
import { toPng, toBlob } from 'html-to-image';

interface DownloadOptions {
  quality?: number;
  backgroundColor?: string;
  pixelRatio?: number;
}

const DEFAULT_OPTIONS: DownloadOptions = {
  quality: 1,
  backgroundColor: '#ffffff',
  pixelRatio: 2, // Alta resolução
};

/**
 * Aguarda até que todas as imagens no elemento estejam carregadas
 */
async function waitForImages(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  const videos = element.querySelectorAll('video');
  
  const imagePromises = Array.from(images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve even on error to not block
    });
  });

  const videoPromises = Array.from(videos).map((video) => {
    if (video.readyState >= 2) return Promise.resolve(); // HAVE_CURRENT_DATA
    return new Promise<void>((resolve) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => resolve();
      // Timeout fallback
      setTimeout(resolve, 2000);
    });
  });

  await Promise.all([...imagePromises, ...videoPromises]);
}

/**
 * Captura um elemento DOM como PNG
 */
export async function captureElementAsPng(
  element: HTMLElement,
  options: DownloadOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Aguarda imagens carregarem
  await waitForImages(element);
  
  // Pequeno delay para garantir renderização
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    const dataUrl = await toPng(element, {
      quality: opts.quality,
      backgroundColor: opts.backgroundColor,
      pixelRatio: opts.pixelRatio,
      cacheBust: true,
      // Ignora fontes externas para evitar erro CORS com Google Fonts
      skipFonts: true,
      // Configurações para CORS
      fetchRequestInit: {
        mode: 'cors',
        credentials: 'omit',
      },
      // Filter para ignorar elementos problemáticos
      filter: (node) => {
        // Ignora iframes aninhados
        if (node.tagName === 'IFRAME') return false;
        // Ignora scripts
        if (node.tagName === 'SCRIPT') return false;
        // Ignora links de estilo externos (Google Fonts)
        if (node.tagName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet') return false;
        return true;
      },
    });
    
    return dataUrl;
  } catch (error) {
    console.error('Erro ao capturar elemento:', error);
    throw error;
  }
}

/**
 * Captura um elemento DOM como Blob
 */
export async function captureElementAsBlob(
  element: HTMLElement,
  options: DownloadOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Aguarda imagens carregarem
  await waitForImages(element);
  
  // Pequeno delay para garantir renderização
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    const blob = await toBlob(element, {
      quality: opts.quality,
      backgroundColor: opts.backgroundColor,
      pixelRatio: opts.pixelRatio,
      cacheBust: true,
      // Ignora fontes externas para evitar erro CORS com Google Fonts
      skipFonts: true,
      fetchRequestInit: {
        mode: 'cors',
        credentials: 'omit',
      },
      filter: (node) => {
        if (node.tagName === 'IFRAME') return false;
        if (node.tagName === 'SCRIPT') return false;
        // Ignora links de estilo externos (Google Fonts)
        if (node.tagName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet') return false;
        return true;
      },
    });
    
    if (!blob) throw new Error('Falha ao gerar blob');
    return blob;
  } catch (error) {
    console.error('Erro ao capturar elemento como blob:', error);
    throw error;
  }
}

/**
 * Faz download de um blob como arquivo
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Faz download de um data URL como arquivo
 */
function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Detecta se o slide contém vídeo
 */
function hasVideo(element: HTMLElement): boolean {
  return element.querySelector('video') !== null;
}

/**
 * Download de um único slide React
 * @param slideElement - Elemento DOM do slide (container do ReactSlideRenderer)
 * @param slideNumber - Número do slide (para nome do arquivo)
 */
export async function downloadReactSlide(
  slideElement: HTMLElement,
  slideNumber: number,
  options: DownloadOptions = {}
): Promise<void> {
  console.log(`📸 Capturando slide ${slideNumber}...`);
  
  const isVideo = hasVideo(slideElement);
  
  if (isVideo) {
    console.log('🎥 Slide contém vídeo - capturando frame atual');
    // Para vídeos, capturamos o frame atual como imagem
    // Se precisar de MP4, pode usar a API externa como fallback
  }
  
  try {
    const blob = await captureElementAsBlob(slideElement, options);
    const filename = `slide_${slideNumber.toString().padStart(2, '0')}.png`;
    downloadBlob(blob, filename);
    console.log(`✅ Download concluído: ${filename}`);
  } catch (error) {
    console.error(`❌ Erro ao baixar slide ${slideNumber}:`, error);
    throw new Error(`Erro ao baixar slide ${slideNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Download de todos os slides React
 * @param slideElements - Array de elementos DOM dos slides
 * @param onProgress - Callback de progresso
 */
export async function downloadAllReactSlides(
  slideElements: HTMLElement[],
  onProgress?: (current: number, total: number) => void,
  options: DownloadOptions = {}
): Promise<void> {
  console.log(`🎨 Iniciando download de ${slideElements.length} slides React`);
  
  for (let i = 0; i < slideElements.length; i++) {
    const slideNumber = i + 1;
    
    if (onProgress) {
      onProgress(slideNumber, slideElements.length);
    }
    
    try {
      await downloadReactSlide(slideElements[i], slideNumber, options);
      
      // Pequeno delay entre downloads
      if (i < slideElements.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`❌ Erro no slide ${slideNumber}:`, error);
      throw error;
    }
  }
  
  console.log('🎉 Todos os slides baixados com sucesso!');
}

/**
 * Captura todos os slides e retorna como array de data URLs
 * Útil para preview ou processamento posterior
 */
export async function captureAllSlidesAsDataUrls(
  slideElements: HTMLElement[],
  onProgress?: (current: number, total: number) => void,
  options: DownloadOptions = {}
): Promise<string[]> {
  const dataUrls: string[] = [];
  
  for (let i = 0; i < slideElements.length; i++) {
    if (onProgress) {
      onProgress(i + 1, slideElements.length);
    }
    
    try {
      const dataUrl = await captureElementAsPng(slideElements[i], options);
      dataUrls.push(dataUrl);
    } catch (error) {
      console.error(`Erro ao capturar slide ${i + 1}:`, error);
      // Adiciona placeholder em caso de erro
      dataUrls.push('');
    }
  }
  
  return dataUrls;
}

/**
 * Cria um ZIP com todos os slides
 * Requer JSZip (opcional - pode ser instalado depois)
 */
export async function downloadSlidesAsZip(
  slideElements: HTMLElement[],
  zipFilename: string = 'carousel_slides.zip',
  onProgress?: (current: number, total: number) => void,
  options: DownloadOptions = {}
): Promise<void> {
  // JSZip é opcional - se não estiver disponível, faz download individual
  // Para usar ZIP, instale com: npm install jszip
  console.warn('downloadSlidesAsZip: JSZip não está instalado, fazendo download individual dos slides');
  await downloadAllReactSlides(slideElements, onProgress, options);
}
