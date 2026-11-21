import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Download, QrCode, Trophy, Users, Ban, Clock } from 'lucide-react';
import { useToast } from '../Toast';
import {
  classroomApi,
  ExamSummary,
  formatDateTime,
  formatDuration,
  LeaderboardRow,
  Member,
} from '../../services/classroomApi';
import { Modal, PhaseBadge, Spinner, StatTile, dangerButton, inputClass, primaryButton, secondaryButton } from './ui';

interface Props {
  examId: string;
  members: Member[];
  onClose: () => void;
  onChanged: () => void;
}

type Tab = 'results' | 'payment' | 'participants';

function downloadCsv(exam: ExamSummary, rows: LeaderboardRow[]) {
  const header = ['Rank', 'Name', 'Email', 'Score', 'Max', 'Percent', 'Correct', 'Incorrect', 'Unanswered', 'Time (min)', 'Status'];
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.rank, r.name, r.email, r.score, r.maxScore, r.percentage, r.correct, r.incorrect, r.unanswered, r.timeTakenSec ? (r.timeTakenSec / 60).toFixed(1) : '', r.status]
      .map(escape)
      .join(',')
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${exam.title.replace(/[^\w-]+/g, '_')}_results.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export const ExamDetailModal: React.FC<Props> = ({ examId, members, onClose, onChanged }) => {
  const { success, error } = useToast();
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof classroomApi.getExam>> | null>(null);
  const [results, setResults] = useState<Awaited<ReturnType<typeof classroomApi.results>> | null>(null);
  const [tab, setTab] = useState<Tab>('results');
  const [loading, setLoading] = useState(true);

  // payment
  const [qr, setQr] = useState<Awaited<ReturnType<typeof classroomApi.paymentQr>> | null>(null);
  const [utr, setUtr] = useState('');
  const [paying, setPaying] = useState(false);

  // participants editing
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [savingParticipants, setSavingParticipants] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, r] = await Promise.all([classroomApi.getExam(examId), classroomApi.results(examId)]);
      setDetail(d);
      setResults(r);
      setSelected(new Set(d.participants.map((p) => p.id)));
      if (d.exam.status === 'payment_pending') {
        setTab((t) => (t === 'results' ? 'payment' : t));
        classroomApi.paymentQr(examId).then(setQr).catch(() => setQr(null));
      }
    } catch (err: any) {
      error('Could not load exam', err.message);
    } finally {
      setLoading(false);
    }
  }, [examId, error]);

  useEffect(() => {
    load();
  }, [load]);

  const exam = detail?.exam;
  const editable = exam && (exam.phase === 'upcoming' || exam.phase === 'payment_pending');
  const pendingPayment = detail?.payments.find((p) => p.status === 'pending');

  const submitPayment = async () => {
    if (!/^[A-Za-z0-9]{8,22}$/.test(utr.trim())) return error('Invalid UTR', 'Enter the 12-digit UPI reference number.');
    setPaying(true);
    try {
      const res = await classroomApi.submitPayment(examId, utr.trim());
      success('Payment submitted', res.message);
      setUtr('');
      await load();
      onChanged();
    } catch (err: any) {
      error('Payment not submitted', err.message);
    } finally {
      setPaying(false);
    }
  };

  const saveParticipants = async () => {
    if (selected.size === 0) return error('No students selected', 'Select at least one student.');
    setSavingParticipants(true);
    try {
      const res = await classroomApi.updateExam(examId, { participantIds: [...selected] });
      success(
        'Participants updated',
        res.pricing.amountDue > 0 ? `₹${res.pricing.amountDue} is due for ${res.pricing.unpaidSeats} extra student(s).` : 'No payment needed.'
      );
      await load();
      onChanged();
    } catch (err: any) {
      error('Could not update', err.message);
    } finally {
      setSavingParticipants(false);
    }
  };

  const cancelExam = async () => {
    if (!window.confirm('Cancel this exam? Students will no longer see it.')) return;
    try {
      await classroomApi.cancelExam(examId);
      success('Exam cancelled');
      onChanged();
      onClose();
    } catch (err: any) {
      error('Could not cancel', err.message);
    }
  };

  const tabs: { id: Tab; label: string; Icon: any }[] = [
    { id: 'results', label: 'Results', Icon: Trophy },
    { id: 'participants', label: 'Participants', Icon: Users },
  ];
  if (exam && (exam.status === 'payment_pending' || (detail?.payments.length || 0) > 0)) tabs.push({ id: 'payment', label: 'Payment', Icon: QrCode });

  return (
    <Modal wide title={exam?.title || 'Exam'} subtitle={exam ? `${formatDateTime(exam.startsAt)} → ${formatDateTime(exam.endsAt)}` : undefined} onClose={onClose}>
      {loading || !exam ? (
        <Spinner label="Loading exam..." />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <PhaseBadge phase={exam.phase} />
            <span>{exam.questionCount} questions</span>
            <span>•</span>
            <span>{exam.totalMarks} marks</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {exam.durationMinutes} min
            </span>
            <span>•</span>
            <span>{exam.participantCount} students</span>
            <div className="ml-auto flex gap-2">
              <button type="button" className={secondaryButton} onClick={() => { setLoading(true); load(); }}>
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
              {exam.phase !== 'ended' && exam.phase !== 'cancelled' && (
                <button type="button" className={dangerButton} onClick={cancelExam}>
                  <Ban className="h-3.5 w-3.5" /> Cancel exam
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-1 border-b border-white/5">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold cursor-pointer ${
                  tab === id ? 'border-[#C8A96A] text-[#C8A96A]' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {tab === 'results' && results && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Submitted" value={`${results.stats.submitted}/${results.stats.participants}`} tone="gold" />
                <StatTile label="Average" value={results.stats.average} />
                <StatTile label="Highest" value={results.stats.highest} tone="green" />
                <StatTile label="Writing now" value={results.stats.inProgress} />
              </div>

              {results.leaderboard.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-400">
                  {exam.phase === 'upcoming' || exam.phase === 'payment_pending' ? 'Results appear here once students submit.' : 'No submissions yet.'}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full min-w-[560px] text-left text-xs">
                    <thead className="bg-[#1A1A1A] text-[10px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Student</th>
                        <th className="px-3 py-2 text-right">Score</th>
                        <th className="px-3 py-2 text-right">✓ / ✗ / –</th>
                        <th className="px-3 py-2 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.leaderboard.map((r) => (
                        <tr key={r.studentId} className="border-t border-white/5">
                          <td className="px-3 py-2 font-bold text-[#C8A96A] tabular-nums">{r.rank}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-white">{r.name}</div>
                            <div className="text-[10px] text-slate-500">
                              {r.email}
                              {r.status === 'auto_submitted' ? ' • auto-submitted' : ''}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            <span className="font-bold text-white">{r.score}</span>
                            <span className="text-slate-500">/{r.maxScore}</span>
                            <div className="text-[10px] text-slate-500">{r.percentage}%</div>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                            <span className="text-emerald-300">{r.correct}</span> / <span className="text-rose-300">{r.incorrect}</span> / {r.unanswered}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-400">{r.timeTakenSec !== null ? formatDuration(r.timeTakenSec) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {results.absent.length > 0 && (exam.phase === 'live' || exam.phase === 'ended') && (
                <div className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Not started ({results.absent.length}):</span>{' '}
                  {results.absent.map((a) => a.name).join(', ')}
                </div>
              )}

              {results.leaderboard.length > 0 && (
                <button type="button" className={secondaryButton} onClick={() => downloadCsv(exam, results.leaderboard)}>
                  <Download className="h-3.5 w-3.5" /> Download results (CSV)
                </button>
              )}
            </div>
          )}

          {tab === 'participants' && detail && (
            <div className="space-y-3">
              {!editable && (
                <div className="text-[11px] text-slate-400">Participants are locked once the exam starts.</div>
              )}
              <div className="max-h-72 overflow-y-auto rounded-xl border border-white/5 bg-[#0F0F0F]">
                {(editable ? members : members.filter((m) => selected.has(m.id))).map((m) => {
                  const p = detail.participants.find((x) => x.id === m.id);
                  return (
                    <label key={m.id} className={`flex items-center gap-2.5 border-b border-white/5 px-3 py-2 last:border-0 ${editable ? 'cursor-pointer hover:bg-white/[0.03]' : ''}`}>
                      {editable && (
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-[#C8A96A]"
                          checked={selected.has(m.id)}
                          onChange={() =>
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(m.id)) next.delete(m.id);
                              else next.add(m.id);
                              return next;
                            })
                          }
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-white">{m.name}</div>
                        <div className="truncate text-[10px] text-slate-500">{m.email}</div>
                      </div>
                      {p && <span className="shrink-0 text-[10px] text-slate-400">{p.attemptStatus.replace('_', ' ')}</span>}
                    </label>
                  );
                })}
              </div>
              {editable && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    {selected.size} selected • {Math.max(0, selected.size - exam.pricing.seatsPaid) > 0
                      ? `₹${Math.max(0, selected.size - exam.pricing.seatsPaid) * exam.pricing.seatPrice} more due`
                      : `within ${exam.pricing.seatsPaid} paid/free seats`}
                  </span>
                  <button type="button" className={primaryButton} disabled={savingParticipants} onClick={saveParticipants}>
                    {savingParticipants ? 'Saving...' : 'Save participants'}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'payment' && detail && (
            <div className="space-y-4">
              {exam.status === 'payment_pending' ? (
                <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                  <div className="mx-auto flex w-fit flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white p-3">
                    {qr?.qrCodeDataUrl ? <img src={qr.qrCodeDataUrl} alt="UPI payment QR code" className="h-44 w-44" /> : <div className="h-44 w-44" />}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Amount due</div>
                      <div className="text-2xl font-black text-[#C8A96A] font-heading tabular-nums">₹{exam.pricing.amountDue}</div>
                      <div className="text-[11px] text-slate-400">
                        {exam.pricing.unpaidSeats} extra student(s) × ₹{exam.pricing.seatPrice} • first {exam.pricing.freeSeats} free
                      </div>
                    </div>
                    {qr?.upiId && (
                      <div className="text-[11px] text-slate-300">
                        Pay to <span className="font-mono text-white">{qr.upiId}</span> with any UPI app, then enter the UTR below.
                      </div>
                    )}
                    {qr?.upiIntentUri && (
                      <a href={qr.upiIntentUri} className="inline-block text-[11px] font-semibold text-[#C8A96A] hover:underline sm:hidden">
                        Open UPI app →
                      </a>
                    )}
                    {pendingPayment ? (
                      <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 text-[11px] text-sky-100">
                        Payment with UTR <span className="font-mono">{pendingPayment.utr}</span> is awaiting admin verification. The exam is
                        published to students as soon as it is approved.
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input className={`${inputClass} font-mono`} placeholder="12-digit UTR / reference" value={utr} onChange={(e) => setUtr(e.target.value)} maxLength={22} />
                        <button type="button" className={primaryButton} disabled={paying} onClick={submitPayment}>
                          {paying ? '...' : 'Submit'}
                        </button>
                      </div>
                    )}
                    <div className="text-[10px] leading-snug text-slate-500">
                      Prefer not to pay? Reduce participants to {exam.pricing.freeSeats} or fewer in the Participants tab and the exam is published for free.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-100">
                  All {exam.participantCount} seats are covered ({exam.pricing.seatsPaid} free/paid seats).
                </div>
              )}

              {detail.payments.length > 0 && (
                <div className="rounded-xl border border-white/5">
                  {detail.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border-b border-white/5 px-3 py-2 text-[11px] last:border-0">
                      <span className="font-mono text-slate-300">{p.utr}</span>
                      <span className="text-slate-400">₹{p.amount}</span>
                      <span
                        className={
                          p.status === 'approved' ? 'text-emerald-300' : p.status === 'rejected' ? 'text-rose-300' : 'text-amber-300'
                        }
                        title={p.rejectionReason || ''}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
