import { test, expect } from '@playwright/test';

test.describe('E2E Authentication & Password Change Flow (E2E-01, AC-01, AC-02, AC-17)', () => {
  test('Complete login, mandatory password change, app entry, and logout flow', async ({ page }) => {
    // 1. Navigate to application root
    await page.goto('/');
    await expect(page.getByTestId('login-page')).toBeVisible();

    // 2. Login with user having mustChangePassword = true (Jennifer Anderson)
    await page.getByTestId('login-email-input').fill('jennifer.a@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    // 3. Verify mandatory Change Password modal is presented
    await expect(page.getByTestId('change-password-modal')).toBeVisible();

    // Fill current temporary password
    await page.getByTestId('current-password-input').fill('Password123!');

    // Type weak new password and check complexity checklist
    await page.getByTestId('new-password-input').fill('weak');
    await expect(page.getByTestId('password-complexity-checklist')).toBeVisible();

    // Fill strong valid new password
    await page.getByTestId('new-password-input').fill('NewStrongPass1!');
    await page.getByTestId('confirm-password-input').fill('NewStrongPass1!');

    // Submit password change
    await page.getByTestId('save-password-btn').click();

    // 4. Verify password change succeeds and user enters app
    await expect(page.getByTestId('change-password-modal')).not.toBeVisible();
    await expect(page.getByTestId('authenticated-user-widget')).toBeVisible();

    // 5. Logout flow
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();

    // Verify redirected back to login page
    await expect(page.getByTestId('login-page')).toBeVisible();
  });
});
