import React, { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

export interface QuestionDisplaySettings {
  imageAlignment: 'Left' | 'Right' | 'Top' | 'Below' | 'Center';
  optionsPerLine: 1 | 2 | 4;
  imageSize: number; // in pixels, e.g. 180
}

interface QuestionDisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionNumber: number;
  initialSettings?: Partial<QuestionDisplaySettings>;
  onApply: (settings: QuestionDisplaySettings) => void;
}

export const QuestionDisplaySettingsModal: React.FC<QuestionDisplaySettingsModalProps> = ({
  isOpen,
  onClose,
  questionNumber,
  initialSettings,
  onApply,
}) => {
  const [imageAlignment, setImageAlignment] = useState<'Left' | 'Right' | 'Top' | 'Below' | 'Center'>(
    initialSettings?.imageAlignment || 'Center'
  );
  const [optionsPerLine, setOptionsPerLine] = useState<1 | 2 | 4>(
    initialSettings?.optionsPerLine || 2
  );
  const [imageSize, setImageSize] = useState<number>(initialSettings?.imageSize || 180);

  useEffect(() => {
    if (initialSettings) {
      if (initialSettings.imageAlignment) setImageAlignment(initialSettings.imageAlignment);
      if (initialSettings.optionsPerLine) setOptionsPerLine(initialSettings.optionsPerLine);
      if (initialSettings.imageSize) setImageSize(initialSettings.imageSize);
    }
  }, [initialSettings, isOpen]);

  if (!isOpen) return null;

  const handleAdjustSize = (delta: number) => {
    setImageSize((prev) => Math.max(50, Math.min(800, prev + delta)));
  };

  const handleApplyAndClose = () => {
    onApply({
      imageAlignment,
      optionsPerLine,
      imageSize,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 no-print">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 text-[#0A1931] shadow-2xl space-y-4 border border-slate-200">
        {/* Header (Exact Image 4 replica) */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-[#0A1931]">
                QUESTION DISPLAY SETTINGS
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                Question #{questionNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section 1: IMAGE ALIGNMENT (Image 4 exact) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase text-[#0A1931] tracking-wide">
            IMAGE ALIGNMENT
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {(['Left', 'Right', 'Top', 'Below', 'Center'] as const).map((align) => {
              const isSelected = imageAlignment === align;
              return (
                <button
                  key={align}
                  type="button"
                  onClick={() => setImageAlignment(align)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'border-[#001f6d] bg-[#001f6d] text-white shadow'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {align}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: OPTIONS PER LINE (Image 4 exact) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black uppercase text-[#0A1931] tracking-wide">
            OPTIONS PER LINE
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 4] as const).map((cols) => {
              const isSelected = optionsPerLine === cols;
              return (
                <button
                  key={cols}
                  type="button"
                  onClick={() => setOptionsPerLine(cols)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'border-[#001f6d] bg-[#001f6d] text-white shadow'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {cols}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: IMAGE SIZE (Image 4 exact) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase text-[#0A1931] tracking-wide">
              IMAGE SIZE
            </label>
            <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-[#001f6d]">
              {imageSize}px
            </span>
          </div>

          {/* Green Increment Buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            {[10, 25, 50, 100, 250].map((inc) => (
              <button
                key={`plus_${inc}`}
                type="button"
                onClick={() => handleAdjustSize(inc)}
                className="py-1.5 rounded-lg text-xs font-black text-white bg-[#10B981] hover:bg-[#059669] transition-all cursor-pointer shadow-sm"
              >
                +{inc}
              </button>
            ))}
          </div>

          {/* Red Decrement Buttons */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[10, 25, 50, 100, 250].map((dec) => (
              <button
                key={`minus_${dec}`}
                type="button"
                onClick={() => handleAdjustSize(-dec)}
                className="py-1.5 rounded-lg text-xs font-black text-white bg-[#DC2626] hover:bg-[#B91C1C] transition-all cursor-pointer shadow-sm"
              >
                -{dec}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Full-Width Navy Action Button (Image 4 exact) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleApplyAndClose}
            className="w-full py-2.5 rounded-xl bg-[#001f6d] hover:bg-[#00164e] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            APPLY & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
