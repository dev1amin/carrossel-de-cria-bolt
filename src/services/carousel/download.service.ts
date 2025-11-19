/**
 * Service for downloading carousel slides as PNG images
 * Uses HTML with external URLs directly (servidor renderiza as imagens)
 */

interface RenderResponse {
  success: boolean;
  data?: Blob;
  error?: string;
}

function applyStylesFromState(ifr: HTMLIFrameElement, slideIndex: number, editedContent: Record<string, any>, elementStyles: Record<string, any>) {
  const doc = ifr.contentDocument || ifr.contentWindow?.document;
  if (!doc) return;

  // Aplica estilos de texto editado
  Object.entries(editedContent).forEach(([k, val]) => {
    const [slideStr, field] = k.split('-');
    const idx = Number(slideStr);
    if (idx !== slideIndex || Number.isNaN(idx)) return;
    if (field !== 'title' && field !== 'subtitle') return;

    const el = doc.getElementById(`slide-${slideIndex}-${field}`);
    if (el && typeof val === 'string') {
      el.textContent = val;
    }
  });

  // Aplica estilos CSS salvos
  Object.entries(elementStyles).forEach(([k, sty]) => {
    const [slideStr, field] = k.split('-');
    const idx = Number(slideStr);
    if (idx !== slideIndex || Number.isNaN(idx)) return;

    // Aplicar estilos de texto
    if (field === 'title' || field === 'subtitle') {
      const el = doc.getElementById(`slide-${slideIndex}-${field}`) as HTMLElement | null;
      if (!el) {
        console.warn(`⚠️ Elemento não encontrado: slide-${slideIndex}-${field}`);
        return;
      }

      console.log(`🎨 Aplicando estilos ao slide ${slideIndex}, campo ${field}:`, sty);
      
      if (sty.fontSize) el.style.fontSize = sty.fontSize;
      if (sty.fontWeight) el.style.fontWeight = String(sty.fontWeight);
      if (sty.textAlign) el.style.textAlign = sty.textAlign as any;
      if (sty.color) el.style.color = sty.color;
    }

    // Aplicar estilos de posição da imagem/vídeo/background
    if (field === 'background') {
      console.log(`🎨 Aplicando estilos de posição ao slide ${slideIndex}:`, sty);
      
      // Aplica em imagens
      const img = doc.querySelector('img[data-editable="image"]') as HTMLImageElement | null;
      if (img && sty.objectPosition) {
        img.style.setProperty('object-position', sty.objectPosition, 'important');
        console.log(`📐 Aplicada posição da imagem: ${sty.objectPosition}`);
      }
      
      // Aplica em vídeos
      const video = doc.querySelector('video[data-editable="video"]') as HTMLVideoElement | null;
      if (video && sty.objectPosition) {
        video.style.setProperty('object-position', sty.objectPosition, 'important');
        console.log(`📐 Aplicada posição do vídeo: ${sty.objectPosition}`);
      }
      
      // Aplica em backgrounds CSS
      if (sty.backgroundPositionX || sty.backgroundPositionY) {
        const bgElements = doc.querySelectorAll('[data-editable="background"], body, div, section, header, main, figure, article');
        bgElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const cs = doc.defaultView?.getComputedStyle(htmlEl);
          if (cs?.backgroundImage?.includes('url(')) {
            if (sty.backgroundPositionX) {
              htmlEl.style.setProperty('background-position-x', sty.backgroundPositionX, 'important');
            }
            if (sty.backgroundPositionY) {
              htmlEl.style.setProperty('background-position-y', sty.backgroundPositionY, 'important');
            }
            console.log(`📐 Aplicada posição do background: ${sty.backgroundPositionX} ${sty.backgroundPositionY}`);
          }
        });
      }
      
      // Aplica altura do container se salva
      if (sty.height) {
        const imgWrapper = doc.querySelector('.img-crop-wrapper') as HTMLElement | null;
        const videoContainer = doc.querySelector('.video-container') as HTMLElement | null;
        const container = imgWrapper || videoContainer;
        if (container) {
          container.setAttribute('data-cv-height', sty.height.replace('px', ''));
          container.style.setProperty('height', sty.height, 'important');
          console.log(`📏 Aplicada altura do container: ${sty.height}`);
        }
      }
    }
  });
}

