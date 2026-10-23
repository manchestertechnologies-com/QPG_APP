import React from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, Flame, BookCheck } from 'lucide-react';

export type ExamType = 'NEET' | 'JEE';

interface ChooseExamStepProps {
  selectedExam: ExamType;
  onSelectExam: (exam: ExamType) => void;
  onProceed: () => void;
  userSubject: string;
}

export const ChooseExamStep: React.FC<ChooseExamStepProps> = ({
  selectedExam,
  onSelectExam,
  onProceed,
  userSubject,
}) => {
  const blueprints = [
    {
      id: 'NEET' as ExamType,
      title: 'NEET-UG',
      category: 'Medical Entrance',
      patternTag: 'Official NTA Pattern',
      tagColor: 'emerald',
      subjects: '4 Subjects (Physics, Chemistry, Botany, Zoology)',
      subjectScope: `Subject: ${userSubject}`,
      sectionA: 'Direct 45 Compulsory Questions',
      sectionB: 'Continuous Flow (No Sections)',
      totalQuestions: '45 Questions per Subject',
      totalMarks: '180 Marks per Subject',
      marking: '+4 Correct • -1 Incorrect • 0 Unattempted',
      duration: '50 Minutes per Subject',
      icon: Flame,
    },
    {
      id: 'JEE' as ExamType,
      title: 'JEE MAIN',
      category: 'Engineering Entrance',
      patternTag: 'Official NTA Pattern',
      tagColor: 'cyan',
      subjects: '3 Subjects (Physics, Chemistry, Mathematics)',
      subjectScope: `Subject: ${userSubject}`,
      sectionA: '20 MCQs (Section A)',
      sectionB: '5 Numerical Questions (Section B)',
      totalQuestions: '25 Questions per Subject',
      totalMarks: '100 Marks per Subject',
      marking: '+4 Correct • -1 Incorrect • 0 Unattempted',
      duration: '60 Minutes per Subject',
      icon: BookCheck,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#C8A96A] uppercase tracking-wider font-heading">
          <span>Step 1 of 5 • Examination Scope & Blueprint</span>
        </div>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
          Choose Exam Blueprint
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Select an exam blueprint to configure question allocation and compile your paper.
        </p>
      </div>

      {/* 2 Blueprint Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {blueprints.map((bp) => {
          const isSelected = selectedExam === bp.id;
          const Icon = bp.icon;

          return (
            <div
              key={bp.id}
              onClick={() => onSelectExam(bp.id)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-6 transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'bg-[#141414] border-[#C8A96A] shadow-2xl shadow-[#C8A96A]/15 ring-1 ring-[#C8A96A]/50'
                  : 'bg-[#141414]/70 border-white/5 hover:border-[#C8A96A]/30 hover:bg-[#141414]'
              }`}
            >
              {/* Header section */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                    {bp.category}
                  </span>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? 'border-[#C8A96A] bg-[#C8A96A] text-[#0D0D0D]'
                        : 'border-white/20 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                      isSelected
                        ? 'border-[#C8A96A]/30 bg-[#C8A96A]/15 text-[#C8A96A]'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight text-white font-heading">
                      {bp.title}
                    </h3>
                    <div className="text-[11px] font-bold text-[#C8A96A]">
                      {bp.patternTag}
                    </div>
                  </div>
                </div>

                {/* Blueprint Breakdown Specifications */}
                <div className="mt-6 space-y-3 border-t border-white/5 pt-4 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Section A Structure
                    </span>
                    <span className="font-semibold text-slate-200">{bp.sectionA}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Section B Structure
                    </span>
                    <span className="font-semibold text-slate-200">{bp.sectionB}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Scoring & Marking Scheme
                    </span>
                    <span className="font-semibold text-slate-200">{bp.marking}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Exam Volume & Duration
                    </span>
                    <span className="font-semibold text-slate-200">
                      {bp.totalQuestions} • {bp.duration}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectExam(bp.id);
                    onProceed();
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'glow-button text-[#0D0D0D]'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>Select & View Chapters</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Step Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#141414] p-5 shadow-xl">
        <div>
          <div className="text-sm font-bold text-white font-heading">
            19 Chemistry Chapters Available (Class 11 & Class 12)
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Target Exam: <strong className="text-[#C8A96A]">{selectedExam}</strong> • Ready to select chapters and question counts.
          </div>
        </div>
        <button
          onClick={onProceed}
          className="glow-button flex items-center justify-center gap-2 px-5 sm:px-6 py-3 text-xs font-bold text-[#0D0D0D] cursor-pointer whitespace-nowrap"
        >
          <span className="hidden sm:inline">Continue to Question Allocation (Step 2)</span>
          <span className="sm:hidden">Continue to Step 2</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
