import { Router } from 'express';
import { authMiddleware } from '@/api/middleware/auth.middleware';
import {
  getModuleReviews,
  createModuleReview,
  updateModuleReview,
  deleteModuleReview,
  voteReview,
} from '../controllers/module-reviews.controller';

const router = Router();

// Public routes
/**
 * @swagger
 * /api/modules/{moduleCode}/reviews:
 *   get:
 *     summary: List module reviews
 *     description: Retrieve reviews and rating summary for a module.
 *     tags: [Module Reviews]
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *         example: SC2002
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                 averageRating:
 *                   type: number
 *                 totalReviews:
 *                   type: number
 *                 averageWeightage:
 *                   type: object
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/modules/:moduleCode/reviews', getModuleReviews);

// Protected routes (require authentication)
/**
 * @swagger
 * /api/modules/{moduleCode}/reviews:
 *   post:
 *     summary: Create a module review
 *     tags: [Module Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *         example: SC2002
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               content:
 *                 type: string
 *               assessmentWeightage:
 *                 type: object
 *               term:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 *       409:
 *         description: Review already exists
 */
router.post('/modules/:moduleCode/reviews', authMiddleware, createModuleReview);

/**
 * @swagger
 * /api/modules/{moduleCode}/reviews/{reviewId}:
 *   put:
 *     summary: Update a module review
 *     tags: [Module Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               content:
 *                 type: string
 *               assessmentWeightage:
 *                 type: object
 *               term:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 */
router.put('/modules/:moduleCode/reviews/:reviewId', authMiddleware, updateModuleReview);

/**
 * @swagger
 * /api/modules/{moduleCode}/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a module review
 *     tags: [Module Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 */
router.delete('/modules/:moduleCode/reviews/:reviewId', authMiddleware, deleteModuleReview);

/**
 * @swagger
 * /api/modules/{moduleCode}/reviews/{reviewId}/vote:
 *   post:
 *     summary: Vote a review as helpful
 *     tags: [Module Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Review not found
 */
router.post('/modules/:moduleCode/reviews/:reviewId/vote', authMiddleware, voteReview);

export default router;
