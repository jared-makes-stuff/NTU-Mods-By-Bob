import { prisma } from '../../../config/database';
import { AppError } from '../../../api/middleware/error.middleware';
import { normalizeModuleCode } from './helpers';
import { logger } from '../../../config/logger';

export async function getModuleRatingStats(moduleCode: string) {
  try {
    const stats = await prisma.moduleReview.aggregate({
      where: {
        moduleCode: normalizeModuleCode(moduleCode),
        isFlagged: false,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count.rating || 0,
    };
  } catch (error: unknown) {
    logger.error('Error fetching rating stats:', error);
    throw new AppError(500, 'FETCH_STATS_FAILED', 'Failed to fetch rating statistics');
  }
}

export async function getModuleAssessmentWeightage(moduleCode: string) {
  try {
    const reviews = await prisma.moduleReview.findMany({
      where: {
        moduleCode: normalizeModuleCode(moduleCode),
        isFlagged: false,
      },
      select: {
        assessmentWeightage: true,
      },
    });

    const validReviews = reviews.filter((review) => review.assessmentWeightage !== null);

    if (validReviews.length === 0) {
      return null;
    }

    const assessmentAggregation: { [key: string]: number[] } = {};

    validReviews.forEach((review) => {
      const weightage = review.assessmentWeightage;
      if (weightage && typeof weightage === 'object' && !Array.isArray(weightage)) {
        Object.entries(weightage as Record<string, unknown>).forEach(([key, value]) => {
          if (typeof value === 'number') {
            if (!assessmentAggregation[key]) {
              assessmentAggregation[key] = [];
            }
            assessmentAggregation[key].push(value);
          }
        });
      }
    });

    const averaged: { name: string; value: number; count: number }[] = [];
    Object.entries(assessmentAggregation).forEach(([name, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      averaged.push({
        name,
        value: Math.round(avg),
        count: values.length,
      });
    });

    return averaged.sort((a, b) => b.value - a.value);
  } catch (error: unknown) {
    logger.error('Error fetching assessment weightage:', error);
    throw new AppError(500, 'FETCH_WEIGHTAGE_FAILED', 'Failed to fetch assessment weightage');
  }
}



