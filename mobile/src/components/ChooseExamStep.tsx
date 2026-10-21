import React from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, Flame, BookCheck, GraduationCap } from 'lucide-react';

export type ExamType = 'NEET' | 'JEE' | 'KCET';

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
      sectionA: '35 Questions (Section A)',
      sectionB: '10 Questions (Section B)',
      totalQuestions: '180 Questions (45 per Subject)',
      totalMarks: '720 Marks (180 per Subject)',
      marking: '+4 Correct • -1 Incorrect • 0 Unattempted',
      duration: '3 Hours 20 Mins',
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
      totalQuestions: '75 Questions (25 per Subject)',
      totalMarks: '300 Marks (100 per Subject)',
      marking: '+4 Correct • -1 Incorrect • 0 Unattempted',
      duration: '3 Hours',
      icon: BookCheck,
    },
    {
      id: 'KCET' as ExamType,
      title: 'KCET',
      category: 'State Common Entrance',
      patternTag: 'State Board Pattern',
      tagColor: 'amber',
      subjects: 'Single Subject Paper',
      subjectScope: `Subject: ${userSubject}`,
      sectionA: '60 Single-Choice MCQs',
      sectionB: 'Single Section',
      totalQuestions: '60 Questions',
      totalMarks: '60 Marks',
      marking: '+1 Correct • 0 Negative Marking',
      duration: '80 Minutes',
      icon: GraduationCap,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
          <span>Step 1 of 5 • Examination Scope & Blueprint</span>
        </div>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Choose Exam Blueprint
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Select an exam blueprint to configure question allocation and compile your paper.
        </p>
      </div>

      {/* 3 Blueprint Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {blueprints.map((bp) => {
          const isSelected = selectedExam === bp.id;
          const Icon = bp.icon;

          return (
            <div
              key={bp.id}
              onClick={() => onSelectExam(bp.id)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-[#161A26] to-[#11141E] border-purple-500 shadow-2xl shadow-purple-500/20 glow-purple ring-1 ring-purple-500/50'
                  : 'bg-[#11141E] border-white/10 hover:border-white/20 hover:bg-[#161A26]'
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
                        ? 'border-purple-500 bg-purple-600 text-white'
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
                        ? 'border-purple-500/30 bg-purple-500/20 text-purple-300'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold tracking-tight text-white">
                      {bp.title}
                    </h3>
                    <div className="text-[11px] font-bold text-emerald-400">
                      {bp.patternTag}
                    </div>
                  </div>
                </div>

                {/* Blueprint Breakdown Specifications */}
                <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-300">
                      Section A Structure
                    </span>
                    <span className="font-semibold text-slate-200">{bp.sectionA}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-300">
                      Section B Structure
                    </span>
                    <span className="font-semibold text-slate-200">{bp.sectionB}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-300">
                      Scoring & Marking Scheme
                    </span>
                    <span className="font-semibold text-slate-200">{bp.marking}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-300">
                      Exam Volume & Duration
                    </span>
                    <span className="font-semibold text-slate-200">
                      {bp.totalQuestions} • {bp.duration}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectExam(bp.id);
                    onProceed();
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25'
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#11141E] p-5 shadow-xl">
        <div>
          <div className="text-sm font-bold text-white">
            19 Chemistry Chapters Available (Class 11 & Class 12)
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Target Exam: <strong className="text-purple-400">{selectedExam}</strong> • Ready to select chapters and question counts.
          </div>
        </div>
        <button
          onClick={onProceed}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <span>Continue to Question Allocation (Step 2)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
