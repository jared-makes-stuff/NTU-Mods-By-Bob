import { Router } from 'express';
import { catalogueController } from '../../controllers/catalogue.controller';

export function registerCatalogueSchoolRoutes(router: Router) {
  /**
   * @swagger
   * /api/schools:
   *   get:
   *     summary: List available schools
   *     description: Retrieve the list of schools offering modules.
   *     tags: [Catalogue]
   *     responses:
   *       200:
   *         description: Schools retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: string
   */
  router.get('/schools', catalogueController.getSchools);
}
