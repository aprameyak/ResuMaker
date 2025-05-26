import React, { useEffect, useState } from 'react';

interface CursorProps {
  name: string;
  color?: string;
}

interface CursorPosition {
  x: number;
  y: number;
}

export default function Cursor({ name, color = '#3b82f6' }: CursorProps) {
  const [position, setPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('mousemove', updatePosition);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        pointerEvents: 'none',
        zIndex: 9999,
        transition: 'transform 0.1s ease',
      }}
    >
      {/* Cursor */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        }}
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
          stroke="white"
        />
      </svg>

      {/* Name label */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '10px',
          background: color,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {name}
      </div>
    </div>
  );
} 