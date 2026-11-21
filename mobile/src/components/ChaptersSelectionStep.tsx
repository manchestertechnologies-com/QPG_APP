import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers,
  Filter,
} from 'lucide-react';
import { ExamType } from './ChooseExamStep';
import { api } from '../services/apiClient';

interface ChaptersSelectionStepProps {
  selectedExam: ExamType;
  targetQuestions: number;
  selectedChapters: string[];
  onSelectChapters: (chapters: string[]) => void;
  userSubject: string;
  onBack: () => void;
  onProceed: () => void;
}

export const ChaptersSelectionStep: React.FC<ChaptersSelectionStepProps> = ({
  selectedExam,
  targetQuestions,
  selectedChapters,
  onSelectChapters,
  userSubject,
  onBack,
  onProceed,
}) => {
  const [classFilter, setClassFilter] = useState<'both' | '11' | '12'>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [chaptersList, setChaptersList] = useState<
    { name: string; count: number; class_level: string }[]
  >([]);

  // Load chapters from API / default bank
  useEffect(() => {
    let mounted = true;
    const fetchChapters = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await api.getChapters(classFilter);
        if (mounted && res && res.chapters) {
          const list = res.chapters.map((c: any) => ({
            name: c.name,
            count: c.total_questions || c.count || 1400,
            class_level: c.class_level || c.classLevel || '11',
          }));
          setChaptersList(list);

          // Keep only chapters that exist in this teacher's subject; if none, pre-select the first 4
          const names = new Set(list.map((c: any) => c.name));
          const valid = selectedChapters.filter((c) => names.has(c));
          if (valid.length === 0 && list.length > 0) {
            onSelectChapters(list.slice(0, 4).map((c: any) => c.name));
          } else if (valid.length !== selectedChapters.length) {
            onSelectChapters(valid);
          }
          if (res.offline && list.length === 0) setLoadError(true);
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

  const examDisplayTitle =
    selectedExam === 'JEE'
      ? 'JEE Main'
      : selectedExam === 'ASSIGNMENT'
      ? 'Assignment / DPP'
      : selectedExam;

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Step Header with Back Button & Context Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-field hover:bg-ink/[0.06] px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-ink hover:border-gold/40 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Return to Exam Blueprint Selection"
            >
              <ArrowLeft className="h-4 w-4 text-gold" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-gold uppercase tracking-wider font-heading">
              <span>Step 2 • Syllabus & Chapter Selection</span>
            </div>
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-ink font-heading">
            Select Examination Chapters
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            Choose chapters from {userSubject} syllabus for your {examDisplayTitle} paper.
          </p>
        </div>

        {/* Exam Blueprint Context Pill with Change Exam Trigger */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-card px-3.5 py-2 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Exam Blueprint
            </span>
            <span className="text-xs font-black text-gold font-heading">
              {examDisplayTitle} ({targetQuestions} Qs)
            </span>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="ml-2 rounded-xl border border-line bg-field hover:bg-ink/[0.06] px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-ink transition-all cursor-pointer whitespace-nowrap"
          >
            ← Change Exam
          </button>
        </div>
      </div>

      {/* Chapters Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Class Filter Tabs */}
          <div className="flex items-center rounded-xl bg-card p-1 border border-line">
            <button
              type="button"
              onClick={() => setClassFilter('both')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                classFilter === 'both'
                  ? 'bg-ink text-gold-soft font-bold shadow'
                  : 'text-slate-500 hover:text-ink'
              }`}
            >
              All Classes (11 & 12)
            </button>
            <button
              type="button"
              onClick={() => setClassFilter('11')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                classFilter === '11'
                  ? 'bg-ink text-gold-soft font-bold shadow'
                  : 'text-slate-500 hover:text-ink'
              }`}
            >
              Class 11
            </button>
            <button
              type="button"
              onClick={() => setClassFilter('12')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                classFilter === '12'
                  ? 'bg-ink text-gold-soft font-bold shadow'
                  : 'text-slate-500 hover:text-ink'
              }`}
            >
              Class 12
            </button>
          </div>

          {/* Search Box & Quick Selection */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-line bg-card pl-9 pr-3 py-1.5 text-xs text-ink placeholder-slate-400 focus:border-gold focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-ink hover:border-gold/40 transition-all cursor-pointer whitespace-nowrap"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-xl border border-line bg-card px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-500/30 transition-all cursor-pointer whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Counter and Quota Guidance */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong className="text-ink">{filteredChapters.length}</strong> chapters •{' '}
            <strong className="text-gold">{selectedChapters.length}</strong> selected
          </span>
          <span>
            Target quota:{' '}
            <strong className="text-ink">{targetQuestions} questions</strong> for{' '}
            {examDisplayTitle}
          </span>
        </div>

        {isLoading && chaptersList.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-500">Loading {userSubject} chapters from your question bank…</div>
        )}
        {loadError && !isLoading && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-rose-800">
            Could not load your {userSubject} chapters. Check your connection and go back / forward to retry.
          </div>
        )}

        {/* Chapters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredChapters.map((ch) => {
            const isSelected = selectedChapters.includes(ch.name);
            return (
              <div
                key={ch.name}
                role="button"
                tabIndex={0}
                onClick={() => toggleChapter(ch.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleChapter(ch.name);
                  }
                }}
                className={`relative flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                  isSelected
                    ? 'border-gold bg-card shadow-md shadow-gold/10 ring-1 ring-gold/40'
                    : 'border-line bg-card/70 hover:border-line-strong hover:bg-card'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                    isSelected
                      ? 'border-gold bg-gold-btn text-ink'
                      : 'border-line-strong bg-ink/[0.04]'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="rounded bg-ink/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                      Class {ch.class_level}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ~{ch.count.toLocaleString()} Qs
                    </span>
                  </div>
                  <h3
                    className={`text-xs font-bold leading-snug line-clamp-2 ${
                      isSelected ? 'text-ink' : 'text-slate-600'
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
      <div className="sticky bottom-0 z-30 flex items-center justify-between rounded-2xl border border-line bg-paper/95 p-4 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-line bg-field px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-ink hover:border-line-strong transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Exam Selection</span>
        </button>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/30 text-gold">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-ink font-heading">
              {selectedChapters.length} Chapters Selected
            </div>
            <div className="text-[11px] text-slate-500">
              Exam: <strong className="text-ink">{examDisplayTitle}</strong> • Target: {targetQuestions} Questions
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onProceed}
          disabled={selectedChapters.length === 0}
          className="glow-button flex items-center gap-2 px-5 py-3 text-xs font-black text-ink transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          <span>Next: Concept Selection</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
