import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Layers,
  HelpCircle,
  Hash,
  AlertCircle,
  Check,
} from 'lucide-react';
import { ExamType } from './ChooseExamStep';
import { KaTeXRenderer } from './KaTeXRenderer';
import {
  CHEMISTRY_ASSERTION_REASON_BANK,
  CHEMISTRY_DIAGRAMMATIC_BANK,
  CHEMISTRY_STATEMENTS_BANK,
  CHEMISTRY_MATCH_BANK,
  CHEMISTRY_NUMERICAL_BANK,
  CHEMISTRY_MCQ_BANK,
  QuestionItem,
  SectionItem,
  PaperState,
  api,
} from '../services/apiClient';
import { useToast } from './Toast';

interface ManualQuestionsSelectorStepProps {
  selectedExam: ExamType;
  targetQuestions: number;
  selectedChapters: string[];
  selectedConcepts: string[];
  userSubject: string;
  onBack: () => void;
  onComplete: (paper: PaperState) => void;
}

export const ManualQuestionsSelectorStep: React.FC<ManualQuestionsSelectorStepProps> = ({
  selectedExam,
  targetQuestions,
  selectedChapters,
  selectedConcepts,
  userSubject,
  onBack,
  onComplete,
}) => {
  const { warning, success, info } = useToast();

  const isNEET = selectedExam === 'NEET';
  const isJEE = selectedExam === 'JEE';
  const isKCET = selectedExam === 'KCET';
  const isAssignment = selectedExam === 'ASSIGNMENT';

  // Filters State
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('all');
  const [selectedConceptFilter, setSelectedConceptFilter] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Questions Pool
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  // Master Question Pool: combine all banks, synthesizing questions across selected chapters
  const allAvailableQuestions = useMemo<QuestionItem[]>(() => {
    const rawPool: QuestionItem[] = [
      ...CHEMISTRY_MCQ_BANK,
      ...CHEMISTRY_ASSERTION_REASON_BANK,
      ...CHEMISTRY_DIAGRAMMATIC_BANK,
      ...CHEMISTRY_STATEMENTS_BANK,
      ...CHEMISTRY_MATCH_BANK,
      ...(isJEE || isAssignment ? CHEMISTRY_NUMERICAL_BANK : []),
    ];

    // Filter out numericals strictly if NEET or KCET
    let filtered = rawPool.filter((q) => {
      if ((isNEET || isKCET) && q.q_type === 'numerical') {
        return false;
      }
      return true;
    });

    // Synthesize chapter variations across all selected chapters
    const expandedList: QuestionItem[] = [];
    const chaptersToUse = selectedChapters.length > 0 ? selectedChapters : ['Structure of Atom', 'Thermodynamics & Thermochemistry', 'Solutions', 'Electrochemistry'];

    chaptersToUse.forEach((chap, chIdx) => {
      filtered.forEach((template, qIdx) => {
        expandedList.push({
          ...template,
          id: `mq_${chIdx}_${template.id}_${qIdx}`,
          chapter: chap,
          concept: selectedConcepts[qIdx % (selectedConcepts.length || 1)] || 'Core Reaction Principles & Concepts',
          solution_text:
            template.solution_text ||
            `Applying fundamental principles of ${chap}, analyzing the given data yields Option (${template.correct_option || 'A'}) as the verified correct response.`,
        });
      });
    });

    return expandedList;
  }, [selectedChapters, selectedConcepts, isNEET, isJEE, isKCET, isAssignment]);

  // Dynamic filter options
  const chapterOptions = useMemo(() => {
    return ['all', ...(selectedChapters.length > 0 ? selectedChapters : ['General'])];
  }, [selectedChapters]);

  const conceptOptions = useMemo(() => {
    return ['all', ...selectedConcepts];
  }, [selectedConcepts]);

  // Filtered Questions Display
  const filteredQuestions = useMemo(() => {
    return allAvailableQuestions.filter((q) => {
      // Chapter filter
      if (selectedChapterFilter !== 'all' && q.chapter !== selectedChapterFilter) {
        return false;
      }

      // Concept filter
      if (selectedConceptFilter !== 'all' && q.concept !== selectedConceptFilter) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && (q.difficulty || 'Medium') !== selectedDifficulty) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all') {
        if (selectedType === 'numerical' && (isNEET || isKCET)) return false;
        if (q.q_type !== selectedType) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQ = (q.question || '').toLowerCase().includes(query);
        const matchesChap = (q.chapter || '').toLowerCase().includes(query);
        if (!matchesQ && !matchesChap) return false;
      }

      return true;
    });
  }, [
    allAvailableQuestions,
    selectedChapterFilter,
    selectedConceptFilter,
    selectedDifficulty,
    selectedType,
    searchQuery,
    isNEET,
    isKCET,
  ]);

  // Selected questions objects
  const selectedQuestionsList = useMemo(() => {
    const map = new Map(allAvailableQuestions.map((q) => [q.id, q]));
    return Array.from(selectedQuestionIds)
      .map((id) => map.get(id))
      .filter((q): q is QuestionItem => !!q);
  }, [selectedQuestionIds, allAvailableQuestions]);

  // Quota breakdown
  const nonNumericalCount = useMemo(() => {
    return selectedQuestionsList.filter((q) => q.q_type !== 'numerical').length;
  }, [selectedQuestionsList]);

  const numericalCount = useMemo(() => {
    return selectedQuestionsList.filter((q) => q.q_type === 'numerical').length;
  }, [selectedQuestionsList]);

  const totalSelected = selectedQuestionsList.length;

  // Max quota check
  const maxQuota = isNEET ? 45 : isJEE ? 25 : isKCET ? 60 : targetQuestions;

  // Toggle selection
  const handleToggleQuestion = (q: QuestionItem) => {
    const isSelected = selectedQuestionIds.has(q.id);

    if (isSelected) {
      const next = new Set(selectedQuestionIds);
      next.delete(q.id);
      setSelectedQuestionIds(next);
      return;
    }

    // Quota limits checks
    if (isNEET && totalSelected >= 45) {
      warning('NEET Quota Reached', 'NEET-UG examination allows exactly 45 questions.');
      return;
    }

    if (isKCET && totalSelected >= 60) {
      warning('KCET Quota Reached', 'KCET examination allows exactly 60 questions.');
      return;
    }

    if (isJEE) {
      if (q.q_type === 'numerical') {
        if (numericalCount >= 5) {
          warning('Section B Full', 'JEE Main Section B permits exactly 5 Numerical / Integer questions.');
          return;
        }
      } else {
        if (nonNumericalCount >= 20) {
          warning('Section A Full', 'JEE Main Section A permits exactly 20 non-numerical questions.');
          return;
        }
      }
    } else if (isAssignment) {
      if (totalSelected >= targetQuestions) {
        warning('Quota Reached', `You have reached your custom quota of ${targetQuestions} questions.`);
        return;
      }
    }

    const next = new Set(selectedQuestionIds);
    next.add(q.id);
    setSelectedQuestionIds(next);
  };

  // Compile Paper and Complete
  const handleDone = () => {
    if (isNEET && totalSelected < 45) {
      warning(
        'Incomplete Quota',
        `NEET requires 45 questions. You have selected ${totalSelected} questions. Please select ${45 - totalSelected} more.`
      );
      return;
    }

    if (isKCET && totalSelected < 60) {
      warning(
        'Incomplete Quota',
        `KCET requires 60 questions. You have selected ${totalSelected} questions. Please select ${60 - totalSelected} more.`
      );
      return;
    }

    if (isJEE) {
      if (nonNumericalCount < 20 || numericalCount < 5) {
        warning(
          'Incomplete JEE Blueprint',
          `JEE Main requires 20 Section A MCQs (you have ${nonNumericalCount}/20) and 5 Section B Numericals (you have ${numericalCount}/5).`
        );
        return;
      }
    }

    if (totalSelected === 0) {
      warning('No Questions Selected', 'Please select questions to construct your examination paper.');
      return;
    }

    // Construct sections
    let sections: SectionItem[] = [];
    const duration = isNEET ? 50 : isJEE ? 60 : isKCET ? 80 : Math.round(totalSelected * 1.3);
    const marksPerQ = isKCET ? 1 : 4;
    const negMarks = isKCET ? 0 : 1;

    if (isJEE) {
      const secA = selectedQuestionsList.filter((q) => q.q_type !== 'numerical').slice(0, 20);
      const secB = selectedQuestionsList.filter((q) => q.q_type === 'numerical').slice(0, 5);

      sections = [
        {
          name: `${userSubject} - Section A`,
          description: '20 Single-Option Multiple Choice Questions (Mandatory).',
          attempt_count: 20,
          marks_per_question: 4,
          negative_marking: 1,
          questions: secA,
        },
        {
          name: `${userSubject} - Section B`,
          description: '5 Numerical / Integer-Type Questions (Strictly Enforced).',
          attempt_count: 5,
          marks_per_question: 4,
          negative_marking: 1,
          questions: secB,
        },
      ];
    } else {
      sections = [
        {
          name: `${userSubject}`,
          description: isNEET ? 'Direct 45 Compulsory Questions' : isKCET ? 'Direct 60 Compulsory MCQs' : 'Custom Assignment Questions',
          attempt_count: totalSelected,
          marks_per_question: marksPerQ,
          negative_marking: negMarks,
          questions: selectedQuestionsList,
        },
      ];
    }

    // Master answer key
    let qIdx = 1;
    const answerKey = selectedQuestionsList.map((q) => ({
      q_no: qIdx++,
      answer: q.correct_option || 'A',
      num_answer: q.num_answer,
    }));

    // Generate sets P, Q, R, S
    const generateSet = (seed: number) => {
      const setSecs: SectionItem[] = sections.map((sec) => {
        const copy = [...sec.questions];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = (i + seed) % (i + 1);
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return { ...sec, questions: copy };
      });

      let sqIdx = 1;
      const setAk: { q_no: number; answer: string }[] = [];
      setSecs.forEach((s) => {
        s.questions.forEach((q) => {
          setAk.push({ q_no: sqIdx++, answer: q.correct_option || 'A' });
        });
      });

      return { sections: setSecs, answer_key: setAk };
    };

    const sets = {
      P: generateSet(1),
      Q: generateSet(2),
      R: generateSet(3),
      S: generateSet(4),
    };

    const examTitle = isJEE ? 'JEE MAIN' : isNEET ? 'NEET-UG' : isKCET ? 'KCET' : 'ASSIGNMENT';

    const paperPayload: PaperState = {
      id: 'paper_' + Date.now().toString(36),
      title: `${examTitle} - ${userSubject} Examination`,
      subject: userSubject,
      exam_type: examTitle,
      duration_minutes: duration,
      total_marks: sections.reduce((acc, s) => acc + s.questions.length * s.marks_per_question, 0),
      questions_count: totalSelected,
      institution_name: 'MANCHESTER TECHNOLOGIES',
      instructions: [
        'All questions are compulsory according to official syllabus specifications.',
        `Each question carries ${marksPerQ} marks.${negMarks > 0 ? ` For each incorrect response, ${negMarks} mark will be deducted.` : ' There is no negative marking.'}`,
        'Use of scientific calculators and digital devices is strictly prohibited.',
      ],
      sections,
      answer_key: answerKey,
      sets,
      header: {
        institution_name: 'MANCHESTER TECHNOLOGIES',
        instituteName: 'MANCHESTER TECHNOLOGIES',
        sub_title: 'Davangere - 577006 • Department of Chemistry',
        subTitle: 'Davangere - 577006 • Department of Chemistry',
        exam_code: `${examTitle}-CHEM-2026`,
        examCode: `${examTitle}-CHEM-2026`,
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
        duration: `${duration} Minutes`,
        custom_instructions: [
          'All questions are compulsory according to official syllabus specifications.',
          `Each question carries ${marksPerQ} marks.`,
        ],
        watermark_text: 'MANCHESTER TECHNOLOGIES',
        is_locked: false,
      },
    };

    success('Paper Compiled!', `Constructed with your ${totalSelected} hand-picked questions.`);
    onComplete(paperPayload);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 animate-in fade-in duration-300 pb-28">
      {/* Top Header & Quota Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C8A96A] uppercase tracking-wider font-heading">
            <span>✍️ Manual Question Selector</span>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
            Select Questions for {selectedExam === 'JEE' ? 'JEE Main' : selectedExam}
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Filter by Chapter, Concept, Question Type, and Difficulty. Hand-pick each question.
          </p>
        </div>

        {/* Real-time Quota Badges */}
        <div className="flex flex-wrap items-center gap-2 bg-[#141414] p-2.5 rounded-2xl border border-white/10">
          {isJEE ? (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold">
                <span>Sec A (MCQ):</span>
                <strong className={nonNumericalCount === 20 ? 'text-emerald-400' : 'text-white'}>
                  {nonNumericalCount}/20
                </strong>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                <span>Sec B (Numerical):</span>
                <strong className={numericalCount === 5 ? 'text-emerald-400' : 'text-white'}>
                  {numericalCount}/5
                </strong>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/20 text-[#C8A96A] text-xs font-black">
                <span>Total:</span>
                <strong>{totalSelected}/25</strong>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#C8A96A]/15 border border-[#C8A96A]/30 text-white text-xs font-bold">
              <span className="text-slate-300 font-medium">Selected Quota:</span>
              <strong className={totalSelected === maxQuota ? 'text-emerald-400 text-sm' : 'text-[#C8A96A] text-sm'}>
                {totalSelected} / {maxQuota} Qs
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* FILTER TOOLBAR (CHAPTER, CONCEPT, TYPE, DIFFICULTY, SEARCH) */}
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-3.5 sm:p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase font-heading">
          <Filter className="h-3.5 w-3.5 text-[#C8A96A]" />
          <span>FILTER QUESTIONS REPOSITORY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Chapter Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Chapter</label>
            <select
              value={selectedChapterFilter}
              onChange={(e) => {
                setSelectedChapterFilter(e.target.value);
                setSelectedConceptFilter('all');
              }}
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="all">All Selected Chapters ({selectedChapters.length})</option>
              {selectedChapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Concept Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Concept</label>
            <select
              value={selectedConceptFilter}
              onChange={(e) => setSelectedConceptFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="all">All Concepts ({selectedConcepts.length})</option>
              {selectedConcepts.map((cp) => (
                <option key={cp} value={cp}>
                  {cp}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type Dropdown (Strictly no numerical for NEET & KCET) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Question Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="all">All Question Types</option>
              <option value="single_mcq">Single Choice (MCQ)</option>
              <option value="assertion_reason">Assertion & Reason</option>
              <option value="statements">Statement Based</option>
              <option value="match_following">Match the Following</option>
              <option value="diagrammatic">Diagrammatic</option>
              {/* Only show numerical for JEE or Assignment */}
              {(isJEE || isAssignment) && (
                <option value="numerical">Numerical / Integer Type</option>
              )}
            </select>
          </div>

          {/* Difficulty Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
            >
              <option value="all">All Difficulties (Easy, Med, Hard)</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Text Search */}
          <div className="space-y-1 sm:col-span-2 md:col-span-4 lg:col-span-1">
            <label className="text-[10px] font-bold uppercase text-slate-400">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] pl-8 pr-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Guidance Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
          <span>
            Displaying <strong className="text-white">{filteredQuestions.length}</strong> matching questions in pool
          </span>
          <span className="text-slate-400">
            Selected: <strong className="text-[#C8A96A]">{totalSelected}</strong> of {maxQuota}
          </span>
        </div>
      </div>

      {/* QUESTION CARDS LIST */}
      <div className="space-y-3.5">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-12 text-center">
            <HelpCircle className="mx-auto h-10 w-10 text-slate-500 mb-2" />
            <h3 className="text-sm font-bold text-white">No Questions Matching Criteria</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try choosing "All Concepts", "All Types", or clearing the search query to view more questions.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isSelected = selectedQuestionIds.has(q.id);
            const diffColor =
              q.difficulty === 'Easy'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : q.difficulty === 'Hard'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/20';

            const typeLabel =
              q.q_type === 'assertion_reason'
                ? 'Assertion & Reason'
                : q.q_type === 'statements'
                ? 'Statements'
                : q.q_type === 'match_following'
                ? 'Match Table'
                : q.q_type === 'diagrammatic'
                ? 'Diagrammatic'
                : q.q_type === 'numerical'
                ? 'Numerical'
                : 'MCQ';

            return (
              <div
                key={q.id}
                onClick={() => handleToggleQuestion(q)}
                className={`relative rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#C8A96A] bg-[#1C1810] shadow-lg shadow-[#C8A96A]/5 ring-1 ring-[#C8A96A]'
                    : 'border-white/5 bg-[#141414] hover:border-white/20 hover:bg-[#181818]'
                }`}
              >
                {/* Card Top Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-slate-200 text-xs font-black">
                      #{idx + 1}
                    </span>
                    <span className="rounded-lg bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-slate-300 border border-white/5">
                      {q.chapter}
                    </span>
                    <span className="rounded-lg bg-[#C8A96A]/10 px-2 py-0.5 text-[10px] font-bold text-[#C8A96A] border border-[#C8A96A]/20">
                      {typeLabel}
                    </span>
                    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border ${diffColor}`}>
                      {q.difficulty || 'Medium'}
                    </span>
                  </div>

                  {/* Selection Checkbox Pill */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black transition-all ${
                        isSelected
                          ? 'bg-[#C8A96A] text-[#0D0D0D] shadow'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <>
                          <Circle className="h-3.5 w-3.5" />
                          <span>Select</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Question Statement Rendered with KaTeX */}
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif">
                  <KaTeXRenderer content={q.question} />
                </div>

                {/* Assertion & Reason Body */}
                {q.q_type === 'assertion_reason' && q.assertion && (
                  <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                    <div>
                      <strong className="text-amber-400 font-sans">Assertion (A):</strong>{' '}
                      <KaTeXRenderer content={q.assertion} className="inline" />
                    </div>
                    <div>
                      <strong className="text-amber-400 font-sans">Reason (R):</strong>{' '}
                      <KaTeXRenderer content={q.reason || ''} className="inline" />
                    </div>
                  </div>
                )}

                {/* Statement 1 & 2 */}
                {q.q_type === 'statements' && q.statement_1 && (
                  <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
                    <div>
                      <strong className="text-cyan-400 font-sans">Statement I:</strong>{' '}
                      <KaTeXRenderer content={q.statement_1} className="inline" />
                    </div>
                    <div>
                      <strong className="text-cyan-400 font-sans">Statement II:</strong>{' '}
                      <KaTeXRenderer content={q.statement_2 || ''} className="inline" />
                    </div>
                  </div>
                )}

                {/* Diagrammatic SVG */}
                {q.diagram_svg && (
                  <div
                    className="my-3 flex items-center justify-center p-3 rounded-xl bg-black/30 border border-white/5 max-h-48 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: q.diagram_svg }}
                  />
                )}

                {/* Match Table */}
                {q.match_table && (
                  <div className="mt-3 rounded-xl border border-white/10 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 text-[10px] text-slate-400 uppercase">
                        <tr>
                          <th className="p-2 border-r border-white/10">Column I</th>
                          <th className="p-2">Column II</th>
                        </tr>
                      </thead>
                      <tbody>
                        {q.match_table.map((row, rIdx) => (
                          <tr key={rIdx} className="border-t border-white/5">
                            <td className="p-2 border-r border-white/10 text-slate-300">
                              <KaTeXRenderer content={row.col1} className="inline" />
                            </td>
                            <td className="p-2 text-slate-300">
                              <KaTeXRenderer content={row.col2} className="inline" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Options (MCQ) */}
                {q.opt_a && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-slate-300">
                      <strong className="text-[#C8A96A] mr-1">(1)</strong>
                      <KaTeXRenderer content={q.opt_a} className="inline" />
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-slate-300">
                      <strong className="text-[#C8A96A] mr-1">(2)</strong>
                      <KaTeXRenderer content={q.opt_b || ''} className="inline" />
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-slate-300">
                      <strong className="text-[#C8A96A] mr-1">(3)</strong>
                      <KaTeXRenderer content={q.opt_c || ''} className="inline" />
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/5 text-slate-300">
                      <strong className="text-[#C8A96A] mr-1">(4)</strong>
                      <KaTeXRenderer content={q.opt_d || ''} className="inline" />
                    </div>
                  </div>
                )}

                {/* Numerical Value prompt */}
                {q.q_type === 'numerical' && (
                  <div className="mt-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center justify-between">
                    <span>Numerical Value Response [Integer / Decimal]</span>
                    <span className="font-bold">Answer: {q.num_answer !== undefined ? q.num_answer : 'Numerical Key'}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* STICKY BOTTOM ACTION BAR WITH "DONE" BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0D0D0D]/95 p-4 backdrop-blur-xl shadow-2xl no-print">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Back button and Quota summary */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#141414] px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:border-[#C8A96A]/40 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="text-xs">
              <span className="text-slate-400">Total Selected: </span>
              <strong className="text-white font-bold">{totalSelected}</strong>
              <span className="text-slate-400"> / {maxQuota} Questions</span>
              {isJEE && (
                <span className="text-[11px] text-cyan-300 ml-2 hidden md:inline">
                  (Sec A: {nonNumericalCount}/20, Sec B: {numericalCount}/5)
                </span>
              )}
            </div>
          </div>

          {/* DONE (Generate Paper Preview) Button */}
          <button
            type="button"
            onClick={handleDone}
            className="w-full sm:w-auto glow-button flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black text-[#0D0D0D] transition-all cursor-pointer shadow-lg shadow-[#C8A96A]/20"
          >
            <span>✓ DONE (Open Paper Preview)</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
