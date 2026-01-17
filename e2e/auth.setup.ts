import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Capture browser errors to debug White Screen of Death
  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`BROWSER ERROR: "${msg.text()}"`);
  });
  page.on('pageerror', err => {
    console.error(`BROWSER UNCAUGHT EXCEPTION: "${err.message}"`);
  });

  // Mock Supabase Auth
  await page.route('**/auth/v1/token?grant_type=password', async route => {
    const json = {
      access_token: 'fake-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'fake-refresh-token',
      user: {
        id: 'test-user-id',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    };
    await route.fulfill({ json });
  });

  await page.route('**/auth/v1/user', async route => {
    const json = {
      id: 'test-user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await route.fulfill({ json });
  });

  // Mock household/user data initialization to avoid "initializeUserData" errors
  await page.route('**/rest/v1/households*', async route => {
     await route.fulfill({ json: [{ id: 'test-household-id', name: 'Test Household' }] });
  });

  // -----------------------------------------------------------
  // Mocks matching fixtures.ts to ensure consistent environment
  // -----------------------------------------------------------
  
  // Mock Categories
  await page.route('**/rest/v1/categories*', async route => {
      await route.fulfill({ json: [
            { id: 1, name: 'Alimentação', icon: 'Utensils', type: 'expense', household_id: 'test-household-id' },
            { id: 2, name: 'Salário', icon: 'Wallet', type: 'income', household_id: 'test-household-id' }
      ]});
  });

  // Mock Accounts
  await page.route('**/rest/v1/accounts*', async route => {
      await route.fulfill({ json: [] });
  });

  // Mock Credit Cards
  await page.route('**/rest/v1/credit_cards*', async route => {
      await route.fulfill({ json: [] });
  });

   // Mock Transactions
  await page.route('**/rest/v1/transactions*', async route => {
      await route.fulfill({ json: [] });
  });
  
  // -----------------------------------------------------------

  // Perform authentication steps
  await page.goto('/login');
  
  // BEST PRACTICE: Wait for static page element before interacting to avoid flakiness
  await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible({ timeout: 20000 });

  // These credentials should be valid for the local/test environment
  // Uses placeholders as labels are not explicitly linked in the UI for test automation yet
  await page.getByPlaceholder('Seu email').fill('test@example.com');
  await page.getByPlaceholder('Sua senha').fill('password123');
  
  await page.getByRole('button', { name: 'Entrar' }).click();
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/*', { timeout: 15000 }); // Wait for any navigation
  // 'Home' text might be inside a transition or hidden momentarily, check for Main Header
  await expect(page.getByText('Finansix')).toBeVisible({ timeout: 15000 });

  // Save storage state to be used by other tests
  await page.context().storageState({ path: authFile });
});
