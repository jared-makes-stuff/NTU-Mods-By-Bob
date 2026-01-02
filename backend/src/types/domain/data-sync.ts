/**
 * Data Source Strategy types (for flexible data ingestion)
 */

/**
 * External module data format (from university API)
 */
export interface ExternalModuleData {
  code: string;
  name: string;
  au: number;
  school: string;
  description?: string;
  prerequisites?: unknown;
  metadata?: unknown;
  examDate?: string;
  indexes: ExternalIndexData[];
}

/**
 * External index data format
 */
export interface ExternalIndexData {
  indexNumber: string;
  moduleCode: string;
  vacancy?: number;
  waitlist?: number;
  timeSlots: ExternalTimeSlotData[];
}

/**
 * External time slot data format
 */
export interface ExternalTimeSlotData {
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  weeks: number[];
}

/**
 * Data sync result
 */
export interface SyncResult {
  success: boolean;
  modulesAdded: number;
  modulesUpdated: number;
  modulesDeleted: number;
  errors: string[];
  timestamp: string;
}
