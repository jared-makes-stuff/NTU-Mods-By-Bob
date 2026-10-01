/**
 * Planner Controller
 * 
 * HTTP request handlers for timetable planner endpoints.
 * Handles:
 * - Timetable CRUD operations
 * - Module selection management
 * - Conflict detection
 * - Auto-generation of timetables
 * 
 * All endpoints require authentication
 */

import { Response } from 'express';
import { plannerService } from '../../business/services/planner.service';
import { PlannerGenerationConstraints } from '../../business/services/planner/generation';
import { asyncHandler } from '../middleware/error.middleware';
import { getQueryString } from '../utils/request';

/**
 * Planner Controller Class
 * Contains all HTTP handlers for planner endpoints
 */
export class PlannerController {
  /**
   * POST /api/timetables
   * Create a new timetable
   * 
   * Body:
   * - name: Timetable name
   * - semester: Semester number
   * - year: Academic year
   * - selections: Array of module selections
   */
  createTimetable = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;
    const { name, semester, year, selections } = req.body;

    const timetable = await plannerService.createTimetable(
      userId,
      name,
      semester,
      year,
      selections
    );

    res.status(201).json({ data: timetable });
  });

  /**
   * GET /api/timetables
   * Get all timetables for the authenticated user
   */
  getUserTimetables = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;

    const timetables = await plannerService.getUserTimetables(userId);

    res.status(200).json({ data: timetables });
  });

  /**
   * GET /api/timetables/:id
   * Get a specific timetable
   */
  getTimetableById = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;
    const timetableId = getQueryString(req.params.id);
    if (!timetableId) {
      res.status(400).json({ error: 'Timetable ID is required' });
      return;
    }

    const timetable = await plannerService.getTimetableById(timetableId, userId);

    res.status(200).json({ data: timetable });
  });

  /**
   * PUT /api/timetables/:id
   * Update timetable metadata
   * 
   * Body:
   * - name?: New name
   * - isShared?: Share status
   * - selections?: Updated selections
   */
  updateTimetable = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;
    const timetableId = getQueryString(req.params.id);
    if (!timetableId) {
      res.status(400).json({ error: 'Timetable ID is required' });
      return;
    }
    const { name, isShared, selections } = req.body;

    const timetable = await plannerService.updateTimetable(
      timetableId,
      userId,
      { name, isShared, selections }
    );

    res.status(200).json({ data: timetable });
  });

  /**
   * DELETE /api/timetables/:id
   * Delete a timetable
   */
  deleteTimetable = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;
    const timetableId = getQueryString(req.params.id);
    if (!timetableId) {
      res.status(400).json({ error: 'Timetable ID is required' });
      return;
    }

    await plannerService.deleteTimetable(timetableId, userId);

    res.status(200).json({
      data: {
        message: 'Timetable deleted successfully',
      },
    });
  });

  /**
   * POST /api/timetables/:id/modules
   * Add a module (index) to timetable
   * 
   * Body:
   * - indexId: Index ID to add
   * - moduleCode: Module code
   * - indexNumber: Index number
   */
  addModule = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;
    const timetableId = getQueryString(req.params.id);
    if (!timetableId) {
      res.status(400).json({ error: 'Timetable ID is required' });
      return;
    }
    const { moduleCode, indexNumber } = req.body;

    const timetable = await plannerService.addModuleToTimetable(
      timetableId,
      userId,
      { moduleCode, indexNumber }
    );

    res.status(200).json({ data: timetable });
  });

  /**
   * DELETE /api/timetables/:id/modules/:moduleCode
   * Remove a module from timetable
   */
  removeModule = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;
    const timetableId = getQueryString(req.params.id);
    const moduleCode = getQueryString(req.params.moduleCode);
    if (!timetableId || !moduleCode) {
      res.status(400).json({ error: 'Timetable ID and module code are required' });
      return;
    }

    const timetable = await plannerService.removeModuleFromTimetable(
      timetableId,
      userId,
      moduleCode
    );

    res.status(200).json({ data: timetable });
  });

  /**
   * GET /api/timetables/:id/conflicts
   * Detect scheduling conflicts in timetable
   */
  detectConflicts = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;
    const timetableId = getQueryString(req.params.id);
    if (!timetableId) {
      res.status(400).json({ error: 'Timetable ID is required' });
      return;
    }

    const conflicts = await plannerService.detectConflicts(timetableId, userId);

    res.status(200).json({ data: conflicts });
  });

  /**
   * POST /api/timetables/generate
   * Auto-generate optimal timetables based on constraints
   * 
   * Body:
   * - moduleCodes: Array of module codes
   * - preferredDays?: Array of preferred days
   * - avoidDays?: Array of days to avoid
   * - preferredTimeStart?: Earliest time
   * - preferredTimeEnd?: Latest time
   * - minimizeGaps?: Boolean
   * - preferCompactSchedule?: Boolean
   */
  generateTimetables = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;
    const constraints: PlannerGenerationConstraints = req.body;

    const timetables = await plannerService.generateTimetables(
      userId,
      constraints
    );

    res.status(201).json({ data: timetables });
  });

  /**
   * GET /api/plan
   * Get the user's course plan (modules and metadata)
   */
  getPlan = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;
    const plan = await plannerService.getPlan(userId);
    res.status(200).json({ data: plan });
  });

  /**
   * POST /api/plan
   * Save the user's course plan (full JSON replacement)
   */
  savePlan = asyncHandler(async (req, res: Response) => {
    const userId = req.userId!;
    const { modules, metadata } = req.body;

    const plan = await plannerService.savePlan(userId, {
      modules,
      metadata,
    });

    res.status(200).json({ data: plan });
  });
}

// Export singleton instance
export const plannerController = new PlannerController();
