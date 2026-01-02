/**
 * Minimal Telegram Bot API client using long polling.
 */

import axios from 'axios';
import { logger } from '../config/logger';

export type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramChat = {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
};

export type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

type TelegramResponse<T> = {
  ok: boolean;
  result: T;
};

export class TelegramClient {
  private api;

  constructor(token: string) {
    this.api = axios.create({
      baseURL: `https://api.telegram.org/bot${token}`,
      timeout: 20000,
    });
  }

  async getUpdates(offset: number, timeoutSeconds: number): Promise<TelegramUpdate[]> {
    try {
      const response = await this.api.get<TelegramResponse<TelegramUpdate[]>>('/getUpdates', {
        params: {
          offset,
          timeout: timeoutSeconds,
        },
      });
      return response.data.result || [];
    } catch (error) {
      logger.warn('[TelegramBot] Failed to fetch updates', { error });
      return [];
    }
  }

  async sendMessage(chatId: string | number, text: string, markdown = false): Promise<void> {
    try {
      await this.api.post<TelegramResponse<boolean>>('/sendMessage', {
        chat_id: chatId,
        text,
        ...(markdown && { parse_mode: 'Markdown' }),
      });
    } catch (error) {
      logger.warn('[TelegramBot] Failed to send message', { chatId, error });
    }
  }

  async setMyCommands(commands: Array<{ command: string; description: string }>): Promise<void> {
    try {
      await this.api.post<TelegramResponse<boolean>>('/setMyCommands', { commands });
    } catch (error) {
      logger.warn('[TelegramBot] Failed to set commands', { error });
    }
  }
}

