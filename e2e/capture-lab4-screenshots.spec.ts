import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_SCREENSHOT_DIR = path.resolve(process.cwd(), 'artifacts/lab-04/screenshots');
const STAFF_DIR = path.join(BASE_SCREENSHOT_DIR, 'staff-dashboard');
const REQ_DIR = path.join(BASE_SCREENSHOT_DIR, 'requester-dashboard');
const ACTIONS_DIR = path.join(BASE_SCREENSHOT_DIR, 'actions-taken');

test.beforeAll(() => {
  for (const dir of [STAFF_DIR, REQ_DIR, ACTIONS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
});

test.describe('Capture Complete Lab 4 Submission Evidence & Visual Inspection', () => {
  
  test('Capture Staff Dashboard Visual Evidence across Breakpoints', async ({ page }) => {
    // 1. Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    await expect(page.getByTestId('staff-dashboard')).toBeVisible();
    await page.waitForTimeout(500);

    // Verify no horizontal overflow
    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(desktopOverflow).toBe(false);

    await page.screenshot({ path: path.join(STAFF_DIR, '01-staff-dashboard-desktop.png') });

    // Focus ring evidence on metric card
    await page.getByTestId('metric-card-total-open').focus();
    await page.screenshot({ path: path.join(STAFF_DIR, '04-staff-dashboard-focus-ring.png') });

    // Drilldown navigation evidence
    await page.getByTestId('metric-card-my-assigned').click();
    await expect(page.getByTestId('queue-search-input')).toBeVisible();
    await page.screenshot({ path: path.join(STAFF_DIR, '05-staff-dashboard-drilldown-queue.png') });

    // 2. Tablet Viewport (820x1180)
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.getByTestId('nav-staff-dashboard').click();
    await expect(page.getByTestId('staff-dashboard')).toBeVisible();
    await page.waitForTimeout(500);

    const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(tabletOverflow).toBe(false);
    await page.screenshot({ path: path.join(STAFF_DIR, '02-staff-dashboard-tablet.png') });

    // 3. Mobile Viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(mobileOverflow).toBe(false);
    await page.screenshot({ path: path.join(STAFF_DIR, '03-staff-dashboard-mobile.png') });
  });

  test('Capture Requester Dashboard Visual Evidence across Breakpoints', async ({ page }) => {
    // 1. Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('michael.b@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    await page.getByTestId('nav-requester-dashboard').click();
    await expect(page.getByTestId('requester-dashboard')).toBeVisible();
    await page.waitForTimeout(500);

    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(desktopOverflow).toBe(false);
    await page.screenshot({ path: path.join(REQ_DIR, '01-requester-dashboard-desktop.png') });

    // Banner and drill-down evidence
    await page.getByTestId('metric-card-waiting-input').click();
    await expect(page.getByTestId('desktop-table-view')).toBeVisible();
    await page.screenshot({ path: path.join(REQ_DIR, '05-requester-dashboard-drilldown-mytickets.png') });

    // 2. Tablet Viewport (820x1180)
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.getByTestId('nav-requester-dashboard').click();
    await expect(page.getByTestId('requester-dashboard')).toBeVisible();
    await page.waitForTimeout(500);

    const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(tabletOverflow).toBe(false);
    await page.screenshot({ path: path.join(REQ_DIR, '02-requester-dashboard-tablet.png') });

    // 3. Mobile Viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(mobileOverflow).toBe(false);
    await page.screenshot({ path: path.join(REQ_DIR, '03-requester-dashboard-mobile.png') });
  });

  test('Capture Actions Taken and Resolution Gate Visual Evidence', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Staff Views Actions Taken on Ticket
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    await page.getByTestId('nav-ticket-queue').click();
    await page.getByTestId('queue-search-input').fill('TKT-2026-0001');
    await page.waitForTimeout(500);
    const ticketLink = page.locator('[data-testid^="view-ticket-"]').first();
    await expect(ticketLink).toBeVisible();
    await ticketLink.click();

    await expect(page.getByTestId('actions-taken-section')).toBeVisible();
    await page.screenshot({ path: path.join(ACTIONS_DIR, '01-actions-feed-staff-desktop.png') });

    // 2. Open Log Action Modal (Empty & Validation)
    const logActionBtn = page.getByTestId('log-action-btn');
    await expect(logActionBtn).toBeVisible();
    await logActionBtn.click();
    await expect(page.getByTestId('action-taken-modal')).toBeVisible();
    await page.screenshot({ path: path.join(ACTIONS_DIR, '03-log-action-modal-empty.png') });

    // Trigger follow-up validation error
    await page.getByTestId('follow-up-toggle').check();
    await page.getByTestId('action-description-input').fill('Conducted diagnostic packet traces on core interface.');
    await page.getByTestId('action-result-input').fill('Confirmed 0.5% packet drop.');
    await page.getByTestId('follow-up-note-input').fill('bad');
    await page.screenshot({ path: path.join(ACTIONS_DIR, '04-log-action-modal-followup-validation.png') });

    // Close Action Taken modal
    await page.getByTestId('modal-cancel-btn').click();

    // 3. Open Resolution Gate Modal (Blocked Checklist)
    const resolveBtn = page.getByTestId('transition-to-resolved');
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();
    } else {
      await page.getByTestId('status-transition-select').selectOption('RESOLVED');
      await page.getByTestId('apply-status-transition-btn').click();
    }
    await expect(page.getByTestId('resolve-modal')).toBeVisible();
    await page.screenshot({ path: path.join(ACTIONS_DIR, '06-resolution-gate-checklist-blocked.png') });

    // Satisfy resolution summary
    await page.getByTestId('resolution-summary-input').fill('Configured QoS priority queuing on voice and video traffic to eliminate buffer bloat.');
    await page.screenshot({ path: path.join(ACTIONS_DIR, '07-resolution-gate-checklist-satisfied.png') });

    await page.getByTestId('cancel-resolve-btn').first().click();

    // 4. Requester Views Actions Taken Read-Only
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();

    await page.getByTestId('login-email-input').fill('michael.b@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    await page.getByTestId('nav-my-tickets').click();
    await page.getByTestId('search-input').fill('TKT-2026-0002');
    await page.waitForTimeout(500);
    await page.locator('[data-testid^="ticket-link-"]').first().click();

    await expect(page.getByTestId('actions-taken-section')).toBeVisible();
    await page.screenshot({ path: path.join(ACTIONS_DIR, '02-actions-feed-requester-readonly.png') });
  });
});
