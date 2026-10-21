import React from 'react';
import { TactileKey } from '../atoms/TactileKey';
import type { InputAction } from '../../core/engine/types';

interface NumpadGridProps {
  onAction: (action: InputAction) => void;
  onRelease?: (action: InputAction) => void;
  className?: string;
}

export const NumpadGrid: React.FC<NumpadGridProps> = ({ onAction, onRelease, className = '' }) => {
  const keys: Array<{ label: string; subLabel: string; action: InputAction }> = [
    { label: '1', subLabel: '._@', action: 'NUM_1' },
    { label: '2', subLabel: 'abc', action: 'NUM_2' },
    { label: '3', subLabel: 'def', action: 'NUM_3' },
    { label: '4', subLabel: 'ghi', action: 'NUM_4' },
    { label: '5', subLabel: 'jkl', action: 'NUM_5' },
    { label: '6', subLabel: 'mno', action: 'NUM_6' },
    { label: '7', subLabel: 'pqrs', action: 'NUM_7' },
    { label: '8', subLabel: 'tuv', action: 'NUM_8' },
    { label: '9', subLabel: 'wxyz', action: 'NUM_9' },
    { label: '*', subLabel: '+', action: 'NUM_STAR' },
    { label: '0', subLabel: '␣', action: 'NUM_0' },
    { label: '#', subLabel: '⇧', action: 'NUM_HASH' },
  ];

  return (
    <div className={`grid grid-cols-3 gap-1.5 sm:gap-2 w-full max-w-[260px] sm:max-w-[280px] ${className}`}>
      {keys.map((k) => (
        <TactileKey
          key={k.label}
          label={k.label}
          subLabel={k.subLabel}
          variant="secondary"
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('retropocket-key', { detail: k.label }));
            }
            onAction(k.action);
          }}
          onRelease={() => {
            onRelease?.(k.action);
          }}
          className="h-9 sm:h-11 text-xs sm:text-sm"
        />
      ))}
    </div>
  );
};
