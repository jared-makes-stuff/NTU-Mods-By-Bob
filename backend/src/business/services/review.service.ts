import {
  createReview,
  deleteReview,
  getModuleReviews,
  updateReview,
} from './review/reviews';
import { getModuleAssessmentWeightage, getModuleRatingStats } from './review/ratings';
import { getModuleTopics } from './review/topics';

export class ReviewService {
  getModuleReviews = getModuleReviews;
  getModuleRatingStats = getModuleRatingStats;
  getModuleAssessmentWeightage = getModuleAssessmentWeightage;
  getModuleTopics = getModuleTopics;
  createReview = createReview;
  updateReview = updateReview;
  deleteReview = deleteReview;
}

export const reviewService = new ReviewService();
