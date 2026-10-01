import { describe, expect, it } from 'vitest';
import { apiIndexResponse } from '../../src/docs/apiIndex';

describe('supported API surface', () => {
  it('advertises only the retained product domains', () => {
    expect(Object.keys(apiIndexResponse.endpoints).sort()).toEqual([
      'auth', 'catalogue', 'coursePlan', 'health', 'moduleReviews', 'moduleTopics',
      'timetableGeneration', 'timetables', 'user',
    ].sort());
    expect(apiIndexResponse.endpoints.coursePlan).toEqual({
      get: 'GET /api/plan', save: 'POST /api/plan',
    });
  });
});
