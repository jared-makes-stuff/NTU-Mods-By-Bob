import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTelegramLinkCode,
  createVacancyAlertTask,
  deleteVacancyAlertTask,
  getTelegramLinkStatus,
  getVacancyAlertTasks,
  unlinkTelegram,
} from "@/shared/api/vacancyAlerts";
import { queryKeys } from "../queryKeys";

export function useTelegramLinkStatus(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vacancyAlerts.telegramStatus(),
    queryFn: () => getTelegramLinkStatus(),
    enabled,
  });
}

export function useVacancyAlertTasks(refresh = false) {
  return useQuery({
    queryKey: queryKeys.vacancyAlerts.tasks(refresh),
    queryFn: () => getVacancyAlertTasks(refresh),
    refetchInterval: 60000, // Refetch every 60 seconds to show updated lastCheckedAt
    refetchIntervalInBackground: true,
  });
}

export function useCreateTelegramLinkCode() {
  return useMutation({
    mutationFn: () => createTelegramLinkCode(),
  });
}

export function useUnlinkTelegram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unlinkTelegram(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vacancyAlerts.telegramStatus() });
    },
  });
}

export function useCreateVacancyAlertTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleCode, indexNumber }: { moduleCode: string; indexNumber: string }) =>
      createVacancyAlertTask(moduleCode, indexNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vacancyAlerts.root });
    },
  });
}

export function useDeleteVacancyAlertTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => deleteVacancyAlertTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vacancyAlerts.root });
    },
  });
}
