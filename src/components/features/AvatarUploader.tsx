import { useState, useRef } from 'react';
import { Camera, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';

interface AvatarUploaderProps {
  currentUrl?: string | null;
  displayName?: string;
  size?: 'sm' | 'md' | 'lg';
  onUpload?: (url: string) => void;
  editable?: boolean;
}

const SIZES = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

const ICON_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function AvatarUploader({
  currentUrl,
  displayName = 'U',
  size = 'lg',
  onUpload,
  editable = true,
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Selecione uma imagem válida', variant: 'destructive' });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande (máx 5MB)', variant: 'destructive' });
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Nome do arquivo único dentro da pasta do usuário
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // Se o bucket não existe, mostrar mensagem amigável
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Sistema de upload não configurado. Entre em contato com o suporte.');
        }
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar metadados do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) throw updateError;

      toast({ title: 'Foto atualizada!', variant: 'success' });
      onUpload?.(publicUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setPreviewUrl(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Upload error:', error);
      toast({ 
        title: 'Erro ao enviar foto', 
        description: message,
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl || currentUrl;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            'rounded-full flex items-center justify-center overflow-hidden',
            'bg-primary text-white font-bold shadow-lg ring-4 ring-white dark:ring-slate-700',
            SIZES[size]
          )}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className={cn(
              size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : 'text-4xl'
            )}>
              {initial}
            </span>
          )}
        </div>

        {/* Edit Button */}
        {editable && !selectedFile && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'absolute bottom-0 right-0 rounded-full shadow-md',
              'bg-primary text-white hover:scale-110 transition-transform',
              size === 'sm' ? 'p-1.5' : 'p-2'
            )}
          >
            <Camera className={ICON_SIZES[size]} />
          </button>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Action Buttons */}
      {selectedFile && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            isLoading={isUploading}
          >
            <Check className="h-4 w-4 mr-1" />
            Salvar Foto
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Versão simplificada para listas
 */
export function Avatar({
  url,
  name,
  size = 'md',
  className,
}: {
  url?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center overflow-hidden',
        'bg-primary text-white font-bold',
        SIZES[size],
        className
      )}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className={cn(
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-2xl'
        )}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
