import type { BackendPlannedModule, Module } from '@/shared/api/types';
import type { PlannedModule } from './utils';

const PLACEHOLDER_CODES = new Set(['MPE', 'BDE', 'UE']);
const CUSTOM_PREFIXES = ['MOOC'];
const DEFAULT_SEMESTER = 1;

export const isPlaceholderModuleCode = (code?: string | null): boolean => {
  if (!code) return false;
  return PLACEHOLDER_CODES.has(code.toUpperCase());
};

export const isCustomModuleCode = (code?: string | null): boolean => {
  if (!code) return false;
  const normalized = code.trim().toUpperCase();
  return CUSTOM_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

// Removed unused legacy transforms


export const buildPlannedModuleFromModule = (module: Module, id: string): PlannedModule => ({
  id,
  code: module.code,
  name: module.name,
  au: module.au,
  year: 1,
  semester: 1,
  prerequisites: module.prerequisites,
  isAvailable: true,
});

export const buildPlaceholderModule = (code: 'MPE' | 'BDE' | 'UE', id: string): PlannedModule => ({
  id,
  code,
  name: '',
  au: 0,
  year: 1,
  semester: 1,
  isAvailable: true,
  isCustom: true,
});

export const buildCustomModule = (code: string, title: string, au: number, id: string): PlannedModule => ({
  id,
  code: code.toUpperCase(),
  name: title,
  au,
  year: 1,
  semester: 1,
  isAvailable: true,
  isCustom: true,
});
