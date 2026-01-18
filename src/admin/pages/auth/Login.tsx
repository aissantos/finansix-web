import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';

// Validation Schema
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      if (!authData.user) throw new Error('Falha na autenticação');

      // 2. Check if user exists in admin_users table (RBAC)
      console.warn('🔍 Checking admin_users for user ID:', authData.user.id);
      const { data: adminUser, error: adminError } = await supabaseAdmin
        .from('admin_users')
        .select('id, role, name, is_active')
        .eq('id', authData.user.id) // Assuming admin_users ID matches auth.users ID
        .single();
    
      console.warn('📊 Admin user query result:', { adminUser, adminError });
      
      // Note: If admins are manually added to admin_users but sign up via auth, 
      // we might need to match by email first if IDs don't match initially.
      // For this implementation, we assume a Trigger or explicit creation synced IDs.
      // If the query fails, we try by email as fallback verification.
      
      if (adminError || !adminUser) {
        console.warn('⚠️  First query failed, trying email fallback...');
        // Fallback: check by email if ID lookup failed (e.g. if manual entry didn't use same UUID)
        const { data: adminByEmail, error: emailError } = await supabaseAdmin
             .from('admin_users')
             .select('id, role, is_active')
             .eq('email', data.email)
             .single();
             
        console.warn('📧 Email fallback result:', { adminByEmail, emailError });
             
        if (!adminByEmail) {
            await supabaseAdmin.auth.signOut();
            throw new Error('Acesso não autorizado. Este usuário não é um administrador.');
        }
        
        if (!adminByEmail.is_active) {
            await supabaseAdmin.auth.signOut();
            throw new Error('Conta de administrador desativada.');
        }
      } else if (!adminUser.is_active) {
         await supabaseAdmin.auth.signOut();
         throw new Error('Conta de administrador desativada.');
      }

      // 3. Check MFA Requirements
      const { data: mfaFactors } = await supabaseAdmin.auth.mfa.listFactors();
      const hasVerifiedTOTP = mfaFactors?.all?.some(f => f.factor_type === 'totp' && f.status === 'verified');

      if (hasVerifiedTOTP) {
          // If setup, must verify
          const { data: aal } = await supabaseAdmin.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aal && aal.currentLevel !== 'aal2') {
               navigate('/admin/auth/verify-2fa');
               return;
          }
      } else {
          // If not setup, enforce setup
          navigate('/admin/auth/setup-2fa');
          return;
      }

      // Success
      toast({
        title: "Login realizado",
        description: "Bem-vindo ao painel administrativo.",
      });
      
      navigate('/admin/dashboard');

    } catch (err) {
      const error = err as Error;
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message || "Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center text-white">Login</CardTitle>
        <CardDescription className="text-center text-slate-400">
          Entre com suas credenciais de super admin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">Email</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@versix.com.br"
                  className="pl-9 bg-slate-950/50 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                  {...register('email')}
                />
            </div>
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">Senha</Label>
            <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-9 bg-slate-950/50 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-blue-500"
                  {...register('password')}
                />
            </div>
            {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all mt-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
