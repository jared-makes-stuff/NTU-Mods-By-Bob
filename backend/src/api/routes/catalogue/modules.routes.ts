import { Router } from 'express';
import { catalogueController } from '../../controllers/catalogue.controller';

export function registerCatalogueModuleRoutes(router: Router): void {
  /**
   * @swagger
   * /api/modules/{code}/prerequisites:
   *   get:
   *     summary: Check prerequisites and preclusions
   *     description: Get prerequisite requirements and preclusion information for a module
   *     tags: [Catalogue]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Module code
   *         example: CS2030S
   *     responses:
   *       200:
   *         description: Prerequisites retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     prerequisites:
   *                       oneOf:
   *                         - type: string
   *                         - type: object
   *                       nullable: true
   *                       example: { "or": ["CS1010", "CS1101S"] }
   *                     hasPrerequisites:
   *                       type: boolean
   *       404:
   *         description: Module not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/modules/:code/prerequisites', catalogueController.checkPrerequisites);

  /**
   * @swagger
   * /api/modules/{code}/indexes:
   *   get:
   *     summary: Get all indexes for a module
   *     description: Retrieve all available class indexes/sections for a module
   *     tags: [Catalogue]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Module code
   *         example: CS2030S
   *     responses:
   *       200:
   *         description: Indexes retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Index'
    *             example:
    *               data:
    *                 - moduleCode: CS2030S
    *                   indexNumber: "10101"
    *                   semester: 2025_2
    *                   type: LEC
    *                   day: MON
    *                   startTime: "0900"
    *                   endTime: "1100"
    *                   venue: LT1A
    *                   weeks: [1,2,3,4,5,6,7,8,9,10,11,12,13]
   *       404:
   *         description: Module not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/modules/:code/indexes', catalogueController.getModuleIndexes);

  /**
   * @swagger
   * /api/modules/{code}:
   *   get:
   *     summary: Get detailed module information
   *     description: Retrieve comprehensive information about a specific module
   *     tags: [Catalogue]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Module code
   *         example: CS2030S
   *     responses:
   *       200:
   *         description: Module information retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/Module'
    *             example:
    *               data:
    *                 code: CS2030S
    *                 semester: 2025_2
    *                 name: Programming Methodology II
    *                 au: 4
    *                 school: SCSE
    *                 description: Introduction to object-oriented programming...
    *                 prerequisites:
    *                   or: [CS1010, CS1101S]
    *                 indexes: []
   *       404:
   *         description: Module not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/modules/:code', catalogueController.getModuleByCode);

  /**
   * @swagger
   * /api/modules:
   *   get:
   *     summary: List all modules with pagination and filters
   *     description: Retrieve a paginated list of modules with optional filtering and sorting
   *     tags: [Catalogue]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 20
   *         description: Items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Text search in code, name, or description
   *       - in: query
   *         name: semester
   *         schema:
   *           type: string
   *         description: Filter by semester (e.g., 2025_1, 2025_2, 2024_S)
   *       - in: query
   *         name: minAU
   *         schema:
   *           type: number
   *         description: Minimum academic units
   *       - in: query
   *         name: maxAU
   *         schema:
   *           type: number
   *         description: Maximum academic units
   *       - in: query
   *         name: hasPrerequisite
   *         schema:
   *           type: boolean
   *         description: Filter modules that have prerequisites (true/false)
   *       - in: query
   *         name: level
   *         schema:
   *           type: string
   *         description: Filter by module level (e.g., "1", "2", "3", "4")
   *       - in: query
   *         name: bdeUe
   *         schema:
   *           type: boolean
   *         description: Filter modules marked as BDE or unrestricted elective
   *       - in: query
   *         name: school
   *         schema:
   *           type: string
   *         description: Filter by school code (e.g., SCSE)
   *       - in: query
   *         name: days
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: Filter modules whose indexes occur only on these days
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [code, name, au]
   *         description: Sort field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         description: Sort order
   *     responses:
   *       200:
   *         description: Modules retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Module'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: number
   *                     limit:
   *                       type: number
   *                     total:
   *                       type: number
   *                     totalPages:
   *                       type: number
   *                     hasNext:
   *                       type: boolean
   *                     hasPrev:
   *                       type: boolean
    *             example:
    *               data:
    *                 - code: CS1010
    *                   semester: 2025_2
    *                   name: Programming Methodology
    *                   au: 4
    *                   school: SCSE
    *                   description: ...
    *                   prerequisites: null
    *                   indexes: []
    *               pagination:
    *                 page: 1
    *                 limit: 20
    *                 total: 1500
    *                 totalPages: 75
    *                 hasNext: true
    *                 hasPrev: false
   */
  router.get('/modules', catalogueController.getModules);

  /**
   * @swagger
   * /api/modules/{code}/dependencies:
   *   get:
   *     summary: Get dependencies for a module
   *     description: Find all modules that have this module as a prerequisite
   *     tags: [Catalogue]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Module code
   *         example: CS1010
   *     responses:
   *       200:
   *         description: Dependencies retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ["CS2030", "CS2040", "CS3230"]
    *             example:
    *               data: ["CS2030", "CS2040", "CS3230"]
   *       400:
   *         description: Invalid module code
   *       404:
   *         description: Module not found
   */
  router.get('/modules/:code/dependencies', catalogueController.getModuleDependencies);
}
