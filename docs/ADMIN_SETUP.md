# Admin Dashboard Setup Guide

## 🔑 Service Role Key Configuration

The Admin Dashboard requires a **Supabase Service Role Key** to bypass Row Level Security (RLS) policies and perform privileged operations.

### Why Service Role Key?

- **Anon Key**: Subject to RLS policies, limited by user permissions
- **Service Role Key**: Bypasses RLS, full database access (required for admin operations)

### Setup Instructions

1. **Get Your Service Role Key**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to: `Project Settings` → `API`
   - Find the **service_role** key (marked as "secret")
   - Copy the key

2. **Add to .env.local**

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Restart Dev Server**

   ```bash
   # Stop current server (Ctrl+C)
   pnpm dev
   ```

4. **Verify**
   - Navigate to `/admin/users`
   - Search should now work correctly
   - All admin features should function properly

### ⚠️ Security Considerations

**IMPORTANT**: The service role key has **full database access**!

#### ✅ Safe Usage (Development)

- Local development environment
- `.env.local` file (gitignored)
- Protected admin routes with authentication
- Only accessible by super admins

#### ❌ Never Do This

- ❌ Commit service role key to Git
- ❌ Expose in client-side code in production
- ❌ Share publicly or in screenshots
- ❌ Use in public repositories

#### Production Deployment

For production, consider:

1. **Backend API**: Move admin operations to a secure backend
2. **Environment Variables**: Use secure secret management (Vercel, Railway, etc.)
3. **IP Whitelisting**: Restrict admin dashboard access
4. **Audit Logging**: Track all admin actions

### Troubleshooting

**Error: "Missing Supabase environment variables for admin client"**

- Solution: Add `VITE_SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

**Search returns "No users found" even with existing users**

- Cause: Using anon key instead of service role key
- Solution: Verify service role key is correctly set

**404/400 errors when filtering**

- Cause: RLS policies blocking queries
- Solution: Ensure service role key is being used

### Admin Features Requiring Service Role Key

- ✅ User Management (CRUD)
- ✅ Search & Filters
- ✅ User Statistics
- ✅ Impersonation
- ✅ Audit Logs
- ✅ System Metrics

---

## 📚 Additional Resources

- [Supabase Service Role Documentation](https://supabase.com/docs/guides/api/api-keys)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Admin Dashboard Architecture](./docs/PLANO_DE_ACAO_DASHBOARD_ADMIN.md)
