import type { BackendPlannedModule, Module } from '@/shared/api/types';
import type { PlannedModule } from './utils';

const PLACEHOLDER_CODES = new Set(['MPE', 'BDE', 'UE']);
const CUSTOM_PREFIXES = ['MOOC'];
const DEFAULT_SEMESTER = 1;

type ParsedPlanRemarks = {
  customTitle: string | null;
  customAu: number | null;
  cleanRemarks: string | null;
};

export const isPlaceholderModuleCode = (code?: string | null): boolean => {
  if (!code) return false;
  return PLACEHOLDER_CODES.has(code.toUpperCase());
};

export const isCustomModuleCode = (code?: string | null): boolean => {
  if (!code) return false;
  const normalized = code.trim().toUpperCase();
  return CUSTOM_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

export const shouldSkipCatalogueLookup = (code?: string | null): boolean => {
  return isPlaceholderModuleCode(code) || isCustomModuleCode(code);
};

export const parsePlanRemarks = (remarks?: string | null): ParsedPlanRemarks => {
  if (!remarks) {
    return { customTitle: null, customAu: null, cleanRemarks: null };
  }

  const parts = remarks.split('|');
  let customTitle: string | null = null;
  let customAu: number | null = null;
  const remainder: string[] = [];

  for (const part of parts) {
    if (part.startsWith('TITLE:')) {
      customTitle = part.substring(6);
      continue;
    }

    if (part.startsWith('AU:')) {
      const parsedAu = Number.parseFloat(part.substring(3));
      customAu = Number.isFinite(parsedAu) ? parsedAu : customAu;
      continue;
    }

    if (part) {
      remainder.push(part);
    }
  }

  const cleanRemarks = remainder.length > 0 ? remainder.join('|') : null;
  return { customTitle, customAu, cleanRemarks };
};

export const resolvePlanMetadata = (module: BackendPlannedModule): ParsedPlanRemarks => {
  const parsed = parsePlanRemarks(module.remarks || null);
  const customTitle = module.customTitle ?? parsed.customTitle;
  const customAu =
    module.au !== undefined && module.au !== null
      ? Number.parseFloat(String(module.au))
      : parsed.customAu;

  return {
    customTitle,
    customAu: Number.isFinite(customAu ?? NaN) ? customAu : parsed.customAu,
    cleanRemarks: parsed.cleanRemarks,
  };
};

const parseSemesterValue = (value?: string | number | null): 1 | 2 | 3 | 4 => {
  if (value === null || value === undefined) return DEFAULT_SEMESTER;

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return DEFAULT_SEMESTER;

  const digitMatch = normalized.match(/\d/);
  if (digitMatch) {
    const parsed = Number.parseInt(digitMatch[0], 10);
    if (parsed >= 1 && parsed <= 4) return parsed as 1 | 2 | 3 | 4;
  }

  if (normalized.includes('winter')) return 3;
  if (normalized.includes('summer')) return 4;
  if (normalized.includes('special')) return 3;

  return DEFAULT_SEMESTER;
};

export const buildPlannedModuleFromBackend = (
  module: BackendPlannedModule,
  moduleData: Partial<Module>,
  idFallback: string
): PlannedModule => {
  const metadata = resolvePlanMetadata(module);

  return {
    id: module.id || idFallback,
    code: module.moduleCode,
    name: metadata.customTitle || moduleData.name || module.moduleCode,
    au: metadata.customAu ?? moduleData.au ?? 0,
    year: module.year,
    semester: parseSemesterValue(module.semester),
    grade: module.grade,
    remarks: metadata.cleanRemarks || undefined,
    prerequisites: moduleData.prerequisites,
    isAvailable: true,
  };
};

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
});

export const buildCustomModule = (code: string, title: string, au: number, id: string): PlannedModule => ({
  id,
  code: code.toUpperCase(),
  name: title,
  au,
  year: 1,
  semester: 1,
  isAvailable: true,
});
