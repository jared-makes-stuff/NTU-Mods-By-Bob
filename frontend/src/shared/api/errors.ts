import axios, { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export type NormalizedApiError = {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
};

export const isAxiosError = axios.isAxiosError;

export const getErrorStatus = (error: unknown): number | undefined => {
  return isAxiosError(error) ? error.response?.status : undefined;
};

export const getAxiosErrorCode = (error: unknown): string | undefined => {
  return isAxiosError(error) ? error.code : undefined;
};

export const getAxiosErrorMessage = (error: unknown): string | undefined => {
  return isAxiosError(error) ? error.message : undefined;
};

export const getAxiosErrorPayload = (error: unknown): ApiError | undefined => {
  if (!isAxiosError(error)) return undefined;
  return (error as AxiosError<ApiError>).response?.data;
};

export const normalizeApiError = (error: unknown, fallback = 'An error occurred'): NormalizedApiError => {
  if (isAxiosError(error)) {
    const apiError = getAxiosErrorPayload(error);
    return {
      message: apiError?.message || error.message || fallback,
      code: apiError?.code,
      status: getErrorStatus(error),
      details: apiError?.details,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: fallback };
};

export function getErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
