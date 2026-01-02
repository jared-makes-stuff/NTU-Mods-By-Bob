import { Router } from 'express';
import { catalogueController } from '../../controllers/catalogue.controller';

export function registerCatalogueStatsRoutes(router: Router): void {
  /**
   * @swagger
   * /api/modules/stats:
   *   get:
   *     summary: Get module statistics
   *     description: Retrieve statistics about the module catalogue
   *     tags: [Catalogue]
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalModules:
   *                       type: number
   *                       example: 1500
   *                     totalIndexes:
   *                       type: number
   *                       example: 3000
   *                     avgAcademicUnits:
   *                       type: number
   *                       example: 3.9
   *                     modulesWithPrerequisites:
   *                       type: number
   *                       example: 800
    *             example:
    *               data:
    *                 totalModules: 1500
    *                 totalIndexes: 3000
    *                 avgAcademicUnits: 3.9
    *                 modulesWithPrerequisites: 800
   */
  router.get('/modules/stats', catalogueController.getModuleStats);
}
