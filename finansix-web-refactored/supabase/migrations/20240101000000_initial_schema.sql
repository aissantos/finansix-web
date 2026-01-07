-- ============================================
-- FINANSIX DATABASE SCHEMA
-- Version: 1.0.0
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE installment_status AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE reimbursement_status AS ENUM ('pending', 'partial', 'received', 'written_off');
CREATE TYPE account_type AS ENUM ('checking', 'savings', 'cash', 'investment');
CREATE TYPE recurrence_type AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'yearly');

-- ============================================
-- CORE TABLES
-- ============================================

-- Households (Multi-tenant root)
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Household members
CREATE TABLE household_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    display_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(household_id, user_id)
);

-- Bank accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type account_type NOT NULL,
    currency CHAR(3) DEFAULT 'BRL',
    initial_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    color VARCHAR(7),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Credit cards
CREATE TABLE credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    name VARCHAR(100) NOT NULL,
    last_four_digits CHAR(4),
    brand VARCHAR(30),
    color VARCHAR(7),
    icon VARCHAR(50),
    credit_limit DECIMAL(15,2) NOT NULL,
    closing_day SMALLINT NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day SMALLINT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    grace_period_days SMALLINT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id),
    name VARCHAR(50) NOT NULL,
    type transaction_type,
    color VARCHAR(7),
    icon VARCHAR(50),
    is_favorite BOOLEAN DEFAULT FALSE,
    default_amount DECIMAL(15,2),
    sort_order SMALLINT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    credit_card_id UUID REFERENCES credit_cards(id),
    category_id UUID REFERENCES categories(id),
    type transaction_type NOT NULL,
    status transaction_status DEFAULT 'completed',
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) DEFAULT 'BRL',
    description VARCHAR(255) NOT NULL,
    notes TEXT,
    is_installment BOOLEAN DEFAULT FALSE,
    total_installments SMALLINT DEFAULT 1 CHECK (total_installments >= 1),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_type recurrence_type,
    recurrence_end_date DATE,
    parent_transaction_id UUID REFERENCES transactions(id),
    is_reimbursable BOOLEAN DEFAULT FALSE,
    reimbursement_status reimbursement_status,
    reimbursement_source VARCHAR(100),
    reimbursed_amount DECIMAL(15,2) DEFAULT 0,
    transaction_date DATE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Installments
CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    credit_card_id UUID REFERENCES credit_cards(id),
    installment_number SMALLINT NOT NULL,
    total_installments SMALLINT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    billing_month DATE NOT NULL,
    due_date DATE NOT NULL,
    status installment_status DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    paid_amount DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(transaction_id, installment_number)
);

-- Credit card statements
CREATE TABLE credit_card_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    billing_month DATE NOT NULL,
    closing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    is_closed BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(credit_card_id, billing_month)
);

-- Expected transactions (recurring income/expenses)
CREATE TABLE expected_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    description VARCHAR(255) NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    recurrence_type recurrence_type NOT NULL,
    day_of_month SMALLINT CHECK (day_of_month BETWEEN 1 AND 31),
    day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
    start_date DATE NOT NULL,
    end_date DATE,
    confidence_percent SMALLINT DEFAULT 100 CHECK (confidence_percent BETWEEN 0 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_household_members_user ON household_members(user_id);
CREATE INDEX idx_household_members_household ON household_members(household_id);
CREATE INDEX idx_accounts_household ON accounts(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_credit_cards_household ON credit_cards(household_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_household ON categories(household_id) WHERE is_active = TRUE;
CREATE INDEX idx_transactions_household_date ON transactions(household_id, transaction_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_category ON transactions(household_id, category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_credit_card ON transactions(credit_card_id) WHERE credit_card_id IS NOT NULL;
CREATE INDEX idx_installments_billing_month ON installments(household_id, billing_month);
CREATE INDEX idx_installments_credit_card ON installments(credit_card_id, billing_month);
CREATE INDEX idx_installments_status ON installments(household_id, status) WHERE status = 'pending';

-- ============================================
-- VIEWS
-- ============================================

-- Credit card limits view
CREATE VIEW credit_card_limits AS
SELECT 
    cc.id,
    cc.household_id,
    cc.name,
    cc.credit_limit,
    cc.credit_limit - COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'pending'), 0) AS available_limit,
    COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'pending'), 0) AS used_limit
FROM credit_cards cc
LEFT JOIN installments i ON cc.id = i.credit_card_id
WHERE cc.deleted_at IS NULL AND cc.is_active = TRUE
GROUP BY cc.id;

-- Monthly summary view
CREATE VIEW monthly_summary AS
SELECT 
    t.household_id,
    DATE_TRUNC('month', t.transaction_date) AS month,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) AS balance
FROM transactions t
WHERE t.deleted_at IS NULL AND t.status = 'completed'
GROUP BY t.household_id, DATE_TRUNC('month', t.transaction_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expected_transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's household IDs
CREATE OR REPLACE FUNCTION get_user_household_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT household_id FROM household_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Households policies
CREATE POLICY "Users can view their households" ON households
    FOR SELECT USING (id IN (SELECT get_user_household_ids()));

CREATE POLICY "Users can create households" ON households
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Owners can update households" ON households
    FOR UPDATE USING (
        id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Household members policies
CREATE POLICY "Users can view members of their households" ON household_members
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids()));

