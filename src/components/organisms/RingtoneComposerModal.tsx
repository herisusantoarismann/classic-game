import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Music, RotateCcw, X } from 'lucide-react';
import type { RetroAudioSynth } from '../../core/audio/RetroAudioSynth';

interface RingtoneComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  audio: RetroAudioSynth;
}

interface Note {
  duration: number; // 1, 2, 4, 8, 16, 32
  pitch: string; // 'c', 'd', 'e', 'f', 'g', 'a', 'b', '-' (rest)
  isSharp: boolean;
  octave: number; // 1, 2, 3
  isDotted: boolean;
}

const PRESETS: Record<string, string> = {
  'Nokia Tune': '16e2 16d2 8f#1 8g#1 16c#2 16b1 8d1 8e1 16b1 16a1 8c#1 8e1 2a1',
  'Kick Ringtone': '8e2 8e2 8e2 8e2 8e2 8e2 8c2 8d2 8e2 8d2 8c2 4e2',
  'Mission Impossible': '16d2 16- 16d2 16- 16f2 16- 16g2 16- 16d2 16- 16d2 16- 16c2 16- 16c#2',
  'Für Elise': '16e2 16d#2 16e2 16d#2 16e2 16b1 16d2 16c2 8a1 16- 16c1 16e1 16a1 8b1',
  'The Godfather': '8e1 8a1 8c2 8b1 8a1 8c2 8a1 8b1 8a1 8f1 4g1 4e1',
};

// Base frequencies for Octave 1
const NOTE_FREQS: Record<string, number> = {
  c: 261.63,
  'c#': 277.18,
  d: 293.66,
  'd#': 311.13,
  e: 329.63,
  f: 349.23,
  'f#': 369.99,
  g: 392.0,
  'g#': 415.3,
  a: 440.0,
  'a#': 466.16,
  b: 493.88,
};

