import React from 'react';
import { Sparkles, Save, Printer, Crown, User, Check, RefreshCw } from 'lucide-react';
import { StoredUser, StoredSubscription } from '../services/apiClient';

interface HeaderBarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  user: StoredUser | null;
  subscription: StoredSubscription | null;
  onOpenUpgrade: () => void;
  onSaveDraft?: () => void;
  onExportPdf?: () => void;
  isSavingDraft?: boolean;
  canExport?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentStep,
  onStepChange,
  user,
  subscription,
  onOpenUpgrade,
  onSaveDraft,
  onExportPdf,
  isSavingDraft,
  canExport = true,
}) => {
  const isPro = subscription?.isActive === true;

  const steps = [
    { step: 1, label: 'Scope' },
    { step: 2, label: 'Method' },
    { step: 3, label: 'Matrix' },
    { step: 4, label: 'Preview' },
    { step: 5, label: 'Alignment' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#0D0D0D]/95 backdrop-blur-xl no-print">
      {/* Main Bar */}
      <div className="flex h-14 sm:h-16 w-full items-center justify-between px-3 sm:px-6">
        {/* Brand Identity - Manchester Technologies Official */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C8A96A] via-[#D4B87A] to-[#A68B4F] p-[1.5px] shadow-lg shadow-[#C8A96A]/20 shrink-0">
            <div className="flex h-full w-full items-center justify-center rounded-[9px] sm:rounded-[10px] bg-[#0D0D0D]">
              <span className="font-heading font-black text-[#C8A96A] text-sm sm:text-lg tracking-tight">M</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 font-heading font-bold text-xs sm:text-sm tracking-tight text-white">
              <span>Manchester</span>
              <span className="text-[#C8A96A]">Tech</span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 leading-none mt-0.5">
              Exam Architect OS
            </p>
          </div>
        </div>

        {/* Desktop Workflow Navigation Stepper Tabs (Hidden on mobile, shown in 2nd row on mobile) */}
        <div className="hidden md:flex items-center gap-1 rounded-xl bg-[#141414] p-1 border border-white/5 overflow-x-auto">
          {steps.map((item, idx, arr) => {
            const isCurrent = currentStep === item.step;
            return (
              <React.Fragment key={item.step}>
                <button
                  onClick={() => onStepChange(item.step)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isCurrent
                      ? 'bg-[#C8A96A]/15 text-[#C8A96A] border border-[#C8A96A]/40 shadow-sm shadow-[#C8A96A]/10 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-[#C8A96A] text-[#0D0D0D]'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {item.step}
                  </span>
                  <span>{item.label}</span>
                </button>
                {idx < arr.length - 1 && <span className="text-white/20 text-xs">→</span>}
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Controls & User Account Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Save Draft Button (visible on step 4 & 5) */}
          {currentStep >= 4 && onSaveDraft && (
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

          {/* Export PDF Button (visible on step 4 & 5) */}
          {currentStep >= 4 && onExportPdf && (
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

      {/* Mobile Workflow Stepper Sub-Bar (Visible only on mobile/tablet) */}
      <div className="flex md:hidden items-center justify-between gap-1 overflow-x-auto px-3 py-2 border-t border-white/5 bg-[#111111] scrollbar-none">
        {steps.map((item) => {
          const isCurrent = currentStep === item.step;
          return (
            <button
              key={item.step}
              onClick={() => onStepChange(item.step)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 px-2 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap min-w-[62px] ${
                isCurrent
                  ? 'bg-[#C8A96A] text-[#0D0D0D] shadow-sm font-black'
                  : 'text-slate-400 hover:text-white bg-[#161616]'
              }`}
            >
              <span>{item.step}.</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
