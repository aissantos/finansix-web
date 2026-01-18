import { useState } from 'react';
import { UserFilters } from '@/admin/components/users/UserFilters';
import { UsersTable } from '@/admin/components/users/UsersTable';
import { Pagination } from '@/admin/components/users/Pagination';
import { BulkActions } from '@/admin/components/users/BulkActions';
import { useUsers } from '@/admin/hooks/useUsers';
import type { UserFilters as UserFiltersType } from '@/admin/hooks/useUsers';

export default function UsersPage() {
  const [filters, setFilters] = useState<UserFiltersType>({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data, isLoading } = useUsers(filters, pagination);

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
    // TODO: Implement export functionality
  };

  const handleCreateUser = () => {
    // TODO: Navigate to create user page
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
