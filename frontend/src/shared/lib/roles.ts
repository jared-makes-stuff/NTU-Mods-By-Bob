export type UserRole = 'superadmin' | 'admin' | 'pro' | 'plus' | 'user' | 'default';

const ROLE_RANK: Record<UserRole, number> = {
  superadmin: 4,
  admin: 3,
  pro: 2,
  plus: 1,
  user: 0,
  default: 0,
};

const ROLE_ALIASES: Record<string, UserRole> = {
  '': 'user',
  null: 'user',
  none: 'user',
  default: 'user',
  member: 'user',
};

const ALLOWED_ROLES: UserRole[] = ['superadmin', 'admin', 'pro', 'plus', 'user', 'default'];

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  pro: 'Pro',
  plus: 'Plus',
  user: 'Default',
  default: 'Default',
};

export const normalizeRole = (role?: string | null): UserRole => {
  if (!role) return 'user';
  const cleaned = role.trim().toLowerCase();
  if (cleaned in ROLE_ALIASES) {
    return ROLE_ALIASES[cleaned]!;
  }
  if (ALLOWED_ROLES.includes(cleaned as UserRole)) {
    return cleaned as UserRole;
  }
  return 'user';
};

export const getRoleRank = (role?: string | null): number => {
  return ROLE_RANK[normalizeRole(role)];
};

export const hasRequiredRole = (role: string | null | undefined, required: UserRole): boolean => {
  return getRoleRank(role) >= ROLE_RANK[normalizeRole(required)];
};
