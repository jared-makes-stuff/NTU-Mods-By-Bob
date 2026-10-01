/**
 * @swagger
 * components:
 *   schemas:
 *     CoursePlan:
 *       type: object
 *       required: [modules]
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         modules:
 *           type: array
 *           items:
 *             type: object
 *             additionalProperties: true
 *         metadata:
 *           type: object
 *           nullable: true
 *           additionalProperties: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * /api/plan:
 *   get:
 *     summary: Read the authenticated user's course roadmap
 *     description: Returns an empty module list and metadata object when no saved row exists. Persisted rows also include identifiers and timestamps.
 *     tags: [Planner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course roadmap or empty default
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CoursePlan'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Save the authenticated user's course roadmap
 *     description: Upserts modules and optional metadata for the authenticated identity. A user identifier supplied in the body does not change ownership. Module JSON is currently permissively validated.
 *     tags: [Planner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   additionalProperties: true
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Saved course roadmap
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CoursePlan'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
export {};
