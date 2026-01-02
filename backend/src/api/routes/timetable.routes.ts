import { Router } from 'express';
import { generateTimetable, validateTimetable } from '../controllers/timetable.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * Timetable Generation Routes
 * 
 * All routes require authentication.
 * Handles timetable generation and validation operations.
 */

/**
 * @swagger
 * /api/timetable/generate:
 *   post:
 *     summary: Generate timetable combinations
 *     description: Generate optimized timetable combinations based on modules, indexes, and filters
 *     tags: [Timetable Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modules
 *               - filters
 *               - semester
 *             properties:
 *               modules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: CS1010
 *                     indexNumbers:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["10101", "10102"]
 *               filters:
 *                 type: object
 *               semester:
 *                 type: string
 *                 example: 2025_2
 *           examples:
 *             basic:
 *               summary: Basic generation request
 *               value:
 *                 modules:
 *                   - code: CS1010
 *                     indexNumbers: ["10101", "10102"]
 *                 filters:
 *                   dayDuration: { min: 0, max: 8, enabled: true }
 *                   consecutiveClasses: { min: 0, max: 4, enabled: false }
 *                   gapsBetweenClasses: { min: 0, max: 2, enabled: true }
 *                   dayStartEnd: { startAfter: "08:00", endBefore: "20:00", startEnabled: true, endEnabled: true }
 *                   daysOfWeek: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }
 *                   dailyLoad: { preference: "balanced", enabled: false }
 *                   classesToConsider: { tutorial: true, lab: true, seminar: true, lecture: true, project: true, design: true }
 *                   venuePreference: { includeOnline: true, includeInPerson: true }
 *                   generationGoals: { balanceWorkload: false, minimizeDays: false, consecutiveDays: false }
 *                 semester: 2025_2
 *     responses:
 *       200:
 *         description: Timetable combinations generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TimetableGenerationResult'
 *             example:
 *               success: true
 *               data:
 *                 combinations: []
 *                 generatedAt: 2024-01-01T00:00:00.000Z
 *                 totalCombinations: 0
 *                 returnedCount: 0
 *                 hasMore: false
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/generate', authMiddleware, generateTimetable);

/**
 * @swagger
 * /api/timetable/validate:
 *   post:
 *     summary: Validate a timetable combination
 *     tags: [Timetable Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - combination
 *             properties:
 *               combination:
 *                 $ref: '#/components/schemas/TimetableCombination'
 *           examples:
 *             valid:
 *               summary: Validate a combination payload
 *               value:
 *                 combination:
 *                   modules:
 *                     - code: CS1010
 *                       name: Programming Methodology
 *                       au: 4
 *                       indexNumber: "10101"
 *                   classes:
 *                     - moduleCode: CS1010
 *                       moduleName: Programming Methodology
 *                       indexNumber: "10101"
 *                       type: LEC
 *                       day: MON
 *                       startTime: "0900"
 *                       endTime: "1100"
 *                       venue: LT1A
 *                       weeks: "1-13"
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TimetableValidationResult'
 *             example:
 *               success: true
 *               data:
 *                 isValid: true
 *                 conflicts: []
 *                 warnings: []
 *                 message: Validation endpoint is ready. Implementation pending.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/validate', authMiddleware, validateTimetable);

export default router;
