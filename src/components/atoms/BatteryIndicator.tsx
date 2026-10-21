import React from 'react';

interface BatteryIndicatorProps {
  level?: number; // 0 to 3 blocks
  className?: string;
}

export const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({ level = 3, className = '' }) => {
  return (
    <div className={`flex items-center gap-[1px] ${className}`} title={`Battery: ${level}/3 blocks`}>
      <div className="flex items-center gap-[1px] border border-current px-[1px] py-[2px] rounded-[2px] h-3">
        {[1, 2, 3].map((block) => (
          <span
            key={block}
            className={`w-[2px] h-2 rounded-[0.5px] ${
              block <= level ? 'bg-current opacity-90' : 'bg-current opacity-15'
            }`}
          />
        ))}
      </div>
      <span className="w-[1px] h-1.5 bg-current rounded-r-[0.5px] opacity-80" />
    </div>
  );
};

