/**
 * Planner selection payloads.
 */

/** Custom event overrides used in planner selections. */
export type PlannerCustomEvent = {
  title?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  weeks?: string | number[];
};

/** Base selection payload stored on timetables. */
export type PlannerSelection = {
  moduleCode?: string;
  indexNumber?: string;
  color?: string;
  isCustomEvent?: boolean;
  customEvent?: PlannerCustomEvent;
  title?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  weeks?: string | number[];
};

/** Selection payload that requires a module code. */
export type PlannerModuleSelection = PlannerSelection & { moduleCode: string };
