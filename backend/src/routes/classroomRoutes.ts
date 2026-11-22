/**
 * Teacher side of online classrooms: classrooms, members (email / ExamPrep / join code),
 * online exams built from QPG papers, per-exam seat payments and results.
 * Mounted at /api/classrooms.
 */
import { Router, Response } from 'express';
import QRCode from 'qrcode';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { classroomStore, Classroom, ClassroomExam, ShowResults } from '../db/classroomStore';
import { db } from '../db/database';
import { config } from '../config';
import { PaymentRequest, User } from '../types';
import { ensureStudentAccount } from '../services/studentAccountService';
import {
  examprepDirectoryEnabled,
  getExamprepStudentsByIds,
  searchExamprepStudents,
} from '../services/examprepService';
import {
  attemptExpired,
  examPhase,
  examPricing,
  finalizeAttemptRecord,
  preparePaperForExam,
} from '../services/examService';

const router = Router();
router.use(authMiddleware, requireRole('teacher', 'admin'));

// Same payee as the subscription checkout so teachers pay one familiar UPI ID.
const UPI_ID = 'exam@okaxis';
const UPI_PAYEE = 'Manchester Technologies';
const SHOW_RESULTS: ShowResults[] = ['after_submit', 'after_end', 'never'];
const MAX_EMAILS_PER_REQUEST = 200;

const JOIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newJoinCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += JOIN_ALPHABET[Math.floor(Math.random() * JOIN_ALPHABET.length)];
  return code;
}

const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

function memberView(user: User | undefined, member: { student_id: string; added_via: string; joined_at: string }) {
  return {
    id: member.student_id,
    name: user?.name || '(unknown)',
    email: user?.email || '',
    classLevel: user?.class_level || null,
    source: user?.source || 'qpg',
    examprepLinked: !!user?.examprep_id,
    activated: !!user?.password, // has signed in / set a password at least once
    addedVia: member.added_via,
    joinedAt: member.joined_at,
  };
}

async function loadOwnedClassroom(req: AuthenticatedRequest, res: Response, id: string): Promise<Classroom | null> {
  const classroom = await classroomStore.getClassroom(id);
  if (!classroom || (classroom.teacher_id !== req.user!.id && req.user!.role !== 'admin')) {
    res.status(404).json({ error: 'CLASSROOM_NOT_FOUND', message: 'Classroom not found.' });
    return null;
  }
  return classroom;
}

async function loadOwnedExam(req: AuthenticatedRequest, res: Response, id: string): Promise<ClassroomExam | null> {
  const exam = await classroomStore.getExam(id);
  if (!exam || (exam.teacher_id !== req.user!.id && req.user!.role !== 'admin')) {
    res.status(404).json({ error: 'EXAM_NOT_FOUND', message: 'Exam not found.' });
    return null;
  }
  return exam;
}

