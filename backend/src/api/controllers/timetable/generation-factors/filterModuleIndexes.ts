import { GenerationFilters, ModuleWithIndexes } from '../generation/types';
import { filterClassesByType } from './classTypeFilter';
import { passesVenuePreference } from './venueFilter';
import { passesDayTimeConstraints } from './dayTimeFilter';
import { passesDayOfWeekConstraints } from './dayOfWeekFilter';

/**
 * Filter module indexes based on user preferences.
 */
export function filterModuleIndexes(
  modules: ModuleWithIndexes[],
  filters: GenerationFilters
): ModuleWithIndexes[] {
  return modules
    .map(module => {
      const filteredIndexes = module.indexes.filter(index => {
        const classesToCheck = filterClassesByType(index, filters);

        if (classesToCheck.length === 0) {
          return false;
        }

        if (!passesVenuePreference(classesToCheck, filters)) {
          return false;
        }

        if (!passesDayTimeConstraints(classesToCheck, filters)) {
          return false;
        }

        if (!passesDayOfWeekConstraints(classesToCheck, filters)) {
          return false;
        }

        return true;
      });

      return { ...module, indexes: filteredIndexes };
    })
    .filter(module => module.indexes.length > 0);
}
