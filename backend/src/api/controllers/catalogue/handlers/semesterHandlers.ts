import { Request, Response } from 'express';
import { catalogueService } from '../../../../business/services/catalogue.service';
import { asyncHandler } from '../../../middleware/error.middleware';

export const getAvailableSemesters = asyncHandler(async (_req: Request, res: Response) => {
  const semesters = await catalogueService.getAvailableSemesters();

  res.status(200).json({ data: semesters });
});

export const getCurrentSemester = asyncHandler(async (_req: Request, res: Response) => {
  const semester = await catalogueService.getCurrentSemester();

  res.status(200).json({ data: semester });
});
