import React from 'react';

interface LcdScreenGlowProps {
  className?: string;
  theme?: 'green' | 'amber' | 'gray';
}

export const LcdScreenGlow: React.FC<LcdScreenGlowProps> = ({ className = '', theme = 'green' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${
        theme === 'amber'
          ? 'lcd-scanlines bg-amber-600/10 mix-blend-color-dodge'
          : theme === 'gray'
          ? 'lcd-scanlines bg-slate-400/10'
          : 'lcd-scanlines'
      } ${className}`}
      aria-hidden="true"
    />
  );
};

