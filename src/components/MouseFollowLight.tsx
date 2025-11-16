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
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(147,51,234,0.25) 40%, transparent 70%)',
        filter: 'blur(50px)',
        transform: 'translate(-50%, -50%)',
        opacity: isVisible ? 1 : 0,
        zIndex: zIndex,
      }}
    />
  );
};
