import { useEffect, useState } from 'react';

interface MouseFollowLightProps {
  zIndex?: number;
}

export const MouseFollowLight: React.FC<MouseFollowLightProps> = ({ zIndex = 1 }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      className="fixed pointer-events-none transition-opacity duration-300"
      style={{
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y}px`,
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(147,197,253,0.12) 0%, rgba(191,219,254,0.08) 40%, transparent 70%)',
        filter: 'blur(60px)',
        transform: 'translate(-50%, -50%)',
        opacity: isVisible ? 1 : 0,
        zIndex: zIndex,
      }}
    />
  );
};
