/**
 * Main API Router
 */

import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { healthRoutes } from './health.routes';
import catalogueRoutes from './catalogue.routes';
import plannerRoutes from './planner.routes';
import userRoutes from './user.routes';
import timetableRoutes from './timetable.routes';
import moduleReviewsRoutes from './module-reviews.routes';
import moduleTopicsRoutes from './module-topics.routes';
import { apiIndexResponse } from '../../docs/apiIndex';

const router = Router();

router.get('/', (_req, res) => {
  res.json(apiIndexResponse);
});

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/', moduleReviewsRoutes);
router.use('/', moduleTopicsRoutes);
router.use('/', catalogueRoutes);
router.use('/', plannerRoutes);
router.use('/user', userRoutes);
router.use('/timetable', timetableRoutes);

export { router };
