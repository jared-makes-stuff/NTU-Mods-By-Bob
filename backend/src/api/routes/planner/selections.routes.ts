import { Router } from 'express';
import { plannerController } from '../../controllers/planner.controller';

export function registerPlannerSelectionRoutes(router: Router): void {
  /**
   * @swagger
   * /api/timetables/{id}/modules:
   *   post:
   *     summary: Add or update a module selection
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
   *             required:
   *               - moduleCode
   *             properties:
   *               moduleCode:
   *                 type: string
   *                 example: CS1010
   *               indexNumber:
   *                 type: string
   *                 example: 10101
   *               color:
   *                 type: string
   *                 example: '#3b82f6'
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
    *                 selections:
    *                   - moduleCode: CS1010
    *                     indexNumber: "10101"
    *                     color: "#3b82f6"
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.post('/timetables/:id/modules', plannerController.addModule);

  /**
   * @swagger
   * /api/timetables/{id}/modules/{moduleCode}:
   *   delete:
   *     summary: Remove a module selection
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
   *       - in: path
   *         name: moduleCode
   *         required: true
   *         schema:
   *           type: string
   *         description: Module code
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
    *                 selections: []
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.delete('/timetables/:id/modules/:moduleCode', plannerController.removeModule);
}
