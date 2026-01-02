/**
 * Message templates for Telegram bot responses.
 */

import { hasRequiredRole, type UserRole } from '../business/permissions/roles';
import { env } from '../config/env';

const getWebAppUrl = (): string => {
  const origins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  return origins[0] || 'https://your-app-url.com';
};

export const getHelpMessage = (role?: UserRole): string => {
  const hasAlertAccess = role && hasRequiredRole(role, 'plus');
  
  let message = '🔔 *Vacancy Alerts Bot*\n\n*Available Commands:*\n';
  message += '/start - Welcome message and setup guide\n';
  message += '/link <CODE> - Link your account\n';
  message += '/status - Show account status\n';
  
  if (hasAlertAccess) {
    message += '/vacancy <MODULE> - Check vacancy for a module\n';
    message += '/list - List your vacancy alerts\n';
    message += '/add <MODULE> <INDEX> - Add a vacancy alert\n';
    message += '/remove <NUMBER> - Remove a vacancy alert\n';
  }
  
  message += '/unlink - Unlink your account\n';
  message += '/help - Show this help message';
  
  return message;
};

export const getWelcomeMessage = (isLinked: boolean, hasAccess: boolean): string => {
  const webAppUrl = getWebAppUrl();
  
  if (isLinked && hasAccess) {
    return (
      '👋 *Welcome back!*\n\n' +
      'Your account is linked and ready to use.\n\n' +
      'Use /help to see all available commands.'
    );
  }
  
  if (isLinked && !hasAccess) {
    return (
      '👋 *Welcome!*\n\n' +
      'Your account is linked, but vacancy alerts are not available on your current plan.\n\n' +
      `Visit ${webAppUrl} to upgrade and unlock vacancy alerts!`
    );
  }
  
  return (
    'Welcome to the NTU Mods Vacancy Alerts Bot!\n\n' +
    'How to Get Started:\n\n' +
    '*Step 1:* Visit the web app\n' +
    `${webAppUrl}\n\n` +
    '*Step 2:* Sign in to your account\n\n' +
    '*Step 3:* Generate a linking code\n\n' +
    '*Step 4:* Come back here and send:\n' +
    '`/link YOUR_CODE`\n\n' +
    'Need help? Send /help to see all commands.'
  );
};

export const BOT_UNLINKED_MESSAGE =
  '🔗 Your Telegram account has been unlinked.\n\n' +
  'You can link it again anytime using /start to see the setup guide.';

export const getNotLinkedMessage = (): string => {
  const webAppUrl = getWebAppUrl();
  return (
    '❌ *No Account Linked*\n\n' +
    'To use this bot, you need to link your account first.\n\n' +
    '*Quick Setup:*\n' +
    `1. Visit ${webAppUrl}\n` +
    '2. Generate a linking code\n' +
    '3. Send `/link YOUR_CODE` here\n\n' +
    'Send /start for detailed instructions.'
  );
};

export const getInsufficientPermissionsMessage = (): string => {
  const webAppUrl = getWebAppUrl();
  return (
    '🔒 *Feature Not Available*\n\n' +
    'Vacancy alerts are not available on your current plan.\n\n' +
    `Visit ${webAppUrl} to upgrade your account and unlock this feature!`
  );
};

export const getStatusMessage = (userName: string | null, hasAccess: boolean): string => {
  let message = '🔗 *Account Status*\n\n';
  
  if (userName) {
    message += `Linked as: *${userName}*\n\n`;
  } else {
    message += 'Account linked\n\n';
  }
  
  if (hasAccess) {
    message += '✅ Vacancy alerts are *active* for your account.';
  } else {
    message += '❌ Vacancy alerts are *not available* on your current plan.';
  }
  
  return message;
};

export const getAddCommandFormat = (): string => {
  return (
    '➕ *Add a Vacancy Alert*\n\n' +
    'Format: `/add MODULE_CODE INDEX_NUMBER`\n\n' +
    '*Examples:*\n' +
    '`/add CE2002 10241`\n' +
    '`/add MH1810 20167`\n\n' +
    'You can find module codes and index numbers on the NTU registration system.'
  );
};

export const getRemoveCommandFormat = (): string => {
  return (
    '➖ *Remove a Vacancy Alert*\n\n' +
    'First, use `/list` to see your alerts with their IDs.\n' +
    'Then use: `/remove ALERT_ID`\n\n' +
    '*Example:*\n' +
    '`/remove 1`\n' +
    '`/remove 3`'
  );
};

export const getVacancyCommandFormat = (): string => {
  return (
    '🔍 *Check Module Vacancy*\n\n' +
    'Format: `/vacancy MODULE_CODE`\n\n' +
    '*Examples:*\n' +
    '`/vacancy SC2000`\n' +
    '`/vacancy CE2002`\n\n' +
    '💡 This will show vacancies for *all indexes* of the module.\n' +
    'Use `/add` to set up automated alerts for specific indexes.'
  );
};
