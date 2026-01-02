/**
 * Catalogue Routes
 * 
 * Defines all routes for the module catalogue endpoints.
 * These routes are mounted at /api in the main router.
 */

import { Router } from 'express';
import { registerCatalogueModuleRoutes } from './catalogue/modules.routes';
import { registerCatalogueSearchRoutes } from './catalogue/search.routes';
import { registerCatalogueSemesterRoutes } from './catalogue/semesters.routes';
import { registerCatalogueStatsRoutes } from './catalogue/stats.routes';
import { registerCatalogueSchoolRoutes } from './catalogue/schools.routes';

const router = Router();

registerCatalogueStatsRoutes(router);
registerCatalogueSearchRoutes(router);
registerCatalogueModuleRoutes(router);
registerCatalogueSemesterRoutes(router);
registerCatalogueSchoolRoutes(router);

export default router;
