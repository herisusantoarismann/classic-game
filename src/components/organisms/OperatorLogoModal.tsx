import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Paintbrush, Eraser, RotateCcw, X, Check } from 'lucide-react';

interface OperatorLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLogo: (logoDataUrl: string | null) => void;
}

const WIDTH = 72;
const HEIGHT = 24;

export const OperatorLogoModal: React.FC<OperatorLogoModalProps> = ({
  isOpen,
  onClose,
  onSaveLogo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [pixels, setPixels] = useState<boolean[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('retropocket_custom_logo');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === WIDTH * HEIGHT) {
            return parsed;
          }
        } catch {
          // ignore
        }
      }
    }
    return new Array(WIDTH * HEIGHT).fill(false);
  });

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background LCD Olive Green
    ctx.fillStyle = '#879571';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Active Pixels
    ctx.fillStyle = '#142410';
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (pixels[y * WIDTH + x]) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [pixels]);

  useEffect(() => {
    redrawCanvas();
  }, [pixels, redrawCanvas]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'pointerdown') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
      const idx = y * WIDTH + x;
      const targetVal = tool === 'pen';
      if (pixels[idx] !== targetVal) {
        setPixels((prev) => {
          const next = [...prev];
          next[idx] = targetVal;
          return next;
        });
      }
    }
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setPixels(new Array(WIDTH * HEIGHT).fill(false));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      localStorage.setItem('retropocket_custom_logo', JSON.stringify(pixels));
      localStorage.setItem('retropocket_custom_logo_url', dataUrl);
      onSaveLogo(dataUrl);
    }
    onClose();
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('retropocket_custom_logo');
    localStorage.removeItem('retropocket_custom_logo_url');
    onSaveLogo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md rounded-2xl bg-[#e2ddd1] border-3 border-[#1e2229] shadow-[6px_6px_0px_#1e2229] overflow-hidden p-4 sm:p-5 flex flex-col gap-4 font-mono">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#1e2229]">
          <div className="flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-[#144299]" />
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#1e2229]">
              STUDIO LOGO OPERATOR (72x24)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#d5cfc2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Canvas Box */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#879571] border-2 border-[#1e2229] shadow-inner">
          <p className="text-[10px] text-[#142410] font-bold mb-2">
            PREVIEW STATUS BAR NOKIA
          </p>
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full max-w-[288px] h-24 border-2 border-[#142410] touch-none cursor-crosshair rounded-xs shadow-[2px_2px_0px_#142410]"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Tool Selector Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTool('pen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1e2229] text-xs font-bold transition-all cursor-pointer ${
                tool === 'pen'
                  ? 'bg-[#144299] text-white shadow-[2px_2px_0px_#1e2229]'
                  : 'bg-[#ded9cd] text-[#1e2229]'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>PENA</span>
            </button>
            <button
              type="button"
              onClick={() => setTool('eraser')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#1e2229] text-xs font-bold transition-all cursor-pointer ${
                tool === 'eraser'
                  ? 'bg-[#144299] text-white shadow-[2px_2px_0px_#1e2229]'
                  : 'bg-[#ded9cd] text-[#1e2229]'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>HAPUS</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ded9cd] hover:bg-[#e8e3d7] border-2 border-[#1e2229] text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>BERSIHKAN</span>
          </button>
        </div>

        {/* Action Buttons: Pasang & Reset */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 border-t-2 border-[#1e2229]">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#227a3a] text-white border-2 border-[#1e2229] font-bold text-xs shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>PASANG LOGO</span>
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="py-2 rounded-xl bg-[#ded9cd] hover:bg-[#e8e3d7] text-[#1e2229] border-2 border-[#1e2229] font-bold text-xs shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center"
          >
            DEFAULT OPERATOR
          </button>
        </div>
      </div>
    </div>
  );
};
