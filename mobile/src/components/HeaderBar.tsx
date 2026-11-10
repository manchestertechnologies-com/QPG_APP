import React from 'react';
import {
  Sparkles,
  Save,
  Printer,
  Crown,
  User,
  Check,
  RefreshCw,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { StoredUser, StoredSubscription } from '../services/apiClient';

interface HeaderBarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onGoBack?: () => void;
  user: StoredUser | null;
  subscription: StoredSubscription | null;
  onOpenUpgrade: () => void;
  onSaveDraft?: () => void;
  onExportPdf?: () => void;
  isSavingDraft?: boolean;
  canExport?: boolean;
  selectedExam?: string;
  targetQuestions?: number;
  onReset?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentStep,
  onStepChange,
  onGoBack,
  user,
  subscription,
  onOpenUpgrade,
  onSaveDraft,
  onExportPdf,
  isSavingDraft,
  canExport = true,
  selectedExam,
  targetQuestions,
  onReset,
}) => {
  const isPro = subscription?.isActive === true;

  // Step names mapping for progress indicator
  const getStepName = (s: number) => {
    switch (s) {
      case 1:
        return 'Exam Blueprint';
      case 2:
        return 'Syllabus Chapters';
      case 3:
        return 'Core Concepts';
      case 4:
        return 'Assembly Method';
      case 5:
        return 'Chapter Allocation';
      case 6:
        return 'Types & Difficulty';
      case 7:
        return 'Manual Selection';
      case 8:
        return 'Paper Workbench';
      default:
        return 'Paper Architect';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0D0D0D]/95 backdrop-blur-xl no-print">
      {/* Main Bar */}
      <div className="flex h-14 sm:h-16 w-full items-center justify-between px-3 sm:px-6">
        {/* Brand Identity & Universal Back Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Universal Header Back Button (Visible when step > 1) */}
          {currentStep > 1 && onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161616] hover:bg-white/10 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:border-[#C8A96A]/50 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              title="Go back to previous step"
            >
              <ArrowLeft className="h-4 w-4 text-[#C8A96A]" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C8A96A] via-[#D4B87A] to-[#A68B4F] p-[1.5px] shadow-lg shadow-[#C8A96A]/20 shrink-0">
            <div className="flex h-full w-full items-center justify-center rounded-[9px] sm:rounded-[10px] bg-[#0D0D0D]">
              <span className="font-heading font-black text-[#C8A96A] text-sm sm:text-lg tracking-tight">M</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 font-heading font-bold text-xs sm:text-sm tracking-tight text-white">
              <span>Manchester</span>
              <span className="text-[#C8A96A]">Technologies</span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 leading-none mt-0.5">
              Exam Architect OS • {user?.subject || 'Chemistry'} Faculty
            </p>
          </div>
        </div>

        {/* Center: Live Workflow Breadcrumb (Desktop) */}
        {currentStep > 1 && (
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/5 bg-[#141414] px-3.5 py-1 text-xs">
            <span className="text-[10px] font-bold text-[#C8A96A] uppercase tracking-wider font-heading">
              {getStepName(currentStep)}
            </span>
            {selectedExam && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 text-[11px] font-medium">
                  {selectedExam === 'JEE' ? 'JEE Main' : selectedExam} ({targetQuestions || 45} Qs)
                </span>
              </>
            )}
          </div>
        )}

        {/* Action Controls & User Account Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Start Over / Reset Button (Visible when step > 1) */}
          {currentStep > 1 && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="hidden sm:flex items-center gap-1 rounded-xl border border-white/5 bg-[#141414] hover:bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              title="Start new paper"
            >
              <RotateCcw className="h-3 w-3 text-slate-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Save Draft Button (visible when paper is generated / compiled) */}
          {currentStep >= 7 && onSaveDraft && (
            <button
              onClick={onSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#161616] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-[#C8A96A]/40 hover:text-[#C8A96A] transition-all whitespace-nowrap cursor-pointer"
              title="Save paper draft"
            >
              {isSavingDraft ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#C8A96A]" />
              ) : (
                <Save className="h-3.5 w-3.5 text-[#C8A96A]" />
              )}
              <span className="hidden sm:inline">{isSavingDraft ? 'Syncing...' : 'Save'}</span>
            </button>
          )}

          {/* Export PDF Button (visible when paper is generated / compiled) */}
          {currentStep >= 7 && onExportPdf && (
            <button
              onClick={onExportPdf}
              disabled={!canExport}
              className="glow-button flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-[#0D0D0D] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-md"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
          )}

          {/* Plan Status & Upgrade Trigger */}
          <button
            onClick={onOpenUpgrade}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all border whitespace-nowrap ${
              isPro
                ? 'bg-[#C8A96A]/10 text-[#C8A96A] border-[#C8A96A]/30'
                : 'glow-button-outline px-2.5 sm:px-3 py-1.5 text-xs'
            }`}
          >
            <Crown className="h-3.5 w-3.5 text-[#C8A96A]" />
            <span className="hidden sm:inline">{isPro ? 'PRO ACTIVE' : 'UPGRADE'}</span>
            <span className="sm:hidden">{isPro ? 'PRO' : 'PRO'}</span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#141414] p-1 sm:px-3 sm:py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#C8A96A] to-[#A68B4F] text-[#0D0D0D] text-xs font-black shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                {user?.name || user?.email?.split('@')[0] || 'Faculty'}
              </div>
              <div className="text-[10px] font-medium text-slate-400">
                {user?.subject || 'Chemistry'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
