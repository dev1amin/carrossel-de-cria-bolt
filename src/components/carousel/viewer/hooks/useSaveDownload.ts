/**
 * Hook para gerenciar operações de salvamento e download do carrossel
 */

import { useCallback } from 'react';
import type { CarouselData, ElementStyles, TEMPLATE_DIMENSIONS } from '../../../../types/carousel';
import type { BlockSlideContent } from '../../../../types/blocks';
import { isBlockSlide } from '../../../../types/blocks';
import { updateGeneratedContent } from '../../../../services/generatedContent';
import { downloadSlidesAsPNG } from '../../../../services/carousel/download.service';
import { applyStylesFromState } from './useSlideRender';
import { renderBlocksToHtml } from '../../blocks/utils/renderBlocksToHtml';

export interface UseSaveDownloadParams {
  data: CarouselData;
  slides: string[];
  renderedSlides: string[];
  editedContent: Record<string, any>;
  elementStyles: Record<string, ElementStyles>;
  uploadedImages: Record<number, string>;
  contentId: number | null | undefined;
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>;
  slideWidth?: number;
  slideHeight?: number;
  
  // Setters
  setEditedContent: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setUploadedImages: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setHasUnsavedChanges: (value: boolean) => void;
  setIsSaving: (value: boolean) => void;
  
  // Callbacks
  addToast: (message: string, type: 'success' | 'error') => void;
  onSaveSuccess?: () => void;
}

