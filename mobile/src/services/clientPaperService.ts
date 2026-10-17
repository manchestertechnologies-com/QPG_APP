import { GeneratedPaper, PaperGenerationConfig, Question, Subject, ClassLevel, ExamType } from '../types';

export const NCERT_CHEMISTRY_CHAPTERS = [
  // Class 11
  { name: 'Some Basic Concepts of Chemistry', count: 1840, classLevel: '11' },
  { name: 'Structure of Atom', count: 2150, classLevel: '11' },
  { name: 'Classification of Elements & Periodicity', count: 1680, classLevel: '11' },
  { name: 'Chemical Bonding & Molecular Structure', count: 2420, classLevel: '11' },
  { name: 'Chemical Thermodynamics', count: 2210, classLevel: '11' },
  { name: 'Equilibrium (Physical & Chemical)', count: 2340, classLevel: '11' },
  { name: 'Redox Reactions', count: 1450, classLevel: '11' },
  { name: 'Organic Chemistry: Basic Principles', count: 2100, classLevel: '11' },
  { name: 'Hydrocarbons (Alkanes, Alkenes, Alkynes)', count: 1980, classLevel: '11' },
  // Class 12
  { name: 'Solutions & Colligative Properties', count: 2260, classLevel: '12' },
  { name: 'Electrochemistry', count: 2450, classLevel: '12' },
  { name: 'Chemical Kinetics', count: 2180, classLevel: '12' },
  { name: 'd- and f-Block Elements', count: 1890, classLevel: '12' },
  { name: 'Coordination Compounds', count: 2310, classLevel: '12' },
  { name: 'Haloalkanes & Haloarenes', count: 1940, classLevel: '12' },
  { name: 'Alcohols, Phenols & Ethers', count: 2050, classLevel: '12' },
  { name: 'Aldehydes, Ketones & Carboxylic Acids', count: 2380, classLevel: '12' },
  { name: 'Amines (Organic Compounds with Nitrogen)', count: 1820, classLevel: '12' },
  { name: 'Biomolecules', count: 1610, classLevel: '12' },
];

