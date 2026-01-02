import { Request, Response } from 'express';
import { catalogueService } from '../../../../business/services/catalogue.service';
import { asyncHandler } from '../../../middleware/error.middleware';

export const getSchools = asyncHandler(async (_req: Request, res: Response) => {
  const schools = await catalogueService.getSchools();
  res.status(200).json({ data: schools });
});
