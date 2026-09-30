import { Router, Response } from 'express';
import { sendError, sendSuccess } from '../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { RecommendationService } from '../services/recommendation.service';

const router = Router();

// GET personalized activity recommendations for the logged-in student
router.get(
  '/',
  authenticateToken,
  requireRole(['STUDENT']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const studentId = req.user?.studentId;
      if (!studentId) {
        sendError(res, 'Student profile not linked', 400);
        return;
      }

      const recommendations = await RecommendationService.getRecommendationsForStudent(studentId);
      sendSuccess(res, recommendations);
    } catch (err) {
      console.error('[Recommendations Error]', err);
      sendError(res, 'Failed to generate recommendations', 500);
    }
  }
);

export default router;
