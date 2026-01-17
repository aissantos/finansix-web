import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should allow user to login and logout', async ({ page }) => {
        // 1. Visit Login Page
        await page.goto('/login');

        // 2. Fill Credentials (Mock/Test User)
        // Adjust selectors matching your actual login form
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Senha').fill('password123');

        // 3. Submit
        await page.getByRole('button', { name: 'Entrar' }).click();

        // 4. Verify Redirect to Dashboard
        await expect(page).toHaveURL('/');
        await expect(page.getByText('Minha Casa')).toBeVisible();

        // 5. Logout
        await page.getByRole('button', { name: 'Perfil' }).click(); // User menu
        await page.getByRole('menuitem', { name: 'Sair' }).click();

        // 6. Verify Redirect to Login
        await expect(page).toHaveURL('/login');
    });
});
