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
  withGrid?: boolean;
  padding?: string;
}

const SilkContainer: React.FC<SilkContainerProps> = ({
  children,
  speed = 2,
  scale = 1.5,
  color = '#d4a5f4',
  noiseIntensity = 0.8,
  rotation = 0,
  overlayColor = 'white',
  overlayOpacity = 0.75,
  minHeight = '100vh',
  className = '',
  withGrid = true,
  padding = '2rem',
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ minHeight }}>
      {/* Silk background animado com gradiente colorido */}
      <div className="absolute inset-0 w-full h-full">
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(to top right, #ff7eb9, #ff65a3, #6a82fb, #fc9d9a)',
            opacity: 0.4,
          }}
        />
        <Silk
          speed={speed}
          scale={scale}
          color={color}
          noiseIntensity={noiseIntensity}
          rotation={rotation}
        />
      </div>

      {/* Grid de quadradinhos - restaurado */}
      {withGrid && (
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      )}

      {/* Overlay semi-transparente para legibilidade */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />

      {/* Conteúdo com padding aumentado */}
      <div className="relative z-10" style={{ padding }}>
        {children}
      </div>
    </div>
  );
};

export default SilkContainer;