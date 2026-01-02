/**
 * User-related types
 */

/**
 * User settings stored in JSONB field
 * Controls UI preferences and default behaviors
 */
export interface UserSettings {
  themeColor?: string;           // Hex color code, e.g., "#3b82f6"
  theme?: 'light' | 'dark' | 'system';
  language?: string;             // e.g., "en", "zh"
  defaultSemester?: string;      // e.g., "AY2024/25 Semester 1"
  preferences?: {
    compactView?: boolean;
    show24HourTime?: boolean;
    showWeekends?: boolean;
  };
}

/**
 * User privacy settings stored in JSONB field
 * Controls what is visible on public surfaces
 */
export interface UserPrivacy {
  profileVisibility: 'public' | 'private';
  showTimetable: boolean;
  showCoursePlan: boolean;
  showModules: boolean;
}

/**
 * User notification preferences
 */
export interface NotificationSettings {
  email: {
    timetableChanges: boolean;
    moduleUpdates: boolean;
  };
  push: {
    timetableChanges: boolean;
    moduleUpdates: boolean;
  };
}
