import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../src/config/database';
import { getProfile, updateProfile } from '../../src/business/services/auth/profile';
import { profileSettingsSchema, sanitizeProfileSettings } from '../../src/business/services/auth/settings';

describe('profile preference boundary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps supported preferences and drops unknown or invalid fields', () => {
    expect(sanitizeProfileSettings({
      theme: 'dark', language: 'en', defaultSemester: '2025_1',
      externalLogin: { username: 'example', password: 'example' },
      themeColor: 123,
      preferences: { compactView: true, externalLogin: 'example' },
    })).toEqual({
      theme: 'dark', language: 'en', defaultSemester: '2025_1',
      preferences: { compactView: true },
    });
  });

  it.each([null, [], 'invalid', 1])('handles malformed stored settings: %j', (value) => {
    expect(sanitizeProfileSettings(value)).toEqual({});
  });

  it('rejects an invalid supported preference in request validation', () => {
    expect(profileSettingsSchema.safeParse({ theme: 'invalid' }).success).toBe(false);
  });

  it('preserves valid nested preferences when another stored preference is invalid', () => {
    expect(sanitizeProfileSettings({ preferences: {
      compactView: true, show24HourTime: 'invalid', showWeekends: false,
    } })).toEqual({ preferences: { compactView: true, showWeekends: false } });
  });

  it('does not expose unknown stored fields or the password hash in profiles', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1', passwordHash: 'hashed',
      settings: { theme: 'dark', externalLogin: { password: 'example' } },
    } as never);
    const profile = await getProfile('user-1');
    expect(profile.settings).toEqual({ theme: 'dark' });
    expect(profile.passwordHash).toBeUndefined();
    expect(profile.hasPassword).toBe(true);
  });

  it('preserves supported stored preferences and removes unknown fields on updates', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      settings: { theme: 'dark', externalLogin: { password: 'example' } },
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'user-1', settings: { theme: 'dark', language: 'en' }, passwordHash: null,
    } as never);
    await updateProfile('user-1', { settings: { language: 'en' } });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { settings: { theme: 'dark', language: 'en' } },
    }));
  });
});
