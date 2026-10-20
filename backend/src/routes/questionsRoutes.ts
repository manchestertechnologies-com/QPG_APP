import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { QuestionBankService } from '../services/questionBankService';
import { ClassLevel, DifficultyLevel } from '../types';

const router = Router();

// Apply authentication to all question routes
router.use(authMiddleware);

/**
 * Get distinct chapters for teacher's locked subject
 * Open to all registered teachers so they can configure paper syllabus
 */
router.get('/chapters', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const classLevel = (req.query.classLevel as ClassLevel) || 'both';

    // Strict subject isolation: always uses teacher's locked subject!
    const chapters = await QuestionBankService.getChapters(user.subject, classLevel);
    return res.json({ success: true, subject: user.subject, chapters });
  } catch (err: any) {
    console.error('Error fetching chapters:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * Get concept tags / topics dynamically for selected chapter
 */
router.get('/concepts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const chapter = req.query.chapter as string;
    const concepts = await QuestionBankService.getConceptTags(user.subject, chapter);
    return res.json({ success: true, subject: user.subject, concepts });
  } catch (err: any) {
    console.error('Error fetching concepts:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * Query alternative questions for in-place swapping
 */
router.get('/alternatives', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { chapter, excludeId, difficulty, qType, limit } = req.query;

    const alternatives = await QuestionBankService.getAlternativeQuestions(
      user.subject,
      (chapter as string) || 'General',
      (excludeId as string) || '',
      difficulty as DifficultyLevel,
      qType as string,
      limit ? parseInt(limit as string, 10) : 6
    );

    return res.json({
      success: true,
      subject: user.subject,
      alternatives,
    });
  } catch (err: any) {
    console.error('Error fetching alternatives:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

/**
 * Query questions with filters and pagination
 * Allows free browsing and searching of question bank
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      classLevel,
      chapter,
      topic,
      exam,
      qType,
      difficulty,
      search,
      limit,
      offset,
    } = req.query;

    // Strict subject isolation: always uses teacher's locked subject!
    const result = await QuestionBankService.queryQuestions({
      subject: user.subject,
      classLevel: (classLevel as ClassLevel) || 'both',
      chapter: chapter as string,
      topic: topic as string,
      exam: exam as string,
      qType: qType as string,
      difficulty: difficulty as DifficultyLevel,
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    return res.json({
      success: true,
      subject: user.subject,
      ...result,
    });
  } catch (err: any) {
    console.error('Error querying questions:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
});

export default router;
