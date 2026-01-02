/**
 * Main API Router
 * 
 * This file aggregates all route modules and exports a single router
 * that is mounted at /api in app.ts.
 * 
 * Route Organization:
 * - /api/auth          - Authentication (register, login, profile)
 * - /api/health        - Health checks and system status
 * - /api/modules       - Module catalogue (search, details)
 * - /api/semesters     - Available semesters
 * - /api/timetables    - Timetable planning (CRUD and conflicts)
 * - /api/timetable     - Timetable generation and validation
 * - /api/course-plans  - Course planning (multi-semester plan)
 * - /api/user          - User settings and preferences
 * - /api/vacancy       - Vacancy lookups (public)
 * - /api/vacancy-alerts - Vacancy alerts (Telegram + tasks)
 */

import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { healthRoutes } from './health.routes';
import catalogueRoutes from './catalogue.routes';
import plannerRoutes from './planner.routes';
import userRoutes from './user.routes';
import vacancyRoutes from './vacancy.routes';
import vacancyAlertsRoutes from './vacancy-alerts.routes';
import timetableRoutes from './timetable.routes';
import moduleReviewsRoutes from './module-reviews.routes';
import moduleTopicsRoutes from './module-topics.routes';

/**
 * Create main API router
 */
const router = Router();

/**
 * API root endpoint
 * Provides information about available endpoints
 * 
 * @swagger
 * /api:
 *   get:
 *     summary: API information
 *     description: Get information about the API and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: NTU Mods Backend API
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 status:
 *                   type: string
 *                   example: active
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 *                 endpoints:
 *                   type: object
 *             example:
 *               message: NTU Mods Backend API
 *               version: "1.0.0"
 *               status: active
 *               documentation: /api-docs
 *               endpoints:
 *                 auth:
 *                   register: POST /api/auth/register
 *                 health:
 *                   basic: GET /api/health
 */
router.get('/', (_req, res) => {
  res.json({
    message: 'NTU Mods Backend API',
    version: '1.0.0',
    status: 'active',
    documentation: '/api-docs',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        config: 'GET /api/auth/config',
        profile: 'GET /api/auth/me',
        updateProfile: 'PUT /api/auth/me',
        avatar: 'POST /api/auth/avatar',
        changePassword: 'POST /api/auth/change-password',
        deleteAccount: 'DELETE /api/auth/account',
      },
      health: {
        basic: 'GET /api/health',
        detailed: 'GET /api/health/detailed',
        version: 'GET /api/health/version',
      },
      catalogue: {
        list: 'GET /api/modules',
        stats: 'GET /api/modules/stats',
        search: 'GET /api/modules/search',
        searchAll: 'GET /api/modules/search-all',
        details: 'GET /api/modules/:code',
        indexes: 'GET /api/modules/:code/indexes',
        prerequisites: 'GET /api/modules/:code/prerequisites',
        dependencies: 'GET /api/modules/:code/dependencies',
        semesters: 'GET /api/semesters',
      },
      timetables: {
        list: 'GET /api/timetables',
        create: 'POST /api/timetables',
        get: 'GET /api/timetables/:id',
        update: 'PUT /api/timetables/:id',
        delete: 'DELETE /api/timetables/:id',
        addModule: 'POST /api/timetables/:id/modules',
        removeModule: 'DELETE /api/timetables/:id/modules/:code',
        conflicts: 'GET /api/timetables/:id/conflicts',
        generate: 'POST /api/timetables/generate',
      },
      timetableGeneration: {
        generate: 'POST /api/timetable/generate',
        validate: 'POST /api/timetable/validate',
      },
      user: {
        avatar: 'GET /api/user/:userId/avatar',
        settings: 'GET /api/user/settings',
        updateSettings: 'PUT /api/user/settings',
      },
      moduleReviews: {
        list: 'GET /api/modules/:moduleCode/reviews',
        create: 'POST /api/modules/:moduleCode/reviews',
        update: 'PUT /api/modules/:moduleCode/reviews/:reviewId',
        delete: 'DELETE /api/modules/:moduleCode/reviews/:reviewId',
        vote: 'POST /api/modules/:moduleCode/reviews/:reviewId/vote',
      },
      moduleTopics: {
        list: 'GET /api/modules/:moduleCode/topics',
        create: 'POST /api/modules/:moduleCode/topics',
        update: 'PUT /api/modules/:moduleCode/topics/:topicId',
        delete: 'DELETE /api/modules/:moduleCode/topics/:topicId',
        vote: 'POST /api/modules/:moduleCode/topics/:topicId/vote',
      },
      vacancy: {
        course: 'GET /api/vacancy/course/:courseCode',
        index: 'GET /api/vacancy/course/:courseCode/index/:indexNumber',
      },
      vacancyAlerts: {
        tasks: 'GET /api/vacancy-alerts/tasks',
        create: 'POST /api/vacancy-alerts/tasks',
        delete: 'DELETE /api/vacancy-alerts/tasks/:id',
        telegramStatus: 'GET /api/vacancy-alerts/telegram/status',
        telegramLinkCode: 'POST /api/vacancy-alerts/telegram/link-code',
        telegramUnlink: 'DELETE /api/vacancy-alerts/telegram/link',
      },
    },
  });
});

/**
 * Mount route modules
 */

// Authentication routes
router.use('/auth', authRoutes);

// Health check routes
router.use('/health', healthRoutes);

// Vacancy routes (public NTU vacancy API)
router.use('/vacancy', vacancyRoutes);

// Vacancy alert routes (Telegram + alert tasks)
router.use('/vacancy-alerts', vacancyAlertsRoutes);

// Module Reviews and Topics routes
router.use('/', moduleReviewsRoutes);
router.use('/', moduleTopicsRoutes);

// Catalogue routes (module search and details)
router.use('/', catalogueRoutes);

// Planner routes (timetable management)
router.use('/', plannerRoutes);

// User routes (settings and preferences)
router.use('/user', userRoutes);

// Timetable generation routes
router.use('/timetable', timetableRoutes);

/**
 * Export main API router
 */
export { router };
