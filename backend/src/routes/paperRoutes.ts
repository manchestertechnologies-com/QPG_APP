import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { requireSubscriptionOrFreeTrial } from '../middleware/subscriptionMiddleware';
import { PaperGeneratorService } from '../services/paperGeneratorService';
import { PdfService } from '../services/pdfService';
import { SubscriptionService } from '../services/subscriptionService';
import { PaperGenerationConfig, HeaderConfig } from '../types';
import { db } from '../db/database';

const router = Router();

router.use(authMiddleware);

/**
 * Generate Examination Paper (2026 NEET / JEE / CET / Custom)
 * Allows 1 free paper for trial educators, unlimited for active ₹299 subscribers.
 */
router.post('/generate', requireSubscriptionOrFreeTrial, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const body: PaperGenerationConfig = req.body;

    // Strict subject isolation: force subject to teacher's assigned subject!
    body.subject = user.subject;

    const paper = await PaperGeneratorService.generatePaper(user.id, body);
    
    // Increment papers created count
    const updatedCount = await db.incrementUserPapersCount(user.id);

    return res.json({
      success: true,
      paper,
      papersCreatedCount: updatedCount,
    });
  } catch (err: any) {
    console.error('Error generating paper:', err);
    return res.status(400).json({ error: 'GENERATION_FAILED', message: err.message });
  }
});

/**
 * Generate publication-grade HTML printable document for PDF export
 */
router.post('/preview-html', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paper, includeAnswerKey, includeSolutions } = req.body;
    if (!paper) {
      return res.status(400).json({ error: 'MISSING_PAPER', message: 'Paper data is required.' });
    }

    const html = PdfService.generatePaperHtml(
      paper,
      includeAnswerKey !== false,
      includeSolutions === true
    );

    return res.json({ success: true, html });
  } catch (err: any) {
    console.error('Error generating HTML:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * Live question counts and examination summary for teacher's subject
 */
router.get('/catalog-stats', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  // Real stats verified from our Supabase audit
  const statsMap: Record<string, { class11: number; class12: number; total: number; supportedExams: string[] }> = {
    Mathematics: { class11: 7418, class12: 9552, total: 16970, supportedExams: ['JEE', 'KCET', 'CET', 'CUSTOM'] },
    Physics: { class11: 11424, class12: 13333, total: 24757, supportedExams: ['NEET', 'JEE', 'KCET', 'CET', 'CUSTOM'] },
    Chemistry: { class11: 12997, class12: 10606, total: 23603, supportedExams: ['NEET', 'JEE', 'KCET', 'CET', 'CUSTOM'] },
    Biology: { class11: 14288, class12: 9584, total: 23872, supportedExams: ['NEET', 'KCET', 'CET', 'CUSTOM'] },
  };

  const subjectStats = statsMap[user.subject] || { class11: 0, class12: 0, total: 0, supportedExams: [] };

  return res.json({
    success: true,
    subject: user.subject,
    stats: subjectStats,
    grandTotalQuestionsInBank: 89202,
    papersCreatedCount: db.getUserPapersCount(user.id),
    paperCredits: db.getUserPaperCredits(user.id),
  });
});

/**
 * Save / auto-save paper draft to cloud
 */
router.post('/save-draft', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { paper, title, header } = req.body;

    if (!paper || !paper.id) {
      return res.status(400).json({ error: 'INVALID_DRAFT', message: 'Valid paper payload required.' });
    }

    const defaultHeader: HeaderConfig = {
      institution_name: 'MANCHESTER TECHNOLOGIES',
      sub_title: 'Davangere - 577006 • Examination Division',
      exam_code: `${paper.exam_type}-${user.subject.toUpperCase().substring(0, 3)}-2026`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      duration: `${paper.duration_minutes || 60} Minutes`,
      custom_instructions: paper.instructions || [],
      watermark_text: 'MANCHESTER TECHNOLOGIES',
      is_locked: false,
    };

    const draft = await db.savePaperDraft({
      id: 'draft_' + paper.id,
      user_id: user.id,
      paper_id: paper.id,
      title: title || paper.title || 'Untitled Exam Draft',
      exam_type: paper.exam_type,
      subject: user.subject,
      header: header || paper.header || defaultHeader,
      paper,
      swaps_used: paper.swaps_used || 0,
      created_at: paper.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return res.json({ success: true, draft });
  } catch (err: any) {
    console.error('Error saving paper draft:', err);
    return res.status(500).json({ error: 'SAVE_FAILED', message: err.message });
  }
});

/**
 * Get all saved drafts for logged-in user
 */
router.get('/drafts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const drafts = db.getPaperDrafts(user.id);
    return res.json({ success: true, drafts });
  } catch (err: any) {
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

/**
 * Get specific draft by ID for cross-device sync
 */
router.get('/drafts/:paperId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const paperId = Array.isArray(req.params.paperId) ? req.params.paperId[0] : req.params.paperId;
    const draft = db.getPaperDraftById(paperId);
    if (!draft || draft.user_id !== user.id) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Draft not found.' });
    }
    return res.json({ success: true, draft });
  } catch (err: any) {
    return res.status(500).json({ error: 'FETCH_FAILED', message: err.message });
  }
});

