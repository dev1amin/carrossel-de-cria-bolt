/**
 * MobileSlidesPanel - Painel de slides para navegação rápida
 * Abre de baixo para cima e mostra todos os slides em grid
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Type, Plus, Trash2, Copy } from 'lucide-react';
import type { CarouselData } from '../../../../types/carousel';

interface MobileSlidesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  renderedSlides: string[];
  currentSlide: number;
  carouselData: CarouselData;
  onSlideSelect: (index: number) => void;
  onDeleteSlide?: (index: number) => void;
  onCloneSlide?: (index: number) => void;
  onAddSlide?: () => void;
}

export const MobileSlidesPanel: React.FC<MobileSlidesPanelProps> = ({
  isOpen,
  onClose,
  renderedSlides,
  currentSlide,
  carouselData,
  onSlideSelect,
  onDeleteSlide,
  onCloneSlide,
  onAddSlide,
}) => {
  const data = carouselData as any;

  const handleSlideClick = (index: number) => {
    onSlideSelect(index);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0d0d1a] rounded-t-3xl z-50 overflow-hidden shadow-2xl"
            style={{ maxHeight: '70vh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
              <h3 className="text-white font-semibold text-lg">
                Slides ({renderedSlides.length})
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/50 hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slides Grid */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 100px)' }}>
              <div className="grid grid-cols-3 gap-3">
                {renderedSlides.map((_, index) => {
                  const conteudo = data.conteudos?.[index];
                  const hasImage = !!conteudo?.imagem_fundo;
                  const title = conteudo?.title || '';
                  const slideType = index === 0 ? 'Capa' : `Slide ${index + 1}`;
                  
                  return (
                    <motion.div
                      key={index}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSlideClick(index)}
                      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                        currentSlide === index
                          ? 'ring-2 ring-blue-DEFAULT ring-offset-2 ring-offset-[#0d0d1a]'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-[4/5] bg-[#1a1a2e] relative">
                        {hasImage ? (
                          <img
                            src={conteudo.imagem_fundo}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Type className="w-8 h-8 text-white/30" />
                          </div>
                        )}

                        {/* Overlay with slide number */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <span className="text-white text-xs font-medium">
                            {slideType}
                          </span>
                          {title && (
                            <p className="text-white/70 text-[10px] truncate mt-0.5">
                              {title.replace(/<[^>]*>/g, '').substring(0, 30)}
                            </p>
                          )}
                        </div>

                        {/* Active indicator */}
                        {currentSlide === index && (
                          <div className="absolute top-2 right-2">
                            <div className="w-3 h-3 bg-blue-DEFAULT rounded-full" />
                          </div>
                        )}
                      </div>

                      {/* Quick actions on long press or tap menu */}
                      <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onCloneSlide && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloneSlide(index);
                            }}
                            className="p-1.5 rounded-lg bg-black/50 text-white/80 hover:bg-black/70"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteSlide && renderedSlides.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSlide(index);
                            }}
                            className="p-1.5 rounded-lg bg-black/50 text-red-400 hover:bg-black/70"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Add slide button */}
                {onAddSlide && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onAddSlide}
                    className="aspect-[4/5] bg-[#1a1a2e] rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-white/50 hover:border-blue-DEFAULT hover:text-blue-DEFAULT transition-all"
                  >
                    <Plus className="w-8 h-8" />
                    <span className="text-xs font-medium">Adicionar</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSlidesPanel;
