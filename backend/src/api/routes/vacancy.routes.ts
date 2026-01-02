/**
 * Vacancy Routes
 * 
 * Public API routes for checking course vacancies.
 * No authentication required - uses public NTU API.
 */

import { Router } from 'express';
import { vacancyController } from '../controllers/vacancy.controller';

const router = Router();

/**
 * @swagger
 * /api/vacancy/course/{courseCode}:
 *   get:
 *     summary: Get course vacancies
 *     description: Retrieve vacancy information for all indexes of a course
 *     tags: [Vacancy]
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Course code
 *         example: CS1010
 *     responses:
 *       200:
 *         description: Vacancy data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *             example:
 *               data:
 *                 success: true
 *                 data:
 *                   - index: "10101"
 *                     vacancy: 5
 *                     waitlist: 0
 *                     classes:
 *                       - type: LEC
 *                         group: LE1
 *                         day: MON
 *                         time: 0830-1030
 *                         venue: LT1A
 */
router.get('/course/:courseCode', vacancyController.getCourseVacancies);

/**
 * @swagger
 * /api/vacancy/course/{courseCode}/index/{indexNumber}:
 *   get:
 *     summary: Get index vacancy
 *     description: Retrieve vacancy information for a specific index
 *     tags: [Vacancy]
 *     parameters:
 *       - in: path
 *         name: courseCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Course code
 *         example: CS1010
 *       - in: path
 *         name: indexNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Index number
 *         example: 10101
 *     responses:
 *       200:
 *         description: Vacancy data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *             example:
 *               data:
 *                 success: true
 *                 data:
 *                   index: "10101"
 *                   vacancy: 5
 *                   waitlist: 0
 */
router.get('/course/:courseCode/index/:indexNumber', vacancyController.getIndexVacancy);

export default router;
