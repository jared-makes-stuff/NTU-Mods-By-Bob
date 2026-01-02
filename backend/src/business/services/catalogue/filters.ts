import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { ModuleFilters } from './types';

function normalizeSemester(value?: string | number): string | undefined {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

function intersectCodes(current: string[] | undefined, next: string[]): string[] {
  if (!current) return next;
  const set = new Set(next);
  return current.filter((code) => set.has(code));
}

async function getCodesForDays(days: string[], semester?: string | number): Promise<string[]> {
  const normalizedDays = days.map((day) => day.toUpperCase());
  const semesterValue = normalizeSemester(semester);
  const semesterFilter = semesterValue ? Prisma.sql`AND semester = ${semesterValue}` : Prisma.sql``;

  const results = await prisma.$queryRaw<{ module_code: string }[]>`
    SELECT DISTINCT module_code
    FROM indexes
    WHERE 1=1 ${semesterFilter}
    GROUP BY module_code, index_number
    HAVING SUM(CASE WHEN day NOT IN (${Prisma.join(normalizedDays)}) THEN 1 ELSE 0 END) = 0
  `;

  return results.map((row) => row.module_code);
}

async function getCodesForLevel(level: string): Promise<string[]> {
  const levelDigit = level.trim().charAt(0);
  if (!levelDigit) return [];

  const pattern = `^[A-Za-z]+${levelDigit}`;
  const results = await prisma.$queryRaw<{ code: string }[]>`
    SELECT code
    FROM modules
    WHERE code ~ ${pattern}
  `;

  return results.map((row) => row.code);
}

export async function resolveModuleCodeFilter(filters: ModuleFilters): Promise<{
  codes?: string[];
  earlyReturn?: boolean;
}> {
  let codes: string[] | undefined;

  if (filters.days && filters.days.length > 0) {
    const dayCodes = await getCodesForDays(filters.days, filters.semester);
    if (dayCodes.length === 0) {
      return { earlyReturn: true, codes: [] };
    }
    codes = intersectCodes(codes, dayCodes);
  }

  if (filters.level) {
    const levelCodes = await getCodesForLevel(filters.level);
    if (levelCodes.length === 0) {
      return { earlyReturn: true, codes: [] };
    }
    codes = intersectCodes(codes, levelCodes);
  }

  return { codes };
}

export function buildModuleWhere(filters: ModuleFilters, codeFilter?: string[]): Prisma.ModuleWhereInput {
  const andFilters: Prisma.ModuleWhereInput[] = [];
  const semesterValue = normalizeSemester(filters.semester);

  if (filters.search) {
    const searchTerm = filters.search.trim();
    andFilters.push({
      OR: [
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (semesterValue) {
    andFilters.push({ semester: semesterValue });
  }

  if (filters.minAU !== undefined || filters.maxAU !== undefined) {
    const auFilter: Prisma.FloatFilter = {};
    if (filters.minAU !== undefined) {
      auFilter.gte = filters.minAU;
    }
    if (filters.maxAU !== undefined) {
      auFilter.lte = filters.maxAU;
    }
    andFilters.push({ au: auFilter });
  }

  if (filters.hasPrerequisite !== undefined) {
    andFilters.push({
      prerequisites: filters.hasPrerequisite
        ? { not: Prisma.DbNull }
        : { equals: Prisma.DbNull },
    });
  }

  if (filters.bde) {
    andFilters.push({ bde: true });
  }

  if (filters.ue) {
    andFilters.push({ unrestrictedElective: true });
  }

  if (filters.gradingType) {
    if (filters.gradingType === 'passFail') {
      andFilters.push({ gradeType: { contains: 'Pass', mode: 'insensitive' } });
    } else if (filters.gradingType === 'letter') {
      andFilters.push({
        OR: [
          { gradeType: null },
          { NOT: { gradeType: { contains: 'Pass', mode: 'insensitive' } } },
        ],
      });
    }
  }

  if (filters.school) {
    andFilters.push({ school: { equals: filters.school, mode: 'insensitive' } });
  }

  if (codeFilter && codeFilter.length > 0) {
    andFilters.push({ code: { in: codeFilter } });
  }

  return andFilters.length > 0 ? { AND: andFilters } : {};
}
