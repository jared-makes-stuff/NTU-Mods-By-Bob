/**
 * Test Setup File
 * 
 * This file runs before all tests and sets up:
 * - Mock Prisma client
 * - Environment variables
 * - Global test utilities
 */

import { vi } from 'vitest';
import { parse } from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { buildUrlFromHost } from '../src/config/url';

const envPath = path.resolve(__dirname, '..', '.env.example');
Object.assign(process.env, parse(readFileSync(envPath)));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

if (!process.env.PORT) {
  throw new Error('PORT is required for tests. Set it in backend/.env.');
}

if (!process.env.PUBLIC_API_HOST) {
  throw new Error('PUBLIC_API_HOST is required for tests. Set it in backend/.env.');
}

const publicApiUrl = buildUrlFromHost(process.env.PUBLIC_API_HOST, process.env.PORT);
if (publicApiUrl) {
  process.env.PUBLIC_API_URL = publicApiUrl;
}

if (!process.env.PUBLIC_API_URL) {
  throw new Error('PUBLIC_API_URL is required for tests. Check PUBLIC_API_HOST and PORT.');
}

if (!process.env.ALLOWED_ORIGINS) {
  throw new Error('ALLOWED_ORIGINS is required for tests. Set it in backend/.env.');
}


// Mock Prisma Client
vi.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    module: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    index: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    coursePlan: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    plannedModule: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    emailVerificationCode: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    passwordResetCode: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    timetable: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    timetableModule: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((operations) => {
      if (Array.isArray(operations)) {
        return Promise.all(operations);
      }

      if (typeof operations === 'function') {
        return operations({
          user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
          },
        });
      }

      return Promise.resolve(operations);
    }),
    $queryRaw: vi.fn(),
  },
}));

// Global test utilities
export const resetAllMocks = () => {
  vi.clearAllMocks();
};
