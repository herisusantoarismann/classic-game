import React from 'react';
import { TactileKey } from '../atoms/TactileKey';
import type { InputAction } from '../../core/engine/types';

interface DPadProps {
  onAction: (action: InputAction) => void;
  onRelease?: (action: InputAction) => void;
  className?: string;
}

export const DPad: React.FC<DPadProps> = ({ onAction, onRelease, className = '' }) => {
  return (
    <div
      className={`grid grid-cols-3 grid-rows-3 gap-1.5 w-38 h-38 sm:w-44 sm:h-44 touch-manipulation ${className}`}
    >
      {/* Top Row */}
      <div />
      <TactileKey
        label="▲"
        subLabel="2"
        variant="nav"
        onPress={() => onAction('UP')}
        onRelease={() => onRelease?.('UP')}
        ariaLabel="Up"
        className="h-full"
      />
      <div />

      {/* Middle Row */}
      <TactileKey
        label="◄"
        subLabel="4"
        variant="nav"
        onPress={() => onAction('LEFT')}
        onRelease={() => onRelease?.('LEFT')}
        ariaLabel="Left"
        className="h-full"
      />
      <TactileKey
        label="OK"
        subLabel="5"
        variant="primary"
        onPress={() => onAction('ACTION')}
        onRelease={() => onRelease?.('ACTION')}
        ariaLabel="Action / OK"
        className="h-full border-[#1e2229]"
      />
      <TactileKey
        label="►"
        subLabel="6"
        variant="nav"
        onPress={() => onAction('RIGHT')}
        onRelease={() => onRelease?.('RIGHT')}
        ariaLabel="Right"
        className="h-full"
      />

      {/* Bottom Row */}
      <div />
      <TactileKey
        label="▼"
        subLabel="8"
        variant="nav"
        onPress={() => onAction('DOWN')}
        onRelease={() => onRelease?.('DOWN')}
        ariaLabel="Down"
        className="h-full"
      />
      <div />
    </div>
  );
};
