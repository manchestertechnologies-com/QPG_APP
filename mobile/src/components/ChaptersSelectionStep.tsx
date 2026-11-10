import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  Flame,
  BookCheck,
  GraduationCap,
  Layers,
  Filter,
  FileQuestion,
} from 'lucide-react';
import { ExamType } from './ChooseExamStep';
import { api } from '../services/apiClient';

interface ChaptersSelectionStepProps {
  selectedExam: ExamType;
  onSelectExam: (exam: ExamType) => void;
  selectedChapters: string[];
  onSelectChapters: (chapters: string[]) => void;
  userSubject: string;
  onProceed: () => void;
  assignmentQuestions?: number;
  onUpdateAssignmentQuestions?: (count: number) => void;
}

export const ChaptersSelectionStep: React.FC<ChaptersSelectionStepProps> = ({
  selectedExam,
  onSelectExam,
  selectedChapters,
  onSelectChapters,
  userSubject,
  onProceed,
  assignmentQuestions = 30,
  onUpdateAssignmentQuestions,
}) => {
  const [classFilter, setClassFilter] = useState<'both' | '11' | '12'>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chaptersList, setChaptersList] = useState<
    { name: string; count: number; class_level: string }[]
  >([]);

  // Blueprint metadata
  const examMeta = useMemo(() => {
    switch (selectedExam) {
      case 'NEET':
        return {
          title: 'NEET-UG Blueprint',
          targetQs: 45,
          marks: 180,
          time: '50 Mins',
          pattern: 'Direct 45 Compulsory Questions • +4, -1',
          icon: Flame,
          color: '#10B981',
        };
      case 'JEE':
        return {
          title: 'JEE MAIN Blueprint',
          targetQs: 25,
          marks: 100,
          time: '60 Mins',
          pattern: '20 MCQs (Sec A) + 5 Numericals (Sec B) • +4, -1',
          icon: BookCheck,
          color: '#06B6D4',
        };
      case 'ASSIGNMENT':
        return {
          title: 'Custom Assignment / DPP',
          targetQs: assignmentQuestions,
          marks: assignmentQuestions * 4,
          time: `${Math.round(assignmentQuestions * 1.3)} Mins`,
          pattern: 'Flexible Custom Question Quota • Custom Syllabus',
          icon: FileQuestion,
          color: '#C8A96A',
        };
      case 'KCET':
      default:
        return {
          title: 'KCET / CET Blueprint',
          targetQs: 60,
          marks: 60,
          time: '80 Mins',
          pattern: 'Direct 60 Compulsory MCQs • +1, 0',
          icon: GraduationCap,
          color: '#F59E0B',
        };
    }
  }, [selectedExam, assignmentQuestions]);

  // Load chapters from API / default bank
  useEffect(() => {
    let mounted = true;
    const fetchChapters = async () => {
      setIsLoading(true);
      try {
        const res = await api.getChapters(classFilter);
        if (mounted && res && res.chapters) {
          const list = res.chapters.map((c: any) => ({
            name: c.name,
            count: c.total_questions || c.count || 1400,
            class_level: c.class_level || c.classLevel || '11',
          }));
          setChaptersList(list);

          // If no chapters selected yet, select first 4
          if (selectedChapters.length === 0 && list.length > 0) {
            onSelectChapters(list.slice(0, 4).map((c: any) => c.name));
          }
        }
      } catch (err) {
        console.warn('Failed loading chapters:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchChapters();
    return () => {
      mounted = false;
    };
  }, [classFilter]);

  // Filtered chapters by search query
  const filteredChapters = useMemo(() => {
    return chaptersList.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [chaptersList, searchQuery]);

  const toggleChapter = (name: string) => {
    if (selectedChapters.includes(name)) {
      onSelectChapters(selectedChapters.filter((c) => c !== name));
    } else {
      onSelectChapters([...selectedChapters, name]);
    }
  };

  const handleSelectAll = () => {
    const allNames = filteredChapters.map((c) => c.name);
    const combined = Array.from(new Set([...selectedChapters, ...allNames]));
    onSelectChapters(combined);
  };

  const handleClearAll = () => {
    onSelectChapters([]);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#C8A96A] uppercase tracking-wider font-heading">
          <span>Step 1 • Syllabus & Blueprint Selection</span>
        </div>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
          Select Examination Pattern & Chapters
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Choose your exam blueprint or create a custom Assignment, then select chapters for {userSubject}.
        </p>
      </div>

      {/* Exam Blueprint Selector Tabs */}
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base text-[#C8A96A]">🏛️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-white font-heading">
              TARGET EXAM PATTERN & BLUEPRINT
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#C8A96A] bg-[#C8A96A]/10 px-2.5 py-0.5 rounded-full border border-[#C8A96A]/20">
            Quota: {examMeta.targetQs} Questions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['NEET', 'JEE', 'KCET', 'ASSIGNMENT'] as ExamType[]).map((exam) => {
            const isSelected = selectedExam === exam;
            const Icon =
              exam === 'NEET'
                ? Flame
                : exam === 'JEE'
                ? BookCheck
                : exam === 'KCET'
                ? GraduationCap
                : FileQuestion;

            const title =
              exam === 'NEET'
                ? 'NEET'
                : exam === 'JEE'
                ? 'JEE MAIN'
                : exam === 'KCET'
                ? 'KCET'
                : 'ASSIGNMENT';

            const qCount =
              exam === 'NEET'
                ? '45 Qs'
                : exam === 'JEE'
                ? '25 Qs'
                : exam === 'KCET'
                ? '60 Qs'
                : `${assignmentQuestions} Qs`;

            const marks =
              exam === 'NEET'
                ? '180 Marks'
                : exam === 'JEE'
                ? '100 Marks'
                : exam === 'KCET'
                ? '60 Marks'
                : `${assignmentQuestions * 4} Marks`;

            const duration =
              exam === 'NEET'
                ? '50 Mins'
                : exam === 'JEE'
                ? '60 Mins'
                : exam === 'KCET'
                ? '80 Mins'
                : 'Custom Time';

            return (
              <button
                key={exam}
                type="button"
                onClick={() => onSelectExam(exam)}
                className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#C8A96A] bg-[#C8A96A]/10 shadow-lg shadow-[#C8A96A]/10 ring-1 ring-[#C8A96A]'
                    : 'border-white/5 bg-[#1A1A1A] hover:border-white/20 hover:bg-[#202020]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isSelected
                        ? 'bg-[#C8A96A] text-[#0D0D0D]'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase font-heading flex items-center gap-1.5">
                      <span>{title}</span>
                      {isSelected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A96A]" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {qCount} • {marks}
                    </div>
                    <div className="text-[10px] text-[#C8A96A]/90 font-medium mt-0.5">
                      {duration}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Assignment Question Count Adjuster */}
        {selectedExam === 'ASSIGNMENT' && (
          <div className="rounded-xl bg-[#1A1A1A] p-3.5 border border-[#C8A96A]/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-[#C8A96A]" />
              <div>
                <span className="text-xs font-bold text-white font-heading">
                  Assignment Target Questions:
                </span>
                <p className="text-[10px] text-slate-400">
                  Generate as many questions as you need for homework, class test, or DPP.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateAssignmentQuestions?.(Math.max(5, (assignmentQuestions || 30) - 5))
                }
                className="h-8 w-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 flex items-center justify-center cursor-pointer text-sm"
              >
                -
              </button>
              <input
                type="number"
                min={5}
                max={150}
                value={assignmentQuestions || 30}
                onChange={(e) =>
                  onUpdateAssignmentQuestions?.(
                    Math.max(5, Math.min(150, parseInt(e.target.value) || 30))
                  )
                }
                className="w-16 h-8 text-center bg-[#0D0D0D] border border-white/20 rounded-lg text-white font-bold text-xs focus:border-[#C8A96A] outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  onUpdateAssignmentQuestions?.(Math.min(150, (assignmentQuestions || 30) + 5))
                }
                className="h-8 w-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 flex items-center justify-center cursor-pointer text-sm"
              >
                +
              </button>
              <span className="text-xs text-slate-300 font-bold">Questions</span>
            </div>
          </div>
        )}
      </div>

      {/* Chapters Section (Expands/Opens for the selected exam pattern) */}
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Class Filter Tabs */}
          <div className="flex items-center rounded-xl bg-[#141414] p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setClassFilter('both')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                classFilter === 'both'
                  ? 'bg-[#C8A96A] text-[#0D0D0D] font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Classes (11 & 12)
            </button>
            <button
              type="button"
              onClick={() => setClassFilter('11')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                classFilter === '11'
                  ? 'bg-[#C8A96A] text-[#0D0D0D] font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Class 11
            </button>
            <button
              type="button"
              onClick={() => setClassFilter('12')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                classFilter === '12'
                  ? 'bg-[#C8A96A] text-[#0D0D0D] font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Class 12
            </button>
          </div>

          {/* Search Box & Quick Selection */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141414] pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded-xl border border-white/10 bg-[#141414] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-[#C8A96A]/40 transition-all cursor-pointer whitespace-nowrap"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-xl border border-white/10 bg-[#141414] px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Counter and Quota Guidance */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing <strong className="text-white">{filteredChapters.length}</strong> chapters •{' '}
            <strong className="text-[#C8A96A]">{selectedChapters.length}</strong> selected
          </span>
          <span>
            Target quota:{' '}
            <strong className="text-white">
              {examMeta.targetQs} questions
            </strong>{' '}
            for {selectedExam === 'JEE' ? 'JEE Main' : selectedExam}
          </span>
        </div>

        {/* Chapters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredChapters.map((ch) => {
            const isSelected = selectedChapters.includes(ch.name);
            return (
              <div
                key={ch.name}
                onClick={() => toggleChapter(ch.name)}
                className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#C8A96A] bg-[#141414] shadow-md shadow-[#C8A96A]/10 ring-1 ring-[#C8A96A]/40'
                    : 'border-white/5 bg-[#141414]/70 hover:border-white/20 hover:bg-[#141414]'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                    isSelected
                      ? 'border-[#C8A96A] bg-[#C8A96A] text-[#0D0D0D]'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                      Class {ch.class_level}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ~{ch.count.toLocaleString()} Qs
                    </span>
                  </div>
                  <h3
                    className={`text-xs font-bold leading-snug line-clamp-2 ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {ch.name}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 z-30 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0D0D0D]/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 text-[#C8A96A]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white font-heading">
              {selectedChapters.length} Chapters Selected
            </div>
            <div className="text-[11px] text-slate-400">
              Exam: <strong className="text-white">{selectedExam === 'JEE' ? 'JEE Main' : selectedExam}</strong> • Target: {examMeta.targetQs} Questions
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onProceed}
          disabled={selectedChapters.length === 0}
          className="glow-button flex items-center gap-2 px-5 py-3 text-xs font-black text-[#0D0D0D] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          <span>Next: Concept Selection</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
