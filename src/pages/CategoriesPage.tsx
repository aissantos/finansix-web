import { useState, useMemo } from 'react';
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
  CornerDownRight,
  FolderOpen
} from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Icon } from '@/components/ui/icon';
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
import { IconPicker } from '@/components/ui/icon-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type TabType = 'expense' | 'income';

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#1e293b', '#000000',
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

  // Organizar categorias em hierarquia
  const categorizedData = useMemo(() => {
    if (!categories) return { system: [], user: [] };

    // Filtrar por busca
    const filtered = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separar pais e filhos
    const parents = filtered.filter(c => !c.parent_id);
    const children = filtered.filter(c => c.parent_id);

    // Construir árvore
    const buildTree = (category: Category) => {
        const subcategories = children.filter(c => c.parent_id === category.id);
        return {
            ...category,
            subcategories
        };
    };

    const tree = parents.map(buildTree);

    // Separar sistema e usuário (baseado no pai)
    // Se for subcategoria, consideramos o tipo do pai ou se o pai é sistema/usuário?
    // A regra atual é: household_id null = sistema.
    
    // Vamos separar os PAIS. As subcategorias virão aninhadas.
    const systemCategories = tree.filter(cat => cat.household_id === null);
    const userCategories = tree.filter(cat => cat.household_id !== null);

    return { system: systemCategories, user: userCategories, raw: categories };
  }, [categories, searchQuery]);


  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    // Verificar uso
    const usageCount = await checkUsage(category.id);
    
    // Verificar se tem subcategorias
    const hasChildren = categories?.some(c => c.parent_id === category.id);

    if (hasChildren) {
        toast({ 
            title: 'Não é possível excluir', 
            description: 'Esta categoria possui subcategorias. Exclua-as primeiro.',
            variant: 'destructive' 
        });
        return;
    }
    
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
            existingCategories={categories || []}
          />
        )}

        {/* User Categories */}
        {categorizedData.user.length > 0 && (
          <section className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
              Minhas Categorias
            </h3>
            <div className="space-y-2">
              {categorizedData.user.map(category => (
                <div key={category.id} className="space-y-2">
                    <CategoryItem
                      category={category}
                      onEdit={() => handleEdit(category)}
                      onDelete={() => handleDelete(category)}
                      onToggleFavorite={() => handleToggleFavorite(category)}
                      canEdit
                    />
                    {/* Render Subcategories */}
                    {category.subcategories.map(sub => (
                        <div key={sub.id} className="pl-6 relative">
                             <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center">
                                 <div className="w-[2px] h-full bg-slate-100 dark:bg-slate-800 absolute left-3 top-[-10px]" />
                                 <CornerDownRight className="w-4 h-4 text-slate-300 ml-2" />
                             </div>
                            <CategoryItem
                                category={sub}
                                onEdit={() => handleEdit(sub)}
                                onDelete={() => handleDelete(sub)}
                                onToggleFavorite={() => handleToggleFavorite(sub)}
                                canEdit
                                isChild
                            />
                        </div>
                    ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* System Categories */}
        {categorizedData.system.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
              Categorias Padrão
            </h3>
            <div className="space-y-2">
              {categorizedData.system.map(category => (
                <div key={category.id} className="space-y-2">
                    <CategoryItem
                        category={category}
                        onEdit={() => handleEdit(category)} // User allows editing customization
                        onToggleFavorite={() => handleToggleFavorite(category)}
                        // Prevent delete for system categories unless we want to allow hiding? 
                        // Typically system categories shouldn't be deleted, but maybe edited.
                        // The previous code had `canEdit={false}` for system categories.
                        // But the requirements say "user can choose icon... customize them".
                        // So we should allow editing even for system categories (creating a copy or overriding).
                        // However, let's stick to the previous pattern: 
                        // If it's system, usually we can't delete, but maybe custom properties are allowed?
                        // For now we assume we can customize fields, but not delete.
                        canEdit={true} 
                        isSystem
                    />
                     {/* Render Subcategories */}
                     {category.subcategories.map(sub => (
                        <div key={sub.id} className="pl-6 relative">
                             <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center">
                                 <div className="w-[2px] h-full bg-slate-100 dark:bg-slate-800 absolute left-3 top-[-10px]" />
                                 <CornerDownRight className="w-4 h-4 text-slate-300 ml-2" />
                             </div>
                            <CategoryItem
                                category={sub}
                                onEdit={() => handleEdit(sub)}
                                onDelete={() => handleDelete(sub)} // Don't allow delete for system subcategories either?
                                onToggleFavorite={() => handleToggleFavorite(sub)}
                                canEdit={true}
                                isSystem
                                isChild
                            />
                        </div>
                    ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && categorizedData.user.length === 0 && categorizedData.system.length === 0 && (
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
  isSystem = false,
  isChild = false
}: {
  category: Category;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite: () => void;
  canEdit: boolean;
  isSystem?: boolean;
  isChild?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={cn(
        "flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 relative",
        isChild && "border-l-4 border-l-slate-200 dark:border-l-slate-600"
    )}>
      {/* Icon */}
      <div
        className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-colors",
        )}
        style={{ backgroundColor: (category.color || '#94a3b8') + '20', color: category.color || '#94a3b8' }}
      >
        {category.icon ? <Icon name={category.icon} className="h-6 w-6" /> : <FolderOpen className="h-6 w-6" />}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
          {category.name}
        </p>
        <p className="text-xs text-slate-500">
          {/* Show parent name if needed, but we used indentation */}
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
                {!isSystem && (
                     <button
                     onClick={() => { onDelete?.(); setShowMenu(false); }}
                     className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                   >
                     <Trash2 className="h-4 w-4" />
                     Excluir
                   </button>
                )}
               
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
  existingCategories,
}: {
  type: TransactionType;
  editingCategory: Category | null;
  onClose: () => void;
  existingCategories: Category[];
}) {
  const [name, setName] = useState(editingCategory?.name || '');
  const [selectedColor, setSelectedColor] = useState(editingCategory?.color || CATEGORY_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(editingCategory?.icon || 'Tag');
  const [parentId, setParentId] = useState<string | null>(editingCategory?.parent_id || null);

  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();

  const isPending = isCreating || isUpdating;

  // Filter possible parents:
  // Must be same type (expense/income)
  // Must NOT be a child itself (only 2 levels for now) -> Actually database supports N levels but UI is simpler with 2
  // Must NOT be the category itself (if editing)
  const availableParents = existingCategories.filter(c => 
    c.type === type && 
    !c.parent_id && // Only top-level categories can be parents
    c.id !== editingCategory?.id // Can't be own parent
  );

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
      parent_id: parentId === 'none' ? null : parentId,
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
            className="h-12 w-12 rounded-xl flex items-center justify-center text-xl transition-colors"
            style={{ backgroundColor: selectedColor + '30', color: selectedColor }}
          >
            {selectedIcon ? <Icon name={selectedIcon} className="h-6 w-6" /> : null}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">
              {name || 'Nome da categoria'}
            </p>
            <p className="text-xs text-slate-500">
              {type === 'expense' ? 'Despesa' : 'Receita'}
              {parentId && parentId !== 'none' && ` • Subcategoria`}
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">
            Nome
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Jogos, Freelance, Academia"
          />
        </div>

        {/* Parent Category */}
        <div>
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">
                Categoria Principal (Opcional)
            </Label>
            <Select 
                value={parentId || 'none'} 
                onValueChange={(val) => setParentId(val === 'none' ? null : val)}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria pai..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Nenhuma (Categoria Principal)</SelectItem>
                    {availableParents.map(parent => (
                        <SelectItem key={parent.id} value={parent.id}>
                            <div className="flex items-center gap-2">
                                {/* Cor e ícone do pai para facilitar identificação */}
                                <div 
                                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                                    style={{ backgroundColor: (parent.color || '#94a3b8') + '20', color: parent.color || '#94a3b8' }} 
                                >
                                    <Icon name={parent.icon} className="w-3 h-3" />
                                </div>
                                {parent.name}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {/* Icon Picker */}
        <div>
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">
            Ícone
          </Label>
          <IconPicker 
            value={selectedIcon || ''} 
            onChange={setSelectedIcon} 
            modal 
          />
        </div>

        {/* Color */}
        <div>
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">
            Cor
          </Label>
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
