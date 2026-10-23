import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Sparkles, Check, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { KaTeXRenderer } from './KaTeXRenderer';
import { api } from '../services/apiClient';
import { useToast } from './Toast';

interface QuestionItem {
  id: string;
  chapter: string;
  question: string;
  opt_a?: string;
  opt_b?: string;
  opt_c?: string;
  opt_d?: string;
  assertion?: string;
  reason?: string;
  statement_1?: string;
  statement_2?: string;
  match_table?: { col1: string; col2: string }[];
  diagram_svg?: string;
  num_answer?: string;
  difficulty?: string;
  q_type?: string;
}

interface SwapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetQuestion: QuestionItem | null;
  targetIndex: number;
  onSwapConfirm: (newQuestion: QuestionItem) => Promise<void>;
  swapsUsed: number;
  swapsLimit: number;
  isElite: boolean;
}

export const SwapDrawer: React.FC<SwapDrawerProps> = ({
  isOpen,
  onClose,
  targetQuestion,
  targetIndex,
  onSwapConfirm,
  swapsUsed,
  swapsLimit,
  isElite,
}) => {
  const { success, error, warning } = useToast();
  const [alternatives, setAlternatives] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  // Fetch alternatives when targetQuestion changes
  useEffect(() => {
    let mounted = true;
    if (isOpen && targetQuestion) {
      setIsLoading(true);
      api
        .getAlternatives(
          targetQuestion.chapter || 'General',
          targetQuestion.id,
          targetQuestion.difficulty,
          targetQuestion.q_type
        )
        .then((res) => {
          if (mounted && res && res.alternatives) {
            setAlternatives(res.alternatives);
          }
        })
        .catch((err) => {
          console.warn('Failed loading alternatives:', err);
        })
        .finally(() => {
          if (mounted) setIsLoading(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [isOpen, targetQuestion]);

  if (!isOpen || !targetQuestion) return null;

  const swapsRemaining = isElite ? 'Unlimited' : Math.max(0, swapsLimit - swapsUsed);

  const handleSwap = async (altQ: QuestionItem) => {
    if (!isElite && swapsUsed >= swapsLimit) {
      error(
        'Swap Limit Reached',
        `You have used all ${swapsLimit} swaps on this paper. Upgrade to Elite Pro for unlimited question edits.`
      );
      return;
    }

    try {
      setSwappingId(altQ.id);
      await onSwapConfirm(altQ);
      success(
        'Question Swapped',
        `Question #${targetIndex + 1} successfully replaced with alternative from ${altQ.chapter}.`
      );
      onClose();
    } catch (err: any) {
      error('Swap Failed', err.message || 'Could not replace question.');
    } finally {
      setSwappingId(null);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-white/10 bg-[#0D0D0D]/95 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right duration-300 no-print">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/30">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white font-heading">Question Swap & Edit</h3>
            <p className="text-[11px] text-slate-400">
              In-place question swapper with difficulty & topic parity
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Edit Counter Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#141414] px-5 py-3">
        <div className="text-xs font-semibold text-slate-300">
          Swaps Used:{' '}
          <span className="font-extrabold text-[#C8A96A]">
            {swapsUsed} / {isElite ? '∞' : swapsLimit}
          </span>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
            isElite
              ? 'bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {isElite ? 'Unlimited Edits' : `${swapsRemaining} Swaps Remaining`}
        </span>
      </div>

      {/* Target Question Context Card */}
      <div className="p-5 overflow-y-auto flex-1 space-y-5">
        <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-300 mb-2">
            <span>Current Question #{targetIndex + 1}</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[#C8A96A] font-semibold">
              {targetQuestion.chapter}
            </span>
          </div>
          <div className="text-xs text-slate-200">
            <KaTeXRenderer content={targetQuestion.question} />
          </div>
        </div>

        {/* Alternatives Header */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 font-heading">
            Available Alternatives ({alternatives.length})
          </span>
          <span className="text-[10px] text-[#C8A96A] font-semibold">Same Syllabus & Difficulty</span>
        </div>

        {/* Alternatives List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-[#C8A96A]" />
            <span>Scanning 89,202+ question repository for exact topic matches...</span>
          </div>
        ) : alternatives.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#141414] p-6 text-center text-xs text-slate-400">
            No additional alternatives found for this specific difficulty level in {targetQuestion.chapter}.
          </div>
        ) : (
          <div className="space-y-4">
            {alternatives.map((alt, idx) => {
              const isSwappingThis = swappingId === alt.id;
              const letter = String.fromCharCode(65 + idx);

              return (
                <div
                  key={alt.id}
                  className="rounded-2xl border border-white/10 bg-[#141414] p-4 hover:border-[#C8A96A]/40 transition-all shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-md bg-[#C8A96A]/20 px-2 py-0.5 text-[10px] font-extrabold text-[#C8A96A] border border-[#C8A96A]/30">
                      Alternative {letter}
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">
                      {alt.difficulty || 'Medium'} • {alt.chapter}
                    </span>
                  </div>

                  <div className="text-xs text-slate-200 mb-3">
                    {alt.assertion && alt.reason ? (
                      <div>
                        {alt.question && !alt.question.includes('Assertion (A)') && (
                          <div className="mb-1"><KaTeXRenderer content={alt.question} /></div>
                        )}
                        <div className="mb-1"><strong className="text-[#C8A96A]">Assertion (A): </strong><KaTeXRenderer content={alt.assertion} className="inline" /></div>
                        <div><strong className="text-[#C8A96A]">Reason (R): </strong><KaTeXRenderer content={alt.reason} className="inline" /></div>
                      </div>
                    ) : alt.statement_1 && alt.statement_2 ? (
                      <div>
                        <div className="mb-1"><strong className="text-[#C8A96A]">Statement I: </strong><KaTeXRenderer content={alt.statement_1} className="inline" /></div>
                        <div><strong className="text-[#C8A96A]">Statement II: </strong><KaTeXRenderer content={alt.statement_2} className="inline" /></div>
                      </div>
                    ) : (
                      <KaTeXRenderer content={alt.question} />
                    )}
                  </div>

                  {/* Diagrammatic SVG Preview */}
                  {alt.diagram_svg && (
                    <div
                      className="my-2 p-2 bg-white rounded-lg flex justify-center items-center overflow-hidden max-h-36"
                      dangerouslySetInnerHTML={{ __html: alt.diagram_svg }}
                    />
                  )}

                  {/* Options Preview */}
                  {alt.opt_a && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-4 bg-[#1A1A1A] p-2.5 rounded-xl border border-white/5">
                      <div>
                        <strong>(A)</strong> <KaTeXRenderer content={alt.opt_a} className="inline" />
                      </div>
                      <div>
                        <strong>(B)</strong> <KaTeXRenderer content={alt.opt_b || ''} className="inline" />
                      </div>
                      <div>
                        <strong>(C)</strong> <KaTeXRenderer content={alt.opt_c || ''} className="inline" />
                      </div>
                      <div>
                        <strong>(D)</strong> <KaTeXRenderer content={alt.opt_d || ''} className="inline" />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleSwap(alt)}
                    disabled={isSwappingThis}
                    className="glow-button flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-[#0D0D0D] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSwappingThis ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Swapping...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        <span>Swap Question</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
