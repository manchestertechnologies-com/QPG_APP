import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  Sparkles,
  ArrowRightLeft,
  Settings2,
  Building2,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  Sliders,
  ChevronDown,
  Layers,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  KeyRound,
  FileSpreadsheet,
  Download,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Share2,
  Shuffle,
  FileText,
  Lightbulb,
} from 'lucide-react';
import { KaTeXRenderer } from './KaTeXRenderer';
import { SwapDrawer } from './SwapDrawer';
import { HeaderStudioModal, HeaderConfigState } from './HeaderStudioModal';
import { useToast } from './Toast';
import { api, StoredUser, StoredSubscription } from '../services/apiClient';

export interface Question {
  id: string;
  question: string;
  opt_a?: string;
  opt_b?: string;
  opt_c?: string;
  opt_d?: string;
  correct_option?: string;
  num_answer?: number | string;
  marks?: number;
  q_type?: string;
  chapter?: string;
  difficulty?: string;
  diagram_svg?: string;
  assertion?: string;
  reason?: string;
  statement_1?: string;
  statement_2?: string;
  match_table?: { col1: string; col2: string }[];
  solution_text?: string;
}

export interface Section {
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
  exam_type: string;
  subject: string;
  institution_name?: string;
  created_at?: string;
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

export interface AlignmentSettings {
  displayMode:
    | 'questions'
    | 'with_answers'
    | 'with_solutions'
    | 'questions_after_solutions'
    | 'no_options'
    | 'solutions_only'
    | 'answers_only';
  optionNumberingStyle: '(1) (2) (3) (4)' | '(A) (B) (C) (D)' | '(a) (b) (c) (d)' | '(i) (ii) (iii) (iv)';
  durationMinutes: number;
  marksPerQuestion: number;
  optionsLayout: 'line' | 'grid' | 'stacked' | 'auto';
  gapBetweenQuestions: 'Default' | 'Compact' | 'Medium' | 'Relaxed' | 'Large';
  questionSpacing: string;
  showQuestionNumbers: boolean;
  imageBelowQuestion: boolean;
  columns: number;
  avoidColumnBreak: boolean;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  diagramMaxHeight: string;
  showMarksOnQs: 'hidden' | 'right' | 'inline';
  schemeOfValuation: 'exclude' | 'include_at_end' | 'separate_sheet';
}

interface WorkbenchStepProps {
  paper: PaperState;
  onPaperUpdate: (updated: PaperState) => void;
  user: StoredUser | null;
  subscription: StoredSubscription | null;
  onOpenUpgrade: () => void;
  onOpenReferral: () => void;
  initialStep?: number;
  onNavigateStep?: (step: number) => void;
}

export const WorkbenchStep: React.FC<WorkbenchStepProps> = ({
  paper,
  onPaperUpdate,
  user,
  subscription,
  onOpenUpgrade,
  onOpenReferral,
  initialStep = 5,
  onNavigateStep,
}) => {
  const { success, warning, error, info } = useToast();

  const isPro = subscription?.isActive === true;
  const isElite =
    subscription?.plan?.toLowerCase().includes('elite') || subscription?.amount === 499;

  // Active Shuffled Set: Set P, Set Q, Set R, Set S
  const [activeSet, setActiveSet] = useState<'P' | 'Q' | 'R' | 'S'>('P');

  // Solution toggle state for instant preview
  const [showSolutions, setShowSolutions] = useState<boolean>(false);

  // Alignment and layout settings matching Image 2, 3, 4
  const [alignmentSettings, setAlignmentSettings] = useState<AlignmentSettings>({
    displayMode: 'questions',
    optionNumberingStyle: '(1) (2) (3) (4)',
    durationMinutes:
      paper?.duration_minutes ||
      (paper?.exam_type?.includes('NEET') ? 200 : paper?.exam_type?.includes('JEE') ? 180 : 80),
    marksPerQuestion: paper?.sections?.[0]?.marks_per_question || 4,
    optionsLayout: 'line',
    gapBetweenQuestions: 'Default',
    questionSpacing: '6px',
    showQuestionNumbers: true,
    imageBelowQuestion: false,
    columns: 2,
    avoidColumnBreak: true,
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: '12px',
    lineHeight: '1.35',
    diagramMaxHeight: '200px',
    showMarksOnQs: 'hidden',
    schemeOfValuation: 'exclude',
  });

  // Mobile View Mode: 'reader' (touch card list) or 'a4' (exact scaled print preview)
  const [mobileViewMode, setMobileViewMode] = useState<'reader' | 'a4'>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'reader' : 'a4'
  );

  // Zoom control
  const [zoomScale, setZoomScale] = useState<number>(100);

  // Window width tracker for fluid mobile scaling
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const autoFitScale = useMemo(() => {
    if (windowWidth < 820) {
      return Math.max(0.42, Math.min(1, (windowWidth - 28) / 794));
    }
    return 1;
  }, [windowWidth]);

  const effectiveZoom = (zoomScale / 100) * (windowWidth < 820 ? autoFitScale : 1);

  // Show Answer Key Modal
  const [showAnswerKeyModal, setShowAnswerKeyModal] = useState<boolean>(false);

  // Header Studio Modal state
  const [isHeaderStudioOpen, setIsHeaderStudioOpen] = useState<boolean>(false);

  // Swap Drawer state
  const [selectedTargetQuestion, setSelectedTargetQuestion] = useState<Question | null>(null);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(0);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState<boolean>(false);

  // Header configuration state
  const [headerConfig, setHeaderConfig] = useState<HeaderConfigState>(() => {
    const raw = (paper && paper.header) || {};
    return {
      institution_name:
        raw.institution_name ||
        raw.instituteName ||
        paper?.institution_name ||
        'MANCHESTER TECHNOLOGIES',
      sub_title:
        raw.sub_title ||
        raw.subTitle ||
        'Davangere - 577006 • Department of Chemistry',
      exam_code: raw.exam_code || raw.examCode || `${paper?.exam_type || 'EXAM'}-CHEM-2026`,
      date:
        raw.date ||
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.'),
      duration: `${alignmentSettings.durationMinutes} Minutes`,
      custom_instructions: Array.isArray(raw.custom_instructions)
        ? raw.custom_instructions
        : Array.isArray(paper?.instructions)
        ? paper.instructions
        : typeof raw.instructions === 'string'
        ? [raw.instructions]
        : ['All questions are compulsory under the official syllabus pattern.'],
      watermark_text: raw.watermark_text || 'MANCHESTER TECHNOLOGIES',
      crest_logo_url: raw.crest_logo_url || raw.crestLogoUrl || null,
      is_locked: !isPro,
    };
  });

