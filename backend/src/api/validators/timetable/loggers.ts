/**
 * Timetable validator log helpers.
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Append a validation error entry to a log file.
 */
export function writeValidationLog(
  logPath: string,
  header: string,
  error: string,
  context: unknown
): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${header}\nError: ${error}\nContext:\n${JSON.stringify(context, null, 2)}\n${'='.repeat(80)}\n`;

  const logsDir = dirname(logPath);
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  appendFileSync(logPath, logMessage);
}
