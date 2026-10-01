/**
 * Error Middleware Unit Tests
 * 
 * Tests for error handling utilities
 */

import { describe, it, expect } from 'vitest';
import { AppError, throwNotFound, throwBadRequest, throwUnauthorized, throwConflict } from '../../src/api/middleware/error.middleware';

describe('Error Middleware', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
    });

    it('should be throwable', () => {
      expect(() => {
        throw new AppError(500, 'INTERNAL_ERROR', 'Something went wrong');
      }).toThrow(AppError);
    });
  });

  describe('throwNotFound', () => {
    it('should throw 404 error with resource name', () => {
      expect(() => {
        throwNotFound('User');
      }).toThrow('User not found');
    });

    it('should throw AppError with statusCode 404', () => {
      try {
        throwNotFound('Module');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
        expect((error as AppError).code).toBe('NOT_FOUND');
      }
    });
  });

  describe('throwBadRequest', () => {
    it('should throw 400 error with message', () => {
      expect(() => {
        throwBadRequest('Invalid input');
      }).toThrow('Invalid input');
    });

    it('should throw AppError with statusCode 400', () => {
      try {
        throwBadRequest('Missing required field');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(400);
        expect((error as AppError).code).toBe('BAD_REQUEST');
      }
    });
  });

  describe('throwUnauthorized', () => {
    it('should throw 401 error with message', () => {
      expect(() => {
        throwUnauthorized('Invalid credentials');
      }).toThrow('Invalid credentials');
    });

    it('should throw AppError with statusCode 401', () => {
      try {
        throwUnauthorized('Token expired');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(401);
        expect((error as AppError).code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('throwConflict', () => {
    it('should throw 409 error with message', () => {
      expect(() => {
        throwConflict('Resource already exists');
      }).toThrow('Resource already exists');
    });

    it('should throw AppError with statusCode 409', () => {
      try {
        throwConflict('Email already in use');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(409);
        expect((error as AppError).code).toBe('CONFLICT');
      }
    });
  });

  describe('Error status codes', () => {
    it('should have correct status codes for different error types', () => {
      const notFoundError = new AppError(404, 'NOT_FOUND', 'Not found');
      const badRequestError = new AppError(400, 'BAD_REQUEST', 'Bad request');
      const unauthorizedError = new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
      const conflictError = new AppError(409, 'CONFLICT', 'Conflict');
      const serverError = new AppError(500, 'INTERNAL_ERROR', 'Server error');

      expect(notFoundError.statusCode).toBe(404);
      expect(badRequestError.statusCode).toBe(400);
      expect(unauthorizedError.statusCode).toBe(401);
      expect(conflictError.statusCode).toBe(409);
      expect(serverError.statusCode).toBe(500);
    });
  });
});
