import { test, expect } from '@playwright/test';

test.describe('Credit Card Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Assume authenticated for this test group
        // If we had a global setup we wouldn't need this login step every time
        await page.goto('/login');
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Senha').fill('password123');
        await page.getByRole('button', { name: 'Entrar' }).click();
        await expect(page).toHaveURL('/');
    });

    test('should view credit card details and invoices', async ({ page }) => {
        // 1. Navigate to Credit Cards
        await page.getByRole('link', { name: 'Cartões' }).click();

        // 2. Select a Card
        await page.getByText('Visa').first().click();

        // 3. Verify Invoice Details
        await expect(page.getByText('Fatura Atual')).toBeVisible();
        
        // 4. Check Installments Tab
        await page.getByRole('tab', { name: 'Parcelas' }).click();
        await expect(page.getByRole('tabpanel', { name: 'Parcelas' })).toBeVisible();
    });
});
