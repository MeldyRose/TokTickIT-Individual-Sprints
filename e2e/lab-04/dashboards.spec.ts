import { test, expect } from '@playwright/test';

test.describe('E2E Lab 4: Operational Dashboards & Metric Drill-Downs (AC-12..16, FR-14..19)', () => {
  test('Requester Dashboard metrics, action required alert, and drill-down navigation to My Tickets', async ({ page }) => {
    // 1. Login as Requester
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('michael.b@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    // Navigate to Requester Dashboard
    await expect(page.getByTestId('nav-requester-dashboard')).toBeVisible();
    await page.getByTestId('nav-requester-dashboard').click();

    // Verify Requester Dashboard is rendered
    await expect(page.getByTestId('requester-dashboard')).toBeVisible();
    await expect(page.getByTestId('requester-dashboard-title')).toBeVisible();

    // 2. Metric Cards Grid
    await expect(page.getByTestId('metric-cards-grid')).toBeVisible();
    await expect(page.getByTestId('metric-card-open')).toBeVisible();
    await expect(page.getByTestId('metric-card-waiting-input')).toBeVisible();
    await expect(page.getByTestId('metric-card-resolved')).toBeVisible();

    // 3. Recent Tickets & Quick Actions
    await expect(page.getByTestId('my-recent-tickets-widget')).toBeVisible();
    await expect(page.getByTestId('quick-actions-widget')).toBeVisible();

    // 4. Drill-Down: Click Open Tickets Metric Card
    await page.getByTestId('metric-card-open').click();
    await expect(page.getByTestId('search-input')).toBeVisible();
    expect(page.url()).toContain('status=open');

    // 5. Navigate back to Dashboard and test Waiting for Input drill-down
    await page.getByTestId('nav-requester-dashboard').click();
    await expect(page.getByTestId('requester-dashboard')).toBeVisible();

    await page.getByTestId('metric-card-waiting-input').click();
    await expect(page.getByTestId('search-input')).toBeVisible();
    expect(page.url()).toContain('status=WAITING_FOR_REQUESTER');

    // 6. Header Navigation Cleanses Filter
    await page.getByTestId('nav-my-tickets').click();
    expect(page.url()).not.toContain('status=WAITING_FOR_REQUESTER');
  });

  test('IT Staff Dashboard KPI metrics, breakdowns, and drill-down filtering to Staff Ticket Queue', async ({ page }) => {
    // 1. Login as IT Staff
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    // Verify lands on /staff/dashboard
    await expect(page.getByTestId('staff-dashboard')).toBeVisible();
    await expect(page.getByTestId('dashboard-title')).toContainText('Operations Dashboard');

    // 2. Check 7 KPI Metric Cards
    await expect(page.getByTestId('metric-card-total-open')).toBeVisible();
    await expect(page.getByTestId('metric-card-unassigned')).toBeVisible();
    await expect(page.getByTestId('metric-card-my-assigned')).toBeVisible();
    await expect(page.getByTestId('metric-card-waiting-for-requester')).toBeVisible();
    await expect(page.getByTestId('metric-card-urgent-or-high')).toBeVisible();
    await expect(page.getByTestId('metric-card-resolved-today')).toBeVisible();
    await expect(page.getByTestId('metric-card-avg-resolution-time')).toBeVisible();

    // 3. Drill-down: Click "Owned by Me" card
    await page.getByTestId('metric-card-my-assigned').click();
    await expect(page.getByTestId('queue-search-input')).toBeVisible();
    await expect(page.getByTestId('queue-owner-select')).toHaveValue('me');

    // 4. Return to Dashboard and drill-down into "Unassigned"
    await page.getByTestId('nav-staff-dashboard').click();
    await expect(page.getByTestId('staff-dashboard')).toBeVisible();

    await page.getByTestId('metric-card-unassigned').click();
    await expect(page.getByTestId('queue-search-input')).toBeVisible();
    await expect(page.getByTestId('queue-owner-select')).toHaveValue('unassigned');

    // 5. Return to Dashboard and drill-down into "Urgent / High"
    await page.getByTestId('nav-staff-dashboard').click();
    await expect(page.getByTestId('staff-dashboard')).toBeVisible();

    await page.getByTestId('metric-card-urgent-or-high').click();
    await expect(page.getByTestId('queue-search-input')).toBeVisible();
    await expect(page.getByTestId('queue-priority-select')).toHaveValue('URGENT,HIGH');

    // 6. Return to Dashboard and drill-down into "Resolved Today"
    await page.getByTestId('nav-staff-dashboard').click();
    await expect(page.getByTestId('staff-dashboard')).toBeVisible();

    await page.getByTestId('metric-card-resolved-today').click();
    await expect(page.getByTestId('queue-search-input')).toBeVisible();
    await expect(page.getByTestId('queue-status-select')).toHaveValue('RESOLVED');
  });
});
