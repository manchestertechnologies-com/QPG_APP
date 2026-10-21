import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { Sidebar } from './components/Sidebar';
import { ChooseExamStep, ExamType } from './components/ChooseExamStep';
import { MethodAllocationStep, TypeAllocationConfig } from './components/MethodAllocationStep';
import { SyllabusMatrixStep, MatrixRow } from './components/SyllabusMatrixStep';
import { WorkbenchStep, PaperState } from './components/WorkbenchStep';
import { ExamHistoryView } from './components/ExamHistoryView';
import { QuestionBankView } from './components/QuestionBankView';
import { SettingsView } from './components/SettingsView';
import { UpgradeModal } from './components/UpgradeModal';
import { ReferColleagueModal } from './components/ReferColleagueModal';
import { ToastProvider, useToast } from './components/Toast';
import { api, StoredUser, StoredSubscription } from './services/apiClient';
import { Sparkles, Lock, ArrowRight, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import confetti from 'canvas-confetti';

function MainApp() {
  const { success, error, info, warning } = useToast();

  const [user, setUser] = useState<StoredUser | null>(api.getUser());
  const [subscription, setSubscription] = useState<StoredSubscription | null>(null);

  // Active navigation view
  const [activeView, setActiveView] = useState<'generator' | 'history' | 'bank' | 'settings'>('generator');

  // Generator Workflow Step: 1 = Scope, 2 = Method, 3 = Matrix, 4 = Preview, 5 = Alignment & Finalize
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selected Exam Blueprint
  const [selectedExam, setSelectedExam] = useState<ExamType>('NEET');

  // Question Type Allocation Configuration (Step 2)
  const [typeAllocation, setTypeAllocation] = useState<TypeAllocationConfig>({
    singleMcq: 28,
    assertionReason: 5,
    statements: 4,
    matchPairs: 3,
    diagrammatic: 5,
    numerical: 0,
    easyPct: 30,
    mediumPct: 50,
    hardPct: 20,
  });

  // Mandatory target questions count
  const targetQuestions = selectedExam === 'NEET' ? 45 : selectedExam === 'JEE' ? 25 : 60;

  // Sync default type allocation when exam changes
  useEffect(() => {
    if (selectedExam === 'NEET') {
      setTypeAllocation({
        singleMcq: 28,
        assertionReason: 5,
        statements: 4,
        matchPairs: 3,
        diagrammatic: 5,
        numerical: 0,
        easyPct: 30,
        mediumPct: 50,
        hardPct: 20,
      });
    } else if (selectedExam === 'JEE') {
      setTypeAllocation({
        singleMcq: 14,
        assertionReason: 2,
        statements: 2,
        matchPairs: 1,
        diagrammatic: 1,
        numerical: 5, // Strict JEE NTA requirement
        easyPct: 25,
        mediumPct: 50,
        hardPct: 25,
      });
    } else {
      setTypeAllocation({
        singleMcq: 46,
        assertionReason: 5,
        statements: 4,
        matchPairs: 2,
        diagrammatic: 3,
        numerical: 0,
        easyPct: 35,
        mediumPct: 50,
        hardPct: 15,
      });
    }
  }, [selectedExam]);

  // Generated Paper State
  const [paper, setPaper] = useState<PaperState | null>(null);

  // Loading flags
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Modal states
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  // Auth form state (when not logged in)
  const [authEmail, setAuthEmail] = useState('qpgtest@gmail.com');
  const [authPassword, setAuthPassword] = useState('123456');
  const [authLoading, setAuthLoading] = useState(false);

  // Load user profile & subscription on mount
  useEffect(() => {
    if (user) {
      api
        .getMe()
        .then((res) => {
          if (res && res.user) {
            setUser(res.user);
            api.setSession(api.getToken() || '', res.user);
          }
          if (res && res.subscription) {
            setSubscription(res.subscription);
          }
        })
        .catch(() => {
          // Keep current user state
        });
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    const emailToUse = (customEmail || authEmail || 'qpgtest@gmail.com').trim();
    const passwordToUse = customPassword || authPassword || '123456';
    setAuthLoading(true);
    try {
      const res = await api.loginPassword(emailToUse, passwordToUse);
      if (res && res.user) {
        setUser(res.user);
        if (res.subscription) setSubscription(res.subscription);
        success('Welcome Back!', `Logged in as ${res.user.name || res.user.email}`);
      }
    } catch (err: any) {
      try {
        const regRes = await api.register(emailToUse, passwordToUse, 'Faculty Member', 'Chemistry');
        if (regRes && regRes.user) {
          setUser(regRes.user);
          if (regRes.subscription) setSubscription(regRes.subscription);
          success('Welcome!', 'Teacher account ready with Chemistry Faculty Access.');
        }
      } catch (regErr: any) {
        error('Sign In Error', err.message || 'Could not authenticate.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    api.clearSession();
    setUser(null);
    setSubscription(null);
    info('Signed Out', 'You have been logged out of the Exam Architect.');
  };

  // Generate Paper Trigger
  const handleGeneratePaper = async (payload: {
    chapters: string[];
    concepts: string[];
    classLevels: ('11' | '12')[];
    matrix: MatrixRow[];
    totalQuestions: number;
  }) => {
    setIsGenerating(true);
    try {
      const res = await api.generatePaper({
        exam_type: selectedExam,
        subject: user?.subject || 'Chemistry',
        class_levels: payload.classLevels,
        chapters: payload.chapters,
        total_questions: payload.totalQuestions,
      });

      if (res && res.paper) {
        setPaper(res.paper);
        setCurrentStep(4);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        success(
          'Paper Generated!',
          `${selectedExam} examination paper compiled according to revised blueprint.`
        );
      }
    } catch (err: any) {
      if (err.message && err.message.includes('TRIAL_LIMIT_REACHED')) {
        warning(
          'Free Trial Limit Reached',
          'You have generated your 1 free examination paper. Please upgrade to Pro (₹299) for unlimited papers.'
        );
        setIsUpgradeOpen(true);
      } else {
        error('Generation Error', err.message || 'Failed to generate paper.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Draft to Cloud
  const handleSaveDraft = async () => {
    if (!paper) return;
    setIsSavingDraft(true);
    try {
      await api.saveDraft(paper, paper.title, paper.header);
      success('Draft Saved to Cloud', 'Your paper and question swaps are safely auto-synced.');
    } catch (err: any) {
      error('Save Failed', err.message || 'Could not save draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Export PDF trigger
  const handleExportPdf = () => {
    window.print();
  };

  // If user is not logged in, render clean dark login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-[#090A0F] text-[#E2E8F0] flex flex-col justify-center items-center p-4">
        {/* Subtle glow background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#11141E] p-7 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 mb-3 shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Manchester Technologies
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Question Paper Generator
            </p>
          </div>

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#161A26] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="name@institution.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#161A26] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{authLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={() => handleLogin(undefined, 'qpgtest@gmail.com', '123456')}
              className="text-xs font-medium text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
            >
              Demo Account (qpgtest@gmail.com)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#E2E8F0] flex flex-col antialiased">
      {/* Top Header Bar */}
      <HeaderBar
        currentStep={currentStep}
        onStepChange={(step) => {
          if ((step === 4 || step === 5) && !paper) {
            warning('No Paper Generated', 'Please complete steps 1-3 and compile your paper first.');
            return;
          }
          setCurrentStep(step);
        }}
        user={user}
        subscription={subscription}
        onOpenUpgrade={() => setIsUpgradeOpen(true)}
        onSaveDraft={handleSaveDraft}
        onExportPdf={handleExportPdf}
        isSavingDraft={isSavingDraft}
        canExport={true}
      />

      {/* Main Workspace Body with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeView={activeView}
          onSelectView={(v) => {
            setActiveView(v);
            if (v === 'generator' && !paper) {
              setCurrentStep(1);
            }
          }}
          user={user}
          subscription={subscription}
          onOpenUpgrade={() => setIsUpgradeOpen(true)}
          onOpenReferral={() => setIsReferralOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Center Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeView === 'generator' && (
            <>
              {/* Step 1: Examination Scope & Blueprint */}
              {currentStep === 1 && (
                <ChooseExamStep
                  selectedExam={selectedExam}
                  onSelectExam={setSelectedExam}
                  onProceed={() => setCurrentStep(2)}
                  userSubject={user?.subject || 'Chemistry'}
                />
              )}

              {/* Step 2: Question Type Allocation & Method */}
              {currentStep === 2 && (
                <MethodAllocationStep
                  examType={selectedExam}
                  userSubject={user?.subject || 'Chemistry'}
                  targetQuestions={targetQuestions}
                  allocation={typeAllocation}
                  onUpdateAllocation={setTypeAllocation}
                  onBack={() => setCurrentStep(1)}
                  onProceed={() => setCurrentStep(3)}
                />
              )}

              {/* Step 3: Syllabus Matrix & Question Distribution */}
              {currentStep === 3 && (
                <SyllabusMatrixStep
                  examType={selectedExam}
                  userSubject={user?.subject || 'Chemistry'}
                  onBack={() => setCurrentStep(2)}
                  onGenerate={handleGeneratePaper}
                  isGenerating={isGenerating}
                />
              )}

              {/* Step 4: Live Workbench & Paper Preview */}
              {currentStep === 4 && paper && (
                <WorkbenchStep
                  paper={paper}
                  onPaperUpdate={setPaper}
                  user={user}
                  subscription={subscription}
                  onOpenUpgrade={() => setIsUpgradeOpen(true)}
                  onOpenReferral={() => setIsReferralOpen(true)}
                  initialStep={4}
                  onNavigateStep={(s) => setCurrentStep(s)}
                />
              )}

              {/* Step 5: Paper Alignment & Finalize */}
              {currentStep === 5 && paper && (
                <WorkbenchStep
                  paper={paper}
                  onPaperUpdate={setPaper}
                  user={user}
                  subscription={subscription}
                  onOpenUpgrade={() => setIsUpgradeOpen(true)}
                  onOpenReferral={() => setIsReferralOpen(true)}
                  initialStep={5}
                  onNavigateStep={(s) => setCurrentStep(s)}
                />
              )}
            </>
          )}

          {activeView === 'history' && (
            <ExamHistoryView
              onLoadDraft={(loadedPaper) => {
                setPaper(loadedPaper);
                setActiveView('generator');
                setCurrentStep(4);
                info('Loaded Draft', `Opening ${loadedPaper.title || 'draft'} in Live Workbench.`);
              }}
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
              isPro={subscription?.isActive === true}
            />
          )}

          {activeView === 'bank' && <QuestionBankView user={user} />}

          {activeView === 'settings' && (
            <SettingsView
              user={user}
              subscription={subscription}
              onOpenUpgrade={() => setIsUpgradeOpen(true)}
              onOpenReferral={() => setIsReferralOpen(true)}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Upgrade & Dynamic Checkout Modal */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        user={user}
        onOpenReferral={() => {
          setIsUpgradeOpen(false);
          setIsReferralOpen(true);
        }}
      />

      {/* Refer a Colleague Modal */}
      <ReferColleagueModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        user={user}
        onSuccess={(newCredits) => {
          if (user) {
            setUser({ ...user, paperCredits: newCredits });
          }
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