export const RingtoneComposerModal: React.FC<RingtoneComposerModalProps> = ({
  isOpen,
  onClose,
  audio,
}) => {
  const [notation, setNotation] = useState<string>(PRESETS['Nokia Tune']);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimeoutRef = useRef<number[]>([]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    for (const t of playTimeoutRef.current) {
      window.clearTimeout(t);
    }
    playTimeoutRef.current = [];
  }, []);

  // Clear pending audio timeouts on unmount
  useEffect(() => {
    return () => {
      for (const t of playTimeoutRef.current) {
        window.clearTimeout(t);
      }
      playTimeoutRef.current = [];
    };
  }, []);

  if (!isOpen) return null;

  const parseNotation = (str: string): Note[] => {
    const tokens = str.trim().split(/\s+/);
    const notes: Note[] = [];

    for (const tok of tokens) {
      const match = tok.match(/^(\d+)?([a-g-])(#)?(\.)?(\d)?$/i);
      if (match) {
        const dur = match[1] ? parseInt(match[1], 10) : 4;
        const pitch = match[2].toLowerCase();
        const isSharp = !!match[3];
        const isDotted = !!match[4];
        const oct = match[5] ? parseInt(match[5], 10) : 1;

        notes.push({
          duration: dur,
          pitch,
          isSharp,
          octave: oct,
          isDotted,
        });
      }
    }
    return notes;
  };

  const playMelody = () => {
    stopPlayback();
    setIsPlaying(true);

    const notes = parseNotation(notation);
    if (notes.length === 0) {
      setIsPlaying(false);
      return;
    }

    const tempoBpm = 140;
    const quarterNoteSec = 60 / tempoBpm;

    let currentTimeMs = 0;

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      let durSec = (4 / n.duration) * quarterNoteSec;
      if (n.isDotted) durSec *= 1.5;

      const durMs = durSec * 1000;

      if (n.pitch !== '-') {
        const noteKey = n.isSharp ? `${n.pitch}#` : n.pitch;
        const baseFreq = NOTE_FREQS[noteKey] || 440;
        const freq = baseFreq * Math.pow(2, n.octave - 1);

        const timeoutId = window.setTimeout(() => {
          audio.playTone(freq, 'square', durSec * 0.88, 0.08);
        }, currentTimeMs);
        playTimeoutRef.current.push(timeoutId);
      }

      currentTimeMs += durMs;
    }

    // Finish melody
    const endTimeout = window.setTimeout(() => {
      setIsPlaying(false);
    }, currentTimeMs + 100);
    playTimeoutRef.current.push(endTimeout);
  };

  const handleKeypadPress = (key: string) => {
    audio.playKeyClick();
    if (['1', '2', '3', '4', '5', '6', '7'].includes(key)) {
      const pitches: Record<string, string> = {
        '1': 'c',
        '2': 'd',
        '3': 'e',
        '4': 'f',
        '5': 'g',
        '6': 'a',
        '7': 'b',
      };
      setNotation((prev) => `${prev} 4${pitches[key]}1`.trim());
    } else if (key === '0') {
      setNotation((prev) => `${prev} 4-`.trim());
    } else if (key === '#') {
      // Toggle sharp on last note
      setNotation((prev) => {
        const parts = prev.trim().split(/\s+/);
        if (parts.length === 0) return prev;
        const last = parts[parts.length - 1];
        if (last.includes('#')) {
          parts[parts.length - 1] = last.replace('#', '');
        } else if (!last.includes('-')) {
          parts[parts.length - 1] = last.replace(/([a-g])/i, '$1#');
        }
        return parts.join(' ');
      });
    } else if (key === '*') {
      // Cycle octave 1 -> 2 -> 3
      setNotation((prev) => {
        const parts = prev.trim().split(/\s+/);
        if (parts.length === 0) return prev;
        const last = parts[parts.length - 1];
        if (last.includes('1')) parts[parts.length - 1] = last.replace('1', '2');
        else if (last.includes('2')) parts[parts.length - 1] = last.replace('2', '3');
        else if (last.includes('3')) parts[parts.length - 1] = last.replace('3', '1');
        else parts[parts.length - 1] = `${last}2`;
        return parts.join(' ');
      });
    }
  };

  const handleLoadPreset = (name: string) => {
    stopPlayback();
    setNotation(PRESETS[name]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md rounded-2xl bg-[#e2ddd1] border-3 border-[#1e2229] shadow-[6px_6px_0px_#1e2229] overflow-hidden p-4 sm:p-5 flex flex-col gap-4 font-mono">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#1e2229]">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-[#144299]" />
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#1e2229]">
              NOKIA COMPOSER
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopPlayback();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-[#d5cfc2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {Object.keys(PRESETS).map((pName) => (
            <button
              key={pName}
              type="button"
              onClick={() => handleLoadPreset(pName)}
              className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#fbf9f4] hover:bg-[#144299] hover:text-white border border-[#1e2229] whitespace-nowrap shadow-[1px_1px_0px_#1e2229] transition-all cursor-pointer"
            >
              {pName}
            </button>
          ))}
        </div>

        {/* Nokia Green LCD Composer Display */}
        <div className="rounded-xl bg-[#879571] border-2 border-[#1e2229] p-3 shadow-inner">
          <div className="flex items-center justify-between text-[10px] font-bold text-[#142410] border-b border-[#142410]/30 pb-1 mb-2">
            <span>TEMPO: 140 BPM</span>
            <span>NOTASI 3310</span>
          </div>
          <textarea
            value={notation}
            onChange={(e) => setNotation(e.target.value)}
            rows={3}
            className="w-full bg-transparent border-0 text-[#142410] font-mono text-xs font-bold leading-relaxed resize-none focus:outline-none"
            placeholder="16e2 16d2 8f#1 8g#1..."
          />
        </div>

        {/* Controls Bar: Play / Stop / Clear */}
        <div className="flex items-center justify-between gap-2">
          {isPlaying ? (
            <button
              type="button"
              onClick={stopPlayback}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#c0392b] text-white border-2 border-[#1e2229] font-bold text-xs shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>BERHENTI</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={playMelody}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#227a3a] text-white border-2 border-[#1e2229] font-bold text-xs shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>PUTAR NADA</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setNotation('')}
            title="Bersihkan Notasi"
            className="px-3 py-2 rounded-xl bg-[#ded9cd] hover:bg-[#e8e3d7] text-[#1e2229] border-2 border-[#1e2229] font-bold text-xs shadow-[2px_2px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nokia 3310 Keypad Composer Buttons */}
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-[#d8d3c5] border border-[#1e2229]">
          {[
            { k: '1', label: '1: DO (C)' },
            { k: '2', label: '2: RE (D)' },
            { k: '3', label: '3: MI (E)' },
            { k: '4', label: '4: FA (F)' },
            { k: '5', label: '5: SOL (G)' },
            { k: '6', label: '6: LA (A)' },
            { k: '7', label: '7: SI (B)' },
            { k: '0', label: '0: JEDA (-)' },
            { k: '#', label: '#: KRES (#)' },
          ].map((item) => (
            <button
              key={item.k}
              type="button"
              onClick={() => handleKeypadPress(item.k)}
              className="py-1.5 rounded-lg bg-[#fbf9f4] hover:bg-[#e8e3d7] text-[#1e2229] border border-[#1e2229] text-[10px] font-bold shadow-[1px_1px_0px_#1e2229] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer text-center"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