/**
 * Add editable IDs to slide HTML so that applyStylesFromState can find the elements
 */
function injectEditableIds(html: string, slideIndex: number): string {
  // Extract title and subtitle text from the HTML
  // Look for text that appears to be titles/subtitles (usually in h1, h2, p, span, div elements)
  
  let result = html;
  
  // Try to find title text (usually the first heading or prominent text)
  const titleMatch = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i) || 
                     html.match(/<div[^>]*>([^<]+)<\/div>/i) ||
                     html.match(/<p[^>]*>([^<]+)<\/p>/i);
  
  if (titleMatch && titleMatch[1]) {
    const titleText = titleMatch[1].trim();
    if (titleText) {
      // Replace the title text with a span containing the ID
      const escaped = titleText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(>[^<]*)(${escaped})([^<]*<)`, 'gi');
      result = result.replace(re, (_match, b, t, a) => `${b}<span id="slide-${slideIndex}-title" data-editable="title" contenteditable="false">${t}</span>${a}`);
      console.log(`🏷️ Added title ID for slide ${slideIndex}: "${titleText}"`);
    }
  }
  
  // Try to find subtitle text (usually in paragraphs after the title)
  const subtitleMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi);
  if (subtitleMatches && subtitleMatches.length > 0) {
    // Use the first paragraph as subtitle if we don't have a clear title
    const subtitleText = subtitleMatches[0].match(/<p[^>]*>([^<]+)<\/p>/i)?.[1]?.trim();
    if (subtitleText && subtitleText !== titleMatch?.[1]?.trim()) {
      const escaped = subtitleText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(>[^<]*)(${escaped})([^<]*<)`, 'gi');
      result = result.replace(re, (_match, b, t, a) => `${b}<span id="slide-${slideIndex}-subtitle" data-editable="subtitle" contenteditable="false">${t}</span>${a}`);
      console.log(`🏷️ Added subtitle ID for slide ${slideIndex}: "${subtitleText}"`);
    }
  }
  
  return result;
}

/**
 * Inject saved styles as CSS rules into the HTML
 */
function injectStylesAsCss(html: string, slideIndex: number, elementStyles: Record<string, any>): string {
  let result = html;
  let cssRules = '';

  // Process element styles for this slide
  Object.entries(elementStyles).forEach(([key, style]) => {
    const [slideStr, elementType] = key.split('-');
    const idx = Number(slideStr);
    if (idx !== slideIndex) return;

    if (elementType === 'title' || elementType === 'subtitle') {
      // Generate CSS rule for title/subtitle
      let rule = `#slide-${slideIndex}-${elementType} {`;
      if (style.fontSize) rule += `font-size: ${style.fontSize} !important; `;
      if (style.fontWeight) rule += `font-weight: ${style.fontWeight} !important; `;
      if (style.textAlign) rule += `text-align: ${style.textAlign} !important; `;
      if (style.color) rule += `color: ${style.color} !important; `;
      rule += '}';
      
      if (rule !== `#slide-${slideIndex}-${elementType} {}`) {
        cssRules += rule + '\n';
        console.log(`🎨 Added CSS rule for ${elementType}: ${rule}`);
      }
    }

    if (elementType === 'background') {
      // Generate CSS rules for background/media positioning
      if (style.objectPosition) {
        cssRules += `img[data-editable="image"] { object-position: ${style.objectPosition} !important; }\n`;
        cssRules += `video[data-editable="video"] { object-position: ${style.objectPosition} !important; }\n`;
        console.log(`📐 Added object-position CSS: ${style.objectPosition}`);
      }
      
      if (style.backgroundPositionX || style.backgroundPositionY) {
        let bgRule = '[data-editable="background"], body, div, section, header, main, figure, article {';
        if (style.backgroundPositionX) bgRule += ` background-position-x: ${style.backgroundPositionX} !important;`;
        if (style.backgroundPositionY) bgRule += ` background-position-y: ${style.backgroundPositionY} !important;`;
        bgRule += ' }';
        cssRules += bgRule + '\n';
        console.log(`📐 Added background position CSS: ${bgRule}`);
      }

      if (style.height) {
        cssRules += `.img-crop-wrapper, .video-container { height: ${style.height} !important; }\n`;
        console.log(`📏 Added height CSS: ${style.height}`);
      }
    }
  });

  // Inject CSS rules into the <style> tag
  if (cssRules) {
    if (result.includes('<style>')) {
      result = result.replace('<style>', `<style>\n${cssRules}`);
    } else {
      // Add style tag if it doesn't exist
      result = result.replace('<head>', `<head><style>\n${cssRules}</style>`);
    }
    console.log(`💅 Injected CSS rules for slide ${slideIndex}`);
  }

  return result;
}

