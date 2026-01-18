import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';
import { Badge } from '@/components/ui/badge';
import { UserRowActions } from './UserRowActions';
import type { Database } from '@/types/database';

type HouseholdMember = Database['public']['Tables']['household_members']['Row'] & {
  households?: { name: string };
};

export function RecentUsersTable() {
  const navigate = useNavigate();
  
  const { data, isLoading } = useQuery({
    queryKey: ['recent-household-members'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('household_members')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as HouseholdMember[];
    },
  });
  
  const columns = useMemo(() => [
    {
      accessorKey: 'display_name',
      header: 'Usuário',
      cell: ({ row }: { row: { original: HouseholdMember } }) => {
        const displayName = row.original.display_name || 'Sem nome';
        const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        
        return (
          <div className="flex items-center gap-3">
            {row.original.avatar_url ? (
              <img 
                src={row.original.avatar_url} 
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  {initials}
                </span>
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">{displayName}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{row.original.user_id.slice(0, 8)}...</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'household_id',
      header: 'Household',
      cell: ({ row }: { row: { original: HouseholdMember } }) => (
        <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
          {row.original.household_id.slice(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Membro desde',
      cell: ({ row }: { row: { original: HouseholdMember } }) => (
        <span className="text-sm text-slate-700 dark:text-slate-300">
          {format(new Date(row.original.created_at), 'dd/MM/yyyy')}
        </span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Função',
      cell: ({ row }: { row: { original: HouseholdMember } }) => (
        <Badge variant="default">
          {row.original.role}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: HouseholdMember } }) => <UserRowActions user={{
        id: row.original.user_id,
        name: row.original.display_name || 'Sem nome',
        email: row.original.user_id,
      }} />,
    },
  ], []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            {columns.map((column) => (
              <th
                key={column.accessorKey || column.id}
                className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800">
          {data?.map((member) => (
            <tr
              key={member.id}
              onClick={() => navigate(`/admin/users/${member.user_id}`)}
              className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
            >
              {columns.map((column) => (
                <td key={column.accessorKey || column.id} className="px-6 py-4 whitespace-nowrap">
                  {column.cell({ row: { original: member } })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
