/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@/test/test-utils';
import { useUsers } from '@/admin/hooks/useUsers';
import { supabase } from '@/lib/supabase';
import { createMockQueryBuilder } from '@/test/mocks/supabase-admin';

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUsers = [
    { id: '1', display_name: 'John Doe', email: 'john@example.com', role: 'user', created_at: '2023-01-01' },
    { id: '2', display_name: 'Jane Doe', email: 'jane@example.com', role: 'admin', created_at: '2023-01-02' },
  ];

  it('deve buscar usuários com sucesso', async () => {
    // Setup mock query builder
    const queryBuilder = createMockQueryBuilder(mockUsers, null, 2);
    vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);

    const { result } = renderHook(() => useUsers());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.users).toHaveLength(2);
    expect(result.current.data?.total).toBe(2);
    expect(supabase.from).toHaveBeenCalledWith('household_members');
  });

  it('deve aplicar filtro de busca por texto', async () => {
    const queryBuilder = createMockQueryBuilder(mockUsers, null, 2);
    vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);

    const { result } = renderHook(() => useUsers({ search: 'John' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryBuilder.ilike).toHaveBeenCalledWith('display_name', '%John%');
  });

  it('deve aplicar filtro de role', async () => {
    const queryBuilder = createMockQueryBuilder(mockUsers, null, 2);
    vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);

    const { result } = renderHook(() => useUsers({ role: 'admin' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryBuilder.eq).toHaveBeenCalledWith('role', 'admin');
  });

  it('deve aplicar paginação', async () => {
    const queryBuilder = createMockQueryBuilder(mockUsers, null, 20);
    vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);

    const { result } = renderHook(() => useUsers({}, { page: 2, pageSize: 10 }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Page 2 (index 1) with size 10 means items 10 to 19
    expect(queryBuilder.range).toHaveBeenCalledWith(10, 19);
  });

  it('deve lidar com erros da API', async () => {
    const error = { message: 'Failed to fetch' };
    const queryBuilder = createMockQueryBuilder([], error);
    // Force the promise to reject for the error case in useUsers
    queryBuilder.then = ((_: any, reject: any) => reject(error)) as any;
    
    // Alternative approach: mock the query execution to throw
    const throwingBuilder = {
      ...queryBuilder,
      then: (_: any, reject: any) => reject(error)
    };
    
    vi.mocked(supabase.from).mockReturnValue(throwingBuilder as any);

    const { result } = renderHook(() => useUsers());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(error);
  });
});
