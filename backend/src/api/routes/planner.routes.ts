/**
 * Planner Routes
 * 
 * Defines all routes for timetable planner endpoints.
 * All routes require authentication.
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { registerPlannerConflictRoutes } from './planner/conflicts.routes';
import { registerPlannerGenerationRoutes } from './planner/generation.routes';
import { registerPlannerSelectionRoutes } from './planner/selections.routes';
import { registerPlannerTimetableRoutes } from './planner/timetables.routes';

const router = Router();

// All planner routes require authentication
router.use(authMiddleware);

registerPlannerTimetableRoutes(router);
registerPlannerSelectionRoutes(router);
registerPlannerConflictRoutes(router);
registerPlannerGenerationRoutes(router);

// Course Plan Routes
import { plannerController } from '../controllers/planner.controller';
router.get('/plan', plannerController.getPlan);
router.post('/plan', plannerController.savePlan);

export default router;
