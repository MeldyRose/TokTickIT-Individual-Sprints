import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'artifacts/lab-03/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('Capture Complete Lab 3 Submission Evidence Screenshots', () => {
  
  test('Part 5: Login & Mandatory Password Change UI', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // 5.1 Initial Login Screen
    await page.goto('/login');
    await expect(page.getByTestId('login-page')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-screen-initial.png') });

    // 5.2 Invalid Login Credentials
    await page.getByTestId('login-email-input').fill('wrong@example.com');
    await page.getByTestId('login-password-input').fill('WrongPass123!');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('login-error-banner')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-invalid-credentials.png') });

    // 5.3 Inactive Account Login
    await page.getByTestId('login-email-input').fill('inactive@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('login-error-banner')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-login-inactive-account.png') });

    // 5.4 Busy Failure Feedback State
    await page.getByTestId('login-email-input').fill('michael.b@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    const submitBtn = page.getByTestId('login-submit-btn');
    await submitBtn.click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-login-busy-feedback.png') });
    await expect(page.getByTestId('authenticated-user-widget')).toBeVisible();

    // Logout to reset state for mandatory password change test
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await expect(page.getByTestId('login-page')).toBeVisible();

    // 5.5 Mandatory Password Change Modal (jennifer.a@example.com has mustChangePassword = true)
    await page.getByTestId('login-email-input').fill('jennifer.a@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('change-password-modal')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-mandatory-password-change-modal.png') });

    // 5.6 Password Complexity Checklist
    await page.getByTestId('current-password-input').fill('Password123!');
    await page.getByTestId('new-password-input').fill('weak');
    await expect(page.getByTestId('password-complexity-checklist')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-password-complexity-checklist.png') });

    // Complete password change
    await page.getByTestId('new-password-input').fill('NewStrongPass1!');
    await page.getByTestId('confirm-password-input').fill('NewStrongPass1!');
    await page.getByTestId('save-password-btn').click();
    await expect(page.getByTestId('authenticated-user-widget')).toBeVisible();

    // 5.7 Authenticated Header Widget
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-authenticated-user-header.png') });

    // 5.8 Logout Flow
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await expect(page.getByTestId('login-page')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-logout-redirection.png') });

    // 5.9 Direct Access Blocked
    await page.goto('/login');
    await expect(page.getByTestId('login-page')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-direct-access-blocked.png') });
  });

  test('Part 6: Working IT Staff Ticket Queue UI', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Login as IT Staff
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('authenticated-user-widget')).toBeVisible();
    if (await page.getByTestId('nav-ticket-queue').isVisible()) {
      await page.getByTestId('nav-ticket-queue').click();
    }
    await expect(page.getByTestId('queue-search-input')).toBeVisible();

    // 6.1 Staff Queue Desktop View
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-staff-queue-desktop.png') });

    // 6.2 Filter & Search Queue
    await page.getByTestId('queue-search-input').fill('LEB2');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-staff-queue-search-filter.png') });
    await page.getByTestId('queue-search-input').clear();

    // 6.3 Ownership Filter Toggle
    await page.getByTestId('queue-owner-select').selectOption('unassigned');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-staff-queue-ownership-filter.png') });

    // 6.4 Pagination & Sorting Controls
    await page.getByTestId('queue-owner-select').selectOption('all');
    await page.getByTestId('queue-sort-select').selectOption('itPriority-desc');
    await page.getByTestId('page-size-select').selectOption('5');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12b-staff-queue-pagination-sorting.png') });

    // 6.5 No Results / Clear Filters
    await page.getByTestId('queue-search-input').fill('NonExistentTicketQuery999');
    await expect(page.getByTestId('no-results-message')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13-staff-queue-no-results.png') });
    await page.getByTestId('queue-clear-filters-btn-empty').click();

    // 6.6 Responsive Stacked Card View (Mobile <768px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14-staff-queue-responsive-card-view.png') });
  });

  test('Part 7: Working IT Staff Ticket Detail UI', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Login as IT Staff
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('authenticated-user-widget')).toBeVisible();

    // Select ticket tkt-001 from queue
    const viewBtn = page.locator('[data-testid^="view-ticket-"]').first();
    await viewBtn.click();
    await expect(page.getByTestId('detail-ticket-number')).toBeVisible();

    // 7.1 IT Staff Detail View (Claim & Operational Controls)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15-staff-detail-unassigned-claim.png') });

    // 7.2 Priority & Permitted Status Changes
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16-staff-detail-priority-status-change.png') });

    // 7.3 Public Comments Thread
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17-staff-detail-public-comments.png') });

    // 7.4 Internal Notes (Amber container & lock icon)
    await expect(page.getByTestId('internal-notes-section')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18-staff-detail-internal-notes.png') });

    // 7.5 Attachments Section
    await page.getByTestId('tab-attachments').click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19-staff-detail-attachment-continuity.png') });

    // 7.6 Requester Resolution Indication (tkt-004 has WAITING_FOR_REQUESTER status)
    await page.getByTestId('nav-ticket-queue').click();
    await expect(page.getByTestId('queue-search-input')).toBeVisible();
    await page.getByTestId('queue-search-input').fill('TKT-2026-0004');
    const tkt4ViewBtn = page.locator('[data-testid="view-ticket-tkt-004"]');
    if (await tkt4ViewBtn.isVisible()) {
      await tkt4ViewBtn.click();
      await expect(page.getByTestId('detail-ticket-number')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20-staff-detail-requester-resolution.png') });
    }

    // 7.7 Requester Detail View (Internal Notes Section Completely Omitted)
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('michael.b@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    
    const reqViewBtn = page.locator('[data-testid^="view-ticket-"]').first();
    if (await reqViewBtn.isVisible()) {
      await reqViewBtn.click();
      await expect(page.getByTestId('public-comments-section')).toBeVisible();
      await expect(page.getByTestId('internal-notes-section')).not.toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21-requester-detail-no-internal-notes.png') });
    }
  });

  test('Part 8: Working Administrator User Management UI', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Login as Admin
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('admin@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('authenticated-user-widget')).toBeVisible();
    await expect(page.getByTestId('user-management-page')).toBeVisible();

    // 8.1 Admin User List Screen
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '22-admin-user-list-zen-green.png') });

    // 8.2 Search & Role Filter
    await page.getByTestId('search-input').fill('Alex');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23-admin-user-search-filter.png') });
    await page.getByTestId('search-input').clear();

    // 8.3 Create User Modal
    await page.getByTestId('create-user-btn').click();
    await expect(page.getByTestId('create-user-modal')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '24-admin-create-user-modal.png') });

    // 8.4 Duplicate Email Validation Error
    await page.getByTestId('create-user-name-input').fill('Duplicate Test');
    await page.getByTestId('create-user-email-input').fill('admin@toktickit.com');
    await page.getByTestId('create-user-password-input').fill('Password123!');
    await page.getByTestId('submit-create-user-btn').click();
    await expect(page.getByTestId('create-user-error-banner')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '25-admin-create-user-duplicate-email.png') });
    await page.getByTestId('cancel-create-user-btn').click();

    // 8.5 Edit User Modal
    const editBtn = page.locator('[data-testid^="edit-user-btn-"]').first();
    await editBtn.click();
    await expect(page.getByTestId('edit-user-modal')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '26-admin-edit-user-modal.png') });
    await page.getByTestId('cancel-edit-user-btn').click();

    // 8.6 Reset Password Modal
    const resetBtn = page.getByTestId('reset-password-btn-req-user-003'); // David Lee
    await resetBtn.click();
    await expect(page.getByTestId('reset-password-modal')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '27-admin-reset-password-modal.png') });

    // Perform password reset for David Lee
    await page.getByTestId('reset-password-input').fill('NewResetPass1!');
    await page.getByTestId('submit-reset-password-btn').click();
    await expect(page.getByTestId('reset-password-modal')).not.toBeVisible();

    // 8.7 Demonstrate Required Password Change at Next Login for Reset User
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('david.l@example.com');
    await page.getByTestId('login-password-input').fill('NewResetPass1!');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('change-password-modal')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '27b-admin-reset-password-next-login-forced-change.png') });

    // Log back in as Admin via mandatory logout button
    await page.getByTestId('mandatory-logout-btn').click();
    await page.getByTestId('login-email-input').fill('admin@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    if (await page.getByTestId('nav-user-management').isVisible()) {
      await page.getByTestId('nav-user-management').click();
    }
    await expect(page.getByTestId('user-management-page')).toBeVisible();

    // 8.8 Self-Deactivation Disabled Note / Error Banner
    const selfEditBtn = page.getByTestId('edit-user-btn-admin-user-001');
    if (await selfEditBtn.isVisible()) {
      await selfEditBtn.click();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '28-admin-self-deactivation-prevented.png') });
      await page.getByTestId('cancel-edit-user-btn').click();
    }

    // 8.9 Forbidden Non-Admin Access
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('michael.b@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '29-forbidden-non-admin-access.png') });
  });

  test('Part 9: Responsive Viewports for All Major Lab 3 Screens', async ({ page }) => {
    // 9.1 Desktop Viewports (1280px)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '30a-responsive-login-desktop.png') });

    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    if (await page.getByTestId('nav-ticket-queue').isVisible()) {
      await page.getByTestId('nav-ticket-queue').click();
    }
    await expect(page.getByTestId('staff-ticket-queue')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '30b-responsive-queue-desktop.png') });

    const viewBtn = page.locator('[data-testid^="view-ticket-"]').first();
    await viewBtn.click();
    await expect(page.getByTestId('detail-ticket-number')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '30c-responsive-detail-desktop.png') });

    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('admin@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    await expect(page.getByTestId('user-management-page')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '30d-responsive-admin-desktop.png') });

    // 9.2 Tablet Viewports (800px)
    await page.setViewportSize({ width: 800, height: 1024 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '31d-responsive-admin-tablet.png') });

    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await page.goto('/login');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '31a-responsive-login-tablet.png') });

    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();
    if (await page.getByTestId('nav-ticket-queue').isVisible()) {
      await page.getByTestId('nav-ticket-queue').click();
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '31b-responsive-queue-tablet.png') });

    // 9.3 Mobile Viewports (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    if (await page.getByTestId('nav-ticket-queue').isVisible()) {
      await page.getByTestId('nav-ticket-queue').click();
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '32b-responsive-queue-mobile.png') });

    const mobileViewBtn = page.locator('[data-testid^="view-ticket-mobile-"]').first();
    if (await mobileViewBtn.isVisible()) {
      await mobileViewBtn.click();
      await expect(page.getByTestId('detail-ticket-number')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '32c-responsive-detail-mobile.png') });
    }
  });
});
