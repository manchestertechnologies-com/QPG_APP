import React from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Flame,
  BookCheck,
  GraduationCap,
  FileQuestion,
  Sparkles,
  Layers,
} from 'lucide-react';

export type ExamType = 'NEET' | 'JEE' | 'KCET' | 'ASSIGNMENT';

interface ChooseExamStepProps {
  selectedExam: ExamType;
  onSelectExam: (exam: ExamType) => void;
  onProceed: () => void;
  userSubject: string;
  assignmentQuestions?: number;
  onUpdateAssignmentQuestions?: (count: number) => void;
}

export const ChooseExamStep: React.FC<ChooseExamStepProps> = ({
  selectedExam,
  onSelectExam,
  onProceed,
  userSubject,
  assignmentQuestions = 30,
  onUpdateAssignmentQuestions,
}) => {
  const blueprints = [
    {
      id: 'NEET' as ExamType,
      title: 'NEET-UG',
      category: 'Medical Entrance',
      patternTag: 'Official NTA Pattern',
      tagColor: '#10B981',
      subjectScope: `Subject: ${userSubject}`,
      sectionA: 'Direct 45 Compulsory Questions',
      sectionB: 'Continuous Flow (No Sections)',
      totalQuestions: '45 Questions',
      totalMarks: '180 Marks',
      marking: '+4 Correct • -1 Incorrect',
      duration: '50 Minutes',
      icon: Flame,
    },
    {
      id: 'JEE' as ExamType,
      title: 'JEE MAIN',
      category: 'Engineering Entrance',
      patternTag: 'Official NTA Pattern',
      tagColor: '#06B6D4',
      subjectScope: `Subject: ${userSubject}`,
      sectionA: '20 MCQs (Section A)',
      sectionB: '5 Numericals (Section B)',
      totalQuestions: '25 Questions',
      totalMarks: '100 Marks',
      marking: '+4 Correct • -1 Incorrect',
      duration: '60 Minutes',
      icon: BookCheck,
    },
    {
      id: 'KCET' as ExamType,
      title: 'KCET',
      category: 'State Common Entrance',
      patternTag: 'Official KEA Pattern',
      tagColor: '#F59E0B',
      subjectScope: `Subject: ${userSubject}`,
      sectionA: 'Direct 60 Compulsory MCQs',
      sectionB: 'Continuous Flow (No Sections)',
      totalQuestions: '60 Questions',
      totalMarks: '60 Marks',
      marking: '+1 Correct • 0 Negative',
      duration: '80 Minutes',
      icon: GraduationCap,
    },
    {
      id: 'ASSIGNMENT' as ExamType,
      title: 'Assignment / DPP',
      category: 'Practice & Homework',
      patternTag: 'Custom Teacher Quota',
      tagColor: '#b8862b',
      subjectScope: `Subject: ${userSubject}`,
      sectionA: 'Custom Question Distribution',
      sectionB: 'Flexible Section Layout',
      totalQuestions: `${assignmentQuestions} Questions`,
      totalMarks: `${assignmentQuestions * 4} Marks`,
      marking: '+4 Correct • -1 Incorrect',
      duration: `${Math.round(assignmentQuestions * 1.3)} Minutes`,
      icon: FileQuestion,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Clean Step Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gold uppercase tracking-wider font-heading">
          <Sparkles className="h-4 w-4" />
          <span>Step 1 • Examination Scope & Blueprint</span>
        </div>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-ink font-heading">
          Choose Examination Blueprint
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Select your target examination pattern to configure question allocation and syllabus chapters for {userSubject}.
        </p>
      </div>

      {/* 4 Clean Blueprint Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {blueprints.map((bp) => {
          const isSelected = selectedExam === bp.id;
          const Icon = bp.icon;

          return (
            <div
              key={bp.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectExam(bp.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectExam(bp.id);
                }
              }}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-300 cursor-pointer select-none active:scale-[0.99] ${
                isSelected
                  ? 'bg-card border-gold shadow-xl shadow-gold/10 ring-1 ring-gold'
                  : 'bg-card/70 border-line hover:border-line-strong hover:bg-card'
              }`}
            >
              {/* Header section */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-ink/[0.04] px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-slate-600 uppercase">
                    {bp.category}
                  </span>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? 'border-gold bg-gold-btn text-ink'
                        : 'border-line-strong text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="mt-3.5 flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                      isSelected
                        ? 'border-gold/30 bg-gold-btn text-ink'
                        : 'border-line bg-ink/[0.04] text-slate-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold tracking-tight text-ink font-heading">
                      {bp.title}
                    </h3>
                    <div className="text-[10px] font-bold text-gold">
                      {bp.patternTag}
                    </div>
                  </div>
                </div>

                {/* Blueprint Breakdown Specifications */}
                <div className="mt-4 space-y-2 border-t border-line pt-3.5 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Total Quota:</span>
                    <span className="font-bold text-ink">{bp.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Maximum Marks:</span>
                    <span className="font-semibold text-slate-600">{bp.totalMarks}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Paper Duration:</span>
                    <span className="font-semibold text-gold">{bp.duration}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Marking:</span>
                    <span className="font-semibold text-slate-600">{bp.marking}</span>
                  </div>
                </div>
              </div>

              {/* Action Button inside card */}
              <div className="mt-5 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectExam(bp.id);
                    onProceed();
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'glow-button text-ink'
                      : 'bg-ink/[0.04] text-slate-600 hover:bg-ink/[0.06] hover:text-ink'
                  }`}
                >
                  <span>Select & Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Assignment Target Question Counter (Only if ASSIGNMENT is chosen) */}
      {selectedExam === 'ASSIGNMENT' && (
        <div className="rounded-2xl border border-gold/30 bg-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-ink font-heading">
                Custom Assignment Target Questions
              </h4>
              <p className="text-[11px] text-slate-500">
                Specify how many questions you need for class test, homework, or DPP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdateAssignmentQuestions?.(Math.max(5, (assignmentQuestions || 30) - 5))
              }
              className="h-8 w-8 rounded-lg bg-ink/[0.06] text-ink font-bold hover:bg-ink/[0.10] flex items-center justify-center cursor-pointer text-sm"
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
                  Math.max(5, Math.min(150, parseInt(e.target.value, 10) || 30))
                )
              }
              className="w-16 h-8 text-center bg-paper border border-line-strong rounded-lg text-ink font-bold text-xs focus:border-gold outline-none"
            />
            <button
              type="button"
              onClick={() =>
                onUpdateAssignmentQuestions?.(Math.min(150, (assignmentQuestions || 30) + 5))
              }
              className="h-8 w-8 rounded-lg bg-ink/[0.06] text-ink font-bold hover:bg-ink/[0.10] flex items-center justify-center cursor-pointer text-sm"
            >
              +
            </button>
            <span className="text-xs text-slate-600 font-bold ml-1">Questions</span>
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 border border-gold/30 text-gold shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-ink font-heading">
              Selected Blueprint: <strong className="text-gold">{selectedExam === 'JEE' ? 'JEE Main' : selectedExam}</strong>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {userSubject} chapters from your question bank are ready for selection on the next page.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onProceed}
          className="glow-button flex items-center justify-center gap-2 px-6 py-3 text-xs font-black text-ink cursor-pointer whitespace-nowrap shadow-lg"
        >
          <span>Continue to Chapter Selection</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
