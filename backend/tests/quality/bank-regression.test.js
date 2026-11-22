/**
 * Whole-bank regression (optional): runs every real question through the quality gate and the
 * web renderer. Enabled when QUESTION_DUMP points to a JSON array of raw bank rows, e.g.
 *   QUESTION_DUMP=/path/all.json npm run test:quality
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { normalizeQuestion } = require('../../dist/services/questionQuality');
const { renderRichText, splitRich } = require('./.build/richText');

const dump = process.env.QUESTION_DUMP;
const ASSERTION_LEFT_IN_STEM = /(^|\n)\s*assertion\s*(\(A\))?\s*:/i;
const STATEMENT_LEFT_IN_STEM = /statement\s*(I|1)\s*[:.]/i;

/** Problems a reader would see: KaTeX errors, leftover markdown "**" in plain text, script tags. */
function renderProblem(text) {
  const html = renderRichText(text);
  if (html.includes('math-error')) return 'math error';
  if (/<script/i.test(html)) return 'script';
  // "**" inside a formula can be a deliberate blank, so only plain-text segments are checked
  const leftoverBold = splitRich(text).some((seg) => seg.kind === 'text' && renderRichText(seg.value).includes('**'));
  return leftoverBold ? 'leftover **' : null;
}

test('every accepted bank question renders cleanly', { skip: !dump || !fs.existsSync(dump || '') ? 'QUESTION_DUMP not set' : false }, () => {
  const rows = JSON.parse(fs.readFileSync(dump, 'utf8'));
  const failures = [];
  let accepted = 0;
  for (const row of rows) {
    const r = normalizeQuestion(row);
    if (!r.ok) continue;
    accepted++;
    const c = r.question;
    const parts = [c.question, c.stem_after, c.assertion, c.reason, c.statement_1, c.statement_2, c.opt_a, c.opt_b, c.opt_c, c.opt_d];
    (c.match_table || []).forEach((m) => parts.push(m.col1, m.col2));
    for (const p of parts) {
      if (!p) continue;
      const problem = renderProblem(p);
      if (problem) {
        failures.push({ id: row.id, problem, part: p.slice(0, 120) });
        break;
      }
    }
    if (c.q_type === 'numerical') {
      if (!Number.isFinite(parseFloat(c.num_answer))) failures.push({ id: row.id, problem: 'num_answer ' + c.num_answer });
    } else {
      const opts = [c.opt_a, c.opt_b, c.opt_c, c.opt_d];
      if (opts.some((o) => !o) || new Set(opts.map((o) => o.replace(/\s+/g, '').toLowerCase())).size < 4) failures.push({ id: row.id, problem: 'options' });
      if (!['A', 'B', 'C', 'D'].includes(c.correct_option)) failures.push({ id: row.id, problem: 'key ' + c.correct_option });
    }
    if (c.q_type === 'statements' && STATEMENT_LEFT_IN_STEM.test(c.question)) failures.push({ id: row.id, problem: 'statement text duplicated in stem' });
    // an intro like "one is labelled as Assertion (A)" is fine; "Assertion: <text>" left in the stem is not
    if (c.q_type === 'assertion_reason' && ASSERTION_LEFT_IN_STEM.test(c.question)) failures.push({ id: row.id, problem: 'assertion text duplicated in stem' });
  }
  assert.ok(accepted > rows.length * 0.9, `only ${accepted}/${rows.length} accepted`);
  assert.deepEqual(failures.slice(0, 10), [], `${failures.length} accepted questions would render wrongly`);
});
