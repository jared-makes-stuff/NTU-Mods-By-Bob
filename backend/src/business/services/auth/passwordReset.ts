import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../../config/database';
import { logger } from '../../../config/logger';
import { throwBadRequest, throwNotFound } from '../../../api/middleware/error.middleware';
import { getEmailFromAddress, getEmailTransporter } from './emailTransport';

const RESET_CODE_LENGTH = 6;
const RESET_CODE_TTL_MINUTES = 10;
const SALT_ROUNDS = 10;

type ResetCodeRecord = {
  expiresAt: Date;
};

const hashCode = (code: string): string => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

const generateCode = (): string => {
  const max = 10 ** RESET_CODE_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(RESET_CODE_LENGTH, '0');
};

const sendPasswordResetEmail = async (email: string, code: string, expiresAt: Date): Promise<void> => {
  const transporter = getEmailTransporter();
  if (!transporter) {
    logger.info(`[PasswordReset] SMTP not configured. Reset code for ${email}: ${code}`);
    return;
  }

  const from = getEmailFromAddress();
  const expiryMinutes = RESET_CODE_TTL_MINUTES;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Reset your password',
    text: `Your password reset code is ${code}. It expires in ${expiryMinutes} minutes.`,
    html: `
      <p>Your password reset code is:</p>
      <h2 style="letter-spacing: 3px;">${code}</h2>
      <p>This code expires in ${expiryMinutes} minutes.</p>
    `,
  });

  logger.info(`[PasswordReset] Sent reset code to ${email} (expires ${expiresAt.toISOString()}).`);
};

const upsertResetCode = async (userId: string, codeHash: string, expiresAt: Date) => {
  return prisma.passwordResetCode.upsert({
    where: { userId },
    update: {
      codeHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    },
    create: {
      userId,
      codeHash,
      expiresAt,
    },
  });
};

export async function ensurePasswordResetCode(userId: string, email: string): Promise<ResetCodeRecord> {
  const existing = await prisma.passwordResetCode.findUnique({ where: { userId } });
  const now = new Date();

  if (existing && !existing.usedAt && existing.expiresAt > now) {
    return { expiresAt: existing.expiresAt };
  }

  const code = generateCode();
  const expiresAt = new Date(now.getTime() + RESET_CODE_TTL_MINUTES * 60 * 1000);
  const codeHash = hashCode(code);

  await upsertResetCode(userId, codeHash, expiresAt);
  await sendPasswordResetEmail(email, code, expiresAt);

  return { expiresAt };
}

export async function requestPasswordReset(email: string): Promise<ResetCodeRecord & { email: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true },
  });

  if (!user) {
    throwNotFound('User');
  }

  const record = await ensurePasswordResetCode(user.id, user.email);
  return { email: user.email, ...record };
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user) {
    throwNotFound('User');
  }

  const record = await prisma.passwordResetCode.findUnique({
    where: { userId: user.id },
  });

  if (!record || record.usedAt) {
    throwBadRequest('Password reset code is invalid or expired.');
  }

  if (record.expiresAt <= new Date()) {
    throwBadRequest('Password reset code has expired.');
  }

  const codeHash = hashCode(code);
  if (codeHash !== record.codeHash) {
    throwBadRequest('Password reset code is invalid.');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    }),
    prisma.passwordResetCode.update({
      where: { userId: user.id },
      data: { usedAt: new Date() },
    }),
  ]);
}
