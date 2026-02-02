/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { UserFilters } from '@/admin/components/users/UserFilters';
import { UsersTable } from '@/admin/components/users/UsersTable';
import { Pagination } from '@/admin/components/users/Pagination';
import { BulkActions } from '@/admin/components/users/BulkActions';
import { useUsers } from '@/admin/hooks/useUsers';
import { useExport } from '@/admin/hooks/useExport';
import type { UserFilters as UserFiltersType } from '@/admin/hooks/useUsers';

export default function UsersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<UserFiltersType>({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data, isLoading } = useUsers(filters, pagination);
  const { exportToCSV } = useExport();

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(data?.users.map((u) => u.id) || []);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleExport = () => {
    if (!data?.users || data.users.length === 0) {
      alert('Nenhum usuário para exportar');
      return;
    }

    const exportData = data.users.map((user: any) => ({
      user_id: user.user_id,
      display_name: user.display_name || 'N/A',
      household_id: user.household_id,
      household_name: user.households?.name || 'N/A',
      role: user.role,
      avatar_url: user.avatar_url || 'N/A',
      created_at: format(new Date(user.created_at), 'dd/MM/yyyy HH:mm'),
    }));

    try {
      exportToCSV(exportData, {
        filename: `usuarios-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`,
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar usuários. Tente novamente.');
    }
  };

  const handleCreateUser = () => {
    navigate('/admin/users/new');
  };

  return (
    <div className="space-y-6">
      <UserFilters
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setPagination({ ...pagination, page: 1 }); // Reset to page 1 on filter change
        }}
        onExport={handleExport}
        onCreateUser={handleCreateUser}
      />

      <BulkActions
        selectedCount={selectedUsers.length}
        onClearSelection={() => setSelectedUsers([])}
      />

      <UsersTable
        users={data?.users || []}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        onSelectAll={handleSelectAll}
        isLoading={isLoading}
      />

      {data && (
        <Pagination
          currentPage={pagination.page}
          totalPages={data.totalPages}
          pageSize={pagination.pageSize}
          totalItems={data.total}
          onPageChange={(page) => setPagination({ ...pagination, page })}
          onPageSizeChange={(pageSize) => setPagination({ page: 1, pageSize })}
        />
      )}
    </div>
  );
}
