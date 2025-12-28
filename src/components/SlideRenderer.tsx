import React, { useMemo, useRef, useEffect, useState } from 'react';
import { ReactSlideRenderer } from '../templates/react';

// Dimensões dos templates (legado + React)
const TEMPLATE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1': { width: 1080, height: 1350 },
  '2': { width: 1080, height: 1350 },
  '3': { width: 1080, height: 1350 },
  '4': { width: 1080, height: 1350 },
  '5': { width: 1080, height: 1350 },
  '6': { width: 1080, height: 1350 },
  '7': { width: 1170, height: 1560 },
  '8': { width: 1170, height: 1560 },
  '9': { width: 1170, height: 1560 },
  '1-react': { width: 1080, height: 1350 },
  '2-react': { width: 1080, height: 1350 },
  '3-react': { width: 1080, height: 1350 },
  '4-react': { width: 1080, height: 1350 },
  '5-react': { width: 1080, height: 1350 },
  '6-react': { width: 1080, height: 1350 },
  '7-react': { width: 1170, height: 1560 },
  '8-react': { width: 1170, height: 1560 },
};

// Interface para dados de slide React
interface ReactTemplateData {
  __reactTemplate: true;
  templateId: string;
  slideIndex: number;
  slideData: any;
  dadosGerais: any;
}

interface SlideData {
  title?: string;
  subtitle?: string;
  imagem_fundo?: string;
  imagem_fundo2?: string;
  imagem_fundo3?: string;
  thumbnail_url?: string;
  [key: string]: any;
}

