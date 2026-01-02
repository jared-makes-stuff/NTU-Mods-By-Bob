import { prisma } from '../../../config/database';
import { AppError } from '../../../api/middleware/error.middleware';
import { normalizeModuleCode } from './helpers';
import { logger } from '../../../config/logger';

type AssessmentWeightage = Record<string, number>;

const reviewUserSelect = {
  user: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  },
};

export async function getModuleReviews(moduleCode: string) {
  try {
    const reviews = await prisma.moduleReview.findMany({
      where: {
        moduleCode: normalizeModuleCode(moduleCode),
        isFlagged: false,
      },
      include: reviewUserSelect,
      orderBy: [
        { helpfulCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return reviews;
  } catch (error: unknown) {
    logger.error('Error fetching module reviews:', error);
    throw new AppError(500, 'FETCH_REVIEWS_FAILED', 'Failed to fetch reviews');
  }
}

export async function createReview(
  userId: string,
  moduleCode: string,
  data: {
    rating: number;
    content?: string;
    assessmentWeightage?: AssessmentWeightage;
    term?: string;
  }
) {
  try {
    const normalizedCode = normalizeModuleCode(moduleCode);
    const existing = await prisma.moduleReview.findUnique({
      where: {
        moduleCode_userId: {
          moduleCode: normalizedCode,
          userId,
        },
      },
    });

    if (existing) {
      throw new AppError(400, 'REVIEW_EXISTS', 'You have already reviewed this module');
    }

    if (data.rating < 1 || data.rating > 5) {
      throw new AppError(400, 'INVALID_RATING', 'Rating must be between 1 and 5');
    }

    const review = await prisma.moduleReview.create({
      data: {
        userId,
        moduleCode: normalizedCode,
        rating: data.rating,
        content: data.content,
        assessmentWeightage: data.assessmentWeightage ?? undefined,
        term: data.term,
      },
      include: reviewUserSelect,
    });

    return review;
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error('Error creating review:', error);
    throw new AppError(500, 'CREATE_REVIEW_FAILED', 'Failed to create review');
  }
}

export async function updateReview(
  userId: string,
  reviewId: string,
  data: {
    rating?: number;
    content?: string;
    assessmentWeightage?: AssessmentWeightage;
  }
) {
  try {
    const review = await prisma.moduleReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found');
    }

    if (review.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only edit your own reviews');
    }

    const updated = await prisma.moduleReview.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        content: data.content,
        assessmentWeightage: data.assessmentWeightage,
      },
      include: reviewUserSelect,
    });

    return updated;
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error('Error updating review:', error);
    throw new AppError(500, 'UPDATE_REVIEW_FAILED', 'Failed to update review');
  }
}

export async function deleteReview(userId: string, reviewId: string) {
  try {
    const review = await prisma.moduleReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new AppError(404, 'REVIEW_NOT_FOUND', 'Review not found');
    }

    if (review.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You can only delete your own reviews');
    }

    await prisma.moduleReview.delete({
      where: { id: reviewId },
    });

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error('Error deleting review:', error);
    throw new AppError(500, 'DELETE_REVIEW_FAILED', 'Failed to delete review');
  }
}



