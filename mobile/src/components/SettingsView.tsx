import React from 'react';
import { Settings, User, Crown, Gift, Copy, LogOut, CheckCircle2 } from 'lucide-react';
import { StoredUser, StoredSubscription } from '../services/apiClient';
import { useToast } from './Toast';

interface SettingsViewProps {
  user: StoredUser | null;
  subscription: StoredSubscription | null;
  onOpenUpgrade: () => void;
  onOpenReferral: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  subscription,
  onOpenUpgrade,
  onOpenReferral,
  onLogout,
}) => {
  const { success } = useToast();
  const isPro = subscription?.isActive === true;
  const inviteLink = `https://qpgapp-mobile.vercel.app/register?ref=${user?.id || 'educator'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    success('Link Copied', 'Referral URL copied to clipboard.');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
          <span>ACCOUNT SETTINGS</span>
        </div>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Faculty Account Profile
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">
          Manage credentials, faculty specialization, and cloud subscription status.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-white/10 bg-[#11141E] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/30 text-purple-300 font-extrabold text-base border border-purple-500/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
            </div>
            <div>
              <div className="text-base font-extrabold text-white">{user?.name || 'Faculty Member'}</div>
              <div className="text-xs text-slate-400">{user?.email || 'qpgtest@gmail.com'}</div>
            </div>
          </div>
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300 border border-purple-500/20">
            {user?.subject || 'Chemistry'} Specialization
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-bold">Institution</span>
            <span className="text-white font-semibold mt-0.5 block">{user?.institution || 'Manchester Technologies'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] uppercase font-bold">Account Role</span>
            <span className="text-white font-semibold mt-0.5 block capitalize">{user?.role || 'Educator'}</span>
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="rounded-2xl border border-white/10 bg-[#11141E] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white">Subscription & Plan Tier</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPro ? 'Active Pro Tier with 50 swaps/paper' : '1 Paper Free Trial mode'}
            </p>
          </div>
          <button
            onClick={onOpenUpgrade}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:bg-purple-500 transition-all cursor-pointer"
          >
            <Crown className="h-3.5 w-3.5" />
            <span>{isPro ? 'Change Plan' : 'Upgrade to Pro (₹299)'}</span>
          </button>
        </div>
      </div>

      {/* Referral Program Card */}
      <div className="rounded-2xl border border-white/10 bg-[#11141E] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white">Referral Program</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Available Credits: <strong className="text-emerald-400">{user?.paperCredits || 0} Downloads</strong>
            </p>
          </div>
          <button
            onClick={onOpenReferral}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161A26] px-4 py-2 text-xs font-bold text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <Gift className="h-3.5 w-3.5 text-purple-400" />
            <span>Refer Colleague</span>
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161A26] p-3 flex items-center justify-between text-xs">
          <span className="font-mono text-purple-300 truncate pr-3">{inviteLink}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-300 hover:text-white shrink-0 font-bold"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy</span>
          </button>
        </div>
      </div>

      {/* Sign Out */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>
    </div>
  );
};
