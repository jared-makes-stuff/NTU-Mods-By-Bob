import { Router } from 'express';
import { vacancyAlertsController } from '../controllers/vacancy-alerts.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/vacancy-alerts/telegram/confirm:
 *   post:
 *     summary: Confirm Telegram link
 *     tags: [Vacancy Alerts]
 *     description: Used by the Telegram bot to link a chat ID to a user account using a short-lived code.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, chatId]
 *             properties:
 *               code:
 *                 type: string
 *               chatId:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Link confirmed
 */
router.post('/telegram/confirm', vacancyAlertsController.confirmTelegramLink);

/**
 * @swagger
 * /api/vacancy-alerts/telegram/unlink:
 *   post:
 *     summary: Unlink Telegram by chat ID
 *     tags: [Vacancy Alerts]
 *     description: Used by the Telegram bot to unlink a chat ID from a user account.
 */
router.post('/telegram/unlink', vacancyAlertsController.unlinkTelegramByChatId);

// Protected endpoints (plus role and above)
router.use(authMiddleware, requireRole('plus'));

/**
 * @swagger
 * /api/vacancy-alerts/telegram/status:
 *   get:
 *     summary: Get Telegram link status
 *     tags: [Vacancy Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/telegram/status', vacancyAlertsController.getTelegramStatus);

/**
 * @swagger
 * /api/vacancy-alerts/telegram/link-code:
 *   post:
 *     summary: Generate Telegram link code
 *     tags: [Vacancy Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.post('/telegram/link-code', vacancyAlertsController.createTelegramLinkCode);

/**
 * @swagger
 * /api/vacancy-alerts/telegram/link:
 *   delete:
 *     summary: Unlink Telegram account
 *     tags: [Vacancy Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/telegram/link', vacancyAlertsController.unlinkTelegram);

/**
 * @swagger
 * /api/vacancy-alerts/tasks:
 *   get:
 *     summary: List vacancy alert tasks
 *     tags: [Vacancy Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *         description: Refresh vacancy data before returning tasks
 *   post:
 *     summary: Create vacancy alert task
 *     tags: [Vacancy Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/tasks', vacancyAlertsController.listTasks);
router.post('/tasks', vacancyAlertsController.createTask);

/**
 * @swagger
 * /api/vacancy-alerts/tasks/{id}:
 *   delete:
 *     summary: Delete vacancy alert task
 *     tags: [Vacancy Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/tasks/:id', vacancyAlertsController.deleteTask);

export default router;
