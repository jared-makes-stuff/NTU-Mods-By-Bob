import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../../config/database';
import { logger } from '../../../config/logger';
import { env } from '../../../config/env';
import { normalizeUrl } from '../../../config/url';
import {
  AppError,
  throwBadRequest,
  throwConflict,
  throwNotFound,
  throwUnauthorized,
} from '../../../api/middleware/error.middleware';
import { getEmailFromAddress, getEmailTransporter } from './emailTransport';

const EMAIL_CHANGE_CODE_LENGTH = 6;
const EMAIL_CHANGE_CODE_TTL_MINUTES = 10;
const EMAIL_CHANGE_REVERT_TTL_DAYS = 7;

type EmailChangeRecord = {
  email: string;
  expiresAt: Date;
};

const hashCode = (code: string): string => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

const generateCode = (): string => {
  const max = 10 ** EMAIL_CHANGE_CODE_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(EMAIL_CHANGE_CODE_LENGTH, '0');
};

const sendEmailChangeEmail = async (email: string, code: string, expiresAt: Date): Promise<void> => {
  const transporter = getEmailTransporter();
  if (!transporter) {
    logger.info(`[EmailChange] SMTP not configured. Verification code for ${email}: ${code}`);
    return;
  }

  const from = getEmailFromAddress();
  const expiryMinutes = EMAIL_CHANGE_CODE_TTL_MINUTES;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Confirm your new email address',
    text: `Your verification code is ${code}. It expires in ${expiryMinutes} minutes.`,
    html: `
      <p>Use this verification code to confirm your new email address:</p>
      <h2 style="letter-spacing: 3px;">${code}</h2>
      <p>This code expires in ${expiryMinutes} minutes.</p>
    `,
  });

  logger.info(`[EmailChange] Sent verification code to ${email} (expires ${expiresAt.toISOString()}).`);
};

const resolveFrontendBaseUrl = (): string => {
  const origins = env.ALLOWED_ORIGINS.split(',')
    .map((origin) => normalizeUrl(origin.trim()))
    .filter((origin): origin is string => Boolean(origin));

  if (!origins[0]) {
    throw new Error('ALLOWED_ORIGINS must include at least one valid origin.');
  }

  return origins[0];
};

const buildRevertLink = (token: string): string => {
  const baseUrl = resolveFrontendBaseUrl();
  return `${baseUrl}/auth/email-change/revert?token=${encodeURIComponent(token)}`;
};

const sendEmailChangeNotice = async (
  oldEmail: string,
  newEmail: string,
  revertLink: string,
  expiresAt: Date
): Promise<void> => {
  const transporter = getEmailTransporter();
  if (!transporter) {
    logger.info(
      `[EmailChange] SMTP not configured. Email change notice for ${oldEmail}: revert link ${revertLink}`
    );
    return;
  }

  const from = getEmailFromAddress();
  const expiryDate = expiresAt.toLocaleString();

  await transporter.sendMail({
    from,
    to: oldEmail,
    subject: 'Your email address was changed',
    text: `Your account email was changed to ${newEmail}. If this wasn't you, use this link to revert the change: ${revertLink}. This link expires on ${expiryDate}.`,
    html: `
      <p>Your account email was changed to <strong>${newEmail}</strong>.</p>
      <p>If this wasn't you, use the link below to revert the change:</p>
      <p><a href="${revertLink}">Revert email change</a></p>
      <p>This link expires on ${expiryDate}.</p>
    `,
  });

  logger.info(`[EmailChange] Sent change notice to ${oldEmail}.`);
};

const upsertEmailChangeRequest = async (
  userId: string,
  newEmail: string,
  codeHash: string,
  expiresAt: Date
) => {
  return prisma.emailChangeRequest.upsert({
    where: { userId },
    update: {
      newEmail,
      codeHash,
      expiresAt,
      usedAt: null,
      oldEmail: null,
      revertTokenHash: null,
      revertExpiresAt: null,
      revertUsedAt: null,
      createdAt: new Date(),
    },
    create: {
      userId,
      newEmail,
      codeHash,
      expiresAt,
    },
  });
};