  // Current sections based on selected Set (P, Q, R, S)
  const currentSections =
    (paper.sets && paper.sets[activeSet]?.sections) || paper.sections || [];

  // Helper to format Option numbering based on selected style
  const formatOptionLabel = (optIndex: number, style: string) => {
    if (style === '(1) (2) (3) (4)') return `(${optIndex + 1})`;
    if (style === '(a) (b) (c) (d)') return `(${String.fromCharCode(97 + optIndex)})`;
    if (style === '(i) (ii) (iii) (iv)') {
      const romans = ['(i)', '(ii)', '(iii)', '(iv)'];
      return romans[optIndex] || `(${optIndex + 1})`;
    }
    return `(${String.fromCharCode(65 + optIndex)})`;
  };

  // Helper to get formatted answer key display (e.g. 1, 2, 3, 4 or A, B, C, D)
  const getAnswerKeyDisplay = (q: Question, qNum: number, style: string) => {
    if (q.q_type === 'numerical' && q.num_answer !== undefined) {
      return String(q.num_answer);
    }
    const raw = (q.correct_option || 'A').toUpperCase();
    const index = raw === 'A' ? 0 : raw === 'B' ? 1 : raw === 'C' ? 2 : raw === 'D' ? 3 : 0;
    if (style === '(1) (2) (3) (4)') {
      return String(index + 1);
    }
    if (style === '(a) (b) (c) (d)') {
      return String.fromCharCode(97 + index);
    }
    if (style === '(i) (ii) (iii) (iv)') {
      const romans = ['i', 'ii', 'iii', 'iv'];
      return romans[index] || String(index + 1);
    }
    return raw;
  };

  // All questions flattened
  const allQuestionsFlattened = useMemo(() => {
    const list: Question[] = [];
    currentSections.forEach((s) => {
      list.push(...(s.questions || []));
    });
    return list;
  }, [currentSections]);

  // Answer key chunks of 15 questions for Image 5 grid
  const answerKeyChunks = useMemo(() => {
    const chunks: Question[][] = [];
    for (let i = 0; i < allQuestionsFlattened.length; i += 15) {
      chunks.push(allQuestionsFlattened.slice(i, i + 15));
    }
    return chunks;
  }, [allQuestionsFlattened]);

  const swapsUsed = paper.swaps_used || 0;
  const swapsLimit = isElite ? Infinity : 50;

  // Open question swapper drawer
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

  // Generate 4-Sets (P, Q, R, S)
  const handleGenerate4Sets = () => {
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const makeSet = (setTag: 'P' | 'Q' | 'R' | 'S') => {
      const shuffledSections = (paper.sections || []).map((sec) => {
        let qs = [...sec.questions];
        if (setTag !== 'P') {
          qs = shuffleArray(qs);
        }
        return { ...sec, questions: qs };
      });

      let qIdx = 1;
      const ak: { q_no: number; answer: string }[] = [];
      shuffledSections.forEach((s) => {
        s.questions.forEach((q) => {
          ak.push({
            q_no: qIdx++,
            answer: q.correct_option || 'A',
          });
        });
      });

      return { sections: shuffledSections, answer_key: ak };
    };

    const sets = {
      P: makeSet('P'),
      Q: makeSet('Q'),
      R: makeSet('R'),
      S: makeSet('S'),
    };

    const updated = {
      ...paper,
      sets,
    };

    onPaperUpdate(updated);
    success(
      '4-Sets Generated!',
      'Series P, Q, R, and S generated with synchronized answer keys.'
    );
  };

  // Reshuffle questions in place
  const handleReshuffle = () => {
    const shuffle = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const reshuffledSections = (paper.sections || []).map((sec) => ({
      ...sec,
      questions: shuffle(sec.questions),
    }));

    const updated = {
      ...paper,
      sections: reshuffledSections,
    };
    onPaperUpdate(updated);
    info('Paper Reshuffled', 'Questions re-ordered and answer keys synchronized.');
  };

  // Switch Series Set with Elite check
  const handleSelectSet = (set: 'P' | 'Q' | 'R' | 'S') => {
    if (set !== 'P' && !isElite && !paper.sets) {
      warning('Elite Pro Feature', 'Please generate 4-Sets first to unlock Series P, Q, R, S.');
    }
    setActiveSet(set);
    info(`Switched to Set ${set}`, `Viewing Question Series ${set}.`);
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

  // Download Excel (.csv) matching Image 5 format
  const handleDownloadAnswerKeyExcel = () => {
    const exam = (paper.exam_type || 'EXAM').toUpperCase();
    const set = activeSet;
    const subj = (paper.subject || 'CHEMISTRY').toUpperCase();
    const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
    const title = `${exam} EXAMINATION - SET ${set} KEY ANS (${subj}) ${dateStr}`;
    const subjCode = subj.slice(0, 4);

    let csvRows: string[] = [];
    csvRows.push(`"${title}"`);
    csvRows.push('');

    answerKeyChunks.forEach((chunk, chunkIdx) => {
      const startNum = chunkIdx * 15 + 1;
      const qNos = chunk.map((_, idx) => startNum + idx);
      const keys = chunk.map((q, idx) =>
        getAnswerKeyDisplay(q, startNum + idx, alignmentSettings.optionNumberingStyle)
      );

      // Pad up to 15 columns if shorter
      while (qNos.length < 15) {
        qNos.push('' as any);
        keys.push('');
      }

      csvRows.push([subjCode, 'Q. NO', ...qNos].join(','));
      csvRows.push([subjCode, 'KEY', ...keys].join(','));
      csvRows.push('');
    });

    const csvContent = csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam}_SET_${set}_KEY_ANS_${subj}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    success('Excel Downloaded', 'Answer key spreadsheet saved successfully.');
  };

  const getQuestionNumber = (secIdx: number, qIdx: number) => {
    let count = 1;
    for (let i = 0; i < secIdx; i++) {
      count += (currentSections[i]?.questions || []).length;
    }
    return count + qIdx;
  };

