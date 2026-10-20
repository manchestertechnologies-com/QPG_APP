import { Router, Response } from 'express';
import QRCode from 'qrcode';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { SubscriptionService } from '../services/subscriptionService';
import { config } from '../config';
import { db } from '../db/database';

const router = Router();

router.use(authMiddleware);

/**
 * Get current user subscription status
 */
router.get('/status', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const status = SubscriptionService.getStatus(user.id);
  return res.json({ success: true, ...status });
});

/**
 * Get UPI QR Code and Payment Intent
 */
router.get('/qr', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const planQuery = (req.query.plan as string) || 'starter';
  const months = parseInt(req.query.months as string, 10) || 1;

  let amount = 299;
  let planName = 'Normal Pro';
  let swapsLimit = 50;

  if (planQuery === 'elite' || planQuery === 'pro_499') {
    amount = 499;
    planName = 'Elite Pro';
    swapsLimit = Infinity;
  } else {
    // Normal Pro pricing tiers
    if (months === 3) amount = 799;
    else if (months === 6) amount = 1699;
    else if (months === 12) amount = 3300;
    else amount = 299;
  }

  const upiId = 'exam@okaxis';
  const payeeName = 'Manchester Technologies';

  // Standard UPI URI format
  // upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(`QPG ${planName} (${months}mo) - ${user.email}`)}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(upiIntentUri, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#090A0F',
        light: '#ffffff',
      },
    });

    return res.json({
      success: true,
      amount,
      currency: 'INR',
      planName,
      tier: planQuery === 'elite' ? 'elite' : 'starter',
      duration: `${months} Calendar Month${months > 1 ? 's' : ''}`,
      upiId,
      payeeName,
      upiIntentUri,
      qrCodeDataUrl,
      swapsLimit: isFinite(swapsLimit) ? swapsLimit : 'Unlimited',
      instructions: [
        `Scan the QR code using any UPI App (GPay, PhonePe, Paytm, BHIM, Cred) to pay exam@okaxis.`,
        `Pay the exact subscription amount of ₹${amount}.`,
        'Copy the 12-digit UPI Reference Number / UTR from the payment confirmation screen.',
        'Submit the 12-digit UTR below for immediate admin verification.',
      ],
    });
  } catch (err: any) {
    console.error('Error generating QR code:', err);
    return res.status(500).json({ error: 'QR_GENERATION_FAILED', message: err.message });
  }
});

/**
 * Submit / verify UPI payment details (hits /api/payments/verify or /api/subscription/submit-payment)
 */
router.post(['/submit-payment', '/verify'], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { utr, paymentTime, note, plan, amount } = req.body;

    if (!utr || typeof utr !== 'string') {
      return res.status(400).json({
        error: 'INVALID_UTR',
        message: 'Please provide the 12-digit UPI transaction reference (UTR).',
      });
    }

    const cleanUtr = utr.trim().toUpperCase();
    if (cleanUtr.length < 8) {
      return res.status(400).json({
        error: 'INVALID_UTR',
        message: 'UPI Reference (UTR) must be at least 8-12 alphanumeric characters.',
      });
    }

    const request = await SubscriptionService.submitPaymentRequest(
      user.id,
      cleanUtr,
      paymentTime || new Date().toISOString(),
      `Plan: ${plan || 'Pro'} | Amount: ₹${amount || 299} | ${note || ''}`
    );

    return res.json({
      success: true,
      message: 'Payment verification submitted. Your subscription will be approved shortly by admin.',
      request,
    });
  } catch (err: any) {
    console.error('Error submitting payment:', err);
    return res.status(500).json({ error: 'SUBMISSION_FAILED', message: err.message });
  }
});

/**
 * Phase 2: Razorpay Webhook listener placeholder
 */
router.post('/webhooks/razorpay', async (req, res) => {
  // Plug-in ready for Phase 2 automated gateway verification
  return res.json({ received: true, status: 'Webhook received. Ready for Phase 2.' });
});

/**
 * Get user's payment submission history
 */
router.get('/my-requests', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const allRequests = db.getPaymentRequests();
  const userRequests = allRequests.filter((p) => p.user_id === user.id);

  return res.json({ success: true, requests: userRequests });
});

export default router;
