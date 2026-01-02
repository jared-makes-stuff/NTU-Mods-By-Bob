import { Router } from 'express';
import { authMiddleware } from '@/api/middleware/auth.middleware';
import {
  getModuleTopics,
  createModuleTopic,
  updateModuleTopic,
  deleteModuleTopic,
  voteTopic,
} from '../controllers/module-topics.controller';

const router = Router();

// Public routes
/**
 * @swagger
 * /api/modules/{moduleCode}/topics:
 *   get:
 *     summary: List module topics
 *     description: Retrieve the topic tree for a module.
 *     tags: [Module Topics]
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *         example: SC2002
 *     responses:
 *       200:
 *         description: Module topics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topics:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/modules/:moduleCode/topics', getModuleTopics);

// Protected routes (require authentication)
/**
 * @swagger
 * /api/modules/{moduleCode}/topics:
 *   post:
 *     summary: Create a module topic
 *     description: Add a new topic (optionally nested) for a module.
 *     tags: [Module Topics]
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
 *               name:
 *                 type: string
 *               duration:
 *                 type: string
 *               level:
 *                 type: number
 *               parentId:
 *                 type: string
 *               orderIndex:
 *                 type: number
 *               weekTaught:
 *                 type: number
 *               suggestedEdit:
 *                 type: string
 *               editReason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Topic created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 */
router.post('/modules/:moduleCode/topics', authMiddleware, createModuleTopic);

/**
 * @swagger
 * /api/modules/{moduleCode}/topics/{topicId}:
 *   put:
 *     summary: Update a module topic
 *     tags: [Module Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: topicId
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
 *               name:
 *                 type: string
 *               duration:
 *                 type: string
 *               orderIndex:
 *                 type: number
 *               weekTaught:
 *                 type: number
 *               suggestedEdit:
 *                 type: string
 *               editReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Topic updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Topic not found
 */
router.put('/modules/:moduleCode/topics/:topicId', authMiddleware, updateModuleTopic);

/**
 * @swagger
 * /api/modules/{moduleCode}/topics/{topicId}:
 *   delete:
 *     summary: Delete a module topic
 *     tags: [Module Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Topic deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Topic not found
 */
router.delete('/modules/:moduleCode/topics/:topicId', authMiddleware, deleteModuleTopic);

/**
 * @swagger
 * /api/modules/{moduleCode}/topics/{topicId}/vote:
 *   post:
 *     summary: Upvote a module topic
 *     tags: [Module Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vote recorded successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Topic not found
 */
router.post('/modules/:moduleCode/topics/:topicId/vote', authMiddleware, voteTopic);

export default router;
