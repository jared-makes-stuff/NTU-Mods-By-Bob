import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const HEADER_NAME = 'x-request-id';

const normalizeHeader = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    const first = value[0];
    return first ? first.trim() : null;
  }
  return value ? value.trim() : null;
};

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const existing = normalizeHeader(req.headers[HEADER_NAME] as string | string[] | undefined);
  const requestId = existing && existing.length > 0 ? existing : randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
};
