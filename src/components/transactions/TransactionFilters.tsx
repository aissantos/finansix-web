import { Calendar, ArrowDownLeft, ArrowUpRight, Repeat, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Category } from '@/types'; // Assuming Category is in types

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

interface TransactionFiltersProps {
  filterType: FilterType;
  setFilterType: (type: FilterType) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  dateRange: { start: string | null; end: string | null };
  setDateRange: (range: { start: string | null; end: string | null }) => void;
  categories: Category[] | undefined;
  onClearFilters: () => void;
  onExport: () => void;
  hasResults: boolean;
  hasActiveFilters: boolean;
}

export function TransactionFilters({
  filterType,
  setFilterType,
  selectedCategoryId,
  setSelectedCategoryId,
  dateRange,
  setDateRange,
  categories,
  onClearFilters,
  onExport,
  hasResults,
  hasActiveFilters
}: TransactionFiltersProps) {
  return (
    <Card className="p-4 space-y-4">
      {/* Type Filter */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Tipo
        </label>
        <div className="flex gap-2">
          {[
            { value: 'all' as const, label: 'Todas', icon: Calendar },
            { value: 'income' as const, label: 'Receitas', icon: ArrowDownLeft },
            { value: 'expense' as const, label: 'Despesas', icon: ArrowUpRight },
            { value: 'transfer' as const, label: 'Transferências', icon: Repeat },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilterType(value)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                filterType === value
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Categoria
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              !selectedCategoryId
                ? 'bg-primary text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            )}
          >
            Todas
          </button>
          {categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                selectedCategoryId === category.id
                  ? 'text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              )}
              style={selectedCategoryId === category.id ? {
                backgroundColor: category.color || '#6366f1'
              } : undefined}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
          Período
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">De</label>
            <Input
              type="date"
              value={dateRange.start || ''}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value || null })}
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">Até</label>
            <Input
              type="date"
              value={dateRange.end || ''}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value || null })}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 text-sm">
        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
        <Button
          onClick={onExport}
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          disabled={!hasResults}
        >
          📥 Exportar CSV
        </Button>
      </div>
    </Card>
  );
}
