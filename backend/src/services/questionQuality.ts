/**
 * Question quality gate.
 *
 * Every question coming out of the Supabase banks passes through normalizeQuestion():
 *   1. it is cleaned (HTML, numbering, option labels, markdown headers),
 *   2. structured content embedded in the text is pulled out into proper fields
 *      (Assertion / Reason, Statement I / II, Column I / Column II match tables),
 *   3. it is validated. Anything that would render wrongly (missing or duplicate options,
 *      several correct answers, a non-numeric "numerical" answer, broken match columns,
 *      unbalanced or invalid LaTeX, "[UNCLEAR]" markers, ...) is rejected with reasons,
 *      and never shown to teachers or students.
 */
import katex from 'katex';
// Chemistry notation (\ce{...}, \pu{...}) used by some questions; same extension as the web renderer.
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('katex/dist/contrib/mhchem.js');

export type CleanType = 'mcq_single' | 'assertion_reason' | 'statements' | 'match' | 'numerical';

export interface MatchRow {
  col1: string;
  col2: string;
}

export interface CleanQuestion {
  id: string;
  q_type: CleanType;
  question: string; // intro / stem without the structured parts
  stem_after?: string; // instruction that follows a structured block ("Choose the correct answer...")
  assertion?: string;
  reason?: string;
  statement_1?: string;
  statement_2?: string;
  match_table?: MatchRow[];
  match_headers?: [string, string];
  opt_a?: string;
  opt_b?: string;
  opt_c?: string;
  opt_d?: string;
  correct_option?: 'A' | 'B' | 'C' | 'D';
  num_answer?: string; // canonical numeric string for numerical questions
  answer_display?: string; // the answer as written in the bank (numericals)
  solution_text: string;
}

export type NormalizeResult = { ok: true; question: CleanQuestion } | { ok: false; reasons: string[] };

const LETTERS = ['A', 'B', 'C', 'D'] as const;
const OPTION_FIELDS = ['opt_a', 'opt_b', 'opt_c', 'opt_d'] as const;
const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];

const isBlank = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

// ------------------------------------------------------------------ text cleaning

const HTML_ENTITIES: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" };

