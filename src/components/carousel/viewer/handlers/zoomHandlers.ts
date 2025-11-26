/**
 * Handlers para controles de zoom e pan do canvas
 */

import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../utils/constants';

/**
 * Aumenta o zoom
 */
export function handleZoomIn(
  currentZoom: number,
  setZoom: (value: number) => void
): void {
  const newZoom = Math.min(currentZoom + ZOOM_STEP, ZOOM_MAX);
  setZoom(newZoom);
}

/**
 * Diminui o zoom
 */
export function handleZoomOut(
  currentZoom: number,
  setZoom: (value: number) => void
): void {
  const newZoom = Math.max(currentZoom - ZOOM_STEP, ZOOM_MIN);
  setZoom(newZoom);
}

/**
 * Reseta o zoom para 100%
 */
export function handleZoomReset(setZoom: (value: number) => void): void {
  setZoom(1);
}

/**
 * Define zoom para um valor específico
 */
export function handleZoomTo(
  zoomValue: number,
  setZoom: (value: number) => void
): void {
  const clampedZoom = Math.max(ZOOM_MIN, Math.min(zoomValue, ZOOM_MAX));
  setZoom(clampedZoom);
}

/**
 * Ajusta zoom para caber na tela
 */
export function handleZoomToFit(
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number,
  setZoom: (value: number) => void,
  setPan: (value: { x: number; y: number }) => void
): void {
  const widthRatio = containerWidth / contentWidth;
  const heightRatio = containerHeight / contentHeight;
  const newZoom = Math.min(widthRatio, heightRatio) * 0.9; // 90% para margem

  const clampedZoom = Math.max(ZOOM_MIN, Math.min(newZoom, ZOOM_MAX));
  setZoom(clampedZoom);

  // Centraliza
  setPan({ x: 0, y: 0 });
}

/**
 * Inicia o arrasto do canvas (pan)
 */
export function handlePanStart(
  event: React.MouseEvent,
  setIsDragging: (value: boolean) => void,
  setDragStart: (value: { x: number; y: number }) => void,
  currentPan: { x: number; y: number }
): void {
  // Apenas botão esquerdo do mouse
  if (event.button !== 0) return;

  setIsDragging(true);
  setDragStart({
    x: event.clientX - currentPan.x,
    y: event.clientY - currentPan.y,
  });
}

/**
 * Processa o movimento do arrasto (pan)
 */
export function handlePanMove(
  event: React.MouseEvent,
  isDragging: boolean,
  dragStart: { x: number; y: number },
  setPan: (value: { x: number; y: number }) => void
): void {
  if (!isDragging) return;

  const newPan = {
    x: event.clientX - dragStart.x,
    y: event.clientY - dragStart.y,
  };

  setPan(newPan);
}

/**
 * Finaliza o arrasto do canvas (pan)
 */
export function handlePanEnd(
  setIsDragging: (value: boolean) => void
): void {
  setIsDragging(false);
}

/**
 * Reseta o pan para centralizado
 */
export function handlePanReset(
  setPan: (value: { x: number; y: number }) => void
): void {
  setPan({ x: 0, y: 0 });
}

/**
 * Lida com zoom via scroll do mouse
 */
export function handleWheelZoom(
  event: WheelEvent,
  currentZoom: number,
  setZoom: (value: number) => void,
  currentPan: { x: number; y: number },
  setPan: (value: { x: number; y: number }) => void
): void {
  event.preventDefault();

  // Determina direção do scroll
  const delta = -event.deltaY;
  const zoomFactor = delta > 0 ? 1.1 : 0.9;

  // Calcula novo zoom
  const newZoom = Math.max(
    ZOOM_MIN,
    Math.min(currentZoom * zoomFactor, ZOOM_MAX)
  );

  // Ajusta pan para zoom no ponto do cursor
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const zoomRatio = newZoom / currentZoom;

  const newPan = {
    x: mouseX - (mouseX - currentPan.x) * zoomRatio,
    y: mouseY - (mouseY - currentPan.y) * zoomRatio,
  };

  setZoom(newZoom);
  setPan(newPan);
}

/**
 * Centraliza o conteúdo no canvas
 */
export function handleCenterContent(
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  contentWidth: number,
  contentHeight: number,
  zoom: number,
  setPan: (value: { x: number; y: number }) => void
): void {
  if (!containerRef.current) return;

  const containerRect = containerRef.current.getBoundingClientRect();
  
  const scaledWidth = contentWidth * zoom;
  const scaledHeight = contentHeight * zoom;

  const newPan = {
    x: (containerRect.width - scaledWidth) / 2,
    y: (containerRect.height - scaledHeight) / 2,
  };

  setPan(newPan);
}

/**
 * Obtém transform CSS para aplicar zoom e pan
 */
export function getCanvasTransform(
  zoom: number,
  pan: { x: number; y: number }
): string {
  return `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
}

/**
 * Calcula posição do mouse no espaço do canvas (considerando zoom e pan)
 */
export function getCanvasMousePosition(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  zoom: number,
  pan: { x: number; y: number }
): { x: number; y: number } {
  const x = (clientX - containerRect.left - pan.x) / zoom;
  const y = (clientY - containerRect.top - pan.y) / zoom;

  return { x, y };
}
