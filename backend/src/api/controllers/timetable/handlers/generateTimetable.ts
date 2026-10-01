import { Request, Response } from 'express';
import { GenerationFilters, ModuleForGeneration } from '../generation/types';
import { generateTimetableCombinations } from '../../../../business/services/timetable-generation/generation.service';
import { logger } from '../../../../config/logger';
import { AppError } from '../../../middleware/error.middleware';

interface GenerateTimetableRequest {
  modules: ModuleForGeneration[];
  filters: GenerationFilters;
  semester: string;
}

export const generateTimetable = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { modules, filters, semester } = req.body as GenerateTimetableRequest;
    const data = await generateTimetableCombinations({ modules, filters, semester });
    const elapsed = Date.now() - startTime;
    logger.info(`[TimetableController] Generated ${data.totalCombinations} combinations in ${elapsed}ms.`);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logger.error(`[TimetableController] Failed after ${elapsed}ms:`, error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        details: error.details,
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Failed to generate timetable combinations',
    });
  }
};



