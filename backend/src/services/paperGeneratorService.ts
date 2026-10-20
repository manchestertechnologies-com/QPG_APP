import axios from 'axios';
import {
  Subject,
  ClassLevel,
  ExamType,
  Question,
  PaperGenerationConfig,
  GeneratedPaper,
  DifficultyLevel,
} from '../types';
import { config } from '../config';
import { QuestionBankService } from './questionBankService';

export class PaperGeneratorService {
  /**
   * Shuffles an array using Fisher-Yates algorithm
   */
  private static shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Fetches candidate pool from Supabase with safety limits and timeout
   */
  private static async fetchCandidatePool(
    subject: Subject,
    classLevels: ClassLevel[],
    chapters: string[]
  ): Promise<Question[]> {
    const subjectDbs = config.databases[subject];
    if (!subjectDbs) {
      throw new Error(`Unauthorized or unsupported subject: ${subject}`);
    }

    const targetClasses = classLevels.length > 0 ? classLevels : (['11', '12'] as ClassLevel[]);
    let candidatePool: Question[] = [];

    for (const kl of targetClasses) {
      const dbConfig = subjectDbs[kl];
      if (!dbConfig) continue;

      const headers = {
        apikey: dbConfig.apiKey,
        Authorization: `Bearer ${dbConfig.apiKey}`,
      };

      // If specific chapters were chosen, we can query by chapter, or query a large batch
      const params: Record<string, string> = {
        select: '*',
        limit: '1500',
      };

      try {
        const response = await axios.get(`${dbConfig.url}/questions`, {
          headers,
          params,
          timeout: 15000,
        });

        const rows: any[] = response.data || [];
        for (const row of rows) {
          // If specific chapters are selected, ensure matching
          if (chapters.length > 0 && !chapters.includes('All Chapters')) {
            if (!row.chapter || !chapters.includes(row.chapter.trim())) {
              continue;
            }
          }

          const diff = QuestionBankService.extractDifficulty(row);
          candidatePool.push({
            id: row.id,
            subject,
            klass: kl,
            chapter: row.chapter || 'General',
            topic: row.topic || '',
            exams: row.exams || [],
            q_type: row.q_type || 'mcq_single',
            question: QuestionBankService.cleanQuestionText(row.question || ''),
            opt_a: row.opt_a || '',
            opt_b: row.opt_b || '',
            opt_c: row.opt_c || '',
            opt_d: row.opt_d || '',
            assertion: row.assertion || '',
            reason: row.reason || '',
            column_a: row.column_a || '',
            column_b: row.column_b || '',
            match_options: row.match_options || '',
            num_answer: row.num_answer || '',
            correct_option: row.correct_option || '',
            solution_text: QuestionBankService.cleanQuestionText(row.solution_text || ''),
            difficulty: diff,
            source: row.source || '',
            year: row.year ? String(row.year) : '',
          });
        }
      } catch (err: any) {
        console.error(`Error fetching candidate pool for ${subject} Class ${kl}:`, err.message);
      }
    }

    // Deduplicate candidate pool by question ID and text snippet
    const uniquePool: Question[] = [];
    const seenIds = new Set<string>();
    const seenText = new Set<string>();

    for (const q of candidatePool) {
      if (seenIds.has(q.id)) continue;
      const snippet = q.question.substring(0, 80).toLowerCase().replace(/\s+/g, '');
      if (snippet && seenText.has(snippet)) continue;

      seenIds.add(q.id);
      if (snippet) seenText.add(snippet);
      uniquePool.push(q);
    }

    return uniquePool;
  }