function parseEmails(raw: any): string[] {
  const list: string[] = Array.isArray(raw) ? raw : String(raw || '').split(/[\s,;]+/);
  return [...new Set(list.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
}

function examSummary(e: ClassroomExam & { participant_count?: number; submitted_count?: number }) {
  const participants = e.participant_count ?? 0;
  return {
    id: e.id,
    classroomId: e.classroom_id,
    title: e.title,
    instructions: e.instructions,
    examType: e.exam_type,
    subject: e.subject,
    questionCount: e.question_count,
    totalMarks: e.total_marks,
    durationMinutes: e.duration_minutes,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    showResults: e.show_results,
    shuffleQuestions: e.shuffle_questions,
    status: e.status,
    phase: examPhase(e),
    participantCount: participants,
    submittedCount: e.submitted_count ?? 0,
    pricing: examPricing(participants, e.seats_paid),
    createdAt: e.created_at,
  };
}

/** Parses and validates the timing fields shared by create and update. */
function parseTiming(body: any, current?: ClassroomExam):
  | { ok: true; startsAt: Date; endsAt: Date; duration: number }
  | { ok: false; message: string } {
  const duration = Number(body.durationMinutes ?? current?.duration_minutes);
  if (!Number.isFinite(duration) || duration < 1 || duration > 600) {
    return { ok: false, message: 'Duration must be between 1 and 600 minutes.' };
  }
  const startsAt = body.startsAt ? new Date(body.startsAt) : current ? new Date(current.starts_at) : new Date();
  if (isNaN(startsAt.getTime())) return { ok: false, message: 'Invalid start time.' };
  const endsAt = body.endsAt
    ? new Date(body.endsAt)
    : current && !body.startsAt && body.durationMinutes === undefined
      ? new Date(current.ends_at)
      : new Date(startsAt.getTime() + duration * 60 * 1000);
  if (isNaN(endsAt.getTime())) return { ok: false, message: 'Invalid end time.' };
  if (endsAt.getTime() < startsAt.getTime() + duration * 60 * 1000) {
    return { ok: false, message: 'The exam window must be at least as long as the duration.' };
  }
  if (endsAt.getTime() - startsAt.getTime() > 30 * 24 * 60 * 60 * 1000) {
    return { ok: false, message: 'The exam window can be at most 30 days.' };
  }
  return { ok: true, startsAt, endsAt, duration: Math.round(duration) };
}

// ------------------------------------------------------------------ meta

router.get('/pricing', (_req, res) => {
  res.json({ success: true, freeSeats: config.freeExamSeats, seatPrice: config.examSeatPrice, currency: 'INR' });
});

router.get('/examprep/status', (_req, res) => {
  res.json({
    success: true,
    apiUrl: config.examprep.apiUrl,
    directoryEnabled: examprepDirectoryEnabled(),
    loginBridge: true,
  });
});

router.get('/examprep/students', async (req: AuthenticatedRequest, res: Response) => {
  if (!examprepDirectoryEnabled()) {
    return res.status(501).json({
      error: 'EXAMPREP_DIRECTORY_DISABLED',
      message: 'ExamPrep student search is not configured on the server. Add students by their ExamPrep email instead.',
    });
  }
  try {
    const students = await searchExamprepStudents(String(req.query.q || ''), Number(req.query.limit) || 30);
    const local = await Promise.all(students.map((s) => db.findUserByEmail(s.email)));
    return res.json({
      success: true,
      students: students.map((s, i) => ({ ...s, qpgUserId: local[i]?.role === 'student' ? local[i]!.id : null })),
    });
  } catch (err: any) {
    console.error('ExamPrep search failed:', err.message);
    return res.status(502).json({ error: 'EXAMPREP_UNAVAILABLE', message: 'Could not reach the ExamPrep database.' });
  }
});

// ------------------------------------------------------------------ classrooms

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const classrooms = await classroomStore.listClassroomsByTeacher(req.user!.id);
  res.json({
    success: true,
    classrooms: classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      subject: c.subject,
      joinCode: c.join_code,
      memberCount: c.member_count,
      examCount: c.exam_count,
      createdAt: c.created_at,
    })),
  });
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const name = String(req.body?.name || '').trim();
  if (name.length < 2) return res.status(400).json({ error: 'INVALID_NAME', message: 'Give the classroom a name (at least 2 characters).' });
  const now = new Date().toISOString();
  for (let tries = 0; tries < 6; tries++) {
    const classroom: Classroom = {
      id: newId('cls'),
      teacher_id: req.user!.id,
      name: name.slice(0, 160),
      description: String(req.body?.description || '').trim().slice(0, 1000),
      subject: req.user!.subject || null,
      join_code: newJoinCode(),
      created_at: now,
      updated_at: now,
    };
    try {
      await classroomStore.createClassroom(classroom);
      await db.logAudit('CLASSROOM_CREATED', req.user!.email, { classroomId: classroom.id, name: classroom.name });
      return res.status(201).json({
        success: true,
        classroom: { id: classroom.id, name: classroom.name, description: classroom.description, subject: classroom.subject, joinCode: classroom.join_code, memberCount: 0, examCount: 0, createdAt: now },
      });
    } catch (err: any) {
      if (err.code !== '23505') throw err; // join code collision: retry with a new code
    }
  }
  return res.status(500).json({ error: 'JOIN_CODE_FAILED', message: 'Could not generate a join code. Try again.' });
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const classroom = await loadOwnedClassroom(req, res, String(req.params.id));
  if (!classroom) return;
  const [members, exams] = await Promise.all([
    classroomStore.listMembers(classroom.id),
    classroomStore.listExamsByClassroom(classroom.id),
  ]);
  const users = await db.findUsersByIds(members.map((m) => m.student_id));
  const byId = new Map(users.map((u) => [u.id, u]));
  res.json({
    success: true,
    classroom: {
      id: classroom.id,
      name: classroom.name,
      description: classroom.description,
      subject: classroom.subject,
      joinCode: classroom.join_code,
      createdAt: classroom.created_at,
    },
    members: members.map((m) => memberView(byId.get(m.student_id), m)),
    exams: exams.map(examSummary),
    pricing: { freeSeats: config.freeExamSeats, seatPrice: config.examSeatPrice },
  });
});

