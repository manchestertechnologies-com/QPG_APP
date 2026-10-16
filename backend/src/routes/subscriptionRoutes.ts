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
  const amount = config.subscriptionPrice;
  const upiId = config.upiId;
  const payeeName = config.upiPayeeName;

  // Standard UPI URI format
  // upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(`QPG 1-Month Subscription - ${user.email}`)}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(upiIntentUri, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return res.json({
      success: true,
      amount,
      currency: 'INR',
      planName: 'Premium Monthly',
      duration: '1 Calendar Month',
      upiId,
      payeeName,
      upiIntentUri,
      qrCodeDataUrl,
      instructions: [
        'Scan the QR code using any UPI App (GPay, PhonePe, Paytm, BHIM, Cred).',
        `Pay the exact subscription amount of ₹${amount}.`,
        'Copy the 12-digit UPI Reference Number / UTR from the payment confirmation screen.',
        'Submit the 12-digit UTR in the form below for verification.',
        'Your 1-month premium access will be activated upon admin confirmation.',
      ],
    });
  } catch (err: any) {
    console.error('Error generating QR code:', err);
    return res.status(500).json({ error: 'QR_GENERATION_FAILED', message: err.message });
  }
});

/**
 * Submit UPI payment details for verification
 */
router.post('/submit-payment', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { utr, paymentTime, note } = req.body;

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
      note
    );

    return res.json({
      success: true,
      message: 'Payment verification request submitted successfully. Admin will verify shortly.',
      paymentRequest: request,
    });
  } catch (err: any) {
    console.error('Error submitting payment:', err);
    return res.status(400).json({ error: 'SUBMISSION_FAILED', message: err.message });
  }
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