  /**
   * Generates examination question paper according to 2026 rules
   */
  public static async generatePaper(
    userId: string,
    reqConfig: PaperGenerationConfig
  ): Promise<GeneratedPaper> {
    const {
      title,
      institution_name,
      exam_type,
      subject,
      class_levels,
      chapters,
      duration_minutes,
      include_answer_key,
      include_solutions,
    } = reqConfig;

    // 1. Fetch questions pool
    const pool = await this.fetchCandidatePool(subject, class_levels, chapters);

    if (pool.length === 0) {
      throw new Error(
        `No questions found for ${subject} with the selected chapters. Please broaden chapter selection.`
      );
    }

    // Separate by difficulty
    const easyPool = this.shuffle(pool.filter((q) => q.difficulty === 'Easy'));
    const mediumPool = this.shuffle(pool.filter((q) => q.difficulty === 'Medium'));
    const hardPool = this.shuffle(pool.filter((q) => q.difficulty === 'Hard'));

    // Numerical questions pool for JEE Section B
    const numericalPool = this.shuffle(pool.filter((q) => q.q_type === 'numerical'));

    const usedIds = new Set<string>();

    // Helper to pick questions by difficulty target
    const pickQuestions = (
      count: number,
      preferredPool?: Question[],
      requireNumerical = false
    ): Question[] => {
      const selected: Question[] = [];

      // If numerical required
      if (requireNumerical) {
        for (const q of numericalPool) {
          if (!usedIds.has(q.id)) {
            selected.push(q);
            usedIds.add(q.id);
            if (selected.length === count) return selected;
          }
        }
      }

      // If preferred pool provided
      if (preferredPool) {
        for (const q of preferredPool) {
          if (!usedIds.has(q.id)) {
            selected.push(q);
            usedIds.add(q.id);
            if (selected.length === count) return selected;
          }
        }
      }

      // Standard balanced distribution: 30% Easy, 50% Medium, 20% Hard
      const targetEasy = Math.round(count * 0.3);
      const targetMedium = Math.round(count * 0.5);
      const targetHard = count - targetEasy - targetMedium;

      const pickFrom = (sourceList: Question[], numToPick: number) => {
        let picked = 0;
        for (const q of sourceList) {
          if (picked >= numToPick || selected.length >= count) break;
          if (!usedIds.has(q.id)) {
            selected.push(q);
            usedIds.add(q.id);
            picked++;
          }
        }
      };

      pickFrom(easyPool, targetEasy);
      pickFrom(mediumPool, targetMedium);
      pickFrom(hardPool, targetHard);

      // If still need more to meet count, pick from any remaining in pool
      if (selected.length < count) {
        for (const q of this.shuffle(pool)) {
          if (!usedIds.has(q.id)) {
            selected.push(q);
            usedIds.add(q.id);
            if (selected.length === count) break;
          }
        }
      }

      return selected;
    };

    // 2. Build sections based on Exam Type (2026 Rules)
    let sections: GeneratedPaper['sections'] = [];
    let instructions: string[] = [];
    let calculatedTotalMarks = 0;

    if (exam_type === 'NEET') {
      // NEET-UG (Post-COVID Revised Blueprint):
      // Section A: Exactly 35 Questions (Mandatory, 140 marks, +4 / -1)
      // Section B: Exactly 10 Questions (Mandatory — DO NOT use 15 questions with 10 to attempt, 40 marks, +4 / -1)
      // Total paper questions: 45 per subject | 180 Marks
      instructions = [
        'The question paper contains two mandatory sections: Section A and Section B.',
        'Section A contains 35 questions (Q. 1 to Q. 35). All questions are compulsory.',
        'Section B contains 10 questions (Q. 36 to Q. 45). All questions are compulsory.',
        'Each correct answer yields +4 marks. For each incorrect answer, 1 mark will be deducted (-1).',
        'No deduction for unattempted questions.',
      ];

      const secAQuestions = pickQuestions(35);
      const secBQuestions = pickQuestions(10);

      sections = [
        {
          name: 'Section A (Compulsory)',
          description: 'Questions 1 to 35 are compulsory. Each carries 4 marks (+4, -1).',
          attempt_count: 35,
          marks_per_question: 4,
          negative_marking: 1,
          questions: secAQuestions,
        },
        {
          name: 'Section B (Compulsory)',
          description: 'Questions 36 to 45 are compulsory. Each carries 4 marks (+4, -1).',
          attempt_count: 10,
          marks_per_question: 4,
          negative_marking: 1,
          questions: secBQuestions,
        },
      ];

      calculatedTotalMarks = 35 * 4 + 10 * 4; // 180 Marks
    } else if (exam_type === 'JEE') {
      // JEE Main (Revised Pattern):
      // Section A: Exactly 20 Multiple Choice Questions (Mandatory, 80 marks, +4 / -1)
      // Section B: Exactly 5 Numerical / Integer-Type Questions (Mandatory — DO NOT use 10 questions with 5 to attempt, 20 marks, +4 / -1)
      // Schema Rule: Section B questions must strictly enforce question_type: "numerical"
      // Total paper questions: 25 per subject | 100 Marks
      instructions = [
        'The question paper consists of 2 sections: Section A (MCQs) and Section B (Numerical Value).',
        'Section A comprises 20 MCQs with single correct option. All 20 questions are compulsory.',
        'Section B comprises 5 Numerical Value questions. All 5 questions are compulsory.',
        'Marking Scheme: +4 marks for correct response, -1 mark for incorrect response.',
        'For Section B, the answer must be entered as a numeric/integer value.',
      ];

      const secAQuestions = pickQuestions(20);
      const secBQuestions = pickQuestions(5, undefined, true);

      sections = [
        {
          name: 'Section A (Multiple Choice Questions)',
          description: 'Q. 1 to 20: Each question has 4 options. All 20 are compulsory. (+4, -1)',
          attempt_count: 20,
          marks_per_question: 4,
          negative_marking: 1,
          questions: secAQuestions,
        },
        {
          name: 'Section B (Numerical Value Questions)',
          description: 'Q. 21 to 25: Numerical response questions. All 5 are compulsory. (+4, -1)',
          attempt_count: 5,
          marks_per_question: 4,
          negative_marking: 1,
          questions: secBQuestions,
        },
      ];

      calculatedTotalMarks = 20 * 4 + 5 * 4; // 100 Marks
    } else if (exam_type === 'KCET' || exam_type === 'CET') {
      // KCET Standard Karnataka State Board CET Structure:
      // 60 single-option MCQs per subject paper (Physics, Chemistry, Math/Bio)
      // 60 Questions, 60 marks, 1 mark per question, No negative marking
      instructions = [
        'The question paper contains 60 multiple choice questions.',
        'All 60 questions are compulsory.',
        'Each question carries 1 mark (+1).',
        'There is NO negative marking for wrong answers.',
        'Total duration for this paper is 80 minutes.',
      ];

      const cetQuestions = pickQuestions(60);

      sections = [
        {
          name: 'Section I (Objective Questions)',
          description: '60 Questions. Each question carries 1 mark. No negative marking.',
          attempt_count: 60,
          marks_per_question: 1,
          negative_marking: 0,
          questions: cetQuestions,
        },
      ];

      calculatedTotalMarks = 60 * 1; // 60 Marks
    } else {
      // Custom Practice Paper
      const totalQ = reqConfig.total_questions || 30;
      const marksPerQ = reqConfig.marks_per_question || 4;
      const negMark = reqConfig.negative_marking || 1;

      instructions = [
        `This test paper contains ${totalQ} questions.`,
        'All questions are compulsory.',
        `Each correct response carries ${marksPerQ} marks.`,
        negMark > 0
          ? `For every incorrect response, ${negMark} mark(s) will be deducted.`
          : 'There is no negative marking.',
      ];

      const customQuestions = pickQuestions(totalQ);

      sections = [
        {
          name: 'Practice Examination',
          description: `All ${customQuestions.length} questions are compulsory.`,
          attempt_count: customQuestions.length,
          marks_per_question: marksPerQ,
          negative_marking: negMark,
          questions: customQuestions,
        },
      ];

      calculatedTotalMarks = customQuestions.length * marksPerQ;
    }

    // Compile all questions and answer key
    const allQuestions: Question[] = [];
    const answerKey: GeneratedPaper['answer_key'] = [];
    let currentNumber = 1;

    for (const sec of sections) {
      for (const q of sec.questions) {
        allQuestions.push(q);
        answerKey.push({
          q_no: currentNumber,
          answer: q.correct_option || 'N/A',
          num_answer: q.num_answer,
        });
        currentNumber++;
      }
    }

    const paper: GeneratedPaper = {
      id: 'qpg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      user_id: userId,
      title: title || `${subject} Examination Paper`,
      institution_name: institution_name || 'Apex Educational Institute',
      subject,
      exam_type,
      class_levels,
      duration_minutes: duration_minutes || (exam_type === 'CET' ? 80 : exam_type === 'NEET' ? 50 : 60),
      total_marks: calculatedTotalMarks,
      questions_count: allQuestions.length,
      sections,
      all_questions: allQuestions,
      answer_key: answerKey,
      instructions: reqConfig.custom_instructions && reqConfig.custom_instructions.length > 0
        ? reqConfig.custom_instructions
        : instructions,
      header: {
        institution_name: institution_name || 'MANCHESTER TECHNOLOGIES',
        sub_title: 'Davangere - 577006 • Examination Division',
        exam_code: `${exam_type}-${subject.toUpperCase().substring(0, 3)}-2026`,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        duration: `${duration_minutes || (exam_type === 'CET' ? 80 : exam_type === 'NEET' ? 50 : 60)} Minutes`,
        custom_instructions: instructions,
        watermark_text: 'MANCHESTER TECHNOLOGIES',
        is_locked: false,
      },
      sets: this.generateShuffledSets(sections),
      swaps_used: 0,
      swaps_limit: 50,
      created_at: new Date().toISOString(),
    };

    return paper;
  }

