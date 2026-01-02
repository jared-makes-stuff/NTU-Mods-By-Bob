/**
 * Telegram bot configuration derived from validated environment variables.
 */

import { env } from '../config/env';

export const telegramBotConfig = {
  enabled: env.TELEGRAM_BOT_ENABLED,
  token: env.TELEGRAM_BOT_TOKEN,
  pollIntervalMs: env.TELEGRAM_BOT_POLL_INTERVAL_SECONDS * 1000,
  vacancyCheckIntervalMs: env.VACANCY_ALERTS_CHECK_INTERVAL_SECONDS * 1000,
};

