import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Crown,
  Sparkles,
  QrCode,
  Copy,
  Clock,
  Send,
  CreditCard,
  Gift,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { api, StoredUser } from '../services/apiClient';
import { useToast } from './Toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StoredUser | null;
  onOpenReferral: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenReferral,
}) => {
  const { success, error, info } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'elite'>('elite');
  const [months, setMonths] = useState<number>(1);
  const [qrData, setQrData] = useState<{
    qrCodeDataUrl: string;
    amount: number;
    upiId: string;
    payeeName: string;
    upiIntentUri: string;
  } | null>(null);

  const [utr, setUtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(598); // 09:58 timer matching image!

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 600));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Fetch dynamic QR code whenever plan or months changes
  useEffect(() => {
    if (isOpen) {
      api
        .getSubscriptionQr(selectedPlan, months)
        .then((res) => {
          if (res && res.success) {
            setQrData(res);
          }
        })
        .catch((err) => {
          console.warn('Failed to generate dynamic QR:', err);
        });
    }
  }, [isOpen, selectedPlan, months]);

  if (!isOpen) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const inviteLink = `https://qpgapp-mobile.vercel.app/register?ref=${user?.id || 'demo'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    success('Invite Link Copied', 'Share this link with fellow educators to earn free paper downloads!');
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || utr.trim().length < 8) {
      error('Invalid UTR', 'Please enter the 12-digit transaction UTR from your UPI payment confirmation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitPayment(utr.trim().toUpperCase(), selectedPlan, qrData?.amount || 499);
      success(
        'Payment Submitted',
        'Your UTR has been submitted for instant verification. Access will activate shortly.'
      );
      setUtr('');
      onClose();
    } catch (err: any) {
      error('Submission Error', err.message || 'Failed to submit payment verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-200 no-print">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#090A0F] shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Upgrade Your Account
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Choose Your Plan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3-Column Plan & Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Card 1: Standard Plan (Starter ₹299) */}
          <div
            onClick={() => setSelectedPlan('starter')}
            className={`lg:col-span-4 flex flex-col justify-between rounded-2xl border p-5 transition-all cursor-pointer ${
              selectedPlan === 'starter'
                ? 'border-purple-500 bg-[#161A26] shadow-xl glow-purple'
                : 'border-white/10 bg-[#11141E] hover:border-white/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Standard Plan</span>
                <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                  Badge
                </span>
              </div>

              <div className="mt-3">
                <div className="text-lg font-extrabold text-white">Starter</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-white">₹299</span>
                  <span className="text-xs text-slate-400">/mo</span>
                </div>
                <div className="text-[10px] text-slate-500">$2.99/mo</div>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>50 paper downloads / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>50 edits/swaps per paper</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Custom faculty blueprint mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Custom institute header & crest</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className={`mt-6 w-full rounded-xl py-2 text-xs font-bold transition-all ${
                selectedPlan === 'starter'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {selectedPlan === 'starter' ? 'Selected' : 'Select'}
            </button>
          </div>

          {/* Card 2: Premium Plan (Pro ₹499) */}
          <div
            onClick={() => setSelectedPlan('elite')}
            className={`lg:col-span-4 relative flex flex-col justify-between rounded-2xl border p-5 transition-all cursor-pointer ${
              selectedPlan === 'elite'
                ? 'border-cyan-400 bg-gradient-to-b from-[#161A26] to-[#11141E] shadow-2xl glow-cyan ring-1 ring-cyan-400/50'
                : 'border-white/10 bg-[#11141E] hover:border-white/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">Premium Plan</span>
                <span className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-md">
                  Popular
                </span>
              </div>

              <div className="mt-3">
                <div className="text-lg font-extrabold text-white">Pro (Elite)</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-white">₹499</span>
                  <span className="text-xs text-slate-400">/mo</span>
                </div>
                <div className="text-[10px] text-slate-500">$4.99/mo</div>
              </div>

              <ul className="mt-5 space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Unlimited</strong> paper downloads
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Unlimited</strong> question swaps & edits
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Set P, Q, R, S</strong> shuffled series
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Multi-device cloud auto-sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Priority 24/7 faculty support</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className={`mt-6 w-full rounded-xl py-2 text-xs font-bold transition-all ${
                selectedPlan === 'elite'
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {selectedPlan === 'elite' ? 'Selected' : 'Select'}
            </button>
          </div>

          {/* Card 3: Checkout Panel */}
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#11141E] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-extrabold text-white uppercase tracking-wider mb-3">
                <span>Checkout</span>
                <span className="text-purple-400 font-bold">₹{qrData?.amount || 499}</span>
              </div>

              <div className="text-[11px] text-slate-400 text-center mb-3">
                Scan to Pay with UPI (GPay / PhonePe / Paytm)
              </div>

              {/* Dynamic QR Code Canvas */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-3.5 shadow-xl">
                {qrData?.qrCodeDataUrl ? (
                  <img
                    src={qrData.qrCodeDataUrl}
                    alt="UPI Payment QR Code"
                    className="h-36 w-36 object-contain"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}
                <div className="mt-1 text-[10px] font-extrabold text-slate-800 tracking-wider">
                  UPI: exam@okaxis
                </div>
              </div>

              {/* Timer matching Image 1 & 5 */}
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Expires in {formatTimer(secondsRemaining)}</span>
              </div>

              {/* Payment Methods Pill */}
              <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-slate-500">
                <span>BHIM UPI</span>
                <span>•</span>
                <span>GPay</span>
                <span>•</span>
                <span>PhonePe</span>
                <span>•</span>
                <span>Paytm</span>
              </div>

              {/* UTR Form */}
              <form onSubmit={handleSubmitUtr} className="mt-4 space-y-2">
                <input
                  type="text"
                  required
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Enter 12-digit UPI UTR / Ref"
                  className="w-full rounded-xl border border-white/10 bg-[#161A26] px-3.5 py-2 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none placeholder:text-slate-500 uppercase tracking-wider"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:bg-purple-500 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Submit UTR for Verification'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Banner: Refer & Earn (Matching Image 1 & 5) */}
        <div className="border-t border-white/10 bg-[#11141E] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-white">Refer & Earn</div>
              <div className="text-[11px] text-slate-400">
                Invite fellow educators & get <strong className="text-white">1 free paper download</strong> for every referral!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#161A26] px-3.5 py-2 text-xs font-bold text-slate-200 hover:border-white/20 transition-all"
            >
              <Copy className="h-3.5 w-3.5 text-purple-400" />
              <span>Copy Invite Link</span>
            </button>

            <button
              onClick={onOpenReferral}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 px-3.5 py-2 text-xs font-bold hover:bg-purple-500/30 transition-all"
            >
              <span>Refer Colleague Form →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
