/**
 * Telegram bot update handlers.
 */

import { vacancyAlertsService } from '../business/services/vacancy-alerts.service';
import { vacancyService } from '../business/services/vacancy.service';
import { hasRequiredRole, normalizeRole, type UserRole } from '../business/permissions/roles';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { 
  getHelpMessage, 
  BOT_UNLINKED_MESSAGE, 
  getWelcomeMessage, 
  getNotLinkedMessage,
  getInsufficientPermissionsMessage,
  getStatusMessage,
  getAddCommandFormat,
  getRemoveCommandFormat,
  getVacancyCommandFormat,
} from './messages';
import { TelegramClient, TelegramUpdate } from './telegramClient';

const LINK_CODE_PATTERN = /^[A-F0-9]{8}$/;

const extractLinkCode = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/link')) {
    const parts = trimmed.split(/\s+/);
    return parts[1]?.toUpperCase() ?? null;
  }

  if (LINK_CODE_PATTERN.test(trimmed.toUpperCase())) {
    return trimmed.toUpperCase();
  }

  return null;
};

const getUserRole = (role?: string | null): UserRole => normalizeRole(role);

const parseAddCommand = (text: string): { moduleCode: string; indexNumber: string } | null => {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 3) return null;
  
  const moduleCode = parts[1]?.toUpperCase().trim();
  const indexNumber = parts[2]?.trim();
  
  if (!moduleCode || !indexNumber) return null;
  if (!/^[A-Z]{2,3}\d{4}[A-Z]?$/i.test(moduleCode)) return null;
  if (!/^\d{5}$/.test(indexNumber)) return null;
  
  return { moduleCode, indexNumber };
};

const parseRemoveCommand = (text: string): string | null => {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return null;
  return parts[1]?.trim() || null;
};

