import crypto from 'crypto';
import { prisma } from '../../../config/database';
import { logger } from '../../../config/logger';
import { AppError, throwBadRequest, throwNotFound } from '../../../api/middleware/error.middleware';
import { getEmailFromAddress, getEmailTransporter } from './emailTransport';

const VERIFICATION_CODE_LENGTH = 6;
const VERIFICATION_CODE_TTL_MINUTES = 10;

type VerificationCodeRecord = {
  expiresAt: Date;
};

const hashCode = (code: string): string => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

const generateCode = (): string => {
  const max = 10 ** VERIFICATION_CODE_LENGTH;
  return crypto.randomInt(0, max).toString().padStart(VERIFICATION_CODE_LENGTH, '0');
};

const sendVerificationEmail = async (email: string, code: string, expiresAt: Date): Promise<void> => {
  const transporter = getEmailTransporter();
  if (!transporter) {
    logger.info(`[EmailVerification] SMTP not configured. Verification code for ${email}: ${code}`);
    return;
  }

  const from = getEmailFromAddress();
  const expiryMinutes = VERIFICATION_CODE_TTL_MINUTES;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Verify your email address',
    text: `Your verification code is ${code}. It expires in ${expiryMinutes} minutes.`,
    html: `
      <p>Your verification code is:</p>
      <h2 style="letter-spacing: 3px;">${code}</h2>
      <p>This code expires in ${expiryMinutes} minutes.</p>
    `,
  });

  logger.info(`[EmailVerification] Sent verification code to ${email} (expires ${expiresAt.toISOString()}).`);
};

const upsertVerificationCode = async (userId: string, codeHash: string, expiresAt: Date) => {
  return prisma.emailVerificationCode.upsert({
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

export async function ensureEmailVerificationCode(userId: string, email: string): Promise<VerificationCodeRecord> {
  const existing = await prisma.emailVerificationCode.findUnique({ where: { userId } });
  const now = new Date();

  if (existing && !existing.usedAt && existing.expiresAt > now) {
    return { expiresAt: existing.expiresAt };
  }

  const code = generateCode();
  const expiresAt = new Date(now.getTime() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);
  const codeHash = hashCode(code);

  await upsertVerificationCode(userId, codeHash, expiresAt);
  await sendVerificationEmail(email, code, expiresAt);

  return { expiresAt };
}

export async function requestEmailVerification(email: string): Promise<VerificationCodeRecord & { email: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, emailVerifiedAt: true },
  });

  if (!user) {
    throwNotFound('User');
  }

  if (user.emailVerifiedAt) {
    throw new AppError(409, 'EMAIL_ALREADY_VERIFIED', 'Email is already verified. Please log in.');
  }

  const record = await ensureEmailVerificationCode(user.id, user.email);
  return { email: user.email, ...record };
}

export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user) {
    throwNotFound('User');
  }

  if (user.emailVerifiedAt) {
    throw new AppError(409, 'EMAIL_ALREADY_VERIFIED', 'Email is already verified. Please log in.');
  }

  const record = await prisma.emailVerificationCode.findUnique({
    where: { userId: user.id },
  });

  if (!record || record.usedAt) {
    throwBadRequest('Verification code is invalid or expired.');
  }

  if (record.expiresAt <= new Date()) {
    throwBadRequest('Verification code has expired.');
  }

  const codeHash = hashCode(code);
  if (codeHash !== record.codeHash) {
    throwBadRequest('Verification code is invalid.');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationCode.update({
      where: { userId: user.id },
      data: { usedAt: new Date() },
    }),
  ]);
}
