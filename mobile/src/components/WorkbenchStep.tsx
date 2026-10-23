import React, { useState, useEffect, useMemo } from 'react';
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
  Download,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Eye,
  Settings2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { KaTeXRenderer } from './KaTeXRenderer';
import { SwapDrawer } from './SwapDrawer';
import { HeaderStudioModal, HeaderConfigState } from './HeaderStudioModal';
import { StoredUser, StoredSubscription, api } from '../services/apiClient';
import { useToast } from './Toast';

export interface Question {
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
  correct_option?: string;
  difficulty?: string;
  q_type?: string;
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

export interface AlignmentSettings {
  questionSpacing: string;
  columns: number;
  diagramMaxHeight: string;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  showMarks: boolean;
}

interface WorkbenchStepProps {
  paper: PaperState;
  onPaperUpdate: (updated: PaperState) => void;
  user: StoredUser | null;
  subscription: StoredSubscription | null;
  onOpenUpgrade: () => void;
  onOpenReferral: () => void;
  initialStep?: 4 | 5;
  onNavigateStep?: (step: number) => void;
}

export const WorkbenchStep: React.FC<WorkbenchStepProps> = ({
  paper,
  onPaperUpdate,
  user,
  subscription,
  onOpenUpgrade,
  onOpenReferral,
  initialStep = 4,
  onNavigateStep,
}) => {
  const { success, warning, error, info } = useToast();

  const isPro = subscription?.isActive === true;
  const isElite = subscription?.plan?.toLowerCase().includes('elite') || subscription?.amount === 499;

  // Active Shuffled Set: Set P, Set Q, Set R, Set S
  const [activeSet, setActiveSet] = useState<'P' | 'Q' | 'R' | 'S'>('P');

  // Alignment and typography settings (exact match with Sapthagiri PU College)
  const [alignmentSettings, setAlignmentSettings] = useState<AlignmentSettings>({
    questionSpacing: '10px',
    columns: 2,
    diagramMaxHeight: '260px',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    lineHeight: '1.45',
    showMarks: false,
  });

  // Toggle alignment panel open/closed
  const [showAlignmentPanel, setShowAlignmentPanel] = useState<boolean>(initialStep === 5);

  // Mobile View Mode: 'reader' (touch card list) or 'a4' (exact scaled print preview)
  const [mobileViewMode, setMobileViewMode] = useState<'reader' | 'a4'>(
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'reader' : 'a4'
  );

  // Zoom control
  const [zoomMode, setZoomMode] = useState<'fit' | 'custom'>('fit');
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
      // Scale down to fit mobile screens with padding
      return Math.max(0.42, Math.min(1, (windowWidth - 28) / 794));
    }
    return 1;
  }, [windowWidth]);

  const effectiveZoom = zoomMode === 'fit' ? autoFitScale : zoomScale / 100;

  // Show Answer Key preview
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);

  // Header Studio Modal state
  const [isHeaderStudioOpen, setIsHeaderStudioOpen] = useState<boolean>(false);

  // Swap Drawer state
  const [selectedTargetQuestion, setSelectedTargetQuestion] = useState<Question | null>(null);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number>(0);
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState<boolean>(false);

  // Word Exporting state
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);

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

  // Switch Series Set with Elite check
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

  // Download Word (.docx) document
  const handleDownloadWord = () => {
    setIsExportingWord(true);
    try {
      let docContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${paper.title}</title>
          <style>
            body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.35; color: #000; }
            h1 { text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 2pt; text-transform: uppercase; }
            h2 { text-align: center; font-size: 11pt; font-weight: bold; margin-bottom: 4pt; color: #333; }
            .meta-table { width: 100%; border-top: 1pt solid #000; border-bottom: 1pt solid #000; margin-bottom: 10pt; font-size: 10pt; font-weight: bold; }
            .section-header { background: #f0f4f8; border-left: 3pt solid #001f6d; padding: 4pt 8pt; font-weight: bold; font-size: 10pt; margin-top: 10pt; margin-bottom: 6pt; }
            .question-item { margin-bottom: 8pt; page-break-inside: avoid; }
            .options-grid { margin-left: 14pt; margin-top: 3pt; font-size: 10pt; }
            .answer-key-table { width: 100%; border-collapse: collapse; margin-top: 14pt; font-size: 10pt; }
            .answer-key-table th, .answer-key-table td { border: 1pt solid #ccc; padding: 4pt 6pt; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${headerConfig.institution_name}</h1>
          <h2>${headerConfig.sub_title}</h2>
          <div style="text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 6pt;">
            ${paper.title} • SERIES ${activeSet}
          </div>
          <table class="meta-table">
            <tr>
              <td>Subject: ${paper.subject.toUpperCase()}</td>
              <td>Pattern: ${paper.exam_type}</td>
              <td>Duration: ${headerConfig.duration}</td>
              <td align="right">Max Marks: ${paper.total_marks}</td>
            </tr>
          </table>
      `;

      let qCount = 1;
      (currentSections || []).forEach((sec) => {
        docContent += `
          <div class="section-header">${sec.name.toUpperCase()} (${sec.attempt_count} Questions • +${sec.marks_per_question}, -${sec.negative_marking})</div>
        `;
        (sec.questions || []).forEach((q) => {
          let qBody = q.question.replace(/\$/g, '');
          if (q.assertion && q.reason) {
            qBody = `<div><b>Assertion (A):</b> ${q.assertion.replace(/\$/g, '')}</div><div><b>Reason (R):</b> ${q.reason.replace(/\$/g, '')}</div>`;
          } else if (q.statement_1 && q.statement_2) {
            qBody = `<div><b>Statement I:</b> ${q.statement_1.replace(/\$/g, '')}</div><div><b>Statement II:</b> ${q.statement_2.replace(/\$/g, '')}</div>`;
          }

          let diagHtml = '';
          if (q.diagram_svg) {
            diagHtml = `<div style="text-align: center; margin: 6pt 0;">${q.diagram_svg}</div>`;
          }

          let matchHtml = '';
          if (q.match_table && q.match_table.length > 0) {
            matchHtml = `<table border="1" style="border-collapse: collapse; margin: 4pt auto; font-size: 9pt;"><tr><th style="padding: 2pt 8pt;">List - I</th><th style="padding: 2pt 8pt;">List - II</th></tr>${q.match_table.map((r: any) => `<tr><td style="padding: 2pt 8pt;">${r.col1.replace(/\$/g, '')}</td><td style="padding: 2pt 8pt;">${r.col2.replace(/\$/g, '')}</td></tr>`).join('')}</table>`;
          }

          docContent += `
            <div class="question-item">
              <div><strong>Q.${qCount++}.</strong> ${qBody}</div>
              ${diagHtml}
              ${matchHtml}
              ${
                q.opt_a
                  ? `
                <div class="options-grid">
                  (A) ${q.opt_a.replace(/\$/g, '')} &nbsp;&nbsp;&nbsp;&nbsp;
                  (B) ${(q.opt_b || '').replace(/\$/g, '')} &nbsp;&nbsp;&nbsp;&nbsp;
                  (C) ${(q.opt_c || '').replace(/\$/g, '')} &nbsp;&nbsp;&nbsp;&nbsp;
                  (D) ${(q.opt_d || '').replace(/\$/g, '')}
                </div>
              `
                  : ''
              }
              ${
                q.q_type === 'numerical' || q.num_answer
                  ? '<div style="margin-left: 14pt; font-style: italic; color: #555;">Answer: [ ________ ] (Numerical Value)</div>'
                  : ''
              }
            </div>
          `;
        });
      });

      docContent += `
          <div style="text-align: center; margin-top: 15pt; font-weight: bold;">*** End of Question Paper ***</div>
        </body>
        </html>
      `;

      const blob = new Blob([docContent], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(paper.title || 'Question_Paper').replace(/[^a-zA-Z0-9_-]/g, '_')}_Set_${activeSet}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('Word Document Downloaded', 'Paper exported in editable Microsoft Word format.');
    } catch (err: any) {
      error('Export Error', err.message || 'Could not export Word document.');
    } finally {
      setIsExportingWord(false);
    }
  };

  const getQuestionNumber = (secIdx: number, qIdx: number) => {
    let count = 1;
    for (let i = 0; i < secIdx; i++) {
      count += (currentSections[i]?.questions || []).length;
    }
    return count + qIdx;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Mobile View Mode Switcher (Visible on mobile screens) */}
      <div className="flex md:hidden items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#141414] border border-white/10 no-print shadow-md">
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

      {/* Top Workbench Toolbar (Responsive & Touch-Friendly) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#141414] p-3 sm:p-4 no-print shadow-xl">
        {/* Left: Shuffled Series Tabs (Set P, Q, R, S) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 mr-1 whitespace-nowrap">
            Set:
          </span>
          {(['P', 'Q', 'R', 'S'] as const).map((set) => {
            const isCurrent = activeSet === set;
            return (
              <button
                key={set}
                onClick={() => handleSelectSet(set)}
                className={`relative flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'bg-[#C8A96A] text-[#0D0D0D] shadow-lg shadow-[#C8A96A]/20 ring-1 ring-[#C8A96A]/50 font-black'
                    : 'bg-[#1A1A1A] text-slate-300 hover:text-white hover:bg-[#222222] border border-white/5'
                }`}
                title={
                  set === 'P'
                    ? 'Set P: Master Question Order'
                    : set === 'Q'
                      ? 'Set Q: Shuffled Questions'
                      : set === 'R'
                        ? 'Set R: Shuffled Options'
                        : 'Set S: Dual Shuffled'
                }
              >
                <span>Set {set}</span>
                {set !== 'P' && !isElite && (
                  <Lock className="h-3 w-3 text-amber-400 opacity-80" />
                )}
              </button>
            );
          })}
        </div>

        {/* Center: Swaps Counter & Custom Header Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Swaps Counter Pill */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-1.5 text-xs font-semibold text-slate-300 whitespace-nowrap">
            <ArrowRightLeft className="h-3.5 w-3.5 text-[#C8A96A]" />
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
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-[#C8A96A]/40 transition-all cursor-pointer whitespace-nowrap"
          >
            <Building2 className="h-3.5 w-3.5 text-[#C8A96A]" />
            <span>Customize Header</span>
          </button>
        </div>

        {/* Right: Alignment Toggle, Answer Key, Zoom & Export Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Alignment Controls Toggle */}
          <button
            onClick={() => setShowAlignmentPanel(!showAlignmentPanel)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              showAlignmentPanel
                ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]'
                : 'border-white/10 bg-[#1A1A1A] text-slate-300 hover:text-white hover:border-white/20'
            }`}
          >
            <Settings2 className="h-3.5 w-3.5 text-[#C8A96A]" />
            <span className="hidden sm:inline">Alignment Controls</span>
          </button>

          {/* Answer Key Toggle */}
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              showAnswerKey
                ? 'bg-[#C8A96A]/20 border-[#C8A96A] text-[#C8A96A]'
                : 'border-white/10 bg-[#1A1A1A] text-slate-300 hover:text-white hover:border-white/20'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5 text-[#C8A96A]" />
            <span className="hidden sm:inline">Answer Key</span>
          </button>

          {/* Zoom Controls (Fit / 75% / 100%) */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#1A1A1A] px-2 py-1">
            <button
              onClick={() => {
                setZoomMode('fit');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                zoomMode === 'fit' ? 'bg-[#C8A96A] text-[#0D0D0D]' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fit
            </button>
            <button
              onClick={() => {
                setZoomMode('custom');
                setZoomScale(75);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                zoomMode === 'custom' && zoomScale === 75 ? 'bg-[#C8A96A] text-[#0D0D0D]' : 'text-slate-400 hover:text-white'
              }`}
            >
              75%
            </button>
            <button
              onClick={() => {
                setZoomMode('custom');
                setZoomScale(100);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                zoomMode === 'custom' && zoomScale === 100 ? 'bg-[#C8A96A] text-[#0D0D0D]' : 'text-slate-400 hover:text-white'
              }`}
            >
              100%
            </button>
          </div>

          {/* Download Word (.docx) */}
          <button
            onClick={handleDownloadWord}
            disabled={isExportingWord}
            className="flex items-center gap-1.5 rounded-xl border border-[#C8A96A]/30 bg-[#1A1A1A] px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-[#C8A96A] hover:border-[#C8A96A] transition-all cursor-pointer whitespace-nowrap"
            title="Download editable Microsoft Word document (.doc)"
          >
            <FileText className="h-3.5 w-3.5 text-[#C8A96A]" />
            <span className="hidden md:inline">{isExportingWord ? 'Exporting...' : 'Word'}</span>
          </button>

          {/* Print / Download PDF */}
          <button
            onClick={() => window.print()}
            className="glow-button flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-[#0D0D0D] transition-all cursor-pointer whitespace-nowrap"
            title="Download PDF or Print"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Step 5 Alignment & Layout Controls Panel */}
      {showAlignmentPanel && (
        <div className="rounded-2xl border border-white/10 bg-[#141414] p-5 shadow-xl animate-in fade-in duration-200 no-print space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base text-[#C8A96A]">⚙️</span>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-heading">
                Paper Alignment & Layout Controls (Step 5)
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Fine-tune spacing, typography, and page setup
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            {/* Question Spacing */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Question Spacing
              </label>
              <select
                value={alignmentSettings.questionSpacing}
                onChange={(e) =>
                  setAlignmentSettings({ ...alignmentSettings, questionSpacing: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
              >
                <option value="6px">Compact (6px)</option>
                <option value="10px">Standard (10px)</option>
                <option value="14px">Relaxed (14px)</option>
                <option value="18px">Wide (18px)</option>
              </select>
            </div>

            {/* Columns Mode */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Columns Mode
              </label>
              <select
                value={alignmentSettings.columns}
                onChange={(e) =>
                  setAlignmentSettings({ ...alignmentSettings, columns: parseInt(e.target.value) })
                }
                className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
              >
                <option value={2}>2 Columns (Standard)</option>
                <option value={1}>1 Single Column</option>
              </select>
            </div>

            {/* Diagram Max Height */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Diagram Max Height
              </label>
              <select
                value={alignmentSettings.diagramMaxHeight}
                onChange={(e) =>
                  setAlignmentSettings({ ...alignmentSettings, diagramMaxHeight: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
              >
                <option value="200px">Medium (200px)</option>
                <option value="260px">Standard (260px)</option>
                <option value="320px">Large (320px)</option>
              </select>
            </div>

            {/* Font Style */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Font Style
              </label>
              <select
                value={alignmentSettings.fontFamily}
                onChange={(e) =>
                  setAlignmentSettings({ ...alignmentSettings, fontFamily: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
              >
                <option value="Inter, system-ui, sans-serif">Inter (Modern Clean)</option>
                <option value="Georgia, 'Times New Roman', serif">Georgia (Classic)</option>
                <option value="'Times New Roman', Times, serif">Times New Roman</option>
                <option value="Calibri, Candara, sans-serif">Calibri</option>
                <option value="Arial, Helvetica, sans-serif">Arial</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Font Size
              </label>
              <select
                value={alignmentSettings.fontSize}
                onChange={(e) =>
                  setAlignmentSettings({ ...alignmentSettings, fontSize: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
              >
                <option value="12px">Compact (12px)</option>
                <option value="13px">Standard (13px)</option>
                <option value="14px">Large (14px)</option>
              </select>
            </div>

            {/* Line Height */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Line Spacing
              </label>
              <select
                value={alignmentSettings.lineHeight}
                onChange={(e) =>
                  setAlignmentSettings({ ...alignmentSettings, lineHeight: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8A96A]"
              >
                <option value="1.35">Compact (1.35)</option>
                <option value="1.45">Standard (1.45)</option>
                <option value="1.6">Relaxed (1.6)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Question Reader Cards (Visible only on mobile/tablet when Reader mode is active) */}
      <div className={`space-y-4 md:hidden no-print ${mobileViewMode === 'reader' ? 'block' : 'hidden'}`}>
        {(currentSections || []).map((sec, sIdx) => (
          <div key={sIdx} className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center justify-between rounded-xl bg-[#141414] border border-[#C8A96A]/30 p-3 shadow-md">
              <div>
                <h3 className="text-xs font-black uppercase text-[#C8A96A] font-heading">
                  {sec.name}
                </h3>
                {sec.description && (
                  <p className="text-[10px] text-slate-400 mt-0.5">{sec.description}</p>
                )}
              </div>
              <span className="rounded-lg bg-[#C8A96A]/10 px-2 py-1 text-[10px] font-bold text-[#C8A96A] border border-[#C8A96A]/20 shrink-0">
                {sec.attempt_count} Qs • +{sec.marks_per_question}/-{sec.negative_marking}
              </span>
            </div>

            {/* Questions in Section */}
            {(sec?.questions || []).map((q, qIdx) => {
              const qNum = getQuestionNumber(sIdx, qIdx);
              const isCurrentTarget = selectedTargetQuestion?.id === q.id;

              return (
                <div
                  key={q.id || qNum}
                  className={`rounded-2xl border p-4 transition-all shadow-lg ${
                    isCurrentTarget
                      ? 'border-[#C8A96A] bg-[#1A1A1A] ring-1 ring-[#C8A96A]'
                      : 'border-white/10 bg-[#141414]'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#C8A96A] text-[#0D0D0D] text-xs font-black shadow-sm">
                        {qNum}
                      </span>
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300 truncate max-w-[140px]">
                        {q.chapter || 'Chemistry'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuestionClick(q, qNum - 1)}
                      className="glow-button-outline flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                    >
                      <ArrowRightLeft className="h-3 w-3 text-[#C8A96A]" />
                      <span>Swap</span>
                    </button>
                  </div>

                  {/* Question Body */}
                  <div className="text-xs text-white leading-relaxed space-y-2">
                    {q.assertion && q.reason ? (
                      <div className="space-y-1.5">
                        {q.question && !q.question.includes('Assertion (A)') && (
                          <div><KaTeXRenderer content={q.question} /></div>
                        )}
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                          <strong className="text-[#C8A96A]">Assertion (A): </strong>
                          <KaTeXRenderer content={q.assertion} className="inline" />
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                          <strong className="text-[#C8A96A]">Reason (R): </strong>
                          <KaTeXRenderer content={q.reason} className="inline" />
                        </div>
                      </div>
                    ) : q.statement_1 && q.statement_2 ? (
                      <div className="space-y-1.5">
                        <div className="font-semibold text-slate-300">Given below are two statements:</div>
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                          <strong className="text-[#C8A96A]">Statement I: </strong>
                          <KaTeXRenderer content={q.statement_1} className="inline" />
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                          <strong className="text-[#C8A96A]">Statement II: </strong>
                          <KaTeXRenderer content={q.statement_2} className="inline" />
                        </div>
                      </div>
                    ) : q.match_table && q.match_table.length > 0 ? (
                      <div className="space-y-2">
                        <div><KaTeXRenderer content={q.question || 'Match List-I with List-II:'} /></div>
                        <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/40">
                          <table className="w-full text-left text-[11px]">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-300">
                                <th className="p-2 font-bold">List - I</th>
                                <th className="p-2 font-bold">List - II</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {q.match_table.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  <td className="p-2 text-slate-200"><KaTeXRenderer content={row.col1} className="inline" /></td>
                                  <td className="p-2 text-slate-200"><KaTeXRenderer content={row.col2} className="inline" /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div><KaTeXRenderer content={q.question} /></div>
                    )}

                    {/* Diagram SVG */}
                    {q.diagram_svg && (
                      <div
                        className="my-3 p-3 bg-white rounded-xl flex justify-center items-center overflow-hidden max-h-48"
                        dangerouslySetInnerHTML={{ __html: q.diagram_svg }}
                      />
                    )}

                    {/* Multiple Choice Options */}
                    {q.opt_a && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-[#1A1A1A] p-2.5">
                          <span className="font-extrabold text-[#C8A96A] shrink-0">(A)</span>
                          <span className="text-slate-200"><KaTeXRenderer content={q.opt_a} className="inline" /></span>
                        </div>
                        <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-[#1A1A1A] p-2.5">
                          <span className="font-extrabold text-[#C8A96A] shrink-0">(B)</span>
                          <span className="text-slate-200"><KaTeXRenderer content={q.opt_b || ''} className="inline" /></span>
                        </div>
                        <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-[#1A1A1A] p-2.5">
                          <span className="font-extrabold text-[#C8A96A] shrink-0">(C)</span>
                          <span className="text-slate-200"><KaTeXRenderer content={q.opt_c || ''} className="inline" /></span>
                        </div>
                        <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-[#1A1A1A] p-2.5">
                          <span className="font-extrabold text-[#C8A96A] shrink-0">(D)</span>
                          <span className="text-slate-200"><KaTeXRenderer content={q.opt_d || ''} className="inline" /></span>
                        </div>
                      </div>
                    )}

                    {/* Numerical answer */}
                    {(q.q_type === 'numerical' || q.num_answer) && (
                      <div className="mt-2 p-2.5 rounded-xl border border-white/10 bg-[#1A1A1A] text-[11px] font-semibold text-slate-300">
                        Answer: <span className="font-mono text-[#C8A96A]">[ Numerical Value ]</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* A4 Paper Document Engine (Exact Structure from Sapthagiri PU College) */}
      <div className={`w-full overflow-x-auto py-2 sm:py-4 flex justify-center ${mobileViewMode === 'reader' ? 'hidden md:flex' : 'flex'}`}>
        <div className="a4-engine-wrapper">
          <div
            className="a4-print-document"
            style={{
              transform: effectiveZoom === 1 ? 'none' : `scale(${effectiveZoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
              marginBottom: effectiveZoom < 1 ? `${(effectiveZoom - 1) * 1150}px` : '0px',
              width: '794px',
              maxWidth: '100%',
            }}
          >
            {/* A4 Sheet Page 1: Questions Paper */}
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

              {/* Page Content */}
              <div
                className="a4-page-content"
                style={{
                  fontFamily: alignmentSettings.fontFamily,
                  fontSize: alignmentSettings.fontSize,
                  lineHeight: alignmentSettings.lineHeight,
                }}
              >
                {/* Primary Header (Exact match with Sapthagiri Sm component) */}
                <div
                  className="a4-primary-header-wrap"
                  style={{
                    marginBottom: '14px',
                    borderBottom: '2px solid #000',
                    paddingBottom: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      marginBottom: '8px',
                    }}
                  >
                    {/* Left: Crest Logo */}
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
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
                            borderRadius: '12px',
                            background: '#001f6d',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '22px',
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
                          fontSize: '20px',
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
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          color: '#333',
                          marginTop: '2px',
                        }}
                      >
                        {headerConfig.sub_title}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#000',
                          marginTop: '4px',
                        }}
                      >
                        {paper.title || `${paper.subject} Examination`} • {paper.exam_type}
                      </div>
                    </div>

                    {/* Right: SET Box */}
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
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
                          fontSize: '9px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        SET
                      </span>
                      <span
                        style={{
                          fontSize: '22px',
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
                      fontSize: '11.5px',
                      color: '#111',
                      fontWeight: 700,
                      borderTop: '1px solid #777',
                      paddingTop: '4px',
                      marginTop: '4px',
                    }}
                  >
                    <span>
                      Subject: <strong>{paper.subject.toUpperCase()}</strong>
                    </span>
                    <span>
                      Pattern: <strong>{paper.exam_type} REVISED</strong>
                    </span>
                    <span>
                      Time: <strong>{headerConfig.duration}</strong>
                    </span>
                    <span>
                      Max Marks: <strong>{paper.total_marks}</strong>
                    </span>
                  </div>

                  {/* General Instructions Box */}
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '5px 8px',
                      border: '1px solid #777',
                      borderRadius: '4px',
                      background: '#fafafa',
                      fontSize: '10px',
                      lineHeight: '1.4',
                      color: '#111',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        marginBottom: '2px',
                        fontSize: '9.5px',
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

                {/* Questions Flow in Dual or Single Column (Exact Sapthagiri a4-questions-flow) */}
                <div
                  className={`a4-questions-flow ${alignmentSettings.columns === 1 ? 'single-column' : ''}`}
                  style={{
                    columnCount: alignmentSettings.columns,
                    columnGap: '20px',
                    columnRule: alignmentSettings.columns === 2 ? '1px solid #e0e0e0' : 'none',
                  }}
                >
                  {(currentSections || []).map((sec, sIdx) => {
                    return (
                      <React.Fragment key={sIdx}>
                        {/* Part Header Directive Block (column-span: all) */}
                        <div className="part-header-directive-block">
                          <div
                            style={{
                              fontWeight: 900,
                              fontSize: '12px',
                              textTransform: 'uppercase',
                              color: '#001f6d',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {sec.name} ({sec.attempt_count} Questions • +{sec.marks_per_question}, -{sec.negative_marking})
                          </div>
                          {sec.description && (
                            <div
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                color: '#334155',
                                marginTop: '2px',
                                fontStyle: 'italic',
                              }}
                            >
                              {sec.description}
                            </div>
                          )}
                        </div>

                        {/* Question Items */}
                        {(sec?.questions || []).map((q, qIdx) => {
                          const qNum = getQuestionNumber(sIdx, qIdx);
                          const isCurrentTarget = selectedTargetQuestion?.id === q.id;

                          return (
                            <div
                              key={q.id || qNum}
                              onClick={() => handleQuestionClick(q, qNum - 1)}
                              className={`question-print-item group relative rounded transition-all cursor-pointer ${
                                isCurrentTarget
                                  ? 'bg-[#C8A96A]/10 ring-2 ring-[#C8A96A] p-1'
                                  : 'hover:bg-slate-50 p-0.5'
                              }`}
                              style={{
                                marginBottom: alignmentSettings.questionSpacing,
                              }}
                            >
                              {/* Click to Swap Hover Overlay */}
                              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity no-print z-20">
                                <span className="rounded bg-[#C8A96A] px-1.5 py-0.5 text-[9px] font-bold text-[#0D0D0D] shadow">
                                  Click to Swap
                                </span>
                              </div>

                              {/* Question Row (Exact match with Sapthagiri Wp.row) */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '6px',
                                  fontFamily: 'inherit',
                                  fontSize: 'inherit',
                                  lineHeight: 'inherit',
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    minWidth: '24px',
                                    lineHeight: '1.42',
                                    color: '#000',
                                  }}
                                >
                                  {qNum}.
                                </span>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {/* Question Content based on type */}
                                  {q.assertion && q.reason ? (
                                    <div style={{ color: '#000', wordBreak: 'break-word', fontSize: 'inherit' }}>
                                      {q.question && !q.question.includes('Assertion (A)') && (
                                        <div style={{ marginBottom: '4px' }}>
                                          <KaTeXRenderer content={q.question} />
                                        </div>
                                      )}
                                      <div style={{ marginBottom: '3px', lineHeight: '1.4' }}>
                                        <strong style={{ color: '#000', fontWeight: 800 }}>Assertion (A): </strong>
                                        <KaTeXRenderer content={q.assertion} className="inline" />
                                      </div>
                                      <div style={{ lineHeight: '1.4' }}>
                                        <strong style={{ color: '#000', fontWeight: 800 }}>Reason (R): </strong>
                                        <KaTeXRenderer content={q.reason} className="inline" />
                                      </div>
                                    </div>
                                  ) : q.statement_1 && q.statement_2 ? (
                                    <div style={{ color: '#000', wordBreak: 'break-word', fontSize: 'inherit' }}>
                                      <div style={{ marginBottom: '3px', fontWeight: 600 }}>Given below are two statements:</div>
                                      <div style={{ marginBottom: '3px', lineHeight: '1.4' }}>
                                        <strong style={{ color: '#000', fontWeight: 800 }}>Statement I: </strong>
                                        <KaTeXRenderer content={q.statement_1} className="inline" />
                                      </div>
                                      <div style={{ marginBottom: '3px', lineHeight: '1.4' }}>
                                        <strong style={{ color: '#000', fontWeight: 800 }}>Statement II: </strong>
                                        <KaTeXRenderer content={q.statement_2} className="inline" />
                                      </div>
                                      <div style={{ fontSize: '0.9em', color: '#334155', fontStyle: 'italic', marginTop: '2px' }}>
                                        In light of the above statements, choose the most appropriate answer:
                                      </div>
                                    </div>
                                  ) : q.match_table && q.match_table.length > 0 ? (
                                    <div style={{ color: '#000', wordBreak: 'break-word', fontSize: 'inherit' }}>
                                      <div style={{ marginBottom: '4px' }}>
                                        <KaTeXRenderer content={q.question || 'Match List-I with List-II:'} />
                                      </div>
                                      <div style={{ margin: '4px 0', overflowX: 'auto' }}>
                                        <table
                                          style={{
                                            width: '100%',
                                            maxWidth: '300px',
                                            borderCollapse: 'collapse',
                                            border: '1px solid #334155',
                                            fontSize: '0.92em',
                                          }}
                                        >
                                          <thead>
                                            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #334155' }}>
                                              <th style={{ padding: '2px 6px', textAlign: 'left', fontWeight: 700, borderRight: '1px solid #334155' }}>
                                                List - I
                                              </th>
                                              <th style={{ padding: '2px 6px', textAlign: 'left', fontWeight: 700 }}>
                                                List - II
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {q.match_table.map((row, rIdx) => (
                                              <tr
                                                key={rIdx}
                                                style={{
                                                  borderBottom: rIdx === q.match_table!.length - 1 ? 'none' : '1px solid #cbd5e1',
                                                }}
                                              >
                                                <td style={{ padding: '2px 6px', borderRight: '1px solid #cbd5e1' }}>
                                                  <KaTeXRenderer content={row.col1} className="inline" />
                                                </td>
                                                <td style={{ padding: '2px 6px' }}>
                                                  <KaTeXRenderer content={row.col2} className="inline" />
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ color: '#000', wordBreak: 'break-word' }}>
                                      <KaTeXRenderer content={q.question} />
                                    </div>
                                  )}

                                  {/* Diagrammatic SVG Renderer */}
                                  {q.diagram_svg && (
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        margin: '6px 0',
                                        maxHeight: alignmentSettings.diagramMaxHeight || '160px',
                                        overflow: 'hidden',
                                      }}
                                      dangerouslySetInnerHTML={{ __html: q.diagram_svg }}
                                    />
                                  )}

                                  {/* Multiple Choice Options Grid (Smart 1-col for long options / AR / Statements, 2-col for short) */}
                                  {q.opt_a && (() => {
                                    const isLongOptionList = !!(q.assertion || q.reason || q.statement_1 || q.statement_2) ||
                                      Math.max(
                                        (q.opt_a || '').length,
                                        (q.opt_b || '').length,
                                        (q.opt_c || '').length,
                                        (q.opt_d || '').length
                                      ) > 28;

                                    return (
                                      <div
                                        style={{
                                          display: 'grid',
                                          gridTemplateColumns: isLongOptionList ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                                          gap: isLongOptionList ? '2px 0' : '3px 8px',
                                          marginTop: '4px',
                                          fontSize: '0.94em',
                                        }}
                                      >
                                        <div>
                                          <strong style={{ color: '#001f6d', fontWeight: 800 }}>(A)</strong>{' '}
                                          <KaTeXRenderer content={q.opt_a} className="inline" />
                                        </div>
                                        <div>
                                          <strong style={{ color: '#001f6d', fontWeight: 800 }}>(B)</strong>{' '}
                                          <KaTeXRenderer content={q.opt_b || ''} className="inline" />
                                        </div>
                                        <div>
                                          <strong style={{ color: '#001f6d', fontWeight: 800 }}>(C)</strong>{' '}
                                          <KaTeXRenderer content={q.opt_c || ''} className="inline" />
                                        </div>
                                        <div>
                                          <strong style={{ color: '#001f6d', fontWeight: 800 }}>(D)</strong>{' '}
                                          <KaTeXRenderer content={q.opt_d || ''} className="inline" />
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Numerical / Integer Prompt */}
                                  {(q.q_type === 'numerical' || q.num_answer) && (
                                    <div
                                      style={{
                                        marginTop: '5px',
                                        fontSize: '0.92em',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                      }}
                                    >
                                      <span style={{ border: '1px solid #94a3b8', padding: '2px 8px', borderRadius: '3px', backgroundColor: '#f8fafc' }}>
                                        Answer: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
                                      </span>
                                      <span style={{ marginLeft: '6px', fontSize: '0.85em', color: '#64748b', fontWeight: 400 }}>
                                        (Numerical Value)
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {alignmentSettings.showMarks && (
                                  <span
                                    style={{
                                      fontSize: '0.85em',
                                      fontWeight: 800,
                                      color: '#64748b',
                                      whiteSpace: 'nowrap',
                                      marginLeft: '4px',
                                    }}
                                  >
                                    [{sec.marks_per_question}M]
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* End of Paper Marker */}
                <div className="a4-end-paper-marker">
                  *** End of {paper.title || 'Question Paper'} ***
                </div>
              </div>
            </div>

            {/* Scheme of Valuation & Answer Key Page (Page Break) */}
            {showAnswerKey && (
              <div
                className="a4-sheet-page a4-scheme-page"
                style={{
                  position: 'relative',
                  breakBefore: 'page',
                  pageBreakBefore: 'always',
                  marginTop: '28px',
                }}
              >
                <div className="a4-page-content" style={{ padding: '12mm' }}>
                  <div
                    style={{
                      textAlign: 'center',
                      borderBottom: '2px solid #000',
                      paddingBottom: '8px',
                      marginBottom: '14px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '17px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: '#000',
                      }}
                    >
                      {headerConfig.institution_name}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#001f6d',
                        marginTop: '2px',
                      }}
                    >
                      SCHEME OF VALUATION & ANSWER KEY
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#333',
                        marginTop: '2px',
                      }}
                    >
                      {paper.title || 'EXAMINATION'} • Subject: {paper.subject} • Max Marks: {paper.total_marks} • Series {activeSet}
                    </div>
                  </div>

                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '11px',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #000' }}>
                        <th
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            width: '50px',
                            textAlign: 'center',
                            fontWeight: 800,
                          }}
                        >
                          Q.No
                        </th>
                        <th
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            width: '90px',
                            textAlign: 'center',
                            fontWeight: 800,
                          }}
                        >
                          Part / Key
                        </th>
                        <th
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            textAlign: 'left',
                            fontWeight: 800,
                          }}
                        >
                          Valuation Criteria / Steps / Key Solution
                        </th>
                        <th
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            width: '60px',
                            textAlign: 'center',
                            fontWeight: 800,
                          }}
                        >
                          Marks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAnswerKey.map((ak) => (
                        <tr key={ak.q_no} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #cbd5e1',
                              textAlign: 'center',
                              fontWeight: 700,
                            }}
                          >
                            {ak.q_no}
                          </td>
                          <td
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #cbd5e1',
                              textAlign: 'center',
                              fontWeight: 800,
                              color: '#001f6d',
                            }}
                          >
                            {ak.answer}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>
                            Correct Option / Standard step marks ({ak.answer})
                          </td>
                          <td
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #cbd5e1',
                              textAlign: 'center',
                              fontWeight: 800,
                            }}
                          >
                            4M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 border-t border-white/10 no-print">
        <div className="flex items-center gap-2">
          {onNavigateStep && (
            <>
              <button
                type="button"
                onClick={() => onNavigateStep(2)}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 sm:px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-[#222222] transition-all cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Method (Step 2)</span>
                <span className="sm:hidden">Step 2</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateStep(3)}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 sm:px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-[#222222] transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="hidden sm:inline">✏️ Matrix (Step 3)</span>
                <span className="sm:hidden">✏️ Step 3</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAlignmentPanel(!showAlignmentPanel)}
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-[#C8A96A]/30 bg-[#C8A96A]/10 px-3 sm:px-4 py-2 text-xs font-bold text-[#C8A96A] hover:bg-[#C8A96A]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>⚙️ <span className="hidden sm:inline">Alignment</span></span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="glow-button flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 text-xs font-black text-[#0D0D0D] shadow-lg transition-all cursor-pointer whitespace-nowrap"
          >
            <span>✓ <span className="hidden sm:inline">Finalize & </span>Download PDF</span>
          </button>
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
