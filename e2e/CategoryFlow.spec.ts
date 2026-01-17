import { test, expect } from './fixtures';

test.describe('Category Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Authenticated via global setup
        await page.goto('/categories');
    });

    test('should display categories details', async ({ page }) => {
        // Verify page header
        await expect(page.getByRole('heading', { name: 'Categorias' })).toBeVisible();

        // Verify "Alimentação" exists (from default seed/mock)
        await expect(page.getByText('Alimentação')).toBeVisible();
        
        // Verify list container exists
        await expect(page.getByRole('list')).toBeVisible();
    });
});
