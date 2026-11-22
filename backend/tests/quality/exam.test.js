/** Online exams: invalid questions are dropped before students see them; numerical scoring. */
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../../dist/services/examService');

const q = (id, over = {}) => ({ id, q_type: 'mcq_single', question: `Question number ${id} asks what?`, opt_a: 'w', opt_b: 'x', opt_c: 'y', opt_d: 'z', correct_option: 'B', ...over });

test('preparePaperForExam drops broken questions and recomputes marks', () => {
  const paper = {
    sections: [
      { name: 'A', attempt_count: 3, marks_per_question: 4, negative_marking: 1, questions: [q('1'), q('2', { opt_c: '' }), q('3')] },
      { name: 'B', marks_per_question: 4, questions: [{ id: 'n', q_type: 'numerical', question: 'Compute the final value.', num_answer: '9.81' }] },
    ],
  };
  const r = E.preparePaperForExam(paper);
  assert.equal(r.ok, true);
  assert.equal(r.dropped, 1);
  assert.equal(r.questionCount, 3);
  assert.equal(r.paper.sections[0].attempt_count, 2);
  assert.equal(r.totalMarks, 2 * 4 + 1 * 4);
});
test('preparePaperForExam keeps structured statements / match questions', () => {
  const paper = {
    sections: [
      {
        name: 'A',
        questions: [
          { id: 's', q_type: 'statements', question: '', statement_1: 'I.', statement_2: 'II.', opt_a: 'a', opt_b: 'b', opt_c: 'c', opt_d: 'd', correct_option: 'A' },
          { id: 'm', q_type: 'match', question: 'Match.', match_table: [{ col1: '(a) x', col2: '(i) 1' }, { col1: '(b) y', col2: '(ii) 2' }], opt_a: 'a-i', opt_b: 'a-ii', opt_c: 'b-i', opt_d: 'b-ii', correct_option: 'D' },
        ],
      },
    ],
  };
  const r = E.preparePaperForExam(paper);
  assert.equal(r.ok, true);
  assert.equal(r.dropped, 0);
  assert.equal(r.paper.sections[0].questions[1].match_table.length, 2);
});
test('preparePaperForExam fails when every question is broken', () => {
  const r = E.preparePaperForExam({ sections: [{ name: 'A', questions: [q('1', { opt_a: '' }), q('2', { correct_option: 'A,B' })] }] });
  assert.equal(r.ok, false);
});
test('numerical scoring uses the normalised answer', () => {
  const paper = { sections: [{ name: 'N', marks_per_question: 4, negative_marking: 0, questions: [{ id: 'n', q_type: 'numerical', question: 'Compute.', num_answer: '0.75' }] }] };
  assert.equal(E.scoreAttempt(paper, { n: { value: '0.750' } }).score, 4);
  assert.equal(E.scoreAttempt(paper, { n: { value: '0.8' } }).score, 0);
});
test('student payload never contains answers or solutions', () => {
  const flat = E.flattenPaper({ sections: [{ name: 'A', questions: [q('1', { solution_text: 'secret', stem_after: 'Choose wisely.' })] }] });
  const s = E.studentQuestion(flat[0]);
  assert.equal(s.correct_option, undefined);
  assert.equal(s.solution_text, undefined);
  assert.equal(s.stem_after, 'Choose wisely.');
});