export async function requestEmailChange(
  userId: string,
  newEmail: string,
  password: string
): Promise<EmailChangeRecord> {
  const normalizedEmail = newEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    throwBadRequest('New email address is required.');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user) {
    throwNotFound('User');
  }

  if (!user.passwordHash) {
    throwBadRequest('Please create a password before changing your email address.');
  }

  if (!password || !password.trim()) {
    throwBadRequest('Current password is required to change your email.');
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    throwUnauthorized('Current password is incorrect.');
  }

  if (user.email.toLowerCase() === normalizedEmail) {
    throwBadRequest('New email address must be different from your current email.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== userId) {
    throwConflict('This email address is already in use.');
  }

  const pendingForEmail = await prisma.emailChangeRequest.findFirst({
    where: {
      newEmail: normalizedEmail,
      userId: { not: userId },
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (pendingForEmail) {
    throw new AppError(
      409,
      'EMAIL_CHANGE_PENDING',
      'This email address is already pending verification.'
    );
  }

  const existingRequest = await prisma.emailChangeRequest.findUnique({
    where: { userId },
  });

  if (
    existingRequest &&
    !existingRequest.usedAt &&
    existingRequest.expiresAt > new Date() &&
    existingRequest.newEmail.toLowerCase() === normalizedEmail
  ) {
    return { email: existingRequest.newEmail, expiresAt: existingRequest.expiresAt };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_CODE_TTL_MINUTES * 60 * 1000);
  const codeHash = hashCode(code);

  await upsertEmailChangeRequest(userId, normalizedEmail, codeHash, expiresAt);
  await sendEmailChangeEmail(normalizedEmail, code, expiresAt);

  return { email: normalizedEmail, expiresAt };
}

export async function verifyEmailChange(
  userId: string,
  code: string
): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  createdAt: Date;
}> {
  const record = await prisma.emailChangeRequest.findUnique({
    where: { userId },
  });

  if (!record || record.usedAt) {
    throwBadRequest('Email change request is invalid or expired.');
  }

  if (record.expiresAt <= new Date()) {
    throwBadRequest('Email change request has expired.');
  }

  const codeHash = hashCode(code);
  if (codeHash !== record.codeHash) {
    throwBadRequest('Verification code is invalid.');
  }

  const normalizedEmail = record.newEmail.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== userId) {
    throwConflict('This email address is already in use.');
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!currentUser) {
    throwNotFound('User');
  }

  const oldEmail = currentUser.email.toLowerCase();
  const revertToken = crypto.randomBytes(32).toString('hex');
  const revertTokenHash = hashCode(revertToken);
  const revertExpiresAt = new Date(
    Date.now() + EMAIL_CHANGE_REVERT_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        email: normalizedEmail,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    }),
    prisma.emailChangeRequest.update({
      where: { userId },
      data: {
        usedAt: new Date(),
        oldEmail,
        revertTokenHash,
        revertExpiresAt,
        revertUsedAt: null,
      },
    }),
  ]);

  const revertLink = buildRevertLink(revertToken);
  await sendEmailChangeNotice(oldEmail, normalizedEmail, revertLink, revertExpiresAt);

  return user;
}

export async function revertEmailChange(token: string): Promise<{ email: string }> {
  if (!token) {
    throwBadRequest('Revert token is required.');
  }

  const tokenHash = hashCode(token);
  const record = await prisma.emailChangeRequest.findUnique({
    where: { revertTokenHash: tokenHash },
  });

  if (!record || !record.revertExpiresAt || !record.oldEmail) {
    throwBadRequest('Revert link is invalid or expired.');
  }

  if (record.revertUsedAt) {
    throwBadRequest('Revert link has already been used.');
  }

  if (record.revertExpiresAt <= new Date()) {
    throwBadRequest('Revert link has expired.');
  }

  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    select: { id: true, email: true },
  });

  if (!user) {
    throwNotFound('User');
  }

  if (user.email.toLowerCase() !== record.newEmail.toLowerCase()) {
    throwBadRequest('Email has already been changed again.');
  }

  const normalizedOldEmail = record.oldEmail.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedOldEmail },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== record.userId) {
    throwConflict('This email address is already in use.');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        email: normalizedOldEmail,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.emailChangeRequest.update({
      where: { userId: record.userId },
      data: { revertUsedAt: new Date() },
    }),
  ]);

  return { email: normalizedOldEmail };
}
