import bcrypt from 'bcrypt';
import { prisma } from '../../../config/database';
import { throwConflict, throwNotFound, throwUnauthorized } from '../../../api/middleware/error.middleware';
import { UpdateProfileData } from './types';

type SettingsRecord = Record<string, unknown>;

function isRecord(value: unknown): value is SettingsRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      passwordHash: true,
      oauthAccounts: true,
      settings: true,
      privacy: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throwNotFound('User');
  }

  return user;
}

export async function updateProfile(userId: string, data: UpdateProfileData) {
  const { name, email, avatarUrl, settings, avatarFile } = data;

  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser && existingUser.id !== userId) {
      throwConflict('This email address is already in use.');
    }
  }

  const updateData: Record<string, unknown> = {
    ...(name && { name }),
    ...(email && { email: email.toLowerCase() }),
    ...(avatarUrl !== undefined && { avatarUrl }),
  };

  if (avatarFile) {
    updateData.avatarData = avatarFile.buffer;
    updateData.avatarMimeType = avatarFile.mimetype;
    updateData.avatarUrl = `/api/user/${userId}/avatar`;
  }

  if (settings) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!currentUser) {
      throwNotFound('User');
    }

    const currentSettings = isRecord(currentUser.settings)
      ? currentUser.settings
      : {};
    const nextSettings = { ...currentSettings, ...settings };

    updateData.settings = nextSettings;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      passwordHash: true,
      oauthAccounts: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throwNotFound('User');
  }

  if (!user.passwordHash) {
    throwUnauthorized('Current password is incorrect.');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throwUnauthorized('Current password is incorrect.');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
}

export async function createPassword(userId: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throwNotFound('User');
  }

  if (user.passwordHash) {
    throwUnauthorized('User already has a password. Use change password instead.');
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });
}

export async function deleteAccount(userId: string, password: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throwNotFound('User');
  }

  if (!user.passwordHash) {
    throwUnauthorized('Password is incorrect.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throwUnauthorized('Password is incorrect.');
  }

  await prisma.user.delete({
    where: { id: userId },
  });
}



