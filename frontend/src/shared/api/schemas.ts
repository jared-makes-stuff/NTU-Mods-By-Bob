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

const normalizeObject = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
    schema
  );

const normalizeArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (Array.isArray(value) ? value : []), z.array(schema));

export const userSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string().default("user"),
    avatarUrl: z.string().optional(),
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

export const backendPlannedModuleSchema = z
  .object({
    id: z.string(),
    planId: z.string(),
    moduleCode: z.string(),
    year: z.number(),
    semester: z.string(),
    status: z.string(),
    grade: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const coursePlanSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    program: z.string().nullable().optional(),
    expectedGradTerm: z.string().nullable().optional(),
    plannedModules: z.array(backendPlannedModuleSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const coursePlanStatsSchema = z.object({
  totalAU: z.number(),
  moduleCount: z.number(),
  semesters: z.record(
    z.string(),
    z.object({
      modules: z.number(),
      au: z.number(),
    })
  ),
});

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

export const timetableConflictSlotSchema = z
  .object({
    moduleCode: z.string().optional(),
    indexNumber: z.string().optional(),
    type: z.string().optional(),
    title: z.string().optional(),
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    weeks: z.array(z.number()).optional(),
    source: z.enum(['module', 'custom']),
  })
  .passthrough();

export const timetableConflictSchema = z
  .object({
    slot1: timetableConflictSlotSchema,
    slot2: timetableConflictSlotSchema,
    reason: z.string(),
  })
  .passthrough();

export const classSessionSchema = z
  .object({
    type: z.string(),
    group: z.string(),
    day: z.string(),
    time: z.string(),
    venue: z.string(),
    remark: z.string().optional(),
  })
  .passthrough();

export const availableIndexSchema = z
  .object({
    index: z.string(),
    vacancy: z.number(),
    waitlist: z.number(),
  })
  .passthrough();

export const registeredCourseSchema = z
  .object({
    code: z.string(),
    title: z.string(),
    au: z.string(),
    type: z.string(),
    index: z.string(),
    status: z.string(),
    exam: z.string().optional(),
    availableIndexes: z.array(availableIndexSchema).optional(),
    classes: z.array(classSessionSchema),
  })
  .passthrough();

export const planInfoSchema = z
  .object({
    plan1Exists: z.boolean(),
    plan2Exists: z.boolean(),
    plan3Exists: z.boolean(),
    currentPlan: z.number().nullable(),
  })
  .passthrough();

export const plannerDataSchema = z
  .object({
    registeredCourses: z.array(registeredCourseSchema),
    plannedCourses: z.array(registeredCourseSchema),
    planInfo: planInfoSchema,
    academicYear: z.string().optional(),
    semester: z.string().optional(),
  })
  .passthrough();

export const personalizedInfoSchema = z
  .object({
    name: z.string().optional(),
    matric: z.string().optional(),
    programme: z.string().optional(),
    studyYear: z.string().optional(),
    registrationStudyYear: z.string().optional(),
    registrationTime: z.string().optional(),
    normalLoad: z.string().optional(),
    maxLoad: z.string().optional(),
    currentLoad: z.string().optional(),
    status: z.string().optional(),
    academicYear: z.string().optional(),
    semester: z.string().optional(),
    rawInfo: z.string().optional(),
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

export const vacancyResultSchema = apiResponseSchema(
  z.array(
    z.object({
      index: z.string(),
      vacancy: z.number(),
      waitlist: z.number(),
      classes: z.array(
        z.object({
          type: z.string(),
          group: z.string(),
          day: z.string(),
          time: z.string(),
          venue: z.string(),
          remark: z.string().optional(),
        })
      ),
    })
  )
);

export const singleVacancyResultSchema = apiResponseSchema(
  z.object({
    index: z.string(),
    vacancy: z.number(),
    waitlist: z.number(),
    classes: z.array(
      z.object({
        type: z.string(),
        group: z.string(),
        day: z.string(),
        time: z.string(),
        venue: z.string(),
        remark: z.string().optional(),
      })
    ),
  })
);

export const telegramLinkStatusSchema = z.object({
  linked: z.boolean(),
  telegramChatId: z.string().nullable().optional(),
  telegramUsername: z.string().nullable().optional(),
  linkedAt: z.string().nullable().optional(),
});

export const telegramLinkCodeSchema = z.object({
  code: z.string(),
  expiresAt: z.string(),
});

export const vacancyAlertTaskSchema = z.object({
  id: z.string(),
  moduleCode: z.string(),
  indexNumber: z.string(),
  lastCheckedAt: z.string().nullable().optional(),
  lastVacancy: z.number().nullable().optional(),
  lastWaitlist: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const vacancyAlertTasksSchema = z.object({
  tasks: z.array(vacancyAlertTaskSchema),
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
