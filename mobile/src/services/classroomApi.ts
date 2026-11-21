// API client for online classrooms (teacher) and the student exam portal.
// Unlike parts of apiClient.ts there is no offline fallback here: exams must hit the real server.
import { api, API_BASE_URL } from './apiClient';

export class ApiError extends Error {
  code?: string;
  status?: number;
  data?: any;
}

async function request<T = any>(endpoint: string, options: { method?: string; body?: any } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = api.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    const err = new ApiError('Could not reach the server. Check your internet connection.');
    err.code = 'NETWORK';
    throw err;
  }

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : {};
  if (!response.ok) {
    const err = new ApiError(data.message || `Request failed (${response.status})`);
    err.code = data.error;
    err.status = response.status;
    err.data = data;
    throw err;
  }
  if (!isJson) {
    const err = new ApiError('The server returned an unexpected response. Is the backend API deployed?');
    err.code = 'BAD_RESPONSE';
    throw err;
  }
  return data as T;
}

// ------------------------------------------------------------------ types

export type ExamPhase = 'payment_pending' | 'cancelled' | 'upcoming' | 'live' | 'ended';

export interface Pricing {
  freeSeats: number;
  seatPrice: number;
  participantCount: number;
  seatsPaid: number;
  extraSeats: number;
  unpaidSeats: number;
  amountDue: number;
  totalCost: number;
}

export interface ClassroomSummary {
  id: string;
  name: string;
  description: string;
  subject: string | null;
  joinCode: string;
  memberCount: number;
  examCount: number;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  classLevel: string | null;
  source: 'qpg' | 'examprep' | 'invited';
  examprepLinked: boolean;
  activated: boolean;
  addedVia: string;
  joinedAt: string;
}

export interface ExamSummary {
  id: string;
  classroomId: string;
  title: string;
  instructions: string;
  examType: string;
  subject: string;
  questionCount: number;
  totalMarks: number;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  showResults: 'after_submit' | 'after_end' | 'never';
  shuffleQuestions: boolean;
  status: 'payment_pending' | 'scheduled' | 'cancelled';
  phase: ExamPhase;
  participantCount: number;
  submittedCount: number;
  pricing: Pricing;
  createdAt: string;
}

export interface ExamprepStudent {
  examprepId: string;
  name: string;
  email: string;
  phone?: string;
  classLevel?: string;
  qpgUserId: string | null;
}

export interface AddResult {
  email: string;
  name?: string;
  status: 'added' | 'invited' | 'already_member' | 'error';
  message?: string;
}

export interface LeaderboardRow {
  rank: number;
  studentId: string;
  name: string;
  email: string;
  status: string;
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  timeTakenSec: number | null;
  submittedAt: string | null;
}

export interface StudentExam {
  id: string;
  classroomId: string;
  classroomName?: string;
  title: string;
  instructions: string;
  examType: string;
  subject: string;
  questionCount: number;
  totalMarks: number;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  showResults: string;
  phase: ExamPhase;
  attempt: {
    status: 'not_started' | 'in_progress' | 'submitted' | 'auto_submitted';
    startedAt?: string;
    deadlineAt?: string;
    submittedAt?: string | null;
    resultVisible?: boolean;
    score?: number | null;
    maxScore?: number | null;
  };
}

export interface ExamQuestion {
  id: string;
  number: number;
  displayNumber: number;
  kind: 'mcq' | 'numerical';
  marks: number;
  negative: number;
  question?: string;
  opt_a?: string;
  opt_b?: string;
  opt_c?: string;
  opt_d?: string;
  assertion?: string;
  reason?: string;
  statement_1?: string;
  statement_2?: string;
  match_table?: { col1: string; col2: string }[];
  column_a?: string;
  column_b?: string;
  diagram_svg?: string;
  q_type?: string;
  chapter?: string;
}

export interface AnswerEntry {
  option?: string;
  value?: string;
  marked?: boolean;
}

export interface ExamSession {
  exam: StudentExam;
  attempt: { id: string; status: string; startedAt: string; deadlineAt: string; answers: Record<string, AnswerEntry> };
  serverNow: string;
  sections: { name: string; description: string; attemptCount: number; marksPerQuestion: number; negativeMarking: number; questionIds: string[] }[];
  questions: ExamQuestion[];
}

// ------------------------------------------------------------------ teacher