CREATE POLICY "Owners can manage members" ON household_members
    FOR ALL USING (
        household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Accounts policies
CREATE POLICY "Users can view household accounts" ON accounts
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids()));

CREATE POLICY "Members can manage accounts" ON accounts
    FOR ALL USING (household_id IN (SELECT get_user_household_ids()));

-- Credit cards policies
CREATE POLICY "Users can view household cards" ON credit_cards
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids()));

CREATE POLICY "Members can manage cards" ON credit_cards
    FOR ALL USING (household_id IN (SELECT get_user_household_ids()));

-- Categories policies
CREATE POLICY "Users can view household categories" ON categories
    FOR SELECT USING (
        household_id IS NULL OR household_id IN (SELECT get_user_household_ids())
    );

CREATE POLICY "Members can manage categories" ON categories
    FOR ALL USING (household_id IN (SELECT get_user_household_ids()));

-- Transactions policies
CREATE POLICY "Users can view household transactions" ON transactions
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids()));

CREATE POLICY "Members can manage transactions" ON transactions
    FOR ALL USING (household_id IN (SELECT get_user_household_ids()));

-- Installments policies
CREATE POLICY "Users can view household installments" ON installments
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids()));

CREATE POLICY "Members can manage installments" ON installments
    FOR ALL USING (household_id IN (SELECT get_user_household_ids()));

-- Credit card statements policies
CREATE POLICY "Users can view household statements" ON credit_card_statements
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids()));

CREATE POLICY "Members can manage statements" ON credit_card_statements
    FOR ALL USING (household_id IN (SELECT get_user_household_ids()));

-- Expected transactions policies
CREATE POLICY "Users can view expected transactions" ON expected_transactions
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids()));

CREATE POLICY "Members can manage expected transactions" ON expected_transactions
    FOR ALL USING (household_id IN (SELECT get_user_household_ids()));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_households
    BEFORE UPDATE ON households
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_accounts
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_credit_cards
    BEFORE UPDATE ON credit_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_transactions
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_statements
    BEFORE UPDATE ON credit_card_statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to create household on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_household_id UUID;
BEGIN
    -- Create default household for new user
    INSERT INTO households (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'display_name', 'Minha Casa'))
    RETURNING id INTO new_household_id;
    
    -- Add user as owner
    INSERT INTO household_members (household_id, user_id, role, display_name)
    VALUES (
        new_household_id,
        NEW.id,
        'owner',
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to explode installments
CREATE OR REPLACE FUNCTION explode_installments()
RETURNS TRIGGER AS $$
DECLARE
    i INTEGER;
    billing_date DATE;
    due DATE;
    card_closing_day INTEGER;
    card_due_day INTEGER;
BEGIN
    IF NEW.is_installment AND NEW.total_installments > 1 AND NEW.credit_card_id IS NOT NULL THEN
        -- Get card billing info
        SELECT closing_day, due_day INTO card_closing_day, card_due_day
        FROM credit_cards WHERE id = NEW.credit_card_id;
        
        -- Generate installments
        FOR i IN 1..NEW.total_installments LOOP
            -- Calculate billing month (based on closing day)
            IF EXTRACT(DAY FROM NEW.transaction_date) > card_closing_day THEN
                billing_date := DATE_TRUNC('month', NEW.transaction_date) + INTERVAL '1 month' + (i - 1) * INTERVAL '1 month';
            ELSE
                billing_date := DATE_TRUNC('month', NEW.transaction_date) + (i - 1) * INTERVAL '1 month';
            END IF;
            
            -- Calculate due date
            due := billing_date + ((card_due_day - 1) || ' days')::INTERVAL;
            
            INSERT INTO installments (
                household_id,
                transaction_id,
                credit_card_id,
                installment_number,
                total_installments,
                amount,
                billing_month,
                due_date,
                status
            ) VALUES (
                NEW.household_id,
                NEW.id,
                NEW.credit_card_id,
                i,
                NEW.total_installments,
                ROUND(NEW.amount / NEW.total_installments, 2),
                billing_date,
                due,
                'pending'
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_explode_installments
    AFTER INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION explode_installments();

-- ============================================
-- SEED DEFAULT CATEGORIES
-- ============================================

INSERT INTO categories (household_id, name, type, color, icon, sort_order, is_favorite) VALUES
    (NULL, 'Alimentação', 'expense', '#EF4444', 'utensils', 1, true),
    (NULL, 'Transporte', 'expense', '#F97316', 'car', 2, true),
    (NULL, 'Moradia', 'expense', '#8B5CF6', 'home', 3, true),
    (NULL, 'Saúde', 'expense', '#EC4899', 'heart-pulse', 4, false),
    (NULL, 'Educação', 'expense', '#06B6D4', 'graduation-cap', 5, false),
    (NULL, 'Lazer', 'expense', '#10B981', 'gamepad-2', 6, true),
    (NULL, 'Compras', 'expense', '#F59E0B', 'shopping-bag', 7, true),
    (NULL, 'Assinaturas', 'expense', '#6366F1', 'repeat', 8, false),
    (NULL, 'Salário', 'income', '#22C55E', 'briefcase', 1, true),
    (NULL, 'Freelance', 'income', '#14B8A6', 'laptop', 2, false),
    (NULL, 'Investimentos', 'income', '#3B82F6', 'trending-up', 3, false),
    (NULL, 'Reembolso', 'income', '#A855F7', 'rotate-ccw', 4, false);