/**
 * Prepare slides for download by applying styles using iframes
 */
async function prepareSlidesForDownload(
  slides: string[],
  editedContent: Record<string, any>,
  elementStyles: Record<string, any>
): Promise<string[]> {
  console.log('🎨 Preparing slides for download with styles...');
  console.log('📊 Slides count:', slides.length);
  console.log('📊 Edited content:', Object.keys(editedContent));
  console.log('📊 Element styles:', Object.keys(elementStyles));
  
  const styledSlides: string[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slideHtml = slides[i];
    console.log(`🎯 Processing slide ${i + 1}/${slides.length}`);

    // First inject CSS styles into the HTML
    const slideWithCss = injectStylesAsCss(slideHtml, i, elementStyles);
    console.log(`💅 Injected CSS styles for slide ${i + 1}`);

    // Then inject editable IDs into the slide HTML so applyStylesFromState can find elements
    const slideWithIds = injectEditableIds(slideWithCss, i);
    console.log(`🏷️ Injected IDs for slide ${i + 1}`);

    // Create temporary invisible iframe
    const ifr = document.createElement('iframe');
    ifr.style.position = 'absolute';
    ifr.style.left = '-9999px';
    ifr.style.top = '-9999px';
    ifr.style.width = '1080px';
    ifr.style.height = '1350px';
    ifr.style.border = 'none';
    ifr.style.visibility = 'hidden';
    document.body.appendChild(ifr);

    try {
      // Set srcdoc and wait for load
      ifr.srcdoc = slideWithIds;
      await new Promise<void>((resolve) => {
        const onLoad = () => {
          ifr.removeEventListener('load', onLoad);
          resolve();
        };
        ifr.addEventListener('load', onLoad);
      });

      // Apply styles using applyStylesFromState
      console.log(`🎨 Applying styles to slide ${i + 1}...`);
      applyStylesFromState(ifr, i, editedContent, elementStyles);

      // Wait a bit for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the updated HTML and create iframe element
      const doc = ifr.contentDocument || ifr.contentWindow?.document;
      if (doc) {
        const styledHtml = doc.documentElement.outerHTML;
        const iframeHTML = `<iframe srcdoc="${styledHtml.replace(/"/g, '&quot;')}" class="w-full h-full border-0" title="Slide ${i + 1}" sandbox="allow-same-origin allow-scripts allow-autoplay" style="pointer-events: auto;"></iframe>`;
        styledSlides.push(iframeHTML);
        console.log(`✅ Created styled iframe for slide ${i + 1} (${iframeHTML.length} chars)`);
      } else {
        // Fallback to original if no document
        const iframeHTML = `<iframe srcdoc="${slideWithIds.replace(/"/g, '&quot;')}" class="w-full h-full border-0" title="Slide ${i + 1}" sandbox="allow-same-origin allow-scripts allow-autoplay" style="pointer-events: auto;"></iframe>`;
        styledSlides.push(iframeHTML);
        console.log(`⚠️ Fallback: created iframe for slide ${i + 1} without styles`);
      }
    } catch (error) {
      console.error(`❌ Error preparing slide ${i}:`, error);
      const iframeHTML = `<iframe srcdoc="${slideWithIds.replace(/"/g, '&quot;')}" class="w-full h-full border-0" title="Slide ${i + 1}" sandbox="allow-same-origin allow-scripts allow-autoplay" style="pointer-events: auto;"></iframe>`;
      styledSlides.push(iframeHTML);
    } finally {
      // Clean up iframe
      document.body.removeChild(ifr);
    }
  }

  console.log('🎉 Finished preparing slides:', styledSlides.length);
  return styledSlides;
}

/**
 * Clean HTML before rendering by removing editor artifacts
 * - Removes play button overlays (video-play-btn, cv-play-overlay)
 * - Removes stray alt="" attributes
 * - Removes editor markup (data-editable, contenteditable, etc.)
 * - Removes selection indicators
 * - Preserves critical video and image styles
 */