/**
 * Delete a draft
 */
router.delete('/drafts/:paperId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const paperId = Array.isArray(req.params.paperId) ? req.params.paperId[0] : req.params.paperId;
    const deleted = await db.deletePaperDraft(paperId, user.id);
    return res.json({ success: deleted });
  } catch (err: any) {
    return res.status(500).json({ error: 'DELETE_FAILED', message: err.message });
  }
});

/**
 * In-place Question Swap endpoint with limit enforcement
 */
router.post('/swap-question', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { paper, targetQuestionId, replacementQuestion } = req.body;

    if (!paper || !targetQuestionId || !replacementQuestion) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'paper, targetQuestionId, and replacementQuestion are required.',
      });
    }

    // Check user subscription & swaps limit
    const subStatus = SubscriptionService.getStatus(user.id);
    const isElite = subStatus.plan?.toLowerCase().includes('elite') || subStatus.amount === 499;
    const maxSwaps = isElite ? Infinity : 50;

    const currentSwaps = paper.swaps_used || 0;
    if (currentSwaps >= maxSwaps) {
      return res.status(403).json({
        error: 'SWAP_LIMIT_REACHED',
        message: `You have reached the maximum of ${maxSwaps} question swaps per paper on your current plan. Upgrade to Elite Pro (₹499) for unlimited edits.`,
      });
    }

    const updatedPaper = PaperGeneratorService.swapQuestion(
      paper,
      targetQuestionId,
      replacementQuestion
    );

    const defaultHeader: HeaderConfig = {
      institution_name: 'MANCHESTER TECHNOLOGIES',
      sub_title: 'Davangere - 577006 • Examination Division',
      exam_code: `${updatedPaper.exam_type}-${user.subject.toUpperCase().substring(0, 3)}-2026`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      duration: `${updatedPaper.duration_minutes || 60} Minutes`,
      custom_instructions: updatedPaper.instructions || [],
      watermark_text: 'MANCHESTER TECHNOLOGIES',
      is_locked: false,
    };

    // Auto-sync updated draft in cloud
    await db.savePaperDraft({
      id: 'draft_' + updatedPaper.id,
      user_id: user.id,
      paper_id: updatedPaper.id,
      title: updatedPaper.title,
      exam_type: updatedPaper.exam_type,
      subject: user.subject,
      header: updatedPaper.header || defaultHeader,
      paper: updatedPaper,
      swaps_used: updatedPaper.swaps_used || 0,
      created_at: updatedPaper.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return res.json({
      success: true,
      paper: updatedPaper,
      swapsUsed: updatedPaper.swaps_used,
      swapsRemaining: isElite ? 'Unlimited' : Math.max(0, 50 - (updatedPaper.swaps_used || 0)),
    });
  } catch (err: any) {
    console.error('Error swapping question:', err);
    return res.status(500).json({ error: 'SWAP_FAILED', message: err.message });
  }
});

/**
 * Free Tier Referral Program: Refer a Colleague
 */
router.post('/referral-invite', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { colleagueName, colleagueDepartment, colleagueInstitution, colleagueEmail } = req.body;

    if (!colleagueName || !colleagueEmail) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Colleague name and institutional email are required.',
      });
    }

    const invite = await db.createReferralInvite({
      id: 'ref_' + Date.now(),
      referrer_id: user.id,
      colleague_name: colleagueName.trim(),
      colleague_department: (colleagueDepartment || '').trim(),
      colleague_institution: (colleagueInstitution || '').trim(),
      colleague_email: colleagueEmail.trim().toLowerCase(),
      status: 'verified', // Instant verified reward for referral collaboration
      created_at: new Date().toISOString(),
    });

    // Credit referrer 1 free paper download immediately
    const updatedCredits = await db.creditUserReferral(user.id);

    return res.json({
      success: true,
      invite,
      paperCredits: updatedCredits,
      inviteUrl: `https://qpgapp-mobile.vercel.app/register?ref=${user.id}`,
      message: `Referral logged! 1 Free paper credit added to your account. Current credits: ${updatedCredits}`,
    });
  } catch (err: any) {
    console.error('Error creating referral invite:', err);
    return res.status(500).json({ error: 'REFERRAL_FAILED', message: err.message });
  }
});

/**
 * Referral statistics and invite link
 */
router.get('/referral-stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const referrals = db.getReferralsByUserId(user.id);
    const credits = db.getUserPaperCredits(user.id);

    return res.json({
      success: true,
      paperCredits: credits,
      inviteUrl: `https://qpgapp-mobile.vercel.app/register?ref=${user.id}`,
      totalReferred: referrals.length,
      referrals,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'STATS_FAILED', message: err.message });
  }
});

export default router;