export const MOCK_CHEMISTRY_QUESTIONS: Question[] = [
  {
    id: 'chem_q1',
    subject: 'Chemistry',
    klass: '12',
    chapter: 'Solutions & Colligative Properties',
    topic: 'Van\'t Hoff Factor',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'The freezing point depression of a 0.1 M aqueous solution of $K_3[Fe(CN)_6]$ (assuming 100% dissociation) will be how many times that of a 0.1 M glucose solution?',
    opt_a: '2 times',
    opt_b: '3 times',
    opt_c: '4 times',
    opt_d: '5 times',
    correct_option: 'C',
    solution_text: 'For $K_3[Fe(CN)_6] \\rightarrow 3K^+ + [Fe(CN)_6]^{3-}$, the number of ions $n = 4$. Since dissociation is 100%, the van\'t Hoff factor $i = 4$. For non-electrolyte glucose, $i = 1$. Hence, $\\Delta T_f$ for $K_3[Fe(CN)_6]$ is 4 times that of glucose.',
    difficulty: 'medium',
    source: 'NEET 2024 / NCERT',
  },
  {
    id: 'chem_q2',
    subject: 'Chemistry',
    klass: '12',
    chapter: 'Electrochemistry',
    topic: 'Nernst Equation',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'For the cell $Zn(s) | Zn^{2+}(0.01M) || Cu^{2+}(0.1M) | Cu(s)$, given $E^\\circ_{cell} = 1.10\\text{ V}$, the cell potential $E_{cell}$ at 298 K is closest to:',
    opt_a: '1.10 V',
    opt_b: '1.13 V',
    opt_c: '1.07 V',
    opt_d: '1.16 V',
    correct_option: 'B',
    solution_text: 'According to Nernst equation: $E_{cell} = E^\\circ_{cell} - \\frac{0.0591}{2}\\log\\frac{[Zn^{2+}]}{[Cu^{2+}]} = 1.10 - 0.0295\\log(10^{-1}) = 1.10 + 0.0295 \\approx 1.13\\text{ V}$.',
    difficulty: 'medium',
    source: 'NEET 2023',
  },
  {
    id: 'chem_q3',
    subject: 'Chemistry',
    klass: '11',
    chapter: 'Chemical Bonding & Molecular Structure',
    topic: 'Hybridization and Geometry',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'Which of the following species has $sp^3d^2$ hybridization and square planar geometry?',
    opt_a: '$SF_4$',
    opt_b: '$XeF_4$',
    opt_c: '$XeOF_4$',
    opt_d: '$PCl_5$',
    correct_option: 'B',
    solution_text: 'In $XeF_4$, xenon has 8 valence electrons. With 4 bonding pairs and 2 lone pairs, steric number = 6 ($sp^3d^2$ hybridization). The 2 lone pairs occupy axial positions to minimize repulsions, producing a square planar geometry.',
    difficulty: 'easy',
    source: 'NEET 2022',
  },
  {
    id: 'chem_q4',
    subject: 'Chemistry',
    klass: '12',
    chapter: 'Chemical Kinetics',
    topic: 'First Order Kinetics',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'A first-order reaction has a rate constant $k = 4.606 \\times 10^{-3}\\text{ s}^{-1}$. The time required for the reactant concentration to reduce to 10% of its initial value is:',
    opt_a: '100 s',
    opt_b: '250 s',
    opt_c: '500 s',
    opt_d: '1000 s',
    correct_option: 'C',
    solution_text: '$t = \\frac{2.303}{k}\\log\\frac{[A]_0}{[A]} = \\frac{2.303}{4.606 \\times 10^{-3}}\\log\\left(\\frac{100}{10}\\right) = \\frac{2.303}{4.606 \\times 10^{-3}} \\times 1 = 500\\text{ seconds}$.',
    difficulty: 'medium',
    source: 'JEE Main 2024',
  },
  {
    id: 'chem_q5',
    subject: 'Chemistry',
    klass: '12',
    chapter: 'Aldehydes, Ketones & Carboxylic Acids',
    topic: 'Cannizzaro Reaction',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'Which of the following aldehydes will undergo Cannizzaro reaction when treated with concentrated 50% NaOH solution?',
    opt_a: '$CH_3CHO$',
    opt_b: '$CH_3CH_2CHO$',
    opt_c: '$(CH_3)_3C-CHO$',
    opt_d: '$CH_3COCH_3$',
    correct_option: 'C',
    solution_text: 'Cannizzaro reaction is given by aldehydes having no $\\alpha$-hydrogen atoms. Trimethylacetaldehyde (pivalaldehyde, $(CH_3)_3C-CHO$) lacks $\\alpha$-hydrogens and disproportionates into neopentyl alcohol and trimethylacetate ion.',
    difficulty: 'medium',
    source: 'NEET 2023',
  },
  {
    id: 'chem_q6',
    subject: 'Chemistry',
    klass: '12',
    chapter: 'Coordination Compounds',
    topic: 'Crystal Field Theory',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'The spin-only magnetic moment of $[CoF_6]^{3-}$ ($Z=27$) in Bohr Magnetons (BM) is:',
    opt_a: '0 BM',
    opt_b: '1.73 BM',
    opt_c: '4.90 BM',
    opt_d: '5.92 BM',
    correct_option: 'C',
    solution_text: '$Co^{3+}$ has $3d^6$ configuration. Since $F^-$ is a weak field ligand, pairing does not occur ($t_{2g}^4 e_g^2$). Number of unpaired electrons $n = 4$. Magnetic moment $\\mu = \\sqrt{n(n+2)} = \\sqrt{4(6)} = \\sqrt{24} \\approx 4.90\\text{ BM}$.',
    difficulty: 'medium',
    source: 'NEET 2024',
  },
  {
    id: 'chem_q7',
    subject: 'Chemistry',
    klass: '11',
    chapter: 'Structure of Atom',
    topic: 'de Broglie Wavelength',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'If the velocity of an electron is tripled, its de Broglie wavelength becomes:',
    opt_a: '3 times original',
    opt_b: '9 times original',
    opt_c: '$\\frac{1}{3}$ of original',
    opt_d: '$\\frac{1}{9}$ of original',
    correct_option: 'C',
    solution_text: 'By de Broglie relationship $\\lambda = \\frac{h}{mv}$. Since wavelength is inversely proportional to velocity ($v$), tripling $v$ reduces $\\lambda$ by a factor of 3 (i.e. $\\frac{1}{3}\\lambda$).',
    difficulty: 'easy',
    source: 'CET 2024',
  },
  {
    id: 'chem_q8',
    subject: 'Chemistry',
    klass: '11',
    chapter: 'Chemical Thermodynamics',
    topic: 'Gibbs Free Energy',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'For a spontaneous process at all temperatures, which of the following thermodynamic condition is mandatory?',
    opt_a: '$\\Delta H > 0$ and $\\Delta S > 0$',
    opt_b: '$\\Delta H < 0$ and $\\Delta S > 0$',
    opt_c: '$\\Delta H < 0$ and $\\Delta S < 0$',
    opt_d: '$\\Delta H > 0$ and $\\Delta S < 0$',
    correct_option: 'B',
    solution_text: 'From $\\Delta G = \\Delta H - T\\Delta S$, if $\\Delta H < 0$ (exothermic) and $\\Delta S > 0$ (increase in disorder), then $\\Delta G$ is negative at all temperatures regardless of $T$.',
    difficulty: 'easy',
    source: 'NEET 2021',
  },
  {
    id: 'chem_q9',
    subject: 'Chemistry',
    klass: '12',
    chapter: 'd- and f-Block Elements',
    topic: 'Oxidation States of Transition Metals',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'Which of the following 3d transition series elements exhibits the highest oxidation state (+7)?',
    opt_a: 'Vanadium ($V$)',
    opt_b: 'Chromium ($Cr$)',
    opt_c: 'Manganese ($Mn$)',
    opt_d: 'Iron ($Fe$)',
    correct_option: 'C',
    solution_text: 'Manganese ($[Ar] 3d^5 4s^2$) has 7 valence electrons and exhibits the maximum oxidation state of +7 (e.g. in $KMnO_4$).',
    difficulty: 'easy',
    source: 'KCET 2023',
  },
  {
    id: 'chem_q10',
    subject: 'Chemistry',
    klass: '11',
    chapter: 'Equilibrium (Physical & Chemical)',
    topic: 'Buffer Solutions and pH',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'What is the pH of a buffer solution containing 0.1 M acetic acid and 0.1 M sodium acetate ($pK_a$ of acetic acid = 4.74)?',
    opt_a: '3.74',
    opt_b: '4.74',
    opt_c: '5.74',
    opt_d: '7.00',
    correct_option: 'B',
    solution_text: 'By Henderson-Hasselbalch equation: $pH = pK_a + \\log\\frac{[\\text{Salt}]}{[\\text{Acid}]} = 4.74 + \\log(1) = 4.74 + 0 = 4.74$.',
    difficulty: 'easy',
    source: 'NEET 2023',
  },
  {
    id: 'chem_q11',
    subject: 'Chemistry',
    klass: '12',
    chapter: 'Haloalkanes & Haloarenes',
    topic: 'SN1 vs SN2 Mechanism',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'Which among the following alkyl halides undergoes $S_N1$ solvolysis at the fastest rate?',
    opt_a: '$CH_3-Cl$',
    opt_b: '$CH_3CH_2-Cl$',
    opt_c: '$(CH_3)_2CH-Cl$',
    opt_d: '$(CH_3)_3C-Cl$',
    correct_option: 'D',
    solution_text: 'The rate-determining step in $S_N1$ mechanism involves formation of a carbocation. The tertiary carbocation $(CH_3)_3C^+$ formed from tert-butyl chloride is stabilized by 9 hyperconjugative $\\alpha$-hydrogens, making it react fastest.',
    difficulty: 'easy',
    source: 'NEET 2024',
  },
  {
    id: 'chem_q12',
    subject: 'Chemistry',
    klass: '12',
    chapter: 'Biomolecules',
    topic: 'Proteins and Peptide Linkage',
    exams: ['NEET', 'JEE', 'CET'],
    q_type: 'mcq_single',
    question: 'The linkage connecting two consecutive amino acid residues in a polypeptide chain is:',
    opt_a: 'Glycosidic linkage',
    opt_b: 'Peptide linkage ($-CO-NH-$)',
    opt_c: 'Phosphodiester linkage',
    opt_d: 'Ester linkage',
    correct_option: 'B',
    solution_text: 'Amino acids are joined via condensation between the carboxyl group of one molecule and the amino group of another, forming an amide bond termed a peptide linkage ($-CO-NH-$).',
    difficulty: 'easy',
    source: 'KCET 2024',
  },
  {
    id: 'chem_q13',
    subject: 'Chemistry',
    klass: '12',
    chapter: 'Chemical Kinetics',
    topic: 'Numerical Calculation',
    exams: ['JEE'],
    q_type: 'numerical',
    question: 'For a second-order reaction $2A \\rightarrow \\text{Products}$, the initial rate is $4.0 \\times 10^{-4}\\text{ mol L}^{-1}\\text{ s}^{-1}$ when $[A] = 0.02\\text{ M}$. Calculate the rate constant $k$ in $\\text{L mol}^{-1}\\text{ s}^{-1}$.',
    num_answer: '1',
    correct_option: '1',
    solution_text: 'Rate $= k[A]^2 \\implies 4.0 \\times 10^{-4} = k(0.02)^2 = k(4.0 \\times 10^{-4}) \\implies k = 1\\text{ L mol}^{-1}\\text{ s}^{-1}$.',
    difficulty: 'hard',
    source: 'JEE Main 2023',
  },
  {
    id: 'chem_q14',
    subject: 'Chemistry',
    klass: '12',
    chapter: 'Electrochemistry',
    topic: 'Numerical Calculation',
    exams: ['JEE'],
    q_type: 'numerical',
    question: 'How many Faradays of electricity are required to produce 2 moles of metallic copper from an aqueous solution of $CuSO_4$?',
    num_answer: '4',
    correct_option: '4',
    solution_text: 'Electrode reaction: $Cu^{2+} + 2e^- \\rightarrow Cu(s)$. 1 mole of $Cu$ requires 2 Faradays. Therefore, 2 moles of $Cu$ require $2 \\times 2 = 4$ Faradays of electric charge.',
    difficulty: 'medium',
    source: 'JEE Main 2024',
  },
];

