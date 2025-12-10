/**
 * Block-based slide editor components
 */

// Re-export types
export type { Block, BlockSlideContent } from '../../../types/blocks';
export { isBlockSlide } from '../../../types/blocks';

// BlocksCanvas component placeholder
// TODO: Implement full blocks canvas
import React from 'react';
import type { Block } from '../../../types/blocks';

interface BlocksCanvasProps {
  slideIndex: number;
  conteudo: {
    blocks?: Block[];
    backgroundColor?: string;
  };
  onChangeBlocks: (blocks: Block[]) => void;
  width: number;
  height: number;
  backgroundColor?: string;
}

export const BlocksCanvas: React.FC<BlocksCanvasProps> = ({
  slideIndex,
  conteudo,
  onChangeBlocks,
  width,
  height,
  backgroundColor = '#ffffff',
}) => {
  const blocks = conteudo.blocks || [];

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: backgroundColor,
      }}
    >
      {blocks.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <svg
            className="w-16 h-16 mb-4 opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <p className="text-lg font-medium">Slide em Branco</p>
          <p className="text-sm mt-2 max-w-xs text-center">
            Use os templates existentes ou duplique um slide para começar
          </p>
        </div>
      ) : (
        <div className="p-8 flex flex-col gap-4">
          {blocks.map((block, idx) => (
            <div
              key={block.id}
              className="p-4 border border-dashed border-gray-300 rounded-lg bg-white/50"
            >
              <span className="text-sm text-gray-500">
                Bloco {idx + 1}: {block.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Re-export utilities
export { renderBlocksToHtml } from './utils/renderBlocksToHtml';
