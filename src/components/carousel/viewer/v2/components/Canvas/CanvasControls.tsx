/**
 * CanvasControls - Controles de zoom do canvas
 */

import React, { memo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export const CanvasControls: React.FC = memo(() => {
  const { state, actions } = useEditor();
  const { zoom } = state.canvas;
  
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
      <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-light px-3 py-2">
        <button
          onClick={actions.zoomOut}
          className="p-1.5 rounded-lg hover:bg-gray-light transition-colors text-gray-dark"
          title="Diminuir zoom"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <span className="text-sm font-medium text-gray-dark min-w-[48px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        
        <button
          onClick={actions.zoomIn}
          className="p-1.5 rounded-lg hover:bg-gray-light transition-colors text-gray-dark"
          title="Aumentar zoom"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

CanvasControls.displayName = 'CanvasControls';
