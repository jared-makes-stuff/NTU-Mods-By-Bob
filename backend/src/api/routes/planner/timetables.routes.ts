import { Router } from 'express';
import { plannerController } from '../../controllers/planner.controller';

export function registerPlannerTimetableRoutes(router: Router): void {
  /**
   * @swagger
   * /api/timetables:
   *   post:
   *     summary: Create a new timetable
   *     tags: [Planner]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - semester
   *             properties:
   *               name:
   *                 type: string
   *                 example: My Semester 1
   *               semester:
   *                 type: string
   *                 example: AY2024/25 Semester 1
   *               year:
   *                 type: number
   *                 example: 2024
   *               selections:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/TimetableSelection'
   *     responses:
   *       201:
   *         description: Timetable created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/Timetable'
    *             example:
    *               data:
    *                 id: c7c25e6c-9c3b-4a4a-a372-1a9bbaf8b3f0
    *                 userId: 123e4567-e89b-12d3-a456-426614174000
    *                 name: My Semester 1
    *                 semester: AY2024/25 Semester 1
    *                 year: 2024
    *                 selections:
    *                   - moduleCode: CS1010
    *                     indexNumber: "10101"
    *                     color: "#3b82f6"
    *                 isShared: false
    *                 createdAt: 2024-01-01T00:00:00.000Z
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.post('/timetables', plannerController.createTimetable);

  /**
   * @swagger
   * /api/timetables:
   *   get:
   *     summary: List timetables
   *     tags: [Planner]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Timetables retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Timetable'
    *             example:
    *               data:
    *                 - id: c7c25e6c-9c3b-4a4a-a372-1a9bbaf8b3f0
    *                   name: My Semester 1
    *                   semester: AY2024/25 Semester 1
    *                   year: 2024
    *                   selections: []
    *                   isShared: false
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.get('/timetables', plannerController.getUserTimetables);

  /**
   * @swagger
   * /api/timetables/{id}:
   *   get:
   *     summary: Get a timetable
   *     tags: [Planner]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Timetable retrieved
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/Timetable'
    *             example:
    *               data:
    *                 id: c7c25e6c-9c3b-4a4a-a372-1a9bbaf8b3f0
    *                 name: My Semester 1
    *                 semester: AY2024/25 Semester 1
    *                 year: 2024
    *                 selections: []
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get('/timetables/:id', plannerController.getTimetableById);

  /**
   * @swagger
   * /api/timetables/{id}:
   *   put:
   *     summary: Update a timetable
   *     tags: [Planner]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               isShared:
   *                 type: boolean
   *               selections:
   *                 type: array
   *                 items:
   *                   $ref: '#/components/schemas/TimetableSelection'
   *     responses:
   *       200:
   *         description: Timetable updated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/Timetable'
    *             example:
    *               data:
    *                 id: c7c25e6c-9c3b-4a4a-a372-1a9bbaf8b3f0
    *                 name: My Updated Timetable
    *                 isShared: true
    *                 selections:
    *                   - moduleCode: CS1010
    *                     indexNumber: "10101"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.put('/timetables/:id', plannerController.updateTimetable);

  /**
   * @swagger
   * /api/timetables/{id}:
   *   delete:
   *     summary: Delete a timetable
   *     tags: [Planner]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Timetable deleted
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: Timetable deleted successfully
    *             example:
    *               data:
    *                 message: Timetable deleted successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.delete('/timetables/:id', plannerController.deleteTimetable);
}
