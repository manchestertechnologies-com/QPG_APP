import React, { useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle2, XCircle, MinusCircle, Trophy, Info } from 'lucide-react';
import { KaTeXRenderer } from '../KaTeXRenderer';
import { formatDateTime, studentApi } from '../../services/classroomApi';
import { Spinner, StatTile, secondaryButton } from '../classroom/ui';
import { OPTION_KEYS, QuestionStem } from './QuestionContent';

interface Props {
  examId: string;
  onBack: () => void;
}

type Filter = 'all' | 'correct' | 'incorrect' | 'unanswered';

export const ResultView: React.FC<Props> = ({ examId, onBack }) => {
  const [data, setData] = useState<any | null>(null);
  const [errorText, setErrorText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    studentApi
      .result(examId)
      .then(setData)
      .catch((err) => setErrorText(err.message));
  }, [examId]);

  const back = (
    <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer">
      <ChevronLeft className="h-4 w-4" /> Back to my exams
    </button>
  );

  if (errorText) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        {back}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 text-xs text-rose-200">{errorText}</div>
      </div>
    );
  }
  if (!data) return <Spinner label="Loading result..." />;

  if (!data.visible) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        {back}
        <div className="rounded-2xl border border-white/10 bg-[#141414] p-8 text-center">
          <Info className="mx-auto h-7 w-7 text-[#C8A96A]" />
          <div className="mt-3 text-sm font-bold text-white">{data.exam?.title}</div>
          <p className="mt-1 text-xs text-slate-400">{data.message}</p>
          {data.availableAt && <p className="mt-1 text-[11px] text-slate-500">Available from {formatDateTime(data.availableAt)}</p>}
        </div>
      </div>
    );
  }

  const r = data.result;
  const review: any[] = data.review || [];
  const shown = review.filter((q) => filter === 'all' || q.status === filter || (filter === 'unanswered' && q.status === 'not_evaluated'));

  return (
    <div className="mx-auto max-w-3xl p-4">
      {back}
      <div className="rounded-2xl border border-[#C8A96A]/25 bg-gradient-to-br from-[#C8A96A]/10 to-transparent p-5">
        <div className="text-[11px] text-slate-400">{data.exam.classroomName || 'Result'}</div>
        <h1 className="text-lg font-bold text-white font-heading">{data.exam.title}</h1>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-4xl font-black text-[#C8A96A] font-heading tabular-nums">{r.score}</span>
          <span className="pb-1 text-sm text-slate-400">/ {r.maxScore}</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[#C8A96A]/30 px-2.5 py-1 text-[11px] font-bold text-[#C8A96A]">
            <Trophy className="h-3.5 w-3.5" /> Rank {r.rank} of {r.totalSubmitted}
          </span>
        </div>
        {r.status === 'auto_submitted' && <div className="mt-2 text-[11px] text-amber-300/90">Submitted automatically when time ran out.</div>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Correct" value={r.correct} tone="green" />
        <StatTile label="Incorrect" value={r.incorrect} tone="red" />
        <StatTile label="Unanswered" value={r.unanswered} />
        <StatTile label="Accuracy" value={`${r.accuracy}%`} tone="gold" />
      </div>

      {r.sections.length > 1 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/5">
          {r.sections.map((s: any) => (
            <div key={s.name} className="flex items-center justify-between border-b border-white/5 bg-[#141414] px-3.5 py-2 text-xs last:border-0">
              <span className="text-slate-300">{s.name}</span>
              <span className="tabular-nums text-slate-400">
                <strong className="text-white">{s.score}</strong>/{s.max} • <span className="text-emerald-300">{s.correct}</span> /{' '}
                <span className="text-rose-300">{s.incorrect}</span> / {s.unanswered}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 mb-3 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-sm font-bold text-white">Answer review</h2>
        {(['all', 'correct', 'incorrect', 'unanswered'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize cursor-pointer ${
              filter === f ? 'border-[#C8A96A] bg-[#C8A96A]/10 text-[#C8A96A]' : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map((item) => {
          const q = item.question || {};
          const tone =
            item.status === 'correct' ? 'border-emerald-500/25' : item.status === 'incorrect' ? 'border-rose-500/25' : 'border-white/5';
          return (
            <div key={item.id} className={`rounded-2xl border bg-[#141414] p-4 ${tone}`}>
              <div className="mb-2 flex items-center gap-2 text-[11px]">
                <span className="font-bold text-[#C8A96A]">Q{item.number}</span>
                <span className="text-slate-500">{item.section}</span>
                <span className="ml-auto inline-flex items-center gap-1 font-semibold">
                  {item.status === 'correct' && <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-300">+{item.marks}</span></>}
                  {item.status === 'incorrect' && <><XCircle className="h-3.5 w-3.5 text-rose-400" /><span className="text-rose-300">{item.marks}</span></>}
                  {item.status === 'unanswered' && <><MinusCircle className="h-3.5 w-3.5 text-slate-500" /><span className="text-slate-400">Not answered</span></>}
                  {item.status === 'not_evaluated' && <span className="text-amber-300/80">Not evaluated (over attempt limit)</span>}
                </span>
              </div>
              <QuestionStem q={q} />
              {q.kind === 'mcq' ? (
                <div className="mt-3 space-y-1.5">
                  {OPTION_KEYS.filter(({ field }) => q[field]).map(({ letter, field }) => {
                    const isCorrect = (item.correct || '').split('/').includes(letter);
                    const isGiven = item.given === letter;
                    return (
                      <div
                        key={letter}
                        className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-[13px] ${
                          isCorrect ? 'border-emerald-500/40 bg-emerald-500/10' : isGiven ? 'border-rose-500/40 bg-rose-500/10' : 'border-white/5'
                        }`}
                      >
                        <span className="font-bold text-slate-400">{letter}.</span>
                        <KaTeXRenderer content={q[field]} />
                        {isGiven && <span className="ml-auto shrink-0 text-[10px] font-semibold text-slate-400">your answer</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-300">
                  Your answer: <span className="font-mono text-white">{item.given ?? '—'}</span> • Correct:{' '}
                  <span className="font-mono text-emerald-300">{item.correct ?? '—'}</span>
                </div>
              )}
              {item.solution && (
                <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[12px] text-slate-300">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#C8A96A]">Solution</div>
                  <KaTeXRenderer content={item.solution} />
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && <div className="py-6 text-center text-xs text-slate-500">Nothing to show for this filter.</div>}
      </div>

      <div className="mt-6">
        <button type="button" className={secondaryButton} onClick={onBack}>
          <ChevronLeft className="h-3.5 w-3.5" /> Back to my exams
        </button>
      </div>
    </div>
  );
};
