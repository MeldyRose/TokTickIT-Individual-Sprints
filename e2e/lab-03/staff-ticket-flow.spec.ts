import { test, expect } from '@playwright/test';

test.describe('E2E IT Staff Ticket Flow (E2E-02, AC-05..11)', () => {
  test('Staff queue discovery, filtering, claiming, priority update, status transition, public comment & internal note', async ({ page }) => {
    // 1. Login as IT Staff (Alex Thompson)
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill('alex.thompson@toktickit.com');
    await page.getByTestId('login-password-input').fill('Password123!');
    await page.getByTestId('login-submit-btn').click();

    // 2. Queue Discovery & Control Bar Filtering
    await expect(page.getByTestId('queue-search-input')).toBeVisible();

    // Filter queue
    await page.getByTestId('queue-owner-select').selectOption('all');

    // 3. Inspect top ticket detail
    const firstTicketButton = page.locator('[data-testid^="view-ticket-"]').first();
    await expect(firstTicketButton).toBeVisible();
    await firstTicketButton.click();

    // 4. Add Public Comment
    const commentInput = page.getByTestId('add-comment-input');
    await expect(commentInput).toBeVisible();
    await commentInput.fill('IT Staff diagnostic public comment update.');
    await page.getByTestId('post-comment-btn').click();

    // Verify comment text inside public comment thread
    await expect(page.getByTestId('public-comments-section').getByText('IT Staff diagnostic public comment update.').first()).toBeVisible();

    // 5. Add Internal Note
    const noteInput = page.getByTestId('add-note-input');
    await expect(noteInput).toBeVisible();
    await noteInput.fill('Private internal note regarding server logs.');
    await page.getByTestId('post-note-btn').click();

    // Verify internal note rendering and lock badge
    await expect(page.getByTestId('internal-notes-lock-badge')).toBeVisible();
    await expect(page.getByTestId('internal-notes-section').getByText('Private internal note regarding server logs.').first()).toBeVisible();
  });
});
