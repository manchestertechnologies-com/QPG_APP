import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Printer,
  Edit3,
  Layers,
  CheckCircle2,
  Columns,
  Square,
  ZoomIn,
  ZoomOut,
  KeyRound,
  FileText,
  Building2,
  Lock,
  ArrowRightLeft,
} from 'lucide-react';
import { KaTeXRenderer } from './KaTeXRenderer';
import { SwapDrawer } from './SwapDrawer';
import { HeaderStudioModal, HeaderConfigState } from './HeaderStudioModal';
import { StoredUser, StoredSubscription, api } from '../services/apiClient';
import { useToast } from './Toast';

interface Question {
  id: string;
  chapter: string;
  question: string;
  opt_a?: string;
  opt_b?: string;
  opt_c?: string;
  opt_d?: string;
  assertion?: string;
  reason?: string;
  num_answer?: string;
  correct_option?: string;
  difficulty?: string;
  q_type?: string;
}

interface Section {
  name: string;
  description?: string;
  attempt_count: number;
  marks_per_question: number;
  negative_marking: number;
  questions: Question[];
}

export interface PaperState {
  id: string;
  title: string;
  institution_name: string;
  subject: string;
  exam_type: string;
  duration_minutes: number;
  total_marks: number;
  questions_count: number;
  instructions: string[];
  sections: Section[];
  answer_key: { q_no: number; answer: string; num_answer?: string }[];
  sets?: {
    P: { sections: Section[]; answer_key: { q_no: number; answer: string }[] };
    Q: { sections: Section[]; answer_key: { q_no: number; answer: string }[] };
    R: { sections: Section[]; answer_key: { q_no: number; answer: string }[] };
    S: { sections: Section[]; answer_key: { q_no: number; answer: string }[] };
  };
  header?: HeaderConfigState;
  swaps_used?: number;
}

interface WorkbenchStepProps {
  paper: PaperState;
  onPaperUpdate: (updated: PaperState) => void;
  user: StoredUser | null;
  subscription: StoredSubscription | null;
  onOpenUpgrade: () => void;
  onOpenReferral: () => void;
}

