import { db } from '../db/database';
import { Subscription, PaymentRequest } from '../types';
import { config } from '../config';

/**
 * Calculates calendar month addition accurately.
 * E.g., Jan 31 -> Feb 28 (or 29), Aug 31 -> Sep 30.
 */
export function addOneCalendarMonth(startDate: Date): Date {
  const currentDay = startDate.getDate();
  const currentMonth = startDate.getMonth(); // 0-indexed
  const currentYear = startDate.getFullYear();

  // Target month and year
  const targetMonth = (currentMonth + 1) % 12;
  const targetYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  // Max days in target month
  const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(currentDay, maxDaysInTargetMonth);

  const result = new Date(
    targetYear,
    targetMonth,
    targetDay,
    startDate.getHours(),
    startDate.getMinutes(),
    startDate.getSeconds(),
    startDate.getMilliseconds()
  );

  return result;
}

export class SubscriptionService {
  /**
   * Retrieves current subscription status and remaining validity
   */
  public static getStatus(userId: string): {
    hasSubscription: boolean;
    isActive: boolean;
    status: 'active' | 'expired' | 'none';
    plan: string;
    amount: number;
    startedAt: string | null;
    expiresAt: string | null;
    daysRemaining: number;
    hoursRemaining: number;
    formattedExpiry: string | null;
  } {
    const sub = db.getSubscriptionByUserId(userId);
    if (!sub || !sub.expires_at) {
      return {
        hasSubscription: false,
        isActive: false,
        status: 'none',
        plan: 'Free Trial / Inactive',
        amount: config.subscriptionPrice,
        startedAt: null,
        expiresAt: null,
        daysRemaining: 0,
        hoursRemaining: 0,
        formattedExpiry: null,
      };
    }

    const now = Date.now();
    const expiryTime = new Date(sub.expires_at).getTime();
    const isStillActive = sub.status === 'active' && now < expiryTime;

    const msRemaining = Math.max(0, expiryTime - now);
    const hoursRemaining = Math.floor(msRemaining / (1000 * 60 * 60));
    const daysRemaining = Math.floor(hoursRemaining / 24);

    // Format in Asia/Kolkata timezone
    const formattedExpiry = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(sub.expires_at));

    return {
      hasSubscription: true,
      isActive: isStillActive,
      status: isStillActive ? 'active' : 'expired',
      plan: sub.plan_name,
      amount: sub.amount,
      startedAt: sub.started_at,
      expiresAt: sub.expires_at,
      daysRemaining,
      hoursRemaining,
      formattedExpiry,
    };
  }

  /**
   * Activates or extends a 1-month subscription upon admin verification
   */
  public static async activateSubscription(
    userId: string,
    utr: string,
    adminEmail: string
  ): Promise<Subscription> {
    const user = db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existingSub = db.getSubscriptionByUserId(userId);
    const now = new Date();
    let startDate = now;

    // If already active, extend from current expiry date
    if (existingSub && existingSub.status === 'active' && existingSub.expires_at) {
      const currentExpiry = new Date(existingSub.expires_at);
      if (currentExpiry.getTime() > now.getTime()) {
        startDate = currentExpiry;
      }
    }

    const expiryDate = addOneCalendarMonth(startDate);

    const subscription: Subscription = {
      id: existingSub?.id || 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: userId,
      plan_name: 'Premium Monthly',
      amount: config.subscriptionPrice,
      status: 'active',
      started_at: (existingSub?.started_at && existingSub.status === 'active') ? existingSub.started_at : now.toISOString(),
      expires_at: expiryDate.toISOString(),
      payment_reference: utr,
      created_at: existingSub?.created_at || now.toISOString(),
      updated_at: now.toISOString(),
    };

    await db.createOrUpdateSubscription(subscription);

    await db.logAudit('SUBSCRIPTION_ACTIVATED', adminEmail, {
      userId,
      userEmail: user.email,
      utr,
      expiresAt: subscription.expires_at,
    });

    return subscription;
  }

  /**
   * Submits a payment verification request
   */
  public static async submitPaymentRequest(
    userId: string,
    utr: string,
    paymentTime: string,
    note?: string
  ): Promise<PaymentRequest> {
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');

    const cleanUtr = utr.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 8) {
      throw new Error('Please enter a valid 12-digit UPI reference (UTR) number');
    }

    const request: PaymentRequest = {
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: userId,
      user_email: user.email,
      user_subject: user.subject,
      amount: config.subscriptionPrice,
      utr: cleanUtr,
      payment_time: paymentTime || new Date().toISOString(),
      note: note || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await db.createPaymentRequest(request);
    await db.logAudit('PAYMENT_SUBMITTED', user.email, {
      paymentId: request.id,
      utr: cleanUtr,
      amount: config.subscriptionPrice,
    });

    return request;
  }

  /**
   * Admin approves payment
   */
  public static async approvePayment(paymentId: string, adminEmail: string): Promise<{
    payment: PaymentRequest;
    subscription: Subscription;
  }> {
    const payment = db.getPaymentRequestById(paymentId);
    if (!payment) throw new Error('Payment request not found');
    if (payment.status === 'approved') throw new Error('Payment request is already approved');

    payment.status = 'approved';
    payment.verified_by = adminEmail;
    payment.verified_at = new Date().toISOString();
    await db.updatePaymentRequest(payment);

    const subscription = await this.activateSubscription(payment.user_id, payment.utr, adminEmail);

    return { payment, subscription };
  }

  /**
   * Admin rejects payment
   */
  public static async rejectPayment(
    paymentId: string,
    reason: string,
    adminEmail: string
  ): Promise<PaymentRequest> {
    const payment = db.getPaymentRequestById(paymentId);
    if (!payment) throw new Error('Payment request not found');

    payment.status = 'rejected';
    payment.rejection_reason = reason;
    payment.verified_by = adminEmail;
    payment.verified_at = new Date().toISOString();
    await db.updatePaymentRequest(payment);

    await db.logAudit('PAYMENT_REJECTED', adminEmail, {
      paymentId,
      userEmail: payment.user_email,
      reason,
    });

    return payment;
  }
}
