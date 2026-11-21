/**
 * Student portal: classrooms, online exams (start / autosave / submit) and results.
 * Mounted at /api/student.
 */
import { Router, Response } from 'express';
import { authMiddleware, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { classroomStore, ClassroomExam, ExamAttempt } from '../db/classroomStore';
import { db } from '../db/database';
import {
  attemptDeadline,
  attemptExpired,
  examPhase,
  finalizeAttemptRecord,
  flattenPaper,
  questionOrderFor,
  resultsVisible,
  sanitiseAnswers,
  studentQuestion,
  SUBMIT_GRACE_MS,
} from '../services/examService';

const router = Router();
router.use(authMiddleware, requireRole('student'));

const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

function examMeta(e: ClassroomExam & { classroom_name?: string }) {
  return {
    id: e.id,
    classroomId: e.classroom_id,
    classroomName: e.classroom_name,
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
    phase: examPhase(e),
  };
}

function attemptSummary(exam: ClassroomExam, a: ExamAttempt | undefined) {
  if (!a) return { status: 'not_started' as const };
  const visible = resultsVisible(exam, a);
  return {
    status: a.status,
    startedAt: a.started_at,
    deadlineAt: a.deadline_at,
    submittedAt: a.submitted_at,
    resultVisible: visible,
    score: visible ? a.score : undefined,
    maxScore: visible ? a.max_score : undefined,
  };
}

/** Loads an exam the student may see; auto-closes their attempt if its time ran out. */
async function loadStudentExam(req: AuthenticatedRequest, res: Response) {
  const exam = await classroomStore.getExam(String(req.params.id));
  const studentId = req.user!.id;
  if (!exam || exam.status !== 'scheduled' || !(await classroomStore.isParticipant(exam.id, studentId))) {
    res.status(404).json({ error: 'EXAM_NOT_FOUND', message: 'Exam not found or you are not a participant.' });
    return null;
  }
  let attempt = await classroomStore.getAttempt(exam.id, studentId);
  if (attempt && attemptExpired(attempt)) {
    await classroomStore.finalizeAttempt(finalizeAttemptRecord(exam, attempt, true));
    attempt = await classroomStore.getAttempt(exam.id, studentId);
  }
  return { exam, attempt };
}

function examPayload(exam: ClassroomExam, attempt: ExamAttempt) {
  const flat = flattenPaper(exam.paper);
  const byId = new Map(flat.map((f) => [f.id, f]));
  const order = attempt.question_order.length ? attempt.question_order.filter((id) => byId.has(id)) : flat.map((f) => f.id);
  const sections = (exam.paper.sections || []).map((s: any, i: number) => ({
    name: s.name || `Section ${i + 1}`,
    description: s.description || '',
    attemptCount: Number(s.attempt_count) || (s.questions || []).length,
    marksPerQuestion: Number(s.marks_per_question) || 4,
    negativeMarking: Math.abs(Number(s.negative_marking) || 0),
    questionIds: order.filter((id) => byId.get(id)!.sectionIndex === i),
  }));
  return {
    exam: examMeta(exam),
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.started_at,
      deadlineAt: attempt.deadline_at,
      answers: attempt.answers || {},
    },
    serverNow: new Date().toISOString(),
    sections,
    questions: order.map((id, idx) => ({ ...studentQuestion(byId.get(id)!), displayNumber: idx + 1 })),
  };
}

// ------------------------------------------------------------------ classrooms

router.get('/classrooms', async (req: AuthenticatedRequest, res: Response) => {
  const classrooms = await classroomStore.listClassroomsForStudent(req.user!.id);
  res.json({
    success: true,
    classrooms: classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      subject: c.subject,
      teacherName: c.teacher_name,
      joinedAt: c.joined_at,
    })),
  });
});

router.post('/classrooms/join', async (req: AuthenticatedRequest, res: Response) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return res.status(400).json({ error: 'INVALID_CODE', message: 'Enter the classroom code your teacher shared.' });
  const classroom = await classroomStore.getClassroomByCode(code);
  if (!classroom) return res.status(404).json({ error: 'CLASSROOM_NOT_FOUND', message: 'No classroom found with this code.' });
  const added = await classroomStore.addMember(classroom.id, req.user!.id, 'join_code');
  if (added) await db.logAudit('CLASSROOM_JOINED', req.user!.email, { classroomId: classroom.id });
  res.json({
    success: true,
    alreadyMember: !added,
    classroom: { id: classroom.id, name: classroom.name, description: classroom.description, subject: classroom.subject },
  });
});

// ------------------------------------------------------------------ exams

router.get('/exams', async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.user!.id;
  const exams = await classroomStore.listExamsForStudent(studentId);
  const out = [];
  for (const e of exams) {
    let attempt = await classroomStore.getAttempt(e.id, studentId);
    if (attempt && attemptExpired(attempt)) {
      const full = await classroomStore.getExam(e.id);
      if (full) {
        await classroomStore.finalizeAttempt(finalizeAttemptRecord(full, attempt, true));
        attempt = await classroomStore.getAttempt(e.id, studentId);
      }
    }
    out.push({ ...examMeta(e), attempt: attemptSummary(e, attempt) });
  }
  res.json({ success: true, exams: out, serverNow: new Date().toISOString() });
});

router.get('/exams/:id', async (req: AuthenticatedRequest, res: Response) => {
  const loaded = await loadStudentExam(req, res);
  if (!loaded) return;
  res.json({ success: true, exam: examMeta(loaded.exam), attempt: attemptSummary(loaded.exam, loaded.attempt), serverNow: new Date().toISOString() });
});