router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const classroom = await loadOwnedClassroom(req, res, String(req.params.id));
  if (!classroom) return;
  if (req.body?.name !== undefined) {
    const name = String(req.body.name).trim();
    if (name.length < 2) return res.status(400).json({ error: 'INVALID_NAME', message: 'Name is too short.' });
    classroom.name = name.slice(0, 160);
  }
  if (req.body?.description !== undefined) classroom.description = String(req.body.description).trim().slice(0, 1000);
  if (req.body?.regenerateCode) classroom.join_code = newJoinCode();
  await classroomStore.updateClassroom(classroom);
  res.json({ success: true, classroom: { id: classroom.id, name: classroom.name, description: classroom.description, joinCode: classroom.join_code } });
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const classroom = await loadOwnedClassroom(req, res, String(req.params.id));
  if (!classroom) return;
  await classroomStore.deleteClassroom(classroom.id);
  await db.logAudit('CLASSROOM_DELETED', req.user!.email, { classroomId: classroom.id });
  res.json({ success: true });
});

// ------------------------------------------------------------------ members

/** Add students by email. Unknown emails get an invite placeholder they claim at sign-up. */
router.post('/:id/members', async (req: AuthenticatedRequest, res: Response) => {
  const classroom = await loadOwnedClassroom(req, res, String(req.params.id));
  if (!classroom) return;
  const emails = parseEmails(req.body?.emails);
  if (emails.length === 0) return res.status(400).json({ error: 'NO_EMAILS', message: 'Enter at least one student email.' });
  if (emails.length > MAX_EMAILS_PER_REQUEST) {
    return res.status(400).json({ error: 'TOO_MANY', message: `Add at most ${MAX_EMAILS_PER_REQUEST} emails at a time.` });
  }
  const source = req.body?.source === 'examprep' ? 'examprep' : 'invited';
  const results = [];
  for (const email of emails) {
    const ensured = await ensureStudentAccount({ email, source });
    if (!ensured.ok) {
      results.push({ email, status: 'error', message: ensured.error });
      continue;
    }
    const added = await classroomStore.addMember(classroom.id, ensured.user.id, source === 'examprep' ? 'examprep' : 'email');
    results.push({
      email,
      status: added ? (ensured.created ? 'invited' : 'added') : 'already_member',
      studentId: ensured.user.id,
    });
  }
  await db.logAudit('CLASSROOM_MEMBERS_ADDED', req.user!.email, { classroomId: classroom.id, count: results.filter((r) => r.status !== 'error').length });
  res.json({ success: true, results });
});

