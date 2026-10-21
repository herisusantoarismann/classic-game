import React from 'react';

interface SignalIndicatorProps {
  bars?: number; // 0 to 4
  className?: string;
}

export const SignalIndicator: React.FC<SignalIndicatorProps> = ({ bars = 4, className = '' }) => {
  return (
    <div className={`flex items-end gap-[2px] h-3 ${className}`} title={`Signal: ${bars}/4 bars`}>
      <span className="text-[9px] font-mono mr-0.5 font-bold leading-none select-none">Y</span>
      {[1, 2, 3, 4].map((level) => (
        <span
          key={level}
          className={`w-[2px] rounded-xs transition-opacity ${
            level <= bars ? 'bg-current opacity-90' : 'bg-current opacity-20'
          }`}
          style={{ height: `${level * 2.5 + 2}px` }}
        />
      ))}
    </div>
  );
};

