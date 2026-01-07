import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks';
import { toast } from '@/hooks/useToast';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, data.name);
      toast({
        title: 'Conta criada!',
        description: 'Verifique seu email para confirmar o cadastro.',
        variant: 'success',
      });
      navigate('/auth/login');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta';
      toast({
        title: 'Erro no cadastro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <img 
            src="/icons/icon-144x144.png" 
            alt="Finansix Logo" 
            className="h-20 w-20 mx-auto rounded-2xl shadow-lg shadow-primary/20 mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Criar conta
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Comece a organizar suas finanças
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('name')}
              type="text"
              placeholder="Seu nome"
              icon={<User className="h-5 w-5" />}
              error={errors.name?.message}
            />
          </div>

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
              placeholder="Criar senha"
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

          <div>
            <Input
              {...register('confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirmar senha"
              icon={<Lock className="h-5 w-5" />}
              error={errors.confirmPassword?.message}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            Criar conta
          </Button>
        </form>

        {/* Terms */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Ao criar uma conta, você concorda com nossos{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Política de Privacidade
          </Link>
        </p>

        {/* Sign in link */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Já tem uma conta?{' '}
          <Link to="/auth/login" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
