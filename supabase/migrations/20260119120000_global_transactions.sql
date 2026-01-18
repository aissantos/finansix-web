-- Indexes for global admin queries (Analytics & Monitoring)
CREATE INDEX IF NOT EXISTS idx_transactions_date_global ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- RPC for aggregate stats (Global Financial Overview)
CREATE OR REPLACE FUNCTION get_aggregate_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_income DECIMAL;
    v_total_expenses DECIMAL;
    v_total_transactions BIGINT;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Default to last 30 days if null
    v_end_date := COALESCE(end_date, CURRENT_DATE);
    v_start_date := COALESCE(start_date, v_end_date - INTERVAL '30 days');

    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
        COUNT(*)
    INTO v_total_income, v_total_expenses, v_total_transactions
    FROM transactions
    WHERE transaction_date BETWEEN v_start_date AND v_end_date
    AND deleted_at IS NULL;

    RETURN json_build_object(
        'total_income', v_total_income,
        'total_expenses', v_total_expenses,
        'net_balance', v_total_income - v_total_expenses,
        'total_transactions', v_total_transactions
    );
END;
$$;
