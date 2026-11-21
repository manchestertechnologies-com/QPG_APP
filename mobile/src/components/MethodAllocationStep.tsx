import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ExamType } from './ChooseExamStep';

export interface TypeAllocationConfig {
  singleMcq: number;
  assertionReason: number;
  statements: number;
  matchPairs: number;
  diagrammatic: number;
  numerical: number;
  easyPct: number;
  mediumPct: number;
  hardPct: number;
}

interface MethodAllocationStepProps {
  examType: ExamType;
  userSubject: string;
  targetQuestions: number;
  allocation: TypeAllocationConfig;
  onUpdateAllocation: (updated: TypeAllocationConfig) => void;
  onBack: () => void;
  onProceed: () => void;
}

export const MethodAllocationStep: React.FC<MethodAllocationStepProps> = ({
  examType,
  userSubject,
  targetQuestions,
  allocation,
  onUpdateAllocation,
  onBack,
  onProceed,
}) => {
  const isJEE = examType === 'JEE';
  const isNEET = examType === 'NEET';
  const isKCET = examType === 'KCET';

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

  const isBalanced = totalAllocated === targetQuestions;
  const jeeNumericalValid = !isJEE || allocation.numerical === 5;

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
          numerical: 5, // Strict JEE Requirement
        });
      } else {
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gold font-heading">
            <span>Step 2 of 5</span>
            <span>•</span>
            <span>Method & Question Allocation</span>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-ink font-heading">
            Question Type Allocation & Method
          </h1>
          <p className="mt-1 text-xs md:text-sm text-slate-500">
            Configure how many MCQs, Assertion-Reasons, Statements, Diagrams, and Numericals to allocate.
          </p>
        </div>

        {/* Live Total Budget Badge */}
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 shadow-lg ${
            isBalanced && jeeNumericalValid
              ? 'border-gold/40 bg-gold/10 text-gold'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-700'
          }`}
        >
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider">Allocated Budget</div>
            <div className="text-base font-black">
              {totalAllocated} / {targetQuestions} Questions
            </div>
          </div>
          {isBalanced && jeeNumericalValid ? (
            <CheckCircle2 className="h-5 w-5 text-gold" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          )}
        </div>
      </div>

      {/* JEE Blueprint Enforcement Notice */}
      {isJEE && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800">
          <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-extrabold uppercase tracking-wide text-amber-700">
              JEE Main Blueprint Mandatory Rule
            </div>
            <p className="mt-0.5 text-slate-600 leading-relaxed">
              • <strong>Section A</strong>: Exactly 20 Multiple Choice Questions (Single Option Correct).<br />
              • <strong>Section B</strong>: Exactly <strong>5 Numerical / Integer Questions (Mandatory)</strong> without options.
            </p>
          </div>
        </div>
      )}

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card p-3 shadow-md">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1 font-heading">
          <Zap className="h-3.5 w-3.5 text-gold" />
          Quick Presets:
        </span>
        <button
          type="button"
          onClick={() => handleApplyPreset('standard')}
          className="rounded-xl border border-gold/30 bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold hover:bg-gold/25 transition-all cursor-pointer"
        >
          ⚡ Standard {examType} Pattern
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('balanced')}
          className="rounded-xl border border-line bg-field px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-gold/30 hover:text-ink transition-all cursor-pointer"
        >
          Balanced (MCQ + AR + Diagrams)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset('mcq')}
          className="rounded-xl border border-line bg-field px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-gold/30 hover:text-ink transition-all cursor-pointer"
        >
          Standard MCQ Focus
        </button>
      </div>

      {/* Question Types Allocation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {
            key: 'singleMcq' as const,
            title: 'Single Correct MCQ',
            desc: 'Standard 4-choice multiple choice questions (A, B, C, D)',
            badge: 'Sec A',
          },
          {
            key: 'assertionReason' as const,
            title: 'Assertion & Reasoning',
            desc: 'Two statements (Assertion A & Reason R) evaluated together',
            badge: 'Sec A',
          },
          {
            key: 'statements' as const,
            title: 'Multiple Statements',
            desc: 'Which of statements I, II, III are correct analysis',
            badge: 'Sec A',
          },
          {
            key: 'matchPairs' as const,
            title: 'Match the Following',
            desc: 'Dual-column match List-I with List-II',
            badge: 'Sec A',
          },
          {
            key: 'diagrammatic' as const,
            title: 'Diagram / Chemical Formula',
            desc: 'Visual chemical structures, graphs, and reaction paths',
            badge: 'Sec A',
          },
          {
            key: 'numerical' as const,
            title: 'Numerical / Integer Type',
            desc: isJEE
              ? 'Compulsory Section B (Exactly 5 required for JEE)'
              : 'Direct numeric answer entry box without options',
            badge: isJEE ? 'Sec B (Mandatory)' : 'Sec B',
            enforced: isJEE,
          },
        ].map((item) => {
          const count = (allocation[item.key] as number) || 0;
          return (
            <div
              key={item.key}
              className={`rounded-2xl border p-4.5 flex flex-col justify-between transition-all ${
                item.enforced && count !== 5
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-line bg-card hover:border-gold/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gold font-heading">
                    {item.badge}
                  </span>
                  <span className="text-base font-black text-ink">{count} Qs</span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-ink font-heading">{item.title}</h3>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Steppers */}
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="text-xs font-semibold text-slate-500">Questions:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateTypeCount(item.key, -1)}
                    disabled={count <= 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-field text-ink hover:border-gold/40 disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-black text-ink">{count}</span>
                  <button
                    type="button"
                    onClick={() => updateTypeCount(item.key, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-field text-ink hover:border-gold/40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Difficulty Mix Sliders */}
      <div className="rounded-2xl border border-line bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider font-heading">
              Difficulty Distribution
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Easy: {allocation.easyPct}% • Med: {allocation.mediumPct}% • Hard: {allocation.hardPct}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Easy */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gold">Easy Level</span>
              <span className="text-ink">{allocation.easyPct}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={allocation.easyPct}
              onChange={(e) => {
                const easy = parseInt(e.target.value);
                const remaining = 100 - easy;
                const med = Math.round(remaining * 0.65);
                const hard = 100 - easy - med;
                onUpdateAllocation({ ...allocation, easyPct: easy, mediumPct: med, hardPct: hard });
              }}
              className="w-full accent-gold cursor-pointer"
            />
          </div>

          {/* Medium */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-700">Medium Level</span>
              <span className="text-ink">{allocation.mediumPct}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={70}
              step={5}
              value={allocation.mediumPct}
              onChange={(e) => {
                const med = parseInt(e.target.value);
                const remaining = 100 - med;
                const easy = Math.round(remaining * 0.6);
                const hard = 100 - med - easy;
                onUpdateAllocation({ ...allocation, easyPct: easy, mediumPct: med, hardPct: hard });
              }}
              className="w-full accent-gold cursor-pointer"
            />
          </div>

          {/* Hard */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-bronze">Hard / Analytical</span>
              <span className="text-ink">{allocation.hardPct}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={allocation.hardPct}
              onChange={(e) => {
                const hard = parseInt(e.target.value);
                const remaining = 100 - hard;
                const easy = Math.round(remaining * 0.35);
                const med = 100 - hard - easy;
                onUpdateAllocation({ ...allocation, easyPct: easy, mediumPct: med, hardPct: hard });
              }}
              className="w-full accent-gold cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-2 pt-4 border-t border-line">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-line bg-field px-3.5 sm:px-5 py-2.5 text-xs font-bold text-slate-600 hover:border-gold/30 hover:text-ink transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Scope (Step 1)</span>
          <span className="sm:hidden">Back</span>
        </button>

        <button
          type="button"
          onClick={onProceed}
          className="glow-button flex items-center gap-1.5 sm:gap-2 px-4 sm:px-7 py-2.5 sm:py-3 text-xs font-black text-ink cursor-pointer whitespace-nowrap"
        >
          <span className="hidden sm:inline">Continue to Matrix & Selection (Step 3)</span>
          <span className="sm:hidden">Continue to Step 3</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