interface SlideRendererProps {
  slideContent: string;
  className?: string;
  slideIndex?: number;
  styles?: Record<string, any>; // Estilos salvos do carrossel
  templateId?: string; // ID do template para usar dimensões corretas
  containerWidth?: number; // Largura do container (para calcular escala)
  containerHeight?: number; // Altura do container (para calcular escala)
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ 
  slideContent, 
  className = '', 
  slideIndex = 0,
  styles = {},
  templateId,
  containerWidth,
  containerHeight
}) => {
  // Ref para medir o container quando não temos dimensões
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredSize, setMeasuredSize] = useState<{ width: number; height: number } | null>(null);
  
  // Mede o container quando montado
  useEffect(() => {
    if (containerRef.current && !containerWidth && !containerHeight) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setMeasuredSize({ width: rect.width, height: rect.height });
      }
    }
  }, [containerWidth, containerHeight]);
  
  // Observa mudanças de tamanho do container
  useEffect(() => {
    if (!containerRef.current || containerWidth || containerHeight) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setMeasuredSize({ width, height });
        }
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerWidth, containerHeight]);

  // Tenta fazer parse do JSON primeiro para detectar template React
  let slideData: SlideData | ReactTemplateData | null = null;
  let isHTML = false;

  try {
    slideData = JSON.parse(slideContent);
  } catch {
    isHTML = true;
  }

  // Usa dimensões passadas ou medidas
  const effectiveWidth = containerWidth || measuredSize?.width || 300;
  const effectiveHeight = containerHeight || measuredSize?.height || 375;

  // ✅ TEMPLATE REACT: Se for dados de template React, usa ReactSlideRenderer
  if (slideData && '__reactTemplate' in slideData && slideData.__reactTemplate === true) {
    const reactData = slideData as ReactTemplateData;
    
    return (
      <div 
        ref={containerRef}
        className={`relative overflow-hidden ${className}`}
        style={{ 
          width: '100%',
          height: '100%',
        }}
      >
        <ReactSlideRenderer
          templateId={reactData.templateId}
          slideIndex={reactData.slideIndex}
          slideData={reactData.slideData}
          dadosGerais={reactData.dadosGerais}
          globalSettings={reactData.globalSettings}
          containerWidth={effectiveWidth}
          containerHeight={effectiveHeight}
        />
      </div>
    );
  }

  // Obtém dimensões do template (para templates não-React)
  const templateDimensions = useMemo(() => {
    if (templateId && TEMPLATE_DIMENSIONS[templateId]) {
      return TEMPLATE_DIMENSIONS[templateId];
    }
    // Default: assume template 1-6
    return { width: 1080, height: 1350 };
  }, [templateId]);

  // Se for HTML, renderiza com iframe para isolamento TOTAL
  if (isHTML || !slideData) {
    const slideStyles = styles[String(slideIndex)] || {};

    // Lista de seletores de fallback por campo
    const selectorListFor = (fieldName: string) => ([
      `#slide-${slideIndex}-${fieldName}`,
      `[data-element="${fieldName}"]`,
      `[data-field="${fieldName}"]`,
      `[data-slot="${fieldName}"]`,
      `[data-name="${fieldName}"]`,
      `[data-key="${fieldName}"]`,
      `[data-bind="${fieldName}"]`,
      `.slide-${slideIndex}-${fieldName}`,
      // Heurísticas por campo comum
      ...(fieldName === 'title' ? ['h1','h2','[class*="title"]'] : []),
      ...(fieldName === 'subtitle' ? ['[class*="sub"]','p'] : []),
    ]).join(', ');

    // 1) CSS com muitos fallbacks
    let customRules: string[] = [];
    Object.entries(slideStyles).forEach(([fieldName, fieldStyles]: [string, any]) => {
      const selector = selectorListFor(fieldName);
      const decls: string[] = [];
      
      // Estilos de texto
      if (fieldStyles.fontSize)   decls.push(`font-size:${fieldStyles.fontSize} !important;`);
      if (fieldStyles.fontWeight) decls.push(`font-weight:${fieldStyles.fontWeight} !important;`);
      if (fieldStyles.textAlign)  decls.push(`text-align:${fieldStyles.textAlign} !important;`);
      if (fieldStyles.color)      decls.push(`color:${fieldStyles.color} !important;`);
      
      if (decls.length) customRules.push(`${selector}{${decls.join('')}}`);
    });

    // Estilos de mídia (imagens/vídeos arrastados)
    const bgStyles = slideStyles['background'];
    if (bgStyles) {
      // Estilos para imagens
      if (bgStyles.objectPosition) {
        customRules.push(`img[data-editable="image"]{object-position:${bgStyles.objectPosition} !important;}`);
        customRules.push(`.img-crop-wrapper img{object-position:${bgStyles.objectPosition} !important;}`);
      }
      
      // Estilos para vídeos
      if (bgStyles.objectPosition) {
        customRules.push(`video[data-editable="video"]{object-position:${bgStyles.objectPosition} !important;}`);
        customRules.push(`.video-container video{object-position:${bgStyles.objectPosition} !important;}`);
      }
      
      // Estilos para backgrounds CSS
      if (bgStyles.backgroundPositionX || bgStyles.backgroundPositionY) {
        const bgPosDecls: string[] = [];
        if (bgStyles.backgroundPositionX) bgPosDecls.push(`background-position-x:${bgStyles.backgroundPositionX} !important;`);
        if (bgStyles.backgroundPositionY) bgPosDecls.push(`background-position-y:${bgStyles.backgroundPositionY} !important;`);
        
        // Aplica em múltiplos seletores que podem ter background
        customRules.push(`[data-editable="background"]{${bgPosDecls.join('')}}`);
        customRules.push(`body{${bgPosDecls.join('')}}`);
        customRules.push(`div[style*="background-image"]{${bgPosDecls.join('')}}`);
        customRules.push(`section[style*="background-image"]{${bgPosDecls.join('')}}`);
      }
    }

    // 2) Plano B JS (aplica inline se CSS não pegar)
    const runtimePatcher = `
(function(){
  const byField = ${JSON.stringify(slideStyles)};
  const pickNodes = (field) => {
    const selectorList = [
      '#slide-${slideIndex}-' + field,
      '[data-element="' + field + '"]',
      '[data-field="' + field + '"]',
      '[data-slot="' + field + '"]',
      '[data-name="' + field + '"]',
      '[data-key="' + field + '"]',
      '[data-bind="' + field + '"]',
      '.slide-${slideIndex}-' + field,
      ${slideIndex === 0 ? '...(field === "title" ? ["h1","h2","[class*=title]"] : []),' : ''}
      ${slideIndex === 0 ? '...(field === "subtitle" ? ["[class*=sub]","p"] : [])' : ''}
    ];
    const selectors = selectorList.flat().join(', ');
    return Array.from(document.querySelectorAll(selectors));
  };
  const applyInline = (el, styles) => {
    if (!el) return;
    if (styles.fontSize)   el.style.setProperty('font-size', styles.fontSize, 'important');
    if (styles.fontWeight) el.style.setProperty('font-weight', styles.fontWeight, 'important');
    if (styles.fontStyle)  el.style.setProperty('font-style', styles.fontStyle, 'important');
    if (styles.textDecoration) el.style.setProperty('text-decoration', styles.textDecoration, 'important');
    if (styles.textAlign)  el.style.setProperty('text-align', styles.textAlign, 'important');
    if (styles.color)      el.style.setProperty('color', styles.color, 'important');
  };
  
  const applyMediaStyles = () => {
    const bgStyles = byField['background'];
    if (!bgStyles) return;
    
    // Aplica object-position em imagens
    if (bgStyles.objectPosition) {
      const imgs = document.querySelectorAll('img[data-editable="image"], .img-crop-wrapper img');
      imgs.forEach(img => {
        img.style.setProperty('object-position', bgStyles.objectPosition, 'important');
      });
      
      // Aplica object-position em vídeos
      const videos = document.querySelectorAll('video[data-editable="video"], .video-container video');
      videos.forEach(video => {
        video.style.setProperty('object-position', bgStyles.objectPosition, 'important');
      });
    }
    
    // Aplica background-position em backgrounds CSS
    if (bgStyles.backgroundPositionX || bgStyles.backgroundPositionY) {
      const bgElements = document.querySelectorAll('[data-editable="background"], body, div, section, header, main, figure, article');
      bgElements.forEach(el => {
        const cs = window.getComputedStyle(el);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') {
          if (bgStyles.backgroundPositionX) {
            el.style.setProperty('background-position-x', bgStyles.backgroundPositionX, 'important');
          }
          if (bgStyles.backgroundPositionY) {
            el.style.setProperty('background-position-y', bgStyles.backgroundPositionY, 'important');
          }
        }
      });
    }
  };
  
  const run = () => {
    Object.entries(byField).forEach(([field, st]) => {
      if (field === 'background') {
        applyMediaStyles();
        return;
      }
      const nodes = pickNodes(field);
      if (!nodes.length) return;
      nodes.forEach(n => applyInline(n, st));
    });
  };
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(run, 0);
  } else {
    document.addEventListener('DOMContentLoaded', run);
  }
  // Retry pós-assets assíncronos do template
  setTimeout(run, 300);
  setTimeout(run, 1000);
})();
`;

    // CSS base + regras customizadas
    // Os templates são projetados para tamanhos fixos (1080x1350 ou 1170x1560)
    // O container pai deve manter a proporção correta e o iframe preenche 100%
    // Usamos zoom CSS para escalar o conteúdo do template para caber no iframe
    const injectedCSS = `
      html,body{margin:0 !important;padding:0 !important;overflow:hidden !important;box-sizing:border-box !important;width:100% !important;height:100% !important}
      *{box-sizing:border-box}
      body{transform-origin:top left}
      ${customRules.join('\n')}
    `;
    
    // Usa as dimensões do template já calculadas
    const baseWidth = templateDimensions.width;
    const baseHeight = templateDimensions.height;
    
    // Script para ajustar o zoom para preencher o container completamente
    // Importante: o container pai deve ter o aspect ratio correto do template!
    // Quando o aspect ratio está correto, o zoom vai preencher 100% sem cortar
    const zoomScript = `
(function(){
  function applyZoom(){
    // Dimensões do viewport do iframe
    var vw = window.innerWidth || document.documentElement.clientWidth || 320;
    var vh = window.innerHeight || document.documentElement.clientHeight || 400;
    
    // Dimensões originais do template
    var baseWidth = ${baseWidth};
    var baseHeight = ${baseHeight};
    
    // Calcula as escalas
    var scaleX = vw / baseWidth;
    var scaleY = vh / baseHeight;
    
    // Usa a menor escala para garantir que todo o conteúdo seja visível (contain)
    // Isso evita que qualquer parte seja cortada
    var scale = Math.min(scaleX, scaleY);
    
    // Aplica zoom no documento
    document.documentElement.style.zoom = scale;
    document.documentElement.style.transformOrigin = 'top left';
    
    // Fallback para Firefox que não suporta zoom
    if(navigator.userAgent.indexOf('Firefox') > -1){
      document.body.style.transform = 'scale(' + scale + ')';
      document.body.style.transformOrigin = 'top left';
      document.body.style.width = baseWidth + 'px';
      document.body.style.height = baseHeight + 'px';
    }
  }
  
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(applyZoom, 10);
  } else {
    document.addEventListener('DOMContentLoaded', applyZoom);
  }
  window.addEventListener('resize', applyZoom);
  setTimeout(applyZoom, 100);
  setTimeout(applyZoom, 300);
})();
`;

    // Combina os scripts
    const combinedJS = runtimePatcher + zoomScript;

    // Injeção robusta de CSS + script
    const injectAssets = (html: string, css: string, js: string) => {
      const styleTag = `<style>${css}</style>`;
      const scriptTag = `<script>${js}<\/script>`;
      if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${styleTag}${scriptTag}</head>`);
      if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}${styleTag}${scriptTag}`);
      if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}<head><meta charset="utf-8">${styleTag}${scriptTag}</head>`);
      if (/<body[^>]*>/i.test(html)) return html.replace(/<body[^>]*>/i, (m) => `<head><meta charset="utf-8">${styleTag}${scriptTag}</head>${m}`);
      return `<!doctype html><html><head><meta charset="utf-8">${styleTag}${scriptTag}</head><body>${html}</body></html>`;
    };

    const htmlWithStyles = injectAssets(slideContent, injectedCSS, combinedJS);

    return (
      <iframe
        srcDoc={htmlWithStyles}
        className={className}
        style={{ width:'100%', height:'100%', border:'none', display:'block', overflow:'hidden' }}
        sandbox="allow-same-origin allow-scripts"
        title="Slide preview"
        scrolling="no"
      />
    );
  }

  // Se for JSON, renderiza como card visual
  // Após verificar que não é ReactTemplate, fazemos type assertion para SlideData
  const jsonSlideData = slideData as SlideData;
  const backgroundImage = jsonSlideData.imagem_fundo || jsonSlideData.imagem_fundo2 || jsonSlideData.imagem_fundo3;
  const isVideo = backgroundImage?.includes('.mp4');

  // Estado para controlar se a mídia carregou com sucesso
  const [mediaLoaded, setMediaLoaded] = React.useState(true);
  const [mediaError, setMediaError] = React.useState(false);

  const handleMediaError = () => {
    console.warn('Failed to load media:', backgroundImage);
    setMediaLoaded(false);
    setMediaError(true);
  };

  const handleMediaLoad = () => {
    setMediaLoaded(true);
    setMediaError(false);
  };

  return (
    <div className={`relative w-full h-full flex flex-col justify-end p-8 ${className}`}>
      {/* Background */}
      {backgroundImage && mediaLoaded && !mediaError && (
        <div className="absolute inset-0">
          {isVideo ? (
            <video
              src={backgroundImage}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              onError={handleMediaError}
              onLoadedData={handleMediaLoad}
            />
          ) : (
            <img
              src={backgroundImage}
              alt={jsonSlideData.title || 'Slide background'}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={handleMediaError}
              onLoad={handleMediaLoad}
            />
          )}
          {/* Overlay escuro para melhor legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      )}

      {/* Conteúdo */}
      <div className="relative z-10 text-white">
        {jsonSlideData.title && (
          <h2 className="text-3xl font-bold mb-3 leading-tight drop-shadow-lg">
            {jsonSlideData.title}
          </h2>
        )}
        {jsonSlideData.subtitle && (
          <p className="text-lg opacity-90 leading-relaxed drop-shadow-md">
            {jsonSlideData.subtitle}
          </p>
        )}
      </div>

      {/* Thumbnail (se existir e não for o background principal) */}
      {jsonSlideData.thumbnail_url && jsonSlideData.thumbnail_url !== backgroundImage && (
        <div className="absolute top-4 right-4 w-20 h-20 rounded-lg overflow-hidden border-2 border-white/20">
          <img
            src={jsonSlideData.thumbnail_url}
            alt="Thumbnail"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Remove o thumbnail se falhar ao carregar
              const target = e.target as HTMLElement;
              const parent = target.parentElement;
              if (parent) parent.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SlideRenderer;