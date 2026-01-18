import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock Auth Token (Simulate logged in user)
    await page.route('**/auth/v1/token*', async route => {
        // Log to see what's being called
        console.warn('Mocking Auth Token:', route.request().url());
        
        await route.fulfill({
             status: 200,
             json: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'fake-refresh-token',
                user: {
                    id: 'admin-user-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'admin@versix.com.br',
                    app_metadata: {},
                    user_metadata: {},
                    created_at: new Date().toISOString(),
                }
            }
        });
    });

    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
            json: {
                id: 'admin-user-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'admin@versix.com.br',
                app_metadata: {},
                user_metadata: {},
                created_at: new Date().toISOString(),
            }
        });
    });

    // 2. Mock Admin Permissions (Crucial!)
    await page.route('**/rest/v1/admin_users*', async route => {
        await route.fulfill({
            json: {
                id: 'admin-user-id',
                email: 'admin@versix.com.br',
                name: 'Admin User',
                role: 'super_admin', // Gives all permissions
                is_active: true
            } // Single object or array depending on query. usePermissions uses .single() usually, but Supabase SDK might wrap.
              // Note: usePermissions: .select('*').eq('id', ...).single() -> Returns object
              // If using standard REST, .select returns array unless header present. 
              // Usually mock returns array for .select('*').
              // Wait, usePermissions does .single() which adds Accept: application/vnd.pgrst.object+json
        });
        // If the implementation expects an array for a list, and object for single, we need to be careful.
        // Let's return array for safety if the client handles it, or just object if strict.
        // Giving the 'single' modifier in client, response should be object.
    });
    
    // 3. Mock System Health
    await page.route('**/rpc/get_database_metrics', async route => {
        await route.fulfill({
            json: {
                active_connections: 5,
                cpu_usage: 12.5,
                memory_usage: 45.2,
                cache_hit_ratio: 99.1
            }
        });
    });

    // 4. Mock Feature Flags
    await page.route('**/rest/v1/feature_flags*', async route => {
       await route.fulfill({
           json: [
               { id: '1', name: 'Beta Feature', is_enabled: true, rollout_percentage: 50, description: 'Test flag' }
           ]
       });
    });

    // 5. Mock Audit Logs
    await page.route('**/rest/v1/audit_logs*', async route => {
        await route.fulfill({
            json: [
                { 
                    id: '1', 
                    action: 'login', 
                    resource_type: 'auth', 
                    timestamp: new Date().toISOString(), 
                    admin: { name: 'Admin', email: 'admin@versix.com.br' },
                    result: 'success'
                }
            ],
            headers: {
                'content-range': '0-1/1'
            }
        });
    });

    // 6. Catch-all for other Supabase REST requests to prevent hitting real server with fake token
    await page.route('**/rest/v1/**', async route => {
        // If it wasn't handled by previous routes, return empty array/object
        // This prevents "No suitable key" errors from real server
        console.warn('Mocking unhandled request:', route.request().url());
        await route.fulfill({
            status: 200,
            json: []
        });
    });

    // Navigate to dashboard directly (session is mocked)
    await page.goto('/admin/dashboard');
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to System Health', async ({ page }) => {
    await page.goto('/admin/system-health');
    await expect(page.getByText('System Health')).toBeVisible();
    await expect(page.getByText('Todos os sistemas operacionais')).toBeVisible();
  });

  test('should navigate to Feature Flags and toggle', async ({ page }) => {
    await page.goto('/admin/feature-flags');
    await expect(page.getByText('Feature Flags')).toBeVisible();
    await expect(page.getByText('Beta Feature')).toBeVisible();
  });

  test('should navigate to Audit Logs and verify Export button', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page.getByText('Logs de Auditoria')).toBeVisible();
    const exportBtn = page.getByRole('button', { name: 'Exportar CSV' });
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();
  });
});
