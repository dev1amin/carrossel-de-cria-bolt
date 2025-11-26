/**
 * Handlers para edição de conteúdo dos elementos
 */

import { getIframeDocument } from '../utils/iframeHelpers';

/**
 * Aplica um estilo diretamente em um elemento HTML
 */
function applyStyleToElement(element: HTMLElement, property: string, value: any): void {
  const style = element.style as any;
  style[property] = value;
}

/**
 * Lida com a edição de texto de um elemento
 */
export function handleTextEdit(
  elementId: string,
  newText: string,
  slideIndex: number,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  editedContent: Record<string, any>,
  setEditedContent: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void
): void {
  const iframe = iframeRefs.current[slideIndex];
  if (!iframe) return;

  const doc = getIframeDocument(iframe);
  if (!doc) return;

  const element = doc.getElementById(elementId);
  if (!element) return;

  // Atualiza o texto no DOM
  element.textContent = newText;

  // Salva no estado
  const key = `${slideIndex}-${elementId}`;
  const newEditedContent = {
    ...editedContent,
    [key]: { ...editedContent[key], text: newText },
  };

  setEditedContent(newEditedContent);
  setHasUnsavedChanges(true);
}

/**
 * Lida com mudanças de estilo de um elemento
 */
export function handleStyleChange(
  property: string,
  value: any,
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  elementStyles: Record<string, any>,
  setElementStyles: (value: Record<string, any>) => void,
  editedContent: Record<string, any>,
  setEditedContent: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void
): void {
  const iframe = iframeRefs.current[slideIndex];
  if (!iframe) return;

  const doc = getIframeDocument(iframe);
  if (!doc) return;

  const element = doc.getElementById(elementId);
  if (!element) return;

  // Atualiza o estado de estilos
  const newStyles = {
    ...elementStyles,
    [property]: value,
  };
  setElementStyles(newStyles);

  // Aplica o estilo no elemento
  applyStyleToElement(element as HTMLElement, property, value);

  // Salva no estado de conteúdo editado
  const key = `${slideIndex}-${elementId}`;
  const newEditedContent = {
    ...editedContent,
    [key]: {
      ...editedContent[key],
      styles: {
        ...(editedContent[key]?.styles || {}),
        [property]: value,
      },
    },
  };

  setEditedContent(newEditedContent);
  setHasUnsavedChanges(true);
}

/**
 * Lida com mudança de fonte
 */
export function handleFontChange(
  fontFamily: string,
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  elementStyles: Record<string, any>,
  setElementStyles: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void
): void {
  handleStyleChange(
    'fontFamily',
    fontFamily,
    slideIndex,
    elementId,
    iframeRefs,
    elementStyles,
    setElementStyles,
    {} as any,
    () => {},
    setHasUnsavedChanges
  );
}

/**
 * Lida com mudança de tamanho de fonte
 */
export function handleFontSizeChange(
  fontSize: number,
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  elementStyles: Record<string, any>,
  setElementStyles: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void
): void {
  handleStyleChange(
    'fontSize',
    `${fontSize}px`,
    slideIndex,
    elementId,
    iframeRefs,
    elementStyles,
    setElementStyles,
    {} as any,
    () => {},
    setHasUnsavedChanges
  );
}

/**
 * Lida com mudança de cor de texto
 */
export function handleColorChange(
  color: string,
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  elementStyles: Record<string, any>,
  setElementStyles: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void
): void {
  handleStyleChange(
    'color',
    color,
    slideIndex,
    elementId,
    iframeRefs,
    elementStyles,
    setElementStyles,
    {} as any,
    () => {},
    setHasUnsavedChanges
  );
}

/**
 * Lida com mudança de cor de fundo
 */
export function handleBackgroundColorChange(
  color: string,
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  elementStyles: Record<string, any>,
  setElementStyles: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void
): void {
  handleStyleChange(
    'backgroundColor',
    color,
    slideIndex,
    elementId,
    iframeRefs,
    elementStyles,
    setElementStyles,
    {} as any,
    () => {},
    setHasUnsavedChanges
  );
}

/**
 * Lida com mudança de alinhamento de texto
 */
export function handleTextAlignChange(
  textAlign: string,
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  elementStyles: Record<string, any>,
  setElementStyles: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void
): void {
  handleStyleChange(
    'textAlign',
    textAlign,
    slideIndex,
    elementId,
    iframeRefs,
    elementStyles,
    setElementStyles,
    {} as any,
    () => {},
    setHasUnsavedChanges
  );
}

/**
 * Lida com mudança de posição/dimensões do elemento
 */
export function handlePositionChange(
  property: 'top' | 'left' | 'width' | 'height',
  value: string,
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  elementStyles: Record<string, any>,
  setElementStyles: (value: Record<string, any>) => void,
  editedContent: Record<string, any>,
  setEditedContent: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void
): void {
  handleStyleChange(
    property,
    value,
    slideIndex,
    elementId,
    iframeRefs,
    elementStyles,
    setElementStyles,
    editedContent,
    setEditedContent,
    setHasUnsavedChanges
  );
}

/**
 * Reseta estilos de um elemento para os valores originais
 */
export function handleResetStyles(
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  originalStyles: Record<string, any>,
  setElementStyles: (value: Record<string, any>) => void,
  editedContent: Record<string, any>,
  setEditedContent: (value: Record<string, any>) => void,
  setHasUnsavedChanges: (value: boolean) => void
): void {
  const iframe = iframeRefs.current[slideIndex];
  if (!iframe) return;

  const doc = getIframeDocument(iframe);
  if (!doc) return;

  const element = doc.getElementById(elementId);
  if (!element) return;

  // Aplica estilos originais
  Object.entries(originalStyles).forEach(([prop, val]) => {
    applyStyleToElement(element as HTMLElement, prop, val);
  });

  // Atualiza estado
  setElementStyles(originalStyles);

  // Remove do editedContent
  const key = `${slideIndex}-${elementId}`;
  const newEditedContent = { ...editedContent };
  delete newEditedContent[key];

  setEditedContent(newEditedContent);
  setHasUnsavedChanges(true);
}

/**
 * Duplica um elemento dentro de um slide
 */
export function handleDuplicateElement(
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  setHasUnsavedChanges: (value: boolean) => void,
  addToast: (message: string, type: 'success' | 'error') => void
): void {
  const iframe = iframeRefs.current[slideIndex];
  if (!iframe) return;

  const doc = getIframeDocument(iframe);
  if (!doc) return;

  const element = doc.getElementById(elementId);
  if (!element) return;

  // Clone o elemento
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Gera novo ID
  const newId = `${elementId}-copy-${Date.now()}`;
  clone.id = newId;

  // Ajusta posição (offset)
  if (clone.style.top) {
    const currentTop = parseInt(clone.style.top);
    clone.style.top = `${currentTop + 20}px`;
  }
  if (clone.style.left) {
    const currentLeft = parseInt(clone.style.left);
    clone.style.left = `${currentLeft + 20}px`;
  }

  // Insere no DOM após o elemento original
  element.parentElement?.insertBefore(clone, element.nextSibling);

  setHasUnsavedChanges(true);
  addToast('Elemento duplicado com sucesso', 'success');
}

/**
 * Remove um elemento de um slide
 */
export function handleDeleteElement(
  slideIndex: number,
  elementId: string,
  iframeRefs: React.MutableRefObject<(HTMLIFrameElement | null)[]>,
  setSelectedElement: (value: { slideIndex: number; element: any }) => void,
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

  // Confirma exclusão
  if (!confirm('Tem certeza que deseja deletar este elemento?')) {
    return;
  }

  // Remove do DOM
  element.remove();

  // Remove do estado
  const key = `${slideIndex}-${elementId}`;
  const newEditedContent = { ...editedContent };
  delete newEditedContent[key];

  setEditedContent(newEditedContent);
  setSelectedElement({ slideIndex, element: null });
  setHasUnsavedChanges(true);

  addToast('Elemento removido com sucesso', 'success');
}
