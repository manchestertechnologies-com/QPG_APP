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

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#090A0F]/95 px-6 backdrop-blur-xl no-print">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20">
          <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#090A0F]">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white">
              MANCHESTER TECHNOLOGIES
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400">
            Question Paper Generator
          </p>
        </div>
      </div>

      {/* Workflow Navigation Stepper Tabs (5 Steps) */}
      <div className="flex items-center gap-1 rounded-xl bg-[#11141E] p-1 border border-white/10 overflow-x-auto max-w-full">
        {[
          { step: 1, label: 'Scope' },
          { step: 2, label: 'Method' },
          { step: 3, label: 'Matrix' },
          { step: 4, label: 'Preview' },
          { step: 5, label: 'Alignment' },
        ].map((item, idx, arr) => {
          const isCurrent = currentStep === item.step;
          return (
            <React.Fragment key={item.step}>
              <button
                onClick={() => onStepChange(item.step)}
                className={`flex items-center gap-1.5 rounded-lg px-2 sm:px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">
                  {item.step}
                </span>
                <span>{item.label}</span>
              </button>
              {idx < arr.length - 1 && <span className="text-white/20 text-xs hidden sm:inline">→</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Action Controls & User Account Pill */}
      <div className="flex items-center gap-2.5">
        {/* Save Draft Button (visible on step 4 & 5) */}
        {currentStep >= 4 && onSaveDraft && (
          <button
            onClick={onSaveDraft}
            disabled={isSavingDraft}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161A26] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-white/20 hover:bg-[#1F2433] transition-all whitespace-nowrap cursor-pointer"
          >
            {isSavingDraft ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
            ) : (
              <Save className="h-3.5 w-3.5 text-purple-400" />
            )}
            <span className="hidden sm:inline">{isSavingDraft ? 'Syncing...' : 'Save Draft'}</span>
          </button>
        )}

        {/* Publish / Export PDF Button (visible on step 4 & 5) */}
        {currentStep >= 4 && onExportPdf && (
          <button
            onClick={onExportPdf}
            disabled={!canExport}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        )}

        {/* Plan Status & Upgrade Trigger */}
        <button
          onClick={onOpenUpgrade}
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
            isPro
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20'
          }`}
        >
          <Crown className={`h-3.5 w-3.5 ${isPro ? 'text-emerald-400' : 'text-purple-400'}`} />
          <span>{isPro ? 'PRO ACTIVE' : 'UPGRADE TO PRO'}</span>
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#11141E] px-3 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/30 text-purple-300 text-xs font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-white leading-tight">
              {user?.name || user?.email?.split('@')[0] || 'Faculty'}
            </div>
            <div className="text-[10px] font-medium text-slate-400">
              {user?.subject || 'Chemistry'} Faculty
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
