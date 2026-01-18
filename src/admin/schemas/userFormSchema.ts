import { z } from 'zod';

export const userFormSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  user_id: z
    .string()
    .uuid('ID de usuário inválido')
    .optional(),
  
  household_id: z
    .string()
    .uuid('Household inválido')
    .min(1, 'Selecione um household'),
  
  role: z.enum(['owner', 'admin', 'member', 'viewer'], {
    errorMap: () => ({ message: 'Selecione uma função válida' }),
  }),
  
  avatar_url: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
});

export type UserFormData = z.infer<typeof userFormSchema>;
