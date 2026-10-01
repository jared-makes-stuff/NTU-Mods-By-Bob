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

export interface RegisterResponse {
  email: string;
  verificationRequired: boolean;
  expiresAt: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface EmailVerificationResponse {
  email: string;
  expiresAt: string;
}

export interface EmailChangeRequest {
  newEmail: string;
  password: string;
}

export interface EmailChangeVerifyRequest {
  code: string;
}

export interface EmailChangeRevertRequest {
  token: string;
}

export interface EmailChangeRevertResponse {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  email: string;
  expiresAt: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface UserProfileSettings {
  themeColor?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  defaultSemester?: string;
  preferences?: {
    compactView?: boolean;
    show24HourTime?: boolean;
    showWeekends?: boolean;
  };
}

export interface UpdateProfileRequest {
  name?: string;
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
  avatarUrl?: string | null;
  passwordHash?: string | null;
  hasPassword?: boolean;
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
  classTypes?: string[];
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

// ============================================================================
// Planner Types
// ============================================================================

export interface PlannedModule {
  id: string;
  code: string;
  name: string;
  au: number;
  year: number;
  semester: 1 | 2 | 3 | 4;
  grade?: string | null;
  remarks?: string | null;
  prerequisites?: string | { text?: string } | Record<string, unknown> | null;
  isAvailable?: boolean;
  isCustom?: boolean;
  status?: 'PLANNED' | 'COMPLETED';
}
