import { useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, getOrCreateHousehold } from '@/lib/supabase';
import { useAppStore } from '@/stores';
import { seedDefaultCategories } from '@/lib/supabase/categories';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Removemos o useNavigate daqui! O hook não deve navegar.
  const setHouseholdId = useAppStore((s) => s.setHouseholdId);

  const initializeUserHousehold = useCallback(async (userId: string, email?: string) => {
    try {
      const name = email?.split('@')[0];
      const householdId = await getOrCreateHousehold(userId, name);
      setHouseholdId(householdId);

      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('household_id', householdId)
        .limit(1);

      if (!categories?.length) {
        await seedDefaultCategories(householdId);
      }
    } catch (error) {
      console.error('[Auth] Failed to initialize household:', error);
    }
  }, [setHouseholdId]);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setState({
            user: data.session?.user ?? null,
            session: data.session,
            isLoading: false,
            isAuthenticated: !!data.session,
          });

          if (data.session?.user) {
            initializeUserHousehold(data.session.user.id, data.session.user.email);
          }
        }
      } catch (error) {
        console.error('[Auth] Erro inicial:', error);
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
        }
      }
    };

    // Timeout de segurança (3s) para não travar a tela de loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && state.isLoading) {
        console.warn('[Auth] Timeout. Forçando exibição.');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }, 3000);

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
          isAuthenticated: !!session,
        });

        // Apenas tarefas de background. SEM navigate aqui.
        if (event === 'SIGNED_IN' && session?.user) {
          initializeUserHousehold(session.user.id, session.user.email);
        }

        if (event === 'SIGNED_OUT') {
          setHouseholdId(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [setHouseholdId, initializeUserHousehold]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  }, []);

  return { ...state, signIn, signUp, signOut, resetPassword };
}