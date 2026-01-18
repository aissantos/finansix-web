import { Eye, Edit, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/admin/hooks/usePermissions';
import { useImpersonation } from '@/admin/hooks/useImpersonation';
import { DropdownMenu } from '@/components/ui/dropdown-menu';

interface UserRowActionsProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function UserRowActions({ user }: UserRowActionsProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { startImpersonation } = useImpersonation();

  const handleView = () => {
    navigate(`/admin/users/${user.id}`);
  };

  const handleEdit = () => {
    navigate(`/admin/users/${user.id}/edit`);
  };

  const handleImpersonate = async () => {
    await startImpersonation.mutateAsync({
      userId: user.id,
      reason: `Suporte administrativo para ${user.name}`,
    });
  };

  const items = [
    {
      label: 'Ver Detalhes',
      icon: <Eye className="h-4 w-4" />,
      onClick: handleView,
    },
    ...(can('EDIT_USERS') ? [{
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEdit,
    }] : []),
    ...(can('IMPERSONATE_USERS') ? [{
      label: 'Impersonar',
      icon: <UserCog className="h-4 w-4" />,
      onClick: handleImpersonate,
      variant: 'default' as const,
    }] : []),
  ];

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu
        items={items}
        position="bottom-right"
        ariaLabel={`Ações para ${user.name}`}
      />
    </div>
  );
}