export async function handleTelegramUpdate(client: TelegramClient, update: TelegramUpdate): Promise<void> {
  if (!update.message || !update.message.chat) return;

  const chatId = update.message.chat.id;
  const text = update.message.text?.trim() ?? '';

  if (!text) return;

  // /start command - Show welcome message and linking guide
  if (text.startsWith('/start')) {
    const user = await prisma.user.findUnique({
      where: { telegramChatId: String(chatId) },
      select: { role: true },
    });

    const role = user ? getUserRole(user.role) : undefined;
    const hasAccess = role ? hasRequiredRole(role, 'plus') : false;

    await client.sendMessage(chatId, getWelcomeMessage(!!user, hasAccess), true);
    return;
  }

  // /help command
  if (text.startsWith('/help')) {
    const user = await prisma.user.findUnique({
      where: { telegramChatId: String(chatId) },
      select: { role: true },
    });

    const role = user ? getUserRole(user.role) : undefined;
    await client.sendMessage(chatId, getHelpMessage(role), true);
    return;
  }

  // /unlink command
  if (text.startsWith('/unlink')) {
    await vacancyAlertsService.unlinkTelegramByChatId(String(chatId));
    await client.sendMessage(chatId, BOT_UNLINKED_MESSAGE, true);
    return;
  }

  // /status command
  if (text.startsWith('/status')) {
    const user = await prisma.user.findUnique({
      where: { telegramChatId: String(chatId) },
      select: { name: true, role: true },
    });

    if (!user) {
      await client.sendMessage(chatId, getNotLinkedMessage(), true);
      return;
    }

    const role = getUserRole(user.role);
    const hasAccess = hasRequiredRole(role, 'plus');
    await client.sendMessage(chatId, getStatusMessage(user.name, hasAccess), true);
    return;
  }

  // /vacancy command - Check vacancy for a module (Plus+ only)
  if (text.startsWith('/vacancy')) {
    const user = await prisma.user.findUnique({
      where: { telegramChatId: String(chatId) },
      select: { id: true, role: true },
    });

    if (!user) {
      await client.sendMessage(chatId, getNotLinkedMessage(), true);
      return;
    }

    const role = getUserRole(user.role);
    if (!hasRequiredRole(role, 'plus')) {
      await client.sendMessage(chatId, getInsufficientPermissionsMessage(), true);
      return;
    }

    const parts = text.trim().split(/\s+/);
    const moduleCode = parts[1]?.toUpperCase().trim();

    if (!moduleCode || !/^[A-Z]{2,3}\d{4}[A-Z]?$/i.test(moduleCode)) {
      await client.sendMessage(chatId, getVacancyCommandFormat(), true);
      return;
    }

    try {
      await client.sendMessage(chatId, `🔍 Checking vacancies for *${moduleCode}*...\n\nThis may take a moment.`, true);
      
      const result = await vacancyService.getCourseVacancies(moduleCode);

      if (!result.success) {
        const errorMsg = result.errorMessage || 'Failed to retrieve vacancy information.';
        await client.sendMessage(chatId, `❌ *Error*\n\n${errorMsg}`, true);
        return;
      }

      if (!result.data || result.data.length === 0) {
        await client.sendMessage(
          chatId,
          `📭 *No Vacancies Found*\n\nNo indexes found for module \`${moduleCode}\`.\n\nPlease check the module code and try again.`,
          true
        );
        return;
      }

      let message = `📊 *Vacancy for ${moduleCode}*\n\n`;
      
      result.data.forEach((indexData: { index: string; vacancy: number; waitlist: number; classes?: Array<{ type: string }> }) => {
        const vacancyIcon = indexData.vacancy > 0 ? '✅' : '❌';
        message += `${vacancyIcon} *Index ${indexData.index}*\n`;
        message += `   Vacancy: *${indexData.vacancy}* | Waitlist: ${indexData.waitlist}\n`;
        
        if (indexData.classes && indexData.classes.length > 0) {
          const classTypes = [...new Set(indexData.classes.map((c: { type: string }) => c.type))].join(', ');
          message += `   Classes: ${classTypes}\n`;
        }
        message += '\n';
      });

      message += `💡 Use \`/add ${moduleCode} INDEX\` to set up automated alerts for a specific index.`;

      await client.sendMessage(chatId, message, true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check vacancy';
      logger.error('[TelegramBot] Vacancy check failed', { chatId, moduleCode, error });
      await client.sendMessage(chatId, `❌ *Failed to check vacancy*\n\n${errorMessage}`, true);
    }
    return;
  }

  // /list command - List all vacancy alerts (Plus+ only)
  if (text.startsWith('/list')) {
    const user = await prisma.user.findUnique({
      where: { telegramChatId: String(chatId) },
      select: { id: true, role: true },
    });

    if (!user) {
      await client.sendMessage(chatId, getNotLinkedMessage(), true);
      return;
    }

    const role = getUserRole(user.role);
    if (!hasRequiredRole(role, 'plus')) {
      await client.sendMessage(chatId, getInsufficientPermissionsMessage(), true);
      return;
    }

    try {
      const { tasks } = await vacancyAlertsService.listAlertTasks(user.id, false);
      
      if (tasks.length === 0) {
        await client.sendMessage(
          chatId,
          '📋 *Your Vacancy Alerts*\n\nYou don\'t have any alerts yet.\n\nUse `/add MODULE_CODE INDEX_NUMBER` to create one!\n\n*Example:* `/add CE2002 10241`',
          true
        );
        return;
      }

      let message = '📋 *Your Vacancy Alerts*\n\n';
      tasks.forEach((task, index) => {
        const vacancyInfo = task.lastVacancy !== null ? ` V:${task.lastVacancy}` : '';
        const waitlistInfo = task.lastWaitlist !== null ? ` W:${task.lastWaitlist}` : '';
        const statusInfo = vacancyInfo || waitlistInfo ? ` (${vacancyInfo}${waitlistInfo})` : '';
        message += `${index + 1}. \`${task.moduleCode}\` - Index \`${task.indexNumber}\`${statusInfo}\n`;
      });
      message += '\n💡 Use `/remove NUMBER` to delete an alert.\n*Example:* `/remove 1`';

      await client.sendMessage(chatId, message, true);
    } catch (error) {
      logger.error('[TelegramBot] List alerts failed', { chatId, error });
      await client.sendMessage(chatId, '❌ Failed to retrieve your alerts. Please try again later.', true);
    }
    return;
  }

  // /add command - Add a vacancy alert (Plus+ only)
  if (text.startsWith('/add')) {
    const user = await prisma.user.findUnique({
      where: { telegramChatId: String(chatId) },
      select: { id: true, role: true },
    });

    if (!user) {
      await client.sendMessage(chatId, getNotLinkedMessage(), true);
      return;
    }

    const role = getUserRole(user.role);
    if (!hasRequiredRole(role, 'plus')) {
      await client.sendMessage(chatId, getInsufficientPermissionsMessage(), true);
      return;
    }

    const parsed = parseAddCommand(text);
    if (!parsed) {
      await client.sendMessage(chatId, getAddCommandFormat(), true);
      return;
    }

    try {
      const task = await vacancyAlertsService.createAlertTask(user.id, parsed);
      await client.sendMessage(
        chatId,
        `Alert Added Successfully!\n\nModule: \`${task.moduleCode}\`\nIndex: \`${task.indexNumber}\`\n\nYou'll be notified when vacancies become available!`,
        true
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add alert';
      logger.warn('[TelegramBot] Add alert failed', { chatId, parsed, error });
      await client.sendMessage(chatId, `❌ *Failed to add alert*\n\n${errorMessage}`, true);
    }
    return;
  }

  // /remove command - Remove a vacancy alert (Plus+ only)
  if (text.startsWith('/remove')) {
    const user = await prisma.user.findUnique({
      where: { telegramChatId: String(chatId) },
      select: { id: true, role: true },
    });

    if (!user) {
      await client.sendMessage(chatId, getNotLinkedMessage(), true);
      return;
    }

    const role = getUserRole(user.role);
    if (!hasRequiredRole(role, 'plus')) {
      await client.sendMessage(chatId, getInsufficientPermissionsMessage(), true);
      return;
    }

    const indexStr = parseRemoveCommand(text);
    if (!indexStr) {
      await client.sendMessage(chatId, getRemoveCommandFormat(), true);
      return;
    }

    const alertIndex = parseInt(indexStr, 10);
    if (isNaN(alertIndex) || alertIndex < 1) {
      await client.sendMessage(chatId, '❌ Invalid alert number. Use `/list` to see your alerts.', true);
      return;
    }

    try {
      const { tasks } = await vacancyAlertsService.listAlertTasks(user.id, false);
      
      if (tasks.length === 0) {
        await client.sendMessage(chatId, '❌ You don\'t have any alerts to remove.', true);
        return;
      }

      if (alertIndex > tasks.length) {
        await client.sendMessage(
          chatId,
          `❌ Invalid alert number. You have ${tasks.length} alert${tasks.length !== 1 ? 's' : ''}.\n\nUse \`/list\` to see all alerts.`,
          true
        );
        return;
      }

      const taskToRemove = tasks[alertIndex - 1];
      if (!taskToRemove) {
        await client.sendMessage(chatId, '❌ Alert not found.', true);
        return;
      }
      
      await vacancyAlertsService.deleteAlertTask(user.id, taskToRemove.id);
      
      await client.sendMessage(
        chatId,
        `✅ *Alert Removed*\n\nModule: \`${taskToRemove.moduleCode}\`\nIndex: \`${taskToRemove.indexNumber}\`\n\nUse \`/list\` to see your remaining alerts.`,
        true
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove alert';
      logger.error('[TelegramBot] Remove alert failed', { chatId, alertIndex, error });
      await client.sendMessage(chatId, `❌ *Failed to remove alert*\n\n${errorMessage}`, true);
    }
    return;
  }

  // Handle link code (can be sent as /link CODE or just CODE)
  const linkCode = extractLinkCode(text);
  if (linkCode) {
    try {
      await vacancyAlertsService.confirmTelegramLink({
        code: linkCode,
        chatId: String(chatId),
        username: update.message.from?.username,
      });

      const user = await prisma.user.findUnique({
        where: { telegramChatId: String(chatId) },
        select: { name: true, role: true },
      });

      if (!user) {
        await client.sendMessage(chatId, '✅ Linked successfully! Open the web app to manage vacancy alerts.', true);
        return;
      }

      const role = getUserRole(user.role);
      const hasAccess = hasRequiredRole(role, 'plus');
      const accessMessage = hasAccess
        ? '\n\n✅ Vacancy alerts are now *active*!\nUse /help to see available commands.'
        : '\n\n⚠️ Vacancy alerts are not available on your current plan.';

      await client.sendMessage(
        chatId,
        `🎉 *Successfully Linked!*\n\n${user.name ? `Welcome, *${user.name}*!\n` : ''}${accessMessage}`,
        true
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to link account.';
      logger.warn('[TelegramBot] Link failed', { chatId, error });
      await client.sendMessage(chatId, `❌ *Link Failed*\n\n${message}`, true);
    }
    return;
  }

  // Unknown command
  await client.sendMessage(
    chatId,
    '❓ Unknown command.\n\nSend /help to see all available commands.',
    true
  );
}

