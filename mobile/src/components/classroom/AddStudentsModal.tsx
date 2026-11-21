import React, { useEffect, useState } from 'react';
import { Copy, Mail, School, Search, CheckCircle2, AlertTriangle, MinusCircle, UserPlus } from 'lucide-react';
import { AddResult, classroomApi, ExamprepStudent } from '../../services/classroomApi';
import { Modal, inputClass, primaryButton, secondaryButton } from './ui';

interface Props {
  classroomId: string;
  classroomName: string;
  joinCode: string;
  onClose: () => void;
  onAdded: () => void;
}

const STATUS_TEXT: Record<AddResult['status'], string> = {
  added: 'Added',
  invited: 'Invited (account created, they sign up with this email)',
  already_member: 'Already in classroom',
  error: 'Not added',
};

function parseEmails(text: string): string[] {
  return [...new Set(text.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

export const AddStudentsModal: React.FC<Props> = ({ classroomId, classroomName, joinCode, onClose, onAdded }) => {
  const [tab, setTab] = useState<'email' | 'examprep' | 'code'>('email');
  const [emailText, setEmailText] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<AddResult[] | null>(null);
  const [errorText, setErrorText] = useState('');
  const [copied, setCopied] = useState(false);

  // ExamPrep directory
  const [directoryEnabled, setDirectoryEnabled] = useState<boolean | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<ExamprepStudent[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    classroomApi
      .examprepStatus()
      .then((s) => setDirectoryEnabled(s.directoryEnabled))
      .catch(() => setDirectoryEnabled(false));
  }, []);

  const finish = (res: AddResult[]) => {
    setResults(res);
    if (res.some((r) => r.status === 'added' || r.status === 'invited')) onAdded();
  };

  const addByEmail = async (source: 'invited' | 'examprep') => {
    const emails = parseEmails(emailText);
    setErrorText('');
    if (emails.length === 0) return setErrorText('Enter at least one email address.');
    if (emails.length > 200) return setErrorText('Add at most 200 emails at a time.');
    setBusy(true);
    try {
      const res = await classroomApi.addMembers(classroomId, emails, source);
      finish(res.results);
      setEmailText('');
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setBusy(false);
    }
  };

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearching(true);
    setErrorText('');
    try {
      const res = await classroomApi.searchExamprep(query);
      setFound(res.students);
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (tab === 'examprep' && directoryEnabled) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, directoryEnabled]);

  const importPicked = async () => {
    if (picked.size === 0) return setErrorText('Select at least one student.');
    setBusy(true);
    setErrorText('');
    try {
      const res = await classroomApi.importExamprep(classroomId, [...picked]);
      finish(res.results);
      setPicked(new Set());
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the code is visible anyway */
    }
  };

  const tabs = [
    { id: 'email', label: 'By email', Icon: Mail },
    { id: 'examprep', label: 'From ExamPrep', Icon: School },
    { id: 'code', label: 'Join code', Icon: UserPlus },
  ] as const;

  return (
    <Modal title="Add Students" subtitle={classroomName} onClose={onClose}>
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl border border-white/5 bg-[#1A1A1A] p-1 text-[11px] font-semibold">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              setResults(null);
              setErrorText('');
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all cursor-pointer ${
              tab === id ? 'bg-[#C8A96A] text-[#0D0D0D]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'email' && (
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed text-slate-400">
            Paste student emails (one per line or comma separated). Existing students are added right away. New emails get an
            account they claim by signing up as a <strong className="text-white">Student</strong> with that email.
          </p>
          <textarea
            className={`${inputClass} min-h-[120px] font-mono`}
            placeholder={'riya@gmail.com\narjun@school.edu'}
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">{parseEmails(emailText).length} email(s)</span>
            <button type="button" className={primaryButton} disabled={busy} onClick={() => addByEmail('invited')}>
              {busy ? 'Adding...' : 'Add Students'}
            </button>
          </div>
        </div>
      )}

      {tab === 'examprep' && (
        <div className="space-y-3">
          {directoryEnabled === null ? (
            <div className="py-6 text-center text-xs text-slate-400">Checking ExamPrep connection...</div>
          ) : directoryEnabled ? (
            <>
              <form onSubmit={search} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input className={`${inputClass} pl-8`} placeholder="Search ExamPrep students by name, email or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <button type="submit" className={secondaryButton} disabled={searching}>
                  {searching ? '...' : 'Search'}
                </button>
              </form>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-white/5 bg-[#0F0F0F]">
                {found.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-slate-400">{searching ? 'Searching…' : 'No ExamPrep students found.'}</div>
                ) : (
                  found.map((s) => (
                    <label key={s.examprepId} className="flex cursor-pointer items-center gap-2.5 border-b border-white/5 px-3 py-2 last:border-0 hover:bg-white/[0.03]">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-[#C8A96A]"
                        checked={picked.has(s.examprepId)}
                        onChange={() =>
                          setPicked((prev) => {
                            const next = new Set(prev);
                            if (next.has(s.examprepId)) next.delete(s.examprepId);
                            else next.add(s.examprepId);
                            return next;
                          })
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-white">{s.name}</div>
                        <div className="truncate text-[10px] text-slate-500">
                          {s.email}
                          {s.classLevel ? ` • Class ${s.classLevel}` : ''}
                        </div>
                      </div>
                      {s.qpgUserId && <span className="text-[9px] font-semibold uppercase text-emerald-400/80">in QPG</span>}
                    </label>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{picked.size} selected</span>
                <button type="button" className={primaryButton} disabled={busy || picked.size === 0} onClick={importPicked}>
                  {busy ? 'Importing...' : 'Import to Classroom'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-[11px] leading-relaxed text-slate-300">
                Enter the emails your students use on <strong className="text-white">ExamPrep</strong>. They sign in to this app as a
                Student with their ExamPrep email and password; their account connects automatically and this classroom appears.
              </div>
              <textarea
                className={`${inputClass} min-h-[110px] font-mono`}
                placeholder={'student1@gmail.com\nstudent2@gmail.com'}
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">{parseEmails(emailText).length} email(s)</span>
                <button type="button" className={primaryButton} disabled={busy} onClick={() => addByEmail('examprep')}>
                  {busy ? 'Adding...' : 'Add ExamPrep Students'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'code' && (
        <div className="space-y-3 text-center">
          <p className="text-[11px] text-slate-400">Share this code. Students enter it in their portal under “Join a classroom”.</p>
          <div className="mx-auto inline-flex items-center gap-3 rounded-2xl border border-[#C8A96A]/30 bg-[#C8A96A]/5 px-6 py-4">
            <span className="font-mono text-2xl font-black tracking-[0.3em] text-[#C8A96A]">{joinCode}</span>
            <button type="button" onClick={copyCode} className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 cursor-pointer" aria-label="Copy join code">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="text-[11px] text-emerald-300 h-4">{copied ? 'Copied!' : ''}</div>
        </div>
      )}

      {errorText && <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">{errorText}</div>}

      {results && (
        <div className="mt-4 max-h-48 overflow-y-auto rounded-xl border border-white/5 bg-[#0F0F0F]">
          {results.map((r) => (
            <div key={r.email} className="flex items-start gap-2 border-b border-white/5 px-3 py-2 text-[11px] last:border-0">
              {r.status === 'error' ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
              ) : r.status === 'already_member' ? (
                <MinusCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              )}
              <div className="min-w-0">
                <div className="truncate text-white">{r.name ? `${r.name} — ${r.email}` : r.email}</div>
                <div className="text-slate-500">{r.message || STATUS_TEXT[r.status]}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
