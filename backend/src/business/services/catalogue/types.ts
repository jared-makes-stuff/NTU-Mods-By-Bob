/**
 * Catalogue query and response types.
 */

/** Filter options for module searches. */
export interface ModuleFilters {
  search?: string;
  semester?: string | number;
  minAU?: number;
  maxAU?: number;
  hasPrerequisite?: boolean;
  level?: string;
  bde?: boolean;
  ue?: boolean;
  days?: string[];
  school?: string;
  gradingType?: 'letter' | 'passFail';
}

/** Pagination and sorting parameters. */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: 'code' | 'name' | 'au';
  sortOrder?: 'asc' | 'desc';
}

/** Standard paginated response wrapper. */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
