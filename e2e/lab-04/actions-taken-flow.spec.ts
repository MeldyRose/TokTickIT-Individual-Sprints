import { test, expect } from '@playwright/test';

test.describe('E2E Lab 4: Actions Taken Parent-Child Workflow (AC-01..04, AC-06..08)', () => {
  test('Staff adds action taken with follow-up validation, claims unassigned ticket, edits action, and Requester views read-only', async ({ page }) => {
    // 1. Login as IT Staff (Alex Thompson)
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    // 2. Navigate to ticket queue and locate unassigned ticket TKT-2026-0002
    await expect(page.getByTestId('nav-ticket-queue')).toBeVisible();
    await page.getByTestId('nav-ticket-queue').click();
    await expect(page.getByTestId('queue-search-input')).toBeVisible();

    await page.getByTestId('queue-search-input').fill('TKT-2026-0002');
    await page.waitForTimeout(500); // wait for search debounce
    const ticketRow = page.locator('[data-testid^="view-ticket-"]').first();
    await expect(ticketRow).toBeVisible();
    await ticketRow.click();

    // Verify ticket detail screen loaded
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();
    const logActionBtn = page.getByTestId('log-action-btn');
    await expect(logActionBtn).toBeVisible();

    // 3. Open Log Action Taken Modal
    await logActionBtn.click();
    await expect(page.getByTestId('action-taken-modal')).toBeVisible();

    // 4. Test Follow-Up Validation
    // Toggle follow-up required ON
    await page.getByTestId('follow-up-toggle').check();
    await expect(page.getByTestId('follow-up-note-input')).toBeVisible();

    // Fill valid description & result
    await page.getByTestId('action-description-input').fill('Investigated access point logs on Floor 3 for packet drop issues.');
    await page.getByTestId('action-result-input').fill('Identified high channel interference on 2.4 GHz band.');

    // Follow-up note is too short (< 5 chars), attempt submit to trigger validation
    await page.getByTestId('follow-up-note-input').fill('abc');
    await page.getByTestId('modal-submit-btn').click();
    await expect(page.getByTestId('follow-up-note-error')).toBeVisible();

    // 5. Fill valid follow-up note and claim ticket
    await page.getByTestId('follow-up-note-input').fill('Schedule channel frequency reallocation during maintenance window.');
    
    // Check Claim Ticket toggle if visible (unassigned ticket)
    const claimCheckbox = page.getByTestId('claim-ticket-checkbox');
    if (await claimCheckbox.isVisible()) {
      await claimCheckbox.check();
    }

    // Submit Action Taken
    await page.getByTestId('modal-submit-btn').click();
    await expect(page.getByTestId('action-taken-modal')).not.toBeVisible();

    // 6. Verify Action Taken in Timeline
    await expect(page.getByText('Investigated access point logs on Floor 3 for packet drop issues.').first()).toBeVisible();
    await expect(page.getByText('Identified high channel interference on 2.4 GHz band.').first()).toBeVisible();
    await expect(page.getByText('Schedule channel frequency reallocation during maintenance window.').first()).toBeVisible();
    await expect(page.getByText('Alex Thompson').first()).toBeVisible();

    // 7. Edit Action Taken
    const editBtn = page.locator('[data-testid^="edit-action-btn-"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await expect(page.getByTestId('action-taken-modal')).toBeVisible();

    // Update result
    await page.getByTestId('action-result-input').fill('Identified high channel interference on 2.4 GHz band (Re-tested and verified RSSI -72dBm).');
    await page.getByTestId('modal-submit-btn').click();
    await expect(page.getByTestId('action-taken-modal')).not.toBeVisible();
    await expect(page.getByText('Identified high channel interference on 2.4 GHz band (Re-tested and verified RSSI -72dBm).').first()).toBeVisible();

    // 8. Logout Staff
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await expect(page.getByTestId('login-page')).toBeVisible();

    // 9. Login as Requester (Michael Brown, owner of TKT-2026-0002)
    await page.getByTestId('login-email-input').fill('michael.b@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    // Navigate to My Tickets and view TKT-2026-0002
    await page.getByTestId('nav-my-tickets').click();
    await expect(page.getByTestId('search-input')).toBeVisible();
    await page.getByTestId('search-input').fill('TKT-2026-0002');
    await page.waitForTimeout(500); // wait for search debounce
    
    const requesterViewBtn = page.locator('[data-testid^="ticket-link-"]').first();
    await expect(requesterViewBtn).toBeVisible();
    await requesterViewBtn.click();

    // 10. Verify Requester Read-Only View of Actions Taken
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();
    await expect(page.getByText('Investigated access point logs on Floor 3 for packet drop issues.').first()).toBeVisible();
    await expect(page.getByText('Identified high channel interference on 2.4 GHz band (Re-tested and verified RSSI -72dBm).').first()).toBeVisible();

    // Verify staff mutation controls are hidden for Requesters
    await expect(page.getByTestId('log-action-btn')).not.toBeVisible();
    await expect(page.locator('[data-testid^="edit-action-btn-"]')).not.toBeVisible();
  });
});
