import React, { useState, useEffect } from 'react';
import { History, FileText, Trash2, ExternalLink, Calendar, BookOpen, Clock, Printer } from 'lucide-react';
import { api } from '../services/apiClient';
import { useToast } from './Toast';

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
      success('Draft Removed', 'Examination draft deleted from cloud vault.');
    } catch (e: any) {
      error('Delete Failed', e.message || 'Could not delete draft.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
          <span>EXAM HISTORY & CLOUD VAULT</span>
        </div>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Saved Examination Papers & Drafts
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">
          Cross-device auto-synced examination blueprints, question configurations, and drafts.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Loading cloud vault drafts...
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#11141E] p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">No Saved Papers Yet</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Generate your first examination paper or save drafts from the live workbench to access them here across devices.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drafts.map((d) => {
            const paperData = d.paper || {};
            const qCount = paperData.questions_count || paperData.all_questions?.length || 0;
            const formattedDate = new Date(d.updated_at || d.created_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={d.id}
                className="rounded-2xl border border-white/10 bg-[#11141E] p-5 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-300 border border-purple-500/20">
                      {d.exam_type || 'EXAM'}
                    </span>
                    <span className="text-[11px] text-slate-300 font-medium">{formattedDate}</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-white line-clamp-1">{d.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {d.subject} • {qCount} Questions • {paperData.duration_minutes || 60} Mins
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Swaps Used: {d.swaps_used || 0}/50</span>
                    <span className="text-emerald-400 font-semibold">Synced in Cloud</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onLoadDraft(d.paper)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 py-2 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in Workbench</span>
                  </button>

                  <button
                    onClick={() => handleDelete(d.paper_id || d.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
                    title="Delete Draft"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
