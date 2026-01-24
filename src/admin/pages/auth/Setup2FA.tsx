import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import QRCode from 'qrcode';
import { Loader2, ShieldCheck, Copy, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';

const verifySchema = z.object({
  code: z.string().length(6, 'O código deve ter 6 dígitos').regex(/^\d+$/, 'Apenas números'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function AdminSetup2FA() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  useEffect(() => {
    const enroll = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/admin/auth/login');
            return;
        }

        // Check if already enrolled
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const existing = factors?.all?.find(f => f.factor_type === 'totp' && f.status === 'verified');
        if (existing) {
            navigate('/admin');
            return;
        }

        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'Finansix Admin', // Nice label in Auth app
          friendlyName: user.email || 'Admin',
        });

        if (error) throw error;

        setFactorId(data.id);
        setSecret(data.totp.secret);

        // Generate QR Code
        const url = await QRCode.toDataURL(data.totp.uri);
        setQrCodeUrl(url);
      } catch (err) {
        const error = err as Error;
        console.error('Enrollment error:', error);
        toast({
          variant: "destructive",
          title: "Erro ao iniciar configuração 2FA",
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    enroll();
  }, [navigate, toast]);

  const onVerify = async (data: VerifyFormData) => {
    if (!factorId) return;
    setIsVerifying(true);

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
         factorId
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: data.code,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "2FA Ativado com Sucesso!",
        description: "Sua conta agora está mais segura.",
      });

      navigate('/admin/dashboard');
    } catch (err) {
      const error = err as Error;
      console.error('Verify error:', error);
      toast({
        variant: "destructive",
        title: "Código inválido",
        description: "Verifique o código e tente novamente.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = () => {
      if (secret) {
          navigator.clipboard.writeText(secret);
          toast({ title: "Segredo copiado!" });
      }
  };

  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
             <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
             <p className="text-slate-400">Preparando segurança...</p>
        </div>
      );
  }

  return (
    <Card className="w-full bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-blue-500" />
            </div>
        </div>
        <CardTitle className="text-xl text-center text-white">Configurar 2FA</CardTitle>
        <CardDescription className="text-center text-slate-400">
          Escaneie o QR Code com seu app autenticador (Google Authenticator, Authy, etc).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {qrCodeUrl && (
            <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-lg">
                <img src={qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48" />
            </div>
        )}

        <div className="space-y-2">
            <Label className="text-slate-200">Chave de Configuração (Caso não consiga escanear)</Label>
            <div className="flex items-center gap-2">
                <Input readOnly value={secret || ''} className="font-mono text-xs bg-slate-950 border-slate-700 text-slate-300" />
                <Button size="icon" variant="outline" className="border-slate-700 hover:bg-slate-800" onClick={copySecret}>
                    <Copy className="h-4 w-4 text-slate-400" />
                </Button>
            </div>
        </div>

        <form onSubmit={handleSubmit(onVerify)} className="space-y-4 pt-4 border-t border-slate-800">
            <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-200">Código de Verificação (6 dígitos)</Label>
                <Input 
                  id="code" 
                  placeholder="000000" 
                  maxLength={6}
                  className="bg-slate-950/50 border-slate-700 text-slate-100 placeholder:text-slate-600 text-center text-lg tracking-widest"
                  {...register('code')}
                />
                {errors.code && <span className="text-xs text-red-500">{errors.code.message}</span>}
            </div>

            <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                disabled={isVerifying}
            >
                {isVerifying ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                </>
                ) : (
                <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Ativar e Entrar
                </>
                )}
            </Button>
        </form>

      </CardContent>
    </Card>
  );
}
