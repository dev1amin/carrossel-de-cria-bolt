/**
 * Service for downloading carousel slides as PNG images
 * Uses HTML with external URLs directly (servidor renderiza as imagens)
 */

interface RenderResponse {
  success: boolean;
  data?: Blob;
  error?: string;
}

/**
 * Detect if HTML contains remote background images (background-image or url() in CSS)
 * Returns true if found, false otherwise
 */
function hasRemoteBackgroundImages(html: string): boolean {
  // Check for background-image: url(...) patterns
  const backgroundImageRegex = /background-image:\s*url\([^)]+\)/gi;
  // Check for any url() in CSS (covers background-image and other CSS properties)
  const urlRegex = /url\([^)]+\)/gi;

  return backgroundImageRegex.test(html) || urlRegex.test(html);
}

/**
 * Detect if HTML contains a video element or video URL
 * Returns true if video is found, false otherwise
 */
function isVideoSlide(html: string): boolean {
  // Check for <video> tag
  if (/<video[^>]*>/i.test(html)) {
    return true;
  }
  
  // Check for .mp4 URLs in src or background-image
  if (/\.mp4/i.test(html)) {
    return true;
  }
  
  return false;
}

/**
 * Send HTML to rendering API and get PNG
 * HTML should contain direct URLs to images (Unsplash, CDN, etc.)
 * The API will load external resources during the delay period
 * Delay is automatically adjusted based on presence of remote images
 */
async function renderHTMLToPNG(html: string): Promise<RenderResponse> {
  try {
    // Detect remote images and set appropriate delay
    const hasRemoteImages = hasRemoteBackgroundImages(html);
    const delayMs = hasRemoteImages ? 2000 : 2000;

    console.log(`🖼️ Rendering slide with delay: ${delayMs}ms (${hasRemoteImages ? 'has remote images' : 'no remote images'})`);

    const response = await fetch('https://apivftomc-html-to-png.aacepg.easypanel.host/html-to-png', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: html,
        width: 1080,
        height: 1350,
        delay_ms: delayMs,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Rendering API error: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    return {
      success: true,
      data: blob,
    };
  } catch (error) {
    console.error('Error rendering HTML to PNG:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send HTML to rendering API and get MP4 (for video slides)
 * Uses /html-to-mp4 endpoint that returns the original video file
 */
async function renderHTMLToMP4(html: string): Promise<RenderResponse> {
  try {
    console.log('🎥 Rendering video slide to MP4...');

    const response = await fetch('https://apivftomc-html-to-png.aacepg.easypanel.host/html-to-mp4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: html,
      }),
    });
    
    if (!response.ok) {
      // Try to parse error message from JSON
      let errorMessage = `Rendering API error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // If JSON parsing fails, use status text
      }
      throw new Error(errorMessage);
    }
    
    // Check content type to ensure we got a video
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('video/mp4')) {
      console.warn(`⚠️ Expected video/mp4, got ${contentType}`);
    }
    
    const blob = await response.blob();
    
    return {
      success: true,
      data: blob,
    };
  } catch (error) {
    console.error('Error rendering HTML to MP4:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main function: Download all slides (PNG for images, MP4 for videos)
 * Envia HTML direto com URLs externas (servidor renderiza)
 * Detecta automaticamente se o slide contém vídeo e usa o endpoint apropriado
 */
export async function downloadSlidesAsPNG(
  slides: string[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  console.log(`🎨 Starting download of ${slides.length} slides`);
  
  for (let i = 0; i < slides.length; i++) {
    const slideNumber = i + 1;
    console.log(`\n📄 Processing slide ${slideNumber}/${slides.length}`);
    
    if (onProgress) {
      onProgress(slideNumber, slides.length);
    }
    
    try {
      const slideHtml = slides[i];
      const hasVideo = isVideoSlide(slideHtml);
      
      let result: RenderResponse;
      let filename: string;
      
      if (hasVideo) {
        // Slide com vídeo: usar endpoint /html-to-mp4
        console.log('🎥 Rendering video slide to MP4...');
        result = await renderHTMLToMP4(slideHtml);
        filename = `slide_${slideNumber.toString().padStart(2, '0')}.mp4`;
      } else {
        // Slide normal: usar endpoint /html-to-png
        console.log('🖼️ Rendering slide to PNG...');
        result = await renderHTMLToPNG(slideHtml);
        filename = `slide_${slideNumber.toString().padStart(2, '0')}.png`;
      }
      
      if (!result.success || !result.data) {
        throw new Error(result.error || `Failed to render ${hasVideo ? 'video' : 'image'}`);
      }
      
      // Download do arquivo
      downloadBlob(result.data, filename);
      console.log(`✅ Downloaded: ${filename}`);
      
      // Delay entre downloads
      if (i < slides.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`❌ Error processing slide ${slideNumber}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Erro ao baixar slide ${slideNumber}: ${errorMessage}`);
    }
  }
  
  console.log('\n🎉 All slides downloaded successfully!');
}

/**
 * Download a single slide (PNG for images, MP4 for videos)
 * Envia HTML direto com URLs externas
 * Detecta automaticamente se o slide contém vídeo e usa o endpoint apropriado
 */
export async function downloadSingleSlideAsPNG(
  html: string,
  slideNumber: number
): Promise<void> {
  console.log(`🎨 Downloading slide ${slideNumber}`);
  
  try {
    const hasVideo = isVideoSlide(html);
    
    let result: RenderResponse;
    let filename: string;
    
    if (hasVideo) {
      // Slide com vídeo: usar endpoint /html-to-mp4
      console.log('🎥 Rendering video slide to MP4...');
      result = await renderHTMLToMP4(html);
      filename = `slide_${slideNumber.toString().padStart(2, '0')}.mp4`;
    } else {
      // Slide normal: usar endpoint /html-to-png
      console.log('🖼️ Rendering slide to PNG...');
      result = await renderHTMLToPNG(html);
      filename = `slide_${slideNumber.toString().padStart(2, '0')}.png`;
    }
    
    if (!result.success || !result.data) {
      throw new Error(result.error || `Failed to render ${hasVideo ? 'video' : 'image'}`);
    }
    
    // Download
    downloadBlob(result.data, filename);
    console.log(`✅ Downloaded: ${filename}`);
  } catch (error) {
    console.error(`❌ Error downloading slide ${slideNumber}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Erro ao baixar slide ${slideNumber}: ${errorMessage}`);
  }
}
