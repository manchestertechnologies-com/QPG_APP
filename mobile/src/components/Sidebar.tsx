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
  School,
} from 'lucide-react';
import { StoredUser, StoredSubscription } from '../services/apiClient';

interface SidebarProps {
  activeView: 'generator' | 'history' | 'bank' | 'classrooms' | 'settings';
  onSelectView: (view: 'generator' | 'history' | 'bank' | 'classrooms' | 'settings') => void;
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
    { id: 'history', label: 'Saved Papers', icon: History },
    { id: 'bank', label: 'Question Bank', icon: BookOpen, badge: '79k+' },
    { id: 'classrooms', label: 'Classrooms & Exams', icon: School, badge: 'New' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="gp-sidebar hidden md:flex w-64 shrink-0 flex-col justify-between overflow-y-auto px-3 py-4 select-none no-print">
      {/* Navigation Links */}
      <div className="space-y-6">
        <div>
          <p className="gp-label px-3 pb-2">Workspace</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id as any)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`gp-nav-link justify-between whitespace-nowrap text-[13px] cursor-pointer ${isActive ? "active" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-ink text-gold-soft'
                          : 'bg-ink/[0.05] text-slate-500'
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
        <div className="glass-card p-3.5 border border-line bg-card">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Share2 className="h-4 w-4 text-gold" />
            <span className="font-heading">Refer Colleagues</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
            Invite fellow educators & earn <strong className="text-ink">1 free paper download</strong> per referral!
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">
              Credits: {user?.paperCredits || 0}
            </span>
            <button
              onClick={onOpenReferral}
              className="text-[11px] font-bold text-gold hover:text-bronze underline underline-offset-2"
            >
              Invite Now →
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Card & User Logout */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-card p-3.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Account Plan
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                isPro
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'bg-amber-500/20 text-amber-700 border border-amber-500/30'
              }`}
            >
              {isPro ? 'PRO ACTIVE' : 'FREE TRIAL'}
            </span>
          </div>

          <div className="mt-2 text-sm font-extrabold text-ink font-heading">
            {isPro ? '₹299 Pro Tier' : '1 Paper Free Trial'}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isPro
              ? '50 Swaps/Paper • Custom Branding'
              : 'Trial includes 1 full question paper'}
          </p>

          {!isPro && (
            <button
              onClick={onOpenUpgrade}
              className="glow-button mt-3 flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-ink cursor-pointer"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Upgrade Plan</span>
            </button>
          )}
        </div>

        <div className="gp-user flex items-center gap-3 p-3">
          <span className="gp-avatar grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs">
            {(user?.name || user?.email || '?')
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join('')}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{user?.name || user?.email}</span>
            <span className="block truncate text-xs text-slate-500">{user?.subject ? `${user.subject} faculty` : 'Teacher'}</span>
          </span>
          <button onClick={onLogout} className="gp-ghost-btn px-2.5 py-1.5 text-xs font-semibold cursor-pointer" title="Sign out">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
