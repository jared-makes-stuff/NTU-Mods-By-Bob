import { Router } from 'express';
import { plannerController } from '../../controllers/planner.controller';

export function registerPlannerGenerationRoutes(router: Router): void {
  /**
   * @swagger
   * /api/timetables/generate:
   *   post:
   *     summary: Auto-generate timetables
   *     tags: [Planner]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             oneOf:
   *               - type: object
   *                 description: Legacy planner payload
   *                 properties:
   *                   moduleCodes:
   *                     type: array
   *                     items:
   *                       type: string
   *                   semester:
   *                     type: string
   *                   preferredDays:
   *                     type: array
   *                     items:
   *                       type: string
   *                   avoidDays:
   *                     type: array
   *                     items:
   *                       type: string
   *                   preferredTimeStart:
   *                     type: string
   *                     example: "09:00"
   *                   preferredTimeEnd:
   *                     type: string
   *                     example: "18:00"
   *               - type: object
   *                 description: Advanced generator payload
   *                 required:
   *                   - modules
   *                   - filters
   *                   - semester
   *                 properties:
   *                   modules:
   *                     type: array
   *                     items:
   *                       type: object
   *                       properties:
   *                         code:
   *                           type: string
   *                         indexNumbers:
   *                           type: array
   *                           items:
   *                             type: string
   *                   filters:
   *                     type: object
   *                   semester:
   *                     type: string
    *           examples:
    *             legacy:
    *               summary: Legacy planner payload
    *               value:
    *                 moduleCodes: ["CS1010", "CS2030S"]
    *                 semester: "2025_2"
    *                 preferredDays: ["MON", "WED"]
    *                 avoidDays: ["FRI"]
    *                 preferredTimeStart: "09:00"
    *                 preferredTimeEnd: "18:00"
    *             advanced:
    *               summary: Advanced generation payload
    *               value:
    *                 modules:
    *                   - code: "CS1010"
    *                     indexNumbers: ["10101", "10102"]
    *                 filters: {}
    *                 semester: "2025_2"
   *     responses:
   *       201:
   *         description: Generated timetables
   *         content:
   *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 data:
    *                   $ref: '#/components/schemas/TimetableGenerationResult'
    *             example:
    *               data:
    *                 combinations: []
    *                 generatedAt: 2024-01-01T00:00:00.000Z
    *                 totalCombinations: 0
    *                 returnedCount: 0
    *                 hasMore: false
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.post('/timetables/generate', plannerController.generateTimetables);
}
