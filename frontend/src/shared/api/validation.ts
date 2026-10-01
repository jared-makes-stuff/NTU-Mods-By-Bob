import { z } from 'zod';

export class ApiResponseValidationError extends Error {
  readonly details: unknown;

  constructor(message: string, details: unknown) {
    super(message);
    this.name = 'ApiResponseValidationError';
    this.details = details;
  }
}

export const dataResponseSchema = <T extends z.ZodTypeAny>(schema: T) => z.object({ data: schema });

export function parseApiResponse<T>(schema: z.ZodType<T>, payload: unknown, context: string): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ApiResponseValidationError(`${context} response validation failed`, result.error.flatten());
  }
  return result.data;
}

export function parseDataResponse<T>(schema: z.ZodType<T>, payload: unknown, context: string): T {
  const wrappedSchema = dataResponseSchema(schema);
  return parseApiResponse(wrappedSchema, payload, context).data;
}
