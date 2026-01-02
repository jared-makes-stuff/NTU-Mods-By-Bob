"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Link2, RefreshCw, Trash2, Loader2, Calendar } from "lucide-react";
import { useVacancyAlerts } from "../hooks/useVacancyAlerts";
import { ImportFromTimetableDialog } from "./components/ImportFromTimetableDialog";

const formatTimestamp = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-SG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function VacancyAlerts() {
  const { state, actions } = useVacancyAlerts();
  const {
    moduleCode,
    indexNumber,
    linkCode,
    isRefreshing,
    hasLinkedTelegram,
    telegramStatus,
    telegramLoading,
    tasks,
    tasksLoading,
    isGeneratingLinkCode,
    isUnlinking,
    isAddingTask,
    isDeletingTask,
    availableIndexes,
    isLoadingIndexes,
    indexLoadError,
    isImportDialogOpen,
    isImporting,
  } = state;

  const {
    setModuleCode,
    setIndexNumber,
    handleGenerateLinkCode,
    handleUnlinkTelegram,
    handleAddTask,
    handleDeleteTask,
    handleRefresh,
    setIsImportDialogOpen,
    handleImportFromTimetable,
  } = actions;

  const linkExpiry = useMemo(() => formatTimestamp(linkCode?.expiresAt), [linkCode?.expiresAt]);

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vacancy Alerts</h1>
          <p className="text-muted-foreground text-sm">
            Track module vacancies and receive Telegram alerts when slots open up.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Telegram Linking
          </CardTitle>
          <CardDescription>
            Link your Telegram account to receive vacancy notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {telegramLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking link status...
            </div>
          ) : hasLinkedTelegram ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="default">Linked</Badge>
                <span className="text-sm text-muted-foreground">
                  {telegramStatus?.telegramUsername
                    ? `@${telegramStatus.telegramUsername}`
                    : telegramStatus?.telegramChatId || "Telegram account linked"}
                </span>
              </div>
              <Button variant="destructive" size="sm" onClick={handleUnlinkTelegram} disabled={isUnlinking}>
                Unlink Telegram
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={handleGenerateLinkCode} disabled={isGeneratingLinkCode}>
                {isGeneratingLinkCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Link Code
              </Button>
              {linkCode && (
                <div className="rounded-md border p-3 space-y-2 text-sm">
                  <div className="font-semibold">Your link code: {linkCode.code}</div>
                  <div className="text-muted-foreground">Expires: {linkExpiry}</div>
                  <div className="text-muted-foreground">
                    Send this code to the Telegram bot:
                  </div>
                  <div className="rounded bg-muted px-2 py-1 font-mono text-xs">
                    https://t.me/ntumodsbybob_bot
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Register Vacancy Alert</CardTitle>
              <CardDescription>
                Add a module index to monitor for vacancy changes. Note: Some indexes may have hidden vacancy data and will not appear in real-time checks, but alerts will still be created.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsImportDialogOpen(true)}
              className="shrink-0"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Import from Timetable
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Module Code</label>
              <Input
                value={moduleCode}
                onChange={(event) => setModuleCode(event.target.value)}
                placeholder="SC2002"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Index Number</label>
              <Select
                value={indexNumber}
                onValueChange={setIndexNumber}
                disabled={!moduleCode || isLoadingIndexes}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !moduleCode 
                      ? "Enter module code first" 
                      : isLoadingIndexes 
                      ? "Loading indexes..." 
                      : availableIndexes.length === 0
                      ? "No indexes found"
                      : "Select an index"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableIndexes.map((idx) => (
                    <SelectItem key={idx} value={idx}>
                      {idx}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {indexLoadError && (
                <p className="text-xs text-muted-foreground">
                  {indexLoadError}
                </p>
              )}
            </div>
            <Button onClick={handleAddTask} disabled={isAddingTask} className="md:w-auto w-full">
              {isAddingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracked Alerts</CardTitle>
          <CardDescription>
            Each alert is unique per module and index.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading alerts...
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-sm text-muted-foreground">No alerts registered yet.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Index</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Vacancy</TableHead>
                    <TableHead>Waitlist</TableHead>
                    <TableHead className="w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task, idx) => (
                    <TableRow key={task.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{task.moduleCode}</TableCell>
                      <TableCell>{task.indexNumber}</TableCell>
                      <TableCell>{formatTimestamp(task.lastCheckedAt)}</TableCell>
                      <TableCell>
                        {task.lastVacancy === null || task.lastVacancy === undefined
                          ? "-"
                          : task.lastVacancy}
                      </TableCell>
                      <TableCell>
                        {task.lastWaitlist === null || task.lastWaitlist === undefined
                          ? "-"
                          : task.lastWaitlist}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={isDeletingTask}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ImportFromTimetableDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onConfirm={handleImportFromTimetable}
        isImporting={isImporting}
      />
    </div>
  );
}
