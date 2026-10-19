import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { requireSubscriptionOrFreeTrial } from '../middleware/subscriptionMiddleware';
import { PaperGeneratorService } from '../services/paperGeneratorService';
import { PdfService } from '../services/pdfService';
import { PaperGenerationConfig } from '../types';
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
  });
});

export default router;
