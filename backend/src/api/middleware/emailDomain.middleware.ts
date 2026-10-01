import { Request, Response, NextFunction } from 'express';

type RequireEmailDomainOptions = {
  message?: string;
};

export function requireEmailDomain(domain: string, options?: RequireEmailDomainOptions) {
  const normalizedDomain = domain.trim().replace(/^@/, '').toLowerCase();

  return (req: Request, res: Response, next: NextFunction): void => {
    const email = req.user?.email?.trim().toLowerCase();

    if (!email) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!email.endsWith(`@${normalizedDomain}`)) {
      res.status(403).json({
        error: options?.message || `Only ${normalizedDomain} email addresses can perform this action.`,
      });
      return;
    }

    next();
  };
}
