import type { Installment, Category } from './database';

export interface InstallmentWithDetails extends Installment {
  transaction?: {
    description: string;
    category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'>;
  };
}
