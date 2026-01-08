import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Star, 
  StarOff,
  Tag,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Search,
  Check,
} from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  useToggleFavoriteCategory,
  useCheckCategoryUsage,
} from '@/hooks/useCategories';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { TransactionType, Category } from '@/types';

type TabType = 'expense' | 'income';

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#1e293b', '#000000',
];

const CATEGORY_ICONS = [
  '🍔', '🚗', '🏠', '❤️', '📚', '🎮', '🛒', '🔄',
  '💼', '💻', '📈', '💰', '🎵', '✈️', '👕', '💊',
  '📱', '🎬', '⚡', '🌐', '🎁', '🏋️', '🐕', '👶',
];

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const { data: categories, isLoading } = useCategories(activeTab);
  const { mutate: toggleFavorite } = useToggleFavoriteCategory();
  const { mutate: deleteCategory } = useDeleteCategory();
  const { mutateAsync: checkUsage } = useCheckCategoryUsage();

  // Filtrar categorias pela busca
  const filteredCategories = categories?.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separar categorias do sistema e do usuário
  const systemCategories = filteredCategories?.filter(cat => cat.household_id === null) ?? [];
  const userCategories = filteredCategories?.filter(cat => cat.household_id !== null) ?? [];

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    // Verificar uso
    const usageCount = await checkUsage(category.id);
    
    if (usageCount > 0) {
      const confirmed = confirm(
        `Esta categoria está sendo usada em ${usageCount} transação(ões).\n\nDeseja realmente excluir? As transações serão mantidas, mas ficarão sem categoria.`
      );
      if (!confirmed) return;
    } else {
      const confirmed = confirm(`Deseja excluir a categoria "${category.name}"?`);
      if (!confirmed) return;
    }

    deleteCategory(category.id, {
      onSuccess: () => {
        toast({ title: 'Categoria excluída', variant: 'success' });
      },
      onError: () => {
        toast({ title: 'Erro ao excluir', variant: 'destructive' });
      },
    });
  };

  const handleToggleFavorite = (category: Category) => {
    toggleFavorite({ id: category.id, isFavorite: !category.is_favorite });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  return (
    <>
      <Header 
        title="Categorias" 
        showBack 
        onBack={() => navigate(-1)} 
      />
      
      <PageContainer className="pb-24">
        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('expense')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all',
              activeTab === 'expense'
                ? 'bg-white dark:bg-slate-700 text-expense shadow-sm'
                : 'text-slate-500'
            )}
          >
            <TrendingDown className="h-4 w-4" />
            Despesas
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all',
              activeTab === 'income'
                ? 'bg-white dark:bg-slate-700 text-income shadow-sm'
                : 'text-slate-500'
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Receitas
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          />
        </div>

        {/* Add Button */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full mb-6"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        )}

        {/* Form */}
        {showForm && (
          <CategoryForm
            type={activeTab}
            editingCategory={editingCategory}
            onClose={handleFormClose}
          />
        )}

        {/* User Categories */}
        {userCategories.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
              Minhas Categorias
            </h3>
            <div className="space-y-2">
              {userCategories.map(category => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onEdit={() => handleEdit(category)}
                  onDelete={() => handleDelete(category)}
                  onToggleFavorite={() => handleToggleFavorite(category)}
                  canEdit
                />
              ))}
            </div>
          </section>
        )}

        {/* System Categories */}
        {systemCategories.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
              Categorias Padrão
            </h3>
            <div className="space-y-2">
              {systemCategories.map(category => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onToggleFavorite={() => handleToggleFavorite(category)}
                  canEdit={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && filteredCategories?.length === 0 && (
          <Card className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Tag className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-2">
              {searchQuery 
                ? 'Nenhuma categoria encontrada'
                : 'Nenhuma categoria cadastrada'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Criar categoria
              </Button>
            )}
          </Card>
        )}
      </PageContainer>
    </>
  );
}

// ============================================================================
// Category Item Component
// ============================================================================

function CategoryItem({
  category,
  onEdit,
  onDelete,
  onToggleFavorite,
  canEdit,
}: {
  category: Category;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite: () => void;
  canEdit: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
      {/* Icon */}
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: category.color + '20' }}
      >
        {category.icon || '📁'}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
          {category.name}
        </p>
        <p className="text-xs text-slate-500">
          {category.type === 'expense' ? 'Despesa' : 'Receita'}
        </p>
      </div>

      {/* Favorite */}
      <button
        onClick={onToggleFavorite}
        className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
          category.is_favorite
            ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        )}
      >
        {category.is_favorite ? (
          <Star className="h-4 w-4 fill-current" />
        ) : (
          <StarOff className="h-4 w-4" />
        )}
      </button>

      {/* Menu */}
      {canEdit && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)} 
              />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 min-w-[120px]">
                <button
                  onClick={() => { onEdit?.(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => { onDelete?.(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Category Form Component
// ============================================================================

function CategoryForm({
  type,
  editingCategory,
  onClose,
}: {
  type: TransactionType;
  editingCategory: Category | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(editingCategory?.name || '');
  const [selectedColor, setSelectedColor] = useState(editingCategory?.color || CATEGORY_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(editingCategory?.icon || CATEGORY_ICONS[0]);

  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();

  const isPending = isCreating || isUpdating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: 'Digite um nome', variant: 'destructive' });
      return;
    }

    const data = {
      name: name.trim(),
      type,
      color: selectedColor,
      icon: selectedIcon,
      is_favorite: false,
    };

    if (editingCategory) {
      updateCategory(
        { id: editingCategory.id, ...data },
        {
          onSuccess: () => {
            toast({ title: 'Categoria atualizada!', variant: 'success' });
            onClose();
          },
          onError: () => {
            toast({ title: 'Erro ao atualizar', variant: 'destructive' });
          },
        }
      );
    } else {
      createCategory(data, {
        onSuccess: () => {
          toast({ title: 'Categoria criada!', variant: 'success' });
          onClose();
        },
        onError: () => {
          toast({ title: 'Erro ao criar', variant: 'destructive' });
        },
      });
    }
  };

  return (
    <Card className="p-4 mb-6 border-2 border-primary/20">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white">
          {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
        </h3>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: selectedColor + '30' }}
          >
            {selectedIcon}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              {name || 'Nome da categoria'}
            </p>
            <p className="text-xs text-slate-500">
              {type === 'expense' ? 'Despesa' : 'Receita'}
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Nome
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Jogos, Freelance, Academia"
          />
        </div>

        {/* Icon */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Ícone
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setSelectedIcon(icon)}
                className={cn(
                  'h-10 w-10 rounded-xl text-lg transition-all',
                  selectedIcon === icon
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200'
                )}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Cor
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={cn(
                  'h-8 w-8 rounded-lg transition-all',
                  selectedColor === color && 'ring-2 ring-offset-2 ring-primary scale-110'
                )}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && (
                  <Check className="h-4 w-4 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" isLoading={isPending}>
            <Check className="h-4 w-4 mr-2" />
            {editingCategory ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
