/**
 * Create Super Admin User
 * 
 * This script creates a definitive Super Admin user using Supabase Admin API
 * 
 * User Details:
 * - Name: Versix Solutions
 * - Email: versixsolutions@gmail.com
 * - Password: @Versix$$2025#
 * - Role: super_admin
 * 
 * Run with: node supabase/scripts/create-super-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  console.log('🚀 Creating Super Admin user...\n');

  try {
    // Step 1: Create user in Supabase Auth
    console.log('📝 Step 1: Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'versixsolutions@gmail.com',
      password: '@Versix$$2025#',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: 'Versix Solutions'
      }
    });

    if (authError) {
      throw new Error(`Auth creation failed: ${authError.message}`);
    }

    console.log(`✅ User created in auth.users`);
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}\n`);

    // Step 2: Insert into admin_users table
    console.log('📝 Step 2: Adding to admin_users table...');
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: authData.user.id,
        email: 'versixsolutions@gmail.com',
        name: 'Versix Solutions',
        role: 'super_admin',
        is_active: true
      });

    if (adminError) {
      throw new Error(`Admin user insertion failed: ${adminError.message}`);
    }

    console.log(`✅ Added to admin_users table\n`);

    // Step 3: Log in audit_logs
    console.log('📝 Step 3: Creating audit log entry...');
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        admin_id: authData.user.id,
        action: 'admin_user_created',
        resource_type: 'admin_users',
        resource_id: authData.user.id,
        result: 'success',
        metadata: {
          email: 'versixsolutions@gmail.com',
          name: 'Versix Solutions',
          role: 'super_admin',
          created_by: 'system',
          creation_method: 'admin_script'
        }
      });

    if (auditError) {
      console.warn(`⚠️  Audit log creation failed: ${auditError.message}`);
    } else {
      console.log(`✅ Audit log created\n`);
    }

    // Success summary
    console.log('═'.repeat(60));
    console.log('🎉 SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log('\n📋 Login Credentials:');
    console.log(`   Email:    versixsolutions@gmail.com`);
    console.log(`   Password: @Versix$$2025#`);
    console.log(`   Role:     super_admin`);
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('   1. After first login, you will be prompted to setup 2FA (TOTP)');
    console.log('   2. Keep your 2FA backup codes in a safe place');
    console.log('   3. This account has full administrative privileges');
    console.log('\n🔗 Login URL: http://localhost:3000/admin/auth/login');
    console.log('═'.repeat(60));
    console.log('\n✅ Script completed successfully!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
    console.error('   2. Verify Supabase project is accessible');
    console.error('   3. Check if admin_users table exists');
    console.error('   4. Ensure RLS policies allow service role access\n');
    process.exit(1);
  }
}

// Run the script
createSuperAdmin();
