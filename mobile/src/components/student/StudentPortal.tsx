import React, { useCallback, useEffect, useState } from 'react';
import { GraduationCap, LogOut, School, CalendarClock, Clock, Play, Trophy, KeyRound, RefreshCw, UserCircle2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../Toast';
import { StoredUser, api } from '../../services/apiClient';
import { formatDateTime, StudentExam, studentApi } from '../../services/classroomApi';
import { Field, Modal, PhaseBadge, Spinner, inputClass, primaryButton, secondaryButton } from '../classroom/ui';
import { ExamRunner } from './ExamRunner';
import { ResultView } from './ResultView';

interface Props {
  user: StoredUser;
  onLogout: () => void;
  onUserUpdate: (user: StoredUser) => void;
}

type Screen = { kind: 'dashboard' } | { kind: 'exam'; examId: string } | { kind: 'result'; examId: string };

function relativeStart(iso: string, now: number): string {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return 'now';
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `in ${hours} h`;
  return `on ${formatDateTime(iso)}`;
}

export const StudentPortal: React.FC<Props> = ({ user, onLogout, onUserUpdate }) => {
  const { success, error, info } = useToast();
  const [screen, setScreen] = useState<Screen>({ kind: 'dashboard' });
  const [exams, setExams] = useState<StudentExam[] | null>(null);
  const [classrooms, setClassrooms] = useState<Awaited<ReturnType<typeof studentApi.classrooms>>['classrooms'] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(user.name || '');
  const [profileClass, setProfileClass] = useState(user.classLevel || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, c] = await Promise.all([studentApi.exams(), studentApi.classrooms()]);
      setExams(e.exams);
      setClassrooms(c.classrooms);
      setLoadError('');
    } catch (err: any) {
      setLoadError(err.message);
      setExams((prev) => prev || []);
      setClassrooms((prev) => prev || []);
    }
  }, []);

  useEffect(() => {
    if (screen.kind === 'dashboard') load();
  }, [screen.kind, load]);

  // Keep countdowns fresh and pick up exams that just went live.
  useEffect(() => {
    if (screen.kind !== 'dashboard') return;
    const tick = setInterval(() => setNow(Date.now()), 30000);
    const refresh = setInterval(load, 60000);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [screen.kind, load]);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setJoining(true);
    try {
      const res = await studentApi.join(code.trim());
      if (res.alreadyMember) info('Already joined', `You are already in ${res.classroom.name}.`);
      else success('Joined classroom', res.classroom.name);
      setCode('');
      load();
    } catch (err: any) {
      error('Could not join', err.message);
    } finally {
      setJoining(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await studentApi.updateProfile({ name: profileName.trim(), classLevel: profileClass || undefined });
      api.setSession(api.getToken() || '', res.user);
      onUserUpdate(res.user);
      success('Profile saved');
      setProfileOpen(false);
    } catch (err: any) {
      error('Could not save', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  if (screen.kind === 'exam') {
    return (
      <ExamRunner
        examId={screen.examId}
        onExit={() => setScreen({ kind: 'dashboard' })}
        onSubmitted={(examId, visible, message) => {
          success('Exam submitted', message);
          setScreen(visible ? { kind: 'result', examId } : { kind: 'dashboard' });
        }}
      />
    );
  }

  const live = (exams || []).filter((e) => e.phase === 'live' && (e.attempt.status === 'not_started' || e.attempt.status === 'in_progress'));
  const upcoming = (exams || []).filter((e) => e.phase === 'upcoming');
  const done = (exams || []).filter((e) => e.attempt.status === 'submitted' || e.attempt.status === 'auto_submitted');
  const missed = (exams || []).filter((e) => e.phase === 'ended' && e.attempt.status === 'not_started');

  const examCard = (e: StudentExam) => {
    const inProgress = e.attempt.status === 'in_progress';
    const finished = e.attempt.status === 'submitted' || e.attempt.status === 'auto_submitted';
    return (
      <div key={e.id} className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#141414] p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-white">{e.title}</span>
            {!finished && <PhaseBadge phase={e.phase} />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1"><School className="h-3 w-3" /> {e.classroomName}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {e.durationMinutes} min</span>
            <span>{e.questionCount} questions • {e.totalMarks} marks</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {e.phase === 'upcoming' ? `Starts ${relativeStart(e.startsAt, now)} (${formatDateTime(e.startsAt)})` : `Closes ${formatDateTime(e.endsAt)}`}
          </div>
        </div>
        <div className="shrink-0">
          {finished ? (
            e.attempt.resultVisible ? (
              <button type="button" className={secondaryButton} onClick={() => setScreen({ kind: 'result', examId: e.id })}>
                <Trophy className="h-3.5 w-3.5 text-[#C8A96A]" /> {e.attempt.score}/{e.attempt.maxScore} • View result
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                {e.showResults === 'after_end' ? ' — results after close' : ''}
              </span>
            )
          ) : e.phase === 'live' ? (
            <button type="button" className={primaryButton} onClick={() => setScreen({ kind: 'exam', examId: e.id })}>
              <Play className="h-3.5 w-3.5" /> {inProgress ? 'Resume exam' : 'Start exam'}
            </button>
          ) : e.phase === 'upcoming' ? (
            <span className="text-[11px] text-slate-400">Not open yet</span>
          ) : (
            <span className="text-[11px] text-slate-500">Missed</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F3F4F6]">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0D0D0D]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#C8A96A] to-[#A68B4F]">
            <GraduationCap className="h-5 w-5 text-[#0D0D0D]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white font-heading">Student Portal</div>
            <div className="truncate text-[11px] text-slate-400">
              {user.name || user.email}
              {user.source === 'examprep' || user.examprepLinked ? ' • ExamPrep connected' : ''}
            </div>
          </div>
          <button type="button" onClick={() => setProfileOpen(true)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer" aria-label="Profile">
            <UserCircle2 className="h-5 w-5" />
          </button>
          <button type="button" onClick={onLogout} className={secondaryButton}>
            <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {screen.kind === 'result' ? (
        <ResultView examId={screen.examId} onBack={() => setScreen({ kind: 'dashboard' })} />
      ) : (
        <main className="mx-auto max-w-5xl space-y-6 p-4 pb-16">
          {loadError && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-rose-200">
              {loadError}{' '}
              <button type="button" onClick={load} className="font-semibold underline cursor-pointer">Retry</button>
            </div>
          )}

          {exams === null ? (
            <Spinner label="Loading your exams..." />
          ) : (
            <>
              {live.length > 0 && (
                <section>
                  <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live now
                  </h2>
                  <div className="space-y-2">{live.map(examCard)}</div>
                </section>
              )}

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5" /> Upcoming
                  </h2>
                  <button type="button" onClick={load} className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-white cursor-pointer">
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                </div>
                {upcoming.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                    {classrooms && classrooms.length === 0
                      ? 'Join a classroom below to see the exams your teacher schedules.'
                      : 'No upcoming exams. Your teacher’s scheduled exams appear here.'}
                  </div>
                ) : (
                  <div className="space-y-2">{upcoming.map(examCard)}</div>
                )}
              </section>

              {done.length > 0 && (
                <section>
                  <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Trophy className="h-3.5 w-3.5" /> Completed
                  </h2>
                  <div className="space-y-2">{done.map(examCard)}</div>
                </section>
              )}

              {missed.length > 0 && (
                <section>
                  <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Missed</h2>
                  <div className="space-y-2 opacity-70">{missed.map(examCard)}</div>
                </section>
              )}
            </>
          )}

          <section className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
            <form onSubmit={join} className="rounded-2xl border border-white/5 bg-[#141414] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <KeyRound className="h-4 w-4 text-[#C8A96A]" /> Join a classroom
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Enter the 6-character code from your teacher.</p>
              <div className="mt-3 flex gap-2">
                <input
                  className={`${inputClass} font-mono uppercase tracking-[0.25em]`}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
                  placeholder="ABC123"
                  aria-label="Classroom code"
                />
                <button type="submit" className={primaryButton} disabled={joining || code.length < 4}>
                  {joining ? '...' : 'Join'}
                </button>
              </div>
            </form>

            <div className="rounded-2xl border border-white/5 bg-[#141414] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <School className="h-4 w-4 text-[#C8A96A]" /> My classrooms
              </div>
              {classrooms === null ? null : classrooms.length === 0 ? (
                <p className="mt-2 text-[11px] text-slate-500">You haven't joined any classroom yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-white/5">
                  {classrooms.map((c) => (
                    <li key={c.id} className="py-2">
                      <div className="text-xs font-semibold text-white">{c.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.teacherName ? `by ${c.teacherName}` : ''}
                        {c.subject ? ` • ${c.subject}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      )}

      {profileOpen && (
        <Modal
          title="My profile"
          subtitle={user.email}
          onClose={() => setProfileOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" className={secondaryButton} onClick={() => setProfileOpen(false)}>Cancel</button>
              <button type="button" className={primaryButton} onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <Field label="Full name">
              <input className={inputClass} value={profileName} onChange={(e) => setProfileName(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Class">
              <select className={inputClass} value={profileClass} onChange={(e) => setProfileClass(e.target.value)}>
                <option value="">Not set</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
                <option value="dropper">Dropper / Repeater</option>
              </select>
            </Field>
            {(user.source === 'examprep' || user.examprepLinked) && (
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-[11px] text-slate-300">
                Connected to ExamPrep. You can keep signing in with your ExamPrep password.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
