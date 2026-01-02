/**
 * API Type Definitions
 * 
 * Type-safe interfaces matching backend API responses
 */

// ============================================================================
// Auth Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export type UserProfileSettings = Record<string, unknown>;

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatarUrl?: string;
  settings?: UserProfileSettings;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  passwordHash?: string | null;
  oauthAccounts?: Array<{ provider: string; id: string; email?: string }>;
  settings?: UserProfileSettings;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// Module/Catalogue Types
// ============================================================================

export interface Module {
  code: string;
  name: string;
  au: number;
  school: string;
  description?: string | null;
  prerequisites?: string | { text?: string } | Record<string, unknown> | null;
  department?: string | null;
  gradeType?: string | null;
  type?: string | null;
  mutualExclusions?: string | null;
  notAvailableTo?: string | null;
  notAvailableToAllWith?: string | null;
  notAvailableAsBdeUeTo?: string | null;
  bde: boolean;
  unrestrictedElective?: boolean;
  semester?: string;
  examDateTime?: string | null;
  examDuration?: number | null; // Duration in minutes
  createdAt: string;
  updatedAt: string;
}

export type ModuleIndexRecord = {
  indexNumber: string;
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  venue?: string | null;
  group?: string | null;
  weeks?: number[] | null;
  vacancy?: number | null;
  waitlist?: number | null;
  semester?: string; // Added to match backend Index model
  moduleCode?: string; // Added to match backend Index model
} & Record<string, unknown>;

export interface ModuleFilters {
  search?: string;
  school?: string;
  minAU?: number;
  maxAU?: number;
  semester?: number | string;
  level?: string;
  bde?: boolean;
  ue?: boolean;
  gradingType?: 'letter' | 'passFail';
  days?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'code' | 'name' | 'au';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Course Plan Types
// ============================================================================

export interface CoursePlan {
  id: string;
  userId: string;
  program?: string | null;
  expectedGradTerm?: string | null;
  plannedModules: BackendPlannedModule[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendPlannedModule {
  id: string;
  planId: string;
  moduleCode: string;
  year: number;
  semester: string;
  status: string;
  grade?: string | null;
  remarks?: string | null;
  customTitle?: string | null;
  au?: number | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCoursePlanRequest {
  program: string;
  expectedGradTerm?: string;
}

export interface UpdateCoursePlanRequest {
  program?: string;
  expectedGradTerm?: string;
}

export interface AddModuleRequest {
  moduleCode: string;
  semester: string;
}

export interface MoveModuleRequest {
  moduleCode: string;
  semester: string;
}

export interface CoursePlanStats {
  totalAU: number;
  moduleCount: number;
  semesters: Record<string, { modules: number; au: number }>;
}

// ============================================================================
// Timetable Types
// ============================================================================

export interface Timetable {
  id: string;
  name: string;
  userId: string;
  semester: string;
  year: number;
  selections: TimetableSelection[]; // JSONB field in database
  slots?: TimetableSlot[];
  isShared?: boolean;
  shareLinkId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomEvent {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
  weeks: string;
  color?: string;
}

export interface TimetableSelection {
  moduleCode: string;
  indexNumber?: string;
  color?: string;
  isCustomEvent?: boolean;
  customEvent?: CustomEvent;
}

export interface TimetableSlot {
  id: string;
  moduleCode: string;
  module: Module;
  type: 'LEC' | 'TUT' | 'LAB' | 'SEM';
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  venue?: string;
  remarks?: string;
}

export interface CreateTimetableRequest {
  name: string;
  semester: string;
  year: number;
  selections: TimetableSelection[]; // JSONB field
}

export interface UpdateTimetableRequest {
  name?: string;
}

export interface AddTimetableSlotRequest {
  moduleCode: string;
  type: 'LEC' | 'TUT' | 'LAB' | 'SEM';
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  startTime: string;
  endTime: string;
  venue?: string;
  remarks?: string;
}

export interface TimetableConflictSlot {
  moduleCode?: string;
  indexNumber?: string;
  type?: string;
  title?: string;
  day: string;
  startTime: string;
  endTime: string;
  weeks?: number[];
  source: 'module' | 'custom';
}

export interface TimetableConflict {
  slot1: TimetableConflictSlot;
  slot2: TimetableConflictSlot;
  reason: string;
}

// ============================================================================
// User Settings Types
// ============================================================================

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    timetableReminders: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    timetableVisibility: 'public' | 'private';
  };
  preferences: {
    defaultView: 'calendar' | 'list';
    startOfWeek: 'MON' | 'SUN';
    timeFormat: '12h' | '24h';
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserSettingsRequest {
  theme?: 'light' | 'dark' | 'system';
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
  preferences?: Partial<UserSettings['preferences']>;
}
