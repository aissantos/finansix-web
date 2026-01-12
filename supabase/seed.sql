-- Criar um usuário de teste na tabela de autenticação (auth.users)
-- Senha padrão: "password123"
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'authenticated',
    'authenticated',
    'admin@finansix.com',
    '$2a$10$BitXv5lP4GvD8i9.v6.gpe4.x5h5.s5s5s5s5s5s5s5s5s5s5s', -- hash para "password123" (exemplo genérico)
    '2024-01-01 00:00:00+00',
    NULL,
    '2024-01-01 00:00:00+00',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin User"}',
    '2024-01-01 00:00:00+00',
    '2024-01-01 00:00:00+00',
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Criar a identidade para permitir login (auth.identities)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","email":"admin@finansix.com"}',
    'email',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '2024-01-01 00:00:00+00',
    '2024-01-01 00:00:00+00',
    '2024-01-01 00:00:00+00'
) ON CONFLICT (id) DO NOTHING;

-- Criar a Família (Household)
INSERT INTO public.households (id, name, created_at)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    'Família Finansix',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Ligar o Usuário à Família (Household Member)
INSERT INTO public.household_members (id, household_id, user_id, role, created_at)
VALUES (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- ID do usuário criado acima
    'owner',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar uma Categoria de Exemplo
INSERT INTO public.categories (id, household_id, name, type, icon, color)
VALUES (
    gen_random_uuid(),
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    'Alimentação',
    'expense',
    '🍔',
    '#EF4444'
);