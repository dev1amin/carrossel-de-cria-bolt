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
    <div className={`absolute left-1/2 transform -translate-x-1/2 z-20 ${
      'bottom-6'
    }`}>
      <div className={`flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-light ${
        'px-3 py-2'
      }`}>
        <button
          onClick={actions.zoomOut}
          className={`rounded-lg hover:bg-gray-light transition-colors text-gray-dark ${
            'p-1.5'
          }`}
          title="Diminuir zoom"
        >
          <Minus className={'w-4 h-4'} />
        </button>
        
        <span className={`font-medium text-gray-dark text-center ${
          'text-sm min-w-[48px]'
        }`}>
          {Math.round(zoom * 100)}%
        </span>
        
        <button
          onClick={actions.zoomIn}
          className={`rounded-lg hover:bg-gray-light transition-colors text-gray-dark ${
            'p-1.5'
          }`}
          title="Aumentar zoom"
        >
          <Plus className={'w-4 h-4'} />
        </button>
      </div>
    </div>
  );
});

CanvasControls.displayName = 'CanvasControls';