export const classroomApi = {
  pricing: () => request<{ freeSeats: number; seatPrice: number }>('/classrooms/pricing'),
  list: () => request<{ classrooms: ClassroomSummary[] }>('/classrooms'),
  create: (name: string, description: string) =>
    request<{ classroom: ClassroomSummary }>('/classrooms', { method: 'POST', body: { name, description } }),
  get: (id: string) =>
    request<{ classroom: ClassroomSummary; members: Member[]; exams: ExamSummary[]; pricing: { freeSeats: number; seatPrice: number } }>(
      `/classrooms/${id}`
    ),
  update: (id: string, body: { name?: string; description?: string; regenerateCode?: boolean }) =>
    request(`/classrooms/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => request(`/classrooms/${id}`, { method: 'DELETE' }),
  addMembers: (id: string, emails: string[], source: 'invited' | 'examprep' = 'invited') =>
    request<{ results: AddResult[] }>(`/classrooms/${id}/members`, { method: 'POST', body: { emails, source } }),
  removeMember: (id: string, studentId: string) => request(`/classrooms/${id}/members/${studentId}`, { method: 'DELETE' }),
  examprepStatus: () => request<{ directoryEnabled: boolean; apiUrl: string }>('/classrooms/examprep/status'),
  searchExamprep: (q: string) =>
    request<{ students: ExamprepStudent[] }>(`/classrooms/examprep/students?q=${encodeURIComponent(q)}`),
  importExamprep: (id: string, examprepIds: string[]) =>
    request<{ results: AddResult[] }>(`/classrooms/${id}/import-examprep`, { method: 'POST', body: { examprepIds } }),

  createExam: (classroomId: string, body: any) =>
    request<{ exam: ExamSummary; pricing: Pricing; message: string }>(`/classrooms/${classroomId}/exams`, { method: 'POST', body }),
  getExam: (examId: string) =>
    request<{ exam: ExamSummary & { paper: any }; participants: { id: string; name: string; email: string; activated: boolean; attemptStatus: string }[]; payments: { id: string; utr: string; amount: number; status: string; rejectionReason?: string; createdAt: string }[] }>(
      `/classrooms/exams/${examId}`
    ),
  updateExam: (examId: string, body: any) =>
    request<{ exam: ExamSummary; pricing: Pricing }>(`/classrooms/exams/${examId}`, { method: 'PATCH', body }),
  cancelExam: (examId: string) => request(`/classrooms/exams/${examId}/cancel`, { method: 'POST' }),
  results: (examId: string) =>
    request<{
      exam: ExamSummary;
      stats: { participants: number; submitted: number; inProgress: number; absent: number; average: number; highest: number; lowest: number };
      leaderboard: LeaderboardRow[];
      inProgress: { studentId: string; name: string; deadlineAt: string }[];
      absent: { studentId: string; name: string; email: string }[];
    }>(`/classrooms/exams/${examId}/results`),
  paymentQr: (examId: string) =>
    request<{ amount: number; pricing: Pricing; upiId?: string; payeeName?: string; upiIntentUri?: string; qrCodeDataUrl?: string }>(
      `/classrooms/exams/${examId}/payment-qr`
    ),
  submitPayment: (examId: string, utr: string) =>
    request<{ message: string }>(`/classrooms/exams/${examId}/submit-payment`, { method: 'POST', body: { utr } }),
};

// ------------------------------------------------------------------ student

export const studentApi = {
  classrooms: () =>
    request<{ classrooms: { id: string; name: string; description: string; subject: string | null; teacherName: string | null; joinedAt: string }[] }>(
      '/student/classrooms'
    ),
  join: (code: string) =>
    request<{ alreadyMember: boolean; classroom: { id: string; name: string } }>('/student/classrooms/join', { method: 'POST', body: { code } }),
  exams: () => request<{ exams: StudentExam[]; serverNow: string }>('/student/exams'),
  start: (examId: string) => request<ExamSession>(`/student/exams/${examId}/start`, { method: 'POST' }),
  save: (examId: string, answers: Record<string, AnswerEntry>) =>
    request<{ savedAt: string; answered: number }>(`/student/exams/${examId}/answers`, { method: 'PUT', body: { answers } }),
  submit: (examId: string, answers: Record<string, AnswerEntry>) =>
    request<{ status: string; resultVisible: boolean; score?: number; maxScore?: number; message: string }>(
      `/student/exams/${examId}/submit`,
      { method: 'POST', body: { answers } }
    ),
  result: (examId: string) => request<any>(`/student/exams/${examId}/result`),
  updateProfile: (body: { name?: string; classLevel?: string; phone?: string }) =>
    request<{ user: any }>('/auth/profile', { method: 'PUT', body }),
};

// ------------------------------------------------------------------ helpers

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Value for <input type="datetime-local"> in the viewer's local time. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const PHASE_LABEL: Record<ExamPhase, string> = {
  payment_pending: 'Payment pending',
  cancelled: 'Cancelled',
  upcoming: 'Upcoming',
  live: 'Live now',
  ended: 'Ended',
};

export const PHASE_STYLE: Record<ExamPhase, string> = {
  payment_pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  cancelled: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  upcoming: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  live: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  ended: 'bg-white/5 text-slate-300 border-white/10',
};
