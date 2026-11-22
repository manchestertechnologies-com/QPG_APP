/**
 * Online classroom exam engine: paper normalisation, safe question payloads for students,
 * scoring (MCQ-style + numerical, section "attempt any N" rules, negative marking),
 * timing windows and per-exam seat pricing.
 */
import { config } from '../config';
import { AnswerEntry, ClassroomExam, ExamAttempt } from '../db/classroomStore';
import { ensureCleanQuestion } from './questionQuality';

export interface FlatQuestion {
  id: string;
  number: number; // 1-based position in the original paper
  sectionIndex: number;
  sectionName: string;
  marks: number;
  negative: number;
  kind: 'mcq' | 'numerical';
  q: any; // original question object (contains the answer)
  correctOptions: string[]; // e.g. ['B']
  correctValue: string | null; // numerical answer
}

// ------------------------------------------------------------------ pricing

export function examPricing(participantCount: number, seatsPaid = config.freeExamSeats) {
  const freeSeats = config.freeExamSeats;
  const seatPrice = config.examSeatPrice;
  const unpaidSeats = Math.max(0, participantCount - Math.max(seatsPaid, freeSeats));
  return {
    freeSeats,
    seatPrice,
    participantCount,
    seatsPaid: Math.max(seatsPaid, freeSeats),
    extraSeats: Math.max(0, participantCount - freeSeats),
    unpaidSeats,
    amountDue: unpaidSeats * seatPrice,
    totalCost: Math.max(0, participantCount - freeSeats) * seatPrice,
  };
}

// ------------------------------------------------------------------ paper normalisation

const LETTERS = ['A', 'B', 'C', 'D'];

export function normaliseOption(raw: any): string[] {
  if (raw === null || raw === undefined) return [];
  return String(raw)
    .split(/[,;/&]| and /i)
    .map((part) => {
      const t = part.trim().toLowerCase().replace(/[()\[\].\s]/g, '').replace(/^(option|opt_?)/, '');
      if (/^[a-d]$/.test(t)) return t.toUpperCase();
      if (/^[1-4]$/.test(t)) return LETTERS[Number(t) - 1];
      if (/^(i|ii|iii|iv)$/.test(t)) return LETTERS[['i', 'ii', 'iii', 'iv'].indexOf(t)];
      return '';
    })
    .filter(Boolean);
}

function hasOptions(q: any): boolean {
  return !!(q && (q.opt_a || q.opt_b || q.opt_c || q.opt_d));
}

function isNumerical(q: any): boolean {
  const type = String(q?.q_type || '').toLowerCase();
  if (type.includes('numer') || type.includes('integer')) return true;
  return !hasOptions(q) && q?.num_answer !== undefined && q?.num_answer !== null && String(q.num_answer).trim() !== '';
}

/**
 * Validates a QPG paper for online use and gives every question a unique id.
 * Returns the cleaned paper plus totals, or an error message.
 */
export function preparePaperForExam(
  paper: any
): { ok: true; paper: any; questionCount: number; totalMarks: number; dropped: number } | { ok: false; error: string } {
  if (!paper || !Array.isArray(paper.sections) || paper.sections.length === 0) {
    return { ok: false, error: 'The paper has no sections. Generate or open a paper first.' };
  }
  const cleaned = JSON.parse(JSON.stringify(paper));
  // Variant sets and render-only settings are not needed online.
  delete cleaned.sets;

  const seen = new Set<string>();
  let number = 0;
  let totalMarks = 0;
  const answerKey: any[] = Array.isArray(cleaned.answer_key) ? cleaned.answer_key : [];

  for (const section of cleaned.sections) {
    if (!Array.isArray(section.questions)) section.questions = [];
    section.marks_per_question = Number(section.marks_per_question) || 4;
    section.negative_marking = Math.abs(Number(section.negative_marking) || 0);
    const count = section.questions.length;
    const attempt = Number(section.attempt_count);
    section.attempt_count = attempt > 0 && attempt <= count ? attempt : count;
    totalMarks += section.attempt_count * section.marks_per_question;

    for (const q of section.questions) {
      number += 1;
      let id = q.id ? String(q.id) : '';
      if (!id || seen.has(id)) id = `q${number}_${Math.random().toString(36).slice(2, 7)}`;
      q.id = id;
      seen.add(id);

      // Fill the answer from the answer key when the question itself lacks it.
      const key = answerKey.find((k) => Number(k.q_no) === number);
      if (!q.correct_option && key?.answer && key.answer !== 'N/A') q.correct_option = key.answer;
      if ((q.num_answer === undefined || q.num_answer === '') && key?.num_answer) q.num_answer = key.num_answer;
    }
  }

  if (number === 0) return { ok: false, error: 'The paper has no questions.' };

  // Quality gate: a question that cannot be shown correctly (missing / duplicate options,
  // no valid answer, broken formula, ...) is removed rather than shown to students.
  let dropped = 0;
  number = 0;
  totalMarks = 0;
  for (const section of cleaned.sections) {
    section.questions = section.questions
      .map((q: any) => {
        const r = ensureCleanQuestion(q);
        if (!r.ok) {
          dropped += 1;
          return null;
        }
        const c: any = { ...r.question };
        Object.keys(c).forEach((k) => c[k] === undefined && delete c[k]);
        return { ...q, ...c, id: q.id };
      })
      .filter(Boolean);
    const count = section.questions.length;
    section.attempt_count = Math.min(Number(section.attempt_count) || count, count);
    totalMarks += section.attempt_count * section.marks_per_question;
    number += count;
  }
  cleaned.sections = cleaned.sections.filter((s: any) => s.questions.length > 0);

  if (number === 0) return { ok: false, error: 'None of the questions in this paper can be shown correctly. Generate a new paper.' };
  if (number > 300) return { ok: false, error: 'Online exams support up to 300 questions.' };
  return { ok: true, paper: cleaned, questionCount: number, totalMarks, dropped };
}

