/**
 * UnifiedSlideRenderer - Renderizador unificado que escolhe entre iframe e React
 * 
 * Este componente decide automaticamente:
 * - Templates normais → usa iframe (SlideRenderer)
 * - Templates "-react" → usa React nativo (ReactSlideRenderer)
 */
import React, { useMemo } from 'react';
import SlideRenderer from '../SlideRenderer';
import { ReactSlideRenderer } from '../../templates/react';
import { templateService } from '../../services/carousel';

interface SlideData {
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

interface UnifiedSlideRendererProps {
  // Para modo HTML (iframe)
  slideContent?: string;
  
  // Para modo React
  slideData?: SlideData;
  dadosGerais?: DadosGerais;
  
  // Comum
  templateId: string;
  slideIndex?: number;
  styles?: Record<string, any>;
  className?: string;
  containerWidth?: number;
  containerHeight?: number;
}

const UnifiedSlideRenderer: React.FC<UnifiedSlideRendererProps> = ({
  slideContent,
  slideData,
  dadosGerais,
  templateId,
  slideIndex = 0,
  styles = {},
  className = '',
  containerWidth,
  containerHeight,
}) => {
  // Verifica se é um template React
  const isReact = useMemo(() => {
    return templateService.isReactTemplate(templateId);
  }, [templateId]);

  // Se for template React e tiver dados do slide
  if (isReact && slideData) {
    return (
      <ReactSlideRenderer
        templateId={templateId}
        slideIndex={slideIndex}
        slideData={slideData}
        dadosGerais={dadosGerais}
        styles={styles[String(slideIndex)] || {}}
        className={className}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
      />
    );
  }

  // Fallback para iframe (comportamento original)
  if (slideContent) {
    return (
      <SlideRenderer
        slideContent={slideContent}
        className={className}
        slideIndex={slideIndex}
        styles={styles}
        templateId={templateId.replace('-react', '')}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
      />
    );
  }

  // Sem conteúdo
  return (
    <div className={`flex items-center justify-center bg-gray-900 text-gray-400 ${className}`}>
      <span>Slide não disponível</span>
    </div>
  );
};

export default UnifiedSlideRenderer;
