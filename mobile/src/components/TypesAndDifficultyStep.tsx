import React, { useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  Minus,
  Sliders,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ExamType } from './ChooseExamStep';
import { TypeAllocationConfig } from './MethodAllocationStep';

interface TypesAndDifficultyStepProps {
  selectedExam: ExamType;
  targetQuestions: number;
  allocation: TypeAllocationConfig;
  onUpdateAllocation: (updated: TypeAllocationConfig) => void;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  userSubject: string;
}

export const TypesAndDifficultyStep: React.FC<TypesAndDifficultyStepProps> = ({
  selectedExam,
  targetQuestions,
  allocation,
  onUpdateAllocation,
  onBack,
  onGenerate,
  isGenerating,
  userSubject,
}) => {
  const isJEE = selectedExam === 'JEE';
  const isNEET = selectedExam === 'NEET';
  const isKCET = selectedExam === 'KCET';

  // Total allocated across question types
  const totalAllocated = useMemo(() => {
    return (
      (allocation.singleMcq || 0) +
      (allocation.assertionReason || 0) +
      (allocation.statements || 0) +
      (allocation.matchPairs || 0) +
      (allocation.diagrammatic || 0) +
      (allocation.numerical || 0)
    );
  }, [allocation]);

  const isTypeBalanced = totalAllocated === targetQuestions;
  const jeeNumericalValid = !isJEE || allocation.numerical === 5;

  // Question Types definition - Strictly exclude numericals for NEET & KCET
  const questionTypes = [
    {
      id: 'singleMcq' as const,
      name: 'Single Choice MCQ',
      desc: 'Standard objective multiple-choice questions with 4 distinct options and 1 correct answer',
      badge: 'Core MCQ',
      color: 'emerald',
      disabled: false,
    },
    {
      id: 'assertionReason' as const,
      name: 'Assertion & Reasoning',
      desc: 'Analytical evaluation of Assertion (A) and Reason (R) statements',
      badge: 'Analytical',
      color: 'amber',
      disabled: false,
    },
    {
      id: 'statements' as const,
      name: 'Statement Based Questions',
      desc: 'Dual-statement evaluation (Statement I and Statement II)',
      badge: 'Statement I & II',
      color: 'cyan',
      disabled: false,
    },
    {
      id: 'matchPairs' as const,
      name: 'Match the Following',
      desc: 'Dual-column correlation matching List-I with List-II',
      badge: 'Match Matrix',
      color: 'purple',
      disabled: false,
    },
    {
      id: 'diagrammatic' as const,
      name: 'Diagrammatic Questions',
      desc: 'Visual apparatus, reaction graphs, and molecular structure representations',
      badge: 'Visual & Graph',
      color: 'indigo',
      disabled: false,
    },
    ...((isJEE || selectedExam === 'ASSIGNMENT') ? [{
      id: 'numerical' as const,
      name: 'Numerical / Integer Questions',
      desc: isJEE
        ? 'Mandatory 5 Integer-Type Questions for Section B (NTA Pattern)'
        : 'Numerical questions with numeric/decimal value response',
      badge: isJEE ? 'Mandatory JEE Sec B' : 'Numerical',
      color: 'rose',
      disabled: false,
    }] : []),
  ];

  // Presets
  const handleApplyPreset = (preset: 'standard' | 'balanced' | 'mcq') => {
    if (preset === 'standard') {
      if (isNEET) {
        onUpdateAllocation({
          ...allocation,
          singleMcq: 28,
          assertionReason: 5,
          statements: 4,
          matchPairs: 3,
          diagrammatic: 5,
          numerical: 0,
        });
      } else if (isJEE) {
        onUpdateAllocation({
          ...allocation,
          singleMcq: 14,
          assertionReason: 2,
          statements: 2,
          matchPairs: 1,
          diagrammatic: 1,
          numerical: 5,
        });
      } else {
        // KCET 60 Qs
        onUpdateAllocation({
          ...allocation,
          singleMcq: 46,
          assertionReason: 5,
          statements: 4,
          matchPairs: 2,
          diagrammatic: 3,
          numerical: 0,
        });
      }
    } else if (preset === 'balanced') {
      if (isJEE) {
        onUpdateAllocation({
          ...allocation,
          singleMcq: 12,
          assertionReason: 3,
          statements: 3,
          matchPairs: 1,
          diagrammatic: 1,
          numerical: 5,
        });
      } else if (isNEET) {
        onUpdateAllocation({
          ...allocation,
          singleMcq: 22,
          assertionReason: 8,
          statements: 6,
          matchPairs: 4,
          diagrammatic: 5,
          numerical: 0,
        });
      } else {
        // KCET
        onUpdateAllocation({
          ...allocation,
          singleMcq: 36,
          assertionReason: 8,
          statements: 6,
          matchPairs: 4,
          diagrammatic: 6,
          numerical: 0,
        });
      }
    } else {
      // Pure MCQ
      if (isJEE) {
        onUpdateAllocation({
          ...allocation,
          singleMcq: 20,
          assertionReason: 0,
          statements: 0,
          matchPairs: 0,
          diagrammatic: 0,
          numerical: 5,
        });
      } else {
        onUpdateAllocation({
          ...allocation,
          singleMcq: targetQuestions,
          assertionReason: 0,
          statements: 0,
          matchPairs: 0,
          diagrammatic: 0,
          numerical: 0,
        });
      }
    }
  };

  const updateTypeCount = (key: keyof TypeAllocationConfig, delta: number) => {
    const current = (allocation[key] as number) || 0;
    const next = Math.max(0, current + delta);
    onUpdateAllocation({
      ...allocation,
      [key]: next,
    });
  };

  const handleDirectTypeInput = (key: keyof TypeAllocationConfig, value: string) => {
    const parsed = parseInt(value, 10);
    const next = isNaN(parsed) ? 0 : Math.max(0, parsed);
    onUpdateAllocation({
      ...allocation,
      [key]: next,
    });
  };

  // Difficulty auto-balancing logic
  const handleDifficultyChange = (tier: 'easy' | 'medium' | 'hard', newVal: number) => {
    const val = Math.max(0, Math.min(100, newVal));
    const currentEasy = allocation.easyPct;
    const currentMed = allocation.mediumPct;
    const currentHard = allocation.hardPct;

    if (tier === 'easy') {
      const remaining = 100 - val;
      const otherTotal = currentMed + currentHard;
      let newMed = 0;
      let newHard = 0;
      if (otherTotal > 0) {
        newMed = Math.round((currentMed / otherTotal) * remaining);
        newHard = remaining - newMed;
      } else {
        newMed = Math.floor(remaining / 2);
        newHard = remaining - newMed;
      }
      onUpdateAllocation({
        ...allocation,
        easyPct: val,
        mediumPct: newMed,
        hardPct: newHard,
      });
    } else if (tier === 'medium') {
      const remaining = 100 - val;
      const otherTotal = currentEasy + currentHard;
      let newEasy = 0;
      let newHard = 0;
      if (otherTotal > 0) {
        newEasy = Math.round((currentEasy / otherTotal) * remaining);
        newHard = remaining - newEasy;
      } else {
        newEasy = Math.floor(remaining / 2);
        newHard = remaining - newEasy;
      }
      onUpdateAllocation({
        ...allocation,
        easyPct: newEasy,
        mediumPct: val,
        hardPct: newHard,
      });
    } else {
      const remaining = 100 - val;
      const otherTotal = currentEasy + currentMed;
      let newEasy = 0;
      let newMed = 0;
      if (otherTotal > 0) {
        newEasy = Math.round((currentEasy / otherTotal) * remaining);
        newMed = remaining - newEasy;
      } else {
        newEasy = Math.floor(remaining / 2);
        newMed = remaining - newEasy;
      }
      onUpdateAllocation({
        ...allocation,
        easyPct: newEasy,
        mediumPct: newMed,
        hardPct: val,
      });
    }
  };

  // Approximate questions per difficulty
  const easyQs = Math.round((targetQuestions * allocation.easyPct) / 100);
  const medQs = Math.round((targetQuestions * allocation.mediumPct) / 100);
  const hardQs = targetQuestions - easyQs - medQs;
  const totalDifficulty = allocation.easyPct + allocation.mediumPct + allocation.hardPct;

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#C8A96A] uppercase tracking-wider font-heading">
          <span>Step 6 • Question Typology & Cognitive Balance</span>
        </div>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
          Question Types & Difficulty Distribution
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Configure exact counts for each question format and set difficulty balance for {selectedExam}.
        </p>
      </div>

      {/* JEE Main Special Notice */}
      {isJEE && (
        <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs text-cyan-200">
          <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0" />
          <div>
            <strong className="font-bold text-white">NTA JEE Main Specification Enforced:</strong>{' '}
            Section B strictly requires exactly 5 Numerical / Integer questions (+4, -1 marking).
          </div>
        </div>
      )}

      {/* SECTION 1: QUESTION TYPES ALLOCATION */}
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              1. Question Formats & Typology
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Allocate counts for MCQs, Assertion-Reasoning, Statements, etc.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('standard')}
              className="rounded-lg border border-white/10 bg-[#1A1A1A] px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-[#C8A96A]/40 transition-colors cursor-pointer"
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('balanced')}
              className="rounded-lg border border-white/10 bg-[#1A1A1A] px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-[#C8A96A]/40 transition-colors cursor-pointer"
            >
              Conceptual
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('mcq')}
              className="rounded-lg border border-white/10 bg-[#1A1A1A] px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-[#C8A96A]/40 transition-colors cursor-pointer"
            >
              Pure MCQ
            </button>
          </div>
        </div>

        {/* Types Stepper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {questionTypes.map((t) => {
            const count = (allocation[t.id] as number) || 0;
            return (
              <div
                key={t.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-[#1A1A1A] hover:border-white/15 transition-all"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-heading">
                      {t.name}
                    </span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-[#C8A96A]">
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight line-clamp-1 mt-0.5">
                    {t.desc}
                  </p>
                </div>

                {/* Numeric Stepper */}
                <div className="flex items-center rounded-lg border border-white/10 bg-[#141414] p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateTypeCount(t.id, -1)}
                    disabled={t.id === 'numerical' && isJEE && count <= 5}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={t.id === 'numerical' && isJEE ? 5 : 0}
                    max={targetQuestions}
                    value={count}
                    onChange={(e) => handleDirectTypeInput(t.id, e.target.value)}
                    className="w-12 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateTypeCount(t.id, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Type Allocation Balance Indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
          <span className="text-slate-400">
            Total Allocated across formats:{' '}
            <strong className={isTypeBalanced ? 'text-emerald-400' : 'text-amber-400'}>
              {totalAllocated} / {targetQuestions} Qs
            </strong>
          </span>
          {isTypeBalanced ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Ready
            </span>
          ) : (
            <span className="text-amber-400 font-semibold">
              Adjust counts to equal {targetQuestions}
            </span>
          )}
        </div>
      </div>

      {/* SECTION 2: DIFFICULTY DISTRIBUTION (EXACT RECREATION OF USER IMAGE 1 IN APP CONTRAST THEME) */}
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 sm:p-6 shadow-xl space-y-5">
        {/* Header matching Image 1: DIFFICULTY DISTRIBUTION ... Total: 100% */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-heading">
            DIFFICULTY DISTRIBUTION
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-black tracking-wide ${
              totalDifficulty === 100
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            Total: {totalDifficulty}%
          </span>
        </div>

        {/* 3 Difficulty Cards (Easy, Medium, Hard) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: EASY */}
          <div className="rounded-2xl border border-emerald-500/30 bg-[#1A1A1A] p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/50 transition-all">
            <div className="text-center">
              <span className="text-xs font-black tracking-widest uppercase text-emerald-400 font-heading">
                EASY
              </span>
            </div>

            {/* Large White/Black Numeric Box */}
            <div className="rounded-xl border border-emerald-500/40 bg-[#0D0D0D] py-3 text-center shadow-inner">
              <span className="text-3xl font-black text-white font-heading tracking-tight">
                {allocation.easyPct}
              </span>
            </div>

            {/* Slider with Emerald Track */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={100}
                value={allocation.easyPct}
                onChange={(e) => handleDifficultyChange('easy', parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-emerald-950 rounded-lg"
              />
              <div className="text-center pt-1 text-xs font-bold text-slate-400">
                ~{easyQs} Qs
              </div>
            </div>
          </div>

          {/* Card 2: MEDIUM */}
          <div className="rounded-2xl border border-[#C8A96A]/40 bg-[#1A1A1A] p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-lg shadow-[#C8A96A]/5 hover:border-[#C8A96A] transition-all">
            <div className="text-center">
              <span className="text-xs font-black tracking-widest uppercase text-[#C8A96A] font-heading">
                MEDIUM
              </span>
            </div>

            {/* Large Numeric Box */}
            <div className="rounded-xl border border-[#C8A96A]/40 bg-[#0D0D0D] py-3 text-center shadow-inner">
              <span className="text-3xl font-black text-white font-heading tracking-tight">
                {allocation.mediumPct}
              </span>
            </div>

            {/* Slider with Gold/Amber Track */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={100}
                value={allocation.mediumPct}
                onChange={(e) => handleDifficultyChange('medium', parseInt(e.target.value, 10))}
                className="w-full accent-[#C8A96A] cursor-pointer h-2 bg-amber-950 rounded-lg"
              />
              <div className="text-center pt-1 text-xs font-bold text-slate-400">
                ~{medQs} Qs
              </div>
            </div>
          </div>

          {/* Card 3: HARD */}
          <div className="rounded-2xl border border-rose-500/30 bg-[#1A1A1A] p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-lg shadow-rose-500/5 hover:border-rose-500/50 transition-all">
            <div className="text-center">
              <span className="text-xs font-black tracking-widest uppercase text-rose-400 font-heading">
                HARD
              </span>
            </div>

            {/* Large Numeric Box */}
            <div className="rounded-xl border border-rose-500/40 bg-[#0D0D0D] py-3 text-center shadow-inner">
              <span className="text-3xl font-black text-white font-heading tracking-tight">
                {allocation.hardPct}
              </span>
            </div>

            {/* Slider with Rose Track */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={100}
                value={allocation.hardPct}
                onChange={(e) => handleDifficultyChange('hard', parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer h-2 bg-rose-950 rounded-lg"
              />
              <div className="text-center pt-1 text-xs font-bold text-slate-400">
                ~{hardQs} Qs
              </div>
            </div>
          </div>
        </div>

        {/* Caption matching Image 1 */}
        <p className="text-xs text-slate-400 leading-relaxed pt-1">
          Questions will be fetched matching this difficulty distribution. Sliders auto-balance to 100%.
        </p>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 z-30 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0D0D0D]/95 p-4 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161616] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-white/30 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Questions/Ch</span>
        </button>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!isTypeBalanced || !jeeNumericalValid || isGenerating}
          className="glow-button flex items-center gap-2 px-6 py-3.5 text-xs font-black text-[#0D0D0D] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" />
          <span>
            {isGenerating ? 'Compiling Paper Blueprint...' : 'Compile & Generate Examination Paper →'}
          </span>
        </button>
      </div>
    </div>
  );
};
