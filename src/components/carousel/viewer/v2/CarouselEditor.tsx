/**
 * CarouselEditor - Componente principal do editor de carrossel v2
 * 
 * Este é o componente de entrada que:
 * Editor apenas desktop
 * 2. Inicializa o EditorProvider
 * 3. Renderiza o layout apropriado
 */

import React, { useState, useEffect } from 'react';
import type { CarouselEditorProps } from './types';
import { EditorProvider } from './context/EditorContext';
import { EditorLayout } from './EditorLayout';

// ...existing code...

const CarouselEditor: React.FC<CarouselEditorProps> = (props) => {
  return (
    <EditorProvider {...props}>
      <EditorLayout onClose={props.onClose} />
    </EditorProvider>
  );
};

export default CarouselEditor;
