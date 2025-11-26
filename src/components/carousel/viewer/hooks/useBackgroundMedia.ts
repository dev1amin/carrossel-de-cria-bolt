/**
 * Hook para gerenciar mudanças de imagem/vídeo de background nos slides
 * Extrai a lógica complexa de handleBackgroundImageChange do CarouselViewer
 */

import { useCallback } from 'react';
import type { ElementType, ElementStyles } from '../../../../types/carousel';
import {
  logd,
  isVideoUrl,
  cleanupAltArtifacts,
  forceVideoStyle,
  removeAllPlayOverlays,
  killPlayOverlays,
  attachPlayOverlay,
  ensureImgCropWrapper,
  ensureHostResizeObserver,
  disposePinchersInDoc,
  normFill,
  syncContainerWithContent,
  applyBackgroundImageImmediate,
  attachResizePinchers,
} from '../viewerUtils';

export interface UseBackgroundMediaParams {
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>;
  selectedImageRefs: React.MutableRefObject<Record<number, HTMLImageElement | null>>;
  templateCompatibility: 'image-only' | 'video-only' | 'all' | 'text-only' | 'video-image';
  expandedLayers: Set<number>;
  
  // Setters
  setSelectedElement: (value: { slideIndex: number; element: ElementType | null }) => void;
  setFocusedSlide: (value: number) => void;
  setExpandedLayers: React.Dispatch<React.SetStateAction<Set<number>>>;
  
  // Helpers
  addToast: (message: string, type: 'success' | 'error') => void;
  updateEditedValue: (slideIndex: number, field: string, value: any) => void;
  updateElementStyle: (slideIndex: number, element: ElementType, prop: keyof ElementStyles, value: string) => void;
  toggleLayer: (index: number) => void;
  clearAllSelections: () => void;
}