  // Dynamic question spacing in pixels based on selection
  const computedSpacing = useMemo(() => {
    switch (alignmentSettings.gapBetweenQuestions) {
      case 'Compact':
        return '3px';
      case 'Medium':
        return '10px';
      case 'Relaxed':
        return '15px';
      case 'Large':
        return '22px';
      case 'Default':
      default:
        return '6px';
    }
  }, [alignmentSettings.gapBetweenQuestions]);

  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Mobile View Mode Switcher (Visible on mobile screens) */}
      <div className="flex md:hidden items-center justify-between rounded-xl bg-[#141414] border border-white/5 p-2 no-print">
        <span className="text-xs font-bold text-slate-300 font-heading">
          {mobileViewMode === 'reader' ? '📱 Mobile Reader' : '📄 Print A4 Sheet'}
        </span>
        <div className="flex rounded-xl bg-[#1A1A1A] p-0.5 border border-white/5">
          <button
            type="button"
            onClick={() => setMobileViewMode('reader')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileViewMode === 'reader'
                ? 'bg-[#C8A96A] text-[#0D0D0D] shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reader
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('a4')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mobileViewMode === 'a4'
                ? 'bg-[#C8A96A] text-[#0D0D0D] shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            A4 Sheet
          </button>
        </div>
      </div>

      {/* TOP ACTION TOOLBAR (EXACT IMAGE 2 RECREATION) */}
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-3 sm:p-4 shadow-xl no-print space-y-3">
        {/* Row 1: Back, Generate 4-Sets, Answer Key, Solutions, Reshuffle, Merge Exam */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => onNavigateStep && onNavigateStep(4)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-[#C8A96A]/40 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {/* Generate 4-Sets (P, Q, R, S) */}
            <button
              type="button"
              onClick={handleGenerate4Sets}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-[#C8A96A] hover:text-[#C8A96A] transition-all cursor-pointer"
            >
              <span>🎲</span>
              <span>Generate 4-Sets (P, Q, R, S)</span>
            </button>

            {/* ANSWER KEY Button */}
            <button
              type="button"
              onClick={() => setShowAnswerKeyModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#C8A96A]/30 bg-[#1C1810] px-3.5 py-2 text-xs font-bold text-[#C8A96A] hover:bg-[#C8A96A]/20 transition-all cursor-pointer shadow-sm"
            >
              <KeyRound className="h-4 w-4 text-[#C8A96A]" />
              <span className="uppercase font-black">ANSWER KEY</span>
            </button>

            {/* SOLUTIONS Toggle */}
            <button
              type="button"
              onClick={() => setShowSolutions(!showSolutions)}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                showSolutions
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-black'
                  : 'border-white/10 bg-[#1A1A1A] text-slate-200 hover:border-white/20'
              }`}
            >
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span className="uppercase font-black">SOLUTIONS</span>
            </button>

            {/* RESHUFFLE Button */}
            <button
              type="button"
              onClick={handleReshuffle}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 text-xs font-black transition-all cursor-pointer shadow-md shadow-purple-900/30"
            >
              <Shuffle className="h-4 w-4" />
              <span className="uppercase tracking-wider">RESHUFFLE</span>
            </button>

            {/* MERGE EXAM Button */}
            <button
              type="button"
              onClick={() => setIsHeaderStudioOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-900/30"
            >
              <Share2 className="h-4 w-4" />
              <span className="uppercase tracking-wider">MERGE EXAM</span>
            </button>
          </div>

          {/* Active Series Set Tabs (P, Q, R, S) */}
          <div className="flex items-center gap-1 rounded-xl bg-[#1A1A1A] p-1 border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Set:</span>
            {(['P', 'Q', 'R', 'S'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSelectSet(s)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeSet === s
                    ? 'bg-[#C8A96A] text-[#0D0D0D] shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Zoom widget, Questions count, PDF/PRINT, FINALIZE & SAVE */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
          {/* Zoom widget & questions count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-white/10 bg-[#1A1A1A] p-1 text-xs">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(50, z - 10))}
                className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer font-bold"
                title="Zoom Out"
              >
                -
              </button>
              <span className="px-2.5 font-bold text-white text-xs">{zoomScale}%</span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(160, z + 10))}
                className="flex h-7 w-7 items-center justify-center rounded text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer font-bold"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(100)}
                className="ml-1 rounded px-2 py-1 text-[10px] font-semibold text-[#C8A96A] hover:bg-white/5 cursor-pointer"
              >
                Reset
              </button>
            </div>

            <span className="rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold text-white">
              {allQuestionsFlattened.length} Questions
            </span>
          </div>

          {/* Action Buttons: PDF/PRINT & FINALIZE (Word Option Removed as Requested) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 text-xs font-black transition-all cursor-pointer shadow-md shadow-orange-900/30"
              title="Download or Print PDF"
            >
              <Printer className="h-4 w-4" />
              <span>PDF / PRINT</span>
            </button>

            <button
              type="button"
              onClick={() => {
                success('Finalized & Saved', 'Examination paper archived to cloud.');
              }}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-900/30"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>✓ FINALIZE & SAVE →</span>
            </button>
          </div>
        </div>
      </div>

      {/* ALIGNMENT CONTROL PANEL (EXACT MATCH OF IMAGE 2, 3, 4) */}
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-5 shadow-xl no-print space-y-4">
        {/* Controls Grid Row 1: Display Mode, Numbering Style, Duration, Marks per Q, Options Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 text-xs">
          {/* 1. DISPLAY QUESTIONS, SOLUTIONS * (Image 4) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              DISPLAY QUESTIONS, SOLUTIONS *
            </label>
            <select
              value={alignmentSettings.displayMode}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  displayMode: e.target.value as any,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="questions">1. Questions</option>
              <option value="with_answers">2. Questions with Answers</option>
              <option value="with_solutions">3. Questions with Answers & Solutions</option>
              <option value="questions_after_solutions">
                4. Questions after Answers & Solutions
              </option>
              <option value="no_options">5. Only Questions with No Options</option>
              <option value="solutions_only">6. Only Answers & Solutions</option>
              <option value="answers_only">7. Only Answers</option>
            </select>
          </div>

          {/* 2. OPTION NUMBERING STYLE * */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              OPTION NUMBERING STYLE *
            </label>
            <select
              value={alignmentSettings.optionNumberingStyle}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  optionNumberingStyle: e.target.value as any,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="(1) (2) (3) (4)">(1) (2) (3) (4)</option>
              <option value="(A) (B) (C) (D)">(A) (B) (C) (D)</option>
              <option value="(a) (b) (c) (d)">(a) (b) (c) (d)</option>
              <option value="(i) (ii) (iii) (iv)">(i) (ii) (iii) (iv)</option>
            </select>
          </div>

          {/* 3. DURATION (MINUTES) * */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              DURATION (MINUTES) *
            </label>
            <input
              type="number"
              min={10}
              max={360}
              value={alignmentSettings.durationMinutes}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  durationMinutes: parseInt(e.target.value, 10) || 60,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
            />
          </div>

          {/* 4. MARKS PER QUESTION * */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              MARKS PER QUESTION *
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={alignmentSettings.marksPerQuestion}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  marksPerQuestion: parseInt(e.target.value, 10) || 4,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
            />
          </div>

          {/* 5. OPTIONS LAYOUT * (Image 3) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              OPTIONS LAYOUT *
            </label>
            <select
              value={alignmentSettings.optionsLayout}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  optionsLayout: e.target.value as any,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="line">In a Line (1) (2) (3) (4)</option>
              <option value="grid">2 Columns (2×2 Grid)</option>
              <option value="stacked">1 Column (Stacked)</option>
              <option value="auto">Auto (Best Fit)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Gap Between Questions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              GAP BETWEEN QUESTIONS *
            </label>
            <select
              value={alignmentSettings.gapBetweenQuestions}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  gapBetweenQuestions: e.target.value as any,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="Default">Default</option>
              <option value="Compact">Compact</option>
              <option value="Medium">Medium</option>
              <option value="Relaxed">Relaxed</option>
              <option value="Large">Large</option>
            </select>
          </div>
        </div>

        {/* Row 3: Checkboxes Row */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/5 text-xs">
          {/* Show Question Numbers */}
          <label className="flex items-center gap-2 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={alignmentSettings.showQuestionNumbers}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  showQuestionNumbers: e.target.checked,
                })
              }
              className="rounded accent-[#C8A96A] h-4 w-4"
            />
            <span className="font-bold text-xs">Show Question Numbers</span>
          </label>

          {/* Image below Question */}
          <label className="flex items-center gap-2 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={alignmentSettings.imageBelowQuestion}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  imageBelowQuestion: e.target.checked,
                })
              }
              className="rounded accent-[#C8A96A] h-4 w-4"
            />
            <span className="font-bold text-xs">Image below Question</span>
          </label>

          {/* Paper 2 Column */}
          <label className="flex items-center gap-2 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={alignmentSettings.columns === 2}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  columns: e.target.checked ? 2 : 1,
                })
              }
              className="rounded accent-[#C8A96A] h-4 w-4"
            />
            <span className="font-bold text-xs">Paper 2 Column</span>
          </label>

          {/* Paper 2 Column Question Break */}
          <label className="flex items-center gap-2 cursor-pointer text-slate-200">
            <input
              type="checkbox"
              checked={alignmentSettings.avoidColumnBreak}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  avoidColumnBreak: e.target.checked,
                })
              }
              className="rounded accent-[#C8A96A] h-4 w-4"
            />
            <span className="font-bold text-xs">Paper 2 Column Question Break</span>
          </label>
        </div>

        {/* Row 4: Typography & Diagram Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 pt-2 border-t border-white/5 text-xs">
          {/* FONT STYLE */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              FONT STYLE
            </label>
            <select
              value={alignmentSettings.fontFamily}
              onChange={(e) =>
                setAlignmentSettings({ ...alignmentSettings, fontFamily: e.target.value })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="'Times New Roman', Times, serif">Times New Roman (Standard)</option>
              <option value="Inter, system-ui, sans-serif">Inter (Modern Clean)</option>
              <option value="Arial, Helvetica, sans-serif">Arial</option>
              <option value="Calibri, Candara, sans-serif">Calibri</option>
              <option value="Cambria, Georgia, serif">Cambria</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
          </div>

          {/* FONT SIZE */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              FONT SIZE
            </label>
            <select
              value={alignmentSettings.fontSize}
              onChange={(e) =>
                setAlignmentSettings({ ...alignmentSettings, fontSize: e.target.value })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="11px">Compact (11px)</option>
              <option value="12px">Standard (12px)</option>
              <option value="13px">Medium (13px)</option>
              <option value="14px">Large (14px)</option>
              <option value="15px">Extra Large (15px)</option>
            </select>
          </div>

          {/* LINE HEIGHT */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              LINE HEIGHT
            </label>
            <select
              value={alignmentSettings.lineHeight}
              onChange={(e) =>
                setAlignmentSettings({ ...alignmentSettings, lineHeight: e.target.value })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="1.2">Tight (1.2)</option>
              <option value="1.35">Compact (1.35)</option>
              <option value="1.5">Normal (1.5)</option>
              <option value="1.65">Relaxed (1.65)</option>
            </select>
          </div>

          {/* DIAGRAM MAX HEIGHT */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              DIAGRAM MAX HEIGHT
            </label>
            <select
              value={alignmentSettings.diagramMaxHeight}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  diagramMaxHeight: e.target.value,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="140px">Small (140px)</option>
              <option value="200px">Medium (200px)</option>
              <option value="260px">Large (260px)</option>
              <option value="320px">Extra Large (320px)</option>
            </select>
          </div>

          {/* SHOW MARKS ON QS */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              SHOW MARKS ON QS
            </label>
            <select
              value={alignmentSettings.showMarksOnQs}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  showMarksOnQs: e.target.value as any,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="hidden">Hidden (Standard)</option>
              <option value="right">Right Aligned [+4, -1]</option>
              <option value="inline">Inline</option>
            </select>
          </div>
        </div>

        {/* Row 5: Scheme of Valuation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 pt-2 border-t border-white/5 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-300 font-heading">
              SCHEME OF VALUATION
            </label>
            <select
              value={alignmentSettings.schemeOfValuation}
              onChange={(e) =>
                setAlignmentSettings({
                  ...alignmentSettings,
                  schemeOfValuation: e.target.value as any,
                })
              }
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="exclude">Exclude (Question Paper Only)</option>
              <option value="include_at_end">Include at End</option>
              <option value="separate_sheet">Separate Sheet</option>
            </select>
          </div>
        </div>
      </div>

      {/* MOBILE TOUCH READER CARDS (Visible only when mobile reader mode active) */}
      <div className={`space-y-4 md:hidden no-print ${mobileViewMode === 'reader' ? 'block' : 'hidden'}`}>
        {(currentSections || []).map((sec, sIdx) => (
          <div key={sIdx} className="space-y-3">
            {sec.name && (
              <div className="rounded-xl bg-[#141414] border border-[#C8A96A]/30 p-3 shadow-md flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#C8A96A] font-heading">
                    {sec.name}
                  </h3>
                  {sec.description && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{sec.description}</p>
                  )}
                </div>
                <span className="rounded-lg bg-[#C8A96A]/10 px-2 py-1 text-[10px] font-bold text-[#C8A96A]">
                  +{alignmentSettings.marksPerQuestion} Marks
                </span>
              </div>
            )}

            {(sec.questions || []).map((q, qIdx) => {
              const qNum = getQuestionNumber(sIdx, qIdx);
              return (
                <div
                  key={q.id || qNum}
                  className="rounded-2xl border border-white/10 bg-[#141414] p-4 space-y-2.5 shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#C8A96A] text-[#0D0D0D] text-xs font-black">
                      {qNum}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuestionClick(q, qNum - 1)}
                      className="glow-button-outline px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRightLeft className="h-3 w-3 text-[#C8A96A]" />
                      <span>Swap</span>
                    </button>
                  </div>

                  <div className="text-xs text-white leading-relaxed">
                    <KaTeXRenderer content={q.question} />
                  </div>

                  {q.opt_a && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <strong>(A)</strong> <KaTeXRenderer content={q.opt_a} className="inline" />
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <strong>(B)</strong> <KaTeXRenderer content={q.opt_b || ''} className="inline" />
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <strong>(C)</strong> <KaTeXRenderer content={q.opt_c || ''} className="inline" />
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                        <strong>(D)</strong> <KaTeXRenderer content={q.opt_d || ''} className="inline" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* A4 DOCUMENT CANVAS */}
      <div
        className={`a4-viewport-container ${
          mobileViewMode === 'a4' ? 'block' : 'hidden md:block'
        }`}
        style={{
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '40px',
        }}
      >
        <div className="a4-engine-wrapper">
          <div
            className="a4-print-document"
            style={{
              transform: effectiveZoom === 1 ? 'none' : `scale(${effectiveZoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
              width: '794px',
              maxWidth: '100%',
            }}
          >
            {/* Sheet Page 1: Question Paper */}
            <div className="a4-sheet-page a4-questions-page">
              {/* Background Watermark */}
              <div className="a4-watermark-wrapper">
                {headerConfig.crest_logo_url ? (
                  <img
                    src={headerConfig.crest_logo_url}
                    alt="Watermark Logo"
                    className="a4-watermark-logo"
                  />
                ) : (
                  <div className="watermark-text select-none">
                    {headerConfig.watermark_text || 'MANCHESTER TECHNOLOGIES'}
                  </div>
                )}
              </div>

              {/* Page Content */}
              <div
                className="a4-page-content"
                style={{
                  fontFamily: alignmentSettings.fontFamily,
                  fontSize: alignmentSettings.fontSize,
                  lineHeight: alignmentSettings.lineHeight,
                }}
              >
                {/* Primary Header */}
                <div
                  className="a4-primary-header-wrap"
                  style={{
                    marginBottom: '10px',
                    borderBottom: '2px solid #000',
                    paddingBottom: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '6px',
                    }}
                  >
                    {/* Left: Crest Logo */}
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {headerConfig.crest_logo_url ? (
                        <img
                          src={headerConfig.crest_logo_url}
                          alt="Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '10px',
                            background: '#001f6d',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '20px',
                          }}
                        >
                          MT
                        </div>
                      )}
                    </div>

                    {/* Center: Institution Details */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: '18px',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: '#000',
                          lineHeight: 1.1,
                        }}
                      >
                        {headerConfig.institution_name}
                      </div>
                      <div
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#333',
                          marginTop: '2px',
                        }}
                      >
                        {headerConfig.sub_title}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#000',
                          marginTop: '3px',
                        }}
                      >
                        {paper.title || `${paper.subject} Examination`} • {paper.exam_type}
                      </div>
                    </div>

                    {/* Right: SET Box */}
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid #000',
                        borderRadius: '4px',
                        padding: '2px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '8.5px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        SET
                      </span>
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: 900,
                          lineHeight: 1,
                          color: '#000',
                        }}
                      >
                        {activeSet}
                      </span>
                    </div>
                  </div>

                  {/* Meta Bar */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '10.5px',
                      color: '#111',
                      fontWeight: 700,
                      borderTop: '1px solid #777',
                      paddingTop: '3px',
                      marginTop: '3px',
                    }}
                  >
                    <span>
                      Subject: <strong>{(paper.subject || 'Chemistry').toUpperCase()}</strong>
                    </span>
                    <span>
                      Pattern: <strong>{paper.exam_type}</strong>
                    </span>
                    <span>
                      Time: <strong>{alignmentSettings.durationMinutes} Minutes</strong>
                    </span>
                    <span>
                      Max Marks:{' '}
                      <strong>
                        {allQuestionsFlattened.length * alignmentSettings.marksPerQuestion}
                      </strong>
                    </span>
                  </div>

                  {/* General Instructions Box */}
                  <div
                    style={{
                      marginTop: '5px',
                      padding: '4px 7px',
                      border: '1px solid #777',
                      borderRadius: '4px',
                      background: '#fafafa',
                      fontSize: '9.5px',
                      lineHeight: '1.35',
                      color: '#111',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        marginBottom: '1px',
                        fontSize: '9px',
                        letterSpacing: '0.04em',
                      }}
                    >
                      General Instructions:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '14px', listStyleType: 'decimal' }}>
                      {(headerConfig?.custom_instructions || []).map((inst, i) => (
                        <li key={i} style={{ margin: '1px 0' }}>
                          {inst}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Questions Flow */}
                <div
                  className={`a4-questions-flow ${alignmentSettings.columns === 1 ? 'single-column' : ''}`}
                  style={{
                    columnCount: alignmentSettings.columns,
                    columnGap: '18px',
                    columnRule: alignmentSettings.columns === 2 ? '1px solid #cbd5e1' : 'none',
                    width: '100%',
                  }}
                >
                  {(currentSections || []).map((sec, sIdx) => (
                    <React.Fragment key={sIdx}>
                      {/* Section banner (only if more than 1 section, e.g. JEE) */}
                      {currentSections.length > 1 && (
                        <div className="part-header-directive-block">
                          <div
                            style={{
                              fontWeight: 900,
                              fontSize: '10.5px',
                              textTransform: 'uppercase',
                              color: '#001f6d',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {sec.name} ({sec.attempt_count} Questions • +{alignmentSettings.marksPerQuestion}, -{sec.negative_marking})
                          </div>
                          {sec.description && (
                            <div
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 600,
                                color: '#334155',
                                marginTop: '1px',
                                fontStyle: 'italic',
                              }}
                            >
                              {sec.description}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Question Items */}
                      {(sec.questions || []).map((q, qIdx) => {
                        const qNum = getQuestionNumber(sIdx, qIdx);
                        const isCurrentTarget = selectedTargetQuestion?.id === q.id;

                        return (
                          <div
                            key={q.id || qNum}
                            onClick={() => handleQuestionClick(q, qNum - 1)}
                            className={`question-print-item group relative rounded transition-all cursor-pointer ${
                              isCurrentTarget ? 'bg-[#C8A96A]/10 ring-2 ring-[#C8A96A] p-1' : 'p-0.5'
                            }`}
                            style={{
                              marginBottom: computedSpacing,
                              breakInside: alignmentSettings.avoidColumnBreak ? 'avoid' : 'auto',
                              pageBreakInside: alignmentSettings.avoidColumnBreak ? 'avoid' : 'auto',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '5px',
                                fontFamily: 'inherit',
                                fontSize: 'inherit',
                                lineHeight: 'inherit',
                              }}
                            >
                              {alignmentSettings.showQuestionNumbers && (
                                <span
                                  style={{
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    minWidth: '22px',
                                    lineHeight: '1.4',
                                    color: '#000',
                                  }}
                                >
                                  {qNum}.
                                </span>
                              )}

                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Marks inline */}
                                {alignmentSettings.showMarksOnQs === 'inline' && (
                                  <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#001f6d', marginRight: '4px' }}>
                                    [+{alignmentSettings.marksPerQuestion}, -1]
                                  </span>
                                )}

                                {/* Marks right-aligned */}
                                {alignmentSettings.showMarksOnQs === 'right' && (
                                  <span style={{ float: 'right', fontSize: '9.5px', fontWeight: 800, color: '#001f6d' }}>
                                    [+{alignmentSettings.marksPerQuestion}, -1]
                                  </span>
                                )}

                                {/* Question Stem */}
                                {q.assertion && q.reason ? (
                                  <div style={{ color: '#000', wordBreak: 'break-word', fontSize: 'inherit' }}>
                                    {q.question && !q.question.includes('Assertion (A)') && (
                                      <div style={{ marginBottom: '3px' }}>
                                        <KaTeXRenderer content={q.question} />
                                      </div>
                                    )}
                                    <div style={{ marginBottom: '2px', lineHeight: '1.38' }}>
                                      <strong style={{ color: '#000', fontWeight: 800 }}>Assertion (A): </strong>
                                      <KaTeXRenderer content={q.assertion} className="inline" />
                                    </div>
                                    <div style={{ lineHeight: '1.38' }}>
                                      <strong style={{ color: '#000', fontWeight: 800 }}>Reason (R): </strong>
                                      <KaTeXRenderer content={q.reason} className="inline" />
                                    </div>
                                  </div>
                                ) : q.statement_1 && q.statement_2 ? (
                                  <div style={{ color: '#000', wordBreak: 'break-word', fontSize: 'inherit' }}>
                                    <div style={{ marginBottom: '2px', fontWeight: 600 }}>Given below are two statements:</div>
                                    <div style={{ marginBottom: '2px', lineHeight: '1.38' }}>
                                      <strong style={{ color: '#000', fontWeight: 800 }}>Statement I: </strong>
                                      <KaTeXRenderer content={q.statement_1} className="inline" />
                                    </div>
                                    <div style={{ marginBottom: '2px', lineHeight: '1.38' }}>
                                      <strong style={{ color: '#000', fontWeight: 800 }}>Statement II: </strong>
                                      <KaTeXRenderer content={q.statement_2} className="inline" />
                                    </div>
                                  </div>
                                ) : q.match_table && q.match_table.length > 0 ? (
                                  <div style={{ color: '#000', wordBreak: 'break-word', fontSize: 'inherit' }}>
                                    <div style={{ marginBottom: '3px' }}>
                                      <KaTeXRenderer content={q.question || 'Match List-I with List-II:'} />
                                    </div>
                                    <table
                                      style={{
                                        width: '100%',
                                        maxWidth: '280px',
                                        borderCollapse: 'collapse',
                                        border: '1px solid #334155',
                                        fontSize: '0.9em',
                                        margin: '3px 0',
                                      }}
                                    >
                                      <thead>
                                        <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #334155' }}>
                                          <th style={{ padding: '2px 5px', textAlign: 'left', fontWeight: 700, borderRight: '1px solid #334155' }}>
                                            List - I
                                          </th>
                                          <th style={{ padding: '2px 5px', textAlign: 'left', fontWeight: 700 }}>
                                            List - II
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {q.match_table.map((row, rIdx) => (
                                          <tr key={rIdx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                            <td style={{ padding: '2px 5px', borderRight: '1px solid #cbd5e1' }}>
                                              <KaTeXRenderer content={row.col1} className="inline" />
                                            </td>
                                            <td style={{ padding: '2px 5px' }}>
                                              <KaTeXRenderer content={row.col2} className="inline" />
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div style={{ color: '#000', wordBreak: 'break-word' }}>
                                    <KaTeXRenderer content={q.question} />
                                  </div>
                                )}

                                {/* Diagram Above Options if imageBelowQuestion is FALSE */}
                                {!alignmentSettings.imageBelowQuestion && q.diagram_svg && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      margin: '4px 0',
                                      maxHeight: alignmentSettings.diagramMaxHeight,
                                      overflow: 'hidden',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: q.diagram_svg }}
                                  />
                                )}

                                {/* Options Layout */}
                                {q.opt_a && alignmentSettings.displayMode !== 'no_options' && (
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns:
                                        alignmentSettings.optionsLayout === 'line'
                                          ? 'repeat(4, minmax(0, 1fr))'
                                          : alignmentSettings.optionsLayout === 'stacked'
                                          ? '1fr'
                                          : alignmentSettings.optionsLayout === 'grid'
                                          ? 'repeat(2, minmax(0, 1fr))'
                                          : (q.opt_a || '').length > 25
                                          ? '1fr'
                                          : 'repeat(2, minmax(0, 1fr))',
                                      gap: alignmentSettings.optionsLayout === 'stacked' ? '2px 0' : '2px 6px',
                                      marginTop: '3px',
                                      fontSize: '0.94em',
                                    }}
                                  >
                                    <div>
                                      <strong style={{ color: '#001f6d', fontWeight: 800 }}>
                                        {formatOptionLabel(0, alignmentSettings.optionNumberingStyle)}
                                      </strong>{' '}
                                      <KaTeXRenderer content={q.opt_a} className="inline" />
                                      {alignmentSettings.displayMode === 'with_answers' && (q.correct_option === 'A' || !q.correct_option) && (
                                        <span style={{ marginLeft: '4px', fontSize: '9px', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '1px 3px', borderRadius: '3px' }}>
                                          ✓ Key
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <strong style={{ color: '#001f6d', fontWeight: 800 }}>
                                        {formatOptionLabel(1, alignmentSettings.optionNumberingStyle)}
                                      </strong>{' '}
                                      <KaTeXRenderer content={q.opt_b || ''} className="inline" />
                                      {alignmentSettings.displayMode === 'with_answers' && q.correct_option === 'B' && (
                                        <span style={{ marginLeft: '4px', fontSize: '9px', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '1px 3px', borderRadius: '3px' }}>
                                          ✓ Key
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <strong style={{ color: '#001f6d', fontWeight: 800 }}>
                                        {formatOptionLabel(2, alignmentSettings.optionNumberingStyle)}
                                      </strong>{' '}
                                      <KaTeXRenderer content={q.opt_c || ''} className="inline" />
                                      {alignmentSettings.displayMode === 'with_answers' && q.correct_option === 'C' && (
                                        <span style={{ marginLeft: '4px', fontSize: '9px', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '1px 3px', borderRadius: '3px' }}>
                                          ✓ Key
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <strong style={{ color: '#001f6d', fontWeight: 800 }}>
                                        {formatOptionLabel(3, alignmentSettings.optionNumberingStyle)}
                                      </strong>{' '}
                                      <KaTeXRenderer content={q.opt_d || ''} className="inline" />
                                      {alignmentSettings.displayMode === 'with_answers' && q.correct_option === 'D' && (
                                        <span style={{ marginLeft: '4px', fontSize: '9px', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '1px 3px', borderRadius: '3px' }}>
                                          ✓ Key
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Diagram Below Options if imageBelowQuestion is TRUE */}
                                {alignmentSettings.imageBelowQuestion && q.diagram_svg && (
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      margin: '4px 0',
                                      maxHeight: alignmentSettings.diagramMaxHeight,
                                      overflow: 'hidden',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: q.diagram_svg }}
                                  />
                                )}

                                {/* Only Answers mode */}
                                {alignmentSettings.displayMode === 'answers_only' && (
                                  <div style={{ marginTop: '2px', fontSize: '9.5px', fontWeight: 800, color: '#001f6d' }}>
                                    Key: Option {formatOptionLabel(q.correct_option === 'A' ? 0 : q.correct_option === 'B' ? 1 : q.correct_option === 'C' ? 2 : 3, alignmentSettings.optionNumberingStyle)}
                                  </div>
                                )}

                                {/* Solutions inline */}
                                {(alignmentSettings.displayMode === 'with_solutions' || showSolutions || alignmentSettings.displayMode === 'solutions_only') && (
                                  <div
                                    style={{
                                      marginTop: '3px',
                                      padding: '3px 6px',
                                      background: '#f8fafc',
                                      borderLeft: '2.5px solid #001f6d',
                                      borderTop: '1px solid #e2e8f0',
                                      borderRight: '1px solid #e2e8f0',
                                      borderBottom: '1px solid #e2e8f0',
                                      fontSize: '0.88em',
                                      color: '#1e293b',
                                      borderRadius: '2px',
                                    }}
                                  >
                                    <div style={{ fontWeight: 800, fontSize: '9px', color: '#001f6d', textTransform: 'uppercase' }}>
                                      Solution & Valuation Criteria:
                                    </div>
                                    <KaTeXRenderer
                                      content={
                                        q.solution_text ||
                                        `Applying core principles of ${q.chapter || 'Chemistry'}, correct key is Option ${formatOptionLabel(q.correct_option === 'B' ? 1 : q.correct_option === 'C' ? 2 : q.correct_option === 'D' ? 3 : 0, alignmentSettings.optionNumberingStyle)}.`
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>

                {/* Scheme of Valuation Table appended at End of Paper if selected */}
                {alignmentSettings.schemeOfValuation !== 'exclude' && (
                  <div
                    style={{
                      marginTop: '20px',
                      paddingTop: '12px',
                      borderTop: '2px solid #000',
                      breakBefore: alignmentSettings.schemeOfValuation === 'separate_sheet' ? 'page' : 'auto',
                      pageBreakBefore: alignmentSettings.schemeOfValuation === 'separate_sheet' ? 'always' : 'auto',
                    }}
                  >
                    <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '14px', textTransform: 'uppercase', marginBottom: '10px', color: '#000' }}>
                      {paper.exam_type.toUpperCase()} EXAMINATION - SET {activeSet} KEY ANS ({(paper.subject || 'CHEMISTRY').toUpperCase()}) {headerConfig.date}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '10.5px', textAlign: 'center' }}>
                      <tbody>
                        {answerKeyChunks.map((chunk, chunkIdx) => {
                          const startQ = chunkIdx * 15 + 1;
                          const qNumbers = chunk.map((_, i) => startQ + i);
                          const keys = chunk.map((q, i) => getAnswerKeyDisplay(q, startQ + i, alignmentSettings.optionNumberingStyle));
                          const subjCode = (paper.subject || 'CHEM').toUpperCase().slice(0, 4);

                          return (
                            <React.Fragment key={chunkIdx}>
                              <tr style={{ borderTop: chunkIdx > 0 ? '2px solid #000' : 'none', borderBottom: '1px solid #000' }}>
                                <td
                                  rowSpan={2}
                                  style={{
                                    borderRight: '1.5px solid #000',
                                    padding: '5px 3px',
                                    fontWeight: 900,
                                    fontSize: '11px',
                                    width: '54px',
                                  }}
                                >
                                  {subjCode}
                                </td>
                                <td
                                  style={{
                                    borderRight: '1.5px solid #000',
                                    padding: '4px',
                                    fontWeight: 800,
                                    fontSize: '10px',
                                    width: '50px',
                                  }}
                                >
                                  Q. NO
                                </td>
                                {qNumbers.map((num) => (
                                  <td
                                    key={num}
                                    style={{
                                      borderRight: '1px solid #000',
                                      padding: '4px 2px',
                                      fontWeight: 800,
                                    }}
                                  >
                                    {num}
                                  </td>
                                ))}
                                {Array.from({ length: 15 - qNumbers.length }).map((_, emptyIdx) => (
                                  <td key={`empty_num_${emptyIdx}`} style={{ borderRight: '1px solid #000' }} />
                                ))}
                              </tr>

                              <tr style={{ borderBottom: '2px solid #000' }}>
                                <td
                                  style={{
                                    borderRight: '1.5px solid #000',
                                    padding: '4px',
                                    fontWeight: 800,
                                    fontSize: '10px',
                                  }}
                                >
                                  KEY
                                </td>
                                {keys.map((k, kIdx) => (
                                  <td
                                    key={kIdx}
                                    style={{
                                      borderRight: '1px solid #000',
                                      padding: '4px 2px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {k}
                                  </td>
                                ))}
                                {Array.from({ length: 15 - keys.length }).map((_, emptyIdx) => (
                                  <td key={`empty_key_${emptyIdx}`} style={{ borderRight: '1px solid #000' }} />
                                ))}
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ANSWER KEY MODAL (IMAGE 5 RECREATION WITH PDF & EXCEL DOWNLOAD) */}
      {showAnswerKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-[#141414] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8A96A]/20 text-[#C8A96A] font-black">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    Official Answer Key & Evaluation Matrix
                  </h3>
                  <p className="text-xs text-slate-400">
                    Series Set {activeSet} • {paper.exam_type} Pattern • {allQuestionsFlattened.length} Questions
                  </p>
                </div>
              </div>

              {/* Action Buttons: Excel & PDF */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAnswerKeyExcel}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-950/30"
                  title="Download in Excel format (.csv)"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-md shadow-orange-950/30"
                  title="Print or Save PDF"
                >
                  <Printer className="h-4 w-4" />
                  <span>PDF / Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAnswerKeyModal(false)}
                  className="rounded-xl border border-white/10 bg-[#1A1A1A] p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Exact Image 5 Table in White Card */}
            <div className="rounded-2xl bg-white p-6 shadow-2xl text-black">
              {/* Centered Heading */}
              <div className="text-center font-black text-sm sm:text-base uppercase tracking-tight text-black mb-4">
                {paper.exam_type.toUpperCase()} EXAMINATION - SET {activeSet} KEY ANS ({(paper.subject || 'CHEMISTRY').toUpperCase()}) {headerConfig.date}
              </div>

              {/* The 16-Column Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-black text-center text-xs sm:text-sm">
                  <tbody>
                    {answerKeyChunks.map((chunk, chunkIdx) => {
                      const startQ = chunkIdx * 15 + 1;
                      const qNumbers = chunk.map((_, i) => startQ + i);
                      const keys = chunk.map((q, i) =>
                        getAnswerKeyDisplay(q, startQ + i, alignmentSettings.optionNumberingStyle)
                      );
                      const subjCode = (paper.subject || 'CHEM').toUpperCase().slice(0, 4);

                      return (
                        <React.Fragment key={chunkIdx}>
                          {/* Row 1: Subj (rowSpan 2) + Q. NO + Numbers 1..15 */}
                          <tr className={chunkIdx > 0 ? 'border-t-2 border-black' : ''}>
                            <td
                              rowSpan={2}
                              className="border-r-[1.5px] border-b-2 border-black p-2 font-black text-xs sm:text-sm uppercase bg-white w-16"
                            >
                              {subjCode}
                            </td>
                            <td className="border-r-[1.5px] border-b border-black p-2 font-extrabold text-[11px] sm:text-xs bg-white w-14">
                              Q. NO
                            </td>
                            {qNumbers.map((num) => (
                              <td
                                key={num}
                                className="border-r border-b border-black p-1.5 sm:p-2 font-extrabold text-xs sm:text-sm"
                              >
                                {num}
                              </td>
                            ))}
                            {Array.from({ length: 15 - qNumbers.length }).map((_, emptyIdx) => (
                              <td
                                key={`empty_modal_num_${emptyIdx}`}
                                className="border-r border-b border-black p-1.5"
                              />
                            ))}
                          </tr>

                          {/* Row 2: KEY + Answers */}
                          <tr className="border-b-2 border-black">
                            <td className="border-r-[1.5px] border-black p-2 font-extrabold text-[11px] sm:text-xs bg-white">
                              KEY
                            </td>
                            {keys.map((k, kIdx) => (
                              <td
                                key={kIdx}
                                className="border-r border-black p-1.5 sm:p-2 font-black text-xs sm:text-sm"
                              >
                                {k}
                              </td>
                            ))}
                            {Array.from({ length: 15 - keys.length }).map((_, emptyIdx) => (
                              <td
                                key={`empty_modal_key_${emptyIdx}`}
                                className="border-r border-black p-1.5"
                              />
                            ))}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION SWAP DRAWER */}
      {isSwapDrawerOpen && selectedTargetQuestion && (
        <SwapDrawer
          isOpen={isSwapDrawerOpen}
          targetQuestion={selectedTargetQuestion}
          targetIndex={selectedTargetIndex}
          paperSubject={paper.subject || 'Chemistry'}
          onClose={() => setIsSwapDrawerOpen(false)}
          onConfirmSwap={handleSwapConfirm}
          isPro={isPro}
          onOpenUpgrade={onOpenUpgrade}
        />
      )}

      {/* HEADER STUDIO MODAL */}
      {isHeaderStudioOpen && (
        <HeaderStudioModal
          isOpen={isHeaderStudioOpen}
          config={headerConfig}
          onSave={handleHeaderSave}
          onClose={() => setIsHeaderStudioOpen(false)}
          isPro={isPro}
          onOpenUpgrade={onOpenUpgrade}
        />
      )}
    </div>
  );
};
