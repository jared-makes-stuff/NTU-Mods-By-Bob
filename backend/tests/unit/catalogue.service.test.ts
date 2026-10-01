/**
 * Catalogue Service Unit Tests
 * 
 * Tests for module catalogue operations:
 * - Searching modules
 * - Filtering by criteria
 * - Getting module details
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CatalogueService } from '../../src/business/services/catalogue.service';
import { prisma } from '../../src/config/database';

describe('CatalogueService', () => {
  let catalogueService: CatalogueService;

  beforeEach(() => {
    vi.clearAllMocks();
    catalogueService = new CatalogueService();
  });

  describe('searchModules', () => {
    it('should search modules by keyword with limit', async () => {
      const mockModules = [
        {
          code: 'CS1010',
          name: 'Programming Methodology',
          au: 4,
          school: 'SCSE',
          description: 'Introduction to programming',
        },
        {
          code: 'CS2040',
          name: 'Data Structures',
          au: 4,
          school: 'SCSE',
          description: 'Learn data structures',
        },
      ];

      vi.mocked(prisma.module.findMany).mockResolvedValue(mockModules as any);

      const result = await catalogueService.searchModules('programming', 10);

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('CS1010');
    });

    it('should use default limit when not specified', async () => {
      const mockModules = [
        {
          code: 'CS1010',
          name: 'Programming Methodology',
          au: 4,
          school: 'SCSE',
        },
      ];

      vi.mocked(prisma.module.findMany).mockResolvedValue(mockModules as any);

      const result = await catalogueService.searchModules('CS');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no modules match', async () => {
      vi.mocked(prisma.module.findMany).mockResolvedValue([]);

      const result = await catalogueService.searchModules('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('getModuleByCode', () => {
    it('should return module details by code', async () => {
      const moduleCode = 'CS1010';

      const mockModule = {
        code: 'CS1010',
        name: 'Programming Methodology',
        au: 4,
        school: 'SCSE',
        description: 'Introduction to programming',
        prerequisites: 'None',
        department: 'Computer Science',
        gradeType: 'LETTER GRADED',
        semester: '1;2',
      };

      vi.mocked(prisma.module.findFirst).mockResolvedValue(mockModule as any);

      const result = await catalogueService.getModuleByCode(moduleCode);

      expect(result.code).toBe('CS1010');
      expect(result.name).toBe('Programming Methodology');
      expect(prisma.module.findFirst).toHaveBeenCalled();
    });

    it('should throw error if module not found', async () => {
      const moduleCode = 'INVALID';

      vi.mocked(prisma.module.findFirst).mockResolvedValue(null);

      await expect(
        catalogueService.getModuleByCode(moduleCode)
      ).rejects.toThrow();
    });
  });

  describe('getModules', () => {
    it('should return paginated modules', async () => {
      const mockModules = [
        { code: 'CS1010', name: 'Programming Methodology', au: 4 },
        { code: 'CS2040', name: 'Data Structures', au: 4 },
      ];

      vi.mocked(prisma.module.findMany).mockResolvedValue(mockModules as any);
      vi.mocked(prisma.module.count).mockResolvedValue(100);

      const result = await catalogueService.getModules(
        { search: 'CS' },
        { page: 1, limit: 10 }
      );

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      vi.mocked(prisma.module.findMany).mockResolvedValue([]);
      vi.mocked(prisma.module.count).mockResolvedValue(0);

      const result = await catalogueService.getModules({}, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getAvailableSemesters', () => {
    it('should return list of available semesters', async () => {
      const currentYear = new Date().getFullYear();
      const mockSemesters = [
        { semester: `${currentYear}_2` },
        { semester: `${currentYear - 1}_1` },
        { semester: `${currentYear - 2}_1` },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(mockSemesters as any);

      const result = await catalogueService.getAvailableSemesters();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(expect.arrayContaining([`${currentYear}_2`, `${currentYear - 1}_1`]));
      expect(result).not.toContain(`${currentYear - 2}_1`);
    });
  });

  describe('checkPrerequisites', () => {
    it('should check module prerequisites', async () => {
      const mockModule = {
        code: 'CS2040',
        name: 'Data Structures',
        prerequisites: 'CS1010',
      };

      vi.mocked(prisma.module.findFirst).mockResolvedValue(mockModule as any);

      const result = await catalogueService.checkPrerequisites('CS2040');

      expect(result).toHaveProperty('hasPrerequisites');
      expect(result).toHaveProperty('prerequisites');
      expect(result.hasPrerequisites).toBe(true);
      expect(result.prerequisites).toBe('CS1010');
    });

    it('should handle modules with no prerequisites', async () => {
      const mockModule = {
        code: 'CS1010',
        name: 'Programming Methodology',
        prerequisites: null,
      };

      vi.mocked(prisma.module.findFirst).mockResolvedValue(mockModule as any);

      const result = await catalogueService.checkPrerequisites('CS1010');

      expect(result.prerequisites).toBeNull();
    });

    it('should throw error for non-existent module', async () => {
      vi.mocked(prisma.module.findFirst).mockResolvedValue(null);

      await expect(
        catalogueService.checkPrerequisites('INVALID')
      ).rejects.toThrow();
    });
  });

  describe('getModuleStats', () => {
    it('should return statistics about modules', async () => {
      // Mock module.count for totalModules (called first)
      vi.mocked(prisma.module.count).mockResolvedValueOnce(500);
      // Mock index.count for totalIndexes
      vi.mocked(prisma.index.count).mockResolvedValue(1500);
      // Mock module.findMany for modulesData (au calculation)
      vi.mocked(prisma.module.findMany).mockResolvedValue([
        { au: 4 } as any,
        { au: 5 } as any,
      ]);
      // Mock module.count for modulesWithPrerequisites (called second)
      vi.mocked(prisma.module.count).mockResolvedValueOnce(100);

      const result = await catalogueService.getModuleStats();

      expect(result).toHaveProperty('totalModules');
      expect(result).toHaveProperty('totalIndexes');
      expect(result).toHaveProperty('avgAcademicUnits');
      expect(result).toHaveProperty('modulesWithPrerequisites');
      expect(result.totalModules).toBe(500);
      expect(result.totalIndexes).toBe(1500);
      expect(result.avgAcademicUnits).toBe(4.5);
      expect(result.modulesWithPrerequisites).toBe(100);
    });
  });

  describe('getModuleIndexes', () => {
    it('should return module indexes/classes', async () => {
      const moduleCode = 'CS1010';
      const mockIndexes = [
        {
          code: 'CS1010',
          index: '10001',
          classType: 'LEC',
          day: 'MON',
          startTime: '0830',
          endTime: '0930',
        },
      ];

      vi.mocked(prisma.index.findMany).mockResolvedValue([
        {
          id: 'index-1',
          indexNumber: '10001',
          moduleCode: 'CS1010',
          vacancy: 50,
          waitlist: 0,
          timeSlots: [
            {
              id: 'ts-1',
              indexId: 'index-1',
              classType: 'LEC',
              day: 'MON',
              startTime: '0830',
              endTime: '0930',
            },
          ],
        },
      ] as any);

      const result = await catalogueService.getModuleIndexes(moduleCode);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].indexNumber).toBe('10001');
    });
  });
});
