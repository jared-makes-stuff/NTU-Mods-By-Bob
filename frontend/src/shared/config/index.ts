/**
 * Application Configuration
 * 
 * Centralizes environment variables and app-wide settings.
 * 
 * Purpose: Unified academic planning for NTU students
 * - Course planning across degree
 * - Timetable generation and optimization
 * - Module search and exploration
 * 
 * @example
 * import { config } from '@/shared/config';
 * 
 * // API calls
 * fetch(`${config.apiUrl}/modules`);
 * 
 * // Branding
 * <h1>{config.appName}</h1>
 */

export const config = {
  /** Base URL for backend API */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  
  /** Primary application name */
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'NTU Mods',
  
  /** Full application title */
  appTitle: 'Academic Planner',
  
  /** Application tagline */
  appTagline: 'Complete Academic Planning for NTU Students',
  
  /** Application description for SEO/meta tags */
  appDescription: process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    'Plan your courses, generate optimal timetables, and explore modules - all in one unified platform for NTU students.',

  /** Public donation link */
  donationUrl: process.env.NEXT_PUBLIC_DONATION_URL || 'https://ko-fi.com/',
  
  /** Feature flags */
  features: {
    /** Enable guest mode with localStorage */
    enableGuestMode: true,
    
    /** Enable CSV import/export */
    enableCsvFeatures: true,
    
    /** Enable timetable auto-generation */
    enableAutoGeneration: true,
  },
  
  /** Planning limits */
  limits: {
    /** Maximum years for course planning */
    maxPlanningYears: 6,
    
    /** Maximum modules per semester */
    maxModulesPerSemester: 10,
    
    /** Maximum saved timetables */
    maxSavedTimetables: 10,
  },
} as const;

/** Type-safe config access */
export type Config = typeof config;
