/**
 * Client-side safety net for papers that were saved before the server's quality gate existed
 * (or edited locally): questions that cannot be displayed correctly are removed, and the
 * answer key is rebuilt to match. The authoritative checks live in backend/src/services/questionQuality.ts.
 */
import { splitRich } from './richText';

const LETTERS = ['A', 'B', 'C', 'D'];

function text(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

function balanced(s: string): boolean {
  // splitRich keeps an unmatched "$" as text; any leftover "$" means the formula is broken
  return !splitRich(s).some((seg) => seg.kind === 'text' && /(^|[^\\])\$/.test(seg.value));
}

export function questionProblems(q: any): string[] {
  const problems: string[] = [];
  if (!q || typeof q !== 'object') return ['not_an_object'];
  const isNumerical = String(q.q_type || '').toLowerCase().includes('numer');
  const hasBody =
    text(q.question) || text(q.assertion) || text(q.statement_1) || (Array.isArray(q.match_table) && q.match_table.length > 0);
  if (!hasBody) problems.push('empty_question');

  if (isNumerical) {
    const ans = text(q.num_answer);
    if (!ans || Number.isNaN(parseFloat(ans))) problems.push('numerical_answer_not_numeric');
  } else {
    const opts = [q.opt_a, q.opt_b, q.opt_c, q.opt_d].map(text);
    if (opts.some((o) => !o)) problems.push('missing_options');
    else if (new Set(opts.map((o) => o.replace(/\s+/g, '').toLowerCase())).size < 4) problems.push('duplicate_options');
    if (!LETTERS.includes(text(q.correct_option).toUpperCase())) problems.push('invalid_answer_key');
  }
  if (q.q_type === 'assertion_reason' && (!text(q.assertion) || !text(q.reason)) && !/assertion/i.test(text(q.question))) {
    problems.push('assertion_reason_incomplete');
  }
  if ((q.statement_1 || q.statement_2) && (!text(q.statement_1) || !text(q.statement_2))) problems.push('statement_incomplete');

  const fields = [q.question, q.assertion, q.reason, q.statement_1, q.statement_2, q.stem_after, q.opt_a, q.opt_b, q.opt_c, q.opt_d].map(text);
  if (fields.some((f) => f && !balanced(f))) problems.push('unbalanced_math');
  if (fields.some((f) => /\[\s*unclear|\[object Object\]|\bundefined\b/i.test(f))) problems.push('unclear_content');
  return problems;
}

/** Returns the paper without broken questions, plus how many were removed. */
export function sanitizePaper<T extends { sections?: any[]; answer_key?: any[]; questions_count?: number }>(paper: T): { paper: T; removed: number } {
  if (!paper || !Array.isArray(paper.sections)) return { paper, removed: 0 };
  let removed = 0;
  const sections = paper.sections.map((sec) => {
    const questions = (sec.questions || []).filter((q: any) => {
      const ok = questionProblems(q).length === 0;
      if (!ok) removed += 1;
      return ok;
    });
    return { ...sec, questions, attempt_count: Math.min(Number(sec.attempt_count) || questions.length, questions.length) };
  });
  if (removed === 0) return { paper, removed: 0 };

  const kept = sections.filter((s) => s.questions.length > 0);
  const answer_key: any[] = [];
  let n = 1;
  kept.forEach((s) =>
    s.questions.forEach((q: any) => {
      const numerical = String(q.q_type || '').toLowerCase().includes('numer');
      answer_key.push({ q_no: n++, answer: numerical ? text(q.num_answer) : text(q.correct_option).toUpperCase(), num_answer: q.num_answer });
    })
  );
  const next: any = { ...paper, sections: kept, answer_key, questions_count: n - 1 };
  delete next.sets; // variant sets were built from the old question list
  return { paper: next, removed };
}
