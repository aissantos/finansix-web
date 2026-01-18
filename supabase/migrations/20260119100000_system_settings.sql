-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    type text NOT NULL CHECK (type IN ('boolean', 'string', 'number', 'json')),
    description text,
    "group" text NOT NULL DEFAULT 'general',
    is_public boolean DEFAULT false, -- If true, can be read by anon
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies

-- Admins can do everything
CREATE POLICY "Admins can manage system settings"
    ON public.system_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE user_id = auth.uid()
            AND role = 'owner' -- Assuming owner/admin role. Adjust if needed based on RBAC
        )
        OR 
        EXISTS (
             SELECT 1 FROM auth.users
             WHERE id = auth.uid() 
             AND raw_app_meta_data->>'role' = 'admin' -- Or use app_metadata role
        )
    );

-- Authenticated users can read public settings or all settings? 
-- Usually config is needed by the app.
CREATE POLICY "Authenticated users can view system settings"
    ON public.system_settings
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anonymous users can view public system settings"
    ON public.system_settings
    FOR SELECT
    TO anon
    USING (is_public = true);

-- Functions to manage settings (optional, but good for type safety/audit later)
CREATE OR REPLACE FUNCTION public.get_system_settings()
RETURNS SETOF public.system_settings
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.system_settings ORDER BY "group", key;
$$;

CREATE OR REPLACE FUNCTION public.update_system_setting(
    p_key text,
    p_value jsonb
)
RETURNS public.system_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_setting public.system_settings;
BEGIN
    -- Check admin permission (simplified)
    IF NOT EXISTS (
        SELECT 1 FROM public.household_members 
        WHERE user_id = auth.uid() AND role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.system_settings
    SET value = p_value, updated_at = now()
    WHERE key = p_key
    RETURNING * INTO v_setting;

    RETURN v_setting;
END;
$$;

-- Seed initial settings
INSERT INTO public.system_settings (key, value, type, description, "group", is_public)
VALUES 
    ('maintenance_mode', 'false'::jsonb, 'boolean', 'Enable maintenance mode to block access', 'system', true),
    ('allow_registrations', 'true'::jsonb, 'boolean', 'Allow new users to register', 'feature_flags', true),
    ('enable_2fa', 'true'::jsonb, 'boolean', 'Enable Two-Factor Authentication support', 'feature_flags', true)
ON CONFLICT (key) DO NOTHING;
