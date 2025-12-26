/**
 * ReactSlideRenderer - Renderizador de slides usando React puro (sem iframes)
 * 
 * VANTAGENS SOBRE IFRAMES:
 * - Usa ~10x menos memória RAM
 * - Renderização instantânea (sem criar contextos separados)
 * - Fontes carregadas apenas 1x (compartilhadas)
 * - CSS do Tailwind compartilhado
 * - Virtual DOM = só re-renderiza diferenças
 */
import React, { useMemo, useCallback } from 'react';
import { renderTemplate1Slide } from './template1';
import { SLIDE_COMPONENTS as Template2Components } from './template2';
import { SLIDE_COMPONENTS as Template3Components } from './template3';
import { SLIDE_COMPONENTS as Template4Components } from './template4';
import { SLIDE_COMPONENTS as Template5Components } from './template5';
import { SLIDE_COMPONENTS as Template6Components } from './template6';
import { SLIDE_COMPONENTS as Template7Components } from './template7';
import { SLIDE_COMPONENTS as Template8Components } from './template8';

// Dimensões dos templates
const TEMPLATE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1': { width: 1080, height: 1350 },
  '1-react': { width: 1080, height: 1350 },
  '2': { width: 1080, height: 1350 },
  '2-react': { width: 1080, height: 1350 },
  '3': { width: 1080, height: 1350 },
  '3-react': { width: 1080, height: 1350 },
  '4': { width: 1080, height: 1350 },
  '4-react': { width: 1080, height: 1350 },
  '5': { width: 1080, height: 1350 },
  '5-react': { width: 1080, height: 1350 },
  '6': { width: 1080, height: 1350 },
  '6-react': { width: 1080, height: 1350 },
  '7': { width: 1170, height: 1560 },
  '7-react': { width: 1170, height: 1560 },
  '8': { width: 1170, height: 1560 },
  '8-react': { width: 1170, height: 1560 },
};

/**
 * Retorna as dimensões de um template
 */
export function getTemplateDimensions(templateId: string): { width: number; height: number } {
  const baseId = templateId.replace('-react', '');
  return TEMPLATE_DIMENSIONS[baseId] || { width: 1080, height: 1350 };
}

interface SlideData {
  id?: string;
  layoutIndex?: number;
  title?: string;
  subtitle?: string;
  imagem_fundo?: string;
  imagem_fundo2?: string;
  imagem_fundo3?: string;
  thumbnail_url?: string;
}

interface DadosGerais {
  nome?: string;
  arroba?: string;
  foto_perfil?: string;
  template?: string;
}

// Tipo de elemento editável
export type EditableElementType = 'title' | 'subtitle' | 'image' | 'background' | 'nome' | 'arroba' | 'avatar' | null;

interface ReactSlideRendererProps {
  templateId: string;
  slideIndex: number;
  slideData: SlideData;
  dadosGerais?: DadosGerais;
  styles?: Record<string, any>;
  className?: string;
  containerWidth?: number;
  containerHeight?: number;
  onElementClick?: (elementType: EditableElementType, slideIndex: number, event?: React.MouseEvent) => void;
  onElementDoubleClick?: (elementType: EditableElementType, slideIndex: number, element: HTMLElement) => void;
  onImageDrag?: (elementType: EditableElementType, event: React.MouseEvent, currentPosition?: string) => void;
}

/**
 * Componente principal que renderiza um slide React
 * Substitui o iframe do SlideRenderer.tsx
 */
