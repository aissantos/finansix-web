-- RPC for database metrics (System Health)
-- Note: Real CPU metrics require extensions or external monitoring. 
-- We will simulate CPU load for this demo and return real connection counts.

CREATE OR REPLACE FUNCTION get_database_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_active_connections INT;
    v_simulated_cpu INT;
    v_result JSON;
BEGIN
    -- Get real active connections count
    SELECT COUNT(*) 
    INTO v_active_connections 
    FROM pg_stat_activity 
    WHERE state = 'active';

    -- Simulate CPU usage (random between 5 and 45 for healthy demo)
    -- In a real scenario, this would come from a monitoring table or external service
    v_simulated_cpu := floor(random() * 40 + 5)::int;

    v_result := json_build_object(
        'cpu', v_simulated_cpu,
        'connections', v_active_connections,
        'memory_usage', floor(random() * 30 + 20)::int, -- Simulated percentage
        'timestamp', NOW()
    );

    RETURN v_result;
END;
$$;

-- Grant execute to authenticated users (admins)
GRANT EXECUTE ON FUNCTION get_database_metrics() TO authenticated;