router.post('/exams/:id/start', async (req: AuthenticatedRequest, res: Response) => {
  const loaded = await loadStudentExam(req, res);
  if (!loaded) return;
  const { exam } = loaded;
  let { attempt } = loaded;

  if (attempt && attempt.status !== 'in_progress') {
    return res.status(409).json({ error: 'ALREADY_SUBMITTED', message: 'You have already submitted this exam.' });
  }
  if (!attempt) {
    const phase = examPhase(exam);
    if (phase === 'upcoming') return res.status(409).json({ error: 'NOT_STARTED', message: 'This exam has not started yet.', startsAt: exam.starts_at });
    if (phase !== 'live') return res.status(409).json({ error: 'EXAM_CLOSED', message: 'This exam is closed.' });

    const now = new Date();
    const id = newId('att');
    attempt = await classroomStore.createAttempt({
      id,
      exam_id: exam.id,
      student_id: req.user!.id,
      status: 'in_progress',
      started_at: now.toISOString(),
      deadline_at: attemptDeadline(exam, now).toISOString(),
      submitted_at: null,
      question_order: questionOrderFor(exam, id),
      answers: {},
      score: null,
      max_score: null,
      correct: null,
      incorrect: null,
      unanswered: null,
      result: null,
    });
  }
  res.json({ success: true, ...examPayload(exam, attempt) });
});

router.put('/exams/:id/answers', async (req: AuthenticatedRequest, res: Response) => {
  const loaded = await loadStudentExam(req, res);
  if (!loaded) return;
  const { exam, attempt } = loaded;
  if (!attempt || attempt.status !== 'in_progress') {
    return res.status(409).json({ error: 'NOT_IN_PROGRESS', message: 'This attempt is no longer open.' });
  }
  if (Date.now() > new Date(attempt.deadline_at).getTime() + SUBMIT_GRACE_MS) {
    return res.status(409).json({ error: 'TIME_UP', message: 'Time is up.' });
  }
  const answers = sanitiseAnswers(req.body?.answers, flattenPaper(exam.paper));
  const saved = await classroomStore.saveAnswers(attempt.id, answers);
  if (!saved) return res.status(409).json({ error: 'NOT_IN_PROGRESS', message: 'This attempt is no longer open.' });
  res.json({ success: true, savedAt: new Date().toISOString(), answered: Object.values(answers).filter((a) => a.option || a.value).length });
});

router.post('/exams/:id/submit', async (req: AuthenticatedRequest, res: Response) => {
  const loaded = await loadStudentExam(req, res);
  if (!loaded) return;
  const { exam } = loaded;
  let attempt = loaded.attempt;
  if (!attempt) return res.status(409).json({ error: 'NOT_STARTED', message: 'You have not started this exam.' });

  if (attempt.status === 'in_progress') {
    const withinTime = Date.now() <= new Date(attempt.deadline_at).getTime() + SUBMIT_GRACE_MS;
    if (withinTime && req.body?.answers) {
      attempt.answers = sanitiseAnswers(req.body.answers, flattenPaper(exam.paper));
    }
    const finalized = finalizeAttemptRecord(exam, attempt, !withinTime);
    await classroomStore.finalizeAttempt(finalized); // no-op if another request already submitted
    attempt = (await classroomStore.getAttempt(exam.id, req.user!.id))!;
    await db.logAudit('CLASSROOM_EXAM_SUBMITTED', req.user!.email, { examId: exam.id, score: attempt.score });
  }

  const visible = resultsVisible(exam, attempt);
  res.json({
    success: true,
    status: attempt.status,
    resultVisible: visible,
    score: visible ? attempt.score : undefined,
    maxScore: visible ? attempt.max_score : undefined,
    message: visible
      ? 'Exam submitted.'
      : exam.show_results === 'after_end'
        ? 'Exam submitted. Results will be available after the exam window closes.'
        : 'Exam submitted. Your teacher will share the results.',
  });
});

router.get('/exams/:id/result', async (req: AuthenticatedRequest, res: Response) => {
  const loaded = await loadStudentExam(req, res);
  if (!loaded) return;
  const { exam, attempt } = loaded;
  if (!attempt || attempt.status === 'in_progress') {
    return res.status(409).json({ error: 'NOT_SUBMITTED', message: 'Submit the exam to see your result.' });
  }
  if (!resultsVisible(exam, attempt)) {
    return res.json({
      success: true,
      visible: false,
      exam: examMeta(exam),
      message: exam.show_results === 'after_end' ? 'Results unlock when the exam window closes.' : 'Your teacher has not released results for this exam.',
      availableAt: exam.show_results === 'after_end' ? exam.ends_at : null,
    });
  }

  // Rank among submitted attempts
  const all = (await classroomStore.listAttempts(exam.id)).filter((a) => a.status !== 'in_progress');
  const better = all.filter((a) => (a.score ?? 0) > (attempt.score ?? 0)).length;

  const flat = flattenPaper(exam.paper);
  const byId = new Map(flat.map((f) => [f.id, f]));
  const perQuestion: any[] = attempt.result?.perQuestion || [];
  const review = perQuestion.map((pq) => {
    const fq = byId.get(pq.id);
    return {
      ...pq,
      question: fq ? studentQuestion(fq) : null,
      solution: fq?.q?.solution_text || fq?.q?.solution || null,
    };
  });

  res.json({
    success: true,
    visible: true,
    exam: examMeta(exam),
    result: {
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.max_score,
      correct: attempt.correct,
      incorrect: attempt.incorrect,
      unanswered: attempt.unanswered,
      accuracy: attempt.result?.accuracy ?? 0,
      percentage: attempt.result?.percentage ?? 0,
      sections: attempt.result?.sections || [],
      rank: better + 1,
      totalSubmitted: all.length,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
    },
    review,
  });
});

export default router;
