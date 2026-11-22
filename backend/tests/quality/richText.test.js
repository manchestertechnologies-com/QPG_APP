/**
 * Web renderer (mobile/src/services/richText.ts) and client paper guard (questionGuard.ts).
 * Compiled by tests/quality/tsconfig.frontend.json into tests/quality/.build.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { renderRichText, escapeHtml, splitRich } = require('./.build/richText');
const { questionProblems, sanitizePaper } = require('./.build/questionGuard');

// Escaped text such as "&lt;img onerror=...&gt;" is harmless; only real tags/attributes are unsafe.
const noScript = (html) =>
  assert.ok(!/<script|<[a-z][^>]*\son[a-z]+\s*=|<[a-z][^>]*\s(?:href|src)\s*=\s*["']?\s*javascript:/i.test(html), `unsafe html: ${html}`);

// ----------------------------------------------------------- escaping / XSS
const xss = [
  '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '"><svg onload=alert(1)>', '<a href="javascript:alert(1)">x</a>',
  "<iframe src='evil'></iframe>", '<style>body{display:none}</style>', '{{IMG::javascript:alert(1)}}', '{{IMG::https://x.com/a.png" onerror="alert(1)}}',
  '<b onmouseover=alert(1)>hover</b>', '&lt;script&gt;', '<<script>>', '</div><script>x</script>',
];
for (const input of xss) {
  test(`renderer escapes ${JSON.stringify(input).slice(0, 40)}`, () => noScript(renderRichText(input)));
}
const escapes = [['a < b', 'a &lt; b'], ['x > y', 'x &gt; y'], ['A & B', 'A &amp; B'], ['"quoted"', '&quot;quoted&quot;'], ["it's", 'it&#39;s']];
for (const [input, expected] of escapes) {
  test(`plain text escaped: ${input}`, () => assert.equal(renderRichText(input), expected));
  test(`escapeHtml(${input})`, () => assert.equal(escapeHtml(input), expected));
}

// ----------------------------------------------------------- formatting
const formatting = [
  ['line1\nline2', 'line1<br/>line2'], ['a\n\nb', 'a<br/><br/>b'], ['**Column I**', '<strong>Column I</strong>'], ['say **bold** now', 'say <strong>bold</strong> now'],
  ['a\r\nb', 'a<br/>b'], ['**unclosed bold', '**unclosed bold'], ['', ''], ['   ', ''],
];
for (const [input, expected] of formatting) {
  test(`formatting ${JSON.stringify(input)}`, () => assert.equal(renderRichText(input), expected));
}
test('null renders empty', () => assert.equal(renderRichText(null), ''));
test('undefined renders empty', () => assert.equal(renderRichText(undefined), ''));
test('number renders as text', () => assert.equal(renderRichText(42), '42'));

// ----------------------------------------------------------- math
const mathOk = [
  '$x^2$', '$$\\int_0^1 x\\,dx$$', '\\(a+b\\)', '\\[\\frac{1}{2}\\]', '$\\Delta H$', '$\\vec{F}=m\\vec{a}$', '$10^{-3}\\,\\text{m}$', '$\\sqrt{2}$',
  '$\\alpha + \\beta$', '$\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}$', '$\\rightleftharpoons$', '$\\ce{H2O}$',
];
for (const input of mathOk) {
  test(`math renders with KaTeX: ${input}`, () => {
    const html = renderRichText(`Value ${input} here`);
    assert.ok(html.includes('class="katex'), html.slice(0, 120));
    assert.ok(!html.includes('math-error'));
  });
}
test('words around math keep their spaces (not turned into one formula)', () => {
  const html = renderRichText('The value of $x$ is positive and \\alpha is small');
  assert.ok(html.startsWith('The value of '));
  assert.ok(html.includes(' is positive and '));
});
test('bare \\alpha outside $ renders as math', () => assert.ok(renderRichText('angle \\alpha here').includes('katex')));
test('bare \\frac{1}{2} outside $ renders as math', () => assert.ok(renderRichText('half is \\frac{1}{2}').includes('katex')));
test('unknown bare command stays text', () => assert.equal(renderRichText('path C:\\folder\\name'), 'path C:\\folder\\name'));
test('invalid formula shows escaped source, never throws', () => {
  const html = renderRichText('bad $\\frac{1}{$ here');
  assert.ok(html.includes('math-error') || html.includes('$'));
  noScript(html);
});
test('unmatched $ is kept as text', () => assert.equal(renderRichText('costs $5 today'), 'costs $5 today'));
test('escaped \\$ is a dollar sign', () => assert.equal(renderRichText('costs \\$5'), 'costs $5'));
test('script inside math cannot run', () => noScript(renderRichText('$\\text{<script>alert(1)</script>}$')));
test('splitRich: text/math/img segments', () => {
  const segs = splitRich('a $b$ c {{IMG::https://x.y/z.png}} d');
  assert.deepEqual(segs.map((s) => s.kind), ['text', 'math', 'text', 'img', 'text']);
});

// ----------------------------------------------------------- images
test('https image rendered', () => assert.ok(renderRichText('{{IMG::https://res.cloudinary.com/a/b.png}}').includes('<img src="https://res.cloudinary.com/a/b.png"')));
test('data image rendered', () => assert.ok(renderRichText('{{IMG::data:image/png;base64,iVBORw0KGgo=}}').includes('src="data:image/png;base64,iVBORw0KGgo="')));
for (const badImg of ['{{IMG::ftp://x/y.png}}', '{{IMG::not a url}}', '{{IMG::data:text/html;base64,PHNjcmlwdD4=}}', '{{IMG::javascript:alert(1)}}']) {
  test(`bad image dropped: ${badImg}`, () => assert.ok(!renderRichText(badImg).includes('<img')));
}

// ----------------------------------------------------------- client paper guard
const good = { id: 'g', q_type: 'mcq_single', question: 'A proper question text?', opt_a: 'one', opt_b: 'two', opt_c: 'three', opt_d: 'four', correct_option: 'A' };
test('guard: good question has no problems', () => assert.deepEqual(questionProblems(good), []));
test('guard: numerical with numeric answer ok', () => assert.deepEqual(questionProblems({ id: 'n', q_type: 'numerical', question: 'Compute it.', num_answer: '4' }), []));
const guardBad = [
  ['missing option', { ...good, opt_c: '' }, 'missing_options'],
  ['duplicate option', { ...good, opt_d: 'one' }, 'duplicate_options'],
  ['bad key', { ...good, correct_option: 'Z' }, 'invalid_answer_key'],
  ['multi key', { ...good, correct_option: 'A,B' }, 'invalid_answer_key'],
  ['empty question', { ...good, question: '' }, 'empty_question'],
  ['numerical text answer', { id: 'n', q_type: 'numerical', question: 'Compute.', num_answer: 'because' }, 'numerical_answer_not_numeric'],
  ['numerical missing answer', { id: 'n', q_type: 'numerical', question: 'Compute.' }, 'numerical_answer_not_numeric'],
  ['broken $', { ...good, opt_b: 'two $x' }, 'unbalanced_math'],
  ['unclear', { ...good, question: 'Interval [UNCLEAR] given' }, 'unclear_content'],
  ['statement half missing', { ...good, statement_1: 'only one' }, 'statement_incomplete'],
  ['assertion without reason', { ...good, q_type: 'assertion_reason', question: 'Q', assertion: 'A only' }, 'assertion_reason_incomplete'],
  ['not an object', null, 'not_an_object'],
];
for (const [name, q, reason] of guardBad) {
  test(`guard flags: ${name}`, () => assert.ok(questionProblems(q).includes(reason), JSON.stringify(questionProblems(q))));
}
test('sanitizePaper removes bad questions and rebuilds the key', () => {
  const paper = {
    sections: [
      { name: 'A', attempt_count: 3, questions: [good, { ...good, id: 'b', opt_b: '' }, { ...good, id: 'c', correct_option: 'C' }] },
      { name: 'B', attempt_count: 1, questions: [{ id: 'n', q_type: 'numerical', question: 'Compute.', num_answer: '9' }] },
    ],
    answer_key: [],
    sets: { P: {} },
  };
  const { paper: out, removed } = sanitizePaper(paper);
  assert.equal(removed, 1);
  assert.equal(out.sections[0].questions.length, 2);
  assert.equal(out.sections[0].attempt_count, 2);
  assert.deepEqual(out.answer_key.map((k) => k.answer), ['A', 'C', '9']);
  assert.equal(out.questions_count, 3);
  assert.equal(out.sets, undefined);
});
test('sanitizePaper drops empty sections', () => {
  const { paper: out } = sanitizePaper({ sections: [{ name: 'X', questions: [{ ...good, opt_a: '' }] }, { name: 'Y', questions: [good] }] });
  assert.deepEqual(out.sections.map((s) => s.name), ['Y']);
});
test('sanitizePaper leaves a clean paper untouched', () => {
  const p = { sections: [{ name: 'A', questions: [good] }] };
  const r = sanitizePaper(p);
  assert.equal(r.removed, 0);
  assert.equal(r.paper, p);
});
