import React from 'react';
import Silk from './Silk';

interface SilkContainerProps {
  children: React.ReactNode;
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
  overlayColor?: string;
  overlayOpacity?: number;
  minHeight?: string;
  className?: string;
}

const SilkContainer: React.FC<SilkContainerProps> = ({
  children,
  // defaults mais decentes
  speed = 5,
  scale = 1,
  color = '#7B7481',
  noiseIntensity = 1.5,
  rotation = 0,
  overlayColor = 'white',
  overlayOpacity = 0.4, // NÃO 0.85
  minHeight = '100vh',
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ minHeight }}>
      {/* background animado */}
      <div className="absolute inset-0 w-full h-full">
        <Silk
          speed={speed}
          scale={scale}
          color={color}
          noiseIntensity={noiseIntensity}
          rotation={rotation}
        />
      </div>

      {/* overlay claro por cima, mas sem matar tudo */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />

      {/* conteúdo acima de tudo */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default SilkContainer;