/** Import students picked from the ExamPrep directory (requires EXAMPREP_MONGO_URI). */
router.post('/:id/import-examprep', async (req: AuthenticatedRequest, res: Response) => {
  const classroom = await loadOwnedClassroom(req, res, String(req.params.id));
  if (!classroom) return;
  const ids: string[] = Array.isArray(req.body?.examprepIds) ? req.body.examprepIds.map(String).slice(0, MAX_EMAILS_PER_REQUEST) : [];
  if (ids.length === 0) return res.status(400).json({ error: 'NO_STUDENTS', message: 'Select at least one ExamPrep student.' });
  if (!examprepDirectoryEnabled()) {
    return res.status(501).json({ error: 'EXAMPREP_DIRECTORY_DISABLED', message: 'ExamPrep student search is not configured on the server.' });
  }
  let students;
  try {
    students = await getExamprepStudentsByIds(ids);
  } catch (err: any) {
    console.error('ExamPrep import failed:', err.message);
    return res.status(502).json({ error: 'EXAMPREP_UNAVAILABLE', message: 'Could not reach the ExamPrep database.' });
  }
  const results = [];
  for (const s of students) {
    const ensured = await ensureStudentAccount({
      email: s.email,
      name: s.name,
      source: 'examprep',
      examprepId: s.examprepId,
      phone: s.phone,
      classLevel: s.classLevel,
    });
    if (!ensured.ok) {
      results.push({ email: s.email, name: s.name, status: 'error', message: ensured.error });
      continue;
    }
    const added = await classroomStore.addMember(classroom.id, ensured.user.id, 'examprep');
    results.push({ email: s.email, name: s.name, status: added ? 'added' : 'already_member', studentId: ensured.user.id });
  }
  await db.logAudit('CLASSROOM_EXAMPREP_IMPORT', req.user!.email, { classroomId: classroom.id, count: results.length });
  res.json({ success: true, results });
});

router.delete('/:id/members/:studentId', async (req: AuthenticatedRequest, res: Response) => {
  const classroom = await loadOwnedClassroom(req, res, String(req.params.id));
  if (!classroom) return;
  const removed = await classroomStore.removeMember(classroom.id, String(req.params.studentId));
  res.json({ success: true, removed });
});

// ------------------------------------------------------------------ exams

