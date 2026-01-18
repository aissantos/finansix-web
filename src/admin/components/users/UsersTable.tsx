import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRowActions } from '../tables/UserRowActions';
import type { Database } from '@/types/database';

type HouseholdMember = Database['public']['Tables']['household_members']['Row'] & {
  households?: { name: string };
};

interface UsersTableProps {
  users: HouseholdMember[];
  selectedUsers: string[];
  onSelectUser: (userId: string) => void;
  onSelectAll: (selected: boolean) => void;
  isLoading?: boolean;
}

export function UsersTable({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  isLoading,
}: UsersTableProps) {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<HouseholdMember>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => onSelectAll(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedUsers.includes(row.original.id)}
            onCheckedChange={() => onSelectUser(row.original.id)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'display_name',
        header: 'Usuário',
        cell: ({ row }) => {
          const displayName = row.original.display_name || 'Sem nome';
          const initials = displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={row.original.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {displayName}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {row.original.user_id.slice(0, 8)}...
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'households',
        header: 'Household',
        cell: ({ row }) => {
          const household = row.original.households as { name: string } | undefined;
          return (
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {household?.name || row.original.household_id.slice(0, 8) + '...'}
            </span>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Função',
        cell: ({ row }) => {
          const roleColors = {
            owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
            admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
            member: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
            viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400',
          };

          return (
            <Badge
              variant="secondary"
              className={roleColors[row.original.role as keyof typeof roleColors]}
            >
              {row.original.role}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Membro desde',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {format(new Date(row.original.created_at), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <UserRowActions
            user={{
              id: row.original.user_id,
              name: row.original.display_name || 'Sem nome',
              email: row.original.user_id,
            }}
          />
        ),
      },
    ],
    [selectedUsers, onSelectUser, onSelectAll]
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">
          Nenhum usuário encontrado com os filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-900">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => navigate(`/admin/users/${row.original.user_id}`)}
              className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
