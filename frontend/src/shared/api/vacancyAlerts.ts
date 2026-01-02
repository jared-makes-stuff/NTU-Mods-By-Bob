/**
 * Vacancy Alerts API
 *
 * Handles Telegram linking and vacancy alert task management.
 */

import { apiClient } from "./client";
import { parseDataResponse } from "./validation";
import {
  telegramLinkCodeSchema,
  telegramLinkStatusSchema,
  vacancyAlertTaskSchema,
  vacancyAlertTasksSchema,
} from "./schemas";

export type TelegramLinkStatus = {
  linked: boolean;
  telegramChatId?: string | null;
  telegramUsername?: string | null;
  linkedAt?: string | null;
};

export type TelegramLinkCode = {
  code: string;
  expiresAt: string;
};

export type VacancyAlertTask = {
  id: string;
  moduleCode: string;
  indexNumber: string;
  lastCheckedAt?: string | null;
  lastVacancy?: number | null;
  lastWaitlist?: number | null;
  createdAt: string;
  updatedAt: string;
};

export async function getTelegramLinkStatus(): Promise<TelegramLinkStatus> {
  const response = await apiClient.get("/vacancy-alerts/telegram/status");
  return parseDataResponse(telegramLinkStatusSchema, response.data, "Telegram link status");
}

export async function createTelegramLinkCode(): Promise<TelegramLinkCode> {
  const response = await apiClient.post("/vacancy-alerts/telegram/link-code");
  return parseDataResponse(telegramLinkCodeSchema, response.data, "Telegram link code");
}

export async function unlinkTelegram(): Promise<TelegramLinkStatus> {
  const response = await apiClient.delete("/vacancy-alerts/telegram/link");
  return parseDataResponse(telegramLinkStatusSchema, response.data, "Telegram unlink");
}

export async function getVacancyAlertTasks(refresh = false): Promise<VacancyAlertTask[]> {
  const response = await apiClient.get("/vacancy-alerts/tasks", {
    params: refresh ? { refresh: true } : undefined,
  });
  const payload = parseDataResponse(vacancyAlertTasksSchema, response.data, "Vacancy alert tasks");
  return payload.tasks;
}

export async function createVacancyAlertTask(
  moduleCode: string,
  indexNumber: string
): Promise<VacancyAlertTask> {
  const response = await apiClient.post("/vacancy-alerts/tasks", {
    moduleCode,
    indexNumber,
  });
  return parseDataResponse(vacancyAlertTaskSchema, response.data, "Create vacancy alert task");
}

export async function deleteVacancyAlertTask(taskId: string): Promise<void> {
  await apiClient.delete(`/vacancy-alerts/tasks/${taskId}`);
}
