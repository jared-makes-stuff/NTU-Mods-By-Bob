import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { validateBody } from '../../middleware/validate.middleware';
import { loginSchema, registerSchema } from './schemas';

export function registerAuthPublicRoutes(router: Router): void {
  /**
   * POST /api/auth/register
   * Register a new user account
   * 
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     description: Create a new user account with email and password
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - name
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john.doe@example.com
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: SecurePass123!
   *               name:
   *                 type: string
   *                 example: John Doe
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/AuthResponse'
   *             example:
   *               data:
   *                 user:
   *                   id: 123e4567-e89b-12d3-a456-426614174000
   *                   email: john.doe@example.com
   *                   name: John Doe
   *                   avatarUrl: null
   *                   createdAt: 2024-01-01T00:00:00.000Z
   *                 accessToken: <jwt>
   *                 refreshToken: <jwt>
   *       409:
   *         description: Email already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/register', validateBody(registerSchema), authController.register);

  /**
   * POST /api/auth/login
   * Authenticate user and receive JWT tokens
   * 
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     description: Authenticate with email and password to receive JWT tokens
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john.doe@example.com
   *               password:
   *                 type: string
   *                 example: SecurePass123!
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/AuthResponse'
   *             example:
   *               data:
   *                 user:
   *                   id: 123e4567-e89b-12d3-a456-426614174000
   *                   email: john.doe@example.com
   *                   name: John Doe
   *                   avatarUrl: null
   *                   createdAt: 2024-01-01T00:00:00.000Z
   *                 accessToken: <jwt>
   *                 refreshToken: <jwt>
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/login', validateBody(loginSchema), authController.login);

  /**
   * POST /api/auth/logout
   * Clear auth cookies
   * 
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     description: Clears authentication cookies for the current session.
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     success:
   *                       type: boolean
   *                       example: true
   */
  router.post('/logout', authController.logout);
}
