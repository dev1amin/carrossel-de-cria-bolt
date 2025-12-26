/**
 * ImageCropModal - Modal para crop de imagem (avatar)
 * Permite ao usuário selecionar área da imagem para avatar
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onSave: (croppedImageUrl: string) => void;
  aspectRatio?: number; // 1 = quadrado (avatar)
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  onClose,
  onSave,
  aspectRatio = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset quando abrir
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageUrl]);

  const handleImageLoad = useCallback(() => {
    console.log('🖼️ Imagem carregada no crop modal');
    setImageLoaded(true);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setScale(prev => Math.min(3, Math.max(0.5, prev + delta)));
  }, []);

  const handleSave = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Tamanho do crop (avatar geralmente 200x200)
    const cropSize = 200;
    canvas.width = cropSize;
    canvas.height = cropSize / aspectRatio;

    // Calcula a área visível
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const cropAreaSize = Math.min(containerRect.width, containerRect.height) * 0.8;
    
    // Centro do container
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    // Posição da imagem no container
    const img = imageRef.current;
    const imgWidth = img.naturalWidth * scale;
    const imgHeight = img.naturalHeight * scale;
    
    // Calcula offset da imagem
    const imgCenterX = centerX + position.x;
    const imgCenterY = centerY + position.y;
    const imgLeft = imgCenterX - imgWidth / 2;
    const imgTop = imgCenterY - imgHeight / 2;

    // Área de crop (círculo central)
    const cropLeft = centerX - cropAreaSize / 2;
    const cropTop = centerY - cropAreaSize / 2;

    // Converte para coordenadas da imagem original
    const srcX = (cropLeft - imgLeft) / scale;
    const srcY = (cropTop - imgTop) / scale;
    const srcWidth = cropAreaSize / scale;
    const srcHeight = cropAreaSize / scale / aspectRatio;

    // Desenha
    ctx.drawImage(
      img,
      srcX, srcY, srcWidth, srcHeight,
      0, 0, cropSize, cropSize / aspectRatio
    );

    // Converte para URL
    const croppedUrl = canvas.toDataURL('image/png', 0.9);
    console.log('✅ Avatar cortado com sucesso');
    onSave(croppedUrl);
    onClose();
  }, [scale, position, aspectRatio, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Recortar Avatar</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Crop Area */}
        <div
          ref={containerRef}
          className="relative w-full h-80 bg-gray-900 overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Imagem */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Crop preview"
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            className="absolute pointer-events-none select-none"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
              maxWidth: 'none',
              maxHeight: 'none',
              opacity: 1,
              transition: isDragging ? 'none' : 'transform 0.1s',
            }}
          />

          {/* Overlay escuro com círculo transparente */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, transparent 100px, rgba(0,0,0,0.7) 100px)`,
            }}
          />

          {/* Círculo de guia */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full pointer-events-none"
            style={{ 
              width: 200, 
              height: 200,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.3)',
            }}
          />

          {/* Dica de drag */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
            <Move className="w-3.5 h-3.5" />
            <span>Arraste para posicionar</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 py-3 border-t border-gray-200 space-y-3">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            >
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <input
              type="range"
              min={50}
              max={300}
              value={scale * 100}
              onChange={(e) => setScale(Number(e.target.value) / 100)}
              className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-blue-500
                [&::-webkit-slider-thumb]:cursor-pointer
              "
            />
            <button
              onClick={() => handleZoom(0.1)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xs text-gray-500 w-12 text-right">{Math.round(scale * 100)}%</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Aplicar
            </button>
          </div>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ImageCropModal;
