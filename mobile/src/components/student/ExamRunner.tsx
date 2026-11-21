import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Flag, Send, Timer, Loader2, CloudOff, Check, Eraser } from 'lucide-react';
import { KaTeXRenderer } from '../KaTeXRenderer';
import { useToast } from '../Toast';
import { AnswerEntry, ExamSession, formatDuration, studentApi } from '../../services/classroomApi';
import { Modal, primaryButton, secondaryButton } from '../classroom/ui';
import { OPTION_KEYS, QuestionStem } from './QuestionContent';

interface Props {
  examId: string;
  onExit: () => void;
  onSubmitted: (examId: string, resultVisible: boolean, message: string) => void;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'offline';

const backupKey = (attemptId: string) => `qpg_exam_backup_${attemptId}`;

function isAnswered(a?: AnswerEntry) {
  return !!(a && (a.option || (a.value && a.value.trim())));
}

export const ExamRunner: React.FC<Props> = ({ examId, onExit, onSubmitted }) => {
  const { error, warning } = useToast();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loadError, setLoadError] = useState('');
  const [answers, setAnswers] = useState<Record<string, AnswerEntry>>({});
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const clockOffset = useRef(0);
  const dirty = useRef(false);
  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  answersRef.current = answers;

  // ---------------------------------------------------------------- load
  useEffect(() => {
    let cancelled = false;
    studentApi
      .start(examId)
      .then((s) => {
        if (cancelled) return;
        clockOffset.current = new Date(s.serverNow).getTime() - Date.now();
        let restored = s.attempt.answers || {};
        // Prefer a newer local backup (e.g. the last autosave failed before a reload).
        try {
          const raw = localStorage.getItem(backupKey(s.attempt.id));
          if (raw) {
            const backup = JSON.parse(raw);
            if (backup && typeof backup === 'object') {
              restored = { ...restored, ...backup };
              dirty.current = true;
            }
          }
        } catch {
          /* storage unavailable */
        }
        setSession(s);
        setAnswers(restored);
        if (s.questions[0]) setVisited(new Set([s.questions[0].id]));
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Could not start the exam.'));
    return () => {
      cancelled = true;
    };
  }, [examId]);

  const questions = session?.questions || [];
  const current = questions[index];
  const sectionOf = useMemo(() => {
    const map = new Map<string, number>();
    session?.sections.forEach((s, i) => s.questionIds.forEach((id) => map.set(id, i)));
    return map;
  }, [session]);

  // ---------------------------------------------------------------- saving
  const save = useCallback(async () => {
    if (!session || !dirty.current || submittedRef.current) return;
    dirty.current = false;
    setSaveState('saving');
    try {
      await studentApi.save(examId, answersRef.current);
      setSaveState('saved');
      try {
        localStorage.removeItem(backupKey(session.attempt.id));
      } catch {}
    } catch (err: any) {
      if (err.code === 'TIME_UP' || err.code === 'NOT_IN_PROGRESS') return;
      dirty.current = true;
      setSaveState('offline');
    }
  }, [examId, session]);

  const updateAnswer = (id: string, patch: Partial<AnswerEntry> | null) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (patch === null) delete next[id];
      else {
        const merged = { ...(prev[id] || {}), ...patch };
        if (!merged.option) delete merged.option;
        if (!merged.value) delete merged.value;
        if (!merged.marked) delete merged.marked;
        if (Object.keys(merged).length) next[id] = merged;
        else delete next[id];
      }
      try {
        if (session) localStorage.setItem(backupKey(session.attempt.id), JSON.stringify(next));
      } catch {}
      return next;
    });
    dirty.current = true;
  };

  // debounce saves after edits, plus a periodic retry
  useEffect(() => {
    if (!session) return;
    const t = setTimeout(save, 1200);
    return () => clearTimeout(t);
  }, [answers, session, save]);

  useEffect(() => {
    if (!session) return;
    const t = setInterval(save, 20000);
    return () => clearInterval(t);
  }, [session, save]);

  // ---------------------------------------------------------------- submit
  const doSubmit = useCallback(
    async (auto: boolean) => {
      if (submittedRef.current || !session) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const res = await studentApi.submit(examId, answersRef.current);
        try {
          localStorage.removeItem(backupKey(session.attempt.id));
        } catch {}
        onSubmitted(examId, res.resultVisible, auto ? `Time is up — your answers were submitted. ${res.message}` : res.message);
      } catch (err: any) {
        submittedRef.current = false;
        setSubmitting(false);
        if (err.code === 'ALREADY_SUBMITTED') return onSubmitted(examId, false, 'This exam was already submitted.');
        error('Submit failed', `${err.message} — your answers are saved; try again.`);
      }
    },
    [examId, session, onSubmitted, error]
  );

  // ---------------------------------------------------------------- timer
  useEffect(() => {
    if (!session) return;
    const deadline = new Date(session.attempt.deadlineAt).getTime();
    let warned = false;
    const tick = () => {
      const left = Math.max(0, (deadline - (Date.now() + clockOffset.current)) / 1000);
      setRemaining(left);
      if (left <= 300 && left > 0 && !warned) {
        warned = true;
        warning('5 minutes left', 'Review your answers. The exam submits automatically when time runs out.');
      }
      if (left <= 0) doSubmit(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session, doSubmit, warning]);

  // warn before leaving mid-exam
  useEffect(() => {
    if (!session) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [session]);

  const goTo = (i: number) => {
    if (i < 0 || i >= questions.length) return;
    setIndex(i);
    setVisited((prev) => new Set(prev).add(questions[i].id));
    setPaletteOpen(false);
  };

  // ---------------------------------------------------------------- render
  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-6">
        <div className="max-w-sm rounded-2xl border border-line bg-card p-6 text-center">
          <div className="text-sm font-bold text-ink">Can't open this exam</div>
          <p className="mt-2 text-xs text-slate-500">{loadError}</p>
          <button type="button" className={`${secondaryButton} mt-4`} onClick={onExit}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session || !current) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-paper text-xs text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing your exam...
      </div>
    );
  }

  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;
  const markedCount = questions.filter((q) => answers[q.id]?.marked).length;
  const currentAnswer = answers[current.id];
  const section = session.sections[sectionOf.get(current.id) ?? 0];
  const lowTime = remaining <= 300;

  const paletteClass = (qid: string, i: number) => {
    const a = answers[qid];
    const base = 'flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums transition-all cursor-pointer border';
    const ring = i === index ? ' ring-2 ring-gold ring-offset-1 ring-offset-paper' : '';
    if (a?.marked && isAnswered(a)) return `${base} bg-violet-500/30 border-violet-400/60 text-violet-900${ring}`;
    if (a?.marked) return `${base} bg-violet-500/10 border-violet-400/40 text-violet-800${ring}`;
    if (isAnswered(a)) return `${base} bg-emerald-500/25 border-emerald-400/50 text-emerald-900${ring}`;
    if (visited.has(qid)) return `${base} bg-rose-500/10 border-rose-400/30 text-rose-800${ring}`;
    return `${base} bg-field border-line text-slate-500${ring}`;
  };

  const palette = (
    <div className="space-y-4">
      {session.sections.map((s, si) => (
        <div key={si}>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {s.name}
            {s.attemptCount < s.questionIds.length && <span className="ml-1 normal-case text-amber-700/80">(attempt any {s.attemptCount})</span>}
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {s.questionIds.map((qid) => {
              const i = questions.findIndex((q) => q.id === qid);
              return (
                <button key={qid} type="button" className={paletteClass(qid, i)} onClick={() => goTo(i)} aria-label={`Question ${i + 1}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-500/50" /> Answered</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-rose-500/30" /> Not answered</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-violet-500/40" /> Marked</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded border border-line-strong" /> Not visited</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink font-heading">{session.exam.title}</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>{answeredCount}/{questions.length} answered</span>
            <span aria-live="polite" className="inline-flex items-center gap-1">
              {saveState === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Saving</>}
              {saveState === 'saved' && <><Check className="h-3 w-3 text-emerald-600" /> Saved</>}
              {saveState === 'offline' && <><CloudOff className="h-3 w-3 text-amber-600" /> Offline — retrying</>}
            </span>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${
            lowTime ? 'border-rose-500/40 bg-rose-500/10 text-rose-800' : 'border-line bg-card text-ink'
          }`}
          aria-label="Time remaining"
        >
          <Timer className="h-4 w-4" /> {formatDuration(remaining)}
        </div>
        <button type="button" className={`${primaryButton} hidden sm:inline-flex`} onClick={() => setConfirmOpen(true)} disabled={submitting}>
          <Send className="h-3.5 w-3.5" /> Submit
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-5 p-4">
        {/* Question */}
        <main className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="rounded-md bg-gold/15 px-2 py-0.5 font-bold text-gold">Q{index + 1}</span>
            <span>{section?.name}</span>
            <span>•</span>
            <span className="text-emerald-700/90">+{current.marks}</span>
            {current.negative > 0 && <span className="text-rose-700/90">−{current.negative}</span>}
            {current.kind === 'numerical' && <span className="rounded-md border border-sky-500/30 px-1.5 text-sky-700">Numerical</span>}
            <button type="button" className="ml-auto text-[11px] font-semibold text-gold lg:hidden cursor-pointer" onClick={() => setPaletteOpen(true)}>
              All questions
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-card p-4 sm:p-6">
            <QuestionStem q={current} />

            <div className="mt-5">
              {current.kind === 'mcq' ? (
                <div className="space-y-2" role="radiogroup" aria-label="Options">
                  {OPTION_KEYS.filter(({ field }) => (current as any)[field]).map(({ letter, field }) => {
                    const chosen = currentAnswer?.option === letter;
                    return (
                      <button
                        key={letter}
                        type="button"
                        role="radio"
                        aria-checked={chosen}
                        onClick={() => updateAnswer(current.id, { option: chosen ? undefined : letter })}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-[13px] transition-all cursor-pointer ${
                          chosen ? 'border-gold bg-gold/10 text-ink' : 'border-line bg-field text-slate-700 hover:border-line-strong'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                            chosen ? 'border-gold bg-gold-btn text-ink' : 'border-line-strong text-slate-500'
                          }`}
                        >
                          {letter}
                        </span>
                        <KaTeXRenderer content={(current as any)[field]} className="pt-0.5" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <label className="block max-w-xs space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">Your answer</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={currentAnswer?.value || ''}
                    onChange={(e) => updateAnswer(current.id, { value: e.target.value.replace(/[^0-9.\-eE/]/g, '').slice(0, 24) })}
                    className="w-full rounded-xl border border-line bg-field px-4 py-3 font-mono text-base text-ink focus:border-gold focus:outline-none"
                    placeholder="Enter a number"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className={secondaryButton} onClick={() => goTo(index - 1)} disabled={index === 0}>
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button
              type="button"
              className={`${secondaryButton} ${currentAnswer?.marked ? '!border-violet-400/50 !text-violet-800' : ''}`}
              onClick={() => updateAnswer(current.id, { marked: !currentAnswer?.marked })}
            >
              <Flag className="h-3.5 w-3.5" /> {currentAnswer?.marked ? 'Unmark' : 'Mark for review'}
            </button>
            <button type="button" className={secondaryButton} onClick={() => updateAnswer(current.id, { option: undefined, value: undefined })} disabled={!isAnswered(currentAnswer)}>
              <Eraser className="h-3.5 w-3.5" /> Clear
            </button>
            <div className="flex-1" />
            {index < questions.length - 1 ? (
              <button type="button" className={primaryButton} onClick={() => goTo(index + 1)}>
                Save & Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button type="button" className={primaryButton} onClick={() => setConfirmOpen(true)} disabled={submitting}>
                <Send className="h-3.5 w-3.5" /> Finish & Submit
              </button>
            )}
          </div>
        </main>

        {/* Palette (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-20 rounded-2xl border border-line bg-card p-4">{palette}</div>
        </aside>
      </div>

      {/* Mobile submit bar */}
      <div className="sticky bottom-0 border-t border-line bg-paper/95 p-3 backdrop-blur-xl sm:hidden">
        <button type="button" className={`${primaryButton} w-full`} onClick={() => setConfirmOpen(true)} disabled={submitting}>
          <Send className="h-3.5 w-3.5" /> Submit exam
        </button>
      </div>

      {paletteOpen && (
        <Modal title="All questions" onClose={() => setPaletteOpen(false)}>
          {palette}
        </Modal>
      )}

      {confirmOpen && (
        <Modal
          title="Submit exam?"
          subtitle="You cannot change answers after submitting."
          onClose={() => !submitting && setConfirmOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButton} onClick={() => setConfirmOpen(false)} disabled={submitting}>
                Keep writing
              </button>
              <button type="button" className={primaryButton} onClick={() => doSubmit(false)} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit now'}
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <div className="text-xl font-black text-emerald-700 tabular-nums">{answeredCount}</div>
              <div className="text-[10px] text-slate-500">Answered</div>
            </div>
            <div className="rounded-xl bg-ink/[0.04] p-3">
              <div className="text-xl font-black text-ink tabular-nums">{questions.length - answeredCount}</div>
              <div className="text-[10px] text-slate-500">Not answered</div>
            </div>
            <div className="rounded-xl bg-violet-500/10 p-3">
              <div className="text-xl font-black text-violet-800 tabular-nums">{markedCount}</div>
              <div className="text-[10px] text-slate-500">Marked</div>
            </div>
          </div>
          <div className="mt-3 text-center text-[11px] text-slate-500">Time left: {formatDuration(remaining)}</div>
        </Modal>
      )}
    </div>
  );
};
