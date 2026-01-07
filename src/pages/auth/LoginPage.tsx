import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks';
import { toast } from '@/hooks/useToast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth(); // Já não precisamos do navigate aqui

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      await signIn(data.email, data.password);
      // Sucesso!
      // NÃO navegamos manualmente. O App.tsx detetará a mudança de auth e redirecionará.
      toast({
        title: 'Sucesso',
        description: 'A entrar...',
        variant: 'success',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      toast({
        title: 'Erro no login',
        description: message,
        variant: 'destructive',
      });
      setIsSubmitting(false); // Paramos o loading apenas em caso de erro
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-2xl bg-primary mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/30 mb-4">
            F
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Bem-vindo de volta
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Entre na sua conta Finansix
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('email')}
              type="email"
              placeholder="Seu email"
              icon={<Mail className="h-5 w-5" />}
              error={errors.email?.message}
            />
          </div>

          <div className="relative">
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              icon={<Lock className="h-5 w-5" />}
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex justify-end">
            <Link
              to="/auth/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
            Entrar
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-50 dark:bg-slate-900 px-4 text-slate-400 font-medium">
              ou
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          Não tem uma conta?{' '}
          <Link to="/auth/register" className="font-semibold text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}