router.post('/:id/exams', async (req: AuthenticatedRequest, res: Response) => {
  const classroom = await loadOwnedClassroom(req, res, String(req.params.id));
  if (!classroom) return;
  const body = req.body || {};

  let paper = body.paper;
  if (!paper && body.draftId) {
    const draft = db.getPaperDraftById(String(body.draftId));
    if (!draft || draft.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'DRAFT_NOT_FOUND', message: 'Saved paper not found.' });
    }
    paper = draft.paper;
  }
  const prepared = preparePaperForExam(paper);
  if (!prepared.ok) return res.status(400).json({ error: 'INVALID_PAPER', message: prepared.error });

  const timing = parseTiming(body);
  if (!timing.ok) return res.status(400).json({ error: 'INVALID_TIMING', message: timing.message });
  if (timing.endsAt.getTime() <= Date.now()) {
    return res.status(400).json({ error: 'INVALID_TIMING', message: 'The exam window has already ended. Pick a later time.' });
  }

  const members = await classroomStore.listMembers(classroom.id);
  const memberIds = new Set(members.map((m) => m.student_id));
  const requested: string[] =
    body.participantIds === 'all' || body.participantIds === undefined
      ? [...memberIds]
      : Array.isArray(body.participantIds)
        ? [...new Set<string>(body.participantIds.map(String))]
        : [];
  const participantIds = requested.filter((id) => memberIds.has(id));
  if (participantIds.length === 0) {
    return res.status(400).json({ error: 'NO_PARTICIPANTS', message: 'Select at least one student from this classroom.' });
  }

  const pricing = examPricing(participantIds.length, config.freeExamSeats);
  const title = String(body.title || prepared.paper.title || 'Online Exam').trim().slice(0, 255);
  const now = new Date().toISOString();
  const exam: ClassroomExam = {
    id: newId('exm'),
    classroom_id: classroom.id,
    teacher_id: req.user!.id,
    title,
    instructions: String(body.instructions || (prepared.paper.instructions || []).join('\n')).slice(0, 4000),
    paper: prepared.paper,
    exam_type: String(prepared.paper.exam_type || ''),
    subject: String(prepared.paper.subject || req.user!.subject || ''),
    question_count: prepared.questionCount,
    total_marks: prepared.totalMarks,
    duration_minutes: timing.duration,
    starts_at: timing.startsAt.toISOString(),
    ends_at: timing.endsAt.toISOString(),
    show_results: SHOW_RESULTS.includes(body.showResults) ? body.showResults : 'after_submit',
    shuffle_questions: !!body.shuffleQuestions,
    status: pricing.amountDue > 0 ? 'payment_pending' : 'scheduled',
    seats_paid: config.freeExamSeats,
    created_at: now,
    updated_at: now,
  };
  await classroomStore.createExam(exam, participantIds);
  await db.logAudit('CLASSROOM_EXAM_CREATED', req.user!.email, {
    examId: exam.id,
    classroomId: classroom.id,
    participants: participantIds.length,
    amountDue: pricing.amountDue,
  });

  res.status(201).json({
    success: true,
    exam: examSummary({ ...exam, participant_count: participantIds.length, submitted_count: 0 }),
    pricing,
    dropped: prepared.dropped,
    message:
      (pricing.amountDue > 0
        ? `Exam saved. ${pricing.extraSeats} students above the free ${pricing.freeSeats} cost ₹${pricing.amountDue}. Pay to publish it to students.`
        : 'Exam scheduled. Students will see it in their portal.') +
      (prepared.dropped > 0 ? ` ${prepared.dropped} question(s) with errors were left out.` : ''),
  });
});

router.get('/exams/:examId', async (req: AuthenticatedRequest, res: Response) => {
  const exam = await loadOwnedExam(req, res, String(req.params.examId));
  if (!exam) return;
  const [participantIds, attempts] = await Promise.all([
    classroomStore.listParticipantIds(exam.id),
    classroomStore.listAttempts(exam.id),
  ]);
  const users = await db.findUsersByIds(participantIds);
  const byAttempt = new Map(attempts.map((a) => [a.student_id, a]));
  const payments = db.getPaymentRequests().filter((p) => p.exam_id === exam.id);
  res.json({
    success: true,
    exam: { ...examSummary({ ...exam, participant_count: participantIds.length, submitted_count: attempts.filter((a) => a.status !== 'in_progress').length }), paper: exam.paper },
    participants: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      activated: !!u.password,
      attemptStatus: byAttempt.get(u.id)?.status || 'not_started',
    })),
    payments: payments.map((p) => ({ id: p.id, utr: p.utr, amount: p.amount, status: p.status, rejectionReason: p.rejection_reason, createdAt: p.created_at })),
  });
});

