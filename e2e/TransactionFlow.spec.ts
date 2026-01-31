import { test, expect } from './fixtures';

test.describe('Transaction Flow', () => {


    test('should allow creating a new transaction', async ({ page }) => {
        // 1. Visit page (Authenticated via setup)
        await page.goto('/');
        
        // 2. Open New Transaction Modal
        await page.getByRole('button', { name: 'Nova Transação' }).click();

        // 3. Fill Form
        await page.getByLabel('Valor').fill('150,00');
        await page.getByLabel('Descrição').fill('Teste E2E Playwright');
        
        // Select Category
        // Note: The Shadcn Select component implementation details matter here.
        // Usually clicking the trigger opens the content.
        await page.locator('button[role="combobox"]').first().click();
        await page.getByRole('option', { name: 'Alimentação' }).click();

        // 4. Submit
        await page.getByRole('button', { name: 'Salvar' }).click();

        // 5. Verify
        // Since we mock the POST but not the subsequent GET refetch (it returns empty []),
        // the UI might not show the new item unless we update the GET mock to return it.
        // OR if we rely on Optimistic Updates (which we do in useCreateTransaction).
        await expect(page.getByText('Teste E2E Playwright')).toBeVisible();
        await expect(page.getByText('R$ 150,00')).toBeVisible();
    });
});
