import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const plannedModule = {
  id: 'example-entry', code: 'MOOC', name: 'Example custom module', au: 3,
  year: 1, semester: 1, status: 'PLANNED',
};

async function mockPlanningApi(page: Page, authenticated = false) {
  const savedPayloads: Record<string, unknown>[] = [];
  const loadedPlans: string[] = [];
  const unexpectedRequests: string[] = [];
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    let status = 200;
    let data: unknown;
    if (pathname === '/api/auth/config') data = {};
    else if (pathname === '/api/auth/me' && authenticated) data = { user: {
      id: 'example-user', name: 'Example Student', email: 'example@invalid.test',
      role: 'user', createdAt: '2026-01-01T00:00:00.000Z', settings: { theme: 'system' },
    } };
    else if (pathname === '/api/auth/me' || pathname === '/api/auth/refresh') status = 401;
    else if (pathname === '/api/semesters') data = ['AY2026/27_1'];
    else if (pathname === '/api/schools') data = ['CCDS'];
    else if (pathname === '/api/modules/search') data = [{
      code: 'SC1003', name: 'Example programming module', au: 3, school: 'CCDS',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    }];
    else if (pathname === '/api/modules/SC1003/indexes') data = [
      { indexNumber: '10001', type: 'LEC', day: 'MON', startTime: '0900', endTime: '1000', venue: 'LT1', weeks: [1, 2] },
      { indexNumber: '10002', type: 'LEC', day: 'TUE', startTime: '1000', endTime: '1100', venue: 'LT2', weeks: [1, 2] },
    ];
    else if (pathname === '/api/plan') {
      if (request.method() === 'POST') {
        const payload = request.postDataJSON();
        savedPayloads.push(payload);
        data = payload;
      } else {
        loadedPlans.push(pathname);
        data = { modules: [], metadata: {} };
      }
    } else {
      unexpectedRequests.push(`${request.method()} ${pathname}`);
      status = 404;
    }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ data }) });
  });
  return { savedPayloads, loadedPlans, unexpectedRequests };
}

async function addCustomModule(page: Page) {
  await page.getByRole('button', { name: 'MOOC', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Module Title').fill('Example custom module');
  await dialog.getByLabel('Academic Units (AU)').fill('3');
  await dialog.getByRole('button', { name: 'Add Module', exact: true }).click();
  await expect(page.getByText('1 module - 3 AU total', { exact: true })).toBeVisible();
}

test('searches catalogue indexes and generates selectable timetable results', async ({ page }) => {
  const { unexpectedRequests } = await mockPlanningApi(page);
  await page.goto('/timetable-planner');
  await page.getByPlaceholder('Search modules (e.g. SC2002)...').fill('SC1003');
  await page.getByText('Example programming module', { exact: true }).click();
  await expect(page.getByText('Total Modules (1)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await page.getByRole('button', { name: 'Generate Timetables', exact: true }).click();
  await expect(page.getByText('Timetable 1 of 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await expect(page.getByText('Timetable 2 of 2', { exact: true })).toBeVisible();
  expect(unexpectedRequests).toEqual([]);
});

test('preserves a guest custom roadmap across reload and exports CSV', async ({ page }) => {
  const { unexpectedRequests } = await mockPlanningApi(page);
  await page.goto('/course-planner');
  await addCustomModule(page);
  await page.reload();
  await expect(page.getByText('1 module - 3 AU total', { exact: true })).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export All', exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  const file = await download.path();
  expect(file).not.toBeNull();
  const csv = await readFile(file!, 'utf8');
  expect(csv).toContain('Module Code,Title,Prerequisites,AU,Grade,Remarks,Year,Semester');
  expect(csv).toContain('Example custom module');
  expect(unexpectedRequests).toEqual([]);
});

test('rewrites an older roadmap without obsolete fields before editing', async ({ page }) => {
  const { unexpectedRequests } = await mockPlanningApi(page);
  await page.addInitScript((entry) => localStorage.setItem('course-planner-storage', JSON.stringify({
    version: 0, state: { plannedModules: [entry], savedPlannedModules: [entry], metadata: { view: 'table' }, obsoleteTargets: { total: 160 } },
  })), plannedModule);
  await page.goto('/course-planner');
  await expect(page.getByText('1 module - 3 AU total', { exact: true })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('course-planner-storage')!));
  expect(stored.version).toBe(1);
  expect(stored.state).not.toHaveProperty('obsoleteTargets');
  expect(stored.state.plannedModules).toEqual([plannedModule]);
  expect(unexpectedRequests).toEqual([]);
});

test('loads an empty account roadmap and saves only supported plan fields', async ({ page }) => {
  const { savedPayloads, loadedPlans, unexpectedRequests } = await mockPlanningApi(page, true);
  await page.goto('/course-planner');
  await expect(page.getByText('No modules planned yet', { exact: true })).toBeVisible();
  await expect.poll(() => loadedPlans.length).toBe(1);
  await addCustomModule(page);
  await page.getByRole('button', { name: 'Save Plan', exact: true }).click();
  await expect.poll(() => savedPayloads.length).toBe(1);
  expect(Object.keys(savedPayloads[0]).sort()).toEqual(['metadata', 'modules']);
  expect(savedPayloads[0].modules).toEqual([expect.objectContaining({ code: 'MOOC', name: 'Example custom module', au: 3 })]);
  await expect(page.getByText('Unsaved', { exact: true })).not.toBeVisible();
  expect(unexpectedRequests).toEqual([]);
});