router.patch('/exams/:examId', async (req: AuthenticatedRequest, res: Response) => {
  const exam = await loadOwnedExam(req, res, String(req.params.examId));
  if (!exam) return;
  const phase = examPhase(exam);
  if (phase !== 'upcoming' && phase !== 'payment_pending') {
    return res.status(409).json({ error: 'EXAM_LOCKED', message: 'An exam can only be edited before it starts.' });
  }
  const body = req.body || {};
  const timing = parseTiming(body, exam);
  if (!timing.ok) return res.status(400).json({ error: 'INVALID_TIMING', message: timing.message });

  if (body.title !== undefined) exam.title = String(body.title).trim().slice(0, 255) || exam.title;
  if (body.instructions !== undefined) exam.instructions = String(body.instructions).slice(0, 4000);
  if (SHOW_RESULTS.includes(body.showResults)) exam.show_results = body.showResults;
  if (body.shuffleQuestions !== undefined) exam.shuffle_questions = !!body.shuffleQuestions;
  exam.duration_minutes = timing.duration;
  exam.starts_at = timing.startsAt.toISOString();
  exam.ends_at = timing.endsAt.toISOString();

  let participantCount = (await classroomStore.listParticipantIds(exam.id)).length;
  if (Array.isArray(body.participantIds)) {
    const members = new Set((await classroomStore.listMembers(exam.classroom_id)).map((m) => m.student_id));
    const ids = [...new Set<string>(body.participantIds.map(String))].filter((id) => members.has(id));
    if (ids.length === 0) return res.status(400).json({ error: 'NO_PARTICIPANTS', message: 'Select at least one student.' });
    await classroomStore.setParticipants(exam.id, ids);
    participantCount = ids.length;
  }

  const pricing = examPricing(participantCount, exam.seats_paid);
  exam.status = pricing.amountDue > 0 ? 'payment_pending' : 'scheduled';
  await classroomStore.updateExam(exam);
  res.json({ success: true, exam: examSummary({ ...exam, participant_count: participantCount, submitted_count: 0 }), pricing });
});

router.post('/exams/:examId/cancel', async (req: AuthenticatedRequest, res: Response) => {
  const exam = await loadOwnedExam(req, res, String(req.params.examId));
  if (!exam) return;
  if (examPhase(exam) === 'ended') return res.status(409).json({ error: 'EXAM_ENDED', message: 'This exam has already ended.' });
  exam.status = 'cancelled';
  await classroomStore.updateExam(exam);
  await db.logAudit('CLASSROOM_EXAM_CANCELLED', req.user!.email, { examId: exam.id });
  res.json({ success: true });
});

router.get('/exams/:examId/results', async (req: AuthenticatedRequest, res: Response) => {
  const exam = await loadOwnedExam(req, res, String(req.params.examId));
  if (!exam) return;
  const participantIds = await classroomStore.listParticipantIds(exam.id);
  let attempts = await classroomStore.listAttempts(exam.id);

  // Close attempts whose time ran out without a submit, so the leaderboard is complete.
  for (const a of attempts.filter((x) => attemptExpired(x))) {
    await classroomStore.finalizeAttempt(finalizeAttemptRecord(exam, a, true));
  }
  if (attempts.some((x) => attemptExpired(x))) attempts = await classroomStore.listAttempts(exam.id);

  const users = await db.findUsersByIds(participantIds);
  const byId = new Map(users.map((u) => [u.id, u]));
  const finished = attempts
    .filter((a) => a.status !== 'in_progress')
    .map((a) => ({
      studentId: a.student_id,
      name: byId.get(a.student_id)?.name || '(removed)',
      email: byId.get(a.student_id)?.email || '',
      status: a.status,
      score: a.score ?? 0,
      maxScore: a.max_score ?? exam.total_marks,
      correct: a.correct ?? 0,
      incorrect: a.incorrect ?? 0,
      unanswered: a.unanswered ?? 0,
      percentage: a.result?.percentage ?? 0,
      timeTakenSec: a.submitted_at ? Math.max(0, Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 1000)) : null,
      submittedAt: a.submitted_at,
      sections: a.result?.sections || [],
    }))
    .sort((x, y) => y.score - x.score || (x.timeTakenSec ?? 0) - (y.timeTakenSec ?? 0));

  let rank = 0;
  let prevScore: number | null = null;
  finished.forEach((r: any, i) => {
    if (prevScore === null || r.score !== prevScore) rank = i + 1;
    r.rank = rank;
    prevScore = r.score;
  });

  const startedIds = new Set(attempts.map((a) => a.student_id));
  const inProgress = attempts.filter((a) => a.status === 'in_progress').map((a) => ({ studentId: a.student_id, name: byId.get(a.student_id)?.name || '', deadlineAt: a.deadline_at }));
  const absent = participantIds.filter((id) => !startedIds.has(id)).map((id) => ({ studentId: id, name: byId.get(id)?.name || '', email: byId.get(id)?.email || '' }));
  const scores = finished.map((f) => f.score);

  res.json({
    success: true,
    exam: examSummary({ ...exam, participant_count: participantIds.length, submitted_count: finished.length }),
    stats: {
      participants: participantIds.length,
      submitted: finished.length,
      inProgress: inProgress.length,
      absent: absent.length,
      average: scores.length ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100 : 0,
      highest: scores.length ? Math.max(...scores) : 0,
      lowest: scores.length ? Math.min(...scores) : 0,
    },
    leaderboard: finished,
    inProgress,
    absent,
  });
});

