import { Router } from 'express';
import { catalogueController } from '../../controllers/catalogue.controller';

export function registerCatalogueSearchRoutes(router: Router): void {
  /**
   * @swagger
   * /api/modules/search:
   *   get:
   *     summary: Quick search for modules by code and title only
   *     description: |
   *       Search modules by code and name (title) ONLY - does NOT search descriptions.
   *       Results are intelligently ranked with exact code matches prioritized.
   *       Faster and more precise than search-all.
   *       For comprehensive search including descriptions, use /api/modules/search-all
   *     tags: [Catalogue]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query (module code or title keywords)
   *         example: algorithm
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *         description: Maximum number of results
   *       - in: query
   *         name: semester
   *         schema:
   *           type: string
   *         description: Semester filter (e.g., 2024_1)
   *     responses:
   *       200:
   *         description: Search results
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Module'
    *             example:
    *               data:
    *                 - code: CS2040
    *                   semester: 2025_2
    *                   name: Data Structures and Algorithms
    *                   au: 4
   */
  router.get('/modules/search', catalogueController.searchModules);

  /**
   * @swagger
   * /api/modules/search-all:
   *   get:
   *     summary: Search modules by code, title, and description
   *     description: Comprehensive search across module code, title, and description.
   *     tags: [Catalogue]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query (module code, title, or description)
   *         example: machine learning
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *         description: Maximum number of results
   *     responses:
   *       200:
   *         description: Search results
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Module'
    *             example:
    *               data:
    *                 - code: CZ4042
    *                   semester: 2025_1
    *                   name: Neural Networks
    *                   au: 4
   */
  router.get('/modules/search-all', catalogueController.searchModulesAll);
}
