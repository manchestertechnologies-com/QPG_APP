import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  ChevronDown,
  Check,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Sliders,
} from 'lucide-react';
import { ExamType } from './ChooseExamStep';
import { api } from '../services/apiClient';
import { useToast } from './Toast';

export interface MatrixRow {
  chapter: string;
  classLevel: string;
  assertionReason: number;
  diagrammatic: number;
  singleMcq: number;
  numerical: number;
}

interface SyllabusMatrixStepProps {
  examType: ExamType;
  userSubject: string;
  onBack: () => void;
  onGenerate: (payload: {
    chapters: string[];
    concepts: string[];
    classLevels: ('11' | '12')[];
    matrix: MatrixRow[];
    totalQuestions: number;
  }) => void;
  isGenerating: boolean;
}

export const SyllabusMatrixStep: React.FC<SyllabusMatrixStepProps> = ({
  examType,
  userSubject,
  onBack,
  onGenerate,
  isGenerating,
}) => {
  const { warning, error, info } = useToast();

  const [classFilter, setClassFilter] = useState<'both' | '11' | '12'>('both');
  const [chaptersList, setChaptersList] = useState<{ name: string; count: number; classLevel: string }[]>([
    { name: 'Some Basic Concepts of Chemistry', count: 1420, classLevel: '11' },
    { name: 'Structure of Atom', count: 1680, classLevel: '11' },
    { name: 'Classification of Elements & Periodicity', count: 1150, classLevel: '11' },
    { name: 'Chemical Bonding & Molecular Structure', count: 1890, classLevel: '11' },
    { name: 'Thermodynamics & Thermochemistry', count: 1540, classLevel: '11' },
    { name: 'Equilibrium (Chemical & Ionic)', count: 1980, classLevel: '11' },
    { name: 'Redox Reactions', count: 920, classLevel: '11' },
    { name: 'Organic Chemistry: Basic Principles & Techniques', count: 2100, classLevel: '11' },
    { name: 'Hydrocarbons', count: 1840, classLevel: '11' },
    { name: 'Solutions', count: 1760, classLevel: '12' },
    { name: 'Electrochemistry', count: 1950, classLevel: '12' },
    { name: 'Chemical Kinetics', count: 1820, classLevel: '12' },
    { name: 'The d- and f-Block Elements', count: 1390, classLevel: '12' },
    { name: 'Coordination Compounds', count: 1650, classLevel: '12' },
    { name: 'Haloalkanes & Haloarenes', count: 1580, classLevel: '12' },
    { name: 'Alcohols, Phenols & Ethers', count: 1720, classLevel: '12' },
    { name: 'Aldehydes, Ketones & Carboxylic Acids', count: 2150, classLevel: '12' },
    { name: 'Amines & Diazonium Salts', count: 1380, classLevel: '12' },
    { name: 'Biomolecules', count: 1220, classLevel: '12' },
  ]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([
    'Structure of Atom',
    'Thermodynamics & Thermochemistry',
    'Solutions',
    'Electrochemistry',
  ]);
  const [conceptsList, setConceptsList] = useState<{ tag: string; count: number }[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');

  // Breakdown Matrix per Chapter
  const [matrix, setMatrix] = useState<Record<string, MatrixRow>>({});

  // Mandatory target counts based on exam blueprint
  const targetTotal = useMemo(() => {
    if (examType === 'NEET') return 45; // 35 Sec A + 10 Sec B
    if (examType === 'JEE') return 25; // 20 Sec A + 5 Sec B Numerical
    if (examType === 'KCET') return 60; // 60 Objective MCQs
    return 30;
  }, [examType]);

  const targetNumerical = useMemo(() => {
    if (examType === 'JEE') return 5; // JEE strictly mandates 5 numerical
    return 0;
  }, [examType]);

  // Load chapters from API
  useEffect(() => {
    let mounted = true;
    const fetchChapters = async () => {
      setIsLoadingChapters(true);
      try {
        const res = await api.getChapters(classFilter);
        if (mounted && res && res.chapters) {
          const formatted = res.chapters.map((c: any) => ({
            name: c.name,
            count: c.total_questions || c.count || 1400,
            classLevel: c.class_level || c.classLevel || '11',
          }));
          setChaptersList(formatted);
          // Pre-select top 4 chapters by default for immediate preview
          if (formatted.length > 0 && selectedChapters.length === 0) {
            const defaults = formatted.slice(0, 4).map((c: any) => c.name);
            setSelectedChapters(defaults);
          }
        }
      } catch (err) {
        console.warn('Failed loading chapters:', err);
      } finally {
        if (mounted) setIsLoadingChapters(false);
      }
    };
    fetchChapters();
    return () => {
      mounted = false;
    };
  }, [classFilter]);

  // Load concept tags when chapters change
  useEffect(() => {
    let mounted = true;
    const fetchConcepts = async () => {
      if (selectedChapters.length === 0) {
        setConceptsList([]);
        return;
      }
      setIsLoadingConcepts(true);
      try {
        const firstCh = selectedChapters[0];
        const res = await api.getConcepts(firstCh);
        if (mounted && res && res.concepts) {
          setConceptsList(res.concepts.slice(0, 12));
          setSelectedConcepts(res.concepts.slice(0, 3).map((c: any) => c.tag));
        }
      } catch (e) {
        console.warn('Failed loading concepts:', e);
      } finally {
        if (mounted) setIsLoadingConcepts(false);
      }
    };
    fetchConcepts();
    return () => {
      mounted = false;
    };
  }, [selectedChapters]);

  // Initialize or update matrix when selected chapters change
  useEffect(() => {
    setMatrix((prev) => {
      const updated: Record<string, MatrixRow> = {};
      const numCh = selectedChapters.length || 1;
      const basePerCh = Math.max(1, Math.floor(targetTotal / numCh));

      selectedChapters.forEach((ch, idx) => {
        if (prev[ch]) {
          updated[ch] = prev[ch];
        } else {
          // Initialize balanced defaults per chapter
          const isJee = examType === 'JEE';
          const isNeet = examType === 'NEET';

          let num = isJee && idx === 0 ? 5 : 0;
          let ar = isNeet ? 2 : 1;
          let diag = isNeet ? 2 : 1;
          let mcq = Math.max(1, basePerCh - ar - diag - num);

          updated[ch] = {
            chapter: ch,
            classLevel: classFilter === 'both' ? '11/12' : classFilter,
            assertionReason: ar,
            diagrammatic: diag,
            singleMcq: mcq,
            numerical: num,
          };
        }
      });
      return updated;
    });
  }, [selectedChapters, targetTotal, examType, classFilter]);

  // Auto-balance matrix to perfectly match mandatory targetTotal
  const handleAutoBalance = () => {
    if (selectedChapters.length === 0) return;
    const numCh = selectedChapters.length;
    let distributed = 0;

    const newMatrix: Record<string, MatrixRow> = {};

    selectedChapters.forEach((ch, idx) => {
      const isLast = idx === numCh - 1;
      let targetForThis = Math.floor(targetTotal / numCh);
      if (isLast) {
        targetForThis = targetTotal - distributed;
      } else {
        distributed += targetForThis;
      }

      let num = 0;
      if (examType === 'JEE') {
        num = idx === 0 ? 5 : 0; // JEE mandatory 5 numericals
      }

      let ar = examType === 'NEET' ? Math.min(2, Math.floor(targetForThis * 0.15)) : 1;
      let diag = Math.min(2, Math.floor(targetForThis * 0.15));
      let mcq = Math.max(0, targetForThis - ar - diag - num);

      newMatrix[ch] = {
        chapter: ch,
        classLevel: classFilter === 'both' ? '11/12' : classFilter,
        assertionReason: ar,
        diagrammatic: diag,
        singleMcq: mcq,
        numerical: num,
      };
    });

    setMatrix(newMatrix);
    info('Blueprint auto-balanced', `Target of ${targetTotal} questions perfectly distributed.`);
  };

  // Adjust numeric stepper in matrix cell
  const handleStepperChange = (
    chapter: string,
    field: 'assertionReason' | 'diagrammatic' | 'singleMcq' | 'numerical',
    delta: number
  ) => {
    setMatrix((prev) => {
      const row = prev[chapter];
      if (!row) return prev;
      const current = row[field];
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [chapter]: {
          ...row,
          [field]: next,
        },
      };
    });
  };

  // Calculate totals
  const currentTotal = useMemo(() => {
    return Object.values(matrix).reduce(
      (sum, r) => sum + r.assertionReason + r.diagrammatic + r.singleMcq + r.numerical,
      0
    );
  }, [matrix]);

  const totalAssertion = useMemo(
    () => Object.values(matrix).reduce((s, r) => s + r.assertionReason, 0),
    [matrix]
  );
  const totalDiagram = useMemo(
    () => Object.values(matrix).reduce((s, r) => s + r.diagrammatic, 0),
    [matrix]
  );
  const totalMcq = useMemo(
    () => Object.values(matrix).reduce((s, r) => s + r.singleMcq, 0),
    [matrix]
  );
  const totalNumerical = useMemo(
    () => Object.values(matrix).reduce((s, r) => s + r.numerical, 0),
    [matrix]
  );

  const isBudgetBalanced = currentTotal === targetTotal;
  const isJeeNumericalValid = examType !== 'JEE' || totalNumerical >= 5;

  const handleValidateAndGenerate = () => {
    if (selectedChapters.length === 0) {
      error('Chapter Selection Required', 'Please select at least 1 chapter from the syllabus.');
      return;
    }

    if (!isBudgetBalanced) {
      error(
        'Budget Mismatch',
        `Current questions (${currentTotal}) does not match the mandatory blueprint total (${targetTotal}). Use Auto-Balance or adjust steppers.`
      );
      return;
    }

    if (examType === 'JEE' && totalNumerical < 5) {
      warning(
        'JEE Schema Violation',
        `JEE Main requires exactly 5 Numerical Value questions in Section B. Currently selected: ${totalNumerical}.`
      );
      return;
    }

    const classLevels: ('11' | '12')[] =
      classFilter === 'both' ? ['11', '12'] : classFilter === '11' ? ['11'] : ['12'];

    onGenerate({
      chapters: selectedChapters,
      concepts: selectedConcepts,
      classLevels,
      matrix: Object.values(matrix),
      totalQuestions: currentTotal,
    });
  };

  const toggleChapter = (chName: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chName) ? prev.filter((c) => c !== chName) : [...prev, chName]
    );
  };

  const toggleConcept = (tag: string) => {
    setSelectedConcepts((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
            <span>Step 2 • Question Distribution</span>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Chapters & Question Distribution
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Exam: <strong className="text-purple-300 font-semibold">{examType}</strong> • Subject: <strong className="text-white font-semibold">{userSubject}</strong>
          </p>
        </div>

        <button
          onClick={handleAutoBalance}
          className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer self-start sm:self-auto shadow-lg"
        >
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>Auto-Balance Blueprint</span>
        </button>
      </div>

      {/* Cascading Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-[#11141E] p-4">
        {/* Dropdown 1: Subject (Locked) */}
        <div>
          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Subject Specialization
          </label>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#161A26] px-3.5 py-2.5 text-xs font-bold text-white">
            <span>{userSubject}</span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md font-semibold">
              Verified
            </span>
          </div>
        </div>

        {/* Dropdown 2: Class Filter */}
        <div>
          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Class Curriculum
          </label>
          <div className="flex rounded-xl border border-white/10 bg-[#161A26] p-1">
            {(['both', '11', '12'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setClassFilter(lvl)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                  classFilter === lvl
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl === 'both' ? 'Class 11 & 12' : `Class ${lvl}`}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown 3: Multi-select Concepts count */}
        <div>
          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
            Selected Concept Tags
          </label>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#161A26] px-3.5 py-2.5 text-xs font-bold text-slate-200">
            <span>
              {selectedConcepts.length > 0
                ? `${selectedConcepts.length} Concepts Active`
                : 'All Concept Tags'}
            </span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Chapters Selection Grid */}
      <div className="rounded-2xl border border-white/10 bg-[#11141E] p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Syllabus Chapters</span>
              <span className="rounded-full bg-purple-500/20 text-purple-300 text-xs px-2.5 py-0.5 border border-purple-500/30">
                {selectedChapters.length} Selected
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select which chapters to include in your paper. All chapters are populated with Chemistry questions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedChapters(chaptersList.map((c) => c.name))}
              className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              Select All ({chaptersList.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedChapters(chaptersList.filter((c) => c.classLevel === '11').map((c) => c.name))}
              className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              Class 11
            </button>
            <button
              type="button"
              onClick={() => setSelectedChapters(chaptersList.filter((c) => c.classLevel === '12').map((c) => c.name))}
              className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              Class 12
            </button>
            <button
              type="button"
              onClick={() => setSelectedChapters([])}
              className="rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Chapter Search Box */}
        <div className="relative">
          <BookOpen className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={chapterSearch}
            onChange={(e) => setChapterSearch(e.target.value)}
            placeholder="Search chapters (e.g. Thermodynamics, Solutions, Kinetics, Organic)..."
            className="w-full rounded-xl border border-white/10 bg-[#161A26] pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {isLoadingChapters ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading chapters...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {chaptersList
              .filter((ch) => ch.name.toLowerCase().includes(chapterSearch.toLowerCase()))
              .map((ch) => {
                const isSelected = selectedChapters.includes(ch.name);
                return (
                  <div
                    key={ch.name}
                    onClick={() => toggleChapter(ch.name)}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-purple-500 bg-purple-600/15 text-white ring-1 ring-purple-500/40 shadow-sm'
                        : 'border-white/10 bg-[#161A26]/70 text-slate-300 hover:border-white/20 hover:bg-[#161A26]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? 'border-purple-400 bg-purple-600 text-white'
                            : 'border-white/20 bg-white/5'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-medium truncate" title={ch.name}>
                        {ch.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                        Class {ch.classLevel}
                      </span>
                      <span className="text-[10px] text-purple-300 font-semibold">
                        {ch.count} Qs
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Breakdown Matrix Cards & Steppers */}
      <div className="rounded-2xl border border-white/10 bg-[#11141E] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-white">
              Granular Chapter Breakdown Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Custom question count stepper matrix per question typology.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400">Mandatory Blueprint Target:</span>{' '}
            <strong className="text-sm font-extrabold text-white">{targetTotal} Questions</strong>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                <th className="pb-3 pr-4">Syllabus Chapter</th>
                <th className="pb-3 px-3 text-center">Assertion & Reason</th>
                <th className="pb-3 px-3 text-center">Diagrammatic</th>
                <th className="pb-3 px-3 text-center">Single Correct MCQ</th>
                <th className="pb-3 px-3 text-center">Numerical / Integer</th>
                <th className="pb-3 pl-3 text-right">Chapter Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {selectedChapters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No chapters selected. Please pick at least 1 chapter above to configure matrix.
                  </td>
                </tr>
              ) : (
                selectedChapters.map((chName) => {
                  const row = matrix[chName] || {
                    chapter: chName,
                    classLevel: '11/12',
                    assertionReason: 0,
                    diagrammatic: 0,
                    singleMcq: 0,
                    numerical: 0,
                  };
                  const rowTotal =
                    row.assertionReason + row.diagrammatic + row.singleMcq + row.numerical;

                  return (
                    <tr key={chName} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 pr-4 font-semibold text-slate-200 max-w-xs truncate">
                        {chName}
                      </td>

                      {/* Stepper 1: Assertion & Reason */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161A26] p-1">
                          <button
                            onClick={() => handleStepperChange(chName, 'assertionReason', -1)}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10 text-slate-400"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-white">
                            {row.assertionReason}
                          </span>
                          <button
                            onClick={() => handleStepperChange(chName, 'assertionReason', 1)}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10 text-slate-400"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Stepper 2: Diagrammatic */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161A26] p-1">
                          <button
                            onClick={() => handleStepperChange(chName, 'diagrammatic', -1)}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10 text-slate-400"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-white">
                            {row.diagrammatic}
                          </span>
                          <button
                            onClick={() => handleStepperChange(chName, 'diagrammatic', 1)}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10 text-slate-400"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Stepper 3: Single MCQ */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161A26] p-1">
                          <button
                            onClick={() => handleStepperChange(chName, 'singleMcq', -1)}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10 text-slate-400"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-white">{row.singleMcq}</span>
                          <button
                            onClick={() => handleStepperChange(chName, 'singleMcq', 1)}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10 text-slate-400"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Stepper 4: Numerical */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161A26] p-1">
                          <button
                            onClick={() => handleStepperChange(chName, 'numerical', -1)}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10 text-slate-400"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-white">{row.numerical}</span>
                          <button
                            onClick={() => handleStepperChange(chName, 'numerical', 1)}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10 text-slate-400"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Row Total */}
                      <td className="py-3 pl-3 text-right font-extrabold text-purple-400">
                        {rowTotal} Qs
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Configuration by Question Type Summary Cards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10 pt-4">
          <div className="rounded-xl border border-white/10 bg-[#161A26] p-3 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-300">Assertion & Reasoning</div>
            <div className="text-lg font-extrabold text-white mt-1">{totalAssertion} Qs</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#161A26] p-3 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-300">Diagrammatic / Visual</div>
            <div className="text-lg font-extrabold text-white mt-1">{totalDiagram} Qs</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#161A26] p-3 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-300">Single Correct MCQ</div>
            <div className="text-lg font-extrabold text-white mt-1">{totalMcq} Qs</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#161A26] p-3 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-300">Numerical Specific</div>
            <div
              className={`text-lg font-extrabold mt-1 ${
                examType === 'JEE' && totalNumerical < 5 ? 'text-amber-400' : 'text-white'
              }`}
            >
              {totalNumerical} Qs
            </div>
          </div>
        </div>

        {/* Real-time Budget Bar */}
        <div className="mt-6 rounded-xl border border-white/10 bg-[#161A26] p-4">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <div className="flex items-center gap-2">
              <span className="text-white">Real-Time Budget Tally:</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  isBudgetBalanced
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isBudgetBalanced
                  ? 'Balanced (100% Target Met)'
                  : `${Math.abs(targetTotal - currentTotal)} Qs ${
                      currentTotal < targetTotal ? 'Remaining' : 'Excess'
                    }`}
              </span>
            </div>
            <span className="text-slate-300">
              {currentTotal} / {targetTotal} Questions Distributed
            </span>
          </div>

          {/* Progress track */}
          <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isBudgetBalanced
                  ? 'bg-emerald-500'
                  : currentTotal > targetTotal
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, (currentTotal / targetTotal) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#11141E] px-5 py-3 text-xs font-bold text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Blueprint</span>
        </button>

        <button
          onClick={handleValidateAndGenerate}
          disabled={!isBudgetBalanced || isGenerating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 px-7 py-3 text-xs font-extrabold text-white shadow-xl shadow-purple-500/30 hover:opacity-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="h-4 w-4" />
          <span>
            {isGenerating
              ? 'Compiling Exam Architecture...'
              : `Generate ${examType} Examination Paper`}
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
