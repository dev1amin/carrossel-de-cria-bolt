/**
 * MobileSlideActions - Bottom sheet com ações de slide (clonar, deletar, download)
 * Abre com framer-motion de baixo para cima
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Trash2, 
  X, 
  ChevronRight,
  AlertTriangle,
  Download
} from 'lucide-react';

interface MobileSlideActionsProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlide: number;
  totalSlides: number;
  onCloneSlide: (sourceIndex: number, targetPosition: 'before' | 'after' | number) => void;
  onDeleteSlide: (slideIndex: number) => void;
  onDownloadSlide?: (slideIndex: number) => void;
  canDelete: boolean; // Não permite deletar se for o único slide
}

export const MobileSlideActions: React.FC<MobileSlideActionsProps> = ({
  isOpen,
  onClose,
  currentSlide,
  totalSlides,
  onCloneSlide,
  onDeleteSlide,
  onDownloadSlide,
  canDelete,
}) => {
  const [showCloneOptions, setShowCloneOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClonePosition, setSelectedClonePosition] = useState<number>(currentSlide + 1);

  const handleClone = () => {
    onCloneSlide(currentSlide, selectedClonePosition);
    setShowCloneOptions(false);
    onClose();
  };

  const handleDelete = () => {
    onDeleteSlide(currentSlide);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDownloadSingle = () => {
    if (onDownloadSlide) {
      onDownloadSlide(currentSlide);
    }
    onClose();
  };

  const resetState = () => {
    setShowCloneOptions(false);
    setShowDeleteConfirm(false);
  };

  // Posições disponíveis para clonar
  const clonePositions = Array.from({ length: totalSlides + 1 }, (_, i) => i);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { resetState(); onClose(); }}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] rounded-t-3xl z-50 overflow-hidden shadow-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-white font-semibold text-lg">
                {showCloneOptions ? 'Clonar Slide' : showDeleteConfirm ? 'Deletar Slide' : 'Ações do Slide'}
              </h3>
              <button
                onClick={() => { resetState(); onClose(); }}
                className="p-2 rounded-xl text-white/50 hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-8">
              <AnimatePresence mode="wait">
                {/* Main actions */}
                {!showCloneOptions && !showDeleteConfirm && (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {/* Download single slide button */}
                    {onDownloadSlide && (
                      <button
                        onClick={handleDownloadSingle}
                        className="w-full flex items-center justify-between p-4 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all active:scale-98"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Download className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">Baixar Slide</p>
                            <p className="text-sm text-white/50">Download do slide {currentSlide + 1}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/50" />
                      </button>
                    )}

                    {/* Clone button */}
                    <button
                      onClick={() => setShowCloneOptions(true)}
                      className="w-full flex items-center justify-between p-4 bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all active:scale-98"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-DEFAULT/20 flex items-center justify-center">
                          <Copy className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Clonar Slide</p>
                          <p className="text-sm text-white/50">Duplicar slide {currentSlide + 1}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/50" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={!canDelete}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-98 ${
                        canDelete 
                          ? 'bg-red-500/20 text-white hover:bg-red-500/30' 
                          : 'bg-white/5 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          canDelete ? 'bg-red-500/30' : 'bg-white/10'
                        }`}>
                          <Trash2 className={`w-5 h-5 ${canDelete ? 'text-red-400' : 'text-white/30'}`} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Deletar Slide</p>
                          <p className={`text-sm ${canDelete ? 'text-white/50' : 'text-white/20'}`}>
                            {canDelete ? `Remover slide ${currentSlide + 1}` : 'Mínimo 1 slide'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${canDelete ? 'text-white/50' : 'text-white/20'}`} />
                    </button>
                  </motion.div>
                )}

                {/* Clone options */}
                {showCloneOptions && (
                  <motion.div
                    key="clone"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <p className="text-white/70 text-sm">
                      Escolha a posição para o novo slide:
                    </p>

                    {/* Position selector */}
                    <div className="flex flex-wrap gap-2">
                      {clonePositions.map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setSelectedClonePosition(pos)}
                          className={`px-4 py-2 rounded-xl font-medium transition-all ${
                            selectedClonePosition === pos
                              ? 'bg-blue-DEFAULT text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          {pos === currentSlide ? `Antes (${pos + 1})` : 
                           pos === currentSlide + 1 ? `Depois (${pos + 1})` : 
                           `Posição ${pos + 1}`}
                        </button>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowCloneOptions(false)}
                        className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleClone}
                        className="flex-1 py-3 rounded-xl bg-blue-DEFAULT text-white font-medium hover:bg-blue-DEFAULT/80 transition-all flex items-center justify-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Clonar
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Delete confirmation */}
                {showDeleteConfirm && (
                  <motion.div
                    key="delete"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 p-4 bg-red-500/20 rounded-2xl">
                      <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                      <p className="text-white text-sm">
                        Tem certeza que deseja deletar o slide {currentSlide + 1}? Esta ação não pode ser desfeita.
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSlideActions;