/** Removes harmless HTML (line breaks, inline formatting) and normalises whitespace. */
export function cleanText(input: unknown): string {
  if (input === null || input === undefined) return '';
  let s = typeof input === 'string' ? input : String(input);
  s = s.replace(/\r\n?/g, '\n');
  // literal "\n" sequences written as text (not LaTeX commands like \nu, \neq, \newline)
  s = s.replace(/\\n(?!(?:u|e|eq|ewline|abla|eg|i|ot|otin|leq|geq|mid|parallel|exists|subseteq|subset|supset|cong|sim|warrow|earrow|rightarrow|leftarrow|Rightarrow|Leftarrow)\b)/g, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n');
  s = s.replace(/<\/?(p|span|div|b|strong|i|em|u|font)(\s[^>]*)?>/gi, '');
  s = s.replace(/<sup>(.*?)<\/sup>/gi, '^{$1}').replace(/<sub>(.*?)<\/sub>/gi, '_{$1}');
  s = s.replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (m) => HTML_ENTITIES[m] ?? m);
  s = s.replace(/\[QBP_[A-Z_]+:[^\]]*\]/g, '');
  s = s.replace(/```[a-z]*\n?/gi, '');
  s = s.replace(/[​-‍﻿]/g, '');
  s = s.replace(/[ \t ]+/g, ' ');
  s = s
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/** Leading "1.", "Q1.", "Q.12)", "(3)" numbering copied from a source paper. */
export function stripQuestionNumber(s: string): string {
  const numbering = /^(?:Q\.?\s*\d+[.):-]?|\d{1,3}[.)](?!\d))\s+/i;
  return s
    .replace(numbering, '')
    .replace(/^(?:q?uestion|ques|q)\s*[:.-]\s*/i, '')
    .replace(numbering, '')
    .trim();
}

/** "(a) text", "a) text", "A. text", "(1) text" -> "text". */
export function stripOptionLabel(s: string): string {
  // Only a label followed by whitespace; never the "(1)" of a match mapping like "(1)-(iv), (2)-(i)".
  return s
    .replace(/^\(\s*[a-dA-D1-4]\s*\)\s+(?![-–→:=])/, '')
    .replace(/^[a-dA-D][.)]\s+(?![-–→:=])/, '')
    .trim();
}

/**
 * Removes "(a) / (b) / (c) / (d)" style labels only when every filled option carries the label
 * for its own position. "(A) is true but (R) is false" in option 3 is content, not a label.
 */
export function stripOptionLabels(options: string[]): string[] {
  const label = (o: string) => {
    const m = o.match(/^\(\s*([a-dA-D1-4])\s*\)\s+(?![-–→:=])/) || o.match(/^([a-dA-D])[.)]\s+(?![-–→:=])/);
    return m ? m[1].toLowerCase() : null;
  };
  const filled = options.map((o, i) => ({ o, i })).filter((x) => x.o);
  if (filled.length === 0) return options;
  const positional = filled.every(({ o, i }) => {
    const l = label(o);
    return l !== null && (l === 'abcd'[i] || l === '1234'[i]);
  });
  return positional ? options.map((o) => (o ? stripOptionLabel(o) : o)) : options;
}

const UNCLEAR_PATTERNS =[/\[\s*unclear/i, /\?{3,}/, /\bN\/A\s*\(/i, /\[object Object\]/, /\bundefined\b/, /\bNaN\b/, /lorem ipsum/i, /\bTODO\b/, /\[missing/i, /\[image\s*(not|missing)/i];

export function hasUnclearMarker(s: string): boolean {
  return UNCLEAR_PATTERNS.some((p) => p.test(s));
}

// ------------------------------------------------------------------ math validation

interface Segment {
  kind: 'text' | 'math' | 'img';
  value: string;
  display?: boolean;
}

/** Splits text into plain / math / image segments (same rules as the web renderer). */
export function splitSegments(s: string): Segment[] | null {
  const out: Segment[] = [];
  let i = 0;
  let text = '';
  const flush = () => {
    if (text) out.push({ kind: 'text', value: text });
    text = '';
  };
  while (i < s.length) {
    if (s.startsWith('{{IMG::', i)) {
      const end = s.indexOf('}}', i);
      if (end < 0) return null;
      flush();
      out.push({ kind: 'img', value: s.slice(i + 7, end) });
      i = end + 2;
      continue;
    }
    if (s[i] === '\\' && s[i + 1] === '$') {
      text += '$';
      i += 2;
      continue;
    }
    const opener = s.startsWith('$$', i) ? '$$' : s[i] === '$' ? '$' : s.startsWith('\\(', i) ? '\\(' : s.startsWith('\\[', i) ? '\\[' : '';
    if (opener) {
      const closer = opener === '\\(' ? '\\)' : opener === '\\[' ? '\\]' : opener;
      let j = i + opener.length;
      let found = -1;
      while (j < s.length) {
        if (s[j] === '\\' && s[j + 1] === '$') {
          j += 2;
          continue;
        }
        if (s.startsWith(closer, j)) {
          found = j;
          break;
        }
        j++;
      }
      if (found < 0) return null; // unbalanced delimiter
      flush();
      out.push({ kind: 'math', value: s.slice(i + opener.length, found), display: opener === '$$' || opener === '\\[' });
      i = found + closer.length;
      continue;
    }
    text += s[i];
    i++;
  }
  flush();
  return out;
}

const katexCache = new Map<string, boolean>();

export function isValidLatex(expr: string): boolean {
  const key = expr.trim();
  if (!key) return false;
  const hit = katexCache.get(key);
  if (hit !== undefined) return hit;
  let ok = true;
  try {
    katex.renderToString(key, { throwOnError: true, strict: 'ignore', trust: false });
  } catch {
    ok = false;
  }
  if (katexCache.size > 50000) katexCache.clear();
  katexCache.set(key, ok);
  return ok;
}

/** Returns a problem code when the text cannot be rendered cleanly, otherwise null. */
export function checkRenderable(s: string): string | null {
  const segments = splitSegments(s);
  if (!segments) return 'unbalanced_math';
  for (const seg of segments) {
    if (seg.kind === 'img') {
      const url = seg.value.trim();
      const isHttp = /^https?:\/\/[^\s"'<>]+$/i.test(url);
      const isDataImage = /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/i.test(url);
      if (!isHttp && !isDataImage) return 'bad_image_url';
      continue;
    }
    if (seg.kind === 'math') {
      if (!isValidLatex(seg.value)) return 'invalid_math';
      continue;
    }
    if (/<\s*(table|img|script|iframe|style|svg|object)\b/i.test(seg.value)) return 'html_markup';
    if (/\\(frac|dfrac|sqrt|begin|end)\s*\{/.test(seg.value)) return 'latex_outside_math';
  }
  return null;
}

// ------------------------------------------------------------------ answers

/** Correct option for a single-choice question: 'A'..'D', or null (with a reason). */
export function parseCorrectOption(raw: unknown): { letter: 'A' | 'B' | 'C' | 'D' } | { error: string } {
  if (isBlank(raw)) return { error: 'missing_answer' };
  const s = String(raw).trim();
  if (/[,;&/]|\band\b/i.test(s) && s.length > 1) return { error: 'multiple_correct' };
  const t = s.replace(/^(option|opt|ans(wer)?)\s*[:.-]?\s*/i, '').replace(/[()\[\].\s]/g, '').toLowerCase();
  if (/^[a-d]$/.test(t)) return { letter: t.toUpperCase() as 'A' };
  if (/^[1-4]$/.test(t)) return { letter: LETTERS[Number(t) - 1] };
  if (/^(i|ii|iii|iv)$/.test(t)) return { letter: LETTERS[['i', 'ii', 'iii', 'iv'].indexOf(t)] };
  return { error: 'invalid_answer_key' };
}

function stripMathDelimiters(s: string): string {
  let t = s.trim();
  for (let k = 0; k < 2; k++) {
    t = t.replace(/^\$\$([\s\S]*)\$\$$/, '$1').replace(/^\$([\s\S]*)\$$/, '$1').replace(/^\\\(([\s\S]*)\\\)$/, '$1').replace(/^\\\[([\s\S]*)\\\]$/, '$1').trim();
  }
  return t;
}

const UNIT_RE = /^[a-zA-Z%°µΩ\/²³·.\s^\-*()]*$/;

function roundNum(n: number): string {
  if (!Number.isFinite(n)) return '';
  const r = Math.round(n * 10000) / 10000;
  return String(Object.is(r, -0) ? 0 : r);
}

/**
 * Numeric value of a numerical answer: "12", "-0.5", "$3$", "\(4\)", "1/2", "\dfrac{3}{4}",
 * "2.94e6", "5 x 10^-3", "6 cm". Returns null for text answers ("Because...", "Yes", "2:1", "π/4").
 */
export function parseNumericAnswer(raw: unknown): string | null {
  if (isBlank(raw)) return null;
  let s = stripMathDelimiters(String(raw)).replace(/\\,|\\;|\\!|\\ |~/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s || hasUnclearMarker(s)) return null;
  s = s.replace(/\\text\{([^}]*)\}|\\mathrm\{([^}]*)\}/g, (_m, a, b) => ` ${a || b} `).trim();
  s = s.replace(/−/g, '-');

  const frac = s.match(/^(-)?\\d?frac\s*\{?\s*(-?\d+(?:\.\d+)?)\s*\}?\s*\{?\s*(\d+(?:\.\d+)?)\s*\}?$/);
  if (frac) {
    const v = Number(frac[2]) / Number(frac[3]);
    return Number(frac[3]) === 0 ? null : roundNum(frac[1] ? -v : v);
  }
  const slash = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (slash) return Number(slash[2]) === 0 ? null : roundNum(Number(slash[1]) / Number(slash[2]));

  const sci = s.match(/^(-?\d+(?:\.\d+)?)\s*(?:[x×*]|\\times)\s*10\s*\^\s*\{?\s*(-?\d+)\s*\}?(.*)$/);
  if (sci && UNIT_RE.test(sci[3])) return roundNum(Number(sci[1]) * Math.pow(10, Number(sci[2])));

  const plain = s.match(/^(-?\d+(?:\.\d+)?(?:e[-+]?\d+)?)(.*)$/i);
  if (plain) {
    const rest = plain[2].trim();
    if (rest === '' || (UNIT_RE.test(rest) && /[a-zA-Z%°µΩ]/.test(rest) && !/^[a-dA-D]$/.test(rest))) {
      // "6 cm" ok; "2:1", "12; 4" and "3 or 4" are not single numbers
      if (/[:;,]|\bor\b|\band\b/i.test(rest)) return null;
      return roundNum(Number(plain[1]));
    }
  }
  return null;
}

// ------------------------------------------------------------------ structure extraction

const AR_A = /(?:^|\n)\s*\**\s*Assertion\s*(?:\(\s*A\s*\))?\s*\**\s*[:.\-–]\s*/i;
const AR_R = /(?:^|\n|\s)\**\s*Reason\s*(?:\(\s*R\s*\))?\s*\**\s*[:.\-–]\s*/i;

export function extractAssertionReason(text: string): { intro: string; assertion: string; reason: string; after: string } | null {
  const a = AR_A.exec(text);
  if (!a) return null;
  const restA = text.slice(a.index + a[0].length);
  const r = AR_R.exec(restA);
  if (!r) return null;
  const assertion = restA.slice(0, r.index).trim();
  let reason = restA.slice(r.index + r[0].length).trim();
  let after = '';
  const tail = reason.match(/\n\s*((?:In the light|Choose|Select|Mark|Which of the|Pick)[\s\S]*)$/i);
  if (tail) {
    after = tail[1].trim();
    reason = reason.slice(0, tail.index).trim();
  }
  return { intro: text.slice(0, a.index).trim(), assertion, reason, after };
}

const ST1 = /(?:^|\n|\s)\**\s*Statement\s*[-–]?\s*(?:I|1)\s*\**\s*[:.\-–)]\s*/i;
const ST2 = /(?:^|\n|\s)\**\s*Statement\s*[-–]?\s*(?:II|2)\s*\**\s*[:.\-–)]\s*/i;
const ST3 = /(?:^|\n|\s)\**\s*Statement\s*[-–]?\s*(?:III|3)\s*\**\s*[:.\-–)]/i;

export function extractStatements(text: string): { intro: string; s1: string; s2: string; after: string } | null {
  if (ST3.test(text)) return null; // three or more statements: keep as plain text
  const a = ST1.exec(text);
  if (!a) return null;
  const rest = text.slice(a.index + a[0].length);
  const b = ST2.exec(rest);
  if (!b) return null;
  const s1 = rest.slice(0, b.index).trim();
  let s2 = rest.slice(b.index + b[0].length).trim();
  let after = '';
  const tail = s2.match(/\n\s*((?:In the light|Choose|Select|Mark|Which of the|Pick)[\s\S]*)$/i);
  if (tail) {
    after = tail[1].trim();
    s2 = s2.slice(0, tail.index).trim();
  }
  return { intro: text.slice(0, a.index).trim(), s1, s2, after };
}

const COL_HEADER = /^\**\s*(?:column|list)\s*[-–]?\s*(I{1,3}|1|2|3|A|B|C)\s*\**\s*:?\s*\**$/i;
const ITEM_LABEL = /^\(?\s*([a-hA-H]|[1-8]|i{1,3}|iv|v|vi{0,3}|[p-tP-T])\s*[.):\-–]\s*/;

function stripItemLabel(s: string): string {
  return s.replace(ITEM_LABEL, '').trim();
}

const INLINE_LABEL = /\((?:iv|ix|vi{1,3}|v|i{1,3}|[a-h]|[1-8]|[p-t])\)\s/i;

/** A column squashed onto one line, "(i) foo (ii) bar (iii) baz", becomes separate items. */
function splitInlineItems(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const parts = line
      .split(/\s+(?=\((?:iv|ix|vi{1,3}|v|i{1,3}|[a-h]|[1-8]|[p-t])\)\s)/i)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => INLINE_LABEL.test(p.slice(0, 7)))) out.push(...parts);
    else out.push(line);
  }
  return out;
}

/** Column I / Column II lists written line by line inside the question text. */
export function extractMatchColumns(text: string): { intro: string; col1: string[]; col2: string[]; after: string; headers: [string, string] } | null {
  const lines = text.split('\n');
  const headerIdx: number[] = [];
  lines.forEach((l, idx) => {
    if (COL_HEADER.test(l.trim())) headerIdx.push(idx);
  });
  if (headerIdx.length !== 2) return null;
  const [h1, h2] = headerIdx;
  // A caption right under a header, e.g. "List-I" then "(Electromagnetic waves)", is not an item.
  const isCaption = (l: string) => /^\(([^)]{3,})\)$/.test(l) && !ITEM_LABEL.test(l);
  const col1Lines = lines.slice(h1 + 1, h2).map((l) => l.trim()).filter(Boolean);
  if (col1Lines.length && isCaption(col1Lines[0])) col1Lines.shift();
  const tailLines = lines.slice(h2 + 1);
  const col2: string[] = [];
  let k = 0;
  for (; k < tailLines.length; k++) {
    const l = tailLines[k].trim();
    if (!l) {
      if (col2.length > 0) break;
      continue;
    }
    if (col2.length === 0 && isCaption(l)) continue;
    col2.push(l);
  }
  const after = tailLines.slice(k).join('\n').trim();
  const titled = (l: string) => l.replace(/\*/g, '').replace(/:$/, '').trim();
  return {
    intro: lines.slice(0, h1).join('\n').trim(),
    col1: splitInlineItems(col1Lines).map(stripItemLabel),
    col2: splitInlineItems(col2).map(stripItemLabel),
    after,
    headers: [titled(lines[h1]), titled(lines[h2])],
  };
}

/** Labels used in match options, e.g. "a-(iv), b-(iii)" -> left [a,b], right [iv,iii]. */
export function parseMatchMapping(options: string[]): { left: Set<string>; right: Set<string>; looksLikeMapping: boolean } {
  const left = new Set<string>();
  const right = new Set<string>();
  let mappingOptions = 0;
  for (const o of options) {
    const pairs = [...o.matchAll(/\(?\s*([a-hA-H]|[1-8]|[PQRSTpqrst])\s*\)?\s*(?:[-–→:=]|->)\s*\(?\s*(iv|ix|vi{1,3}|v|i{1,3}|[1-8]|[p-tP-T]|[a-hA-H])\s*\)?(?![a-z])/g)];
    if (pairs.length >= 2) {
      mappingOptions++;
      pairs.forEach((p) => {
        left.add(p[1].toLowerCase());
        right.add(p[2].toLowerCase());
      });
    }
  }
  return { left, right, looksLikeMapping: mappingOptions >= 3 };
}

function labelFor(style: 'alpha' | 'num' | 'roman' | 'pqrs' | 'upper', i: number): string {
  if (style === 'alpha') return String.fromCharCode(97 + i);
  if (style === 'upper') return String.fromCharCode(65 + i);
  if (style === 'num') return String(i + 1);
  if (style === 'roman') return ROMAN[i] || String(i + 1);
  return 'pqrstuvw'[i] || String(i + 1);
}

function detectStyle(labels: Set<string>, fallback: 'alpha' | 'num' | 'roman' | 'pqrs'): 'alpha' | 'num' | 'roman' | 'pqrs' {
  const arr = [...labels];
  if (arr.length === 0) return fallback;
  if (arr.every((l) => /^(i{1,3}|iv|v|vi{0,3})$/.test(l))) return 'roman';
  if (arr.every((l) => /^[1-8]$/.test(l))) return 'num';
  if (arr.every((l) => /^[p-t]$/.test(l))) return 'pqrs';
  if (arr.every((l) => /^[a-h]$/.test(l))) return 'alpha';
  return fallback;
}

// ------------------------------------------------------------------ main entry

export function normalizeQuestion(row: any): NormalizeResult {
  const reasons: string[] = [];
  if (!row || typeof row !== 'object') return { ok: false, reasons: ['not_an_object'] };
  const id = isBlank(row.id) ? '' : String(row.id);
  if (!id) reasons.push('missing_id');

  let text = stripQuestionNumber(cleanText(row.question));
  const solution = cleanText(row.solution_text);
  const rawType = String(row.q_type || 'mcq_single').trim().toLowerCase();

  // Options: regular columns, else "match_options" {A..D}, else "predef_options" "A: ...\nB: ..."
  let options = stripOptionLabels(OPTION_FIELDS.map((f) => cleanText(row[f])));
  if (options.every((o) => !o) && row.match_options && typeof row.match_options === 'object') {
    options = stripOptionLabels(LETTERS.map((L) => cleanText(row.match_options[L])));
  }
  if (options.every((o) => !o) && !isBlank(row.predef_options)) {
    const map: Record<string, string> = {};
    cleanText(row.predef_options)
      .split('\n')
      .forEach((line) => {
        const m = line.match(/^\(?([A-D])\)?\s*[:.)]\s*(.+)$/);
        if (m) map[m[1]] = m[2].trim();
      });
    options = LETTERS.map((L) => map[L] || '');
  }

  const q: CleanQuestion = { id, q_type: 'mcq_single', question: text, solution_text: solution };

  // ------------------------------------------------ numerical
  if (rawType === 'numerical' || rawType === 'integer') {
    q.q_type = 'numerical';
    const rawAnswer = !isBlank(row.num_answer) ? row.num_answer : row.correct_option;
    const value = parseNumericAnswer(rawAnswer);
    if (value === null) reasons.push('numerical_answer_not_numeric');
    else {
      q.num_answer = value;
      q.answer_display = cleanText(rawAnswer);
    }
    if (!text) reasons.push('empty_question');
    else if (text.replace(/\{\{IMG::[^}]*\}\}/g, '').trim().length < 8 && !text.includes('{{IMG::')) reasons.push('question_too_short');
    return finish(q, [], reasons);
  }

  // ------------------------------------------------ structured stems
  const mapping = parseMatchMapping(options);

  if (rawType === 'match' || (Array.isArray(row.column_a) && row.column_a.length > 0)) {
    const col1 = (Array.isArray(row.column_a) ? row.column_a : []).map((x: unknown) => stripItemLabel(cleanText(x))).filter(Boolean);
    const col2 = (Array.isArray(row.column_b) ? row.column_b : []).map((x: unknown) => stripItemLabel(cleanText(x))).filter(Boolean);
    buildMatch(q, col1, col2, mapping, reasons);
    q.question = text || 'Match Column I with Column II and choose the correct option.';
  } else if (rawType === 'assertion_reason' || AR_A.test(text) || !isBlank(row.assertion)) {
    q.q_type = 'assertion_reason';
    if (!isBlank(row.assertion) && !isBlank(row.reason)) {
      q.assertion = cleanText(row.assertion);
      q.reason = cleanText(row.reason);
      q.question = text && !AR_A.test(text) ? text : '';
    } else {
      const ar = extractAssertionReason(text);
      if (!ar || !ar.assertion || !ar.reason) reasons.push('assertion_reason_incomplete');
      else {
        q.assertion = ar.assertion;
        q.reason = ar.reason;
        q.question = ar.intro;
        if (ar.after) q.stem_after = ar.after;
      }
    }
  } else if (ST1.test(text)) {
    const st = extractStatements(text);
    if (st) {
      if (!st.s1 || !st.s2) reasons.push('statement_incomplete');
      q.q_type = 'statements';
      q.statement_1 = st.s1;
      q.statement_2 = st.s2;
      q.question = st.intro;
      if (st.after) q.stem_after = st.after;
    } else if (!ST3.test(text)) {
      reasons.push('statement_incomplete');
    }
  } else {
    const cols = extractMatchColumns(text);
    if (cols) {
      q.question = cols.intro || 'Match Column I with Column II and choose the correct option.';
      if (cols.after) q.stem_after = cols.after;
      q.match_headers = cols.headers;
      buildMatch(q, cols.col1, cols.col2, mapping, reasons);
    } else if (
      !text.includes('{{IMG::') && // the two lists are often drawn in the attached image
      /\bmatch\b[\s\S]{0,60}\b(column|list)s?\b|\b(column|list)\s*[-–]?\s*(I|1)\b[\s\S]*\b(column|list)\s*[-–]?\s*(II|2)\b/i.test(text) &&
      mapping.looksLikeMapping
    ) {
      // "Match column I with column II" but the two lists are not in the text (were in a lost table)
      reasons.push('match_columns_missing');
    }
  }

  // ------------------------------------------------ options + key (all choice questions)
  const filled = options.filter((o) => o !== '');
  if (filled.length === 0) reasons.push('no_options');
  else if (filled.length < 4) reasons.push('missing_options');
  const norm = options.map((o) => o.replace(/\s+/g, '').toLowerCase());
  if (filled.length === 4 && new Set(norm).size < 4) reasons.push('duplicate_options');
  let key = parseCorrectOption(row.correct_option);
  if ('error' in key && key.error === 'invalid_answer_key') {
    const wanted = parseNumericAnswer(row.correct_option);
    const hits = wanted === null ? [] : options.map((o, i) => (parseNumericAnswer(o) === wanted ? i : -1)).filter((i) => i >= 0);
    if (hits.length === 1) key = { letter: LETTERS[hits[0]] };
  }
  if ('error' in key) reasons.push(key.error);
  else {
    q.correct_option = key.letter;
    if (options[LETTERS.indexOf(key.letter)] === '') reasons.push('answer_points_to_empty_option');
  }
  OPTION_FIELDS.forEach((f, i) => {
    q[f] = options[i];
  });

  // Stem repeating the options as "(a) ... (b) ..." lines: drop those lines when they match the options
  if (q.question && filled.length === 4) {
    const lines = q.question.split('\n');
    const optionLine = /^\(?\s*([a-dA-D1-4])\s*[.)]\s*(.+)$/;
    const trailing: number[] = [];
    for (let i = lines.length - 1; i >= 0 && trailing.length < 4; i--) {
      const m = lines[i].trim().match(optionLine);
      if (!m) break;
      trailing.unshift(i);
    }
    if (trailing.length === 4) {
      const same = trailing.every((li, k) => {
        const m = lines[li].trim().match(optionLine)!;
        return m[2].replace(/\s+/g, '').toLowerCase() === norm[k];
      });
      if (same) q.question = lines.slice(0, trailing[0]).join('\n').trim();
    }
  }

  const hasStructure = !!(q.assertion || q.statement_1 || (q.match_table && q.match_table.length));
  const visibleStem = q.question.replace(/\{\{IMG::[^}]*\}\}/g, '').trim();
  if (!hasStructure && !visibleStem && !q.question.includes('{{IMG::')) reasons.push('empty_question');
  else if (!hasStructure && visibleStem.length < 8 && !q.question.includes('{{IMG::')) reasons.push('question_too_short');

  return finish(q, options, reasons);
}

function buildMatch(
  q: CleanQuestion,
  col1: string[],
  col2: string[],
  mapping: ReturnType<typeof parseMatchMapping>,
  reasons: string[]
) {
  q.q_type = 'match';
  if (col1.length < 2 || col2.length < 2) {
    reasons.push('match_columns_missing');
    return;
  }
  if (mapping.looksLikeMapping) {
    const leftNeeded = mapping.left.size;
    const rightNeeded = mapping.right.size;
    if (col1.length !== leftNeeded) reasons.push('match_column1_count_mismatch');
    // Column II may hold one distractor beyond the labels the options use, not more.
    if (col2.length < rightNeeded || col2.length > Math.max(leftNeeded, rightNeeded) + 1) reasons.push('match_column2_count_mismatch');
  } else if (col2.length < col1.length - 1 || col2.length > col1.length + 2) {
    reasons.push('match_column_count_mismatch');
  }
  // Very short fragments ("At", "of", "No") mean the column was split mid-sentence.
  const FILLER = /^(at|no|of|and|the|a|an|to|in|on|by|for|is|or|as|with|from|its|it|be)$/i;
  const fragments = [...col1, ...col2].filter((c) => {
    if (/\$/.test(c)) return false;
    const word = c.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    return word.replace(/\s/g, '').length < 2 || FILLER.test(word);
  });
  if (fragments.length > 0) reasons.push('match_item_fragment');

  const leftStyle = detectStyle(mapping.left, 'alpha');
  const rightStyle = detectStyle(mapping.right, leftStyle === 'num' ? 'pqrs' : 'roman');
  const rows = Math.max(col1.length, col2.length);
  q.match_table = [];
  for (let i = 0; i < rows; i++) {
    q.match_table.push({
      col1: col1[i] ? `(${labelFor(leftStyle, i)}) ${col1[i]}` : '',
      col2: col2[i] ? `(${labelFor(rightStyle, i)}) ${col2[i]}` : '',
    });
  }
}

function finish(q: CleanQuestion, options: string[], reasons: string[]): NormalizeResult {
  const fields: string[] = [q.question, q.stem_after || '', q.assertion || '', q.reason || '', q.statement_1 || '', q.statement_2 || '', ...options];
  (q.match_table || []).forEach((r) => fields.push(r.col1, r.col2));
  for (const f of fields) {
    if (!f) continue;
    if (hasUnclearMarker(f)) {
      reasons.push('unclear_content');
      break;
    }
  }
  for (const f of fields) {
    if (!f) continue;
    const problem = checkRenderable(f);
    if (problem) {
      reasons.push(problem);
      break;
    }
  }
  if (q.solution_text && checkRenderable(q.solution_text)) {
    // A broken solution never blocks the question; it is simply not shown.
    q.solution_text = '';
  }
  const unique = [...new Set(reasons)];
  return unique.length ? { ok: false, reasons: unique } : { ok: true, question: q };
}

/**
 * Validates a question that is already in the app's structured shape (for example inside a
 * saved paper or an online exam), or cleans it if it still has the raw bank shape.
 * Returns the question to use, or the reasons it must not be shown.
 */
export function ensureCleanQuestion(q: any): NormalizeResult {
  if (!q || typeof q !== 'object') return { ok: false, reasons: ['not_an_object'] };
  const structured = q.q_type === 'statements' || q.q_type === 'match' || !!q.statement_1 || (Array.isArray(q.match_table) && q.match_table.length > 0);
  if (!structured) return normalizeQuestion(q);

  const reasons: string[] = [];
  const options = OPTION_FIELDS.map((f) => cleanText(q[f]));
  if (options.some((o) => !o)) reasons.push('missing_options');
  else if (new Set(options.map((o) => o.replace(/\s+/g, '').toLowerCase())).size < 4) reasons.push('duplicate_options');
  const key = parseCorrectOption(q.correct_option);
  if ('error' in key) reasons.push(key.error);
  if (q.q_type === 'statements' || q.statement_1) {
    if (!cleanText(q.statement_1) || !cleanText(q.statement_2)) reasons.push('statement_incomplete');
  }
  const table: MatchRow[] = Array.isArray(q.match_table) ? q.match_table : [];
  if (q.q_type === 'match' && table.filter((r) => r && (r.col1 || r.col2)).length < 2) reasons.push('match_columns_missing');

  const clean: CleanQuestion = {
    id: String(q.id || ''),
    q_type: q.q_type === 'match' || table.length ? 'match' : 'statements',
    question: cleanText(q.question),
    stem_after: cleanText(q.stem_after) || undefined,
    statement_1: cleanText(q.statement_1) || undefined,
    statement_2: cleanText(q.statement_2) || undefined,
    match_table: table.length ? table.map((r) => ({ col1: cleanText(r?.col1), col2: cleanText(r?.col2) })) : undefined,
    match_headers: Array.isArray(q.match_headers) ? q.match_headers : undefined,
    opt_a: options[0],
    opt_b: options[1],
    opt_c: options[2],
    opt_d: options[3],
    correct_option: 'letter' in key ? key.letter : undefined,
    solution_text: cleanText(q.solution_text),
  };
  return finish(clean, options, reasons);
}