function cleanHtmlForRender(html: string): string {
  let out = html;

  // Remove stray alt="" attributes between tags
  out = out.replace(/>\s*alt\s*=\s*(?:""|''|&quot;&quot;)\s*>/gi, '>');

  // Remove video-play-btn buttons (with SVG inside)
  out = out.replace(
    /<button[^>]*class="[^"]*video-play-btn[^"]*"[\s\S]*?<\/button>/gi,
    ''
  );

  // Remove cv-play-overlay divs (editor play button overlays)
  out = out.replace(
    /<div[^>]*class="[^"]*cv-play-overlay[^"]*"[\s\S]*?<\/div>/gi,
    ''
  );

  // Remove editor markup attributes (but preserve style, class, src, etc.)
  out = out
    .replace(/\sdata-editable="[^"]*"/gi, '')
    .replace(/\scontenteditable="[^"]*"/gi, '')
    .replace(/\sdata-cv-selected="[^"]*"/gi, '')
    .replace(/\sdata-slide-index="[^"]*"/gi, '')
    .replace(/\sdata-layer-id="[^"]*"/gi, '');

  // Remove 'selected' class to avoid blue borders (but preserve other classes)
  out = out.replace(/\sclass="([^"]*?)\s*selected\s*([^"]*?)"/gi, ' class="$1 $2"');
  out = out.replace(/\sclass="selected\s*"/gi, ' class=""');
  out = out.replace(/\sclass="\s*selected"/gi, ' class=""');
  
  // Clean up double spaces in class attributes
  out = out.replace(/class="\s+"/gi, 'class=""');
  out = out.replace(/class="([^"]*)"/gi, (match, classes) => {
    const cleaned = classes.trim().replace(/\s+/g, ' ');
    return cleaned ? `class="${cleaned}"` : 'class=""';
  });

  return out;
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
    // Clean HTML before rendering
    const cleanedHtml = cleanHtmlForRender(html);
    
    // Detect remote images and set appropriate delay
    const hasRemoteImages = hasRemoteBackgroundImages(cleanedHtml);
    const delayMs = hasRemoteImages ? 2000 : 2000;

    console.log(`🖼️ Rendering slide with delay: ${delayMs}ms (${hasRemoteImages ? 'has remote images' : 'no remote images'})`);

    const response = await fetch('https://apivftomc-html-to-png.aacepg.easypanel.host/html-to-png', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: cleanedHtml,
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

    // Clean HTML before rendering
    const cleanedHtml = cleanHtmlForRender(html);
    
    // Log para debug: verificar se os estilos do vídeo estão sendo preservados
    const videoMatch = cleanedHtml.match(/<video[^>]*style="([^"]*)"[^>]*>/i);
    if (videoMatch) {
      console.log('📹 Video styles found:', videoMatch[1]);
    } else {
      console.warn('⚠️ No inline styles found on video tag');
    }

    const response = await fetch('https://apivftomc-html-to-png.aacepg.easypanel.host/html-to-mp4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: cleanedHtml,
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
/**
 * Detecta automaticamente se o slide contém vídeo e usa o endpoint apropriado
 */
export async function downloadSlidesAsPNG(
  slides: string[],
  onProgress?: (current: number, total: number) => void,
  editedContent?: Record<string, any>,
  elementStyles?: Record<string, any>
): Promise<void> {
  console.log(`🎨 Starting download of ${slides.length} slides`);
  console.log('📊 Edited content keys:', editedContent ? Object.keys(editedContent) : 'none');
  console.log('📊 Element styles keys:', elementStyles ? Object.keys(elementStyles) : 'none');
  
  // Prepare slides with styles applied via iframes
  const styledIframes = await prepareSlidesForDownload(slides, editedContent || {}, elementStyles || {});
  console.log('📦 Prepared iframes:', styledIframes.length);
  
  for (let i = 0; i < styledIframes.length; i++) {
    const slideNumber = i + 1;
    console.log(`\n📄 Processing slide ${slideNumber}/${styledIframes.length}`);
    
    if (onProgress) {
      onProgress(slideNumber, styledIframes.length);
    }
    
    try {
      // Send the complete iframe HTML (exactly like the editor does)
      const slideHtml = styledIframes[i];
      
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
      if (i < styledIframes.length - 1) {
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
