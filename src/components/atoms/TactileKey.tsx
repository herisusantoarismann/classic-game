import React from 'react';

interface TactileKeyProps {
  label: string;
  subLabel?: string;
  variant?: 'primary' | 'secondary' | 'accent-red' | 'accent-green' | 'nav';
  className?: string;
  onPress: () => void;
  onRelease?: () => void;
  ariaLabel?: string;
}

export const TactileKey: React.FC<TactileKeyProps> = ({
  label,
  subLabel,
  variant = 'primary',
  className = '',
  onPress,
  onRelease,
  ariaLabel,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'accent-green':
        return 'bg-[#227a3a] hover:bg-[#288a42] text-white border-[#174825]';
      case 'accent-red':
        return 'bg-[#c0392b] hover:bg-[#d44333] text-white border-[#7a2016]';
      case 'nav':
        return 'bg-[#d0cac0] hover:bg-[#ddd7cd] text-[#1e242e] border-[#1e2229]';
      case 'secondary':
        return 'bg-[#e5e0d4] hover:bg-[#eeeae0] text-[#1e242e] border-[#1e2229]';
      case 'primary':
      default:
        return 'bg-[#ded9cd] hover:bg-[#e9e4d9] text-[#1e242e] border-[#1e2229]';
    }
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel || label}
      onPointerDown={(e) => {
        // Prevent default touch gestures (e.g. context menu on hold)
        if (e.pointerType === 'touch') {
          e.preventDefault();
        }
        onPress();
      }}
      onPointerUp={() => {
        onRelease?.();
      }}
      onPointerLeave={() => {
        onRelease?.();
      }}
      onPointerCancel={() => {
        onRelease?.();
      }}
      className={`tactile-key relative flex flex-col items-center justify-center rounded-lg border-2 font-mono transition-all duration-75 select-none active:translate-y-1 cursor-pointer font-bold ${getVariantStyles()} ${className}`}
    >
      <span className="text-sm font-bold leading-none tracking-tight font-pixel">{label}</span>
      {subLabel && (
        <span className="mt-0.5 text-[9px] font-semibold tracking-tighter opacity-70 leading-none">
          {subLabel}
        </span>
      )}
    </button>
  );
};