export const ReactSlideRenderer: React.FC<ReactSlideRendererProps> = ({
  templateId,
  slideIndex,
  slideData,
  dadosGerais,
  styles = {},
  className = '',
  containerWidth,
  containerHeight,
  onElementClick,
  onElementDoubleClick,
  onImageDrag,
}) => {
  // Obtém dimensões do template
  const templateDimensions = useMemo(() => {
    const baseId = templateId.replace('-react', '');
    return TEMPLATE_DIMENSIONS[baseId] || { width: 1080, height: 1350 };
  }, [templateId]);

  // Calcula escala para caber no container
  const scale = useMemo(() => {
    if (!containerWidth || !containerHeight) return 1;
    
    const scaleX = containerWidth / templateDimensions.width;
    const scaleY = containerHeight / templateDimensions.height;
    
    return Math.min(scaleX, scaleY);
  }, [containerWidth, containerHeight, templateDimensions]);

  // Handler de clique para detectar elementos editáveis
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!onElementClick) return;
    
    const target = e.target as HTMLElement;
    
    // Debug log
    console.log('🖱️ Click no slide React:', { 
      target: target.tagName, 
      className: target.className,
      dataEditable: target.getAttribute('data-editable'),
      alt: target.getAttribute('alt'),
      slideIndex,
      hasSelectedClass: target.classList.contains('selected'),
    });
    
    // Busca o elemento editável mais próximo
    const editableEl = target.closest('[data-editable]') as HTMLElement | null;
    
    if (editableEl) {
      const elementType = editableEl.getAttribute('data-editable') as EditableElementType;
      
      // Verifica se é avatar pelo alt
      if (target.tagName === 'IMG' && target.getAttribute('alt') === 'Avatar') {
        console.log('✅ Avatar detectado');
        e.stopPropagation();
        e.preventDefault();
        onElementClick('avatar' as any, slideIndex, e);
        return;
      }
      
      console.log('✅ Elemento editável encontrado:', elementType);
      e.stopPropagation();
      e.preventDefault();
      onElementClick(elementType, slideIndex, e);
      
      // Remove classe de outros elementos e limpa pinças anteriores
      document.querySelectorAll('[data-editable].selected').forEach(el => {
        el.classList.remove('selected');
      });
      document.querySelectorAll('.resize-handle').forEach(el => el.remove());
      
      // Adiciona classe de seleção visual
      editableEl.classList.add('selected');
      
      // Se for imagem, adiciona pinças de resize
      if (elementType === 'image' && editableEl.tagName === 'IMG') {
        const rect = editableEl.getBoundingClientRect();
        
        // Pinça superior
        const topHandle = document.createElement('div');
        topHandle.className = 'resize-handle resize-handle-top';
        topHandle.style.cssText = `
          position: fixed;
          top: ${rect.top - 12}px;
          left: ${rect.left + rect.width / 2 - 25}px;
          width: 50px;
          height: 10px;
          background: #4167B2;
          border-radius: 5px;
          cursor: ns-resize;
          z-index: 10000;
          pointer-events: all;
        `;
        
        // Event listener para arrastar pinça superior
        let startY = 0;
        let startHeight = 0;
        const handleTopDrag = (e: MouseEvent) => {
          const delta = startY - e.clientY;
          const newHeight = Math.max(50, startHeight + delta);
          (editableEl as HTMLImageElement).style.height = `${newHeight}px`;
          
          // Atualiza posição das pinças
          const rect = editableEl.getBoundingClientRect();
          topHandle.style.top = `${rect.top - 12}px`;
          bottomHandle.style.top = `${rect.bottom + 2}px`;
          
          console.log('🔼 Redimensionando via pinça superior:', newHeight);
        };
        
        topHandle.addEventListener('mousedown', (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          startY = e.clientY;
          startHeight = editableEl.offsetHeight;
          
          const handleMouseMove = (e: MouseEvent) => handleTopDrag(e);
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
        
        document.body.appendChild(topHandle);
        
        // Pinça inferior
        const bottomHandle = document.createElement('div');
        bottomHandle.className = 'resize-handle resize-handle-bottom';
        bottomHandle.style.cssText = `
          position: fixed;
          top: ${rect.bottom + 2}px;
          left: ${rect.left + rect.width / 2 - 25}px;
          width: 50px;
          height: 10px;
          background: #4167B2;
          border-radius: 5px;
          cursor: ns-resize;
          z-index: 10000;
          pointer-events: all;
        `;
        
        // Event listener para arrastar pinça inferior
        const handleBottomDrag = (e: MouseEvent) => {
          const delta = e.clientY - startY;
          const newHeight = Math.max(50, startHeight + delta);
          (editableEl as HTMLImageElement).style.height = `${newHeight}px`;
          
          // Atualiza posição das pinças
          const rect = editableEl.getBoundingClientRect();
          topHandle.style.top = `${rect.top - 12}px`;
          bottomHandle.style.top = `${rect.bottom + 2}px`;
          
          console.log('🔽 Redimensionando via pinça inferior:', newHeight);
        };
        
        bottomHandle.addEventListener('mousedown', (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          startY = e.clientY;
          startHeight = editableEl.offsetHeight;
          
          const handleMouseMove = (e: MouseEvent) => handleBottomDrag(e);
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        });
        
        document.body.appendChild(bottomHandle);
        
        console.log('✅ Pinças de resize adicionadas com funcionalidade');
      }
      
      console.log('✅ Classe selected adicionada, tipo:', elementType, 'isImage:', elementType === 'image', 'hasClass:', editableEl.classList.contains('selected'));
    } else {
      // Não encontrou elemento editável diretamente clicado
      // Verifica se existe um background editável no slide (pode estar atrás de outros elementos)
      const slideContainer = target.closest('.react-slide-renderer');
      if (slideContainer) {
        const backgroundEl = slideContainer.querySelector('[data-editable="background"]') as HTMLElement | null;
        if (backgroundEl) {
          // Verifica se o background tem background-image
          const computedStyle = window.getComputedStyle(backgroundEl);
          const bgImage = computedStyle.backgroundImage || '';
          
          if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
            console.log('🎯 Clique em área vazia - selecionando background com imagem:', {
              bgImage: bgImage.substring(0, 100),
              hasGradient: bgImage.includes('gradient')
            });
            
            e.stopPropagation();
            e.preventDefault();
            
            // Remove seleções anteriores
            document.querySelectorAll('[data-editable].selected').forEach(el => {
              el.classList.remove('selected');
            });
            document.querySelectorAll('.resize-handle').forEach(el => el.remove());
            
            // Seleciona o background
            backgroundEl.classList.add('selected');
            onElementClick('background', slideIndex, e);
            return;
          }
        }
      }
      
      // Clique fora de elementos editáveis - deseleciona
      console.log('📦 Clique fora de elementos editáveis');
      document.querySelectorAll('.resize-handle').forEach(el => el.remove());
      onElementClick(null, slideIndex, e);
    }
  }, [onElementClick, slideIndex]);

  // Handler de mousedown para evitar drag quando clicar em elementos editáveis
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const editableEl = target.closest('[data-editable]') as HTMLElement | null;
    
    // Se clicar em elemento editável, impede o drag do canvas
    if (editableEl) {
      e.stopPropagation();
      const elementType = editableEl.getAttribute('data-editable') as EditableElementType;
      console.log('🛑 MouseDown em elemento editável:', elementType, 'tagName:', editableEl.tagName);
      
      // Se for imagem ou background, permite drag para ajustar posição
      if ((elementType === 'image' || elementType === 'background') && onImageDrag) {
        // Usa backgroundPosition para divs, objectPosition para imgs
        const isBackgroundDiv = editableEl.tagName === 'DIV';
        const propertyName = isBackgroundDiv ? 'backgroundPosition' : 'objectPosition';
        const currentPosition = (styles?.[elementType] as any)?.[propertyName] || 'center center';
        
        console.log('🎨 Iniciando drag:', {
          elementType,
          isBackgroundDiv,
          propertyName,
          currentPosition
        });
        
        onImageDrag(elementType, e, currentPosition);
      }
    } else {
      // Não encontrou elemento editável diretamente
      // Verifica se existe um background editável no slide que esteja selecionado
      const slideContainer = target.closest('.react-slide-renderer');
      if (slideContainer) {
        const backgroundEl = slideContainer.querySelector('[data-editable="background"].selected') as HTMLElement | null;
        if (backgroundEl && onImageDrag) {
          console.log('🎨 MouseDown em área com background selecionado - iniciando drag');
          e.stopPropagation();
          
          const currentPosition = (styles?.['background'] as any)?.backgroundPosition || 'center center';
          onImageDrag('background', e, currentPosition);
        }
      }
    }
  }, [onImageDrag, styles]);

  // Handler de duplo clique para edição inline de texto
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!onElementDoubleClick) return;
    
    const target = e.target as HTMLElement;
    const editableEl = target.closest('[data-editable]') as HTMLElement | null;
    
    if (editableEl) {
      const elementType = editableEl.getAttribute('data-editable') as EditableElementType;
      // Só permite edição inline em elementos de texto
      if (elementType === 'title' || elementType === 'subtitle' || elementType === 'nome' || elementType === 'arroba') {
        console.log('✏️ Duplo clique para edição inline:', elementType);
        e.stopPropagation();
        e.preventDefault();
        onElementDoubleClick(elementType, slideIndex, editableEl);
      }
    }
  }, [onElementDoubleClick, slideIndex]);

  // Seleciona o renderizador correto baseado no templateId
  const slideElement = useMemo(() => {
    const baseId = templateId.replace('-react', '');
    const layoutIndex = slideData.layoutIndex ?? slideIndex;
    
    switch (baseId) {
      case '1':
        return renderTemplate1Slide(layoutIndex, slideData, dadosGerais, styles);
      case '2': {
        const Component = Template2Components[layoutIndex] || Template2Components[1];
        return <Component data={slideData} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
      }
      case '3': {
        const Component = Template3Components[layoutIndex] || Template3Components[1];
        return <Component data={slideData} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
      }
      case '4': {
        const Component = Template4Components[layoutIndex] || Template4Components[1];
        return <Component data={slideData} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
      }
      case '5': {
        const Component = Template5Components[layoutIndex] || Template5Components[1];
        return <Component data={slideData} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
      }
      case '6': {
        const Component = Template6Components[layoutIndex] || Template6Components[1];
        return <Component data={slideData} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
      }
      case '7': {
        const Component = Template7Components[layoutIndex] || Template7Components[0];
        return <Component data={slideData} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
      }
      case '8': {
        const Component = Template8Components[layoutIndex] || Template8Components[0];
        return <Component data={slideData} dadosGerais={dadosGerais} slideIndex={slideIndex} />;
      }
      default:
        return renderTemplate1Slide(layoutIndex, slideData, dadosGerais, styles);
    }
  }, [templateId, slideIndex, slideData, dadosGerais, styles]);

  // Gera CSS dinâmico para aplicar estilos editados
  const dynamicStyles = useMemo(() => {
    if (!styles || Object.keys(styles).length === 0) {
      // Mesmo sem estilos customizados, aplica posição padrão para backgrounds
      return `[data-editable="background"] { background-position: center center !important; }\n`;
    }
    
    let css = '';
    let hasBackgroundStyles = false;
    
    // Aplica estilos para cada tipo de elemento
    Object.entries(styles).forEach(([elementType, elementStyles]) => {
      if (!elementStyles || typeof elementStyles !== 'object') return;
      
      const styleRules: string[] = [];
      
      if ((elementStyles as any).fontSize) styleRules.push(`font-size: ${(elementStyles as any).fontSize} !important`);
      if ((elementStyles as any).fontWeight) styleRules.push(`font-weight: ${(elementStyles as any).fontWeight} !important`);
      if ((elementStyles as any).fontStyle) styleRules.push(`font-style: ${(elementStyles as any).fontStyle} !important`);
      if ((elementStyles as any).textAlign) styleRules.push(`text-align: ${(elementStyles as any).textAlign} !important`);
      if ((elementStyles as any).color) styleRules.push(`color: ${(elementStyles as any).color} !important`);
      if ((elementStyles as any).textDecoration) styleRules.push(`text-decoration: ${(elementStyles as any).textDecoration} !important`);
      if ((elementStyles as any).objectPosition) styleRules.push(`object-position: ${(elementStyles as any).objectPosition} !important`);
      if ((elementStyles as any).objectFit) styleRules.push(`object-fit: ${(elementStyles as any).objectFit} !important`);
      if ((elementStyles as any).backgroundImage) styleRules.push(`background-image: ${(elementStyles as any).backgroundImage} !important`);
      if ((elementStyles as any).backgroundSize) styleRules.push(`background-size: ${(elementStyles as any).backgroundSize} !important`);
      if ((elementStyles as any).backgroundPosition) {
        styleRules.push(`background-position: ${(elementStyles as any).backgroundPosition} !important`);
        if (elementType === 'background') hasBackgroundStyles = true;
      }
      if ((elementStyles as any).backgroundColor) styleRules.push(`background-color: ${(elementStyles as any).backgroundColor} !important`);
      
      if (styleRules.length > 0) {
        css += `[data-editable="${elementType}"] { ${styleRules.join('; ')}; }\n`;
      }
    });
    
    // Se não há estilos de background customizados, adiciona posição padrão
    if (!hasBackgroundStyles) {
      css += `[data-editable="background"] { background-position: center center !important; }\n`;
    }
    
    return css;
  }, [styles]);

  return (
    <div
      className={`react-slide-renderer ${className}`}
      style={{
        width: containerWidth || templateDimensions.width,
        height: containerHeight || templateDimensions.height,
        overflow: 'hidden',
        position: 'relative',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Estilos para seleção de elementos + estilos dinâmicos editados */}
      <style>{`
        [data-editable] {
          cursor: pointer;
          transition: outline 0.15s ease, box-shadow 0.15s ease;
          position: relative;
        }
        [data-editable]:hover {
          outline: 2px dashed rgba(65, 103, 178, 0.5);
          outline-offset: 2px;
        }
        [data-editable].selected {
          outline: 3px solid #4167B2 !important;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(65, 103, 178, 0.2);
        }
        /* Estilos para backgrounds clicáveis */
        [data-editable="background"] {
          pointer-events: all !important;
          z-index: 1;
        }
        /* Quando background está selecionado, NÃO aumenta z-index para não cobrir texto */
        [data-editable="background"].selected {
          /* Mantém z-index baixo para não cobrir textos */
          z-index: 1 !important;
          pointer-events: all !important;
        }
        /* Garante que textos sempre fiquem por cima de backgrounds */
        [data-editable="title"],
        [data-editable="subtitle"],
        [data-editable="nome"],
        [data-editable="arroba"] {
          z-index: 10 !important;
          pointer-events: auto !important;
        }
        /* Estilos para imagens selecionadas */
        img[data-editable="image"].selected {
          outline: 3px solid #4167B2 !important;
          outline-offset: 2px;
          box-shadow: 
            0 0 0 4px rgba(65, 103, 178, 0.2),
            0 -14px 0 0 #4167B2,
            0 14px 0 0 #4167B2 !important;
          position: relative;
          z-index: 100 !important;
        }
        ${dynamicStyles}
      `}</style>
      <div
        style={{
          // Usa zoom ao invés de transform:scale para texto nítido
          zoom: scale,
          width: templateDimensions.width,
          height: templateDimensions.height,
          // Propriedades para renderização nítida
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {slideElement}
      </div>
    </div>
  );
};

export default ReactSlideRenderer;
