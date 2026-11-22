/**
 * Question quality gate: unit + combinatorial tests (server side).
 * Run with:  npm run test:quality   (from backend/)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const Q = require('../../dist/services/questionQuality');

const OPTS = { opt_a: 'Option one', opt_b: 'Option two', opt_c: 'Option three', opt_d: 'Option four' };
const mcq = (over = {}) => ({ id: 'q1', q_type: 'mcq_single', question: 'Which of the following is correct about this system?', ...OPTS, correct_option: 'B', ...over });
const ok = (row) => {
  const r = Q.normalizeQuestion(row);
  assert.equal(r.ok, true, `expected ok, got ${JSON.stringify(r.reasons)}`);
  return r.question;
};
const bad = (row, reason) => {
  const r = Q.normalizeQuestion(row);
  assert.equal(r.ok, false, 'expected rejection');
  if (reason) assert.ok(r.reasons.includes(reason), `expected ${reason}, got ${JSON.stringify(r.reasons)}`);
  return r.reasons;
};

// ----------------------------------------------------------- 1. correct option parsing
const validKeys = [
  ['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D'], ['a', 'A'], ['b', 'B'], ['c', 'C'], ['d', 'D'],
  ['(A)', 'A'], ['(b)', 'B'], [' C ', 'C'], ['D.', 'D'], ['Option A', 'A'], ['option b', 'B'], ['Opt C', 'C'], ['Ans: D', 'D'],
  ['Answer - A', 'A'], ['1', 'A'], ['2', 'B'], ['3', 'C'], ['4', 'D'], ['(1)', 'A'], ['(4)', 'D'], ['[2]', 'B'],
  ['i', 'A'], ['ii', 'B'], ['iii', 'C'], ['iv', 'D'], ['(iii)', 'C'], [3, 'C'],
];
for (const [input, expected] of validKeys) {
  test(`answer key "${input}" -> ${expected}`, () => assert.deepEqual(Q.parseCorrectOption(input), { letter: expected }));
}
const invalidKeys = [
  ['', 'missing_answer'], [null, 'missing_answer'], [undefined, 'missing_answer'], ['   ', 'missing_answer'],
  ['A, C', 'multiple_correct'], ['A,B', 'multiple_correct'], ['B and D', 'multiple_correct'], ['A; C', 'multiple_correct'], ['A/B', 'multiple_correct'],
  ['E', 'invalid_answer_key'], ['5', 'invalid_answer_key'], ['0', 'invalid_answer_key'], ['AB', 'invalid_answer_key'], ['35', 'invalid_answer_key'],
  ['v', 'invalid_answer_key'], ['correct', 'invalid_answer_key'], ['N/A', 'multiple_correct'], ['A → 4', 'invalid_answer_key'],
];
for (const [input, reason] of invalidKeys) {
  test(`answer key ${JSON.stringify(input)} rejected (${reason})`, () => assert.deepEqual(Q.parseCorrectOption(input), { error: reason }));
}

// ----------------------------------------------------------- 2. numerical answers
const numericOk = [
  ['12', '12'], ['0', '0'], ['-3', '-3'], ['−3', '-3'], ['0.5', '0.5'], ['-0.25', '-0.25'], ['3.14159', '3.1416'], ['100', '100'],
  ['$4$', '4'], ['$$7$$', '7'], ['\\(5\\)', '5'], ['\\[9\\]', '9'], ['$ 2.5 $', '2.5'], ['$-1$', '-1'],
  ['1/2', '0.5'], ['3/4', '0.75'], ['-1/4', '-0.25'], ['2 / 5', '0.4'], ['\\dfrac{3}{4}', '0.75'], ['\\frac{1}{2}', '0.5'], ['$\\frac{5}{2}$', '2.5'],
  ['$\\dfrac{1}{8}$', '0.125'], ['-\\frac{1}{2}', '-0.5'], ['2.94e6', '2940000'], ['5e-3', '0.005'], ['1.5E2', '150'],
  ['5 x 10^-3', '0.005'], ['2 × 10^3', '2000'], ['3 \\times 10^{2}', '300'], ['6 cm', '6'], ['2 m/s', '2'], ['10 N', '10'], ['8%', '8'],
  ['4.5%', '4.5'], ['64 kPa', '64'], ['1500 m', '1500'], ['12.3 m/s', '12.3'], ['90 degrees', '90'], ['37 °', '37'],
  ['$0.10\\,\\mathrm{m}$', '0.1'], ['$25$', '25'], ['  42  ', '42'], [7, '7'], ['1.0', '1'], ['0.50', '0.5'],
];
for (const [input, expected] of numericOk) {
  test(`numeric answer ${JSON.stringify(input)} -> ${expected}`, () => assert.equal(Q.parseNumericAnswer(input), expected));
}
const numericBad = [
  '', null, undefined, 'Because the field is uniform', 'Yes', 'No', 'magnetic', '2:1', '1:4', '12; 4', '3 or 4', '1 and 2',
  'π/4', 'A', 'B', 'D', '[UNCLEAR]', '[UNCLEAR: smudged]', 'N/A (conceptual)', 'x = 2', 'Order 2', 'sp3', '1/0', 'Continuous',
  'infinite', '$\\tan^{-1} x$', 'ln|x| + C', 'a/2', '(a) Same', '???', 'Not defined', 'e^x sin x',
];
for (const input of numericBad) {
  test(`numeric answer ${JSON.stringify(input)} is not a number`, () => assert.equal(Q.parseNumericAnswer(input), null));
}

// ----------------------------------------------------------- 3. text cleaning
const cleanCases = [
  ['a<br>b', 'a\nb'], ['a<br/>b', 'a\nb'], ['a<BR />b', 'a\nb'], ['x&nbsp;y', 'x y'], ['5 &lt; 6', '5 < 6'], ['A &amp; B', 'A & B'],
  ['<p>hello</p>', 'hello'], ['<b>bold</b> text', 'bold text'], ['H<sub>2</sub>O', 'H_{2}O'], ['x<sup>2</sup>', 'x^{2}'],
  ['a\r\nb', 'a\nb'], ['a\n\n\n\nb', 'a\n\nb'], ['  spaced   out  ', 'spaced out'], ['zero​width', 'zerowidth'],
  ['[QBP_DIFFICULTY:Hard] What is x?', 'What is x?'], ['[QBP_EXAM:NEET] Q', 'Q'], ['```\ncode\n```', 'code'], ['line1\\nline2', 'line1\nline2'],
  ['keep \\nu and \\neq', 'keep \\nu and \\neq'], [null, ''], [undefined, ''], [42, '42'], ['tab\there', 'tab here'], [' nbsp', 'nbsp'],
];
for (const [input, expected] of cleanCases) {
  test(`cleanText ${JSON.stringify(input)}`, () => assert.equal(Q.cleanText(input), expected));
}

// ----------------------------------------------------------- 4. numbering + option labels
const numberCases = [
  ['1. What is force?', 'What is force?'], ['12) What is work?', 'What is work?'], ['Q1. Define power.', 'Define power.'],
  ['Q.7 Find x.', 'Find x.'], ['Question: Find y.', 'Find y.'], ['uestion:\nMatch the lists', 'Match the lists'], ['Q: Why?', 'Why?'],
  ['1.5 kg mass is placed', '1.5 kg mass is placed'], ['2019 was a year', '2019 was a year'], ['Normal question', 'Normal question'],
];
for (const [input, expected] of numberCases) {
  test(`strip numbering ${JSON.stringify(input)}`, () => assert.equal(Q.stripQuestionNumber(input), expected));
}
const labelCases = [
  ['(a) apple', 'apple'], ['(B) ball', 'ball'], ['(1) one', 'one'], ['(4) four', 'four'], ['a) cat', 'cat'], ['D. dog', 'dog'],
  ['(1)-(iv), (2)-(i), (3)-(ii), (4)-(iii)', '(1)-(iv), (2)-(i), (3)-(ii), (4)-(iii)'], ['a-(iv), b-(iii)', 'a-(iv), b-(iii)'],
  ['A→3, B→1', 'A→3, B→1'], ['1.5 m', '1.5 m'], ['$x^2$', '$x^2$'], ['(a)-(ii)', '(a)-(ii)'], ['Both A and R are true', 'Both A and R are true'],
  ['(1) a-(iv), b-(ii)', 'a-(iv), b-(ii)'],
];
for (const [input, expected] of labelCases) {
  test(`strip option label ${JSON.stringify(input)}`, () => assert.equal(Q.stripOptionLabel(input), expected));
}

// ----------------------------------------------------------- 5. render checks (math, images, html)
const renderable = [
  'Plain text only', 'Energy $E=mc^2$ is conserved', 'Two formulas $a+b$ and $c-d$', 'Display $$\\int_0^1 x\\,dx$$ here',
  'Paren \\(x^2\\) form', 'Bracket \\[\\frac{1}{2}\\] form', 'Price is \\$5 only', '$\\Delta H = -286\\,\\mathrm{kJ}$',
  '$\\ce{H2O}$ is water', '$\\vec{F} = m\\vec{a}$', '$\\sqrt{2}$ and $\\pi$', 'Image {{IMG::https://res.cloudinary.com/x/y.png}} here',
  '{{IMG::data:image/png;base64,iVBORw0KGgo=}}', 'Matrix $\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}$', '5 < 6 and 7 > 3',
  '$\\frac{\\lambda_1}{\\lambda_2}$', '$x_{n+1} = x_n^2$', '$10^{-3}\\,\\text{m}$', '$\\rightleftharpoons$', 'Line one\nLine two',
];
for (const s of renderable) {
  test(`renderable: ${JSON.stringify(s).slice(0, 50)}`, () => assert.equal(Q.checkRenderable(s), null));
}
const notRenderable = [
  ['Unclosed $x^2 formula', 'unbalanced_math'], ['Two $a$ and $b', 'unbalanced_math'], ['$$ open display', 'unbalanced_math'],
  ['\\( never closed', 'unbalanced_math'], ['Broken $\\frac{1}{$ here', 'invalid_math'], ['Bad $\\left( x$', 'invalid_math'],
  ['Unknown $\\notacommand{x}$', 'invalid_math'], ['Bad env $\\begin{matrix} 1 $', 'invalid_math'], ['Bad image {{IMG::not a url}}', 'bad_image_url'],
  ['JS image {{IMG::javascript:alert(1)}}', 'bad_image_url'], ['Table <table><tr><td>x</td></tr></table>', 'html_markup'],
  ['Script <script>alert(1)</script>', 'html_markup'], ['Frame <iframe src=x>', 'html_markup'], ['Raw \\frac{1}{2} outside', 'latex_outside_math'],
  ['Raw \\sqrt{2} outside', 'latex_outside_math'], ['Unclosed {{IMG::https://x.com/a.png', 'unbalanced_math'], ['Empty $$ $$ math', 'invalid_math'],
];
for (const [s, reason] of notRenderable) {
  test(`not renderable (${reason}): ${JSON.stringify(s).slice(0, 40)}`, () => assert.equal(Q.checkRenderable(s), reason));
}

// ----------------------------------------------------------- 6. assertion / reason extraction
const arCases = [
  ['Assertion: A is true.\nReason: R is true.', 'A is true.', 'R is true.', ''],
  ['Assertion (A): Heat flows.\nReason (R): Temperature differs.', 'Heat flows.', 'Temperature differs.', ''],
  ['Given below are two statements.\nAssertion: X.\nReason: Y.', 'X.', 'Y.', 'Given below are two statements.'],
  ['**Assertion**: Bold A.\n**Reason**: Bold R.', 'Bold A.', 'Bold R.', ''],
  ['Assertion - Dash A.\nReason - Dash R.', 'Dash A.', 'Dash R.', ''],
  ['Assertion: Inline A. Reason: Inline R.', 'Inline A.', 'Inline R.', ''],
  ['Assertion: Formula $x^2$ holds.\nReason: Since $x>0$.', 'Formula $x^2$ holds.', 'Since $x>0$.', ''],
];
for (const [text, a, r, intro] of arCases) {
  test(`assertion/reason extraction: ${JSON.stringify(text).slice(0, 40)}`, () => {
    const out = Q.extractAssertionReason(text);
    assert.ok(out);
    assert.equal(out.assertion, a);
    assert.equal(out.reason, r);
    assert.equal(out.intro, intro);
  });
}
test('assertion/reason trailing instruction becomes stem_after', () => {
  const out = Q.extractAssertionReason('Assertion: A.\nReason: R.\nIn the light of the above, choose the correct answer.');
  assert.equal(out.reason, 'R.');
  assert.match(out.after, /^In the light/);
});
for (const text of ['Assertion: only assertion', 'Reason: only reason', 'No markers here', '']) {
  test(`assertion/reason not extracted from ${JSON.stringify(text)}`, () => assert.equal(Q.extractAssertionReason(text), null));
}

// ----------------------------------------------------------- 7. statements extraction
const stCases = [
  ['Statement I: First.\nStatement II: Second.', 'First.', 'Second.'],
  ['Statement-I: Dash one.\nStatement-II: Dash two.', 'Dash one.', 'Dash two.'],
  ['Statement 1: Numeric one.\nStatement 2: Numeric two.', 'Numeric one.', 'Numeric two.'],
  ['Given below are two statements:\nStatement I: A.\nStatement II: B.', 'A.', 'B.'],
  ['Statement I: Has $x^2$.\nStatement II: Has $y$.', 'Has $x^2$.', 'Has $y$.'],
  ['**Statement I**: Bold.\n**Statement II**: Also bold.', 'Bold.', 'Also bold.'],
  ['Statement I - With dash. Statement II - Inline.', 'With dash.', 'Inline.'],
];
for (const [text, s1, s2] of stCases) {
  test(`statement extraction: ${JSON.stringify(text).slice(0, 40)}`, () => {
    const out = Q.extractStatements(text);
    assert.ok(out);
    assert.equal(out.s1, s1);
    assert.equal(out.s2, s2);
  });
}
for (const text of ['Statement I: A.\nStatement II: B.\nStatement III: C.', 'Statement I: only one', 'Nothing here']) {
  test(`statements not structured: ${JSON.stringify(text).slice(0, 40)}`, () => assert.equal(Q.extractStatements(text), null));
}

// ----------------------------------------------------------- 8. match columns + mapping
const colText = (h1, h2, c1, c2, intro = 'Match the following.') => `${intro}\n\n${h1}\n${c1.join('\n')}\n\n${h2}\n${c2.join('\n')}`;
const C1 = ['Force', 'Work', 'Power', 'Energy'];
const C2 = ['newton', 'joule', 'watt', 'erg'];
const headerPairs = [['**Column I**', '**Column II**'], ['Column I', 'Column II'], ['List-I', 'List-II'], ['List I', 'List II'], ['Column-I:', 'Column-II:'], ['Column A', 'Column B'], ['**List - I**', '**List - II**'], ['List 1', 'List 2']];
for (const [h1, h2] of headerPairs) {
  test(`match columns with headers ${h1} / ${h2}`, () => {
    const out = Q.extractMatchColumns(colText(h1, h2, C1, C2));
    assert.ok(out);
    assert.deepEqual(out.col1, C1);
    assert.deepEqual(out.col2, C2);
    assert.equal(out.intro, 'Match the following.');
  });
}
test('match columns: item labels are stripped', () => {
  const out = Q.extractMatchColumns(colText('List-I', 'List-II', C1.map((c, i) => `(${'abcd'[i]}) ${c}`), C2.map((c, i) => `(${['i', 'ii', 'iii', 'iv'][i]}) ${c}`)));
  assert.deepEqual(out.col1, C1);
  assert.deepEqual(out.col2, C2);
});
test('match columns: caption under header is skipped', () => {
  const out = Q.extractMatchColumns('Match.\nList-I\n(Electromagnetic waves)\n(a) AM radio\n(b) Microwaves\nList-II\n(Wavelength)\n(i) 1 m\n(ii) 1 cm');
  assert.deepEqual(out.col1, ['AM radio', 'Microwaves']);
  assert.deepEqual(out.col2, ['1 m', '1 cm']);
});
test('match columns: squashed column is split on labels', () => {
  const out = Q.extractMatchColumns('Match.\n**Column I**\nA\nB\nC\n\n**Column II**\n(i) first thing (ii) second thing (iii) third thing');
  assert.deepEqual(out.col2, ['first thing', 'second thing', 'third thing']);
});
test('match columns: trailing instruction kept separately', () => {
  const out = Q.extractMatchColumns(colText('Column I', 'Column II', C1, C2) + '\n\nChoose the correct answer.');
  assert.equal(out.after, 'Choose the correct answer.');
});
for (const text of ['No columns here', 'Column I only\nForce', 'Column I\nA\nColumn II\nB\nColumn III\nC']) {
  test(`match columns not found: ${JSON.stringify(text).slice(0, 30)}`, () => assert.equal(Q.extractMatchColumns(text), null));
}
const mappingCases = [
  [['a-(iv), b-(iii), c-(i), d-(ii)', 'a-(i), b-(ii), c-(iii), d-(iv)', 'a-(ii), b-(i), c-(iv), d-(iii)', 'a-(iii), b-(iv), c-(ii), d-(i)'], 4, 4],
  [['(1)-(q), (2)-(p), (3)-(s), (4)-(r)', '(1)-(p), (2)-(q), (3)-(r), (4)-(s)', '(1)-(s), (2)-(r), (3)-(q), (4)-(p)', '(1)-(r), (2)-(s), (3)-(p), (4)-(q)'], 4, 4],
  [['A→3, B→1, C→2', 'A→1, B→2, C→3', 'A→2, B→3, C→1', 'A→3, B→2, C→1'], 3, 3],
  [['a–(ii); b–(iv); c–(i); d–(iii)', 'a–(i); b–(ii); c–(iii); d–(iv)', 'a–(iv); b–(iii); c–(ii); d–(i)', 'a–(iii); b–(i); c–(iv); d–(ii)'], 4, 4],
  [['a-(vi), b-(v), c-(iv), d-(ii)', 'a-(v), b-(vi), c-(ii), d-(iv)', 'a-(iv), b-(ii), c-(vi), d-(v)', 'a-(ii), b-(iv), c-(v), d-(vi)'], 4, 4],
];
mappingCases.forEach(([opts, left, right], i) => {
  test(`match mapping parse #${i + 1}`, () => {
    const m = Q.parseMatchMapping(opts);
    assert.equal(m.looksLikeMapping, true);
    assert.equal(m.left.size, left);
    assert.equal(m.right.size, right);
  });
});
test('plain options are not a mapping', () => assert.equal(Q.parseMatchMapping(['1 N', '2 N', '3 N', '4 N']).looksLikeMapping, false));

// ----------------------------------------------------------- 9. end-to-end: valid questions of every type
test('mcq: clean pass-through', () => {
  const q = ok(mcq());
  assert.equal(q.q_type, 'mcq_single');
  assert.equal(q.correct_option, 'B');
});
test('mcq: numbering and option labels removed', () => {
  const q = ok(mcq({ question: '3. Which of the following is a vector quantity?', opt_a: '(a) mass', opt_b: '(b) speed', opt_c: '(c) velocity', opt_d: '(d) time', correct_option: '3' }));
  assert.equal(q.question, 'Which of the following is a vector quantity?');
  assert.equal(q.opt_c, 'velocity');
  assert.equal(q.correct_option, 'C');
});
test('mcq: answer stored as option value is recovered', () => {
  const q = ok(mcq({ opt_a: '$25\\,\\mathrm{Hz}$', opt_b: '$30\\,\\mathrm{Hz}$', opt_c: '$35\\,\\mathrm{Hz}$', opt_d: '$40\\,\\mathrm{Hz}$', correct_option: '35' }));
  assert.equal(q.correct_option, 'C');
});
test('mcq: options repeated at the end of the stem are removed', () => {
  const q = ok(mcq({ question: 'Pick one of these values carefully:\n(a) Option one\n(b) Option two\n(c) Option three\n(d) Option four' }));
  assert.equal(q.question, 'Pick one of these values carefully:');
});
test('mcq: image-only stem is allowed', () => ok(mcq({ question: '{{IMG::https://res.cloudinary.com/demo/image.png}}' })));
test('mcq: html line breaks kept as newlines', () => assert.equal(ok(mcq({ question: 'First line of the question<br>Second line of it' })).question, 'First line of the question\nSecond line of it'));
test('assertion-reason inline text is structured', () => {
  const q = ok({ id: 'ar', q_type: 'assertion_reason', question: 'Assertion: A spring stores energy.\nReason: Work is done on it.', opt_a: 'Both true, R explains A', opt_b: 'Both true, R does not explain A', opt_c: 'A true, R false', opt_d: 'A false, R true', correct_option: 'A' });
  assert.equal(q.q_type, 'assertion_reason');
  assert.equal(q.assertion, 'A spring stores energy.');
  assert.equal(q.reason, 'Work is done on it.');
  assert.equal(q.question, '');
});
test('assertion-reason from fields + predef options', () => {
  const q = ok({ id: 'ar2', q_type: 'assertion_reason', question: '', assertion: 'Torque acts.', reason: 'Force acts.', predef_options: 'A: Both true, R explains A.\nB: Both true, R does not explain A.\nC: A true, R false.\nD: A false, R true.', correct_option: 'D' });
  assert.equal(q.opt_d, 'A false, R true.');
  assert.equal(q.correct_option, 'D');
});
test('mcq text with Assertion markers becomes assertion_reason', () => assert.equal(ok(mcq({ question: 'Assertion: X is true here.\nReason: Y explains it.' })).q_type, 'assertion_reason'));
test('statements are structured (no duplicate text left in stem)', () => {
  const q = ok(mcq({ question: 'Given below are two statements:\nStatement I: Hyperconjugation is no-bond resonance.\nStatement II: It is absent in alkenes.' }));
  assert.equal(q.q_type, 'statements');
  assert.equal(q.question, 'Given below are two statements:');
  assert.equal(q.statement_1, 'Hyperconjugation is no-bond resonance.');
  assert.ok(!q.question.includes('Statement I'));
});
test('three statements stay as plain text', () => {
  const q = ok(mcq({ question: 'Consider:\nStatement I: a.\nStatement II: b.\nStatement III: c.\nHow many are correct?' }));
  assert.equal(q.q_type, 'mcq_single');
});
const MAPPING_OPTS = { opt_a: 'a-(iv), b-(iii), c-(i), d-(ii)', opt_b: 'a-(i), b-(ii), c-(iii), d-(iv)', opt_c: 'a-(ii), b-(i), c-(iv), d-(iii)', opt_d: 'a-(iii), b-(iv), c-(ii), d-(i)' };
test('match text becomes a labelled table', () => {
  const q = ok(mcq({ question: colText('**Column I**', '**Column II**', C1, C2, 'Match List-I with List-II.'), ...MAPPING_OPTS }));
  assert.equal(q.q_type, 'match');
  assert.equal(q.match_table.length, 4);
  assert.equal(q.match_table[0].col1, '(a) Force');
  assert.equal(q.match_table[3].col2, '(iv) erg');
  assert.equal(q.question, 'Match List-I with List-II.');
});
test('match from column arrays + match_options', () => {
  const q = ok({ id: 'm', q_type: 'match', question: '', column_a: C1, column_b: C2, match_options: { A: MAPPING_OPTS.opt_a, B: MAPPING_OPTS.opt_b, C: MAPPING_OPTS.opt_c, D: MAPPING_OPTS.opt_d }, correct_option: 'C' });
  assert.equal(q.match_table.length, 4);
  assert.equal(q.opt_a, MAPPING_OPTS.opt_a);
});
test('match with numeric/pqrs labels uses that style', () => {
  const q = ok(mcq({ question: colText('Column I', 'Column II', C1, C2), opt_a: '(1)-(q), (2)-(p), (3)-(s), (4)-(r)', opt_b: '(1)-(p), (2)-(q), (3)-(r), (4)-(s)', opt_c: '(1)-(s), (2)-(r), (3)-(q), (4)-(p)', opt_d: '(1)-(r), (2)-(s), (3)-(p), (4)-(q)' }));
  assert.equal(q.match_table[0].col1, '(1) Force');
  assert.equal(q.match_table[0].col2, '(p) newton');
});
test('match lists drawn in an image are allowed', () => ok(mcq({ question: 'Match List I with List II:\n{{IMG::https://res.cloudinary.com/x/table.jpg}}', ...MAPPING_OPTS })));
test('numerical: answer in correct_option', () => {
  const q = ok({ id: 'n', q_type: 'numerical', question: 'Find the value of x in the equation shown.', correct_option: '$12$' });
  assert.equal(q.num_answer, '12');
  assert.equal(q.answer_display, '$12$');
});
test('numerical: num_answer field preferred', () => assert.equal(ok({ id: 'n2', q_type: 'numerical', question: 'Find the value of y in the equation.', num_answer: '2.5', correct_option: 'A' }).num_answer, '2.5'));
test('numerical: fraction answer converted', () => assert.equal(ok({ id: 'n3', q_type: 'numerical', question: 'Compute the ratio of the two lengths.', correct_option: '\\dfrac{3}{4}' }).num_answer, '0.75'));
test('broken solution is dropped but question kept', () => assert.equal(ok(mcq({ solution_text: 'Since $x = \\frac{1}{ broken' })).solution_text, ''));

// ----------------------------------------------------------- 10. combinatorial defects (every type x every defect)
const bases = {
  mcq: () => mcq(),
  assertion: () => ({ id: 'ar', q_type: 'assertion_reason', question: 'Assertion: A spring stores energy.\nReason: Work is done on it.', opt_a: 'Both true, R explains A', opt_b: 'Both true, R does not explain A', opt_c: 'A true, R false', opt_d: 'A false, R true', correct_option: 'A' }),
  statements: () => mcq({ question: 'Statement I: Light is a wave.\nStatement II: Light is a particle.', opt_a: 'Both statements are true', opt_b: 'Both statements are false', opt_c: 'Only I is true', opt_d: 'Only II is true' }),
  match: () => mcq({ question: colText('**Column I**', '**Column II**', C1, C2), ...MAPPING_OPTS }),
  image: () => mcq({ question: 'Refer to the figure and answer: {{IMG::https://res.cloudinary.com/a/b.png}}' }),
  latex: () => mcq({ question: 'If $x^2 + 2x + 1 = 0$, then $x$ equals', opt_a: '$-1$', opt_b: '$1$', opt_c: '$0$', opt_d: '$2$' }),
};
for (const [name, make] of Object.entries(bases)) {
  test(`[${name}] base question is valid`, () => ok(make()));
}
const defects = {
  'missing option A': [(r) => ({ ...r, opt_a: '' }), 'missing_options'],
  'missing option B': [(r) => ({ ...r, opt_b: '' }), 'missing_options'],
  'missing option C': [(r) => ({ ...r, opt_c: '' }), 'missing_options'],
  'missing option D': [(r) => ({ ...r, opt_d: '   ' }), 'missing_options'],
  'no options at all': [(r) => ({ ...r, opt_a: '', opt_b: '', opt_c: '', opt_d: '' }), 'no_options'],
  'duplicate options': [(r) => ({ ...r, opt_c: r.opt_a }), 'duplicate_options'],
  'duplicate options differing only in spaces': [(r) => ({ ...r, opt_d: ` ${r.opt_b}  ` }), 'duplicate_options'],
  'blank answer key': [(r) => ({ ...r, correct_option: '' }), 'missing_answer'],
  'null answer key': [(r) => ({ ...r, correct_option: null }), 'missing_answer'],
  'multiple correct answers': [(r) => ({ ...r, correct_option: 'A, C' }), 'multiple_correct'],
  'answer letter E': [(r) => ({ ...r, correct_option: 'E' }), 'invalid_answer_key'],
  'answer points to empty option': [(r) => ({ ...r, opt_d: '', correct_option: 'D' }), 'answer_points_to_empty_option'],
  'unbalanced $ in option': [(r) => ({ ...r, opt_b: 'Value is $x^2' }), 'unbalanced_math'],
  'invalid latex in option': [(r) => ({ ...r, opt_c: '$\\frac{1}{$' }), 'invalid_math'],
  'unknown latex command': [(r) => ({ ...r, opt_a: '$\\foobar{2}$' }), 'invalid_math'],
  '[UNCLEAR] marker in option': [(r) => ({ ...r, opt_b: 'about [UNCLEAR] units' }), 'unclear_content'],
  'question mark run in option': [(r) => ({ ...r, opt_d: 'value ????' }), 'unclear_content'],
  'undefined in option': [(r) => ({ ...r, opt_a: 'undefined' }), 'unclear_content'],
  '[object Object] in option': [(r) => ({ ...r, opt_c: '[object Object]' }), 'unclear_content'],
  'script tag in option': [(r) => ({ ...r, opt_a: '<script>alert(1)</script>' }), 'html_markup'],
  'table html in option': [(r) => ({ ...r, opt_b: '<table><tr><td>1</td></tr></table>' }), 'html_markup'],
  'bad image url in option': [(r) => ({ ...r, opt_a: '{{IMG::ftp://x/y}}' }), 'bad_image_url'],
  'raw latex outside math in option': [(r) => ({ ...r, opt_d: '\\frac{1}{2} m' }), 'latex_outside_math'],
  'missing id': [(r) => ({ ...r, id: '' }), 'missing_id'],
};
for (const [baseName, make] of Object.entries(bases)) {
  for (const [defectName, [apply, reason]] of Object.entries(defects)) {
    test(`[${baseName}] rejects: ${defectName}`, () => bad(apply(make()), reason));
  }
}
// defects in the stem / structured parts
const stemDefects = [
  ['empty question', mcq({ question: '' }), 'empty_question'],
  ['whitespace question', mcq({ question: '   \n  ' }), 'empty_question'],
  ['question too short', mcq({ question: 'Why?' }), 'question_too_short'],
  ['unbalanced $ in stem', mcq({ question: 'Find $x when y = 2 in the equation' }), 'unbalanced_math'],
  ['invalid latex in stem', mcq({ question: 'Evaluate $\\sqrt{2$ for the given value' }), 'invalid_math'],
  ['[UNCLEAR] in stem', mcq({ question: 'During the interval [UNCLEAR] the work done is' }), 'unclear_content'],
  ['N/A placeholder in stem', mcq({ question: 'Value N/A (not provided) is used here today' }), 'unclear_content'],
  ['assertion without reason', bases.assertion() && { ...bases.assertion(), question: 'Assertion: Only an assertion here.' }, 'assertion_reason_incomplete'],
  ['assertion with empty reason', { ...bases.assertion(), question: 'Assertion: Both A and R are true.\nReason: ' }, 'assertion_reason_incomplete'],
  ['reason without assertion', { ...bases.assertion(), question: 'Reason: Only a reason exists here.' }, 'assertion_reason_incomplete'],
  ['statement II missing', mcq({ question: 'Statement I: Only the first statement is given here.' }), 'statement_incomplete'],
  ['statements empty', mcq({ question: 'Statement I: \nStatement II: ' }), 'statement_incomplete'],
  ['match: column II split into fragments', mcq({ question: colText('**Column I**', '**Column II**', C1, ['Heat', 'At', 'volume', 'No', 'of', 'and matter']), ...MAPPING_OPTS }), 'match_item_fragment'],
  ['match: column II far longer than column I', mcq({ question: colText('**Column I**', '**Column II**', C1, ['heat flow', 'work done', 'path taken', 'mass moved', 'charge held', 'field made', 'wave sent', 'light seen']), ...MAPPING_OPTS }), 'match_column2_count_mismatch'],
  ['match: column I has extra rows', mcq({ question: colText('**Column I**', '**Column II**', [...C1, 'Extra', 'More'], C2), ...MAPPING_OPTS }), 'match_column1_count_mismatch'],
  ['match: one-letter fragments', mcq({ question: colText('**Column I**', '**Column II**', C1, ['newton', 'J', 'watt', 'erg']), ...MAPPING_OPTS }), 'match_item_fragment'],
  ['match: lists missing from text', mcq({ question: 'Match column I with column II and choose the correct option.', ...MAPPING_OPTS }), 'match_columns_missing'],
  ['match arrays too short', { id: 'm', q_type: 'match', question: '', column_a: ['only one'], column_b: ['x'], match_options: { A: 'a', B: 'b', C: 'c', D: 'd' }, correct_option: 'A' }, 'match_columns_missing'],
  ['numerical: text answer', { id: 'n', q_type: 'numerical', question: 'Why does the needle deflect here?', correct_option: 'Because of the field' }, 'numerical_answer_not_numeric'],
  ['numerical: letter answer', { id: 'n', q_type: 'numerical', question: 'Compute the value of the expression.', correct_option: 'A' }, 'numerical_answer_not_numeric'],
  ['numerical: ratio answer', { id: 'n', q_type: 'numerical', question: 'Compute the ratio of the masses.', correct_option: '2:1' }, 'numerical_answer_not_numeric'],
  ['numerical: blank answer', { id: 'n', q_type: 'numerical', question: 'Compute the value of the expression.', correct_option: '' }, 'numerical_answer_not_numeric'],
  ['numerical: unclear answer', { id: 'n', q_type: 'numerical', question: 'Compute the value of the expression.', correct_option: '[UNCLEAR]' }, 'numerical_answer_not_numeric'],
  ['numerical: empty question', { id: 'n', q_type: 'numerical', question: '', correct_option: '4' }, 'empty_question'],
  ['numerical: broken latex in stem', { id: 'n', q_type: 'numerical', question: 'Find $\\frac{a}{ the value', correct_option: '4' }, 'unbalanced_math'],
  ['not an object', null, 'not_an_object'],
  ['string instead of object', 'hello', 'not_an_object'],
];
for (const [name, row, reason] of stemDefects) {
  test(`rejects: ${name}`, () => bad(row, reason));
}

// ----------------------------------------------------------- 11. already-structured questions (saved papers / exams)
const structured = { id: 's', q_type: 'statements', question: '', statement_1: 'A is true.', statement_2: 'B is false.', opt_a: 'both true', opt_b: 'both false', opt_c: 'I true', opt_d: 'II true', correct_option: 'C' };
const tableQ = { id: 't', q_type: 'match', question: 'Match.', match_table: [{ col1: '(a) x', col2: '(i) 1' }, { col1: '(b) y', col2: '(ii) 2' }], opt_a: 'a-i, b-ii', opt_b: 'a-ii, b-i', opt_c: 'a-i, b-i', opt_d: 'a-ii, b-ii', correct_option: 'A' };
test('structured statements question is valid', () => assert.equal(Q.ensureCleanQuestion(structured).ok, true));
test('structured match question is valid', () => assert.equal(Q.ensureCleanQuestion(tableQ).ok, true));
test('structured clean MCQ re-validates', () => assert.equal(Q.ensureCleanQuestion(ok(mcq())).ok, true));
test('structured clean assertion re-validates', () => assert.equal(Q.ensureCleanQuestion(ok(bases.assertion())).ok, true));
test('structured clean numerical re-validates', () => assert.equal(Q.ensureCleanQuestion(ok({ id: 'n', q_type: 'numerical', question: 'Compute the value of the expression.', correct_option: '7' })).ok, true));
const structuredBad = [
  ['statement missing', { ...structured, statement_2: '' }, 'statement_incomplete'],
  ['statement option missing', { ...structured, opt_b: '' }, 'missing_options'],
  ['statement duplicate options', { ...structured, opt_d: 'both true' }, 'duplicate_options'],
  ['statement bad key', { ...structured, correct_option: 'Z' }, 'invalid_answer_key'],
  ['table with one row', { ...tableQ, match_table: [{ col1: 'x', col2: '1' }] }, 'match_columns_missing'],
  ['table broken math', { ...tableQ, match_table: [{ col1: '$x', col2: '1' }, { col1: 'y', col2: '2' }] }, 'unbalanced_math'],
  ['table unclear', { ...tableQ, match_table: [{ col1: '[UNCLEAR]', col2: '1' }, { col1: 'y', col2: '2' }] }, 'unclear_content'],
];
for (const [name, q, reason] of structuredBad) {
  test(`structured rejects: ${name}`, () => {
    const r = Q.ensureCleanQuestion(q);
    assert.equal(r.ok, false);
    assert.ok(r.reasons.includes(reason), JSON.stringify(r.reasons));
  });
}

// ----------------------------------------------------------- 12. positional option labels
const labelSets = [
  [['(a) one', '(b) two', '(c) three', '(d) four'], ['one', 'two', 'three', 'four']],
  [['(A) one', '(B) two', '(C) three', '(D) four'], ['one', 'two', 'three', 'four']],
  [['(1) one', '(2) two', '(3) three', '(4) four'], ['one', 'two', 'three', 'four']],
  [['a) one', 'b) two', 'c) three', 'd) four'], ['one', 'two', 'three', 'four']],
  [['A. one', 'B. two', 'C. three', 'D. four'], ['one', 'two', 'three', 'four']],
  // assertion-reason wording: "(A)" and "(R)" are content, never labels
  [['Both (A) and (R) are true', 'Both (A) and (R) are true but (R) does not explain', '(A) is true but (R) is false', '(A) is false but (R) is true'], null],
  [['(A) is true', '(B) is wrong', 'Both', 'Neither'], null],
  [['(a) one', '(c) two', '(b) three', '(d) four'], null],
  [['(1)-(iv), (2)-(i)', '(1)-(i), (2)-(iv)', '(1)-(ii), (2)-(iii)', '(1)-(iii), (2)-(ii)'], null],
  [['one', 'two', 'three', 'four'], null],
];
labelSets.forEach(([input, expected], i) => {
  test(`positional option labels #${i + 1}`, () => assert.deepEqual(Q.stripOptionLabels(input), expected || input));
});
test('assertion-reason option "(A) is true but (R) is false" survives normalisation', () => {
  const q = ok({ id: 'ar', q_type: 'assertion_reason', question: 'Assertion: Heat flows.\nReason: Temperatures differ.', opt_a: 'Both (A) and (R) are true and (R) is the correct explanation of (A).', opt_b: 'Both (A) and (R) are true and (R) is NOT the correct explanation of (A).', opt_c: '(A) is true but (R) is false.', opt_d: '(A) is false but (R) is true.', correct_option: 'C' });
  assert.equal(q.opt_c, '(A) is true but (R) is false.');
  assert.equal(q.opt_d, '(A) is false but (R) is true.');
});
