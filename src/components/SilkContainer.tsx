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
  speed = 2,
  scale = 1.5,
  color = '#e8eaf0',
  noiseIntensity = 0.8,
  rotation = 0,
  overlayColor = 'white',
  overlayOpacity = 0.85,
  minHeight = '100vh',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`} style={{ minHeight }}>
      <div className="absolute inset-0 w-full h-full">
        <Silk
          speed={speed}
          scale={scale}
          color={color}
          noiseIntensity={noiseIntensity}
          rotation={rotation}
        />
      </div>

      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default SilkContainer;
