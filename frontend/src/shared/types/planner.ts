import type { Module } from "@/shared/api/types";

/**
 * Index information used across planner modules.
 */
export interface ModuleIndex {
  indexNumber: string;
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  venue?: string | null;
  group?: string | null;
  weeks?: number[] | null;
}

/**
 * Module shape augmented with planner-specific fields.
 */
export interface PlannerModule extends Module {
  selectedIndex?: string;
  indexes?: ModuleIndex[];
}
