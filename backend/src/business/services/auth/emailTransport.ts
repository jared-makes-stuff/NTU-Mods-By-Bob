import nodemailer from 'nodemailer';
import { env } from '../../../config/env';

let cachedTransporter: nodemailer.Transporter | null = null;

export const getEmailTransporter = (): nodemailer.Transporter | null => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = env.SMTP_HOST;
  if (!host) {
    return null;
  }

  const port = env.SMTP_PORT;
  if (!port) {
    throw new Error('SMTP_PORT is required when SMTP_HOST is set.');
  }
  const secure = port === 465;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return cachedTransporter;
};

export const getEmailFromAddress = (): string => {
  if (!env.SMTP_FROM) {
    throw new Error('SMTP_FROM is required when SMTP_HOST is set.');
  }
  return env.SMTP_FROM;
};
