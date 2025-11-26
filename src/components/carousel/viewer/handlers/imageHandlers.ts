/**
 * Handlers para busca e upload de imagens
 */

import { UNSPLASH_ACCESS_KEY, IMAGE_SEARCH_DEBOUNCE } from '../utils/constants';
import { getIframeDocument } from '../utils/iframeHelpers';

/**
 * Busca imagens no Unsplash
 */
export async function handleImageSearch(
  keyword: string,
  searchId: number,
  lastSearchId: React.MutableRefObject<number>,
  setIsSearching: (value: boolean) => void,
  setSearchResults: (value: string[]) => void,
  addToast: (message: string, type: 'success' | 'error') => void
): Promise<void> {
  if (!keyword.trim()) {
    setSearchResults([]);
    return;
  }

  setIsSearching(true);

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        keyword
      )}&per_page=20&client_id=${UNSPLASH_ACCESS_KEY}`
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar imagens');
    }

    const data = await response.json();

    // Verifica se esta é a busca mais recente
    if (searchId === lastSearchId.current) {
      const imageUrls = data.results.map(
        (img: any) => img.urls.regular || img.urls.small
      );
      setSearchResults(imageUrls);
    }
  } catch (error) {
    console.error('Erro na busca de imagens:', error);
    if (searchId === lastSearchId.current) {
      addToast('Erro ao buscar imagens', 'error');
      setSearchResults([]);
    }
  } finally {
    if (searchId === lastSearchId.current) {
      setIsSearching(false);
    }
  }
}

/**
 * Cria debounced handler para busca de imagens
 */
export function createDebouncedImageSearch(
  setSearchKeyword: (value: string) => void,
  lastSearchId: React.MutableRefObject<number>,
  setIsSearching: (value: boolean) => void,
  setSearchResults: (value: string[]) => void,
  addToast: (message: string, type: 'success' | 'error') => void
): (keyword: string) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (keyword: string) => {
    setSearchKeyword(keyword);

    // Cancela busca anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Aguarda antes de buscar
    timeoutId = setTimeout(() => {
      const searchId = ++lastSearchId.current;
      handleImageSearch(
        keyword,
        searchId,
        lastSearchId,
        setIsSearching,
        setSearchResults,
        addToast
      );
    }, IMAGE_SEARCH_DEBOUNCE);
  };
}

/**
 * Aplica uma imagem selecionada a um elemento
 */
export function handleApplyImage(
  imageUrl: string,
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  editedContent: Record<string, any>,
  setEditedContent: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void,
  setSearchKeyword: (value: string) => void,
  setSearchResults: (value: string[]) => void,
  addToast: (message: string, type: 'success' | 'error') => void
): void {
  const iframe = iframeRefs.current[slideIndex];
  if (!iframe) return;

  const doc = getIframeDocument(iframe);
  if (!doc) return;

  const element = doc.getElementById(elementId);
  if (!element) return;

  // Verifica se é uma imagem ou elemento com background
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'img') {
    // Aplica como src da imagem
    (element as HTMLImageElement).src = imageUrl;
  } else {
    // Aplica como background-image
    (element as HTMLElement).style.backgroundImage = `url(${imageUrl})`;
    (element as HTMLElement).style.backgroundSize = 'cover';
    (element as HTMLElement).style.backgroundPosition = 'center';
  }

  // Salva no estado
  const key = `${slideIndex}-${elementId}`;
  const newEditedContent = {
    ...editedContent,
    [key]: {
      ...editedContent[key],
      image: imageUrl,
    },
  };

  setEditedContent(newEditedContent);
  setHasUnsavedChanges(true);

  // Limpa busca
  setSearchKeyword('');
  setSearchResults([]);

  addToast('Imagem aplicada com sucesso', 'success');
}

/**
 * Lida com upload de imagem local
 */
export function handleImageUpload(
  event: React.ChangeEvent<HTMLInputElement>,
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  uploadedImages: Record<number, string>,
  setUploadedImages: (value: Record<number, string>) => void,
  editedContent: Record<string, any>,
  setEditedContent: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void,
  addToast: (message: string, type: 'success' | 'error') => void
): void {
  const file = event.target.files?.[0];
  if (!file) return;

  // Valida tipo de arquivo
  if (!file.type.startsWith('image/')) {
    addToast('Por favor, selecione um arquivo de imagem', 'error');
    return;
  }

  // Valida tamanho (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    addToast('Imagem muito grande. Máximo: 5MB', 'error');
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    if (!dataUrl) return;

    // Armazena imagem carregada
    const imageKey = Date.now();
    setUploadedImages({
      ...uploadedImages,
      [imageKey]: dataUrl,
    });

    // Aplica a imagem
    handleApplyImage(
      dataUrl,
      slideIndex,
      elementId,
      iframeRefs,
      editedContent,
      setEditedContent,
      setHasUnsavedChanges,
      () => {},
      () => {},
      addToast
    );
  };

  reader.onerror = () => {
    addToast('Erro ao carregar imagem', 'error');
  };

  reader.readAsDataURL(file);
}

/**
 * Remove imagem de um elemento
 */
export function handleRemoveImage(
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  editedContent: Record<string, any>,
  setEditedContent: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void,
  addToast: (message: string, type: 'success' | 'error') => void
): void {
  const iframe = iframeRefs.current[slideIndex];
  if (!iframe) return;

  const doc = getIframeDocument(iframe);
  if (!doc) return;

  const element = doc.getElementById(elementId);
  if (!element) return;

  const tagName = element.tagName.toLowerCase();

  if (tagName === 'img') {
    // Remove src da imagem
    (element as HTMLImageElement).src = '';
  } else {
    // Remove background-image
    (element as HTMLElement).style.backgroundImage = 'none';
  }

  // Atualiza estado
  const key = `${slideIndex}-${elementId}`;
  const newEditedContent = { ...editedContent };
  
  if (newEditedContent[key]) {
    delete newEditedContent[key].image;
  }

  setEditedContent(newEditedContent);
  setHasUnsavedChanges(true);

  addToast('Imagem removida com sucesso', 'success');
}

/**
 * Limpa resultados de busca
 */
export function handleClearSearch(
  setSearchKeyword: (value: string) => void,
  setSearchResults: (value: string[]) => void
): void {
  setSearchKeyword('');
  setSearchResults([]);
}
