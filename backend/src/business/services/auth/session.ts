import bcrypt from 'bcrypt';
import { prisma } from '../../../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../api/middleware/auth.middleware';
import { throwConflict, throwNotFound, throwUnauthorized } from '../../../api/middleware/error.middleware';
import { buildJwtPayload } from './tokenPayload';
import { AuthResponse, LoginData, RegisterData } from './types';

const SALT_ROUNDS = 10;

export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  const { email, password, name } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throwConflict('A user with this email address already exists.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      settings: {
        theme: 'system',
        language: 'en',
        preferences: {
          compactView: false,
          show24HourTime: true,
          showWeekends: false,
        },
      },
      privacy: {
        profileVisibility: 'private',
        showTimetable: true,
        showCoursePlan: true,
        showModules: true,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      passwordHash: true,
      oauthAccounts: true,
      createdAt: true,
    },
  });

  const payload = buildJwtPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { user, accessToken, refreshToken };
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      passwordHash: true,
      oauthAccounts: true,
      createdAt: true,
    },
  });

  if (!user) {
    throwUnauthorized('Invalid email or password.');
  }

  if (!user.passwordHash) {
    throwUnauthorized('Please sign in with your connected social account.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throwUnauthorized('Invalid email or password.');
  }

  const payload = buildJwtPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throwNotFound('User');
    }

    const newPayload = buildJwtPayload(user);
    const accessToken = generateAccessToken(newPayload);
    return { accessToken };
  } catch (error) {
    void error;
    throwUnauthorized('Invalid or expired refresh token.');
  }
}
