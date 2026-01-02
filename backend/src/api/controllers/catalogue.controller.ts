import {
  checkPrerequisites,
  getModuleByCode,
  getModuleDependencies,
  getModuleIndexes,
  getModuleStats,
  getModules,
} from './catalogue/handlers/modulesHandlers';
import { searchModules, searchModulesAll } from './catalogue/handlers/searchHandlers';
import { getAvailableSemesters, getCurrentSemester } from './catalogue/handlers/semesterHandlers';
import { getSchools } from './catalogue/handlers/schoolHandlers';

export class CatalogueController {
  getModules = getModules;
  getModuleByCode = getModuleByCode;
  searchModules = searchModules;
  searchModulesAll = searchModulesAll;
  getAvailableSemesters = getAvailableSemesters;
  getCurrentSemester = getCurrentSemester;
  getSchools = getSchools;
  getModuleIndexes = getModuleIndexes;
  checkPrerequisites = checkPrerequisites;
  getModuleStats = getModuleStats;
  getModuleDependencies = getModuleDependencies;
}

export const catalogueController = new CatalogueController();
