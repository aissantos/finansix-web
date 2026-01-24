import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

const verifySchema = z.object({
  code: z.string().length(6, 'O código deve ter 6 dígitos').regex(/^\d+$/, 'Apenas números'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function AdminVerify2FA() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  // Check valid session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
            navigate('/admin/auth/login');
        }
    });
  }, [navigate]);

  const onVerify = async (data: VerifyFormData) => {
    setIsLoading(true);

    try {
        // Get the challenge factors
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;
        
        const totpFactor = factors.all.find(f => f.factor_type === 'totp' && f.status === 'verified');
        if (!totpFactor) {
             throw new Error("Nenhum fator 2FA encontrado.");
        }

        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: totpFactor.id
        });
        if (challengeError) throw challengeError;

        const { error: verifyError } = await supabase.auth.mfa.verify({
            factorId: totpFactor.id,
            challengeId: challenge.id,
            code: data.code,
        });

        if (verifyError) throw verifyError;

        navigate('/admin/dashboard');

    } catch (err) {
      const error = err as Error;
      console.error('Verify error:', error);
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: error.message || "Código inválido.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      navigate('/admin/auth/login');
  }

  return (
    <Card className="w-full bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-500" />
            </div>
        </div>
        <CardTitle className="text-xl text-center text-white">Autenticação de Dois Fatores</CardTitle>
        <CardDescription className="text-center text-slate-400">
          Digite o código de 6 dígitos do seu autenticador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onVerify)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-200">Código</Label>
                <Input 
                  id="code" 
                  placeholder="000000" 
                  maxLength={6}
                  autoFocus
                  className="bg-slate-950/50 border-slate-700 text-slate-100 placeholder:text-slate-600 text-center text-lg tracking-widest"
                  {...register('code')}
                />
                {errors.code && <span className="text-xs text-red-500">{errors.code.message}</span>}
            </div>

            <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                    </>
                ) : (
                    'Confirmar'
                )}
            </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
            <Button variant="link" className="text-slate-500 text-xs" onClick={handleSignOut}>
                Cancelar e sair
            </Button>
      </CardFooter>
    </Card>
  );
}
