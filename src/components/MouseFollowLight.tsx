import { useEffect, useState } from 'react';

interface MouseFollowLightProps {
  zIndex?: number;
}

export const MouseFollowLight: React.FC<MouseFollowLightProps> = ({ zIndex = 1 }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y}px`,
        width: '600px',
        height: '600px',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0.15) 25%, rgba(59,130,246,0.05) 50%, rgba(255,255,255,0) 70%)',
        filter: 'blur(50px)',
        transition: 'left 0.15s ease-out, top 0.15s ease-out',
        zIndex: zIndex,
      }}
    />
  );
};
