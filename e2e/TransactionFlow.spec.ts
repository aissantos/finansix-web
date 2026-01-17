import { test, expect } from '@playwright/test';

test.describe('Transaction Flow', () => {
    // Authenticate before each test (Mock or UI login?)
    // For now, assuming dev environment with easy login or mocking auth state.
    // Since we don't have auth state setup in this simple generic test, 
    // we will write it as a template that the user needs to adapt/run against a local server.

    test('should allow creating a new transaction', async ({ page }) => {
        // 1. Visit page (Login required usually)
        await page.goto('/');
        
        // Mock Auth or waiting for user to be logged in?
        // Ideally we use a reusable auth state.
        // For this task, we assume the user is logged in or we mock the auth cookie.

        // Placeholder for login flow
        // await page.getByPlaceholder('Email').fill('user@example.com');
        // await page.getByPlaceholder('Password').fill('password');
        // await page.getByRole('button', { name: 'Entrar' }).click();

        // 2. Open New Transaction Modal
        await page.getByRole('button', { name: 'Nova Transação' }).click();

        // 3. Fill Form
        await page.getByLabel('Valor').fill('150,00');
        await page.getByLabel('Descrição').fill('Teste E2E Playwright');
        
        // Select Category (assuming Select component usage)
        await page.getByRole('combobox', { name: 'Categoria' }).click();
        await page.getByRole('option', { name: 'Alimentação' }).click();

        // 4. Submit
        await page.getByRole('button', { name: 'Salvar' }).click();

        // 5. Verify
        await expect(page.getByText('Teste E2E Playwright')).toBeVisible();
        await expect(page.getByText('R$ 150,00')).toBeVisible();
    });
});
