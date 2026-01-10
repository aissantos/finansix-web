-- ============================================================================
-- Migration: Fix Auth 500 Error - Create _secured Schema
-- Versão: 1.5.2.4
-- Data: 10/01/2026
-- Descrição: Cria o schema _secured necessário para as funções de setup
-- ============================================================================

-- ============================================================================
-- 1. CREATE SCHEMA _secured (se não existir)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = '_secured') THEN
    CREATE SCHEMA _secured;
  END IF;
END $$;

-- ============================================================================
-- 2. GRANT permissions on schema
-- ============================================================================

GRANT USAGE ON SCHEMA _secured TO authenticated;
GRANT USAGE ON SCHEMA _secured TO service_role;

-- ============================================================================
-- 3. RECREATE setup_new_user function (garantir que existe)
-- ============================================================================

CREATE OR REPLACE FUNCTION _secured.setup_new_user(
  p_user_id UUID,
  p_user_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_household_id UUID;
  v_existing_household_id UUID;
BEGIN
  -- Check if user already has a household
  SELECT household_id INTO v_existing_household_id
  FROM public.household_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_existing_household_id IS NOT NULL THEN
    RETURN v_existing_household_id;
  END IF;

  -- Create new household
  INSERT INTO public.households (name)
  VALUES (COALESCE(p_user_name || '''s Family', 'My Family'))
  RETURNING id INTO v_household_id;

  -- Add user as owner
  INSERT INTO public.household_members (household_id, user_id, role, display_name)
  VALUES (v_household_id, p_user_id, 'owner', COALESCE(p_user_name, 'Owner'));

  RETURN v_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION _secured.setup_new_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION _secured.setup_new_user(UUID, TEXT) TO service_role;

-- ============================================================================
-- 4. RECREATE public wrapper
-- ============================================================================

CREATE OR REPLACE FUNCTION public.setup_user_household(
  user_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  -- Call the secured function with the current user's ID
  RETURN _secured.setup_new_user(auth.uid(), user_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.setup_user_household(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.setup_user_household(TEXT) TO service_role;

-- ============================================================================
-- 5. OPTIONAL: Create trigger to auto-setup user on signup
-- ============================================================================

-- Função que será chamada pela trigger
CREATE OR REPLACE FUNCTION _secured.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  -- Pegar display_name do metadata se existir
  v_user_name := NEW.raw_user_meta_data->>'display_name';
  
  -- Se não tiver display_name, usar email
  IF v_user_name IS NULL OR v_user_name = '' THEN
    v_user_name := split_part(NEW.email, '@', 1);
  END IF;

  -- Setup household para o novo usuário
  PERFORM _secured.setup_new_user(NEW.id, v_user_name);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error mas não falha o signup
    RAISE WARNING 'Failed to setup household for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antiga se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION _secured.handle_new_user();

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Para verificar se o schema existe:
-- SELECT nspname FROM pg_namespace WHERE nspname = '_secured';

-- Para verificar se as funções existem:
-- SELECT proname, pronamespace::regnamespace 
-- FROM pg_proc 
-- WHERE proname IN ('setup_new_user', 'setup_user_household', 'handle_new_user');

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON SCHEMA _secured IS 
'Schema seguro para funções que precisam de SECURITY DEFINER.
Usado para operações que precisam bypassar RLS durante setup inicial.';

COMMENT ON FUNCTION _secured.setup_new_user(UUID, TEXT) IS 
'Cria household para novo usuário e adiciona como owner.
Chamada durante setup inicial. Retorna household_id existente se usuário já tem um.';

COMMENT ON FUNCTION public.setup_user_household(TEXT) IS 
'Função RPC pública para setup de household do novo usuário.
Chama _secured.setup_new_user com ID do usuário autenticado.';

COMMENT ON FUNCTION _secured.handle_new_user() IS 
'Trigger function executada automaticamente quando um novo usuário é criado.
Cria household automaticamente e adiciona usuário como owner.';
