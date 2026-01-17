import { test, expect } from './fixtures';

test.describe('Account Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Ensure we are on the dashboard
        await page.goto('/');
    });

    test('should allow creating a new account', async ({ page }) => {
        // 1. Navigate to Wallet and select Accounts tab
        await page.goto('/wallet');
        await page.getByRole('button', { name: 'Contas' }).click();
        
        // Wait for tab content and click 'Nova' or 'Adicionar Conta' (if empty)
        // Using 'Nova' which appears in the hero card
        await page.getByRole('button', { name: 'Nova', exact: true }).click();

        // 2. Fill Form
        await page.getByLabel('Nome da conta').fill('Conta E2E Teste');
        
        // Handling Currency Input might be tricky if it uses masking. 
        // Strategy: Click and type raw numbers or fill if standard input.
        await page.getByLabel('Saldo inicial').fill('100000'); // Check if mask divides by 100

        // Select Type
        // Assuming Select component
        // await page.getByRole('combobox').click(); 
        // await page.getByRole('option', { name: 'Conta Corrente' }).click();

        // 3. Save
        await page.getByRole('button', { name: 'Salvar' }).click();

        // 4. Verify
        await expect(page.getByText('Conta E2E Teste')).toBeVisible();
    });
});
