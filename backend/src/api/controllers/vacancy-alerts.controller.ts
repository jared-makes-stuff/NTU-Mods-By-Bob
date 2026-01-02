/**
 * Vacancy Alerts Controller
 *
 * Handles Telegram linking and vacancy alert task management.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { vacancyAlertsService } from '../../business/services/vacancy-alerts.service';

export class VacancyAlertsController {
  getTelegramStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const status = await vacancyAlertsService.getTelegramStatus(userId);
    res.status(200).json({ data: status });
  });

  createTelegramLinkCode = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const result = await vacancyAlertsService.createTelegramLinkCode(userId);
    res.status(201).json({ data: result });
  });

  confirmTelegramLink = asyncHandler(async (req: Request, res: Response) => {
    const { code, chatId, username } = req.body as {
      code?: string;
      chatId?: string;
      username?: string;
    };

    if (!code || !chatId) {
      res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Code and chatId are required.' },
      });
      return;
    }

    const result = await vacancyAlertsService.confirmTelegramLink({
      code,
      chatId,
      username,
    });

    res.status(200).json({ data: result });
  });

  unlinkTelegram = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const status = await vacancyAlertsService.unlinkTelegram(userId);
    res.status(200).json({ data: status });
  });

  unlinkTelegramByChatId = asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.body as { chatId?: string };
    if (!chatId) {
      res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'chatId is required.' },
      });
      return;
    }
    await vacancyAlertsService.unlinkTelegramByChatId(chatId);
    res.status(200).json({ data: { success: true } });
  });

  listTasks = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const refresh = req.query.refresh === 'true' || req.query.refresh === '1';
    const tasks = await vacancyAlertsService.listAlertTasks(userId, refresh);
    res.status(200).json({ data: tasks });
  });

  createTask = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { moduleCode, indexNumber } = req.body as { moduleCode?: string; indexNumber?: string };
    if (!moduleCode || !indexNumber) {
      res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Module code and index number are required.' },
      });
      return;
    }

    const task = await vacancyAlertsService.createAlertTask(userId, { moduleCode, indexNumber });
    res.status(201).json({ data: task });
  });

  deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const taskId = req.params.id!;
    await vacancyAlertsService.deleteAlertTask(userId, taskId);
    res.status(204).send();
  });
}

export const vacancyAlertsController = new VacancyAlertsController();
