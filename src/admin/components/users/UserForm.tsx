import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHouseholds } from '@/admin/hooks/useUsers';
import { userFormSchema, type UserFormData } from '@/admin/schemas/userFormSchema';
import type { Database } from '@/types/database';

type HouseholdMember = Database['public']['Tables']['household_members']['Row'];

interface UserFormProps {
  user?: HouseholdMember;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const { data: households } = useHouseholds();
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      display_name: user?.display_name || '',
      user_id: user?.user_id,
      household_id: user?.household_id || '',
      role: user?.role || 'member',
      avatar_url: user?.avatar_url || '',
    },
  });

  const selectedHousehold = watch('household_id');
  const selectedRole = watch('role');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name">
              Nome de Exibição <span className="text-red-500">*</span>
            </Label>
            <Input
              id="display_name"
              {...register('display_name')}
              placeholder="João Silva"
              disabled={isLoading}
            />
            {errors.display_name && (
              <p className="text-sm text-red-500">{errors.display_name.message}</p>
            )}
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <Label htmlFor="avatar_url">URL do Avatar (opcional)</Label>
            <Input
              id="avatar_url"
              {...register('avatar_url')}
              placeholder="https://exemplo.com/avatar.jpg"
              disabled={isLoading}
            />
            {errors.avatar_url && (
              <p className="text-sm text-red-500">{errors.avatar_url.message}</p>
            )}
          </div>

          {/* Household */}
          <div className="space-y-2">
            <Label htmlFor="household_id">
              Household <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedHousehold}
              onValueChange={(value: string) => setValue('household_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um household" />
              </SelectTrigger>
              <SelectContent>
                {households?.map((household) => (
                  <SelectItem key={household.id} value={household.id}>
                    {household.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.household_id && (
              <p className="text-sm text-red-500">{errors.household_id.message}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Função <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(value: string) => setValue('role', value as UserFormData['role'])}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Owner: Controle total | Admin: Gerenciamento | Member: Uso padrão | Viewer: Apenas
              visualização
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
