import { test as base, expect } from '@playwright/test';

// Extend base test with our mocks
export const test = base.extend({
  page: async ({ page }, use) => {
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
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: {},
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

    // Mock household/user data
    await page.route('**/rest/v1/households*', async route => {
       await route.fulfill({ json: [{ id: 'test-household-id', name: 'Minha Casa', currency: 'BRL' }] });
    });

    // Mock Categories (for CategoryFlow)
    await page.route('**/rest/v1/categories*', async route => {
        await route.fulfill({ json: [
            { id: 1, name: 'Alimentação', icon: 'Utensils', type: 'expense', household_id: 'test-household-id' },
            { id: 2, name: 'Salário', icon: 'Wallet', type: 'income', household_id: 'test-household-id' }
        ]});
    });

    // Mock Accounts (for AccountFlow)
    await page.route('**/rest/v1/accounts*', async route => {
        // If POST (create), return created item
        if (route.request().method() === 'POST') {
             await route.fulfill({ status: 201, json: [{ id: 'new-acc', name: 'Conta E2E Teste', balance: 1000 }] });
        } else {
             // GET list
             await route.fulfill({ json: [] });
        }
    });

     // Mock Transactions (for TransactionFlow)
     await page.route('**/rest/v1/transactions*', async route => {
        if (route.request().method() === 'POST') {
             await route.fulfill({ status: 201, json: [{ id: 'new-tx', description: 'Teste E2E Playwright', amount: 150 }] });
        } else {
             await route.fulfill({ json: [] });
        }
    });

    // Mock Credit Cards (for CreditCardFlow)
    await page.route('**/rest/v1/credit_cards*', async route => {
        if (route.request().method() === 'POST') {
             await route.fulfill({ status: 201, json: [{ id: 'new-card', name: 'Cartão Teste', limit: 5000 }] });
        } else {
             await route.fulfill({ json: [] });
        }
    });
    
    // Catch-all for other Supabase REST requests to prevent 401s (e.g. household_members, rpc)
    await page.route('**/rest/v1/*', async route => {
        // Only fulfill if not handled by above routes (Playwright routes are LIFO?) 
        // Actually Playwright routes handling order: newest handler first.
        // So I should put catch-all at the TOP or rely on it only if others don't match?
        // Wait, "Handlers are matched in the order they are added" -> First registered acts first? 
        // Docs: "If multiple handlers match, the one added LAST is used." (LIFO)
        // So if I add this LAST, it will shadow others?
        // No, I want this to be the FALLBACK. So it should be added FIRST?
        // Actually, specific patterns match first usually? No, it's order based.
        
        // Strategy: Add specific mocks LATER in the file (mocks extending base).
        // BUT here I am adding them all in one block.
        // The previous ones (accounts, categories) are added BEFORE this one.
        // So this one (added LAST) will take precedence if it matches `**/rest/v1/*`.
        // Since `**/rest/v1/accounts*` matches `**/rest/v1/*`, this catch-all WILL intercept everything if added last.
        // WRONG.
        
        // I should stick to adding specific endpoints.
        // Missing: household_members.
         await route.fallback();
    });

    await page.route('**/rest/v1/household_members*', async route => {
        await route.fulfill({ json: [{ user_id: 'test-user-id', household_id: 'test-household-id', role: 'owner' }] });
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect };
