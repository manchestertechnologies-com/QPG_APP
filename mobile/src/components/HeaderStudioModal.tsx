import React, { useState } from 'react';
import { X, Building2, Upload, Lock, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { useToast } from './Toast';

export interface HeaderConfigState {
  institution_name: string;
  sub_title: string;
  exam_code: string;
  date: string;
  duration: string;
  custom_instructions: string[];
  logo_url?: string;
  watermark_text?: string;
  is_locked: boolean;
}

interface HeaderStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  headerConfig: HeaderConfigState;
  onSave: (config: HeaderConfigState) => void;
  isPro: boolean;
  onOpenUpgrade: () => void;
}

export const HeaderStudioModal: React.FC<HeaderStudioModalProps> = ({
  isOpen,
  onClose,
  headerConfig,
  onSave,
  isPro,
  onOpenUpgrade,
}) => {
  const { success, warning } = useToast();
  const [form, setForm] = useState<HeaderConfigState>({ ...headerConfig });
  const [rawInstructions, setRawInstructions] = useState(
    headerConfig.custom_instructions.join('\n')
  );

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) {
      warning('Pro Feature', 'Custom institute logo branding requires an active Pro subscription.');
      onOpenUpgrade();
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setForm((prev) => ({
          ...prev,
          logo_url: base64,
          watermark_text: prev.institution_name,
        }));
        success('Logo Uploaded', 'Your logo will now render in the exam header and background watermark.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!isPro) {
      // Locked read-only state for free tier
      onClose();
      return;
    }

    const instructions = rawInstructions
      .split('\n')
      .map((i) => i.trim())
      .filter(Boolean);

    const updated = {
      ...form,
      custom_instructions: instructions,
    };
    onSave(updated);
    success('Header Customizer Saved', 'A4 examination header and watermark updated.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200 no-print">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#11141E] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5 bg-[#090A0F]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Header & Branding Studio</h2>
              <p className="text-xs text-slate-400">
                Custom institute credentials, crest, and diagonal watermark
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Tier Lock Notice */}
        {!isPro && (
          <div className="flex items-center justify-between bg-amber-500/10 border-b border-amber-500/20 px-5 py-3">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
              <Lock className="h-4 w-4" />
              <span>Free Tier: Header is locked to Manchester Technologies platform watermark.</span>
            </div>
            <button
              onClick={onOpenUpgrade}
              className="text-xs font-bold text-amber-400 hover:underline"
            >
              Unlock Pro Customizer →
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Institute Name & Logo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Institute / College Name
              </label>
              <input
                type="text"
                disabled={!isPro}
                value={form.institution_name}
                onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none disabled:opacity-60"
                placeholder="e.g. SRI CHAITANYA PU COLLEGE"
              />
            </div>

            {/* Logo Upload Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Institute Crest
              </label>
              <div className="relative">
                <label
                  className={`flex h-[42px] items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-[#161A26] px-3 text-xs font-semibold text-slate-300 transition-all ${
                    isPro ? 'cursor-pointer hover:border-purple-500 hover:bg-[#1F2433]' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <Upload className="h-4 w-4 text-purple-400" />
                  <span className="truncate">{form.logo_url ? 'Replace Logo' : 'Upload PNG'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!isPro}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Subtitle & Exam Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Sub-Title / Campus City
              </label>
              <input
                type="text"
                disabled={!isPro}
                value={form.sub_title}
                onChange={(e) => setForm({ ...form, sub_title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none disabled:opacity-60"
                placeholder="e.g. Davangere - 577006 • NEET Model Paper"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Exam Code / Series
              </label>
              <input
                type="text"
                disabled={!isPro}
                value={form.exam_code}
                onChange={(e) => setForm({ ...form, exam_code: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none disabled:opacity-60"
                placeholder="e.g. NEET-CHEM-2026-A"
              />
            </div>
          </div>

          {/* Date & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Examination Date
              </label>
              <input
                type="text"
                disabled={!isPro}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none disabled:opacity-60"
                placeholder="e.g. 25 Oct 2026"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Duration String
              </label>
              <input
                type="text"
                disabled={!isPro}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none disabled:opacity-60"
                placeholder="e.g. 50 Minutes"
              />
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Custom Examination Instructions (1 per line)
            </label>
            <textarea
              rows={4}
              disabled={!isPro}
              value={rawInstructions}
              onChange={(e) => setRawInstructions(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#161A26] p-3 text-xs font-medium text-white focus:border-purple-500 focus:outline-none disabled:opacity-60 leading-relaxed font-mono"
              placeholder="Enter instructions..."
            />
          </div>

          {/* Watermark Preview */}
          <div className="rounded-xl border border-white/10 bg-[#161A26] p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">A4 Diagonal Watermark</span>
              <span className="text-[11px] text-slate-400">
                {isPro
                  ? `Active watermark: "${form.institution_name}" (12% opacity)`
                  : 'Free watermark: "MANCHESTER TECHNOLOGIES" (8% opacity)'}
              </span>
            </div>
            <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">
              {isPro ? 'Pro Custom' : 'Default Platform'}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 p-5 bg-[#090A0F]">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1F2433] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Apply Header Branding</span>
          </button>
        </div>
      </div>
    </div>
  );
};
