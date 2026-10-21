import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Layers, CheckCircle2 } from 'lucide-react';
import { KaTeXRenderer } from './KaTeXRenderer';
import { api, StoredUser } from '../services/apiClient';

interface QuestionBankViewProps {
  user: StoredUser | null;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({ user }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCatalogStats();
      if (res && res.grandTotalQuestionsInBank) {
        setTotalCount(res.grandTotalQuestionsInBank);
      }
      let loadedQuestions: any[] = [];
      try {
        const qRes = await fetch(
          `/api/questions?limit=25&difficulty=${selectedDifficulty === 'all' ? '' : selectedDifficulty}&qType=${selectedType === 'all' ? '' : selectedType}&search=${encodeURIComponent(search)}`,
          {
            headers: {
              Authorization: `Bearer ${api.getToken() || ''}`,
            },
          }
        ).then((r) => r.json());

        if (qRes && qRes.questions && qRes.questions.length > 0) {
          loadedQuestions = qRes.questions;
        }
      } catch (err) {
        console.warn('Backend question query failed, loading from local repository fallback');
      }

      if (loadedQuestions.length === 0) {
        const altRes = await api.getAlternatives('', '');
        if (altRes && altRes.alternatives) {
          loadedQuestions = altRes.alternatives;
        }
      }
      setQuestions(loadedQuestions);
    } catch (e) {
      console.warn('Error fetching question bank:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedDifficulty, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
          <span>89,202+ VERIFIED REPOSITORY</span>
        </div>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Question Bank Explorer
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">
          Search and inspect questions with LaTeX mathematical equations, chemical formulas, and answer keys.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#11141E] p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords, formulas, or concepts..."
            className="w-full rounded-xl border border-white/10 bg-[#161A26] pl-10 pr-4 py-2 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none placeholder:text-slate-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-[#161A26] px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#161A26] px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="mcq_single">Single Choice</option>
            <option value="assertion_reason">Assertion & Reason</option>
            <option value="numerical">Numerical Value</option>
          </select>
        </div>
      </div>

      {/* Questions Feed */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading question repository...</div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="rounded-2xl border border-white/10 bg-[#11141E] p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-extrabold text-purple-300">
                    {q.chapter || 'Chapter'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{q.difficulty || 'Medium'}</span>
                </div>
                <span className="text-[10px] text-slate-300 uppercase font-mono">ID: {q.id}</span>
              </div>

              <div className="text-xs text-slate-200 font-medium leading-relaxed">
                <KaTeXRenderer content={q.question} />
              </div>

              {q.opt_a && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#161A26] p-3 rounded-xl border border-white/5 text-xs text-slate-300">
                  <div>
                    <strong>(A)</strong> <KaTeXRenderer content={q.opt_a} className="inline" />
                  </div>
                  <div>
                    <strong>(B)</strong> <KaTeXRenderer content={q.opt_b || ''} className="inline" />
                  </div>
                  <div>
                    <strong>(C)</strong> <KaTeXRenderer content={q.opt_c || ''} className="inline" />
                  </div>
                  <div>
                    <strong>(D)</strong> <KaTeXRenderer content={q.opt_d || ''} className="inline" />
                  </div>
                </div>
              )}

              {q.correct_option && (
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>
                    Correct Answer: <strong className="text-emerald-400">{q.correct_option}</strong>
                  </span>
                  {q.num_answer && <span>Numeric Value: {q.num_answer}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
