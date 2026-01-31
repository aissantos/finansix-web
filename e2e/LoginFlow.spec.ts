import { test, expect } from './fixtures';

test.describe('Login Flow', () => {
    // Reset storage state for this test to ensure clean login
    test.use({ storageState: { cookies: [], origins: [] } });



    test('should show error with invalid credentials', async ({ page }) => {
        // Mock Auth Failure
        await page.route('**/auth/v1/token?grant_type=password', async route => {
            await route.fulfill({
                status: 400,
                json: { error: 'invalid_grant', error_description: 'Invalid login credentials' }
            });
        });

        await page.goto('/login');
        
        await page.getByPlaceholder('Seu email').fill('wrong@example.com');
        await page.getByPlaceholder('Sua senha').fill('wrongpassword');
        await page.getByRole('button', { name: 'Entrar' }).click();

        await expect(page.getByText('Invalid login credentials')).toBeVisible();
    });

    test('should redirect to dashboard on successful login', async ({ page }) => {
        // Fixtures already provide success mocks for Auth, User, and Dashboard Data!

        await page.goto('/login');
        
        await page.getByPlaceholder('Seu email').fill('success@example.com');
        await page.getByPlaceholder('Sua senha').fill('password');
        await page.getByRole('button', { name: 'Entrar' }).click();

        await expect(page).toHaveURL('/');
        // Verify dashboard content
        await expect(page.getByText('Finansix')).toBeVisible(); 
    });
});
