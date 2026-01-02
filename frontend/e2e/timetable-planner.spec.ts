import { test, expect } from '@playwright/test';

test('renders the timetable planner modules tab', async ({ page }) => {
  await page.route('**/api/semesters', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: ['AY2024/25_1'] }),
    });
  });

  await page.goto('/timetable-planner');
  await expect(page.getByRole('button', { name: 'Select Modules' })).toBeVisible();
});