export class ClientPaperService {
  /**
   * Generates a fully populated, authentic Examination Paper
   */
  public static generatePaper(config: PaperGenerationConfig): GeneratedPaper {
    const examType: ExamType = config.exam_type || 'NEET';
    const title = config.title || `Chemistry Examination 2026`;
    const inst = config.institution_name || 'Academic Institute';

    let sections: {
      id: string;
      name: string;
      description: string;
      total_questions: number;
      attempt_count: number;
      marks_per_question: number;
      negative_marking: number;
      questions: Question[];
    }[] = [];

    // Clone base pool and expand to ensure sufficient questions
    const basePool = [...MOCK_CHEMISTRY_QUESTIONS];
    const pool: Question[] = [];
    while (pool.length < 80) {
      for (let i = 0; i < basePool.length; i++) {
        const item = basePool[i];
        pool.push({
          ...item,
          id: `${item.id}_${pool.length + 1}`,
        });
      }
    }

    if (examType === 'NEET') {
      // 2026 NEET Pattern: 35 Sec A + 15 Sec B (Attempt 10)
      const secAQuestions = pool.slice(0, 35);
      const secBQuestions = pool.slice(35, 50);

      sections = [
        {
          id: 'sec_neet_a',
          name: 'Section A (Compulsory MCQs)',
          description: 'Questions 1 to 35 are compulsory. Each carries 4 marks with -1 negative mark.',
          total_questions: 35,
          attempt_count: 35,
          marks_per_question: 4,
          negative_marking: 1,
          questions: secAQuestions,
        },
        {
          id: 'sec_neet_b',
          name: 'Section B (Optional MCQs)',
          description: 'Questions 36 to 50: Candidates must attempt any 10 out of 15 questions.',
          total_questions: 15,
          attempt_count: 10,
          marks_per_question: 4,
          negative_marking: 1,
          questions: secBQuestions,
        },
      ];
    } else if (examType === 'JEE') {
      // 2026 JEE Main Pattern: 20 MCQs + 10 Numerical (Attempt 5)
      const secAQuestions = pool.slice(0, 20);
      const secBQuestions = pool.slice(20, 30).map((q) => ({
        ...q,
        q_type: 'numerical' as const,
        opt_a: undefined,
        opt_b: undefined,
        opt_c: undefined,
        opt_d: undefined,
      }));

      sections = [
        {
          id: 'sec_jee_a',
          name: 'Section A (Multiple Choice Questions)',
          description: '20 Single-Correct MCQs. Attempt all questions. (+4 Marks, -1 Negative).',
          total_questions: 20,
          attempt_count: 20,
          marks_per_question: 4,
          negative_marking: 1,
          questions: secAQuestions,
        },
        {
          id: 'sec_jee_b',
          name: 'Section B (Numerical Value Questions)',
          description: '10 Numerical Questions. Candidates should attempt any 5 questions. (+4 Marks, -1 Negative).',
          total_questions: 10,
          attempt_count: 5,
          marks_per_question: 4,
          negative_marking: 1,
          questions: secBQuestions,
        },
      ];
    } else if (examType === 'CET') {
      // 2026 CET Pattern: 60 MCQs, 60 Marks, 0 Negative
      const cetQuestions = pool.slice(0, 60);
      sections = [
        {
          id: 'sec_cet_1',
          name: 'Chemistry Examination Paper',
          description: '60 Objective MCQs. All questions are compulsory. Each carries 1 mark with NO negative marking.',
          total_questions: 60,
          attempt_count: 60,
          marks_per_question: 1,
          negative_marking: 0,
          questions: cetQuestions,
        },
      ];
    } else {
      // Custom Practice
      const count = Math.min(Math.max(config.total_questions || 30, 5), 60);
      const customQuestions = pool.slice(0, count);
      sections = [
        {
          id: 'sec_custom_1',
          name: 'Practice Assessment',
          description: `Custom generated assessment containing ${count} questions.`,
          total_questions: count,
          attempt_count: count,
          marks_per_question: config.marks_per_question || 4,
          negative_marking: config.negative_marking || 1,
          questions: customQuestions,
        },
      ];
    }

    // Build answer key
    let qIndex = 1;
    const answer_key: { q_no: number; answer?: string; num_answer?: string; q_type: string }[] = [];
    for (const sec of sections) {
      for (const q of sec.questions) {
        answer_key.push({
          q_no: qIndex++,
          answer: q.correct_option || 'A',
          num_answer: q.num_answer,
          q_type: q.q_type,
        });
      }
    }

    const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
    const totalMarks = sections.reduce((acc, s) => acc + (s.attempt_count * s.marks_per_question), 0);

    return {
      id: `paper_${Date.now()}`,
      title,
      institution_name: inst,
      exam_type: examType,
      subject: 'Chemistry',
      class_levels: config.class_levels || ['11', '12'],
      chapters: config.chapters || [],
      questions_count: totalQuestions,
      total_marks: totalMarks,
      duration_minutes: config.duration_minutes || (examType === 'CET' ? 80 : 60),
      sections,
      answer_key,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Generates publication-grade KaTeX HTML document for vector PDF rendering
   */
  public static generatePaperHtml(
    paper: GeneratedPaper,
    includeAnswerKey = true,
    includeSolutions = false
  ): string {
    let questionCounter = 1;
    let sectionsHtml = '';

    for (const sec of paper.sections) {
      sectionsHtml += `
        <div class="section-container">
          <div class="section-header">
            <span class="section-title">${sec.name.toUpperCase()}</span>
            <span class="section-meta">Attempt: ${sec.attempt_count} Qs | Marks: +${sec.marks_per_question}, -${sec.negative_marking}</span>
          </div>
          ${sec.description ? `<div class="section-desc">${sec.description}</div>` : ''}
          <div class="questions-list">
      `;

      for (const q of sec.questions) {
        const qNum = questionCounter++;

        let optionsHtml = '';
        if (q.q_type === 'mcq_single' || q.opt_a || q.opt_b) {
          optionsHtml = `
            <div class="options-grid">
              <div class="option-item"><span class="opt-label">(A)</span> <span class="opt-text">${q.opt_a || ''}</span></div>
              <div class="option-item"><span class="opt-label">(B)</span> <span class="opt-text">${q.opt_b || ''}</span></div>
              <div class="option-item"><span class="opt-label">(C)</span> <span class="opt-text">${q.opt_c || ''}</span></div>
              <div class="option-item"><span class="opt-label">(D)</span> <span class="opt-text">${q.opt_d || ''}</span></div>
            </div>
          `;
        } else if (q.q_type === 'numerical') {
          optionsHtml = `
            <div class="numerical-answer-box">
              <span class="num-prompt">Answer: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] (Round off to nearest integer)</span>
            </div>
          `;
        }

        let solutionBlock = '';
        if (includeSolutions && q.solution_text) {
          solutionBlock = `
            <div class="solution-box">
              <strong>Solution & Explanation:</strong><br/>
              ${q.solution_text}
            </div>
          `;
        }

        sectionsHtml += `
          <div class="question-card">
            <div class="q-header">
              <span class="q-num">Q.${qNum}.</span>
              <div class="q-body">${q.question}</div>
            </div>
            ${optionsHtml}
            ${solutionBlock}
          </div>
        `;
      }

      sectionsHtml += `
          </div>
        </div>
      `;
    }

    let answerKeyHtml = '';
    if (includeAnswerKey && paper.answer_key.length > 0) {
      let rows = '';
      const cols = 5;
      for (let i = 0; i < paper.answer_key.length; i += cols) {
        const slice = paper.answer_key.slice(i, i + cols);
        rows += '<tr>';
        for (const item of slice) {
          rows += `
            <td class="ak-qno">Q.${item.q_no}</td>
            <td class="ak-ans"><strong>${item.answer || item.num_answer || '-'}</strong></td>
          `;
        }
        for (let j = slice.length; j < cols; j++) {
          rows += '<td class="ak-qno"></td><td class="ak-ans"></td>';
        }
        rows += '</tr>';
      }

      answerKeyHtml = `
        <div class="page-break"></div>
        <div class="answer-key-section">
          <div class="answer-key-title">OFFICIAL ANSWER KEY & EVALUATION SHEET</div>
          <table class="answer-key-table">
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${paper.title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      if (window.renderMathInElement) {
        renderMathInElement(document.body, {
          delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false},
            {left: "\\\\(", right: "\\\\)", display: false},
            {left: "\\\\[", right: "\\\\]", display: true}
          ],
          throwOnError: false
        });
      }
    });
  </script>
  <style>
    @page {
      size: A4;
      margin: 12mm 14mm 16mm 14mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 10px;
      font-size: 13.5px;
      line-height: 1.5;
    }
    .inst-header {
      text-align: center;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .inst-name { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .paper-title { font-size: 16px; font-weight: 700; color: #4338ca; margin: 4px 0; }
    .exam-meta-grid {
      display: flex;
      justify-content: space-between;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      padding: 8px 14px;
      margin-bottom: 16px;
      font-size: 12px;
      font-weight: 600;
    }
    .section-container { margin-bottom: 18px; }
    .section-header {
      background: #e0e7ff;
      border-left: 4px solid #4338ca;
      padding: 6px 10px;
      font-weight: 800;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .section-desc { font-size: 11.5px; color: #475569; font-style: italic; margin-bottom: 8px; padding-left: 6px; }
    .question-card {
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #e2e8f0;
      page-break-inside: avoid;
    }
    .q-header { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px; }
    .q-num { font-weight: 800; min-width: 32px; color: #1e293b; }
    .q-body { flex: 1; font-weight: 500; }
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      padding-left: 36px;
      margin-top: 4px;
    }
    .option-item { font-size: 12.5px; display: flex; align-items: baseline; gap: 4px; }
    .opt-label { font-weight: 700; color: #4338ca; }
    .numerical-answer-box {
      margin-left: 36px;
      margin-top: 4px;
      padding: 6px 10px;
      background: #f1f5f9;
      border: 1px dashed #94a3b8;
      border-radius: 4px;
      font-size: 12px;
      display: inline-block;
    }
    .solution-box {
      margin-left: 36px;
      margin-top: 6px;
      padding: 8px 10px;
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      font-size: 12px;
      color: #1e3a8a;
      border-radius: 4px;
    }
    .page-break { page-break-before: always; }
    .answer-key-section { margin-top: 20px; page-break-inside: avoid; }
    .answer-key-title {
      font-size: 14px;
      font-weight: 800;
      background: #1e293b;
      color: #ffffff;
      padding: 6px 12px;
      text-align: center;
      letter-spacing: 0.5px;
    }
    .answer-key-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .answer-key-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: center;
      font-size: 12px;
    }
    .ak-qno { background: #f8fafc; font-weight: 600; color: #475569; width: 10%; }
    .ak-ans { width: 10%; color: #047857; }
  </style>
</head>
<body>
  <div class="inst-header">
    <div class="inst-name">${paper.institution_name}</div>
    <div class="paper-title">${paper.title}</div>
  </div>
  <div class="exam-meta-grid">
    <div><strong>Pattern:</strong> ${paper.exam_type} 2026</div>
    <div><strong>Subject:</strong> ${paper.subject}</div>
    <div><strong>Duration:</strong> ${paper.duration_minutes} Mins</div>
    <div><strong>Total Marks:</strong> ${paper.total_marks}</div>
    <div><strong>Questions:</strong> ${paper.questions_count}</div>
  </div>
  ${sectionsHtml}
  ${answerKeyHtml}
</body>
</html>`;
  }
}
