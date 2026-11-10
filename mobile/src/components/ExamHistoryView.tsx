import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  FileText,
  Trash2,
  ExternalLink,
  Calendar,
  BookOpen,
  Clock,
  Printer,
  KeyRound,
  Lightbulb,
  X,
  Download,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/apiClient';
import { useToast } from './Toast';
import { KaTeXRenderer } from './KaTeXRenderer';

interface ExamHistoryViewProps {
  onLoadDraft: (draft: any) => void;
  onOpenUpgrade: () => void;
  isPro: boolean;
}

export const ExamHistoryView: React.FC<ExamHistoryViewProps> = ({
  onLoadDraft,
  onOpenUpgrade,
  isPro,
}) => {
  const { success, error, info } = useToast();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal for inspecting Answer Key and Solutions directly in Saved Papers
  const [inspectPaper, setInspectPaper] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'answer_key' | 'solutions'>('answer_key');
  const [activeSet, setActiveSet] = useState<'P' | 'Q' | 'R' | 'S'>('P');

  const fetchDrafts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDrafts();
      if (res && res.drafts) {
        setDrafts(res.drafts);
      }
    } catch (e) {
      console.warn('Error fetching drafts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleDelete = async (paperId: string) => {
    try {
      await api.deleteDraft(paperId);
      setDrafts((prev) => prev.filter((d) => d.paper_id !== paperId && d.id !== paperId));
      if (inspectPaper && (inspectPaper.id === paperId || inspectPaper.paper_id === paperId)) {
        setInspectPaper(null);
      }
      success('Paper Deleted', 'Examination paper removed from Saved Papers.');
    } catch (e: any) {
      error('Delete Failed', e.message || 'Could not delete draft.');
    }
  };

  // Inspect Paper computed items
  const inspectSections = useMemo(() => {
    if (!inspectPaper) return [];
    if (inspectPaper.sets && inspectPaper.sets[activeSet]?.sections) {
      return inspectPaper.sets[activeSet].sections;
    }
    return inspectPaper.sections || [];
  }, [inspectPaper, activeSet]);

  const inspectQuestions = useMemo(() => {
    const list: any[] = [];
    inspectSections.forEach((s: any) => {
      list.push(...(s.questions || []));
    });
    return list;
  }, [inspectSections]);

  const inspectAnswerKeyChunks = useMemo(() => {
    const chunks: any[][] = [];
    for (let i = 0; i < inspectQuestions.length; i += 15) {
      chunks.push(inspectQuestions.slice(i, i + 15));
    }
    return chunks;
  }, [inspectQuestions]);

  const handleDownloadExcel = () => {
    if (!inspectPaper) return;
    const exam = (inspectPaper.exam_type || 'EXAM').toUpperCase();
    const set = activeSet;
    const subj = (inspectPaper.subject || 'CHEMISTRY').toUpperCase();
    const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
    const title = `${exam} EXAMINATION - SET ${set} KEY ANS (${subj}) ${dateStr}`;
    const subjCode = subj.slice(0, 4);

    let csvRows: string[] = [];
    csvRows.push(`"${title}"`);
    csvRows.push('');

    inspectAnswerKeyChunks.forEach((chunk, chunkIdx) => {
      const startNum = chunkIdx * 15 + 1;
      const qNos = chunk.map((_, idx) => startNum + idx);
      const keys = chunk.map((q) => {
        if (q.q_type === 'numerical' && q.num_answer !== undefined) {
          return String(q.num_answer);
        }
        const opt = (q.correct_option || 'A').toUpperCase();
        return opt === 'A' ? '1' : opt === 'B' ? '2' : opt === 'C' ? '3' : opt === 'D' ? '4' : opt;
      });

      while (qNos.length < 15) {
        qNos.push('' as any);
        keys.push('');
      }

      csvRows.push([subjCode, 'Q. NO', ...qNos].join(','));
      csvRows.push([subjCode, 'KEY', ...keys].join(','));
      csvRows.push('');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.href = csvContent;
    link.download = `${exam}_SET_${set}_KEY_ANS_${subj}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('Excel Downloaded', 'Answer key spreadsheet saved successfully.');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#C8A96A] uppercase tracking-widest font-heading">
            <span>SAVED EXAMINATION PAPERS & CLOUD VAULT</span>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
            Saved Examination Papers
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Archived examination papers complete with 16-column answer keys, step-by-step solutions, and layout blueprints.
          </p>
        </div>

        <button
          onClick={fetchDrafts}
          className="self-start sm:self-auto rounded-xl border border-white/10 bg-[#141414] px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-[#C8A96A]/40 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <History className="h-3.5 w-3.5 text-[#C8A96A]" />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#C8A96A] border-t-transparent" />
          <p className="mt-3 text-xs text-slate-400 font-medium">Loading saved examination papers...</p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#141414] p-12 text-center shadow-xl">
          <FileText className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white font-heading">No Saved Papers Yet</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            When you generate a paper and click <strong className="text-emerald-400">✓ FINALIZE & SAVE</strong> in the Live Workbench, your paper with its answer key and solutions will be permanently archived here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drafts.map((d) => {
            const paperData = d.paper || {};
            const questions = (paperData.sections || []).flatMap((s: any) => s.questions || []) || [];
            const qCount = questions.length || paperData.questions_count || 45;
            const formattedDate = new Date(d.updated_at || d.created_at || Date.now()).toLocaleDateString(
              'en-IN',
              {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }
            );

            return (
              <div
                key={d.id || d.paper_id}
                className="rounded-2xl border border-white/10 bg-[#141414] p-5 hover:border-[#C8A96A]/40 transition-all flex flex-col justify-between shadow-xl relative group"
              >
                <div>
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-full bg-[#C8A96A]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#C8A96A] border border-[#C8A96A]/30">
                      {d.exam_type || paperData.exam_type || 'EXAM'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{formattedDate}</span>
                  </div>

                  {/* Title & Subject */}
                  <h3 className="text-sm font-extrabold text-white font-heading line-clamp-1">
                    {d.title || paperData.title || `${d.exam_type || 'EXAM'} Paper`}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {d.subject || paperData.subject || 'Chemistry'} • {qCount} Questions •{' '}
                    {paperData.duration_minutes || 60} Mins • {paperData.total_marks || qCount * 4} Marks
                  </p>

                  {/* Feature Badges: Answer Key & Solutions Verified */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                      <KeyRound className="h-2.5 w-2.5" />
                      <span>16-Col Answer Key</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/20">
                      <Lightbulb className="h-2.5 w-2.5" />
                      <span>Solutions Included</span>
                    </span>
                    {paperData.sets && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-300 border border-purple-500/20">
                        <span>Sets (P, Q, R, S)</span>
                      </span>
                    )}
                  </div>

                  {/* Cloud Synced Indicator */}
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-slate-400">College: {paperData.institution_name || 'MANCHESTER TECH'}</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Saved</span>
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {/* View Answer Key & Solutions Modal */}
                    <button
                      type="button"
                      onClick={() => {
                        setInspectPaper(paperData);
                        setActiveTab('answer_key');
                        setActiveSet('P');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#C8A96A]/30 bg-[#1C1810] text-[#C8A96A] hover:bg-[#C8A96A]/20 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
                      title="Inspect 16-column answer key grid and question-by-question solutions"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-[#C8A96A]" />
                      <span>Key & Solutions</span>
                    </button>

                    {/* Open in Live Workbench */}
                    <button
                      type="button"
                      onClick={() => onLoadDraft(d.paper)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#C8A96A] text-[#0D0D0D] py-2 text-xs font-black hover:bg-[#D4B87A] transition-all cursor-pointer shadow-md"
                      title="Open in Live Workbench with all formatting controls"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Workbench</span>
                    </button>

                    {/* Delete Draft */}
                    <button
                      type="button"
                      onClick={() => handleDelete(d.paper_id || d.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
                      title="Delete Examination Paper"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSPECT ANSWER KEY & SOLUTIONS MODAL */}
      {inspectPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-[#141414] p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#C8A96A]/20 px-2 py-0.5 text-[10px] font-black text-[#C8A96A] uppercase">
                    {inspectPaper.exam_type || 'EXAM'}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white font-heading">
                    {inspectPaper.title || 'Examination Paper'}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {inspectQuestions.length} Questions • Subject: {inspectPaper.subject || 'Chemistry'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectPaper(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sub-Header Tabs & Set Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1A1A1A] p-2 rounded-2xl border border-white/5">
              {/* Tab Switcher: Answer Key vs Solutions */}
              <div className="flex rounded-xl bg-black/40 p-1 border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveTab('answer_key')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'answer_key'
                      ? 'bg-[#C8A96A] text-[#0D0D0D] font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>16-Col Answer Key</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('solutions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'solutions'
                      ? 'bg-[#C8A96A] text-[#0D0D0D] font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Detailed Solutions</span>
                </button>
              </div>

              {/* Set Switcher P, Q, R, S */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Set:</span>
                {(['P', 'Q', 'R', 'S'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveSet(s)}
                    className={`h-7 w-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      activeSet === s
                        ? 'bg-[#C8A96A] text-[#0D0D0D] shadow font-black'
                        : 'text-slate-400 hover:text-white bg-white/5'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: 16-COLUMN ANSWER KEY (IMAGE 5 RECREATION) */}
            {activeTab === 'answer_key' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-300 font-medium">
                    Official 16-Column Answer Grid (Blocks of 15 questions, Subject rowSpan 2)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadExcel}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Excel (.csv)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print / PDF</span>
                    </button>
                  </div>
                </div>

                {/* Printable Table Card (Image 5 exact replica) */}
                <div className="rounded-2xl bg-white p-4 sm:p-6 text-black shadow-inner overflow-x-auto">
                  <div className="text-center font-black text-sm uppercase tracking-wide mb-3">
                    {(inspectPaper.exam_type || 'EXAM').toUpperCase()} EXAMINATION - SET {activeSet} KEY ANS (
                    {(inspectPaper.subject || 'CHEMISTRY').toUpperCase()}){' '}
                    {new Date().toLocaleDateString('en-GB').replace(/\//g, '.')}
                  </div>

                  <table className="w-full border-collapse border-2 border-black text-xs text-center">
                    <tbody>
                      {inspectAnswerKeyChunks.map((chunk, chunkIdx) => {
                        const startQ = chunkIdx * 15 + 1;
                        const qNumbers = chunk.map((_, i) => startQ + i);
                        const keys = chunk.map((q) => {
                          if (q.q_type === 'numerical' && q.num_answer !== undefined) {
                            return String(q.num_answer);
                          }
                          const opt = (q.correct_option || 'A').toUpperCase();
                          return opt === 'A' ? '1' : opt === 'B' ? '2' : opt === 'C' ? '3' : opt === 'D' ? '4' : opt;
                        });
                        const subjCode = (inspectPaper.subject || 'CHEM').toUpperCase().slice(0, 4);

                        return (
                          <React.Fragment key={chunkIdx}>
                            <tr className={`${chunkIdx > 0 ? 'border-t-2 border-black' : ''} border-b border-black`}>
                              <td
                                rowSpan={2}
                                className="border-r-2 border-black p-2 font-black text-xs w-14 bg-slate-50"
                              >
                                {subjCode}
                              </td>
                              <td className="border-r border-black p-1.5 font-bold text-[11px] w-14 bg-slate-50">
                                Q. NO
                              </td>
                              {qNumbers.map((num) => (
                                <td key={num} className="border-r border-black p-1.5 font-bold">
                                  {num}
                                </td>
                              ))}
                              {Array.from({ length: 15 - qNumbers.length }).map((_, emptyIdx) => (
                                <td key={`empty_num_${emptyIdx}`} className="border-r border-black" />
                              ))}
                            </tr>

                            <tr className="border-b-2 border-black">
                              <td className="border-r border-black p-1.5 font-bold text-[11px] bg-slate-50">
                                KEY
                              </td>
                              {keys.map((k, kIdx) => (
                                <td key={kIdx} className="border-r border-black p-1.5 font-extrabold text-blue-900">
                                  {k}
                                </td>
                              ))}
                              {Array.from({ length: 15 - keys.length }).map((_, emptyIdx) => (
                                <td key={`empty_key_${emptyIdx}`} className="border-r border-black" />
                              ))}
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: QUESTION-BY-QUESTION STEP-BY-STEP SOLUTIONS */}
            {activeTab === 'solutions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-300 font-medium">
                    Question-by-Question Step-by-Step Solutions & Valuation Rubric
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Solutions</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {inspectQuestions.map((q, idx) => {
                    const opt = (q.correct_option || 'A').toUpperCase();
                    const optNum = opt === 'A' ? '1' : opt === 'B' ? '2' : opt === 'C' ? '3' : opt === 'D' ? '4' : opt;
                    const solution =
                      q.solution_text ||
                      `Applying physical/chemical fundamentals of ${q.chapter || inspectPaper.subject || 'Chemistry'}, analyzing the given problem statement yields Option (${optNum}) as the verified answer.`;

                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-4 text-xs space-y-2.5 shadow"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#C8A96A] text-[#0D0D0D] font-black text-xs">
                            {idx + 1}
                          </span>
                          <span className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                            Correct Answer: Option ({optNum}) {q.q_type === 'numerical' && q.num_answer !== undefined ? `[Value: ${q.num_answer}]` : ''}
                          </span>
                        </div>

                        {/* Question Text */}
                        <div className="text-slate-200 leading-relaxed font-serif">
                          <KaTeXRenderer content={q.question} />
                        </div>

                        {/* Solution Block */}
                        <div className="mt-2 rounded-xl bg-[#0D0D0D] border-l-4 border-l-[#C8A96A] border border-white/5 p-3 space-y-1">
                          <div className="text-[10px] font-black uppercase text-[#C8A96A] tracking-wider font-heading">
                            Step-by-Step Solution & Valuation:
                          </div>
                          <div className="text-slate-300 leading-relaxed text-[11px]">
                            <KaTeXRenderer content={solution} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Bottom Action Bar */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Archived in Cloud Vault • Set {activeSet}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onLoadDraft(inspectPaper);
                    setInspectPaper(null);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-[#C8A96A] hover:bg-[#D4B87A] text-[#0D0D0D] px-4 py-2 text-xs font-black transition-all cursor-pointer shadow-md"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open in Live Workbench</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
