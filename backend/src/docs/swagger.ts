/**
 * Swagger/OpenAPI Configuration
 * 
 * This file configures Swagger for API documentation.
 * It defines the OpenAPI specification and scans route files for JSDoc annotations.
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env';

/**
 * Swagger definition
 * This is the base OpenAPI specification
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'NTU Mods API Documentation',
    version: '1.0.0',
    description: `
      **NTU Mods** Backend API
      
      This API provides endpoints for:
      - **Authentication**: User registration, login, and JWT token management
      - **Module Catalogue**: Browse and search university modules
      - **Timetable Planning**: Create and manage personalized timetables
      - **Course Planning**: Plan multi-semester academic programs
      
      ## Authentication
      Most endpoints require authentication. You can authenticate using:
      - **HTTP-only cookies** (default for browser clients)
      - **Authorization header** (Bearer token)

      **Cookie names**:
      - \`access_token\`
      - \`refresh_token\`

      **Authorization header example**:
      \`\`\`
      Authorization: Bearer <your_jwt_token>
      \`\`\`
      
      ## Error Responses
      All error responses follow this format:
      \`\`\`json
      {
        "error": {
          "code": "ERROR_CODE",
          "message": "Human-readable error message",
          "timestamp": "2024-01-01T00:00:00.000Z"
        }
      }
      \`\`\`
    `,
    contact: {
      name: 'NTU Mods Development Team',
      email: 'support@ntumods.dev',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Development server',
    },
    {
      url: 'https://api.ntumods.dev',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token (obtained from /api/auth/login)',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'HTTP-only access token cookie (set by /api/auth/login)',
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request - Invalid input data',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'FORBIDDEN',
                message: 'You do not have permission to access this resource',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Not found - Resource does not exist',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'NOT_FOUND',
                message: 'Resource not found',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      Conflict: {
        description: 'Conflict - Resource already exists',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'CONFLICT',
                message: 'Resource already exists',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
    schemas: {
      // Common schemas
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Invalid request data',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
      
      // Auth schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          role: {
            type: 'string',
            example: 'user',
            enum: ['superadmin', 'admin', 'pro', 'plus', 'user'],
          },
          avatarUrl: {
            type: 'string',
            nullable: true,
            example: 'https://cdn.example.com/avatar.png',
          },
          settings: {
            type: 'object',
            additionalProperties: true,
            nullable: true,
          },
          privacy: {
            type: 'object',
            additionalProperties: true,
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          accessToken: {
            type: 'string',
            description: 'JWT access token (expires in 15 minutes)',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token (expires in 7 days)',
          },
        },
      },
      AuthConfig: {
        type: 'object',
        properties: {
          googleClientId: {
            type: 'string',
            nullable: true,
          },
          githubClientId: {
            type: 'string',
            nullable: true,
          },
        },
      },
      TokenPair: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token (expires in 15 minutes)',
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token (expires in 7 days)',
          },
        },
      },
      
      // Module schemas
      Module: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            example: 'CS2030S',
            description: 'Unique module code',
          },
          semester: {
            type: 'string',
            example: '2025_2',
            description: 'Academic semester identifier',
          },
          name: {
            type: 'string',
            example: 'Programming Methodology II',
          },
          au: {
            type: 'number',
            example: 4,
            description: 'Academic Units',
          },
          school: {
            type: 'string',
            example: 'SCSE',
          },
          description: {
            type: 'string',
            example: 'Introduction to object-oriented programming...',
          },
          prerequisites: {
            oneOf: [
              { type: 'string' },
              { type: 'object' },
            ],
            nullable: true,
            example: { or: ['CS1010', 'CS1101S'] },
          },
          mutualExclusions: {
            type: 'string',
            nullable: true,
          },
          bde: {
            type: 'boolean',
            description: 'Broadening and deepening elective eligibility',
          },
          unrestrictedElective: {
            type: 'boolean',
            description: 'Unrestricted elective eligibility',
          },
          examDateTime: {
            type: 'string',
            nullable: true,
            example: '2025-05-01 09:00',
          },
          examDuration: {
            type: 'number',
            nullable: true,
            example: 120,
          },
          indexes: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Index',
            },
          },
        },
      },
      
      Index: {
        type: 'object',
        properties: {
          moduleCode: {
            type: 'string',
            example: 'CS2030S',
          },
          indexNumber: {
            type: 'string',
            example: '10101',
          },
          semester: {
            type: 'string',
            example: '2025_2',
          },
          type: {
            type: 'string',
            example: 'LEC',
          },
          day: {
            type: 'string',
            example: 'MON',
          },
          startTime: {
            type: 'string',
            example: '0900',
          },
          endTime: {
            type: 'string',
            example: '1100',
          },
          venue: {
            type: 'string',
            example: 'LT1A',
          },
          group: {
            type: 'string',
            nullable: true,
            example: 'SS1',
          },
          weeks: {
            type: 'array',
            items: {
              type: 'number',
            },
            example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          },
          vacancy: {
            type: 'number',
            nullable: true,
            example: 5,
          },
          waitlist: {
            type: 'number',
            nullable: true,
            example: 0,
          },
        },
      },
      
      // Timetable schemas
      Timetable: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
            example: 'My Fall 2024 Schedule',
          },
          semester: {
            type: 'string',
            example: 'AY2024/25 Semester 1',
          },
          year: {
            type: 'number',
            example: 2024,
          },
          selections: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/TimetableSelection',
            },
          },
          isShared: {
            type: 'boolean',
            default: false,
          },
          shareLinkId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      TimetableSelection: {
        type: 'object',
        properties: {
          moduleCode: {
            type: 'string',
            example: 'CS1010',
          },
          indexNumber: {
            type: 'string',
            example: '10101',
          },
          color: {
            type: 'string',
            nullable: true,
            example: '#3b82f6',
          },
        },
        additionalProperties: true,
      },
      TimetableCombination: {
        type: 'object',
        properties: {
          modules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'CS1010' },
                name: { type: 'string', example: 'Programming Methodology' },
                au: { type: 'number', example: 4 },
                indexNumber: { type: 'string', example: '10101' },
              },
            },
          },
          classes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                moduleCode: { type: 'string', example: 'CS1010' },
                moduleName: { type: 'string', example: 'Programming Methodology' },
                indexNumber: { type: 'string', example: '10101' },
                type: { type: 'string', example: 'LEC' },
                day: { type: 'string', example: 'MON' },
                startTime: { type: 'string', example: '0900' },
                endTime: { type: 'string', example: '1100' },
                venue: { type: 'string', example: 'LT1A' },
                weeks: { type: 'string', example: '1-13' },
              },
            },
          },
          score: {
            type: 'number',
            nullable: true,
            example: 82,
          },
        },
      },
      TimetableGenerationResult: {
        type: 'object',
        properties: {
          combinations: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/TimetableCombination',
            },
          },
          generatedAt: {
            type: 'string',
            format: 'date-time',
          },
          totalCombinations: {
            type: 'number',
            example: 120,
          },
          returnedCount: {
            type: 'number',
            example: 100,
          },
          hasMore: {
            type: 'boolean',
            example: true,
          },
        },
      },
      TimetableValidationResult: {
        type: 'object',
        properties: {
          isValid: {
            type: 'boolean',
            example: true,
          },
          conflicts: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          warnings: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          message: {
            type: 'string',
            example: 'Validation endpoint is ready. Implementation pending.',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Catalogue',
      description: 'Module catalogue and search endpoints',
    },
    {
      name: 'Module Topics',
      description: 'User-generated module topic discussions',
    },
    {
      name: 'Module Reviews',
      description: 'User-generated module reviews and ratings',
    },
    {
      name: 'Planner',
      description: 'Timetable planning and management endpoints',
    },
    {
      name: 'Timetable Generation',
      description: 'Timetable generation and validation endpoints',
    },
    {
      name: 'Course Planning',
      description: 'Multi-semester academic course planning endpoints',
    },
    {
      name: 'User',
      description: 'User profile and settings endpoints',
    },
    {
      name: 'Admin',
      description: 'Administrative user management endpoints',
    },
    {
      name: 'Health',
      description: 'System health and status endpoints',
    },
    {
      name: 'Vacancy',
      description: 'Vacancy endpoints',
    },
    {
      name: 'Vacancy Alerts',
      description: 'Telegram-linked vacancy alert tasks',
    },
  ],
};

/**
 * Options for swagger-jsdoc
 * Specifies which files to scan for JSDoc annotations
 */
const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: [
    './src/api/routes/**/*.ts',
    './src/api/controllers/**/*.ts',
    './src/types/**/*.ts',
  ],
};

/**
 * Generate Swagger specification
 * This scans the specified files for @swagger JSDoc comments
 */
export const swaggerSpec = swaggerJsdoc(options);
