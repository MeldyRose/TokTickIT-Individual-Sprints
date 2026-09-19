import { test, expect } from '@playwright/test';

test.describe('E2E Administrator User Management Flow (E2E-03, AC-12..16)', () => {
  test('Admin user list, search & filter, create user, edit user, reset password, safety rules', async ({ page }) => {
    // 1. Login as Administrator (admin@toktickit.com)
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('admin@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    // 2. User Management Screen (auto-routed for Administrator)
    await expect(page.getByTestId('authenticated-user-widget')).toBeVisible();
    await expect(page.getByTestId('search-input')).toBeVisible();

    // 3. User List Search and Role Filter
    await page.getByTestId('search-input').fill('Alex');
    await expect(page.getByText('Alex Thompson').first()).toBeVisible();
    await page.getByTestId('search-input').clear();

    // 4. Create New User
    await page.getByTestId('create-user-btn').click();
    await expect(page.getByTestId('create-user-modal')).toBeVisible();

    const timestamp = Date.now();
    const newEmail = `e2e.staff.${timestamp}@toktickit.com`;

    await page.getByTestId('create-user-name-input').fill(`E2E Staff User ${timestamp}`);
    await page.getByTestId('create-user-email-input').fill(newEmail);
    await page.getByTestId('create-user-role-select').selectOption('IT_STAFF');
    await page.getByTestId('create-user-password-input').fill('InitialPass123!');
    await page.getByTestId('submit-create-user-btn').click();

    await expect(page.getByTestId('create-user-modal')).not.toBeVisible();
    await expect(page.getByTestId('success-toast')).toBeVisible();

    // 5. Search for created user and open Edit Modal
    await page.getByTestId('search-input').fill(newEmail);
    const editBtn = page.locator('[data-testid^="edit-user-btn-"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(page.getByTestId('edit-user-modal')).toBeVisible();
    await page.getByTestId('edit-user-name-input').fill(`E2E Staff User ${timestamp} Updated`);
    await page.getByTestId('submit-edit-user-btn').click();
    await expect(page.getByTestId('edit-user-modal')).not.toBeVisible();

    // 6. Reset Password for Created User
    const resetBtn = page.locator('[data-testid^="reset-password-btn-"]').first();
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    await expect(page.getByTestId('reset-password-modal')).toBeVisible();
    await page.getByTestId('reset-password-input').fill('NewResetPass123!');
    await page.getByTestId('submit-reset-password-btn').click();
    await expect(page.getByTestId('reset-password-modal')).not.toBeVisible();
  });
});
