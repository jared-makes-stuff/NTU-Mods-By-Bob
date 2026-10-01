/**
 * Authentication Service Unit Tests
 * 
 * Tests for user authentication operations:
 * - Registration
 * - Login
 * - Password reset
 * - Token refresh
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/business/services/auth.service';
import { prisma } from '../../src/config/database';
import * as bcrypt from 'bcrypt';
import { ensureEmailVerificationCode } from '../../src/business/services/auth/emailVerification';

// Mock bcrypt
vi.mock('bcrypt');

// Mock JWT middleware
vi.mock('../../src/api/middleware/auth.middleware', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyRefreshToken: vi.fn(() => ({ userId: 'user-123' })),
}));

// Mock email verification helpers
vi.mock('../../src/business/services/auth/emailVerification', () => ({
  ensureEmailVerificationCode: vi.fn(async () => ({ expiresAt: new Date('2025-01-01T00:00:00.000Z') })),
  requestEmailVerification: vi.fn(),
  verifyEmailCode: vi.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      // Mock that user doesn't exist
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Mock password hashing
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

      // Mock user creation
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const result = await authService.register(registerData);

      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('verificationRequired', true);
      expect(result).toHaveProperty('expiresAt');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 10);
      expect(vi.mocked(ensureEmailVerificationCode)).toHaveBeenCalledWith('user-123', 'test@example.com');
    });

    it('should throw conflict error if email already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const existingUser = {
        id: 'existing-user',
        email: 'existing@example.com',
        name: 'Existing User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);

      await expect(authService.register(registerData)).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const registerData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      } as any);

      await authService.register(registerData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should include verification metadata in registration response', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue(mockUser as any);

      const result = await authService.register(registerData);

      expect(result.email).toBe('test@example.com');
      expect(result.verificationRequired).toBe(true);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        passwordHash: 'hashed-password',
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('SecurePass123!', 'hashed-password');
    });

    it('should throw error with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow();
    });

    it('should throw error with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        passwordHash: 'hashed-password',
        emailVerifiedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(authService.login(loginData)).rejects.toThrow();
    });

    it('should require email verification before login', async () => {
      const loginData = {
        email: 'unverified@example.com',
        password: 'SecurePass123!',
      };

      const mockUser = {
        id: 'user-123',
        email: 'unverified@example.com',
        role: 'user',
        passwordHash: 'hashed-password',
        emailVerifiedAt: null,
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await expect(authService.login(loginData)).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
      expect(vi.mocked(ensureEmailVerificationCode)).toHaveBeenCalledWith('user-123', 'unverified@example.com');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const refreshToken = 'valid-refresh-token';

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await authService.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('mock-access-token');
    });

    it('should throw error if user no longer exists', async () => {
      const refreshToken = 'valid-refresh-token';

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = 'user-123';

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        settings: {},
        privacy: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await authService.getProfile(userId);

      expect(result).toHaveProperty('email');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw error if user not found', async () => {
      const userId = 'nonexistent-user';

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.getProfile(userId)).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const userId = 'user-123';
      const updateData = {
        name: 'Updated Name',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        createdAt: new Date(),
      } as any);

      const result = await authService.updateProfile(userId, updateData);

      expect(result.name).toBe('Updated Name');
    });
  });
});
