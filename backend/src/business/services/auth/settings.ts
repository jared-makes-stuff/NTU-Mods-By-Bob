import { z } from 'zod';

/** Only supported UI preferences may enter or leave the profile settings field. */
const preferencesSchema = z.object({
  compactView: z.boolean().optional(),
  show24HourTime: z.boolean().optional(),
  showWeekends: z.boolean().optional(),
});

export const profileSettingsSchema = z.object({
  themeColor: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  defaultSemester: z.string().optional(),
  preferences: preferencesSchema.optional(),
});

export function sanitizeProfileSettings(value: unknown): z.infer<typeof profileSettingsSchema> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(profileSettingsSchema.shape)) {
    const parsed = profileSettingsSchema.shape[key as keyof typeof profileSettingsSchema.shape]
      .safeParse((value as Record<string, unknown>)[key]);
    if (parsed.success && parsed.data !== undefined) result[key] = parsed.data;
  }
  const storedPreferences = (value as Record<string, unknown>).preferences;
  if (storedPreferences && typeof storedPreferences === 'object' && !Array.isArray(storedPreferences)) {
    const preferences: Record<string, boolean> = {};
    for (const [key, schema] of Object.entries(preferencesSchema.shape)) {
      const parsed = schema.safeParse((storedPreferences as Record<string, unknown>)[key]);
      if (parsed.success && parsed.data !== undefined) preferences[key] = parsed.data;
    }
    result.preferences = preferences;
  }
  return profileSettingsSchema.parse(result);
}