export function useBackgroundMedia({
  iframeRefs,
  selectedImageRefs,
  templateCompatibility,
  expandedLayers,
  setSelectedElement,
  setFocusedSlide,
  setExpandedLayers,
  addToast,
  updateEditedValue,
  updateElementStyle,
  toggleLayer,
  clearAllSelections,
}: UseBackgroundMediaParams) {
  
  const handleBackgroundImageChange = useCallback((slideIndex: number, imageUrl: string) => {
    // BLOQUEIA vídeos se o template não suportar
    const isVideo = imageUrl && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(imageUrl);
    if (isVideo && (templateCompatibility === 'image-only' || templateCompatibility === 'text-only')) {
      console.warn(`🚫 Cannot use video in template with compatibility: ${templateCompatibility}`);
      addToast('This template does not support videos', 'error');
      return;
    }
    
    const ifr = iframeRefs.current[slideIndex];
    const d = ifr?.contentDocument || ifr?.contentWindow?.document;
    if (!d) {
      updateEditedValue(slideIndex, 'background', imageUrl);
      return;
    }

    const selectedImg = selectedImageRefs.current[slideIndex];
    
    // Detectar se há um vídeo selecionado (mesmo que selectedImg seja null)
    const selectedVideoContainer = d.querySelector('.video-container.selected, .video-container[data-cv-selected="1"]') as HTMLElement | null;
    const currentVideo = selectedVideoContainer?.querySelector('video') as HTMLVideoElement | null;
    
    // CASO ESPECIAL: Trocar de VÍDEO para IMAGEM (re-renderização completa)
    if (currentVideo && !isVideoUrl(imageUrl)) {
      handleVideoToImage(d, slideIndex, imageUrl, selectedVideoContainer!, currentVideo);
      return;
    }
    
    if (selectedImg) {
      handleSelectedImage(d, slideIndex, imageUrl, selectedImg);
    } else {
      handleNoSelectedImage(d, slideIndex, imageUrl);
    }

    try {
      const d2 = iframeRefs.current[slideIndex]?.contentDocument || iframeRefs.current[slideIndex]?.contentWindow?.document;
      if (d2 && !isVideoUrl(imageUrl)) killPlayOverlays(d2.body);
    } catch {}

    setSelectedElement({ slideIndex, element: 'background' });
    if (!expandedLayers.has(slideIndex)) toggleLayer(slideIndex);
    setFocusedSlide(slideIndex);
    updateEditedValue(slideIndex, 'background', imageUrl);

    setTimeout(() => {
      try {
        const ev = new Event('cv-rebind');
        d?.dispatchEvent(ev);
      } catch {}
    }, 50);
  }, [
    templateCompatibility, 
    iframeRefs, 
    selectedImageRefs, 
    expandedLayers,
    addToast, 
    updateEditedValue,
    updateElementStyle,
    toggleLayer,
    setSelectedElement,
    setFocusedSlide,
    clearAllSelections,
  ]);

  /**
   * Troca de VÍDEO para IMAGEM (re-renderização completa)
   */
  function handleVideoToImage(
    d: Document,
    slideIndex: number,
    imageUrl: string,
    selectedVideoContainer: HTMLElement,
    currentVideo: HTMLVideoElement
  ) {
    console.log('🔄 Trocando de VÍDEO para IMAGEM - Re-renderização COMPLETA do slide');
    
    try {
      // PASSO 1: PRESERVAR dimensões E estilos visuais do container ANTES do reset
      const cs = d.defaultView?.getComputedStyle(selectedVideoContainer);
      const preservedStyles = {
        width: selectedVideoContainer.offsetWidth,
        height: selectedVideoContainer.offsetHeight,
        borderRadius: cs?.borderRadius || '',
        boxShadow: cs?.boxShadow || '',
        marginTop: cs?.marginTop || '',
        position: cs?.position || 'relative',
        overflow: cs?.overflow || 'hidden',
      };
      
      console.log('📏 Estilos preservados:', preservedStyles);
      
      // PASSO 2: Limpar COMPLETAMENTE o vídeo
      try { currentVideo.pause(); } catch {}
      try { currentVideo.src = ''; } catch {}
      try { currentVideo.load(); } catch {}
      try { currentVideo.remove(); } catch {}
      
      // PASSO 3: Remover TODOS os overlays, pinças e listeners
      killPlayOverlays(selectedVideoContainer);
      removeAllPlayOverlays(d);
      try { disposePinchersInDoc(d); } catch {}
      
      // PASSO 4: Limpar COMPLETAMENTE o estado do container
      selectedVideoContainer.classList.remove('selected', 'video-container');
      selectedVideoContainer.removeAttribute('data-cv-selected');
      selectedVideoContainer.removeAttribute('data-cv-height');
      
      // PASSO 5: SALVAR estilos em data-attributes (backup adicional)
      selectedVideoContainer.setAttribute('data-original-border-radius', preservedStyles.borderRadius);
      selectedVideoContainer.setAttribute('data-original-box-shadow', preservedStyles.boxShadow);
      selectedVideoContainer.setAttribute('data-original-margin-top', preservedStyles.marginTop);
      
      // PASSO 6: RESETAR O CONTAINER - Limpar TODO o conteúdo interno
      console.log('🧹 Limpando completamente o container...');
      selectedVideoContainer.innerHTML = '';
      selectedVideoContainer.style.cssText = '';
      
      // PASSO 7: RECONSTRUIR o container como wrapper de imagem
      console.log('🏗️ Reconstruindo container como img-crop-wrapper...');
      selectedVideoContainer.className = 'img-crop-wrapper';
      
      // Reaplica estilos estruturais
      selectedVideoContainer.style.position = preservedStyles.position;
      selectedVideoContainer.style.overflow = preservedStyles.overflow;
      selectedVideoContainer.style.width = `${preservedStyles.width}px`;
      selectedVideoContainer.style.height = `${preservedStyles.height}px`;
      
      // IMPORTANTE: Reaplica estilos visuais preservados
      if (preservedStyles.borderRadius && preservedStyles.borderRadius !== '0px') {
        selectedVideoContainer.style.borderRadius = preservedStyles.borderRadius;
        console.log('🎨 Border-radius reaplicado:', preservedStyles.borderRadius);
      }
      if (preservedStyles.boxShadow && preservedStyles.boxShadow !== 'none') {
        selectedVideoContainer.style.boxShadow = preservedStyles.boxShadow;
        console.log('🎨 Box-shadow reaplicado:', preservedStyles.boxShadow);
      }
      if (preservedStyles.marginTop && preservedStyles.marginTop !== '0px') {
        selectedVideoContainer.style.marginTop = preservedStyles.marginTop;
        console.log('🎨 Margin-top reaplicado:', preservedStyles.marginTop);
      }
      
      // PASSO 8: Criar NOVO elemento de imagem do zero
      console.log('🖼️ Criando novo elemento de imagem...');
      const img = d.createElement('img');
      img.src = imageUrl;
      img.setAttribute('data-editable', 'image');
      img.setAttribute('data-bg-image-url', imageUrl);
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.loading = 'eager';
      
      // PASSO 9: Configurar imagem para preencher o container
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.objectPosition = 'center';
      img.style.display = 'block';
      img.style.margin = '0';
      img.style.padding = '0';
      
      // Preserva border-radius na imagem também
      if (preservedStyles.borderRadius && preservedStyles.borderRadius !== '0px') {
        img.style.borderRadius = preservedStyles.borderRadius;
      }
      
      // PASSO 10: INSERIR a imagem no container limpo
      selectedVideoContainer.appendChild(img);
      
      // PASSO 11: Re-aplicar TODAS as funcionalidades do zero
      const reinitializeWrapper = () => {
        console.log('⚙️ Re-inicializando funcionalidades do wrapper...');
        
        ensureHostResizeObserver(selectedVideoContainer);
        normFill(selectedVideoContainer);
        selectedVideoContainer.setAttribute('data-cv-selected', '1');
        
        attachResizePinchers(d, selectedVideoContainer, (height: number) => {
          updateElementStyle(slideIndex, 'background', 'height', `${height}px`);
        });
        
        // Força reflow completo
        selectedVideoContainer.offsetHeight;
        void selectedVideoContainer.offsetWidth;
        
        console.log('✅ Funcionalidades re-inicializadas');
      };
      
      // Executa reinicialização quando imagem carregar
      if (img.complete && img.naturalHeight > 0) {
        console.log('✅ Imagem já carregada (cache)');
        reinitializeWrapper();
      } else {
        console.log('⏳ Aguardando carregamento da imagem...');
        img.onload = () => {
          console.log('✅ Imagem carregada');
          reinitializeWrapper();
        };
      }
      
      // Recálculo adicional após delay (garantia)
      setTimeout(() => {
        console.log('🔄 Recálculo adicional após delay...');
        reinitializeWrapper();
      }, 150);
      
      // PASSO 12: Atualizar refs e estado da aplicação
      selectedImageRefs.current[slideIndex] = img;
      setSelectedElement({ slideIndex, element: 'background' });
      setFocusedSlide(slideIndex);
      updateEditedValue(slideIndex, 'background', imageUrl);
      
      // PASSO 13: Limpeza final de artefatos
      cleanupAltArtifacts(selectedVideoContainer);
      queueMicrotask(() => { 
        try { 
          cleanupAltArtifacts(selectedVideoContainer); 
        } catch {} 
      });
      
      console.log('✅ ✅ ✅ Troca de VÍDEO para IMAGEM concluída com SUCESSO!');
    } catch (error) {
      console.error('❌ ❌ ❌ Erro CRÍTICO ao trocar de VÍDEO para IMAGEM:', error);
    }
  }

  /**
   * Troca de mídia quando há uma imagem selecionada
   */
  function handleSelectedImage(
    d: Document,
    slideIndex: number,
    imageUrl: string,
    selectedImg: HTMLImageElement
  ) {
    try {
      if (isVideoUrl(imageUrl)) {
        // Trocar de IMAGEM para VÍDEO
        const { wrapper } = ensureImgCropWrapper(d, selectedImg);
        
        const originalWidth = wrapper.offsetWidth;
        const originalHeight = wrapper.offsetHeight;
        
        selectedImg.style.cssText = '';
        wrapper.style.cssText = '';
        wrapper.removeAttribute('data-cv-height');
        
        const video = d.createElement('video');
        video.src = imageUrl;
        video.setAttribute('data-editable', 'video');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.loop = true;
        video.autoplay = false;
        video.preload = 'metadata';
        try { video.pause(); } catch {}

        killPlayOverlays(wrapper);
        wrapper.replaceChild(video, selectedImg);
        
        wrapper.className = 'video-container img-crop-wrapper';
        wrapper.style.position = 'relative';
        wrapper.style.overflow = 'hidden';
        wrapper.style.width = `${originalWidth}px`;
        wrapper.style.height = `${originalHeight}px`;
        
        syncContainerWithContent(wrapper, video);
        forceVideoStyle(video);
        try { video.load(); } catch {}
        attachPlayOverlay(d, wrapper, video);
        
        requestAnimationFrame(() => {
          syncContainerWithContent(wrapper, video);
          ensureHostResizeObserver(wrapper);
          normFill(wrapper);
        });
        
        setTimeout(() => {
          syncContainerWithContent(wrapper, video);
          ensureHostResizeObserver(wrapper);
          normFill(wrapper);
        }, 150);

        cleanupAltArtifacts(wrapper);
        queueMicrotask(() => { try { cleanupAltArtifacts(wrapper); } catch {} });

        selectedImageRefs.current[slideIndex] = null;
        wrapper.removeAttribute('data-cv-selected');
        video.classList.add('selected');
      } else {
        // IMAGEM → IMAGEM: Troca simples
        const { wrapper } = ensureImgCropWrapper(d, selectedImg);
        
        const originalWidth = wrapper.offsetWidth;
        const originalHeight = wrapper.offsetHeight;
        
        selectedImg.removeAttribute('srcset');
        selectedImg.removeAttribute('sizes');
        selectedImg.loading = 'eager';
        wrapper.removeAttribute('data-cv-height');
        
        selectedImg.src = imageUrl;
        selectedImg.setAttribute('data-bg-image-url', imageUrl);

        wrapper.setAttribute('data-cv-selected', '1');
        
        wrapper.style.width = `${originalWidth}px`;
        wrapper.style.height = `${originalHeight}px`;
        
        const syncNewImage = () => {
          ensureHostResizeObserver(wrapper);
          normFill(wrapper);
          wrapper.offsetHeight;
        };
        
        if (selectedImg.complete && selectedImg.naturalHeight > 0) {
          syncNewImage();
        } else {
          selectedImg.onload = syncNewImage;
        }
        
        setTimeout(syncNewImage, 100);
        
        killPlayOverlays(wrapper);
        removeAllPlayOverlays(d);
        cleanupAltArtifacts(wrapper);
        queueMicrotask(() => { try { cleanupAltArtifacts(wrapper); } catch {} });
      }
    } catch (error) {
      console.error('Erro ao trocar mídia:', error);
    }
  }

  /**
   * Aplica mídia quando não há imagem selecionada (primeira aplicação)
   */
  function handleNoSelectedImage(
    d: Document,
    slideIndex: number,
    imageUrl: string
  ) {
    const updatedEl = applyBackgroundImageImmediate(slideIndex, imageUrl, iframeRefs.current);
    clearAllSelections();
    
    if (!updatedEl) return;
    
    const tagName = (updatedEl as HTMLElement).tagName;
    
    if (tagName === 'IMG') {
      handleNewImageApplied(d, slideIndex, updatedEl as HTMLImageElement);
    } else if (tagName === 'VIDEO') {
      handleNewVideoApplied(d, slideIndex, imageUrl, updatedEl as HTMLVideoElement);
    } else {
      selectedImageRefs.current[slideIndex] = null;
      const isVideoNow = isVideoUrl(imageUrl);
      if (!isVideoNow) removeAllPlayOverlays(d);
      
      if ((updatedEl as HTMLElement)) { 
        ensureHostResizeObserver(updatedEl as HTMLElement); 
        normFill(updatedEl as HTMLElement); 
      }
    }
  }

  /**
   * Nova IMAGEM aplicada
   */
  function handleNewImageApplied(
    d: Document,
    slideIndex: number,
    img: HTMLImageElement
  ) {
    const { wrapper } = ensureImgCropWrapper(d, img);
    
    const hasExistingSize = wrapper.offsetHeight > 0;
    const originalWidth = hasExistingSize ? wrapper.offsetWidth : 0;
    const originalHeight = hasExistingSize ? wrapper.offsetHeight : 0;
    
    wrapper.removeAttribute('data-cv-height');
    wrapper.style.cssText = '';
    wrapper.className = 'img-crop-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    
    wrapper.setAttribute('data-cv-selected', '1');
    selectedImageRefs.current[slideIndex] = img;
    
    killPlayOverlays(wrapper);
    removeAllPlayOverlays(d);
    
    const syncImageWrapper = () => {
      if (hasExistingSize) {
        wrapper.style.width = `${originalWidth}px`;
        wrapper.style.height = `${originalHeight}px`;
        ensureHostResizeObserver(wrapper);
        normFill(wrapper);
      } else {
        syncContainerWithContent(wrapper, img);
        ensureHostResizeObserver(wrapper);
        normFill(wrapper);
      }
      wrapper.offsetHeight;
    };
    
    if (img.complete && img.naturalHeight > 0) {
      syncImageWrapper();
    } else {
      img.onload = syncImageWrapper;
    }
    
    setTimeout(syncImageWrapper, 100);
    
    cleanupAltArtifacts(wrapper);
    queueMicrotask(() => { try { cleanupAltArtifacts(wrapper); } catch {} });
  }

  /**
   * Novo VÍDEO aplicado
   */
  function handleNewVideoApplied(
    d: Document,
    slideIndex: number,
    imageUrl: string,
    video: HTMLVideoElement
  ) {
    selectedImageRefs.current[slideIndex] = null;
    const wrapper = video.parentElement;
    
    if (!wrapper) return;
    
    const hasExistingSize = wrapper.offsetHeight > 0;
    const originalWidth = hasExistingSize ? wrapper.offsetWidth : 0;
    const originalHeight = hasExistingSize ? wrapper.offsetHeight : 0;
    
    wrapper.removeAttribute('data-cv-height');
    wrapper.style.cssText = '';
    wrapper.className = 'video-container img-crop-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    
    const syncVideoWrapper = () => {
      if (hasExistingSize) {
        wrapper.style.width = `${originalWidth}px`;
        wrapper.style.height = `${originalHeight}px`;
        ensureHostResizeObserver(wrapper);
        normFill(wrapper);
      } else {
        syncContainerWithContent(wrapper, video);
        ensureHostResizeObserver(wrapper);
        normFill(wrapper);
      }
      wrapper.offsetHeight;
    };
    
    syncVideoWrapper();
    video.addEventListener('loadedmetadata', syncVideoWrapper, { once: true });
    setTimeout(syncVideoWrapper, 150);
  }

  return { handleBackgroundImageChange };
}
