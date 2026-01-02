import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

/**
 * Get all reviews for a specific module
 * GET /api/modules/:moduleCode/reviews
 */
export async function getModuleReviews(req: Request, res: Response): Promise<void> {
  try {
    const { moduleCode } = req.params;
    if (!moduleCode) {
      res.status(400).json({ error: 'Module code is required' });
      return;
    }
    
    const reviews = await prisma.moduleReview.findMany({
      where: { moduleCode: moduleCode.toUpperCase() },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { helpfulCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Aggregate assessment weightage from all reviews
    const aggregatedWeightage: Record<string, number[]> = {};
    reviews.forEach(review => {
      if (review.assessmentWeightage && typeof review.assessmentWeightage === 'object') {
        const weightage = review.assessmentWeightage as Record<string, number>;
        Object.entries(weightage).forEach(([key, value]) => {
          if (!aggregatedWeightage[key]) {
            aggregatedWeightage[key] = [];
          }
          aggregatedWeightage[key].push(value);
        });
      }
    });

    // Calculate average weightage for each assessment type
    const averageWeightage: Record<string, number> = {};
    Object.entries(aggregatedWeightage).forEach(([key, values]) => {
      averageWeightage[key] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    });

    res.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      averageWeightage,
    });
  } catch (error) {
    logger.error('Error fetching module reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

/**
 * Create a new review for a module
 * POST /api/modules/:moduleCode/reviews
 */
export async function createModuleReview(req: Request, res: Response): Promise<void> {
  try {
    const { moduleCode } = req.params;
    if (!moduleCode) {
      res.status(400).json({ error: 'Module code is required' });
      return;
    }
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { rating, content, assessmentWeightage, term } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    // Check if user already reviewed this module
    const existingReview = await prisma.moduleReview.findUnique({
      where: {
        moduleCode_userId: {
          moduleCode: moduleCode.toUpperCase(),
          userId,
        },
      },
    });

    if (existingReview) {
      res.status(409).json({ error: 'You have already reviewed this module. Use PUT to update.' });
      return;
    }

    const review = await prisma.moduleReview.create({
      data: {
        moduleCode: moduleCode.toUpperCase(),
        userId,
        rating,
        content,
        assessmentWeightage,
        term,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(review);
  } catch (error) {
    logger.error('Error creating module review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
}

/**
 * Update an existing review
 * PUT /api/modules/:moduleCode/reviews/:reviewId
 */
export async function updateModuleReview(req: Request, res: Response): Promise<void> {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if review exists and belongs to user
    const existingReview = await prisma.moduleReview.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    if (existingReview.userId !== userId) {
      res.status(403).json({ error: 'You can only update your own reviews' });
      return;
    }

    const { rating, content, assessmentWeightage, term } = req.body;

    const review = await prisma.moduleReview.update({
      where: { id: reviewId },
      data: {
        rating,
        content,
        assessmentWeightage,
        term,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json(review);
  } catch (error) {
    logger.error('Error updating module review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
}

/**
 * Delete a review
 * DELETE /api/modules/:moduleCode/reviews/:reviewId
 */
export async function deleteModuleReview(req: Request, res: Response): Promise<void> {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if review exists and belongs to user
    const existingReview = await prisma.moduleReview.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    if (existingReview.userId !== userId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'You can only delete your own reviews' });
      return;
    }

    await prisma.moduleReview.delete({
      where: { id: reviewId },
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    logger.error('Error deleting module review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
}

/**
 * Vote a review as helpful
 * POST /api/modules/:moduleCode/reviews/:reviewId/vote
 */
export async function voteReview(req: Request, res: Response): Promise<void> {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const review = await prisma.moduleReview.update({
      where: { id: reviewId },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
    });

    res.json({ helpfulCount: review.helpfulCount });
  } catch (error) {
    logger.error('Error voting on review:', error);
    res.status(500).json({ error: 'Failed to vote on review' });
  }
}
