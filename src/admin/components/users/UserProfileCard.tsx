import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, Edit, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserDetail } from '@/admin/hooks/useUserDetail';

interface UserProfileCardProps {
  user: UserDetail;
  onEdit?: () => void;
  onDeactivate?: () => void;
}

export function UserProfileCard({ user, onEdit, onDeactivate }: UserProfileCardProps) {
  const displayName = user.display_name || 'Sem nome';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleColors = {
    owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    member: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil do Usuário</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {displayName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={roleColors[user.role as keyof typeof roleColors]}
                >
                  {user.role}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Mail className="h-4 w-4" />
                <span className="font-mono">{user.user_id.slice(0, 16)}...</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>
                  Membro desde {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              {onDeactivate && (
                <Button variant="outline" size="sm" onClick={onDeactivate}>
                  <UserX className="h-4 w-4 mr-2" />
                  Desativar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
