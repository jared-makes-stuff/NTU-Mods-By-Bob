import { GenerationFilters, IndexWithClasses, ClassItem } from '../generation/types';

/**
 * Check if a class type should be considered based on filters.
 */
export function shouldConsiderClassType(type: string, filters: GenerationFilters): boolean {
  const typeLower = type.toLowerCase();
  let result = true;

  if (typeLower.includes('tut')) result = filters.classesToConsider.tutorial;
  else if (typeLower.includes('lab')) result = filters.classesToConsider.lab;
  else if (typeLower.includes('sem')) result = filters.classesToConsider.seminar;
  else if (typeLower.includes('lec')) result = filters.classesToConsider.lecture;
  else if (typeLower.includes('prj')) result = filters.classesToConsider.project;
  else if (typeLower.includes('des')) result = filters.classesToConsider.design;

  return result;
}

/**
 * Filter index classes down to the types selected by the user.
 */
export function filterClassesByType(
  index: IndexWithClasses,
  filters: GenerationFilters
): ClassItem[] {
  return index.classes.filter(classItem => shouldConsiderClassType(classItem.type, filters));
}
