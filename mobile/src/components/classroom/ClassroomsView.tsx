import React, { useCallback, useEffect, useState } from 'react';
import { Plus, School, Users, CalendarClock, Copy, Trash2, UserPlus, ChevronLeft, FileText, ArrowRight, X } from 'lucide-react';
import { useToast } from '../Toast';
import { StoredUser } from '../../services/apiClient';
import { classroomApi, ClassroomSummary, ExamSummary, formatDateTime, Member } from '../../services/classroomApi';
import { Field, Modal, PhaseBadge, Spinner, dangerButton, inputClass, primaryButton, secondaryButton } from './ui';
import { CreateExamModal } from './CreateExamModal';
import { AddStudentsModal } from './AddStudentsModal';
import { ExamDetailModal } from './ExamDetailModal';

interface Props {
  user: StoredUser;
  pendingPaper: any | null;
  onPendingPaperConsumed: () => void;
}

type Detail = Awaited<ReturnType<typeof classroomApi.get>>;

const SOURCE_LABEL: Record<string, string> = { qpg: 'QPG', examprep: 'ExamPrep', invited: 'Invited' };

export const ClassroomsView: React.FC<Props> = ({ pendingPaper, onPendingPaperConsumed }) => {
  const { success, error, info } = useToast();
  const [classrooms, setClassrooms] = useState<ClassroomSummary[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [tab, setTab] = useState<'exams' | 'members'>('exams');

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showExam, setShowExam] = useState(false);
  const [openExamId, setOpenExamId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      const res = await classroomApi.list();
      setClassrooms(res.classrooms);
      setLoadError('');
    } catch (err: any) {
      setLoadError(err.message);
      setClassrooms([]);
    }
  }, []);

  const loadDetail = useCallback(
    async (id: string) => {
      try {
        setDetail(await classroomApi.get(id));
      } catch (err: any) {
        error('Could not open classroom', err.message);
        setSelectedId(null);
      }
    },
    [error]
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) {
      setDetail(null);
      loadDetail(selectedId);
    }
  }, [selectedId, loadDetail]);

  // A paper sent from the workbench opens the exam dialog once a classroom is chosen.
  useEffect(() => {
    if (pendingPaper && detail && selectedId === detail.classroom.id) setShowExam(true);
  }, [pendingPaper, detail, selectedId]);

  const refreshAll = async () => {
    await loadList();
    if (selectedId) await loadDetail(selectedId);
  };

  const createClassroom = async () => {
    if (newName.trim().length < 2) return error('Name needed', 'Give the classroom a name.');
    setCreating(true);
    try {
      const res = await classroomApi.create(newName.trim(), newDesc.trim());
      success('Classroom created', `Share code ${res.classroom.joinCode} with your students.`);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      await loadList();
      setSelectedId(res.classroom.id);
      setTab('members');
    } catch (err: any) {
      error('Could not create classroom', err.message);
    } finally {
      setCreating(false);
    }
  };

  const removeMember = async (m: Member) => {
    if (!detail || !window.confirm(`Remove ${m.name} from ${detail.classroom.name}?`)) return;
    try {
      await classroomApi.removeMember(detail.classroom.id, m.id);
      await refreshAll();
    } catch (err: any) {
      error('Could not remove', err.message);
    }
  };

  const deleteClassroom = async () => {
    if (!detail) return;
    if (!window.confirm(`Delete "${detail.classroom.name}"? Its exams and results are deleted too. This cannot be undone.`)) return;
    try {
      await classroomApi.remove(detail.classroom.id);
      success('Classroom deleted');
      setSelectedId(null);
      setDetail(null);
      await loadList();
    } catch (err: any) {
      error('Could not delete', err.message);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      info('Copied', text);
    } catch {
      /* ignore */
    }
  };

  const pendingBanner = pendingPaper && (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-4">
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <div>
          <div className="text-xs font-bold text-ink">Ready to send “{pendingPaper.title || 'your paper'}”</div>
          <div className="text-[11px] text-slate-500">
            {selectedId ? 'Set the schedule and students in the dialog.' : 'Pick (or create) the classroom that will write this exam.'}
          </div>
        </div>
      </div>
      <button type="button" onClick={onPendingPaperConsumed} aria-label="Dismiss" className="rounded-lg p-1 text-slate-500 hover:text-ink cursor-pointer">
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  // ---------------------------------------------------------------- list view
  if (!selectedId) {
    return (
      <div className="mx-auto max-w-5xl">
        {pendingBanner}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-ink font-heading">Classrooms & Online Exams</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Add students (from email, ExamPrep or a join code), then conduct your generated papers as timed online exams.
              First 10 students per exam are free; ₹25 per extra student.
            </p>
          </div>
          <button type="button" className={primaryButton} onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New Classroom
          </button>
        </div>

        {classrooms === null ? (
          <Spinner label="Loading classrooms..." />
        ) : loadError ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 text-xs text-rose-800">
            {loadError}
            <button type="button" onClick={loadList} className="ml-2 font-semibold underline cursor-pointer">
              Retry
            </button>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center">
            <School className="mx-auto h-8 w-8 text-gold" />
            <div className="mt-3 text-sm font-bold text-ink">No classrooms yet</div>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">Create a classroom for each batch or section, add students, and schedule online exams from your papers.</p>
            <button type="button" className={`${primaryButton} mt-4`} onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Create your first classroom
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedId(c.id);
                  setTab(pendingPaper ? 'exams' : 'exams');
                }}
                className="group rounded-2xl border border-line bg-card p-4 text-left transition-all hover:border-gold/40 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-ink font-heading">{c.name}</div>
                    {c.description && <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{c.description}</div>}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-gold" />
                </div>
                <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {c.memberCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" /> {c.examCount} exam{c.examCount === 1 ? '' : 's'}
                  </span>
                  <span className="ml-auto font-mono text-[10px] tracking-widest text-gold">{c.joinCode}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {showCreate && (
          <Modal
            title="New Classroom"
            onClose={() => setShowCreate(false)}
            footer={
              <div className="flex justify-end gap-2">
                <button type="button" className={secondaryButton} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="button" className={primaryButton} onClick={createClassroom} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Classroom'}
                </button>
              </div>
            }
          >
            <div className="space-y-3">
              <Field label="Classroom name">
                <input autoFocus className={inputClass} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. 12th NEET Batch A" maxLength={160}
                  onKeyDown={(e) => e.key === 'Enter' && createClassroom()} />
              </Field>
              <Field label="Description (optional)">
                <textarea className={`${inputClass} min-h-[70px]`} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Timings, syllabus, notes for students" />
              </Field>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- detail view
  return (
    <div className="mx-auto max-w-5xl">
      {pendingBanner}
      <button
        type="button"
        onClick={() => {
          setSelectedId(null);
          setDetail(null);
          loadList();
        }}
        className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-ink cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" /> All classrooms
      </button>

      {!detail ? (
        <Spinner label="Opening classroom..." />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-ink font-heading">{detail.classroom.name}</h1>
              {detail.classroom.description && <p className="mt-0.5 text-xs text-slate-500">{detail.classroom.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {detail.members.length} students
                </span>
                <button type="button" onClick={() => copy(detail.classroom.joinCode)} className="inline-flex items-center gap-1 rounded-md border border-gold/30 px-2 py-0.5 font-mono tracking-widest text-gold hover:bg-gold/10 cursor-pointer" title="Copy join code">
                  {detail.classroom.joinCode} <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={secondaryButton} onClick={() => setShowAdd(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Add Students
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={() => {
                  if (detail.members.length === 0) {
                    setTab('members');
                    return error('No students yet', 'Add students to the classroom before scheduling an exam.');
                  }
                  setShowExam(true);
                }}
              >
                <CalendarClock className="h-4 w-4" /> Schedule Exam
              </button>
            </div>
          </div>

          <div className="mb-3 flex gap-1 border-b border-line">
            {(['exams', 'members'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold capitalize cursor-pointer ${
                  tab === t ? 'border-gold text-gold' : 'border-transparent text-slate-500 hover:text-ink'
                }`}
              >
                {t === 'exams' ? `Exams (${detail.exams.length})` : `Students (${detail.members.length})`}
              </button>
            ))}
          </div>

          {tab === 'exams' &&
            (detail.exams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-slate-500">
                No exams yet. Generate a paper and press <strong className="text-ink">Send to Classroom</strong>, or use{' '}
                <strong className="text-ink">Schedule Exam</strong> with a saved paper.
              </div>
            ) : (
              <div className="space-y-2">
                {detail.exams.map((e: ExamSummary) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setOpenExamId(e.id)}
                    className="flex w-full flex-col gap-2 rounded-xl border border-line bg-card p-3.5 text-left transition-colors hover:border-gold/40 sm:flex-row sm:items-center cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-ink">{e.title}</span>
                        <PhaseBadge phase={e.phase} />
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {formatDateTime(e.startsAt)} • {e.durationMinutes} min • {e.questionCount} Qs • {e.totalMarks} marks
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-[11px] text-slate-500">
                      <span>
                        {e.submittedCount}/{e.participantCount} submitted
                      </span>
                      {e.status === 'payment_pending' && <span className="font-semibold text-amber-700">₹{e.pricing.amountDue} due</span>}
                    </div>
                  </button>
                ))}
              </div>
            ))}

          {tab === 'members' &&
            (detail.members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center">
                <div className="text-xs text-slate-500">No students yet.</div>
                <button type="button" className={`${primaryButton} mt-3`} onClick={() => setShowAdd(true)}>
                  <UserPlus className="h-4 w-4" /> Add Students
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-line">
                {detail.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 border-b border-line bg-card px-3.5 py-2.5 last:border-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                      {(m.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-ink">{m.name}</div>
                      <div className="truncate text-[10px] text-slate-500">
                        {m.email}
                        {m.classLevel ? ` • Class ${m.classLevel}` : ''}
                      </div>
                    </div>
                    <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase sm:inline ${m.source === 'examprep' ? 'border-sky-500/30 text-sky-700' : 'border-line text-slate-500'}`}>
                      {SOURCE_LABEL[m.source] || m.source}
                    </span>
                    {!m.activated && <span className="shrink-0 text-[9px] font-bold uppercase text-amber-600/80" title="Has not signed in yet">pending</span>}
                    <button type="button" onClick={() => removeMember(m)} className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-700 cursor-pointer" aria-label={`Remove ${m.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ))}

          <div className="mt-8 flex justify-end">
            <button type="button" className={dangerButton} onClick={deleteClassroom}>
              <Trash2 className="h-3.5 w-3.5" /> Delete classroom
            </button>
          </div>

          {showAdd && (
            <AddStudentsModal
              classroomId={detail.classroom.id}
              classroomName={detail.classroom.name}
              joinCode={detail.classroom.joinCode}
              onClose={() => setShowAdd(false)}
              onAdded={refreshAll}
            />
          )}

          {showExam && (
            <CreateExamModal
              classroomId={detail.classroom.id}
              classroomName={detail.classroom.name}
              members={detail.members}
              pricing={detail.pricing}
              initialPaper={pendingPaper}
              onClose={() => {
                setShowExam(false);
                if (pendingPaper) onPendingPaperConsumed();
              }}
              onCreated={async (exam, pricing, message) => {
                setShowExam(false);
                if (pendingPaper) onPendingPaperConsumed();
                success(pricing.amountDue > 0 ? 'Exam saved — payment needed' : 'Exam scheduled', message);
                setTab('exams');
                await refreshAll();
                if (pricing.amountDue > 0) setOpenExamId(exam.id);
              }}
            />
          )}

          {openExamId && (
            <ExamDetailModal examId={openExamId} members={detail.members} onClose={() => setOpenExamId(null)} onChanged={refreshAll} />
          )}
        </>
      )}
    </div>
  );
};
