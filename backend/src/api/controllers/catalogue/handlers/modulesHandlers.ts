import { Request, Response } from 'express';
import { catalogueService } from '../../../../business/services/catalogue.service';
import { ModuleFilters, PaginationParams } from '../../../../business/services/catalogue/types';
import { asyncHandler } from '../../../middleware/error.middleware';
import { getQueryBoolean, getQueryInt, getQueryNumber, getQueryString, getQueryStringArray } from '../../../utils/request';

export const getModules = asyncHandler(async (req: Request, res: Response) => {
  const filters: ModuleFilters = {
    search: getQueryString(req.query.search),
    semester: getQueryString(req.query.semester),
    minAU: getQueryNumber(req.query.minAU),
    maxAU: getQueryNumber(req.query.maxAU),
    hasPrerequisite: getQueryBoolean(req.query.hasPrerequisite),
    level: getQueryString(req.query.level),
    bde: getQueryBoolean(req.query.bde),
    ue: getQueryBoolean(req.query.ue),
    gradingType: getQueryString(req.query.gradingType) as 'letter' | 'passFail' | undefined,
    school: getQueryString(req.query.school),
    days: getQueryStringArray(req.query.days),
    classTypes: getQueryStringArray(req.query.classTypes),
  };

  const sortByParam = getQueryString(req.query.sortBy);
  const normalizedSortBy = sortByParam === 'academicUnits' ? 'au' : sortByParam;
  const pagination: PaginationParams = {
    page: Math.max(1, getQueryInt(req.query.page) || 1),
    limit: Math.min(100, getQueryInt(req.query.limit) || 20),
    sortBy: (normalizedSortBy as PaginationParams['sortBy']) || 'code',
    sortOrder: (getQueryString(req.query.sortOrder) as 'asc' | 'desc') || 'asc',
  };

  const result = await catalogueService.getModules(filters, pagination);

  res.status(200).json(result);
});

export const getModuleByCode = asyncHandler(async (req: Request, res: Response) => {
  const code = getQueryString(req.params.code);
  if (!code) {
    res.status(400).json({ error: 'Module code is required' });
    return;
  }
  const module = await catalogueService.getModuleByCode(code);
  res.status(200).json({ data: module });
});

export const getModuleIndexes = asyncHandler(async (req: Request, res: Response) => {
  const code = getQueryString(req.params.code);
  if (!code) {
    res.status(400).json({ error: 'Module code is required' });
    return;
  }
  const semester = getQueryString(req.query.semester);

  const indexes = await catalogueService.getModuleIndexes(code, semester);

  res.status(200).json({ data: indexes });
});

export const checkPrerequisites = asyncHandler(async (req: Request, res: Response) => {
  const code = getQueryString(req.params.code);
  if (!code) {
    res.status(400).json({ error: 'Module code is required' });
    return;
  }

  const prerequisites = await catalogueService.checkPrerequisites(code);

  res.status(200).json({ data: prerequisites });
});

export const getModuleStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await catalogueService.getModuleStats();

  res.status(200).json({ data: stats });
});

export const getModuleDependencies = asyncHandler(async (req: Request, res: Response) => {
  const code = getQueryString(req.params.code);
  if (!code) {
    res.status(400).json({ error: 'Module code is required' });
    return;
  }

  const dependencies = await catalogueService.getModuleDependencies(code);

  res.status(200).json({ data: dependencies });
});
