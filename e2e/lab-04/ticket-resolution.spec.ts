import { test, expect } from '@playwright/test';

test.describe('E2E Lab 4: Ticket Lifecycle & Resolution Gate Enforcement (AC-09..11, BR-10..15)', () => {
  test('Full lifecycle from creation -> in-progress -> requester advisory -> staff resolution gate enforcement -> resolution -> closure', async ({ page }) => {
    // 1. Requester logs in and creates a new ticket
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('michael.b@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    // Navigate to Create Ticket
    await expect(page.getByTestId('nav-create-ticket')).toBeVisible();
    await page.getByTestId('nav-create-ticket').click();
    await expect(page.getByTestId('summary-input')).toBeVisible();

    const uniqueSummary = `Display flickers constantly on Workstation ${Date.now()}`;
    await page.getByTestId('summary-input').fill(uniqueSummary);
    await page.getByTestId('description-input').fill('External HDMI display blinks black every few seconds during video rendering.');
    await page.getByTestId('category-select').selectOption({ label: 'Hardware' });
    await page.getByTestId('submit-ticket-btn').click();

    // Click "View My Tickets" on success card
    await expect(page.getByTestId('ticket-success-card')).toBeVisible();
    await page.getByTestId('view-my-tickets-btn').click();

    // Verify in My Tickets table
    await expect(page.getByText(uniqueSummary).first()).toBeVisible();

    // Logout Requester
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await expect(page.getByTestId('login-page')).toBeVisible();

    // 2. IT Staff logs in to handle the ticket
    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    // Go to Queue and find the new ticket
    await expect(page.getByTestId('nav-ticket-queue')).toBeVisible();
    await page.getByTestId('nav-ticket-queue').click();
    await page.getByTestId('queue-search-input').fill(uniqueSummary);
    await page.waitForTimeout(500); // wait for search debounce
    const staffTicketLink = page.locator('[data-testid^="view-ticket-"]').first();
    await expect(staffTicketLink).toBeVisible();
    await staffTicketLink.click();

    // Verify ticket is in NEW status
    await expect(page.getByTestId('ticket-workflow-controls')).toBeVisible();

    // Transition from NEW -> IN_PROGRESS
    const inProgressBtn = page.getByTestId('transition-to-in-progress');
    if (await inProgressBtn.isVisible()) {
      await inProgressBtn.click();
    } else {
      await page.getByTestId('status-transition-select').selectOption('IN_PROGRESS');
      await page.getByTestId('apply-status-transition-btn').click();
    }
    await expect(page.getByText('IN_PROGRESS').first()).toBeVisible();

    // Logout Staff
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await expect(page.getByTestId('login-page')).toBeVisible();

    // 3. Requester triggers "Problem Appears Resolved" advisory
    await page.getByTestId('login-email-input').fill('michael.b@example.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    await page.getByTestId('nav-my-tickets').click();
    await page.getByTestId('search-input').fill(uniqueSummary);
    await page.waitForTimeout(500); // wait for search debounce
    await page.locator('[data-testid^="ticket-link-"]').first().click();

    const problemResolvedBtn = page.getByTestId('problem-resolved-btn');
    await expect(problemResolvedBtn).toBeVisible();
    await problemResolvedBtn.click();

    await expect(page.getByTestId('problem-resolved-modal')).toBeVisible();
    await page.getByTestId('resolution-note-input').fill('Display seems stable after I swapped the HDMI cable.');
    await page.getByTestId('confirm-resolved-btn').click();

    // Status transitions to WAITING_FOR_REQUESTER
    await expect(page.getByText('WAITING_FOR_REQUESTER').first()).toBeVisible();

    // Logout Requester
    await page.getByTestId('profile-dropdown').click();
    await page.getByTestId('logout-btn').click();
    await expect(page.getByTestId('login-page')).toBeVisible();

    // 4. IT Staff logs in, sees advisory indicator, and verifies Resolution Gate enforcement
    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    await page.getByTestId('nav-ticket-queue').click();
    await page.getByTestId('queue-search-input').fill(uniqueSummary);
    await page.waitForTimeout(500); // wait for search debounce
    await page.locator('[data-testid^="view-ticket-"]').first().click();

    // Staff sees Requester Feedback / Advisory Indicator
    await expect(page.getByTestId('workflow-advisory-indicator')).toBeVisible();

    // Attempt to resolve ticket directly without any Action Taken recorded
    const resolveBtn = page.getByTestId('transition-to-resolved');
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();
    } else {
      await page.getByTestId('status-transition-select').selectOption('RESOLVED');
      await page.getByTestId('apply-status-transition-btn').click();
    }

    // Resolution Gate Modal should open with live checklist
    await expect(page.getByTestId('resolve-modal')).toBeVisible();
    await expect(page.getByTestId('resolution-gate-checklist')).toBeVisible();

    // Gate Checklist should show Actions Taken requirement unsatisfied
    const actionsChecklist = page.getByTestId('gate-criterion-actions');
    await expect(actionsChecklist).toBeVisible();
    await expect(actionsChecklist.getByText('No Actions Taken logged')).toBeVisible();

    // Confirm button is disabled
    await expect(page.getByTestId('confirm-resolve-btn')).toBeDisabled();

    // Cancel modal to log required Action Taken
    await page.getByTestId('cancel-resolve-btn').first().click();
    await expect(page.getByTestId('resolve-modal')).not.toBeVisible();

    // 5. Log mandatory Action Taken
    await page.getByTestId('log-action-btn').click();
    await page.getByTestId('action-description-input').fill('Inspected display adapter and replaced temporary HDMI cable with certified DisplayPort cable.');
    await page.getByTestId('action-result-input').fill('Screen flickering ceased; verified 4K resolution at 60Hz.');
    await page.getByTestId('modal-submit-btn').click();
    await expect(page.getByTestId('action-taken-modal')).not.toBeVisible();

    // 6. Re-attempt Resolution with Action Taken recorded
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();
    } else {
      await page.getByTestId('status-transition-select').selectOption('RESOLVED');
      await page.getByTestId('apply-status-transition-btn').click();
    }

    await expect(page.getByTestId('resolve-modal')).toBeVisible();
    // Now Actions Taken criterion is satisfied
    await expect(actionsChecklist.locator('.text-success').first()).toBeVisible();

    // Summary criterion is still unsatisfied (< 10 chars)
    await page.getByTestId('resolution-summary-input').fill('Fixed it');
    await expect(page.getByTestId('confirm-resolve-btn')).toBeDisabled();

    // Supply full resolution summary >= 10 chars
    await page.getByTestId('resolution-summary-input').fill('Replaced faulty HDMI cable with certified DisplayPort cable and verified GPU firmware.');
    await expect(page.getByTestId('gate-criterion-summary').locator('.text-success').first()).toBeVisible();
    await expect(page.getByTestId('confirm-resolve-btn')).toBeEnabled();

    // Submit formal resolution
    await page.getByTestId('confirm-resolve-btn').click();
    await expect(page.getByTestId('resolve-modal')).not.toBeVisible();

    // Verify ticket is in RESOLVED status and displays resolution summary
    await expect(page.getByText('RESOLVED').first()).toBeVisible();
    await expect(page.getByText('Replaced faulty HDMI cable with certified DisplayPort cable and verified GPU firmware.').first()).toBeVisible();

    // 7. Transition ticket to CLOSED
    const closeBtn = page.getByTestId('transition-to-closed');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.getByTestId('status-transition-select').selectOption('CLOSED');
      await page.getByTestId('apply-status-transition-btn').click();
    }

    await expect(page.getByTestId('close-ticket-modal')).toBeVisible();
    await page.getByTestId('close-notes-input').fill('Requester confirmed display functionality; closing ticket.');
    await page.getByTestId('confirm-close-btn').click();
    await expect(page.getByTestId('close-ticket-modal')).not.toBeVisible();

    // Verify terminal status notice
    await expect(page.getByTestId('terminal-status-notice')).toBeVisible();
    await expect(page.getByText('CLOSED').first()).toBeVisible();
  });
});
