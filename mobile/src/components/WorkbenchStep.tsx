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
          docContent += `
            <div class="question-item">
              <div><strong>Q.${qCount++}.</strong> ${q.question.replace(/\$/g, '')}</div>
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
                q.q_type === 'numerical'
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

  let globalQuestionCounter = 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-300">
      {/* Top Workbench Toolbar (Responsive & Touch-Friendly) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#11141E] p-4 no-print shadow-xl">
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
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/50'
                    : 'bg-[#161A26] text-slate-300 hover:text-white hover:bg-[#1F2433] border border-white/5'
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
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161A26] px-3 py-1.5 text-xs font-semibold text-slate-300 whitespace-nowrap">
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
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161A26] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-white/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Building2 className="h-3.5 w-3.5 text-purple-400" />
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
                ? 'bg-purple-600/25 border-purple-500 text-purple-300'
                : 'border-white/10 bg-[#161A26] text-slate-300 hover:text-white'
            }`}
          >
            <Settings2 className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Alignment Controls</span>
          </button>

          {/* Answer Key Toggle */}
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              showAnswerKey
                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                : 'border-white/10 bg-[#161A26] text-slate-300 hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Answer Key</span>
          </button>

          {/* Zoom Controls (Fit / 75% / 100%) */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#161A26] px-2 py-1">
            <button
              onClick={() => {
                setZoomMode('fit');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                zoomMode === 'fit' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
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
                zoomMode === 'custom' && zoomScale === 75 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
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
                zoomMode === 'custom' && zoomScale === 100 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              100%
            </button>
          </div>

          {/* Download Word (.docx) */}
          <button
            onClick={handleDownloadWord}
            disabled={isExportingWord}
            className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-600/20 px-3 py-1.5 text-xs font-bold text-blue-200 hover:bg-blue-600 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            title="Download editable Microsoft Word document (.doc)"
          >
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden md:inline">{isExportingWord ? 'Exporting...' : 'Word'}</span>
          </button>

          {/* Print / Download PDF */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 text-xs font-black text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer whitespace-nowrap"
            title="Download PDF or Print"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Step 5 Alignment & Layout Controls Panel (Copied from Sapthagiri xm component) */}
      {showAlignmentPanel && (
        <div className="rounded-2xl border border-white/10 bg-[#11141E] p-5 shadow-xl animate-in fade-in duration-200 no-print space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">⚙️</span>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
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
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
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
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
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
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
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
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
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
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
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
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="1.35">Compact (1.35)</option>
                <option value="1.45">Standard (1.45)</option>
                <option value="1.6">Relaxed (1.6)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* A4 Paper Document Engine (Exact Structure from Sapthagiri PU College) */}
      <div className="w-full overflow-x-auto py-4 flex justify-center">
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
                        {(sec?.questions || []).map((q) => {
                          const qNum = globalQuestionCounter++;
                          const isCurrentTarget = selectedTargetQuestion?.id === q.id;

                          return (
                            <div
                              key={q.id || qNum}
                              onClick={() => handleQuestionClick(q, qNum - 1)}
                              className={`question-print-item group relative rounded transition-all cursor-pointer ${
                                isCurrentTarget
                                  ? 'bg-purple-50 ring-2 ring-purple-500 p-1'
                                  : 'hover:bg-slate-50 p-0.5'
                              }`}
                              style={{
                                marginBottom: alignmentSettings.questionSpacing,
                              }}
                            >
                              {/* Click to Swap Hover Overlay */}
                              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity no-print z-20">
                                <span className="rounded bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
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
                                  <div style={{ color: '#000', wordBreak: 'break-word' }}>
                                    <KaTeXRenderer content={q.question} />
                                  </div>

                                  {/* Multiple Choice Options Grid (2x2) */}
                                  {q.opt_a && (
                                    <div
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                        gap: '3px 8px',
                                        marginTop: '4px',
                                        fontSize: '0.94em',
                                      }}
                                    >
                                      <div>
                                        <strong style={{ color: '#001f6d', fontWeight: 800 }}>
                                          (A)
                                        </strong>{' '}
                                        <KaTeXRenderer content={q.opt_a} className="inline" />
                                      </div>
                                      <div>
                                        <strong style={{ color: '#001f6d', fontWeight: 800 }}>
                                          (B)
                                        </strong>{' '}
                                        <KaTeXRenderer
                                          content={q.opt_b || ''}
                                          className="inline"
                                        />
                                      </div>
                                      <div>
                                        <strong style={{ color: '#001f6d', fontWeight: 800 }}>
                                          (C)
                                        </strong>{' '}
                                        <KaTeXRenderer
                                          content={q.opt_c || ''}
                                          className="inline"
                                        />
                                      </div>
                                      <div>
                                        <strong style={{ color: '#001f6d', fontWeight: 800 }}>
                                          (D)
                                        </strong>{' '}
                                        <KaTeXRenderer
                                          content={q.opt_d || ''}
                                          className="inline"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Numerical / Integer Prompt */}
                                  {q.q_type === 'numerical' && (
                                    <div
                                      style={{
                                        marginTop: '4px',
                                        fontSize: '0.92em',
                                        fontWeight: 600,
                                        color: '#334155',
                                        fontStyle: 'italic',
                                      }}
                                    >
                                      Answer: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] (Round off to nearest integer)
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
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 no-print">
        <div className="flex items-center gap-2">
          {onNavigateStep && (
            <>
              <button
                type="button"
                onClick={() => onNavigateStep(2)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161A26] px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-[#1F2433] transition-all cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Method (Step 2)</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateStep(3)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161A26] px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-[#1F2433] transition-all cursor-pointer"
              >
                <span>✏️ Matrix (Step 3)</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAlignmentPanel(!showAlignmentPanel)}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-600/20 px-4 py-2 text-xs font-bold text-purple-200 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
          >
            <span>⚙️ Alignment Controls</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2 text-xs font-black text-white shadow-lg transition-all cursor-pointer"
          >
            <span>✓ Finalize & Download PDF</span>
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
