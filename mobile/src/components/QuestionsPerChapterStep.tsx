import React, { useMemo, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
  BookOpen,
  PieChart,
} from 'lucide-react';
import { ExamType } from './ChooseExamStep';

interface QuestionsPerChapterStepProps {
  selectedExam: ExamType;
  targetQuestions: number;
  selectedChapters: string[];
  questionsPerChapter: Record<string, number>;
  onUpdateQuestionsPerChapter: (quota: Record<string, number>) => void;
  onBack: () => void;
  onProceed: () => void;
  userSubject: string;
}

export const QuestionsPerChapterStep: React.FC<QuestionsPerChapterStepProps> = ({
  selectedExam,
  targetQuestions,
  selectedChapters,
  questionsPerChapter,
  onUpdateQuestionsPerChapter,
  onBack,
  onProceed,
  userSubject,
}) => {
  // Total questions currently allocated across all chapters
  const totalAllocated = useMemo(() => {
    return selectedChapters.reduce(
      (sum, ch) => sum + (questionsPerChapter[ch] || 0),
      0
    );
  }, [selectedChapters, questionsPerChapter]);

  const isBalanced = totalAllocated === targetQuestions;
  const difference = targetQuestions - totalAllocated;

  // Auto-distribute target evenly across selected chapters
  const handleAutoDistribute = () => {
    if (selectedChapters.length === 0) return;
    const numCh = selectedChapters.length;
    const base = Math.floor(targetQuestions / numCh);
    const remainder = targetQuestions % numCh;

    const updated: Record<string, number> = {};
    selectedChapters.forEach((ch, idx) => {
      updated[ch] = base + (idx < remainder ? 1 : 0);
    });

    onUpdateQuestionsPerChapter(updated);
  };

  // If questionsPerChapter doesn't cover all selected chapters or is completely zero, auto-distribute on mount
  useEffect(() => {
    const missing = selectedChapters.some((ch) => questionsPerChapter[ch] === undefined);
    if (missing || totalAllocated === 0) {
      handleAutoDistribute();
    }
  }, [selectedChapters, targetQuestions]);

  const handleStepChange = (ch: string, delta: number) => {
    const current = questionsPerChapter[ch] || 0;
    const next = Math.max(0, current + delta);
    onUpdateQuestionsPerChapter({
      ...questionsPerChapter,
      [ch]: next,
    });
  };

  const handleDirectInput = (ch: string, value: string) => {
    const parsed = parseInt(value, 10);
    const next = isNaN(parsed) ? 0 : Math.max(0, parsed);
    onUpdateQuestionsPerChapter({
      ...questionsPerChapter,
      [ch]: next,
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Step Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-field hover:bg-ink/[0.06] px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-ink hover:border-gold/40 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Return to Assembly Method Selection"
            >
              <ArrowLeft className="h-4 w-4 text-gold" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-gold uppercase tracking-wider font-heading">
              <span>Step 5 • Chapter Question Allocation</span>
            </div>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-ink font-heading">
            Questions Per Chapter
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Specify exactly how many questions to extract from each syllabus chapter for your {selectedExam} paper.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoDistribute}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/10 hover:bg-gold/20 px-3.5 py-2 text-xs font-bold text-gold transition-all cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Auto-Balance Quota</span>
        </button>
      </div>

      {/* Target Balance Summary Bar */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 shadow-xl transition-all ${
          isBalanced
            ? 'border-emerald-500/40 bg-card shadow-emerald-500/5'
            : 'border-gold/40 bg-card shadow-gold/5'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 font-heading">
                {selectedExam} Blueprint Total:
              </span>
              <span className="rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-xs font-extrabold text-ink">
                {targetQuestions} Questions
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-2">
              <span>
                Allocated:{' '}
                <strong
                  className={
                    isBalanced
                      ? 'text-emerald-600'
                      : difference > 0
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }
                >
                  {totalAllocated}
                </strong>{' '}
                / {targetQuestions}
              </span>
              <span>•</span>
              {isBalanced ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 inline" /> Perfect Blueprint Balance
                </span>
              ) : difference > 0 ? (
                <span className="text-amber-600 font-semibold">
                  Need {difference} more question{difference > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-red-600 font-semibold">
                  {Math.abs(difference)} question{Math.abs(difference) > 1 ? 's' : ''} over quota
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAutoDistribute}
              className="glow-button-outline w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-ink transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-gold" />
              <span>Auto-Balance Evenly</span>
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink/[0.06]">
          <div
            className={`h-full transition-all duration-300 ${
              isBalanced
                ? 'bg-emerald-500'
                : totalAllocated > targetQuestions
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-[#f3d995] to-[#d2a446]'
            }`}
            style={{
              width: `${Math.min(100, (totalAllocated / targetQuestions) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Chapters Allocation List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>{selectedChapters.length} Chapters Active</span>
          <span>Set question counts</span>
        </div>

        <div className="divide-y divide-line rounded-2xl border border-line bg-card shadow-xl overflow-hidden">
          {selectedChapters.map((ch, idx) => {
            const count = questionsPerChapter[ch] || 0;
            const pct = targetQuestions > 0 ? Math.round((count / targetQuestions) * 100) : 0;

            return (
              <div
                key={ch}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-ink/[0.025] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink/[0.04] text-xs font-bold text-gold">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-ink leading-snug">
                      {ch}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {pct}% weightage in paper
                    </div>
                  </div>
                </div>

                {/* Numeric Stepper and Direct Input */}
                <div className="flex items-center justify-end gap-3">
                  <div className="flex items-center rounded-xl border border-line bg-field p-1 shadow-inner">
                    <button
                      type="button"
                      onClick={() => handleStepChange(ch, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-ink/[0.06] hover:text-ink transition-colors cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={targetQuestions}
                      value={count}
                      onChange={(e) => handleDirectInput(ch, e.target.value)}
                      className="w-14 bg-transparent text-center text-xs font-bold text-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleStepChange(ch, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-ink/[0.06] hover:text-ink transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-medium w-8 text-right">
                    Qs
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 z-30 flex items-center justify-between rounded-2xl border border-line bg-paper/95 p-4 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-line bg-field px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-ink hover:border-line-strong transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Mode Selection</span>
        </button>

        <div className="text-xs text-center">
          <span className="text-slate-500 font-medium">Total Questions: </span>
          <strong className={isBalanced ? 'text-emerald-600' : 'text-gold'}>
            {totalAllocated} / {targetQuestions}
          </strong>
        </div>

        <button
          type="button"
          onClick={onProceed}
          disabled={!isBalanced}
          className="glow-button flex items-center gap-2 px-5 py-3 text-xs font-black text-ink transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Next: Question Types & Difficulty</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
