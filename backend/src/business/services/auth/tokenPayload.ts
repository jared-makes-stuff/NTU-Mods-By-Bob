import { JwtPayload } from '../../../types/domain';

export function buildJwtPayload(user: { id: string; email: string; role: string }): JwtPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}
