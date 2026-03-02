import { test, expect } from '@playwright/test';

test('should redirect unauthenticated users to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});