export function flattenPaper(paper: any): FlatQuestion[] {
  const out: FlatQuestion[] = [];
  let number = 0;
  (paper?.sections || []).forEach((section: any, sectionIndex: number) => {
    (section.questions || []).forEach((q: any) => {
      number += 1;
      const numerical = isNumerical(q);
      out.push({
        id: String(q.id),
        number,
        sectionIndex,
        sectionName: section.name || `Section ${sectionIndex + 1}`,
        marks: Number(q.marks) || Number(section.marks_per_question) || 4,
        negative: Math.abs(Number(section.negative_marking) || 0),
        kind: numerical ? 'numerical' : 'mcq',
        q,
        correctOptions: numerical ? [] : normaliseOption(q.correct_option),
        correctValue: numerical ? (q.num_answer !== undefined && q.num_answer !== null ? String(q.num_answer).trim() : null) : null,
      });
    });
  });
  return out;
}

const STUDENT_FIELDS = [
  'question', 'opt_a', 'opt_b', 'opt_c', 'opt_d', 'assertion', 'reason', 'statement_1', 'statement_2',
  'match_table', 'match_headers', 'stem_after', 'diagram_svg', 'q_type', 'chapter',
];

/** Question payload for students: no correct option, numerical answer or solution. */
export function studentQuestion(fq: FlatQuestion) {
  const safe: any = { id: fq.id, number: fq.number, kind: fq.kind, marks: fq.marks, negative: fq.negative };
  for (const f of STUDENT_FIELDS) if (fq.q[f] !== undefined && fq.q[f] !== '') safe[f] = fq.q[f];
  return safe;
}

/** Deterministic shuffle (per attempt) so a reload shows the same order. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Question order for a new attempt: shuffled within each section when enabled. */
export function questionOrderFor(exam: ClassroomExam, attemptId: string): string[] {
  const flat = flattenPaper(exam.paper);
  if (!exam.shuffle_questions) return flat.map((f) => f.id);
  const bySection = new Map<number, string[]>();
  flat.forEach((f) => bySection.set(f.sectionIndex, [...(bySection.get(f.sectionIndex) || []), f.id]));
  return [...bySection.keys()].sort((a, b) => a - b).flatMap((k) => seededShuffle(bySection.get(k)!, `${attemptId}:${k}`));
}

// ------------------------------------------------------------------ answers & scoring

/** Keeps only well-formed answers for questions that exist in the paper. */
export function sanitiseAnswers(raw: any, flat: FlatQuestion[]): Record<string, AnswerEntry> {
  const out: Record<string, AnswerEntry> = {};
  if (!raw || typeof raw !== 'object') return out;
  const byId = new Map(flat.map((f) => [f.id, f]));
  for (const [id, value] of Object.entries(raw)) {
    const fq = byId.get(id);
    if (!fq || !value || typeof value !== 'object') continue;
    const v: any = value;
    const entry: AnswerEntry = {};
    if (fq.kind === 'mcq' && typeof v.option === 'string' && LETTERS.includes(v.option.toUpperCase())) {
      entry.option = v.option.toUpperCase();
    }
    if (fq.kind === 'numerical' && v.value !== undefined && v.value !== null && String(v.value).trim() !== '') {
      entry.value = String(v.value).trim().slice(0, 32);
    }
    if (v.marked) entry.marked = true;
    if (entry.option || entry.value || entry.marked) out[id] = entry;
  }
  return out;
}

function numericMatch(given: string, correct: string): boolean {
  const g = parseFloat(given);
  const c = parseFloat(correct);
  if (!isNaN(g) && !isNaN(c)) {
    const tolerance = Math.max(0.01, Math.abs(c) * 0.001);
    return Math.abs(g - c) <= tolerance;
  }
  return given.trim().toLowerCase() === correct.trim().toLowerCase();
}

export interface ScoredQuestion {
  id: string;
  number: number;
  section: string;
  given: string | null;
  correct: string | null;
  status: 'correct' | 'incorrect' | 'unanswered' | 'not_evaluated';
  marks: number;
}

/**
 * Scores an attempt. In sections with "attempt any N of M", only the first N answered
 * questions (in paper order) are evaluated, matching the NTA rule.
 */
