import type { Installment, Category } from './database';

export interface InstallmentWithDetails extends Installment {
  transaction?: {
    description: string;
    transaction_date?: string;
    category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'>;
  };
}
