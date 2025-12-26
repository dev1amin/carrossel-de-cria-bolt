import { useState } from 'react';
import { CarouselData, GenerationQueueItem } from '../../types/carousel';
import { AVAILABLE_TEMPLATES } from '../../types/carousel';
import { generateCarousel, templateService, templateRenderer } from '../../services/carousel';
import type { GenerationOptions } from '../../components/carousel/TemplateSelectionModal';

export const useCarousel = () => {
  const [generationQueue, setGenerationQueue] = useState<GenerationQueueItem[]>([]);
  const [renderedSlides, setRenderedSlides] = useState<string[] | null>(null);
  const [carouselData, setCarouselData] = useState<CarouselData | null>(null);

  const handleGenerateCarousel = async (code: string, templateId: string, generationOptions?: GenerationOptions) => {
    const template = AVAILABLE_TEMPLATES.find(t => t.id === templateId);
    const queueItem: GenerationQueueItem = {
      id: `${code}-${templateId}-${Date.now()}`,
      postCode: code,
      templateId,
      templateName: template?.name || `Template ${templateId}`,
      status: 'generating',
      createdAt: Date.now(),
    };

    setGenerationQueue(prev => [...prev, queueItem]);

    try {
      console.log(`Generating carousel for post: ${code} with template: ${templateId}`);
      if (generationOptions) {
        console.log('Generation options:', generationOptions);
      }
      const result = await generateCarousel(code, templateId, undefined, undefined, undefined, generationOptions);
      console.log('Carousel generated successfully:', result);

      if (result && result.length > 0) {
        const carouselData = result[0];
        const responseTemplateId = carouselData.dados_gerais.template;
        
        // Normaliza o ID do template (mapeia "1" -> "1-react", etc.)
        const normalizedTemplateId = templateService.normalizeTemplateId(responseTemplateId);
        
        let rendered: string[];
        
        // Se for template React, retorna dados JSON para o ReactSlideRenderer
        if (templateService.isReactTemplate(normalizedTemplateId)) {
          console.log(`⚡ Template React detectado: ${normalizedTemplateId}`);
          rendered = carouselData.conteudos.map((slideData: any, index: number) => 
            JSON.stringify({
              __reactTemplate: true,
              templateId: normalizedTemplateId,
              slideIndex: index,
              slideData: slideData,
              dadosGerais: carouselData.dados_gerais,
            })
          );
        } else {
          console.log(`Fetching template ${normalizedTemplateId}...`);
          const templateSlides = await templateService.fetchTemplate(normalizedTemplateId);

          // Configura a compatibilidade do template no renderer
          const templateConfig = AVAILABLE_TEMPLATES.find(t => t.id === normalizedTemplateId);
          if (templateConfig) {
            templateRenderer.setTemplateCompatibility(templateConfig.compatibility);
            console.log(`Template compatibility set to: ${templateConfig.compatibility}`);
          }

          console.log('Rendering slides with data...');
          rendered = templateRenderer.renderAllSlides(templateSlides, carouselData);
        }

        setRenderedSlides(rendered);
        setCarouselData(carouselData);

        setGenerationQueue(prev =>
          prev.map(item =>
            item.id === queueItem.id
              ? { ...item, status: 'completed', completedAt: Date.now() }
              : item
          )
        );

        return { rendered, carouselData };
      }
    } catch (error) {
      console.error('Failed to generate carousel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      setGenerationQueue(prev =>
        prev.map(item =>
          item.id === queueItem.id
            ? { ...item, status: 'error', errorMessage, completedAt: Date.now() }
            : item
        )
      );

      throw error;
    }
  };

  const closeCarousel = () => {
    setRenderedSlides(null);
    setCarouselData(null);
  };

  return {
    generationQueue,
    renderedSlides,
    carouselData,
    handleGenerateCarousel,
    closeCarousel,
  };
};
