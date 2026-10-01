import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import { ModuleFilters } from './types';

function normalizeSemester(value?: string | number): string | undefined {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeList(values?: string[]): string[] {
  if (!values) return [];
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function normalizeDays(days?: string[]): string[] {
  const validDays = new Set(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
  return normalizeList(days)
    .map((day) => day.slice(0, 3).toUpperCase())
    .filter((day) => validDays.has(day));
}

function normalizeClassTypes(types?: string[]): string[] {
  const normalized = normalizeList(types).map((type) => {
    const upper = type.toUpperCase();
    if (upper.includes('TUT')) return 'TUT';
    if (upper.includes('LAB')) return 'LAB';
    if (upper.includes('SEM')) return 'SEM';
    if (upper.includes('LEC')) return 'LEC';
    if (upper.includes('PRJ') || upper.includes('PROJ')) return 'PRJ';
    if (upper.includes('DES')) return 'DES';
    if (upper.includes('WRK') || upper.includes('WORK')) return 'WRK';
    return upper;
  });

  return Array.from(new Set(normalized));
}

function intersectCodes(current: string[] | undefined, next: string[]): string[] {
  if (!current) return next;
  const set = new Set(next);
  return current.filter((code) => set.has(code));
}

async function getCodesForScheduleFilters(
  days: string[] | undefined,
  classTypes: string[] | undefined,
  semester?: string | number
): Promise<string[] | null> {
  const normalizedDays = normalizeDays(days);
  const normalizedTypes = normalizeClassTypes(classTypes);

  if (normalizedDays.length === 0 && normalizedTypes.length === 0) {
    return null;
  }

  const semesterValue = normalizeSemester(semester);
  const semesterFilter = semesterValue ? Prisma.sql`AND semester = ${semesterValue}` : Prisma.sql``;
  const havingClauses: Prisma.Sql[] = [];

  if (normalizedTypes.length > 0) {
    normalizedTypes.forEach((type) => {
      const pattern = `%${type}%`;
      havingClauses.push(
        Prisma.sql`SUM(CASE WHEN type ILIKE ${pattern} THEN 1 ELSE 0 END) > 0`
      );

      if (normalizedDays.length > 0) {
        havingClauses.push(
          Prisma.sql`SUM(CASE WHEN type ILIKE ${pattern} AND day NOT IN (${Prisma.join(normalizedDays)}) THEN 1 ELSE 0 END) = 0`
        );
      }
    });
  } else if (normalizedDays.length > 0) {
    havingClauses.push(
      Prisma.sql`SUM(CASE WHEN day NOT IN (${Prisma.join(normalizedDays)}) THEN 1 ELSE 0 END) = 0`
    );
  }

  if (havingClauses.length === 0) {
    return null;
  }

  const results = await prisma.$queryRaw<{ module_code: string }[]>`
    SELECT DISTINCT module_code
    FROM indexes
    WHERE 1=1 ${semesterFilter}
    GROUP BY module_code, index_number
    HAVING ${Prisma.join(havingClauses, ' AND ')}
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

  const scheduleCodes = await getCodesForScheduleFilters(filters.days, filters.classTypes, filters.semester);
  if (scheduleCodes) {
    if (scheduleCodes.length === 0) {
      return { earlyReturn: true, codes: [] };
    }
    codes = intersectCodes(codes, scheduleCodes);
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
