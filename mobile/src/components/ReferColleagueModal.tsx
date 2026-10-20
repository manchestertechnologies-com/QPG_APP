import React, { useState } from 'react';
import { X, Gift, Users, Send, CheckCircle2, Copy } from 'lucide-react';
import { api, StoredUser } from '../services/apiClient';
import { useToast } from './Toast';

interface ReferColleagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StoredUser | null;
  onSuccess: (newCredits: number) => void;
}

export const ReferColleagueModal: React.FC<ReferColleagueModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const inviteLink = `https://qpgapp-mobile.vercel.app/register?ref=${user?.id || 'educator'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    success('Link Copied', 'Invite URL copied to clipboard.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      error('Missing Information', 'Please provide colleague name and institutional email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.referColleague({
        colleagueName: name,
        colleagueDepartment: department,
        colleagueInstitution: institution,
        colleagueEmail: email,
      });

      success(
        'Colleague Referral Logged!',
        `1 Free Paper Credit added to your account! Current balance: ${res.paperCredits || 1}.`
      );
      if (res.paperCredits !== undefined) {
        onSuccess(res.paperCredits);
      }
      onClose();
    } catch (err: any) {
      error('Referral Failed', err.message || 'Could not log referral.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200 no-print">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#11141E] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5 bg-[#090A0F]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Refer a Faculty Colleague</h2>
              <p className="text-xs text-slate-400">
                1 Verified Referral = 1 Full Paper Generation & Clean PDF Download
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Colleague Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Ramesh Rao"
              className="w-full rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Department / Role
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Chemistry HOD"
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Institution / College
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. PU College, Bangalore"
                className="w-full rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Institutional Email ID *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ramesh.rao@college.edu.in"
              className="w-full rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Shareable Link Box */}
          <div className="rounded-xl border border-white/10 bg-[#161A26] p-3 flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Personal Referral Link:</span>
              <span className="text-xs font-mono text-purple-300 truncate">{inviteLink}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs font-bold text-white transition-all shrink-0"
            >
              <Copy className="h-3.5 w-3.5 text-purple-400" />
              <span>Copy</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-[#161A26] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Logging...' : 'Submit Referral & Get Credit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
