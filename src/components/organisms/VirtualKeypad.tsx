import React from 'react';
import { TactileKey } from '../atoms/TactileKey';
import { DPad } from '../molecules/DPad';
import { NumpadGrid } from '../molecules/NumpadGrid';
import type { InputAction } from '../../core/engine/types';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface VirtualKeypadProps {
  onAction: (action: InputAction) => void;
  onRelease?: (action: InputAction) => void;
  audio?: RetroAudioSynth;
  onExit?: () => void;
  className?: string;
}

export const VirtualKeypad: React.FC<VirtualKeypadProps> = ({
  onAction,
  onRelease,
  audio,
  onExit,
  className = '',
}) => {
  const handleKeyAction = (action: InputAction) => {
    audio?.playKeyClick();
    onAction(action);
  };

  const handleKeyRelease = (action: InputAction) => {
    onRelease?.(action);
  };

  return (
    <div
      className={`flex flex-col items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#e2ddd1] border-2 sm:border-3 border-[#1e2229] shadow-[3px_3px_0px_#1e2229] sm:shadow-[5px_5px_0px_#1e2229] select-none ${className}`}
    >
      {/* Top Model Badge */}
      <div className="w-full flex items-center justify-between pb-1 px-1 border-b border-[#cec7b8] text-[9px] sm:text-[10px] font-mono font-bold text-[#687082]">
        <span>TACTILE KEYPAD</span>
        <span className="text-[#227a3a]">HAPTIC READY</span>
      </div>

      {/* Softkeys & Action Row */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full max-w-[270px] sm:max-w-[280px]">
        <TactileKey
          label="PILIH"
          subLabel="Menu"
          variant="secondary"
          onPress={() => handleKeyAction('SOFT_LEFT')}
          onRelease={() => handleKeyRelease('SOFT_LEFT')}
          className="h-9.5 sm:h-11 text-[11px] sm:text-xs"
        />
        <TactileKey
          label="✆"
          variant="accent-green"
          onPress={() => handleKeyAction('ACTION')}
          onRelease={() => handleKeyRelease('ACTION')}
          ariaLabel="Call / Start"
          className="h-9.5 sm:h-11 text-sm sm:text-base font-black"
        />
        <TactileKey
          label="📵"
          variant="accent-red"
          onPress={() => {
            handleKeyAction('SOFT_RIGHT');
            if (onExit) onExit();
          }}
          onRelease={() => handleKeyRelease('SOFT_RIGHT')}
          ariaLabel="End / Back"
          className="h-9.5 sm:h-11 text-sm sm:text-base font-black"
        />
        <TactileKey
          label="KELUAR"
          subLabel="Back"
          variant="secondary"
          onPress={() => {
            if (onExit) onExit();
          }}
          className="h-9.5 sm:h-11 text-[11px] sm:text-xs"
        />
      </div>

      {/* D-Pad Navigation */}
      <DPad onAction={handleKeyAction} onRelease={handleKeyRelease} />

      {/* 3x4 Numpad */}
      <NumpadGrid onAction={handleKeyAction} onRelease={handleKeyRelease} />
    </div>
  );
};
