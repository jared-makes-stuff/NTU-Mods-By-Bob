import { join } from 'path';
import { writeValidationLog } from './loggers';
import { GenerationFilters, ModuleForGeneration, RequestValidationResult } from './types';
import { validateFilters, validateModule } from './requestRules';

const validationLogPath = join(__dirname, '../../../../logs/timetable-validation-errors.log');

interface ValidationRequest {
  modules: ModuleForGeneration[];
  filters: GenerationFilters;
  semester: string;
}

export function validateGenerationRequest(request: ValidationRequest): RequestValidationResult {
  const errors: string[] = [];

  if (!request.modules || !Array.isArray(request.modules)) {
    errors.push('Modules must be a non-empty array');
  } else if (request.modules.length === 0) {
    errors.push('At least one module must be provided');
  } else {
    request.modules.forEach((module, index) => {
      const moduleErrors = validateModule(module, index);
      errors.push(...moduleErrors);
    });
  }

  if (!request.semester || typeof request.semester !== 'string') {
    errors.push('Semester must be a non-empty string');
  } else if (!request.semester.trim()) {
    errors.push('Semester cannot be empty or whitespace');
  }

  if (!request.filters) {
    errors.push('Filters object is required');
  } else {
    const filterErrors = validateFilters(request.filters);
    errors.push(...filterErrors);
  }

  if (errors.length > 0) {
    writeValidationLog(validationLogPath, 'VALIDATION ERROR', errors.join('; '), request);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function quickValidate(condition: boolean, errorMessage: string): void {
  if (!condition) {
    throw new Error(`Validation failed: ${errorMessage}`);
  }
}
