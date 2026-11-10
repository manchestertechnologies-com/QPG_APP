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
}

export const ChaptersSelectionStep: React.FC<ChaptersSelectionStepProps> = ({
  selectedExam,
  onSelectExam,
  selectedChapters,
  onSelectChapters,
  userSubject,
  onProceed,
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
          pattern: '20 MCQs + 5 Numerical Questions • +4, -1',
          icon: BookCheck,
          color: '#06B6D4',
        };
      case 'KCET':
      default:
        return {
          title: 'KCET Blueprint',
          targetQs: 60,
          marks: 60,
          time: '80 Mins',
          pattern: 'Direct 60 Compulsory MCQs • +1, 0',
          icon: GraduationCap,
          color: '#F59E0B',
        };
    }
  }, [selectedExam]);

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
          <span>Step 1 of 5 • Syllabus & Chapters Selection</span>
        </div>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
          Select Examination Chapters
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Choose your exam blueprint and select syllabus chapters for {userSubject}.
        </p>
      </div>

      {/* Exam Blueprint Selector Tabs */}
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base text-[#C8A96A]">🏛️</span>
            <span className="text-xs font-bold uppercase tracking-wider text-white font-heading">
              Target Exam Pattern & Blueprint
            </span>
          </div>
          <span className="text-[11px] font-semibold text-[#C8A96A]">
            Quota: {examMeta.targetQs} Questions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['NEET', 'JEE', 'KCET'] as ExamType[]).map((exam) => {
            const isSelected = selectedExam === exam;
            const Icon = exam === 'NEET' ? Flame : exam === 'JEE' ? BookCheck : GraduationCap;
            const qCount = exam === 'NEET' ? '45 Qs' : exam === 'JEE' ? '25 Qs' : '60 Qs';
            const marks = exam === 'NEET' ? '180 Marks' : exam === 'JEE' ? '100 Marks' : '60 Marks';
            const duration = exam === 'NEET' ? '50 Mins' : exam === 'JEE' ? '60 Mins' : '80 Mins';

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
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isSelected
                        ? 'bg-[#C8A96A] text-[#0D0D0D]'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase font-heading flex items-center gap-1.5">
                      <span>{exam === 'JEE' ? 'JEE Main' : exam}</span>
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
      </div>

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

        {/* Search Input & Selection Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#141414] pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-[11px] font-semibold text-slate-300 hover:border-[#C8A96A]/40 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-xl border border-white/10 bg-[#141414] px-3 py-2 text-[11px] font-semibold text-slate-400 hover:border-red-500/40 hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {filteredChapters.length} chapters •{' '}
            <strong className="text-[#C8A96A]">{selectedChapters.length}</strong> selected
          </span>
          <span className="text-[11px] text-slate-500">
            Target quota: {examMeta.targetQs} questions for {selectedExam}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
              Exam: <strong className="text-white">{selectedExam}</strong> • Target: {examMeta.targetQs} Questions
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onProceed}
          disabled={selectedChapters.length === 0}
          className="glow-button flex items-center gap-2 px-5 py-3 text-xs font-black text-[#0D0D0D] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Next: Concept Selection</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
