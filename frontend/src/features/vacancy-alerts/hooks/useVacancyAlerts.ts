"use client";

import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/use-toast";
import { getErrorMessage } from "@/shared/api/client";
import { getVacancyAlertTasks } from "@/shared/api/vacancyAlerts";
import { getModuleIndexes } from "@/shared/api/catalogue";
import type { Timetable } from "@/shared/api/types";
import { queryKeys } from "@/shared/data/queryKeys";
import {
  useCreateTelegramLinkCode,
  useCreateVacancyAlertTask,
  useDeleteVacancyAlertTask,
  useTelegramLinkStatus,
  useUnlinkTelegram,
  useVacancyAlertTasks,
} from "@/shared/data/queries/vacancyAlerts";

export function useVacancyAlerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [moduleCode, setModuleCode] = useState("");
  const [indexNumber, setIndexNumber] = useState("");
  const [linkCode, setLinkCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Index fetching state
  const [availableIndexes, setAvailableIndexes] = useState<string[]>([]);
  const [isLoadingIndexes, setIsLoadingIndexes] = useState(false);
  const [indexLoadError, setIndexLoadError] = useState<string | null>(null);

  const telegramStatusQuery = useTelegramLinkStatus(true);
  const tasksQuery = useVacancyAlertTasks(false);

  const createLinkCodeMutation = useCreateTelegramLinkCode();
  const unlinkTelegramMutation = useUnlinkTelegram();
  const createTaskMutation = useCreateVacancyAlertTask();
  const deleteTaskMutation = useDeleteVacancyAlertTask();

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const hasLinkedTelegram = Boolean(telegramStatusQuery.data?.linked);

  const existingTaskSet = useMemo(() => {
    return new Set(tasks.map((task) => `${task.moduleCode}-${task.indexNumber}`));
  }, [tasks]);

  // Fetch available indexes when module code changes
  useEffect(() => {
    const fetchIndexes = async () => {
      const normalizedCode = moduleCode.trim().toUpperCase();
      
      if (!normalizedCode) {
        setAvailableIndexes([]);
        setIndexLoadError(null);
        setIndexNumber("");
        return;
      }

      setIsLoadingIndexes(true);
      setIndexLoadError(null);

      try {
        const result = await getModuleIndexes(normalizedCode);
        
        // Extract unique index numbers from the result
        const uniqueIndexes = Array.from(
          new Set(result.data.map((idx) => idx.indexNumber))
        ).sort();
        
        setAvailableIndexes(uniqueIndexes);
        
        if (uniqueIndexes.length === 0) {
          setIndexLoadError("No indexes found for this module");
        }
        
        // Reset selected index if it's not in the new list
        if (indexNumber && !uniqueIndexes.includes(indexNumber)) {
          setIndexNumber("");
        }
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        setIndexLoadError(errorMsg || "Failed to load indexes");
        setAvailableIndexes([]);
        setIndexNumber("");
      } finally {
        setIsLoadingIndexes(false);
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchIndexes, 300);
    return () => clearTimeout(timeoutId);
  }, [moduleCode, indexNumber]);

  const handleGenerateLinkCode = async () => {
    try {
      const result = await createLinkCodeMutation.mutateAsync();
      setLinkCode(result);
      toast({
        title: "Link Code Ready",
        description: "Share this code with the Telegram bot to link your account.",
      });
    } catch (error) {
      toast({
        title: "Link Code Failed",
        description: getErrorMessage(error) || "Could not generate a link code.",
        variant: "destructive",
      });
    }
  };

  const handleUnlinkTelegram = async () => {
    try {
      await unlinkTelegramMutation.mutateAsync();
      setLinkCode(null);
      toast({
        title: "Telegram Unlinked",
        description: "Your Telegram account has been unlinked.",
      });
    } catch (error) {
      toast({
        title: "Unlink Failed",
        description: getErrorMessage(error) || "Could not unlink Telegram.",
        variant: "destructive",
      });
    }
  };

  const handleAddTask = async () => {
    const normalizedModule = moduleCode.trim().toUpperCase();
    const normalizedIndex = indexNumber.trim();

    if (!normalizedModule || !normalizedIndex) {
      toast({
        title: "Missing Details",
        description: "Module code and index number are required.",
        variant: "destructive",
      });
      return;
    }

    const taskKey = `${normalizedModule}-${normalizedIndex}`;
    if (existingTaskSet.has(taskKey)) {
      toast({
        title: "Duplicate Alert",
        description: "This module/index is already being tracked.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTaskMutation.mutateAsync({
        moduleCode: normalizedModule,
        indexNumber: normalizedIndex,
      });
      setModuleCode("");
      setIndexNumber("");
      toast({
        title: "Alert Added",
        description: "Vacancy alert registered successfully.",
      });
    } catch (error) {
      toast({
        title: "Add Alert Failed",
        description: getErrorMessage(error) || "Could not add alert.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      toast({
        title: "Alert Removed",
        description: "Vacancy alert removed.",
      });
    } catch (error) {
      toast({
        title: "Remove Failed",
        description: getErrorMessage(error) || "Could not remove alert.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await getVacancyAlertTasks(true);
      queryClient.setQueryData(queryKeys.vacancyAlerts.tasks(false), refreshed);
      toast({
        title: "Vacancies Updated",
        description: "Latest vacancy data has been loaded.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: getErrorMessage(error) || "Could not refresh vacancies.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImportFromTimetable = async (timetable: Timetable) => {
    if (!timetable.selections || timetable.selections.length === 0) {
      toast({
        title: "No Modules",
        description: "Selected timetable has no modules.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const modulesWithIndexes = timetable.selections.filter(
        (selection) => selection.moduleCode && selection.indexNumber
      );

      if (modulesWithIndexes.length === 0) {
        toast({
          title: "No Indexes",
          description: "Selected timetable has no modules with selected indexes.",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      for (const selection of modulesWithIndexes) {
        const normalizedModule = selection.moduleCode.trim().toUpperCase();
        const normalizedIndex = selection.indexNumber?.trim();
        if (!normalizedIndex) continue; // Skip if no index number
        const taskKey = `${normalizedModule}-${normalizedIndex}`;

        // Skip if already exists
        if (existingTaskSet.has(taskKey)) {
          skipCount++;
          continue;
        }

        try {
          await createTaskMutation.mutateAsync({
            moduleCode: normalizedModule,
            indexNumber: normalizedIndex,
          });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      // Close dialog
      setIsImportDialogOpen(false);

      // Show summary toast
      if (successCount > 0) {
        toast({
          title: "Alerts Imported",
          description: `Created ${successCount} alert${successCount !== 1 ? 's' : ''}${
            skipCount > 0 ? `, skipped ${skipCount} duplicate${skipCount !== 1 ? 's' : ''}` : ''
          }${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
        });
      } else if (skipCount > 0) {
        toast({
          title: "All Alerts Already Exist",
          description: `${skipCount} alert${skipCount !== 1 ? 's' : ''} already being tracked.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Import Failed",
          description: "Could not create any alerts.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: getErrorMessage(error) || "Could not import alerts from timetable.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return {
    state: {
      moduleCode,
      indexNumber,
      linkCode,
      isRefreshing,
      hasLinkedTelegram,
      telegramStatus: telegramStatusQuery.data,
      telegramLoading: telegramStatusQuery.isLoading,
      tasks,
      tasksLoading: tasksQuery.isLoading,
      isGeneratingLinkCode: createLinkCodeMutation.isPending,
      isUnlinking: unlinkTelegramMutation.isPending,
      isAddingTask: createTaskMutation.isPending,
      isDeletingTask: deleteTaskMutation.isPending,
      availableIndexes,
      isLoadingIndexes,
      indexLoadError,
      isImportDialogOpen,
      isImporting,
    },
    actions: {
      setModuleCode,
      setIndexNumber,
      handleGenerateLinkCode,
      handleUnlinkTelegram,
      handleAddTask,
      setIsImportDialogOpen,
      handleImportFromTimetable,
      handleDeleteTask,
      handleRefresh,
    },
  };
}
