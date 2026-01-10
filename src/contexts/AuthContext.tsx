import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const setHouseholdId = useAppStore((s) => s.setHouseholdId);

  // Inicializa dados do utilizador (Household, etc) em background
  const initializeUserData = async (userId: string, email?: string) => {
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
      console.error('[Auth] Failed to initialize user data:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Timeout de Segurança (CRÍTICO: Destrava a tela após 3s se a rede falhar)
    const safetyTimeout = setTimeout(() => {
      if (mounted && state.isLoading) {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }, 3000);

    // 2. Verificar sessão inicial
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (mounted) {
          setState({
            user: session?.user ?? null,
            session: session,
            isLoading: false, // Libera a tela
            isAuthenticated: !!session,
          });

          if (session?.user) {
            initializeUserData(session.user.id, session.user.email);
          }
        }
      } catch (error) {
        console.error('[Auth] Error checking session:', error);
        // Mesmo com erro, liberamos a tela para o usuário tentar login novamente
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false }));
        }
      }
    };

    initSession();

    // 3. Escutar mudanças em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session,
      });

      if (event === 'SIGNED_IN' && session?.user) {
        initializeUserData(session.user.id, session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setHouseholdId(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [setHouseholdId]); // Dependências estáveis

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}