import { Router } from 'express';
import { plannerController } from '../../controllers/planner.controller';

export function registerPlannerConflictRoutes(router: Router): void {
  /**
   * @swagger
   * /api/timetables/{id}/conflicts:
   *   get:
   *     summary: Detect timetable conflicts
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
   *         description: Conflict list
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     hasConflict:
   *                       type: boolean
   *                     hasConflicts:
   *                       type: boolean
   *                     conflicts:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           slot1:
   *                             type: object
   *                             properties:
   *                               moduleCode:
   *                                 type: string
   *                               indexNumber:
   *                                 type: string
   *                               type:
   *                                 type: string
   *                               title:
   *                                 type: string
   *                               day:
   *                                 type: string
   *                               startTime:
   *                                 type: string
   *                               endTime:
   *                                 type: string
   *                               weeks:
   *                                 type: array
   *                                 items:
   *                                   type: number
   *                               source:
   *                                 type: string
   *                           slot2:
   *                             type: object
   *                             properties:
   *                               moduleCode:
   *                                 type: string
   *                               indexNumber:
   *                                 type: string
   *                               type:
   *                                 type: string
   *                               title:
   *                                 type: string
   *                               day:
   *                                 type: string
   *                               startTime:
   *                                 type: string
   *                               endTime:
   *                                 type: string
   *                               weeks:
   *                                 type: array
   *                                 items:
   *                                   type: number
   *                               source:
   *                                 type: string
   *                           reason:
   *                             type: string
    *             example:
    *               data:
    *                 hasConflict: false
    *                 hasConflicts: false
    *                 conflicts: []
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.get('/timetables/:id/conflicts', plannerController.detectConflicts);
}
