import { z } from 'zod';

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      success: z.boolean(),
      data: dataSchema.optional(),
      error: z.string().optional(),
      message: z.string().optional(),
    })
    .passthrough();

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

export const userSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string().default("user"),
    avatarUrl: z.string().nullable().optional(),
    hasPassword: z.boolean().optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export const authResponseSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: userSchema,
  })
  .passthrough();

export const registerResponseSchema = z
  .object({
    email: z.string(),
    verificationRequired: z.boolean(),
    expiresAt: z.string(),
  })
  .passthrough();

export const emailVerificationStatusSchema = z
  .object({
    email: z.string(),
    expiresAt: z.string(),
  })
  .passthrough();

export const emailChangeRevertSchema = z
  .object({
    email: z.string(),
  })
  .passthrough();

export const moduleSchema = z
  .object({
    code: z.string(),
    name: z.string(),
    au: z.number(),
    school: z.string(),
    description: z.string().nullable().optional(),
    prerequisites: z
      .union([
        z.string(),
        z.object({ text: z.string().optional() }).passthrough(),
        z.record(z.string(), z.unknown()),
      ])
      .nullable()
      .optional(),
    department: z.string().nullable().optional(),
    gradeType: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
    mutualExclusions: z.string().nullable().optional(),
    notAvailableTo: z.string().nullable().optional(),
    notAvailableToAllWith: z.string().nullable().optional(),
    notAvailableAsBdeUeTo: z.string().nullable().optional(),
    bde: z.boolean().default(false),
    unrestrictedElective: z.boolean().optional(),
    semester: z.string().optional(),
    examDateTime: z.string().nullable().optional(),
    examDuration: z.number().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();


export const moduleIndexRecordSchema = z
  .object({
    indexNumber: z.string(),
    type: z.string(),
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    venue: z.string().nullable().optional(),
    group: z.string().nullable().optional(),
    weeks: z.array(z.number()).nullable().optional(),
    semester: z.string().optional(), // Added to match backend Index model
    moduleCode: z.string().optional(), // Added to match backend Index model
  })
  .passthrough();


export const customEventSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    weeks: z.string(),
    color: z.string().optional(),
  })
  .passthrough();

export const timetableSelectionSchema = z
  .object({
    moduleCode: z.string(),
    indexNumber: z.string().optional(),
    color: z.string().optional(),
    isCustomEvent: z.boolean().optional(),
    customEvent: customEventSchema.optional(),
  })
  .passthrough();

export const timetableSlotSchema = z
  .object({
    id: z.string(),
    moduleCode: z.string(),
    module: moduleSchema,
    type: z.enum(['LEC', 'TUT', 'LAB', 'SEM']),
    day: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
    startTime: z.string(),
    endTime: z.string(),
    venue: z.string().optional(),
    remarks: z.string().optional(),
  })
  .passthrough();

export const timetableSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    userId: z.string(),
    semester: z.string(),
    year: z.number(),
    selections: z.array(timetableSelectionSchema),
    slots: z.array(timetableSlotSchema).optional(),
    isShared: z.boolean().optional(),
    shareLinkId: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const timetableCombinationSchema = z
  .object({
    id: z.string(),
    score: z.number(),
    modules: z.array(
      z.object({
        code: z.string(),
        indexNumber: z.string(),
      })
    ),
    classes: z.array(
      z.object({
        moduleCode: z.string(),
        indexNumber: z.string(),
        type: z.string(),
        day: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        venue: z.string(),
        weeks: z.string(),
      })
    ),
    stats: z.object({
      totalDays: z.number(),
      totalHours: z.number(),
      averageGapDuration: z.number(),
      earliestStart: z.string(),
      latestEnd: z.string(),
    }),
  })
  .passthrough();

export const timetableGenerationPayloadSchema = z.object({
  combinations: z.array(timetableCombinationSchema),
  totalCombinations: z.number(),
  returnedCount: z.number(),
  hasMore: z.boolean(),
  generatedAt: z.string(),
});

export const timetableValidationSchema = z.object({
  isValid: z.boolean(),
  conflicts: z.array(
    z.object({
      type: z.enum(['time_clash', 'missing_required', 'invalid_index']),
      message: z.string(),
      modules: z.array(z.string()).optional(),
    })
  ),
  warnings: z.array(
    z.object({
      type: z.string(),
      message: z.string(),
    })
  ),
});

export const userSettingsSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    theme: z.enum(['light', 'dark', 'system']),
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
      timetableReminders: z.boolean(),
    }),
    privacy: z.object({
      profileVisibility: z.enum(['public', 'private']),
      timetableVisibility: z.enum(['public', 'private']),
    }),
    preferences: z.object({
      defaultView: z.enum(['calendar', 'list']),
      startOfWeek: z.enum(['MON', 'SUN']),
      timeFormat: z.enum(['12h', '24h']),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();


