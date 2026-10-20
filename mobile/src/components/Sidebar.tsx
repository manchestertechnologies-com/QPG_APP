import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  History,
  BookOpen,
  Settings,
  Crown,
  Share2,
  LogOut,
  FolderDown,
} from 'lucide-react';
import { StoredUser, StoredSubscription } from '../services/apiClient';

interface SidebarProps {
  activeView: 'generator' | 'history' | 'bank' | 'settings';
  onSelectView: (view: 'generator' | 'history' | 'bank' | 'settings') => void;
  user: StoredUser | null;
  subscription: StoredSubscription | null;
  onOpenUpgrade: () => void;
  onOpenReferral: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  user,
  subscription,
  onOpenUpgrade,
  onOpenReferral,
  onLogout,
}) => {
  const isPro = subscription?.isActive === true;

  const navItems = [
    { id: 'generator', label: 'Question Generator', icon: Sparkles, badge: 'Active' },
    { id: 'history', label: 'Exam History', icon: History },
    { id: 'bank', label: 'Question Bank', icon: BookOpen, badge: '89.2k' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between border-r border-white/10 bg-[#090A0F] p-4 select-none no-print">
      {/* Navigation Links */}
      <div className="space-y-6">
        <div>
          <div className="px-3 pb-2 text-[10px] font-extrabold tracking-wider text-slate-300 uppercase">
            Workspace
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id as any)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#161A26] text-purple-300 border border-purple-500/30 shadow-md'
                      : 'text-slate-400 hover:bg-[#11141E] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Referral Banner */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#11141E] to-[#161A26] p-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Share2 className="h-4 w-4 text-purple-400" />
            <span>Refer Colleagues</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            Invite fellow educators & earn <strong className="text-white">1 free paper download</strong> per referral!
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Credits: {user?.paperCredits || 0}
            </span>
            <button
              onClick={onOpenReferral}
              className="text-[11px] font-bold text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              Invite Now →
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Card & User Logout */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-[#11141E] p-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Account Plan
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                isPro
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isPro ? 'PRO ACTIVE' : 'FREE TRIAL'}
            </span>
          </div>

          <div className="mt-2 text-sm font-extrabold text-white">
            {isPro ? '₹299 Pro Tier' : '1 Paper Free Trial'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isPro
              ? '50 Swaps/Paper • Custom Branding'
              : 'Trial includes 1 full question paper'}
          </p>

          {!isPro && (
            <button
              onClick={onOpenUpgrade}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Upgrade Plan</span>
            </button>
          )}
        </div>

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/5 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
