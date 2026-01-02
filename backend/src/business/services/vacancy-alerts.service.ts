import { randomBytes } from 'crypto';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { AppError } from '../../api/middleware/error.middleware';

const LINK_CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

type TelegramLinkStatus = {
  linked: boolean;
  telegramChatId?: string | null;
  telegramUsername?: string | null;
  linkedAt?: Date | null;
};

type VacancyAlertTaskInput = {
  moduleCode: string;
  indexNumber: string;
};

const normalizeModuleCode = (value: string): string => value.trim().toUpperCase();

const isValidModuleCode = (value: string): boolean =>
  /^[A-Z]{2,3}\d{4}[A-Z]?$/i.test(value.trim());

const isValidIndexNumber = (value: string): boolean => /^\d{5}$/.test(value.trim());

async function generateUniqueLinkCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = randomBytes(4).toString('hex').toUpperCase();
    const existing = await prisma.telegramLinkToken.findUnique({ where: { code } });
    if (!existing) {
      return code;
    }
  }
  throw new AppError(500, 'LINK_CODE_FAILED', 'Unable to generate a unique link code.');
}

export class VacancyAlertsService {
  async getTelegramStatus(userId: string): Promise<TelegramLinkStatus> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramLinkedAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return {
      linked: Boolean(user.telegramChatId),
      telegramChatId: user.telegramChatId,
      telegramUsername: user.telegramUsername,
      linkedAt: user.telegramLinkedAt,
    };
  }

  async createTelegramLinkCode(userId: string): Promise<{ code: string; expiresAt: Date }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (user.telegramChatId) {
      throw new AppError(409, 'ALREADY_LINKED', 'Telegram account is already linked.');
    }

    const now = new Date();
    await prisma.telegramLinkToken.deleteMany({
      where: {
        userId,
        OR: [{ usedAt: { not: null } }, { expiresAt: { lt: now } }],
      },
    });

    const existing = await prisma.telegramLinkToken.findFirst({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (existing) {
      return { code: existing.code, expiresAt: existing.expiresAt };
    }

    const code = await generateUniqueLinkCode();
    const expiresAt = new Date(now.getTime() + LINK_CODE_TTL_MS);

    await prisma.telegramLinkToken.create({
      data: {
        userId,
        code,
        expiresAt,
      },
    });

    return { code, expiresAt };
  }

  async confirmTelegramLink(payload: {
    code: string;
    chatId: string;
    username?: string | null;
  }): Promise<TelegramLinkStatus> {
    const { code, chatId, username } = payload;
    const normalizedCode = code.trim().toUpperCase();
    const now = new Date();

    const token = await prisma.telegramLinkToken.findUnique({
      where: { code: normalizedCode },
    });

    if (!token || token.usedAt || token.expiresAt <= now) {
      throw new AppError(400, 'INVALID_LINK_CODE', 'Link code is invalid or expired.');
    }

    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { telegramChatId: true },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    if (user.telegramChatId) {
      throw new AppError(409, 'ALREADY_LINKED', 'Telegram account is already linked.');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: token.userId },
        data: {
          telegramChatId: chatId,
          telegramUsername: username?.trim() || null,
          telegramLinkedAt: now,
        },
      }),
      prisma.telegramLinkToken.update({
        where: { id: token.id },
        data: { usedAt: now },
      }),
    ]);

    return {
      linked: true,
      telegramChatId: chatId,
      telegramUsername: username?.trim() || null,
      linkedAt: now,
    };
  }

  async unlinkTelegram(userId: string): Promise<TelegramLinkStatus> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkedAt: null,
      },
      select: {
        telegramChatId: true,
        telegramUsername: true,
        telegramLinkedAt: true,
      },
    });

    return {
      linked: Boolean(user.telegramChatId),
      telegramChatId: user.telegramChatId,
      telegramUsername: user.telegramUsername,
      linkedAt: user.telegramLinkedAt,
    };
  }

  async unlinkTelegramByChatId(chatId: string): Promise<void> {
    await prisma.user.updateMany({
      where: { telegramChatId: chatId },
      data: {
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkedAt: null,
      },
    });
  }

  async listAlertTasks(userId: string, _refresh: boolean): Promise<{
    tasks: Array<{
      id: string;
      moduleCode: string;
      indexNumber: string;
      lastCheckedAt: Date | null;
      lastVacancy: number | null;
      lastWaitlist: number | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }> {
    const tasks = await prisma.vacancyAlertTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    // Get vacancy data from Index table
    const tasksWithVacancy = await Promise.all(
      tasks.map(async (task) => {
        try {
          // Find the most recent semester for this module
          const moduleRecord = await prisma.module.findFirst({
            where: { code: task.moduleCode },
            orderBy: { semester: 'desc' },
            select: { semester: true },
          });

          if (!moduleRecord) {
            return {
              id: task.id,
              moduleCode: task.moduleCode,
              indexNumber: task.indexNumber,
              lastCheckedAt: null,
              lastVacancy: null,
              lastWaitlist: null,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
            };
          }

          // Get vacancy data from Index table
          const indexRecord = await prisma.index.findFirst({
            where: {
              moduleCode: task.moduleCode,
              indexNumber: task.indexNumber,
              semester: moduleRecord.semester,
            },
            select: {
              vacancy: true,
              waitlist: true,
              lastVacancyCheckAt: true,
            },
          });

          return {
            id: task.id,
            moduleCode: task.moduleCode,
            indexNumber: task.indexNumber,
            lastCheckedAt: indexRecord?.lastVacancyCheckAt || null,
            lastVacancy: indexRecord?.vacancy ?? null,
            lastWaitlist: indexRecord?.waitlist ?? null,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          };
        } catch (error) {
          logger.warn('[VacancyAlerts] Failed to get vacancy for task', {
            moduleCode: task.moduleCode,
            indexNumber: task.indexNumber,
            error,
          });
          return {
            id: task.id,
            moduleCode: task.moduleCode,
            indexNumber: task.indexNumber,
            lastCheckedAt: null,
            lastVacancy: null,
            lastWaitlist: null,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          };
        }
      })
    );

    return { tasks: tasksWithVacancy };
  }

  async createAlertTask(userId: string, input: VacancyAlertTaskInput) {
    const moduleCode = normalizeModuleCode(input.moduleCode);
    const indexNumber = input.indexNumber.trim();

    if (!moduleCode || !isValidModuleCode(moduleCode)) {
      throw new AppError(400, 'INVALID_MODULE', 'Module code is invalid.');
    }

    if (!indexNumber || !isValidIndexNumber(indexNumber)) {
      throw new AppError(400, 'INVALID_INDEX', 'Index number is invalid.');
    }

    const existing = await prisma.vacancyAlertTask.findFirst({
      where: { userId, moduleCode, indexNumber },
    });

    if (existing) {
      throw new AppError(409, 'ALERT_EXISTS', 'This alert already exists.');
    }

    // Create the alert task with lastNotifiedVacancy = 0
    return prisma.vacancyAlertTask.create({
      data: {
        userId,
        moduleCode,
        indexNumber,
        lastNotifiedVacancy: 0,
      },
    });
  }

  async deleteAlertTask(userId: string, taskId: string): Promise<void> {
    const existing = await prisma.vacancyAlertTask.findFirst({
      where: { id: taskId, userId },
    });

    if (!existing) {
      throw new AppError(404, 'ALERT_NOT_FOUND', 'Alert task not found.');
    }

    await prisma.vacancyAlertTask.delete({ where: { id: taskId } });
  }
}

export const vacancyAlertsService = new VacancyAlertsService();
