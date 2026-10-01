import { Router } from 'express';
import { catalogueController } from '../../controllers/catalogue.controller';

export function registerCatalogueSemesterRoutes(router: Router): void {
  /**
   * @swagger
   * /api/semesters:
   *   get:
   *     summary: Get available semesters
   *     description: Retrieve list of available academic semesters
   *     tags: [Catalogue]
   *     responses:
   *       200:
   *         description: Semesters retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ["2025_2", "2025_1"]
    *             example:
    *               data: ["2025_2", "2025_1"]
   */
  router.get('/semesters', catalogueController.getAvailableSemesters);

  /**
   * @swagger
   * /api/semesters/current:
   *   get:
   *     summary: Get current semester
   *     description: Retrieve the most recent academic semester from the database
   *     tags: [Catalogue]
   *     responses:
   *       200:
   *         description: Current semester retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: string
   *                   nullable: true
   *                   example: "2025_2"
   */
  router.get('/semesters/current', catalogueController.getCurrentSemester);
}