export const WorkbenchStep: React.FC<WorkbenchStepProps> = ({
  paper,
  onPaperUpdate,
  user,
  subscription,
  onOpenUpgrade,
  onOpenReferral,
}) => {
  const { success, warning, error, info } = useToast();

  const isPro = subscription?.isActive === true;
  const isElite = subscription?.plan?.toLowerCase().includes('elite') || subscription?.amount === 499;

  // Active Shuffled Set: Set P, Set Q, Set R, Set S
  const [activeSet, setActiveSet] = useState<'P' | 'Q' | 'R' | 'S'>('P');

  // Layout display mode: Dual-column (standard entrance paper) or Single-column
  const [isDualColumn, setIsDualColumn] = useState<boolean>(true);

  // Zoom scale: 90% to 120%
  const [zoomScale, setZoomScale] = useState<number>(100);

  // Show Answer Key preview
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);

  // Header Studio Modal state
  const [isHeaderStudioOpen, setIsHeaderStudioOpen] = useState<boolean>(false);

  // Swap Drawer state
  const [selectedTargetQuestion, setSelectedTargetQuestion] = useState<Question | null>(null);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(0);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState<boolean>(false);

  // Header configuration state with defensive array defaults
  const [headerConfig, setHeaderConfig] = useState<HeaderConfigState>(() => {
    const raw = (paper && paper.header) || {};
    return {
      institution_name: raw.institution_name || raw.instituteName || paper?.institution_name || 'MANCHESTER TECHNOLOGIES',
      sub_title: raw.sub_title || raw.subTitle || 'Davangere - 577006 • Department of Chemistry',
      exam_code: raw.exam_code || raw.examCode || `${paper?.exam_type || 'EXAM'}-CHEM-2026`,
      date: raw.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      duration: raw.duration || `${paper?.duration_minutes || 60} Minutes`,
      custom_instructions: Array.isArray(raw.custom_instructions)
        ? raw.custom_instructions
        : Array.isArray(paper?.instructions)
          ? paper.instructions
          : typeof raw.instructions === 'string'
            ? [raw.instructions]
            : ['All questions in Section A and Section B are compulsory under the revised blueprint.'],
      watermark_text: raw.watermark_text || 'MANCHESTER TECHNOLOGIES',
      crest_logo_url: raw.crest_logo_url || raw.crestLogoUrl || null,
      is_locked: !isPro,
    };
  });

  // Current sections based on selected Set (P, Q, R, S)
  const currentSections = (paper.sets && paper.sets[activeSet]?.sections) || paper.sections || [];
  const currentAnswerKey = (paper.sets && paper.sets[activeSet]?.answer_key) || paper.answer_key || [];

  const swapsUsed = paper.swaps_used || 0;
  const swapsLimit = isElite ? Infinity : 50;

  // Handle opening question swapper
  const handleQuestionClick = (q: Question, overallIndex: number) => {
    setSelectedTargetQuestion(q);
    setSelectedTargetIndex(overallIndex);
    setIsSwapDrawerOpen(true);
  };

  // Confirm in-place swap
  const handleSwapConfirm = async (replacement: Question) => {
    if (!selectedTargetQuestion) return;

    try {
      const res = await api.swapQuestion(paper, selectedTargetQuestion.id, replacement);
      if (res && res.paper) {
        onPaperUpdate(res.paper);
      }
    } catch (err: any) {
      throw err;
    }
  };

  // Switch Set with Elite check
  const handleSelectSet = (set: 'P' | 'Q' | 'R' | 'S') => {
    if (set !== 'P' && !isElite) {
      warning(
        'Elite Pro Feature',
        'Shuffled Set P, Q, R, S generation is exclusive to the Elite Pro (₹499) plan.'
      );
      onOpenUpgrade();
      return;
    }
    setActiveSet(set);
    info(`Switched to Set ${set}`, `Question order and answer key synchronized for Series ${set}.`);
  };

  // Header update
  const handleHeaderSave = (newHeader: HeaderConfigState) => {
    setHeaderConfig(newHeader);
    const updated = {
      ...paper,
      header: newHeader,
      institution_name: newHeader.institution_name,
    };
    onPaperUpdate(updated);
  };

  let globalQuestionCounter = 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Workbench Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#11141E] p-4 no-print shadow-xl">
        {/* Shuffled Series Tabs (Set P, Q, R, S) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 mr-1">
            Series:
          </span>
          {(['P', 'Q', 'R', 'S'] as const).map((set) => {
            const isCurrent = activeSet === set;
            return (
              <button
                key={set}
                onClick={() => handleSelectSet(set)}
                className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/50'
                    : 'bg-[#161A26] text-slate-300 hover:text-white hover:bg-[#1F2433] border border-white/5'
                }`}
              >
                <span>Set {set}</span>
                {set !== 'P' && !isElite && (
                  <Lock className="h-3 w-3 text-amber-400 opacity-80" />
                )}
              </button>
            );
          })}
        </div>

        {/* Center: Swaps Counter & Header Studio button */}
        <div className="flex items-center gap-3">
          {/* Swaps Counter Pill */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#161A26] px-3.5 py-1.5 text-xs font-semibold text-slate-300">
            <ArrowRightLeft className="h-3.5 w-3.5 text-purple-400" />
            <span>
              Swaps Used:{' '}
              <strong className="text-white">
                {swapsUsed} / {isElite ? '∞' : swapsLimit}
              </strong>
            </span>
          </div>

          {/* Header Studio Button */}
          <button
            onClick={() => setIsHeaderStudioOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#161A26] px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            <Building2 className="h-3.5 w-3.5 text-purple-400" />
            <span>Customize Header</span>
          </button>
        </div>

        {/* Right Tools: Column Toggle & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Dual-Column Toggle */}
          <button
            onClick={() => setIsDualColumn(!isDualColumn)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161A26] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Toggle Dual/Single Column Layout"
          >
            {isDualColumn ? <Columns className="h-3.5 w-3.5 text-purple-400" /> : <Square className="h-3.5 w-3.5 text-purple-400" />}
            <span className="hidden sm:inline">{isDualColumn ? 'Dual Column' : 'Single Column'}</span>
          </button>

          {/* Answer Key Toggle */}
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              showAnswerKey
                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                : 'border-white/10 bg-[#161A26] text-slate-300 hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Answer Key</span>
          </button>

          {/* Zoom Slider */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#161A26] px-2 py-1">
            <button
              onClick={() => setZoomScale(Math.max(75, zoomScale - 10))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 w-8 text-center">{zoomScale}%</span>
            <button
              onClick={() => setZoomScale(Math.min(130, zoomScale + 10))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Viewport Container */}
      <div className="flex justify-center overflow-x-auto py-6">
        <div
          className="transition-transform duration-200 origin-top"
          style={{ transform: `scale(${zoomScale / 100})` }}
        >
          {/* A4 Sheet Container */}
          <div className="a4-sheet p-10 md:p-12 relative shadow-2xl rounded-sm">
            {/* Diagonal Background Watermark */}
            <div className="watermark-text select-none">
              {headerConfig.watermark_text || 'MANCHESTER TECHNOLOGIES'}
            </div>

            {/* Free Tier Floating Badge: Manchester Technologies [✕] */}
            {!isPro && (
              <div
                className="floating-branding-badge no-print"
                onClick={onOpenUpgrade}
              >
                <span>Manchester Technologies</span>
                <span
                  className="badge-close-btn flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] hover:bg-white/30"
                  title="Remove Watermark & Branding"
                >
                  ✕
                </span>
              </div>
            )}

            {/* Institute Header */}
            <div className="relative z-10 border-2 border-slate-900 rounded-lg p-5 text-center bg-slate-50/90 mb-6 shadow-sm">
              {/* Crest Logo (if uploaded) */}
              {headerConfig.logo_url && (
                <div className="mx-auto mb-3 h-14 w-14 overflow-hidden rounded-full border border-slate-300 p-0.5">
                  <img
                    src={headerConfig.logo_url}
                    alt="Institute Logo"
                    className="h-full w-full object-contain rounded-full"
                  />
                </div>
              )}

              <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                {headerConfig.institution_name}
              </h1>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {headerConfig.sub_title}
              </p>

              <div className="mt-2 text-sm font-bold text-indigo-900">
                {paper.title} • Series {activeSet}
              </div>

              {/* Meta Bar */}
              <div className="mt-3.5 pt-2 border-t border-slate-300 flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>SUBJECT: {paper.subject.toUpperCase()}</span>
                <span>PATTERN: {paper.exam_type} REVISED</span>
                <span>TIME: {headerConfig.duration}</span>
                <span>MAX MARKS: {paper.total_marks}</span>
              </div>
            </div>

            {/* General Instructions Box */}
            <div className="relative z-10 border-l-4 border-indigo-600 bg-indigo-50/80 p-3.5 rounded-r-md text-xs text-slate-800 mb-6">
              <div className="font-extrabold text-indigo-950 uppercase tracking-wider text-[11px] mb-1">
                General Instructions:
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] font-medium leading-relaxed">
                {(headerConfig?.custom_instructions || []).map((inst, i) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>

            {/* Sections & Questions Content */}
            <div className="relative z-10 space-y-6">
              {(currentSections || []).map((sec, sIdx) => {
                return (
                  <div key={sIdx} className="space-y-4">
                    {/* Section Header */}
                    <div className="rounded-md bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs font-extrabold tracking-wider uppercase">
                      <span>{sec.name}</span>
                      <span className="text-[11px] text-slate-300 font-medium lowercase">
                        {sec.attempt_count} questions • +{sec.marks_per_question}, -{sec.negative_marking}
                      </span>
                    </div>

                    {sec.description && (
                      <p className="text-[11px] italic text-slate-600 px-1 -mt-2">
                        {sec.description}
                      </p>
                    )}

                    {/* Questions Grid (Dual Column or Single Column) */}
                    <div
                      className={
                        isDualColumn
                          ? 'grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4'
                          : 'space-y-4'
                      }
                    >
                      {(sec?.questions || []).map((q) => {
                        const qNum = globalQuestionCounter++;
                        const isCurrentTarget = selectedTargetQuestion?.id === q.id;

                        return (
                          <div
                            key={q.id}
                            onClick={() => handleQuestionClick(q, qNum - 1)}
                            className={`group relative rounded-lg border p-3 transition-all cursor-pointer break-inside-avoid ${
                              isCurrentTarget
                                ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-400 shadow-md'
                                : 'border-slate-200 bg-white hover:border-purple-400 hover:shadow-md'
                            }`}
                          >
                            {/* In-place Swapper Click Hint Overlay */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                              <span className="rounded bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                                Click to Swap
                              </span>
                            </div>

                            {/* Question Title */}
                            <div className="flex items-start gap-2">
                              <span className="font-black text-slate-900 text-xs shrink-0">
                                Q.{qNum}.
                              </span>
                              <div className="text-xs text-slate-800 font-medium flex-1">
                                <KaTeXRenderer content={q.question} />
                              </div>
                            </div>

                            {/* Multiple Choice Options Grid */}
                            {q.opt_a && (
                              <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 pl-4 text-[11px] text-slate-700">
                                <div>
                                  <strong className="text-indigo-900 font-bold">(A)</strong>{' '}
                                  <KaTeXRenderer content={q.opt_a} className="inline" />
                                </div>
                                <div>
                                  <strong className="text-indigo-900 font-bold">(B)</strong>{' '}
                                  <KaTeXRenderer content={q.opt_b || ''} className="inline" />
                                </div>
                                <div>
                                  <strong className="text-indigo-900 font-bold">(C)</strong>{' '}
                                  <KaTeXRenderer content={q.opt_c || ''} className="inline" />
                                </div>
                                <div>
                                  <strong className="text-indigo-900 font-bold">(D)</strong>{' '}
                                  <KaTeXRenderer content={q.opt_d || ''} className="inline" />
                                </div>
                              </div>
                            )}

                            {/* Numerical Value prompt */}
                            {q.q_type === 'numerical' && (
                              <div className="mt-2 pl-4 text-[11px] font-semibold text-slate-600 italic">
                                Answer: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] (Round off to nearest integer)
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Master Answer Key Section (when enabled) */}
              {showAnswerKey && currentAnswerKey.length > 0 && (
                <div className="mt-10 pt-6 border-t-2 border-slate-900 break-inside-avoid">
                  <div className="text-center font-extrabold text-sm text-slate-900 uppercase tracking-widest mb-4">
                    Official Answer Key & Scoring Guide • Series {activeSet}
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center text-xs">
                    {(currentAnswerKey || []).map((ak) => (
                      <div
                        key={ak.q_no}
                        className="rounded border border-slate-300 bg-slate-50 p-1"
                      >
                        <div className="text-[10px] font-bold text-slate-500">Q.{ak.q_no}</div>
                        <div className="font-extrabold text-indigo-900">{ak.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sliding In-Place Question Swapper Drawer */}
      <SwapDrawer
        isOpen={isSwapDrawerOpen}
        onClose={() => setIsSwapDrawerOpen(false)}
        targetQuestion={selectedTargetQuestion}
        targetIndex={selectedTargetIndex}
        onSwapConfirm={handleSwapConfirm}
        swapsUsed={swapsUsed}
        swapsLimit={swapsLimit}
        isElite={isElite}
      />

      {/* Header Studio Customizer Modal */}
      <HeaderStudioModal
        isOpen={isHeaderStudioOpen}
        onClose={() => setIsHeaderStudioOpen(false)}
        headerConfig={headerConfig}
        onSave={handleHeaderSave}
        isPro={isPro}
        onOpenUpgrade={onOpenUpgrade}
      />
    </div>
  );
};
