import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const navigate = useNavigate();
  const setHouseholdId = useAppStore((s) => s.setHouseholdId);

  const initializeUserHousehold = useCallback(async (userId: string, email?: string) => {
    try {
      const name = email?.split('@')[0];
      const householdId = await getOrCreateHousehold(userId, name);
      setHouseholdId(householdId);

      // Check if categories exist, if not seed them
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('household_id', householdId)
        .limit(1);

      if (!categories?.length) {
        await seedDefaultCategories(householdId);
      }
    } catch (error) {
      console.error('Failed to initialize household:', error);
    }
  }, [setHouseholdId]);

  useEffect(() => {
    let mounted = true;

    // Função segura para buscar sessão inicial
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (mounted) {
          setState({
            user: data.session?.user ?? null,
            session: data.session,
            isLoading: false, // Libera o loading mesmo se não tiver sessão
            isAuthenticated: !!data.session,
          });

          if (data.session?.user) {
            initializeUserHousehold(data.session.user.id, data.session.user.email);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        // Garante que o loading termina mesmo com erro
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setState({
            user: session?.user ?? null,
            session,
            isLoading: false,
            isAuthenticated: !!session,
          });

          if (event === 'SIGNED_IN' && session?.user) {
            await initializeUserHousehold(session.user.id, session.user.email);
            navigate('/');
          }

          if (event === 'SIGNED_OUT') {
            setHouseholdId(null);
            navigate('/auth/login');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, setHouseholdId, initializeUserHousehold]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
        },
      });
      if (error) throw error;
    },
    []
  );

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

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}