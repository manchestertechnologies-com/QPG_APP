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
      patternTag: 'POST-COVID REVISED PATTERN',
      tagColor: 'emerald',
      subjects: '4 Subjects (Physics, Chemistry, Botany, Zoology)',
      subjectScope: `Current Blueprint: 1 Subject (${userSubject})`,
      sectionA: '35 Questions Mandatory',
      sectionB: '10 Questions Mandatory (No optional choice)',
      totalQuestions: '180 Questions (45 Qs per Subject)',
      totalMarks: '720 Marks (180 Marks per Subject)',
      marking: '+4 Correct • -1 Incorrect • 0 Unattempted',
      duration: '3 Hours 20 Mins (50 Mins per Subject)',
      icon: Flame,
    },
    {
      id: 'JEE' as ExamType,
      title: 'JEE MAIN',
      category: 'Engineering Entrance',
      patternTag: 'REVISED NTA BLUEPRINT',
      tagColor: 'cyan',
      subjects: '3 Subjects (Physics, Chemistry, Mathematics)',
      subjectScope: `Current Blueprint: 1 Subject (${userSubject})`,
      sectionA: '20 MCQs Mandatory (Single Option)',
      sectionB: '5 Numerical / Integer Questions (Strictly Enforced)',
      totalQuestions: '75 Questions (25 Qs per Subject)',
      totalMarks: '300 Marks (100 Marks per Subject)',
      marking: '+4 Correct • -1 Incorrect • 0 Unattempted',
      duration: '3 Hours (60 Mins per Subject)',
      icon: BookCheck,
    },
    {
      id: 'KCET' as ExamType,
      title: 'KCET',
      category: 'State Common Entrance',
      patternTag: 'STATE CET STANDARD',
      tagColor: 'amber',
      subjects: 'Pure Single-Subject Paper (Physics, Chemistry, Math/Bio)',
      subjectScope: `Current Blueprint: 1 Subject (${userSubject})`,
      sectionA: '60 Objective Single-Choice MCQs (Compulsory)',
      sectionB: 'No Section B / Single Continuous Section',
      totalQuestions: '60 Questions per Subject Paper',
      totalMarks: '60 Marks (1 Mark each)',
      marking: '+1 Correct • 0 Negative Marking',
      duration: '80 Minutes per Paper',
      icon: GraduationCap,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
          <span>01 // EXAM PATTERN & BLUEPRINT ENGINE</span>
        </div>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Select Target Examination Pattern
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Strict pattern schemas enforced with auto-budget calculation and post-COVID compliance.
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
                  className={`w-full py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {isSelected ? 'Selected [Active]' : 'Select Blueprint'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Step Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#11141E] p-5">
        <div>
          <div className="text-sm font-bold text-white">
            Ready to distribute questions across syllabus chapters?
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Configuring <strong className="text-purple-400">{selectedExam}</strong> blueprint for{' '}
            <strong className="text-white">{userSubject}</strong>.
          </div>
        </div>
        <button
          onClick={onProceed}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-extrabold text-white shadow-xl shadow-purple-500/30 hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer"
        >
          <span>Continue to Syllabus Matrix</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
