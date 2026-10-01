import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '../client';
import { getPlan, savePlan } from '../planner';

vi.mock('../client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

describe('course plan contract', () => {
  it('accepts the empty plan returned for a new account', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { modules: [], metadata: {} } } });
    expect(await getPlan()).toEqual({ modules: [], metadata: {} });
  });

  it('sends only the supported plan payload and returns it after saving', async () => {
    const plan = { modules: [], metadata: { view: 'table' } };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: plan } });
    expect(await savePlan(plan)).toEqual(plan);
    expect(apiClient.post).toHaveBeenCalledWith('/plan', plan);
  });

  it('rejects a malformed plan response', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { modules: 'invalid' } } });
    await expect(getPlan()).rejects.toThrow();
  });
});
