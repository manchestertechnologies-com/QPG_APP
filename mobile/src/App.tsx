import React, { useState, useEffect } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { Sidebar } from './components/Sidebar';
import { ChooseExamStep, ExamType } from './components/ChooseExamStep';
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

  // Generator Workflow Step: 1 = Choose Exam, 2 = Configure Matrix, 3 = Workbench
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selected Exam Blueprint
  const [selectedExam, setSelectedExam] = useState<ExamType>('NEET');

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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await api.loginPassword(authEmail, authPassword);
      if (res && res.user) {
        setUser(res.user);
        if (res.subscription) setSubscription(res.subscription);
        success('Welcome Back!', `Logged in as ${res.user.name || res.user.email}`);
      }
    } catch (err: any) {
      // If user doesn't exist, try auto-registering test user
      try {
        const regRes = await api.register(authEmail, authPassword, 'Faculty Member', 'Chemistry');
        if (regRes && regRes.user) {
          setUser(regRes.user);
          if (regRes.subscription) setSubscription(regRes.subscription);
          success('Welcome!', 'Teacher account ready with 1 Free Paper Trial.');
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
        setCurrentStep(3);
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

  // If user is not logged in, render high-craft dark login / 1-tap trial screen
  if (!user) {
    return (
      <div className="min-h-screen bg-[#090A0F] text-[#E2E8F0] flex flex-col justify-center items-center p-4">
        {/* Glow background elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#11141E] p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/25">
              <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#090A0F]">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">
                MANCHESTER TECHNOLOGIES
              </h1>
              <p className="text-[11px] font-semibold text-slate-400">
                Davangere - 577006 • Exam Architect OS
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 mb-6 text-center">
            <div className="text-xs font-extrabold text-purple-300">
              ChatGPT-Style Freemium Access
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Create, customize, and export <strong className="text-white">1 full examination paper for free</strong> with post-COVID blueprint enforcement.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Teacher Email ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#161A26] pl-10 pr-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
                  placeholder="teacher@institution.edu"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#161A26] pl-10 pr-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
                  placeholder="••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-extrabold text-white shadow-xl shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{authLoading ? 'Verifying Credentials...' : 'Sign In / Start Free Trial'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick 1-Tap Demo Button */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <button
              onClick={() => {
                setAuthEmail('qpgtest@gmail.com');
                setAuthPassword('123456');
                handleLogin();
              }}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              ⚡ 1-Tap Instant Chemistry Trial Access (qpgtest@gmail.com)
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
          if (step === 3 && !paper) {
            warning('No Paper Generated', 'Please configure the matrix and generate a paper first.');
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
              {currentStep === 1 && (
                <ChooseExamStep
                  selectedExam={selectedExam}
                  onSelectExam={setSelectedExam}
                  onProceed={() => setCurrentStep(2)}
                  userSubject={user?.subject || 'Chemistry'}
                />
              )}

              {currentStep === 2 && (
                <SyllabusMatrixStep
                  examType={selectedExam}
                  userSubject={user?.subject || 'Chemistry'}
                  onBack={() => setCurrentStep(1)}
                  onGenerate={handleGeneratePaper}
                  isGenerating={isGenerating}
                />
              )}

              {currentStep === 3 && paper && (
                <WorkbenchStep
                  paper={paper}
                  onPaperUpdate={setPaper}
                  user={user}
                  subscription={subscription}
                  onOpenUpgrade={() => setIsUpgradeOpen(true)}
                  onOpenReferral={() => setIsReferralOpen(true)}
                />
              )}
            </>
          )}

          {activeView === 'history' && (
            <ExamHistoryView
              onLoadDraft={(loadedPaper) => {
                setPaper(loadedPaper);
                setActiveView('generator');
                setCurrentStep(3);
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
