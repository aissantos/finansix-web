import { useState } from 'react';
import { Search, Filter, Download, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHouseholds } from '@/admin/hooks/useUsers';
import type { UserFilters as UserFiltersType } from '@/admin/hooks/useUsers';

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: UserFiltersType) => void;
  onExport?: () => void;
  onCreateUser?: () => void;
}

export function UserFilters({ filters, onFiltersChange, onExport, onCreateUser }: UserFiltersProps) {
  const { data: households } = useHouseholds();
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Debounce search
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined });
    }, 300);
    return () => clearTimeout(timer);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Gerenciamento de Usuários
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visualize e gerencie todos os usuários do Finansix
          </p>
        </div>
        
        <div className="flex gap-2">
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
          {onCreateUser && (
            <Button onClick={onCreateUser}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Household Filter */}
        <Select
          value={filters.household_id || 'all'}
          onValueChange={(value: string) =>
            onFiltersChange({
              ...filters,
              household_id: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Household" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Households</SelectItem>
            {households?.map((household) => (
              <SelectItem key={household.id} value={household.id}>
                {household.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Role Filter */}
        <Select
          value={filters.role || 'all'}
          onValueChange={(value: string) =>
            onFiltersChange({
              ...filters,
              role: value === 'all' ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Funções</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {(filters.search || filters.household_id || filters.role) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchValue('');
              onFiltersChange({});
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
}
