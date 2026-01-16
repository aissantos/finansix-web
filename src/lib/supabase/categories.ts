import { supabase } from './client';
import { handleSupabaseError, NotFoundError } from '@/lib/utils/errors';
import type { Category, InsertTables, TransactionType } from '@/types';

export async function getCategories(
  householdId: string,
  type?: TransactionType
): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .or(`household_id.eq.${householdId},household_id.is.null`)
    .order('sort_order')
    .order('name');

  if (type) {
    query = query.or(`type.eq.${type},type.is.null`);
  }

  const { data, error } = await query;

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getFavoriteCategories(householdId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_favorite', true)
    .eq('is_active', true)
    .or(`household_id.eq.${householdId},household_id.is.null`)
    .order('sort_order')
    .limit(8);

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function createCategory(category: InsertTables<'categories'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Categoria criada');
  return data;
}

export async function toggleFavoriteCategory(id: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ is_favorite: isFavorite })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function updateCategory(
  id: string, 
  updates: Partial<Omit<InsertTables<'categories'>, 'household_id'>>
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Categoria');
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  // Soft delete - apenas desativa a categoria
  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function checkCategoryUsage(id: string): Promise<number> {
  // Verifica quantas transações usam esta categoria
  const { count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);

  if (error) handleSupabaseError(error);
  return count ?? 0;
}

// Default categories for new households
export const DEFAULT_CATEGORIES: Omit<InsertTables<'categories'>, 'household_id'>[] = [
  { name: 'Alimentação', type: 'expense', icon: 'utensils', color: '#ef4444', is_favorite: true, sort_order: 1 },
  { name: 'Transporte', type: 'expense', icon: 'car', color: '#6366f1', is_favorite: true, sort_order: 2 },
  { name: 'Moradia', type: 'expense', icon: 'home', color: '#14b8a6', is_favorite: false, sort_order: 3 },
  { name: 'Saúde', type: 'expense', icon: 'heart-pulse', color: '#ec4899', is_favorite: false, sort_order: 4 },
  { name: 'Educação', type: 'expense', icon: 'graduation-cap', color: '#8b5cf6', is_favorite: false, sort_order: 5 },
  { name: 'Lazer', type: 'expense', icon: 'gamepad-2', color: '#f59e0b', is_favorite: true, sort_order: 6 },
  { name: 'Compras', type: 'expense', icon: 'shopping-bag', color: '#3b82f6', is_favorite: true, sort_order: 7 },
  { name: 'Assinaturas', type: 'expense', icon: 'repeat', color: '#06b6d4', is_favorite: false, sort_order: 8 },
  { name: 'Salário', type: 'income', icon: 'briefcase', color: '#22c55e', is_favorite: true, sort_order: 1 },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#10b981', is_favorite: false, sort_order: 2 },
  { name: 'Investimentos', type: 'income', icon: 'trending-up', color: '#059669', is_favorite: false, sort_order: 3 },
  { name: 'Reembolso', type: 'income', icon: 'rotate-ccw', color: '#34d399', is_favorite: true, sort_order: 4 },
];

export const DEFAULT_SUBCATEGORIES = [
  { parent: 'Assinaturas', name: 'Streaming', icon: 'tv', color: '#06b6d4' },
  { parent: 'Assinaturas', name: 'Software e IAs', icon: 'cpu', color: '#0ea5e9' },
  { parent: 'Assinaturas', name: 'Educação', icon: 'book-open', color: '#2dd4bf' },
  { parent: 'Assinaturas', name: 'Serviços', icon: 'wifi', color: '#64748b' },
];

export async function seedDefaultCategories(householdId: string): Promise<void> {
  // 1. Buscar categorias existentes
  const { data: existingCategories, error: fetchError } = await supabase
    .from('categories')
    .select('id, name, type, parent_id')
    .or(`household_id.eq.${householdId},household_id.is.null`);

  if (fetchError) {
    handleSupabaseError(fetchError);
    return;
  }

  // 2. Filtrar e inserir PAIS que não existem
  const newRefCategories = DEFAULT_CATEGORIES.filter(defaultCat => 
    !existingCategories?.some(existingCat => 
      existingCat.name === defaultCat.name && 
      existingCat.type === defaultCat.type &&
      !existingCat.parent_id
    )
  ).map(cat => ({
    ...cat,
    household_id: householdId,
  }));

  if (newRefCategories.length > 0) {
    const { error } = await supabase
      .from('categories')
      .insert(newRefCategories);

    if (error) handleSupabaseError(error);
  }

  // 3. Inserir SUBCATEGORIAS
  // Recarrega categorias para ter os IDs das recém criadas
  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, name')
    .or(`household_id.eq.${householdId},household_id.is.null`);

  if (!allCategories) return;

  const newSubCategories = DEFAULT_SUBCATEGORIES.map(sub => {
    const parent = allCategories.find(c => c.name === sub.parent);
    if (!parent) return null;

    // Check if subcategory already exists
    const exists = existingCategories?.some(existing => 
      existing.name === sub.name && 
      existing.parent_id === parent.id
    );
    if (exists) return null;

    return {
      name: sub.name,
      icon: sub.icon,
      color: sub.color,
      type: 'expense' as const, // Assinaturas são expense
      parent_id: parent.id,
      household_id: householdId,
      is_favorite: false,
      sort_order: 99,
    };
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  if (newSubCategories.length > 0) {
    const { error } = await supabase
      .from('categories')
      .insert(newSubCategories);
    
    if (error) handleSupabaseError(error);
  }
}

