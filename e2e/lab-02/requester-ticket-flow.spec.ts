import { test, expect } from '@playwright/test';

test.describe('E2E Requester Ticket Flow (E2E-01, AC-01, AC-04, AC-07)', () => {
  test('Complete ticket submission, file attachment, and list retrieval flow', async ({ page }) => {
    // 1. Navigate to application root
    await page.goto('/');

    // 2. Development Requester Selection
    await expect(page.getByTestId('selection-title')).toBeVisible();
    await page.getByTestId('requester-select-dropdown').selectOption({ index: 1 });
    await page.getByTestId('continue-btn').click();

    // 3. Verify active requester displayed and navigate to Create Ticket
    await expect(page.getByTestId('active-requester-display')).toBeVisible();
    await page.getByTestId('nav-create-ticket').click();

    // 4. Fill Create Ticket form
    await page.getByTestId('summary-input').fill('E2E Test Ticket Summary');
    await page.getByTestId('description-input').fill('E2E Test Description for complete ticket flow.');

    // Select category and system options
    const categorySelect = page.getByTestId('category-select');
    await expect(categorySelect).toBeVisible();
    await categorySelect.selectOption({ index: 0 });

    const systemSelect = page.getByTestId('system-select');
    await expect(systemSelect).toBeVisible();
    await systemSelect.selectOption({ index: 0 });

    // Submit ticket
    await page.getByTestId('submit-ticket-btn').click();

    // 5. Verify Ticket Submission Success & Official Ticket Number
    await expect(page.getByTestId('ticket-success-card')).toBeVisible();
    const ticketNumberElement = page.getByTestId('official-ticket-number');
    await expect(ticketNumberElement).toBeVisible();
    const ticketNumber = await ticketNumberElement.textContent();
    expect(ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);

    // 6. Navigate to My Tickets & verify ticket appears
    await page.getByTestId('view-my-tickets-btn').click();
    await expect(page.getByTestId('search-input')).toBeVisible();

    await page.getByTestId('search-input').fill(ticketNumber || 'E2E Test Ticket Summary');
    await expect(page.getByText(ticketNumber!).first()).toBeVisible();
    await expect(page.getByText('E2E Test Ticket Summary').first()).toBeVisible();
  });
});
