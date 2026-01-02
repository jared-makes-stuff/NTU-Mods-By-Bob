import { Request, Response } from 'express';
import { catalogueService } from '../../../../business/services/catalogue.service';
import { ModuleFilters, PaginationParams } from '../../../../business/services/catalogue/types';
import { asyncHandler } from '../../../middleware/error.middleware';

export const getModules = asyncHandler(async (req: Request, res: Response) => {
  const filters: ModuleFilters = {
    search: req.query.search as string,
    semester: req.query.semester ? String(req.query.semester) : undefined,
    minAU: req.query.minAU ? parseInt(req.query.minAU as string) : undefined,
    maxAU: req.query.maxAU ? parseInt(req.query.maxAU as string) : undefined,
    hasPrerequisite: req.query.hasPrerequisite === 'true' ? true : req.query.hasPrerequisite === 'false' ? false : undefined,
    level: req.query.level as string,
    bde: req.query.bde === 'true' ? true : undefined,
    ue: req.query.ue === 'true' ? true : undefined,
    gradingType: req.query.gradingType as 'letter' | 'passFail' | undefined,
    school: req.query.school as string,
    days: Array.isArray(req.query.days)
      ? (req.query.days as string[])
      : typeof req.query.days === 'string'
        ? (req.query.days as string).split(',')
        : undefined,
  };

  const sortByParam = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
  const normalizedSortBy = sortByParam === 'academicUnits' ? 'au' : sortByParam;
  const pagination: PaginationParams = {
    page: Math.max(1, parseInt(req.query.page as string) || 1),
    limit: Math.min(100, parseInt(req.query.limit as string) || 20),
    sortBy: (normalizedSortBy as PaginationParams['sortBy']) || 'code',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
  };

  const result = await catalogueService.getModules(filters, pagination);

  res.status(200).json(result);
});

export const getModuleByCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const module = await catalogueService.getModuleByCode(code!);
  res.status(200).json({ data: module });
});

export const getModuleIndexes = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const { semester } = req.query;

  const indexes = await catalogueService.getModuleIndexes(code!, semester as string | undefined);

  res.status(200).json({ data: indexes });
});

export const checkPrerequisites = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;

  const prerequisites = await catalogueService.checkPrerequisites(code!);

  res.status(200).json({ data: prerequisites });
});

export const getModuleStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await catalogueService.getModuleStats();

  res.status(200).json({ data: stats });
});

export const getModuleDependencies = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;

  if (!code) {
    res.status(400).json({ error: 'Module code is required' });
    return;
  }

  const dependencies = await catalogueService.getModuleDependencies(code);

  res.status(200).json({ data: dependencies });
});
