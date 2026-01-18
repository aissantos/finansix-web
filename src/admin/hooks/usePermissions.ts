import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';

export type AdminRole = 'super_admin' | 'admin' | 'support' | 'analyst';

export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: ['super_admin', 'admin', 'support', 'analyst'],
  
  // Users
  VIEW_USERS: ['super_admin', 'admin', 'support', 'analyst'],
  EDIT_USERS: ['super_admin', 'admin'],
  DELETE_USERS: ['super_admin', 'admin'],
  IMPERSONATE_USERS: ['super_admin', 'admin'],
  
  // System
  VIEW_SYSTEM_HEALTH: ['super_admin', 'admin', 'support'],
  APPLY_MIGRATIONS: ['super_admin'],
  MANAGE_FEATURE_FLAGS: ['super_admin', 'admin'],
  
  // Security
  VIEW_AUDIT_LOG: ['super_admin', 'admin', 'support'],
  MANAGE_ADMINS: ['super_admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
}

export function usePermissions() {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function fetchAdminUser() {
            try {
                const { data: { user: authUser } } = await supabaseAdmin.auth.getUser();
                
                if (!authUser) {
                    if (mounted) {
                        setUser(null);
                        setLoading(false);
                    }
                    return;
                }

                const { data, error } = await supabaseAdmin
                    .from('admin_users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (error || !data) {
                    // Fallback to email lookup just in case (as in Login)
                    const { data: dataByEmail } = await supabaseAdmin
                        .from('admin_users')
                        .select('*')
                        .eq('email', authUser.email || '')
                        .single();
                        
                     if (mounted && dataByEmail) {
                        setUser({
                            ...dataByEmail,
                            role: dataByEmail.role as AdminRole // Cast string to AdminRole
                        });
                     } else if (mounted) {
                        setUser(null);
                     }
                } else {
                     if (mounted && data) {
                        setUser({
                            ...data,
                            role: data.role as AdminRole // Cast string to AdminRole
                        });
                     }
                }

            } catch (error) {
                console.error('Error fetching permissions:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchAdminUser();

        const { data: { subscription } } = supabaseAdmin.auth.onAuthStateChange(async (event) => {
             if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                 fetchAdminUser();
             }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const can = (permission: Permission): boolean => {
        if (!user) return false;
        // @ts-expect-error - TS sometimes struggles with const objects as index
        return PERMISSIONS[permission]?.includes(user.role) ?? false;
    };

    return {
        user,
        loading,
        can,
        role: user?.role
    };
}