  /**
   * Generates synchronized shuffled versions: Set P, Set Q, Set R, Set S with master answer keys
   */
  public static generateShuffledSets(sections: GeneratedPaper['sections']) {
    const buildSet = (orderFn: (qs: Question[]) => Question[]) => {
      const setSections = sections.map((sec) => ({
        ...sec,
        questions: orderFn(sec.questions),
      }));
      let qNum = 1;
      const key: GeneratedPaper['answer_key'] = [];
      for (const s of setSections) {
        for (const q of s.questions) {
          key.push({
            q_no: qNum++,
            answer: q.correct_option || 'N/A',
            num_answer: q.num_answer,
          });
        }
      }
      return { sections: setSections, answer_key: key };
    };

    return {
      P: buildSet((qs) => [...qs]),
      Q: buildSet((qs) => {
        if (qs.length <= 1) return [...qs];
        const mid = Math.floor(qs.length / 2);
        return [...qs.slice(mid), ...qs.slice(0, mid)];
      }),
      R: buildSet((qs) => {
        const result: Question[] = [];
        for (let i = 0; i < qs.length; i++) {
          const idx = (i * 3 + 1) % qs.length;
          result.push(qs[idx] || qs[i]);
        }
        const seen = new Set<string>();
        const unique: Question[] = [];
        for (const item of result) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
          }
        }
        for (const q of qs) {
          if (!seen.has(q.id)) {
            unique.push(q);
          }
        }
        return unique;
      }),
      S: buildSet((qs) => [...qs].reverse()),
    };
  }

  /**
   * Swaps a target question with an alternative question in paper state
   */
  public static swapQuestion(
    paper: GeneratedPaper,
    targetQuestionId: string,
    replacement: Question
  ): GeneratedPaper {
    const updatedSections = paper.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => (q.id === targetQuestionId ? replacement : q)),
    }));

    const allQuestions: Question[] = [];
    const answerKey: GeneratedPaper['answer_key'] = [];
    let currentNumber = 1;

    for (const sec of updatedSections) {
      for (const q of sec.questions) {
        allQuestions.push(q);
        answerKey.push({
          q_no: currentNumber,
          answer: q.correct_option || 'N/A',
          num_answer: q.num_answer,
        });
        currentNumber++;
      }
    }

    return {
      ...paper,
      sections: updatedSections,
      all_questions: allQuestions,
      answer_key: answerKey,
      sets: this.generateShuffledSets(updatedSections),
      swaps_used: (paper.swaps_used || 0) + 1,
    };
  }
}
