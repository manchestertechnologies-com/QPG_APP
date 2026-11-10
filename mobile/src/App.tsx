import React, { useState, useEffect, useMemo } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { Sidebar } from './components/Sidebar';
import { ChooseExamStep, ExamType } from './components/ChooseExamStep';
import { TypeAllocationConfig } from './components/MethodAllocationStep';
import { ChaptersSelectionStep } from './components/ChaptersSelectionStep';
import { ConceptsSelectionStep } from './components/ConceptsSelectionStep';
import { QuestionsPerChapterStep } from './components/QuestionsPerChapterStep';
import { TypesAndDifficultyStep } from './components/TypesAndDifficultyStep';
import { GenerationModeStep } from './components/GenerationModeStep';
import { ManualQuestionsSelectorStep } from './components/ManualQuestionsSelectorStep';
import { WorkbenchStep, PaperState } from './components/WorkbenchStep';
import { ExamHistoryView } from './components/ExamHistoryView';
import { QuestionBankView } from './components/QuestionBankView';
import { SettingsView } from './components/SettingsView';
import { UpgradeModal } from './components/UpgradeModal';
import { ReferColleagueModal } from './components/ReferColleagueModal';
import { ToastProvider, useToast } from './components/Toast';
import { api, StoredUser, StoredSubscription } from './services/apiClient';
import { 
  Sparkles, Lock, ArrowRight, ShieldCheck, Mail, KeyRound, History, BookOpen, Settings,
  Check, X, Eye, EyeOff, ArrowLeft, RefreshCw, User, CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

function MainApp() {
  const { success, error, info, warning } = useToast();

  const [user, setUser] = useState<StoredUser | null>(api.getUser());
  const [subscription, setSubscription] = useState<StoredSubscription | null>(null);

  // Active navigation view
  const [activeView, setActiveView] = useState<'generator' | 'history' | 'bank' | 'settings'>('generator');

  // Additional State for Assignment Quota & Mode Selection
  const [assignmentQuestions, setAssignmentQuestions] = useState<number>(30);
  const [generationMode, setGenerationMode] = useState<'auto' | 'manual'>('auto');

  // Generator Workflow Step: 
  // 1 = Choose Exam Blueprint (Clean Dashboard)
  // 2 = Chapters Selection (Dedicated Second Page)
  // 3 = Concepts Selection
  // 4 = Assembly Mode (Auto-Fetch vs Manual Selection)
  // 5 = Questions Per Chapter (Auto-Fetch Path)
  // 6 = Types & Difficulty (Auto-Fetch Path)
  // 7 = Manual Question Selector (Manual Path)
  // 8 = Paper Workbench & Alignment Control 
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selected Exam Blueprint
  const [selectedExam, setSelectedExam] = useState<ExamType>('NEET');

  // Selected Chapters
  const [selectedChapters, setSelectedChapters] = useState<string[]>([
    'Structure of Atom',
    'Thermodynamics & Thermochemistry',
    'Solutions',
    'Electrochemistry',
  ]);

  // Selected Concepts
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);

  // Questions allocated per chapter
  const [questionsPerChapter, setQuestionsPerChapter] = useState<Record<string, number>>({});

  // Question Type Allocation Configuration (Step 4)
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

  // Mandatory target questions count: NEET (45), JEE (25), KCET (60), ASSIGNMENT (custom)
  const targetQuestions = useMemo(() => {
    if (selectedExam === 'NEET') return 45;
    if (selectedExam === 'JEE') return 25;
    if (selectedExam === 'KCET') return 60;
    return assignmentQuestions || 30;
  }, [selectedExam, assignmentQuestions]);

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
    } else if (selectedExam === 'KCET') {
      // KCET: Direct 60 MCQs (No Numericals)
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
    } else {
      // ASSIGNMENT: Flexible teacher quota
      const total = assignmentQuestions || 30;
      const sMcq = Math.round(total * 0.7);
      const ar = Math.round(total * 0.1);
      const st = Math.round(total * 0.1);
      const mp = Math.max(0, total - (sMcq + ar + st));
      setTypeAllocation({
        singleMcq: sMcq,
        assertionReason: ar,
        statements: st,
        matchPairs: mp,
        diagrammatic: 0,
        numerical: 0,
        easyPct: 30,
        mediumPct: 50,
        hardPct: 20,
      });
    }
  }, [selectedExam, assignmentQuestions]);

  // Generated Paper State
  const [paper, setPaper] = useState<PaperState | null>(null);

  // Loading flags
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Modal states
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);

  // Auth multi-state: 'login' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSubject, setAuthSubject] = useState<'Chemistry' | 'Physics' | 'Mathematics' | 'Biology'>('Chemistry');
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Live password validation criteria (8-20 chars, upper, lower, digit, special, match)
  const passwordCriteria = useMemo(() => {
    const p = authPassword || '';
    const hasLength = p.length >= 8 && p.length <= 20;
    const hasUpper = /[A-Z]/.test(p);
    const hasLower = /[a-z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(p);
    const isMatching = p.length > 0 && p === authConfirmPassword;
    const isValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial;
    return {
      hasLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isMatching,
      isValid,
      canSubmit: isValid && isMatching && authOtp.trim().length === 6,
    };
  }, [authPassword, authConfirmPassword, authOtp]);

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

  // Subsequent Login using Email + Password
  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    const emailToUse = (customEmail || authEmail).trim();
    const passwordToUse = customPassword || authPassword;
    if (!emailToUse || !passwordToUse) {
      warning('Missing Details', 'Please enter your registered email and password.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.loginPassword(emailToUse, passwordToUse);
      if (res && res.user) {
        setUser(res.user);
        if (res.subscription) setSubscription(res.subscription);
        success('Welcome Back!', `Logged in as ${res.user.name || res.user.email}`);
      }
    } catch (err: any) {
      if (err.code === 'PASSWORD_NOT_SET' || (err.message && err.message.includes('create an account using OTP'))) {
        warning(
          'First-Time Sign Up Required',
          'You need to verify your email with a one-time OTP and create your faculty password first.'
        );
        setAuthMode('signup');
        setSignupStep(1);
      } else {
        error('Sign In Failed', err.message || 'Invalid email or password.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Dispatch OTP email for first-time Sign Up or Forgot Password
  const handleSendOtp = async (purpose: 'SIGNUP' | 'FORGOT_PASSWORD') => {
    const emailToUse = authEmail.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      warning('Invalid Email', 'Please enter a valid official teacher email address.');
      return;
    }
    setAuthLoading(true);
    try {
      await api.sendOtp(emailToUse, purpose);
      success(
        'Verification Code Sent',
        purpose === 'SIGNUP' 
          ? `A single-use OTP has been dispatched to ${emailToUse}. Check your inbox!`
          : `Password reset instructions with a 6-digit OTP dispatched to ${emailToUse}.`
      );
      if (purpose === 'SIGNUP') {
        setSignupStep(2);
      } else {
        setForgotStep(2);
      }
      setResendCooldown(60);
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        warning('Account Exists', 'This email is already registered. Please sign in with your password.');
        setAuthMode('login');
      } else {
        error('Could Not Send OTP', err.message || 'Failed to dispatch email.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Verify OTP & Save Strong Password
  const handleVerifyAndSetPassword = async (purpose: 'SIGNUP' | 'FORGOT_PASSWORD') => {
    if (!passwordCriteria.isValid) {
      warning('Password Requirements Unmet', 'Password must be 8-20 chars with uppercase, lowercase, number, and special character.');
      return;
    }
    if (!passwordCriteria.isMatching) {
      warning('Passwords Mismatch', 'The confirmation password does not match.');
      return;
    }
    if (!authOtp || authOtp.trim().length !== 6) {
      warning('Invalid Code', 'Please enter the 6-digit OTP code received on your email.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await api.verifyOtpAndSetPassword({
        email: authEmail.trim(),
        otp: authOtp.trim(),
        password: authPassword,
        purpose,
        name: authName.trim() || undefined,
        subject: authSubject,
      });

      if (res && res.user) {
        setUser(res.user);
        if (res.subscription) setSubscription(res.subscription);
        success(
          purpose === 'SIGNUP' ? 'Registration Complete!' : 'Password Updated!',
          purpose === 'SIGNUP' 
            ? 'Your faculty password is now saved. Use your email and password for all future logins.'
            : 'Your new password is now active.'
        );
      }
    } catch (err: any) {
      error('Verification Failed', err.message || 'Invalid or expired OTP code.');
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

  // Compile & Generate Paper Trigger
  const handleCompilePaper = async () => {
    setIsGenerating(true);
    try {
      const res = await api.generatePaper({
        exam_type: selectedExam,
        subject: user?.subject || 'Chemistry',
        chapters: selectedChapters,
        concepts: selectedConcepts,
        questions_per_chapter: questionsPerChapter,
        type_allocation: typeAllocation,
        total_questions: targetQuestions,
      });

      if (res && res.paper) {
        setPaper(res.paper);
        setCurrentStep(8);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        success(
          'Paper Generated!',
          `${selectedExam} examination paper compiled according to your syllabus and distribution settings.`
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

  // Universal Back Navigation
  const handleGoBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    } else if (currentStep === 5) {
      setCurrentStep(4);
    } else if (currentStep === 6) {
      setCurrentStep(5);
    } else if (currentStep === 7) {
      setCurrentStep(4);
    } else if (currentStep === 8) {
      setCurrentStep(generationMode === 'manual' ? 7 : 6);
    }
  };

  // Reset Wizard
  const handleResetWizard = () => {
    setPaper(null);
    setCurrentStep(1);
    info('Reset Completed', 'Returned to Exam Blueprint selection.');
  };

  // If user is not logged in, render clean dark auth portal with OTP Onboarding & Password Management
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-[#F3F4F6] flex flex-col justify-center items-center p-4 relative overflow-hidden">
        {/* Subtle Luxury Gold ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#C8A96A]/10 blur-[130px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#141414]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#C8A96A] via-[#D4B87A] to-[#A68B4F] shadow-lg shadow-[#C8A96A]/25 mb-3">
              <span className="font-heading font-black text-[#0D0D0D] text-xl">M</span>
            </div>
            <h1 className="text-xl font-heading font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Manchester</span>
              <span className="text-[#C8A96A]">Technologies</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Exam Architect OS • Faculty Question Paper Generator
            </p>
          </div>

          {/* Mode Switcher Tabs (Sign In vs First-Time Sign Up) */}
          {authMode !== 'forgot' && (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#1A1A1A] border border-white/5 mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 rounded-lg transition-all text-center cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-[#C8A96A] text-[#0D0D0D] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In (Password)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setSignupStep(1);
                }}
                className={`py-2 rounded-lg transition-all text-center cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-[#C8A96A] text-[#0D0D0D] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                First-Time Faculty (OTP)
              </button>
            </div>
          )}

          {/* MODE 1: Standard Password Sign In */}
          {authMode === 'login' && (
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors"
                    placeholder="faculty@institution.edu"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    Faculty Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setForgotStep(1);
                    }}
                    className="text-[11px] text-[#C8A96A] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="glow-button mt-3 w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#0D0D0D] cursor-pointer disabled:opacity-50"
              >
                <span>{authLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  First time using Exam Architect?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setSignupStep(1);
                    }}
                    className="text-[#C8A96A] font-semibold hover:underline cursor-pointer"
                  >
                    Sign Up via Email OTP
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* MODE 2: First-Time Sign Up with Email OTP & Password Creation */}
          {authMode === 'signup' && (
            <div>
              {signupStep === 1 ? (
                /* Step 1: Request OTP */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendOtp('SIGNUP');
                  }}
                  className="space-y-4"
                >
                  <div className="text-center mb-2">
                    <h2 className="text-sm font-bold text-white">First-Time Faculty Verification</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enter your official email to receive a single-use 6-digit verification code.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors"
                        placeholder="Dr. Ramesh Rao"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Primary Faculty Subject
                    </label>
                    <select
                      value={authSubject}
                      onChange={(e) => setAuthSubject(e.target.value as any)}
                      className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-4 py-2.5 text-xs text-white focus:border-[#C8A96A] focus:outline-none transition-colors"
                    >
                      <option value="Chemistry">Chemistry Faculty</option>
                      <option value="Physics">Physics Faculty</option>
                      <option value="Mathematics">Mathematics Faculty</option>
                      <option value="Biology">Biology Faculty</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Official Email Address <span className="text-[#C8A96A]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors"
                        placeholder="faculty@institution.edu"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="glow-button mt-3 w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#0D0D0D] cursor-pointer disabled:opacity-50"
                  >
                    <span>{authLoading ? 'Sending OTP Code...' : 'Send 6-Digit OTP Code'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Already created your password? <span className="text-[#C8A96A] font-medium">Sign In</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Enter OTP & Create Strong Password */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyAndSetPassword('SIGNUP');
                  }}
                  className="space-y-3.5"
                >
                  <div className="rounded-xl bg-[#1A1A1A] border border-white/10 p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-slate-400 text-[11px]">OTP Sent To:</div>
                      <div className="text-white font-medium truncate max-w-[200px]">{authEmail}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="text-[#C8A96A] text-[11px] hover:underline"
                    >
                      Change Email
                    </button>
                  </div>

                  {/* 6-Digit OTP Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={authOtp}
                      onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.4em] font-mono text-lg font-bold rounded-xl border border-white/10 bg-[#1A1A1A] py-2.5 text-white placeholder-slate-600 focus:border-[#C8A96A] focus:outline-none transition-colors"
                      placeholder="000000"
                    />
                  </div>

                  {/* Strong Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Create Faculty Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors"
                        placeholder="Min 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2 text-slate-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors"
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2 text-slate-500 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Live Password Criteria Badges */}
                  <div className="rounded-xl border border-white/5 bg-[#0D0D0D] p-3 text-[11px] space-y-1.5">
                    <div className="font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Password Requirements:</span>
                      {passwordCriteria.isValid && passwordCriteria.isMatching ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> All Met
                        </span>
                      ) : (
                        <span className="text-slate-500">Must fulfill all</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLength ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.hasLength ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>8 to 20 Characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.hasUpper ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>Uppercase (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.hasLower ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>Lowercase (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.hasNumber ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>Number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.hasSpecial ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>Special Symbol (!@#$)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.isMatching ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.isMatching ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>Passwords Match</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!passwordCriteria.canSubmit || authLoading}
                    className="glow-button mt-3 w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#0D0D0D] cursor-pointer disabled:opacity-50"
                  >
                    <span>{authLoading ? 'Verifying & Saving...' : 'Verify OTP & Create Password'}</span>
                    <ShieldCheck className="h-4 w-4" />
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || authLoading}
                      onClick={() => handleSendOtp('SIGNUP')}
                      className="text-[#C8A96A] hover:underline disabled:text-slate-600 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend OTP Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel & Return
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 3: Forgot Password Recovery */}
          {authMode === 'forgot' && (
            <div>
              {forgotStep === 1 ? (
                /* Forgot Step 1: Send recovery OTP */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendOtp('FORGOT_PASSWORD');
                  }}
                  className="space-y-4"
                >
                  <div className="text-center mb-2">
                    <h2 className="text-sm font-bold text-white">Reset Faculty Password</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Enter your registered email to receive a secure recovery code.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors"
                        placeholder="faculty@institution.edu"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="glow-button mt-3 w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#0D0D0D] cursor-pointer disabled:opacity-50"
                  >
                    <span>{authLoading ? 'Sending Recovery Code...' : 'Send Recovery Code'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Forgot Step 2: Enter OTP & Set New Password */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyAndSetPassword('FORGOT_PASSWORD');
                  }}
                  className="space-y-3.5"
                >
                  <div className="rounded-xl bg-[#1A1A1A] border border-white/10 p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-slate-400 text-[11px]">Recovery Code Sent To:</div>
                      <div className="text-white font-medium truncate max-w-[200px]">{authEmail}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-[#C8A96A] text-[11px] hover:underline"
                    >
                      Change Email
                    </button>
                  </div>

                  {/* 6-Digit OTP Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Enter 6-Digit Recovery Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={authOtp}
                      onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.4em] font-mono text-lg font-bold rounded-xl border border-white/10 bg-[#1A1A1A] py-2.5 text-white placeholder-slate-600 focus:border-[#C8A96A] focus:outline-none transition-colors"
                      placeholder="000000"
                    />
                  </div>

                  {/* New Strong Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Create New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors"
                        placeholder="Min 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2 text-slate-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#1A1A1A] pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors"
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2 text-slate-500 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Live Password Criteria Badges */}
                  <div className="rounded-xl border border-white/5 bg-[#0D0D0D] p-3 text-[11px] space-y-1.5">
                    <div className="font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Password Requirements:</span>
                      {passwordCriteria.isValid && passwordCriteria.isMatching ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> All Met
                        </span>
                      ) : (
                        <span className="text-slate-500">Must fulfill all</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLength ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.hasLength ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>8 to 20 Characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.hasUpper ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>Uppercase (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.hasLower ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>Lowercase (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.hasNumber ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>Number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.hasSpecial ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>Special Symbol (!@#$)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordCriteria.isMatching ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {passwordCriteria.isMatching ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />}
                        <span>Passwords Match</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!passwordCriteria.canSubmit || authLoading}
                    className="glow-button mt-3 w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-[#0D0D0D] cursor-pointer disabled:opacity-50"
                  >
                    <span>{authLoading ? 'Verifying & Updating...' : 'Verify OTP & Update Password'}</span>
                    <ShieldCheck className="h-4 w-4" />
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || authLoading}
                      onClick={() => handleSendOtp('FORGOT_PASSWORD')}
                      className="text-[#C8A96A] hover:underline disabled:text-slate-600 disabled:no-underline cursor-pointer"
                    >
                      {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Recovery Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-slate-400 hover:text-white"
                    >
                      Cancel & Return
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Access (for convenience) */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={() => handleLogin(undefined, 'qpgtest@gmail.com', 'Admin@2026')}
              className="text-xs font-medium text-slate-500 hover:text-[#C8A96A] cursor-pointer transition-colors"
            >
              Default Test Faculty (qpgtest@gmail.com)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F3F4F6] flex flex-col antialiased">
      {/* Top Header Bar */}
      <HeaderBar
        currentStep={currentStep}
        onStepChange={(step) => {
          if (step === 8 && !paper) {
            warning('No Paper Generated', 'Please complete steps 1-6 and compile your paper first.');
            return;
          }
          setCurrentStep(step);
        }}
        onGoBack={handleGoBack}
        selectedExam={selectedExam}
        targetQuestions={targetQuestions}
        onReset={handleResetWizard}
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
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 pb-24 md:pb-8">
          {activeView === 'generator' && (
            <>
              {/* Step 1: Choose Exam Blueprint (Clean Dashboard) */}
              {currentStep === 1 && (
                <ChooseExamStep
                  selectedExam={selectedExam}
                  onSelectExam={setSelectedExam}
                  onProceed={() => setCurrentStep(2)}
                  userSubject={user?.subject || 'Chemistry'}
                  assignmentQuestions={assignmentQuestions}
                  onUpdateAssignmentQuestions={setAssignmentQuestions}
                />
              )}

              {/* Step 2: Chapters Selection (Dedicated Second Page) */}
              {currentStep === 2 && (
                <ChaptersSelectionStep
                  selectedExam={selectedExam}
                  targetQuestions={targetQuestions}
                  selectedChapters={selectedChapters}
                  onSelectChapters={setSelectedChapters}
                  userSubject={user?.subject || 'Chemistry'}
                  onBack={() => setCurrentStep(1)}
                  onProceed={() => setCurrentStep(3)}
                />
              )}

              {/* Step 3: Concepts Selection */}
              {currentStep === 3 && (
                <ConceptsSelectionStep
                  selectedChapters={selectedChapters}
                  selectedConcepts={selectedConcepts}
                  onSelectConcepts={setSelectedConcepts}
                  onBack={() => setCurrentStep(2)}
                  onProceed={() => setCurrentStep(4)}
                  userSubject={user?.subject || 'Chemistry'}
                />
              )}

              {/* Step 4: Workflow Mode Selection (Auto-Fetch vs Manual Selection) */}
              {currentStep === 4 && (
                <GenerationModeStep
                  selectedExam={selectedExam}
                  targetQuestions={targetQuestions}
                  selectedChapters={selectedChapters}
                  selectedConcepts={selectedConcepts}
                  onSelectMode={(mode) => {
                    setGenerationMode(mode);
                    if (mode === 'auto') {
                      setCurrentStep(5);
                    } else {
                      setCurrentStep(7);
                    }
                  }}
                  onBack={() => setCurrentStep(3)}
                />
              )}

              {/* Step 5: Questions Per Chapter (Auto-Fetch Path) */}
              {currentStep === 5 && (
                <QuestionsPerChapterStep
                  selectedExam={selectedExam}
                  targetQuestions={targetQuestions}
                  selectedChapters={selectedChapters}
                  questionsPerChapter={questionsPerChapter}
                  onUpdateQuestionsPerChapter={setQuestionsPerChapter}
                  onBack={() => setCurrentStep(4)}
                  onProceed={() => setCurrentStep(6)}
                  userSubject={user?.subject || 'Chemistry'}
                />
              )}

              {/* Step 6: Question Types & Difficulty (Auto-Fetch Path) */}
              {currentStep === 6 && (
                <TypesAndDifficultyStep
                  selectedExam={selectedExam}
                  targetQuestions={targetQuestions}
                  allocation={typeAllocation}
                  onUpdateAllocation={setTypeAllocation}
                  onBack={() => setCurrentStep(5)}
                  onGenerate={handleCompilePaper}
                  isGenerating={isGenerating}
                  userSubject={user?.subject || 'Chemistry'}
                />
              )}

              {/* Step 7: Manual Questions Selector (Manual Path) */}
              {currentStep === 7 && (
                <ManualQuestionsSelectorStep
                  selectedExam={selectedExam}
                  targetQuestions={targetQuestions}
                  selectedChapters={selectedChapters}
                  selectedConcepts={selectedConcepts}
                  userSubject={user?.subject || 'Chemistry'}
                  onBack={() => setCurrentStep(4)}
                  onComplete={(compiledPaper) => {
                    setPaper(compiledPaper);
                    setCurrentStep(8);
                    confetti({
                      particleCount: 80,
                      spread: 70,
                      origin: { y: 0.6 },
                    });
                    success(
                      'Paper Compiled!',
                      `${selectedExam} examination paper compiled with your ${compiledPaper.questions.length} manually selected questions.`
                    );
                  }}
                />
              )}

              {/* Step 8: Live Workbench & Paper Alignment */}
              {currentStep === 8 && paper && (
                <WorkbenchStep
                  paper={paper}
                  onPaperUpdate={setPaper}
                  user={user}
                  subscription={subscription}
                  onOpenUpgrade={() => setIsUpgradeOpen(true)}
                  onOpenReferral={() => setIsReferralOpen(true)}
                  initialStep={8}
                  onNavigateStep={(s) => setCurrentStep(generationMode === 'manual' ? 7 : 6)}
                  onNavigateView={(view) => setActiveView(view)}
                />
              )}
            </>
          )}

          {activeView === 'history' && (
            <ExamHistoryView
              onLoadDraft={(loadedPaper) => {
                setPaper(loadedPaper);
                setActiveView('generator');
                setCurrentStep(8);
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

      {/* Mobile Bottom Navigation Bar (Visible only on mobile devices) */}
      <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-white/5 bg-[#0D0D0D]/95 px-2 py-2 backdrop-blur-xl no-print">
        <button
          onClick={() => {
            setActiveView('generator');
            if (!paper) setCurrentStep(1);
          }}
          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[10px] font-bold transition-all cursor-pointer ${
            activeView === 'generator'
              ? 'text-[#C8A96A]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Generator</span>
        </button>

        <button
          onClick={() => setActiveView('history')}
          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[10px] font-bold transition-all cursor-pointer ${
            activeView === 'history'
              ? 'text-[#C8A96A]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Saved Papers</span>
        </button>

        <button
          onClick={() => setActiveView('bank')}
          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[10px] font-bold transition-all cursor-pointer ${
            activeView === 'bank'
              ? 'text-[#C8A96A]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Bank</span>
        </button>

        <button
          onClick={() => setActiveView('settings')}
          className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[10px] font-bold transition-all cursor-pointer ${
            activeView === 'settings'
              ? 'text-[#C8A96A]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Account</span>
        </button>
      </nav>

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
