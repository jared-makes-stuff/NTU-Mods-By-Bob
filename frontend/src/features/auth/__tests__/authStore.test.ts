import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import type { AuthResponse, User } from '@/shared/api/types';
import * as authApi from '@/shared/api/auth';

vi.mock('@/shared/api/auth', () => ({
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn(),
}));

const mockedAuthApi = vi.mocked(authApi, { partial: true });

const baseUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  createdAt: new Date().toISOString(),
};

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedAuthApi.login?.mockReset();
    mockedAuthApi.getCurrentUser?.mockReset();

    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('sets user and auth state after login', async () => {
    const loginResponse: AuthResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: baseUser,
    };
    const fullUser: User = {
      ...baseUser,
      settings: {},
    };

    mockedAuthApi.login?.mockResolvedValue(loginResponse);
    mockedAuthApi.getCurrentUser?.mockResolvedValue(fullUser);

    await useAuthStore.getState().login({ email: 'test@example.com', password: 'secret' });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(fullUser);
    expect(state.error).toBeNull();
    expect(mockedAuthApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'secret',
    });
  });

  it('stores an error message when login fails', async () => {
    mockedAuthApi.login?.mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      useAuthStore.getState().login({ email: 'test@example.com', password: 'bad' })
    ).rejects.toThrow('Invalid credentials');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toBe('Invalid credentials');
    expect(mockedAuthApi.getCurrentUser).not.toHaveBeenCalled();
  });
});
