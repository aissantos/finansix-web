/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest';

class MockQueryBuilder {
  data: any;
  error: any;
  count: number | null;

  constructor(data: any = [], error: any = null, count: number | null = null) {
    this.data = data;
    this.error = error;
    this.count = count;
  }

  select = vi.fn().mockReturnThis();
  insert = vi.fn().mockReturnThis();
  update = vi.fn().mockReturnThis();
  delete = vi.fn().mockReturnThis();
  eq = vi.fn().mockReturnThis();
  neq = vi.fn().mockReturnThis();
  gt = vi.fn().mockReturnThis();
  gte = vi.fn().mockReturnThis();
  lt = vi.fn().mockReturnThis();
  lte = vi.fn().mockReturnThis();
  like = vi.fn().mockReturnThis();
  ilike = vi.fn().mockReturnThis();
  is = vi.fn().mockReturnThis();
  in = vi.fn().mockReturnThis();
  contains = vi.fn().mockReturnThis();
  order = vi.fn().mockReturnThis();
  limit = vi.fn().mockReturnThis();
  range = vi.fn().mockReturnThis();
  
  single = vi.fn().mockImplementation(() => {
    return Promise.resolve({ 
      data: Array.isArray(this.data) ? this.data[0] : this.data, 
      error: this.error 
    });
  });
  
  maybeSingle = vi.fn().mockImplementation(() => {
    return Promise.resolve({ 
      data: Array.isArray(this.data) ? this.data[0] : this.data, 
      error: this.error 
    });
  });

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const result = { data: this.data, error: this.error, count: this.count };
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

export const mockSupabaseAdmin = {
  from: vi.fn(),
  rpc: vi.fn(),
  auth: {
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
      updateUserById: vi.fn(),
      listUsers: vi.fn(),
    },
  },
};

export const createMockQueryBuilder = (data: any = [], error: any = null, count: number | null = null) => {
  return new MockQueryBuilder(data, error, count);
};