export function useSaveDownload({
  data,
  slides,
  renderedSlides,
  editedContent,
  elementStyles,
  uploadedImages,
  contentId,
  iframeRefs,
  slideWidth = 1080,
  slideHeight = 1350,
  setEditedContent,
  setUploadedImages,
  setHasUnsavedChanges,
  setIsSaving,
  addToast,
  onSaveSuccess,
}: UseSaveDownloadParams) {
  
  /**
   * Salva as alterações na API
   * - Salva HTML formatado diretamente em title/subtitle
   * - Salva styles DENTRO de cada conteudo
   */
  const handleSave = useCallback(async () => {
    console.log('💾 Iniciando salvamento...', { contentId });
    
    if (!contentId) {
      addToast('Não é possível salvar: ID do conteúdo não encontrado.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const PLACEHOLDER_IMAGE = "https://i.imgur.com/kFVf8q3.png";
      
      // Construir o objeto result com os dados atualizados
      const updatedConteudos = data.conteudos.map((conteudo: any, index: number) => {
        // Se for um slide baseado em blocos, manter como está
        if (isBlockSlide(conteudo)) {
          return conteudo;
        }

        // Lógica original para slides de template
        const backgroundKey = `${index}-background`;
        
        // Criar cópia do conteúdo original
        const updatedConteudo = { ...conteudo };
        
        // Capturar o conteúdo formatado diretamente do DOM do iframe
        // Salva HTML inline (bold, italic, etc) diretamente em title/subtitle
        const ifr = iframeRefs.current[index];
        const doc = ifr?.contentDocument || ifr?.contentWindow?.document;
        
        if (doc) {
          // Captura título com formatação HTML - salva diretamente em title
          const titleEl = doc.querySelector('[data-editable="title"]');
          if (titleEl) {
            const titleHtml = titleEl.innerHTML;
            // Salva o HTML diretamente (com ou sem formatação)
            updatedConteudo.title = titleHtml || conteudo.title;
          }
          
          // Captura subtítulo com formatação HTML - salva diretamente em subtitle
          const subtitleEl = doc.querySelector('[data-editable="subtitle"]');
          if (subtitleEl) {
            const subtitleHtml = subtitleEl.innerHTML;
            updatedConteudo.subtitle = subtitleHtml || conteudo.subtitle;
          }
          
          // Captura cor de fundo do slide
          const slideEl = doc.querySelector('.slide') as HTMLElement;
          const targetEl = slideEl || doc.body;
          const cs = doc.defaultView?.getComputedStyle(targetEl);
          const bgColor = cs?.backgroundColor;
          
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            updatedConteudo.slideBackground = bgColor;
          }
        }
        
        // Coleta os estilos deste slide e salva DENTRO do conteudo
        const slideStyles: Record<string, any> = {};
        Object.entries(elementStyles).forEach(([key, styleObj]) => {
          const [slideIndexStr, elementType] = key.split('-');
          const slideIndex = parseInt(slideIndexStr, 10);
          
          if (slideIndex === index) {
            slideStyles[elementType] = styleObj;
          }
        });
        
        // Salva estilos dentro do conteudo
        if (Object.keys(slideStyles).length > 0) {
          updatedConteudo.styles = slideStyles;
        }
        
        // Determinar qual imagem de fundo usar e reorganizar as imagens
        const selectedBackground = editedContent[backgroundKey] || uploadedImages[index];
        
        if (selectedBackground) {
          // Coletar todas as imagens disponíveis (excluindo placeholder)
          const allImages = [
            conteudo.imagem_fundo,
            conteudo.imagem_fundo2,
            conteudo.imagem_fundo3,
            conteudo.imagem_fundo4,
            conteudo.imagem_fundo5,
            conteudo.imagem_fundo6,
          ].filter(img => img && img !== PLACEHOLDER_IMAGE);
          
          if (allImages.includes(selectedBackground)) {
            const otherImages = allImages.filter(img => img !== selectedBackground);
            updatedConteudo.imagem_fundo = selectedBackground;
            updatedConteudo.imagem_fundo2 = otherImages[0] || undefined;
            updatedConteudo.imagem_fundo3 = otherImages[1] || undefined;
            updatedConteudo.imagem_fundo4 = otherImages[2] || undefined;
            updatedConteudo.imagem_fundo5 = otherImages[3] || undefined;
            updatedConteudo.imagem_fundo6 = otherImages[4] || undefined;
          } else {
            updatedConteudo.imagem_fundo = selectedBackground;
          }
        } else {
          const hasAnyImage = conteudo.imagem_fundo || conteudo.imagem_fundo2 || conteudo.imagem_fundo3;
          if (!hasAnyImage) {
            updatedConteudo.imagem_fundo = PLACEHOLDER_IMAGE;
          }
        }
        
        // Remove campos undefined para não poluir o JSON
        Object.keys(updatedConteudo).forEach(key => {
          if (updatedConteudo[key] === undefined) {
            delete updatedConteudo[key];
          }
        });
        
        return updatedConteudo;
      });

      const result = {
        dados_gerais: data.dados_gerais,
        conteudos: updatedConteudos,
        // NÃO salva styles separado - cada conteudo tem seus próprios styles
      };

      // Log específico para posições de imagens salvas
      const positionStyles = Object.entries(elementStyles)
        .filter(([key]) => key.includes('-background'))
        .map(([key, style]) => ({
          key,
          objectPosition: style.objectPosition,
          backgroundPositionX: style.backgroundPositionX,
          backgroundPositionY: style.backgroundPositionY
        }));
      
      if (positionStyles.length > 0) {
        console.log('📐 Posições de imagens/vídeos sendo salvas:', positionStyles);
      }

      console.log('💾 Enviando para API:', { contentId, result });
      
      const response = await updateGeneratedContent(contentId, { result });
      
      console.log('✅ Resposta da API:', response);
      
      // Limpa os estados de edição pois os dados foram salvos
      setEditedContent({});
      setUploadedImages({});
      setHasUnsavedChanges(false);
      
      addToast('Alterações salvas com sucesso!', 'success');
      
      // Notificar o componente pai para recarregar a galeria
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error('❌ Erro ao salvar alterações:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addToast(`Erro ao salvar: ${errorMessage}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [
    contentId, 
    data, 
    editedContent, 
    elementStyles, 
    uploadedImages, 
    renderedSlides,
    slideWidth,
    slideHeight,
    addToast, 
    onSaveSuccess,
    setEditedContent,
    setUploadedImages,
    setHasUnsavedChanges,
    setIsSaving,
  ]);

  /**
   * Faz o download de todos os slides como PNG
   */
  const handleDownloadAll = useCallback(async () => {
    console.log('🎯 handleDownloadAll chamado - iniciando processo de download');
    try {
      console.log('📥 Iniciando download...');
      console.log('📊 Número de slides originais:', slides.length);
      console.log('📊 Número de renderedSlides:', renderedSlides.length);

      // 1. Aplica todos os estilos salvos em todos os iframes antes de capturar o srcdoc
      iframeRefs.current.forEach((ifr, slideIdx) => {
        if (ifr) {
          applyStylesFromState(ifr, slideIdx, editedContent, elementStyles);
        }
      });

      // 2. Atualiza o srcdoc de cada iframe com o HTML atual do DOM (após aplicar estilos)
      iframeRefs.current.forEach((ifr) => {
        if (ifr && ifr.contentDocument) {
          const doc = ifr.contentDocument;
          const html = doc.documentElement.outerHTML;
          ifr.srcdoc = html;
        }
      });

      // 3. Captura o srcDoc de cada iframe ou gera HTML para slides de blocos
      const capturedSlides: string[] = [];

      for (let i = 0; i < data.conteudos.length; i++) {
        const conteudo = data.conteudos[i];
        
        // Para slides de blocos, gera HTML diretamente
        if (isBlockSlide(conteudo)) {
          const blockHtml = renderBlocksToHtml(conteudo.blocks || [], {
            width: slideWidth,
            height: slideHeight,
            backgroundColor: (conteudo as BlockSlideContent).backgroundColor || '#ffffff',
          });
          const iframeHTML = `<iframe srcdoc="${blockHtml.replace(/"/g, '&quot;')}" class="w-full h-full border-0" title="Slide ${i + 1}" sandbox="allow-same-origin allow-scripts allow-autoplay" style="pointer-events: auto;"></iframe>`;
          capturedSlides.push(iframeHTML);
          console.log(`✅ Gerado HTML de blocos para slide ${i + 1}`);
          continue;
        }

        // Para slides de template, usa iframe
        const ifr = iframeRefs.current[i];
        if (!ifr) {
          console.warn(`⚠️ Iframe ${i} não encontrado`);
          if (renderedSlides[i]) {
            const iframeHTML = `<iframe srcdoc="${renderedSlides[i].replace(/"/g, '&quot;')}" class="w-full h-full border-0" title="Slide ${i + 1}" sandbox="allow-same-origin allow-scripts allow-autoplay" style="pointer-events: auto;"></iframe>`;
            capturedSlides.push(iframeHTML);
            console.log(`✅ Usando renderedSlides para slide ${i + 1}`);
          }
          continue;
        }

        const srcDocHTML = ifr.srcdoc;
        
        if (!srcDocHTML) {
          console.warn(`⚠️ srcDoc não disponível para o slide ${i + 1}, tentando usar renderedSlides`);
          if (renderedSlides[i]) {
            capturedSlides.push(renderedSlides[i]);
            console.log(`✅ Usando renderedSlides para slide ${i + 1}`);
            continue;
          } else {
            console.warn(`⚠️ renderedSlides também não disponível para slide ${i + 1}`);
            continue;
          }
        }
        
        const iframeHTML = `<iframe srcdoc="${srcDocHTML.replace(/"/g, '&quot;')}" class="w-full h-full border-0" title="Slide ${i + 1}" sandbox="allow-same-origin allow-scripts allow-autoplay" style="pointer-events: auto;"></iframe>`;
        capturedSlides.push(iframeHTML);
        console.log(`✅ Capturado iframe completo do slide ${i + 1}`);
      }

      console.log('📊 Slides capturados:', capturedSlides.length);

      // Se nenhum slide foi capturado, tenta criar iframes dos renderedSlides
      if (capturedSlides.length === 0 && renderedSlides.length > 0) {
        console.log('🔄 Nenhum slide capturado, criando iframes dos renderedSlides');
        renderedSlides.forEach((slide, i) => {
          const iframeHTML = `<iframe srcdoc="${slide.replace(/"/g, '&quot;')}" class="w-full h-full border-0" title="Slide ${i + 1}" sandbox="allow-same-origin allow-scripts allow-autoplay" style="pointer-events: auto;"></iframe>`;
          capturedSlides.push(iframeHTML);
        });
        console.log('📊 Iframes criados dos renderedSlides:', capturedSlides.length);
      }

      if (capturedSlides.length === 0) {
        throw new Error('Nenhum slide capturado para download');
      }
      
      // Usa o serviço de download
      console.log('📥 Iniciando download de', capturedSlides.length, 'slides...');
      await downloadSlidesAsPNG(capturedSlides, (current, total) => {
        console.log(`📊 Progresso: ${current}/${total}`);
      });
      
      addToast(`${capturedSlides.length} slides baixados com sucesso!`, 'success');
    } catch (error) {
      console.error('❌ Erro ao baixar slides:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      addToast(`Erro ao baixar slides: ${errorMessage}`, 'error');
    }
  }, [slides, renderedSlides, editedContent, elementStyles, iframeRefs, data, slideWidth, slideHeight, addToast]);

  return { handleSave, handleDownloadAll };
}
