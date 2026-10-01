import { beforeEach, describe, expect, it } from 'vitest';
import { useCoursePlannerStore } from '../state/store';
import type { PlannedModule } from '../utils';

const plannedModule: PlannedModule = {
  id: 'module-1', code: 'SC1003', name: 'Programming', au: 3,
  year: 1, semester: 1, status: 'PLANNED',
};

describe('course roadmap persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    useCoursePlannerStore.getState().reset();
  });

  it('preserves module editing, save tracking, and supported persisted fields', () => {
    useCoursePlannerStore.getState().setPlannedModules([plannedModule]);
    expect(useCoursePlannerStore.getState().hasUnsavedChanges()).toBe(true);
    useCoursePlannerStore.getState().markAsSaved();
    expect(useCoursePlannerStore.getState().hasUnsavedChanges()).toBe(false);
    const stored = JSON.parse(localStorage.getItem('course-planner-storage')!);
    expect(Object.keys(stored.state).sort()).toEqual([
      'metadata', 'plannedModules', 'savedPlannedModules',
    ]);
  });

  it('loads module roadmaps from older data without restoring obsolete fields', async () => {
    localStorage.setItem('course-planner-storage', JSON.stringify({ version: 0, state: {
      plannedModules: [plannedModule], savedPlannedModules: [plannedModule], metadata: { view: 'table' },
      obsoleteTargets: { total: 160 },
    } }));
    await useCoursePlannerStore.persist.rehydrate();
    expect(useCoursePlannerStore.getState().plannedModules).toEqual([plannedModule]);
    expect(useCoursePlannerStore.getState().metadata).toEqual({ view: 'table' });
    expect(useCoursePlannerStore.getState()).not.toHaveProperty('obsoleteTargets');
    const stored = JSON.parse(localStorage.getItem('course-planner-storage')!);
    expect(stored.state).not.toHaveProperty('obsoleteTargets');
    expect(stored.state.plannedModules).toEqual([plannedModule]);
  });
});
