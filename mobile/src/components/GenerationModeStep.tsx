import React from 'react';
import {
  Wand2,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { ExamType } from './ChooseExamStep';

interface GenerationModeStepProps {
  selectedExam: ExamType;
  targetQuestions: number;
  selectedChapters: string[];
  selectedConcepts: string[];
  onSelectMode: (mode: 'auto' | 'manual') => void;
  onBack: () => void;
}

export const GenerationModeStep: React.FC<GenerationModeStepProps> = ({
  selectedExam,
  targetQuestions,
  selectedChapters,
  selectedConcepts,
  onSelectMode,
  onBack,
}) => {
  const examTitle = selectedExam === 'JEE' ? 'JEE Main' : selectedExam;

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#C8A96A] uppercase tracking-wider font-heading">
          <Sparkles className="h-4 w-4" />
          <span>Step 4 • Assembly Method Selection</span>
        </div>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
          Choose Assembly Method
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          How would you like to assemble your {examTitle} paper ({targetQuestions} Questions)?
        </p>
      </div>

      {/* Mode Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Card 1: Auto-Fetch */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMode('auto')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectMode('auto');
            }
          }}
          className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#141414] p-6 sm:p-8 hover:border-[#C8A96A] hover:bg-[#181818] active:scale-[0.99] transition-all cursor-pointer shadow-xl hover:shadow-[#C8A96A]/10 select-none ring-0 focus:outline-none focus:ring-2 focus:ring-[#C8A96A]/50"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C8A96A] to-[#A68B4F] text-[#0D0D0D] shadow-lg shadow-[#C8A96A]/20">
                <Wand2 className="h-6 w-6 stroke-[2.5]" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMode('auto');
                }}
                className="rounded-full bg-[#C8A96A]/15 hover:bg-[#C8A96A]/25 px-3 py-1 text-[11px] font-black text-[#C8A96A] border border-[#C8A96A]/30 uppercase tracking-wider transition-colors cursor-pointer"
              >
                ⚡ Auto-Fetch
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-white font-heading group-hover:text-[#C8A96A] transition-colors">
              Automatic Blueprint Engine
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Let the system auto-balance chapter questions, format allocations (MCQs, Assertion-Reason, Diagrams, Match Pairs), and difficulty distribution (30% Easy, 50% Medium, 20% Hard) according to official NTA patterns.
            </p>

            {/* Feature Bullets */}
            <div className="mt-6 space-y-2.5 pt-4 border-t border-white/5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#C8A96A] shrink-0" />
                <span>Auto-distributes across {selectedChapters.length} chapters & {selectedConcepts.length} concepts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#C8A96A] shrink-0" />
                <span>Configurable sliders for Easy, Medium, and Hard balance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#C8A96A] shrink-0" />
                <span>Instant generation with synchronized Sets P, Q, R, S</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMode('auto');
              }}
              className="glow-button w-full flex items-center justify-center gap-2 py-3 text-xs font-black text-[#0D0D0D] cursor-pointer"
            >
              <span>Continue with Auto-Fetch</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Manual Selection */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectMode('manual')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectMode('manual');
            }
          }}
          className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#141414] p-6 sm:p-8 hover:border-emerald-500/60 hover:bg-[#181818] active:scale-[0.99] transition-all cursor-pointer shadow-xl hover:shadow-emerald-500/10 select-none ring-0 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <Sliders className="h-6 w-6 stroke-[2.5]" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMode('manual');
                }}
                className="rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1 text-[11px] font-black text-emerald-400 border border-emerald-500/30 uppercase tracking-wider transition-colors cursor-pointer"
              >
                ✍️ Manual Selection
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-white font-heading group-hover:text-emerald-400 transition-colors">
              Manual Question Selector
            </h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Hand-pick every single question from the repository. Filter by specific chapter, concept, question type (MCQ, Assertion-Reason, Statements, Match Pairs, Numericals), and difficulty level (Easy, Medium, Hard).
            </p>

            {/* Feature Bullets */}
            <div className="mt-6 space-y-2.5 pt-4 border-t border-white/5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Filter by Chapter, Concept, Type, and Difficulty</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Preview question statements, diagrams, and options before picking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Live quota tracking ({targetQuestions} questions max) with Done button</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMode('manual');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
            >
              <span>Hand-Pick Questions Manually</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex items-center justify-start pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#141414] px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-[#C8A96A]/40 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Concepts</span>
        </button>
      </div>
    </div>
  );
};