export function scoreAttempt(paper: any, answers: Record<string, AnswerEntry>) {
  const flat = flattenPaper(paper);
  const sections: any[] = paper.sections || [];
  const evaluatedPerSection = new Map<number, number>();
  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const perQuestion: ScoredQuestion[] = [];
  const sectionStats = sections.map((s: any, i: number) => ({
    name: s.name || `Section ${i + 1}`,
    score: 0,
    max: (Number(s.attempt_count) || (s.questions || []).length) * (Number(s.marks_per_question) || 4),
    correct: 0,
    incorrect: 0,
    unanswered: 0,
  }));

  for (const fq of flat) {
    const a = answers[fq.id] || {};
    const given = fq.kind === 'mcq' ? a.option || null : a.value || null;
    const correctText = fq.kind === 'mcq' ? fq.correctOptions.join('/') || null : fq.correctValue;
    const stat = sectionStats[fq.sectionIndex];
    const limit = Number(sections[fq.sectionIndex]?.attempt_count) || Infinity;

    if (!given) {
      unanswered += 1;
      stat.unanswered += 1;
      perQuestion.push({ id: fq.id, number: fq.number, section: fq.sectionName, given: null, correct: correctText, status: 'unanswered', marks: 0 });
      continue;
    }

    const used = evaluatedPerSection.get(fq.sectionIndex) || 0;
    if (used >= limit) {
      perQuestion.push({ id: fq.id, number: fq.number, section: fq.sectionName, given, correct: correctText, status: 'not_evaluated', marks: 0 });
      continue;
    }
    evaluatedPerSection.set(fq.sectionIndex, used + 1);

    // A question without a usable answer key is a bonus: full marks for any attempt.
    const hasKey = fq.kind === 'mcq' ? fq.correctOptions.length > 0 : !!fq.correctValue;
    const isRight = !hasKey || (fq.kind === 'mcq' ? fq.correctOptions.includes(given) : numericMatch(given, fq.correctValue!));
    const marks = isRight ? fq.marks : -fq.negative;
    score += marks;
    stat.score += marks;
    if (isRight) {
      correct += 1;
      stat.correct += 1;
    } else {
      incorrect += 1;
      stat.incorrect += 1;
    }
    perQuestion.push({ id: fq.id, number: fq.number, section: fq.sectionName, given, correct: correctText, status: isRight ? 'correct' : 'incorrect', marks });
  }

  const maxScore = sectionStats.reduce((sum, s) => sum + s.max, 0);
  const attempted = correct + incorrect;
  return {
    score: Math.round(score * 100) / 100,
    maxScore,
    correct,
    incorrect,
    unanswered,
    accuracy: attempted ? Math.round((correct / attempted) * 1000) / 10 : 0,
    percentage: maxScore ? Math.round((score / maxScore) * 1000) / 10 : 0,
    sections: sectionStats,
    perQuestion,
  };
}

export function finalizeAttemptRecord(exam: ClassroomExam, attempt: ExamAttempt, auto: boolean, now = new Date()): ExamAttempt {
  const result = scoreAttempt(exam.paper, attempt.answers || {});
  const deadline = new Date(attempt.deadline_at);
  return {
    ...attempt,
    status: auto ? 'auto_submitted' : 'submitted',
    submitted_at: (auto && now > deadline ? deadline : now).toISOString(),
    score: result.score,
    max_score: result.maxScore,
    correct: result.correct,
    incorrect: result.incorrect,
    unanswered: result.unanswered,
    result,
  };
}

// ------------------------------------------------------------------ timing

/** Seconds of network slack accepted after the deadline for the final submit. */
export const SUBMIT_GRACE_MS = 60 * 1000;

export function examPhase(exam: ClassroomExam, now = Date.now()): 'payment_pending' | 'cancelled' | 'upcoming' | 'live' | 'ended' {
  if (exam.status === 'cancelled') return 'cancelled';
  if (exam.status === 'payment_pending') return 'payment_pending';
  if (now < new Date(exam.starts_at).getTime()) return 'upcoming';
  if (now >= new Date(exam.ends_at).getTime()) return 'ended';
  return 'live';
}

/** A student's personal deadline: duration from their start, capped at the exam window end. */
export function attemptDeadline(exam: ClassroomExam, startedAt: Date): Date {
  const byDuration = startedAt.getTime() + exam.duration_minutes * 60 * 1000;
  return new Date(Math.min(byDuration, new Date(exam.ends_at).getTime()));
}

export function attemptExpired(attempt: ExamAttempt, now = Date.now()): boolean {
  return attempt.status === 'in_progress' && now > new Date(attempt.deadline_at).getTime() + SUBMIT_GRACE_MS;
}

export function resultsVisible(exam: ClassroomExam, attempt: ExamAttempt | undefined, now = Date.now()): boolean {
  if (!attempt || attempt.status === 'in_progress') return false;
  if (exam.show_results === 'never') return false;
  if (exam.show_results === 'after_end') return now >= new Date(exam.ends_at).getTime();
  return true;
}
