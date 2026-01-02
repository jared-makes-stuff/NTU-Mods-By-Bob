/**
 * Periodic vacancy alert checks and Telegram notifications.
 * 
 * New approach:
 * 1. Group alert tasks by module code (not by index)
 * 2. Fetch vacancy data for entire module (all indexes) per API call
 * 3. Update Index table with vacancy/waitlist/lastVacancyCheckAt
 * 4. Notify users whose tasks match indexes with vacancy changes (0 -> >0)
 * 5. Update VacancyAlertTask.lastNotifiedVacancy to track notification state
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { hasRequiredRole, normalizeRole } from '../business/permissions/roles';
import { vacancyService } from '../business/services/vacancy.service';
import { TelegramClient } from './telegramClient';

type TaskWithUser = Prisma.VacancyAlertTaskGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        role: true;
        telegramChatId: true;
        name: true;
      };
    };
  };
}>;

export function startVacancyAlertScheduler(
  client: TelegramClient,
  intervalMs: number
): { stop: () => void } {
  let running = false;
  
  const run = async () => {
    if (running) return;
    running = true;

    try {
      // Fetch all vacancy alert tasks with user data
      const tasks = await prisma.vacancyAlertTask.findMany({
        include: {
          user: {
            select: {
              id: true,
              role: true,
              telegramChatId: true,
              name: true,
            },
          },
        },
      });

      // Group tasks by module code to minimize API calls
      const moduleGroups = new Map<string, TaskWithUser[]>();
      for (const task of tasks) {
        const moduleCode = task.moduleCode.toUpperCase();
        if (!moduleGroups.has(moduleCode)) {
          moduleGroups.set(moduleCode, []);
        }
        moduleGroups.get(moduleCode)!.push(task);
      }

      const now = new Date();

      // Process each module
      for (const [moduleCode, moduleTasks] of moduleGroups.entries()) {
        try {
          // Fetch vacancy data for all indexes of this module
          const vacancyResult = await vacancyService.getModuleVacancies(moduleCode);
          
          if (!vacancyResult.success || !vacancyResult.data) {
            logger.warn(`[VacancyScheduler] Failed to fetch vacancies for ${moduleCode}`);
            continue;
          }

          const vacancyData = vacancyResult.data; // Array of { indexNumber, vacancy, waitlist }

          // Get current semester for this module (use most recent)
          const moduleRecord = await prisma.module.findFirst({
            where: { code: moduleCode },
            orderBy: { semester: 'desc' },
            select: { semester: true },
          });

          if (!moduleRecord) {
            logger.warn(`[VacancyScheduler] Module ${moduleCode} not found in database`);
            continue;
          }

          const semester = moduleRecord.semester;

          // Update Index table with vacancy data
          for (const data of vacancyData) {
            await prisma.index.updateMany({
              where: {
                moduleCode,
                indexNumber: data.indexNumber,
                semester,
              },
              data: {
                vacancy: data.vacancy,
                waitlist: data.waitlist,
                lastVacancyCheckAt: now,
              },
            });
          }

          // Check which tasks need notifications
          for (const task of moduleTasks) {
            // Skip if user has no telegram or insufficient role
            if (!task.user.telegramChatId) continue;
            const role = normalizeRole(task.user.role);
            if (!hasRequiredRole(role, 'plus')) continue;

            // Find matching vacancy data
            const indexData = vacancyData.find(
              (v) => v.indexNumber === task.indexNumber
            );

            if (!indexData) continue;

            const currentVacancy = indexData.vacancy;
            const previousNotifiedVacancy = task.lastNotifiedVacancy;

            // Notify if vacancy went from 0 to >0
            if (currentVacancy > 0 && previousNotifiedVacancy === 0) {
              const chatId = task.user.telegramChatId;
              const displayName = task.user.name || 'User';
              const vacancyLabel = currentVacancy === 1 ? 'vacancy' : 'vacancies';
              const waitlistLabel = indexData.waitlist === 1 ? 'person' : 'people';

              await client.sendMessage(
                chatId,
                `🔔 *Vacancy Alert*\n\n${displayName}, ${moduleCode} index ${task.indexNumber} now has:\n• *${currentVacancy}* ${vacancyLabel}\n• *${indexData.waitlist}* ${waitlistLabel} on waitlist`
              );

              // Update notification state
              await prisma.vacancyAlertTask.update({
                where: { id: task.id },
                data: { lastNotifiedVacancy: currentVacancy },
              });

              logger.info(`[VacancyScheduler] Notified user ${task.userId} about ${moduleCode} ${task.indexNumber}`);
            } else if (currentVacancy === 0 && previousNotifiedVacancy > 0) {
              // Reset notification state when vacancy drops back to 0
              await prisma.vacancyAlertTask.update({
                where: { id: task.id },
                data: { lastNotifiedVacancy: 0 },
              });
            }
          }

          logger.debug(`[VacancyScheduler] Processed ${moduleCode} with ${vacancyData.length} indexes`);
        } catch (error) {
          logger.warn(`[VacancyScheduler] Error processing module ${moduleCode}`, { error });
        }
      }

      logger.info(`[VacancyScheduler] Completed vacancy check for ${moduleGroups.size} modules`);
    } catch (error) {
      logger.error('[VacancyScheduler] Vacancy alert check failed', { error });
    } finally {
      running = false;
    }
  };

  const timer = setInterval(run, intervalMs);
  void run(); // Run immediately on start

  return {
    stop: () => clearInterval(timer),
  };
}
