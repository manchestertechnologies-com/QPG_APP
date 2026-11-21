import React, { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ExamPhase, PHASE_LABEL, PHASE_STYLE } from '../../services/classroomApi';

export const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#C8A96A] focus:outline-none transition-colors';

export const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#1A1A1A] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-white/25 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export const dangerButton =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer disabled:opacity-50';

export const primaryButton =
  'glow-button inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#0D0D0D] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

export const Modal: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}> = ({ title, subtitle, onClose, children, footer, wide }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 no-print" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#141414] shadow-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-white font-heading">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-white/5 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-medium text-slate-300">{label}</span>
    {children}
    {hint && <span className="block text-[10px] leading-snug text-slate-500">{hint}</span>}
  </label>
);

export const PhaseBadge: React.FC<{ phase: ExamPhase }> = ({ phase }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${PHASE_STYLE[phase]}`}>
    {phase === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
    {PHASE_LABEL[phase]}
  </span>
);

export const Spinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>{label || 'Loading...'}</span>
  </div>
);

export const StatTile: React.FC<{ label: string; value: React.ReactNode; tone?: 'gold' | 'green' | 'red' | 'plain' }> = ({ label, value, tone = 'plain' }) => (
  <div className="rounded-xl border border-white/5 bg-[#1A1A1A] p-3">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
    <div
      className={`mt-1 text-lg font-extrabold font-heading tabular-nums ${
        tone === 'gold' ? 'text-[#C8A96A]' : tone === 'green' ? 'text-emerald-300' : tone === 'red' ? 'text-rose-300' : 'text-white'
      }`}
    >
      {value}
    </div>
  </div>
);
