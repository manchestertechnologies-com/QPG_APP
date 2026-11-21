import React, { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, GraduationCap, LogOut, School, CalendarClock, Clock, Play, Trophy, KeyRound, RefreshCw, UserCircle2, CheckCircle2 } from 'lucide-react';
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
  const [view, setView] = useState<'exams' | 'classrooms'>('exams');
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
      <div key={e.id} className="gp-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-ink">{e.title}</span>
            {!finished && <PhaseBadge phase={e.phase} />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
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
                <Trophy className="h-3.5 w-3.5 text-gold" /> {e.attempt.score}/{e.attempt.maxScore} • View result
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                {e.showResults === 'after_end' ? ' — results after close' : ''}
              </span>
            )
          ) : e.phase === 'live' ? (
            <button type="button" className={primaryButton} onClick={() => setScreen({ kind: 'exam', examId: e.id })}>
              <Play className="h-3.5 w-3.5" /> {inProgress ? 'Resume exam' : 'Start exam'}
            </button>
          ) : e.phase === 'upcoming' ? (
            <span className="text-[11px] text-slate-500">Not open yet</span>
          ) : (
            <span className="text-[11px] text-slate-500">Missed</span>
          )}
        </div>
      </div>
    );
  };

  const initials = (user.name || user.email || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const navItems = [
    { id: 'exams' as const, label: 'My exams', Icon: LayoutDashboard },
    { id: 'classrooms' as const, label: 'Classrooms', Icon: School },
  ];
  const goTo = (v: 'exams' | 'classrooms') => {
    setView(v);
    if (screen.kind === 'result') setScreen({ kind: 'dashboard' });
  };

  const liveHero = (e: StudentExam) => (
    <div key={e.id} className="gp-hero flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-soft">
          <span className="gp-live-dot" /> Live now
        </div>
        <div className="mt-2 truncate text-xl font-extrabold font-heading text-card">{e.title}</div>
        <div className="gp-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span className="inline-flex items-center gap-1"><School className="h-3.5 w-3.5" /> {e.classroomName}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {e.durationMinutes} min</span>
          <span>{e.questionCount} questions • {e.totalMarks} marks</span>
          <span>Closes {formatDateTime(e.endsAt)}</span>
        </div>
      </div>
      <button type="button" className="gp-gold-btn inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 text-sm cursor-pointer" onClick={() => setScreen({ kind: 'exam', examId: e.id })}>
        <Play className="h-4 w-4" /> {e.attempt.status === 'in_progress' ? 'Resume exam' : 'Start exam'}
      </button>
    </div>
  );

  const examsPage = (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="gp-label">Dashboard</p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink">Welcome, {(user.name || 'Student').split(' ')[0]}</h1>
        </div>
        <button type="button" onClick={load} className="gp-ghost-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-rose-800">
          {loadError}{' '}
          <button type="button" onClick={load} className="font-semibold underline cursor-pointer">Retry</button>
        </div>
      )}

      {exams === null ? (
        <Spinner label="Loading your exams..." />
      ) : (
        <>
          {live.length > 0 && <section className="space-y-3">{live.map(liveHero)}</section>}

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <CalendarClock className="h-4 w-4 text-gold" /> Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <div className="gp-card p-6 text-center text-sm text-slate-500">
                {classrooms && classrooms.length === 0 ? (
                  <>
                    You haven't joined a classroom yet.{' '}
                    <button type="button" onClick={() => setView('classrooms')} className="font-semibold text-gold underline underline-offset-2 cursor-pointer">
                      Join with a code
                    </button>
                  </>
                ) : (
                  'No upcoming exams. Your teacher’s scheduled exams appear here.'
                )}
              </div>
            ) : (
              <div className="space-y-2">{upcoming.map(examCard)}</div>
            )}
          </section>

          {done.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                <Trophy className="h-4 w-4 text-gold" /> Completed
              </h2>
              <div className="space-y-2">{done.map(examCard)}</div>
            </section>
          )}

          {missed.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold text-slate-500">Missed</h2>
              <div className="space-y-2 opacity-70">{missed.map(examCard)}</div>
            </section>
          )}
        </>
      )}
    </div>
  );

  const classroomsPage = (
    <div className="space-y-6">
      <div>
        <p className="gp-label">Classrooms</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink">My classrooms</h1>
      </div>
      <form onSubmit={join} className="gp-card p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-ink">
          <KeyRound className="h-4 w-4 text-gold" /> Join a classroom
        </div>
        <p className="mt-1 text-xs text-slate-500">Enter the 6-character code from your teacher.</p>
        <div className="mt-3 flex max-w-md gap-2">
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

      {classrooms === null ? (
        <Spinner />
      ) : classrooms.length === 0 ? (
        <div className="gp-card p-6 text-center text-sm text-slate-500">You haven't joined any classroom yet.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {classrooms.map((c) => (
            <div key={c.id} className="gp-card gp-card-hover p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-wash text-gold">
                  <School className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-ink">{c.name}</div>
                  <div className="text-xs text-slate-500">
                    {c.teacherName ? `by ${c.teacherName}` : ''}
                    {c.subject ? ` • ${c.subject}` : ''}
                  </div>
                  {c.description && <div className="mt-1 line-clamp-2 text-xs text-slate-500">{c.description}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen text-ink">
      {/* Laptop: sidebar (ExamPrep student layout) */}
      <aside className="gp-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col px-3 pb-4 lg:flex">
        <div className="flex items-center gap-3 px-3 py-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#f3d995] via-[#d2a446] to-bronze">
            <GraduationCap className="h-5 w-5 text-ink" />
          </span>
          <span className="gp-brand text-lg leading-tight">
            Student
            <br />
            <span className="text-gold">Portal</span>
          </span>
        </div>
        <nav className="mt-2 flex-1 space-y-1" aria-label="Main">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(id)}
              aria-current={view === id && screen.kind === 'dashboard' ? 'page' : undefined}
              className={`gp-nav-link cursor-pointer ${view === id && screen.kind === 'dashboard' ? 'active' : ''}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        {(user.source === 'examprep' || user.examprepLinked) && (
          <div className="mx-1 mb-3 rounded-xl border border-line bg-card px-3 py-2 text-[11px] text-slate-500">
            <span className="gp-role mr-1.5">ExamPrep</span> account connected
          </div>
        )}
        <div className="gp-user flex items-center gap-3 p-3">
          <button type="button" onClick={() => setProfileOpen(true)} title="My profile" className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer">
            <span className="gp-avatar grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs">{initials}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{user.name || user.email}</span>
              <span className="block text-xs text-slate-500">View profile</span>
            </span>
          </button>
          <button type="button" onClick={onLogout} className="gp-ghost-btn px-2.5 py-1.5 text-xs font-semibold cursor-pointer">
            Log out
          </button>
        </div>
      </aside>

      {/* Phone and tablet: slim top bar */}
      <header className="gp-topbar sticky top-0 z-20 lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#f3d995] via-[#d2a446] to-bronze">
            <GraduationCap className="h-4 w-4 text-ink" />
          </span>
          <span className="font-heading text-sm font-extrabold">Student Portal</span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={onLogout} className="gp-ghost-btn px-2.5 py-1.5 text-xs font-semibold cursor-pointer" aria-label="Log out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setProfileOpen(true)} title="My profile" className="gp-avatar grid h-8 w-8 place-items-center rounded-full text-xs cursor-pointer">
              {initials}
            </button>
          </div>
        </div>
      </header>

      <main className="pb-24 lg:ml-64 lg:pb-10">
        {screen.kind === 'result' ? (
          <ResultView examId={screen.examId} onBack={() => setScreen({ kind: 'dashboard' })} />
        ) : (
          <div className="mx-auto max-w-5xl p-4 sm:p-6">{view === 'exams' ? examsPage : classroomsPage}</div>
        )}
      </main>

      {/* Phone: bottom tabs */}
      <nav className="gp-tabbar fixed inset-x-0 bottom-0 z-20 flex lg:hidden" aria-label="Main">
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => goTo(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium cursor-pointer ${
              view === id && screen.kind === 'dashboard' ? 'text-bronze' : 'text-slate-500'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>

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
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-[11px] text-slate-600">
                Connected to ExamPrep. You can keep signing in with your ExamPrep password.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
