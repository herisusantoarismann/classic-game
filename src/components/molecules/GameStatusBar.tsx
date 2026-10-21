import React from 'react';
import { SignalIndicator } from '../atoms/SignalIndicator';
import { BatteryIndicator } from '../atoms/BatteryIndicator';

interface GameStatusBarProps {
  operatorName?: string;
  className?: string;
}

export const GameStatusBar: React.FC<GameStatusBarProps> = ({
  operatorName = 'RETRO-GSM',
  className = '',
}) => {
  const customLogoUrl = typeof window !== 'undefined' ? localStorage.getItem('retropocket_custom_logo_url') : null;

  return (
    <div
      className={`flex items-center justify-between px-2 py-1 select-none font-pixel text-[8px] sm:text-[9px] font-bold text-[#142410] bg-[#879571] border-b border-[#142410]/20 ${className}`}
    >
      <SignalIndicator bars={4} />
      {customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt="Operator Logo"
          className="h-3 max-w-[72px] object-contain block"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <span className="tracking-widest opacity-85 uppercase font-pixel">{operatorName}</span>
      )}
      <BatteryIndicator level={3} />
    </div>
  );
};

