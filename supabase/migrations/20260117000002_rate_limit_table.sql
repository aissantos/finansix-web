-- RATE LIMITING SYSTEM
-- Implements a token bucket / fixed window rate limiter for Edge Functions

CREATE TABLE function_rate_limits (
    key TEXT PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    request_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (essentially locking it down to service_role/postgres)
ALTER TABLE function_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role full access" ON function_rate_limits
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- RPC Function for atomic rate limit checking
CREATE OR REPLACE FUNCTION check_rate_limit(
    rate_key TEXT,
    max_requests INTEGER,
    window_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    entry RECORD;
BEGIN
    -- cleanup old keys opportunisticly (could be done via cron)
    -- DELETE FROM function_rate_limits WHERE window_start < NOW() - INTERVAL '1 day';

    SELECT * INTO entry FROM function_rate_limits WHERE key = rate_key;

    IF entry IS NULL OR entry.window_start < (NOW() - (window_seconds || ' seconds')::INTERVAL) THEN
        -- New window (Start or Reset)
        INSERT INTO function_rate_limits (key, window_start, request_count)
        VALUES (rate_key, NOW(), 1)
        ON CONFLICT (key) DO UPDATE
        SET window_start = NOW(), request_count = 1;
        
        RETURN TRUE;
    ELSE
        -- Current window
        IF entry.request_count < max_requests THEN
            UPDATE function_rate_limits
            SET request_count = request_count + 1
            WHERE key = rate_key;
            RETURN TRUE;
        ELSE
            RETURN FALSE;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
