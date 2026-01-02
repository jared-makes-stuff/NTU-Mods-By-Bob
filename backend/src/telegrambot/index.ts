/**
 * Telegram bot bootstrapper.
 */

import { logger } from '../config/logger';
import { telegramBotConfig } from './config';
import { handleTelegramUpdate } from './handlers';
import { TelegramClient } from './telegramClient';
import { startVacancyAlertScheduler } from './vacancyScheduler';

type BotHandle = {
  stop: () => void;
};

const COMMANDS = [
  { command: 'start', description: 'Welcome message and linking guide' },
  { command: 'link', description: 'Link your account with a code' },
  { command: 'status', description: 'Show account link status' },
  { command: 'vacancy', description: 'Check vacancy for a module (Plus+ only)' },
  { command: 'list', description: 'List your vacancy alerts (Plus+ only)' },
  { command: 'add', description: 'Add a vacancy alert (Plus+ only)' },
  { command: 'remove', description: 'Remove a vacancy alert (Plus+ only)' },
  { command: 'unlink', description: 'Unlink your Telegram account' },
  { command: 'help', description: 'Show help message' },
];

export function startTelegramBot(): BotHandle | null {
  if (!telegramBotConfig.enabled) {
    logger.info('[TelegramBot] Disabled by configuration');
    return null;
  }

  if (!telegramBotConfig.token) {
    logger.warn('[TelegramBot] TELEGRAM_BOT_TOKEN missing. Bot will not start.');
    return null;
  }

  const client = new TelegramClient(telegramBotConfig.token);
  void client.setMyCommands(COMMANDS);

  let stopped = false;
  let offset = 0;

  const poll = async () => {
    if (stopped) return;

    const updates = await client.getUpdates(offset, 10);
    for (const update of updates) {
      offset = Math.max(offset, update.update_id + 1);
      await handleTelegramUpdate(client, update);
    }

    if (!stopped) {
      setTimeout(poll, telegramBotConfig.pollIntervalMs);
    }
  };

  void poll();

  const scheduler = startVacancyAlertScheduler(client, telegramBotConfig.vacancyCheckIntervalMs);

  logger.info('[TelegramBot] Started');

  return {
    stop: () => {
      stopped = true;
      scheduler.stop();
      logger.info('[TelegramBot] Stopped');
    },
  };
}