// ------------------------------------------------------------------ seat payments

router.get('/exams/:examId/payment-qr', async (req: AuthenticatedRequest, res: Response) => {
  const exam = await loadOwnedExam(req, res, String(req.params.examId));
  if (!exam) return;
  const participantCount = (await classroomStore.listParticipantIds(exam.id)).length;
  const pricing = examPricing(participantCount, exam.seats_paid);
  if (pricing.amountDue <= 0) {
    return res.json({ success: true, pricing, amount: 0, message: 'Nothing to pay for this exam.' });
  }
  const note = `QPG exam seats ${pricing.unpaidSeats}x${pricing.seatPrice} ${exam.id}`;
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_PAYEE)}&am=${pricing.amountDue}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrCodeDataUrl = await QRCode.toDataURL(upiIntentUri, { errorCorrectionLevel: 'M', margin: 2, width: 300 });
  res.json({ success: true, pricing, amount: pricing.amountDue, upiId: UPI_ID, payeeName: UPI_PAYEE, upiIntentUri, qrCodeDataUrl });
});

router.post('/exams/:examId/submit-payment', async (req: AuthenticatedRequest, res: Response) => {
  const exam = await loadOwnedExam(req, res, String(req.params.examId));
  if (!exam) return;
  const utr = String(req.body?.utr || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{8,22}$/.test(utr)) {
    return res.status(400).json({ error: 'INVALID_UTR', message: 'Enter the 12-digit UPI reference (UTR) from your payment app.' });
  }
  const participantCount = (await classroomStore.listParticipantIds(exam.id)).length;
  const pricing = examPricing(participantCount, exam.seats_paid);
  if (pricing.amountDue <= 0) return res.status(400).json({ error: 'NOTHING_DUE', message: 'Nothing is due for this exam.' });

  const pending = db.getPaymentRequests('pending').find((p) => p.exam_id === exam.id);
  if (pending) {
    return res.status(409).json({ error: 'PAYMENT_PENDING', message: 'A payment for this exam is already waiting for verification.' });
  }

  const request: PaymentRequest = {
    id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    user_id: req.user!.id,
    user_email: req.user!.email,
    user_subject: req.user!.subject,
    amount: pricing.amountDue,
    utr,
    payment_time: new Date().toISOString(),
    note: `Exam seats: ${pricing.unpaidSeats} extra × ₹${pricing.seatPrice} — "${exam.title}"`,
    status: 'pending',
    purpose: 'exam_seats',
    exam_id: exam.id,
    created_at: new Date().toISOString(),
  };
  try {
    await db.createPaymentRequest(request);
  } catch (err: any) {
    return res.status(400).json({ error: 'SUBMISSION_FAILED', message: err.message });
  }
  await db.logAudit('EXAM_SEAT_PAYMENT_SUBMITTED', req.user!.email, { examId: exam.id, utr, amount: pricing.amountDue });
  res.json({ success: true, message: 'Payment submitted. The exam is published to students as soon as the admin verifies it.', request });
});

export default router;
