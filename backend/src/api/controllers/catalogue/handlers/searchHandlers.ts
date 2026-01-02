import { Request, Response } from 'express';
import { catalogueService } from '../../../../business/services/catalogue.service';
import { asyncHandler } from '../../../middleware/error.middleware';

export const searchModules = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
  const semester = req.query.semester as string | undefined;

  if (!query || query.trim().length === 0) {
    res.status(400).json({
      error: {
        code: 'MISSING_QUERY',
        message: 'Search query is required',
      },
    });
    return;
  }

  const modules = await catalogueService.searchModules(query, limit, semester);

  res.status(200).json({ data: modules });
});

export const searchModulesAll = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

  if (!query || query.trim().length === 0) {
    res.status(400).json({
      error: {
        code: 'MISSING_QUERY',
        message: 'Search query is required',
      },
    });
    return;
  }

  const modules = await catalogueService.searchModulesAll(query, limit);

  res.status(200).json({ data: modules });
});
