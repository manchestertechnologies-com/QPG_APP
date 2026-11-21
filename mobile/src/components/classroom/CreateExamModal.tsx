import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Search, Users, IndianRupee } from 'lucide-react';
import { api } from '../../services/apiClient';
import { classroomApi, ExamSummary, Member, Pricing, toLocalInput } from '../../services/classroomApi';
import { Field, Modal, inputClass, primaryButton, secondaryButton } from './ui';

interface Props {
  classroomId: string;
  classroomName: string;
  members: Member[];
  pricing: { freeSeats: number; seatPrice: number };
  initialPaper?: any | null;
  onClose: () => void;
  onCreated: (exam: ExamSummary, pricing: Pricing, message: string) => void;
}

function countQuestions(paper: any): number {
  return (paper?.sections || []).reduce((sum: number, s: any) => sum + (s.questions?.length || 0), 0);
}

export const CreateExamModal: React.FC<Props> = ({ classroomId, classroomName, members, pricing, initialPaper, onClose, onCreated }) => {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [paper, setPaper] = useState<any | null>(initialPaper || null);
  const [title, setTitle] = useState<string>(initialPaper?.title || '');
  const defaultStart = useMemo(() => {
    const d = new Date(Date.now() + 10 * 60 * 1000);
    d.setSeconds(0, 0);
    return toLocalInput(d);
  }, []);
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [duration, setDuration] = useState<number>(Number(initialPaper?.duration_minutes) || 60);
  const [lateEntry, setLateEntry] = useState<number>(15);
  const [showResults, setShowResults] = useState<'after_submit' | 'after_end' | 'never'>('after_submit');
  const [shuffle, setShuffle] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(members.map((m) => m.id)));
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (initialPaper) return;
    api
      .getDrafts()
      .then((res: any) => setDrafts((res?.drafts || []).filter((d: any) => d.paper && countQuestions(d.paper) > 0)))
      .catch(() => setDrafts([]));
  }, [initialPaper]);

  const visibleMembers = members.filter(
    (m) => !filter || m.name.toLowerCase().includes(filter.toLowerCase()) || m.email.toLowerCase().includes(filter.toLowerCase())
  );
  const count = selected.size;
  const extra = Math.max(0, count - pricing.freeSeats);
  const amount = extra * pricing.seatPrice;
  const questionCount = countQuestions(paper);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    setErrorText('');
    if (!paper) return setErrorText('Choose a paper for this exam.');
    if (count === 0) return setErrorText('Select at least one student.');
    const start = new Date(startsAt);
    if (isNaN(start.getTime())) return setErrorText('Pick a valid start time.');
    if (!duration || duration < 1) return setErrorText('Duration must be at least 1 minute.');
    const end = new Date(start.getTime() + (duration + Math.max(0, lateEntry)) * 60 * 1000);
    if (end.getTime() <= Date.now()) return setErrorText('This exam window is already over. Pick a later start time.');

    setSaving(true);
    try {
      const res = await classroomApi.createExam(classroomId, {
        paper,
        title: title.trim() || paper.title || 'Online Exam',
        durationMinutes: duration,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        showResults,
        shuffleQuestions: shuffle,
        instructions: instructions.trim() || undefined,
        participantIds: [...selected],
      });
      onCreated(res.exam, res.pricing, res.message);
    } catch (err: any) {
      setErrorText(err.message || 'Could not create the exam.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title="Schedule Online Exam"
      subtitle={`Classroom: ${classroomName}`}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[11px] text-slate-400">
            {count} student{count === 1 ? '' : 's'} •{' '}
            {amount > 0 ? (
              <span className="font-semibold text-amber-300">
                ₹{amount} due ({extra} × ₹{pricing.seatPrice}) before students can see it
              </span>
            ) : (
              <span className="font-semibold text-emerald-300">Free (up to {pricing.freeSeats} students)</span>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className={secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={primaryButton} onClick={submit} disabled={saving || !paper}>
              {saving ? 'Scheduling...' : amount > 0 ? `Save & Pay ₹${amount}` : 'Schedule Exam'}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        {/* Left: paper + settings */}
        <div className="space-y-4">
          <Field label="Question paper">
            {initialPaper ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-[#C8A96A]/30 bg-[#C8A96A]/5 p-3">
                <FileText className="h-4 w-4 text-[#C8A96A]" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-white">{initialPaper.title || 'Current paper'}</div>
                  <div className="text-[10px] text-slate-400">
                    {initialPaper.exam_type} • {questionCount} questions • from the workbench
                  </div>
                </div>
              </div>
            ) : drafts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-3 text-[11px] leading-relaxed text-slate-400">
                No saved papers yet. Generate a paper, then press <strong className="text-white">Send to Classroom</strong> on the
                workbench (or save it as a draft) to use it here.
              </div>
            ) : (
              <select
                className={inputClass}
                value={paper?.id || ''}
                onChange={(e) => {
                  const d = drafts.find((x) => (x.paper?.id || x.paper_id || x.id) === e.target.value);
                  setPaper(d?.paper || null);
                  if (d) {
                    if (!title) setTitle(d.title || d.paper?.title || '');
                    if (d.paper?.duration_minutes) setDuration(Number(d.paper.duration_minutes));
                  }
                }}
              >
                <option value="">Select a saved paper…</option>
                {drafts.map((d) => (
                  <option key={d.paper_id || d.id} value={d.paper?.id || d.paper_id || d.id}>
                    {(d.title || d.paper?.title || 'Untitled')} — {countQuestions(d.paper)} Qs
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Exam title">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Test 3 — Electrostatics" maxLength={255} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts at">
              <input type="datetime-local" className={inputClass} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </Field>
            <Field label="Duration (minutes)">
              <input type="number" min={1} max={600} className={inputClass} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </Field>
          </div>

          <Field label="Late entry allowed (minutes)" hint="Students can start until this long after the start time. Late starters get less time; everyone's exam closes at the same moment.">
            <input type="number" min={0} max={1440} className={inputClass} value={lateEntry} onChange={(e) => setLateEntry(Number(e.target.value))} />
          </Field>

          <Field label="Show results to students">
            <select className={inputClass} value={showResults} onChange={(e) => setShowResults(e.target.value as any)}>
              <option value="after_submit">Immediately after they submit</option>
              <option value="after_end">After the exam window closes</option>
              <option value="never">Don't show (teacher only)</option>
            </select>
          </Field>

          <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-300">
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="h-4 w-4 accent-[#C8A96A]" />
            Shuffle question order for each student (within sections)
          </label>

          <Field label="Instructions (optional)">
            <textarea className={`${inputClass} min-h-[70px]`} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Defaults to the paper's instructions" />
          </Field>
        </div>

        {/* Right: participants */}
        <div className="flex min-h-0 flex-col">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Users className="h-3.5 w-3.5" /> Participants ({count}/{members.length})
            </span>
            <div className="flex gap-2 text-[11px]">
              <button type="button" className="text-[#C8A96A] hover:underline cursor-pointer" onClick={() => setSelected(new Set(members.map((m) => m.id)))}>
                All
              </button>
              <button
                type="button"
                className="text-[#C8A96A] hover:underline cursor-pointer"
                onClick={() => setSelected(new Set(members.slice(0, pricing.freeSeats).map((m) => m.id)))}
              >
                First {pricing.freeSeats}
              </button>
              <button type="button" className="text-slate-400 hover:text-white cursor-pointer" onClick={() => setSelected(new Set())}>
                None
              </button>
            </div>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input className={`${inputClass} pl-8`} placeholder="Search students" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>

          <div className="max-h-72 flex-1 overflow-y-auto rounded-xl border border-white/5 bg-[#0F0F0F]">
            {members.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-slate-400">Add students to this classroom first.</div>
            ) : (
              visibleMembers.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-2.5 border-b border-white/5 px-3 py-2 last:border-0 hover:bg-white/[0.03]">
                  <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} className="h-3.5 w-3.5 accent-[#C8A96A]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-white">{m.name}</div>
                    <div className="truncate text-[10px] text-slate-500">{m.email}</div>
                  </div>
                  {!m.activated && <span className="shrink-0 text-[9px] font-semibold uppercase text-amber-400/80">invited</span>}
                </label>
              ))
            )}
          </div>

          <div className={`mt-3 rounded-xl border p-3 text-[11px] leading-relaxed ${amount > 0 ? 'border-amber-500/25 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <IndianRupee className="h-3.5 w-3.5" /> Exam pricing
            </div>
            <div className="mt-1 text-slate-300">
              First {pricing.freeSeats} students per exam are free. Each extra student costs ₹{pricing.seatPrice} for this exam.
            </div>
            <div className="mt-1.5 tabular-nums text-slate-200">
              {Math.min(count, pricing.freeSeats)} free + {extra} × ₹{pricing.seatPrice} ={' '}
              <strong className={amount > 0 ? 'text-amber-300' : 'text-emerald-300'}>₹{amount}</strong>
            </div>
          </div>
        </div>
      </div>

      {errorText && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{errorText}</div>}
    </Modal>
  );
};
