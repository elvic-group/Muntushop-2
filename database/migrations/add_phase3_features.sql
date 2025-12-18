-- Phase 3 Features Migration
-- Loyalty Program, Referral System, Recommendations, Order Scheduling

-- ============================================
-- LOYALTY & REWARDS PROGRAM
-- ============================================

-- Loyalty tiers configuration
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    min_points INTEGER NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    cashback_percentage DECIMAL(5, 2) DEFAULT 0,
    free_shipping BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    early_access BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tiers
INSERT INTO loyalty_tiers (name, min_points, discount_percentage, cashback_percentage, free_shipping, priority_support, early_access)
VALUES
    ('Bronze', 0, 0, 1.0, false, false, false),
    ('Silver', 500, 5.0, 2.0, false, false, false),
    ('Gold', 1500, 10.0, 3.0, true, true, false),
    ('Platinum', 5000, 15.0, 5.0, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- User loyalty points
CREATE TABLE IF NOT EXISTS loyalty_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    available_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    current_tier_id INTEGER REFERENCES loyalty_tiers(id),
    tier_updated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Loyalty transactions (earn/redeem history)
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- earn, redeem, expire, adjustment
    points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_type VARCHAR(50), -- order, referral, bonus, reward
    reference_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rewards catalog (items to redeem with points)
CREATE TABLE IF NOT EXISTS rewards_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- discount_coupon, free_product, cashback, free_shipping
    reward_value DECIMAL(10, 2),
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User redeemed rewards
CREATE TABLE IF NOT EXISTS redeemed_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_id INTEGER NOT NULL REFERENCES rewards_catalog(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, used, expired
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- REFERRAL SYSTEM
-- ============================================

-- User referral codes
CREATE TABLE IF NOT EXISTS user_referrals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL UNIQUE,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    total_earned DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, rewarded
    referrer_reward DECIMAL(10, 2) DEFAULT 0,
    referred_reward DECIMAL(10, 2) DEFAULT 0,
    first_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referred_id)
);

-- ============================================
-- PRODUCT RECOMMENDATIONS
-- ============================================

-- User preferences and behavior tracking
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    favorite_categories JSONB DEFAULT '[]',
    price_range_min DECIMAL(10, 2),
    price_range_max DECIMAL(10, 2),
    viewed_products JSONB DEFAULT '[]',
    searched_keywords JSONB DEFAULT '[]',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- AI-generated recommendations
CREATE TABLE IF NOT EXISTS product_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL, -- similar, trending, personalized, frequently_bought
    score DECIMAL(5, 2) DEFAULT 0,
    reason TEXT,
    is_viewed BOOLEAN DEFAULT false,
    is_clicked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- ============================================
-- ORDER SCHEDULING
-- ============================================

-- Scheduled and recurring orders
CREATE TABLE IF NOT EXISTS scheduled_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_type VARCHAR(20) NOT NULL, -- one_time, recurring, subscription
    items JSONB NOT NULL,
    delivery_address_id INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    frequency VARCHAR(20), -- weekly, biweekly, monthly
    next_execution DATE,
    last_execution DATE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, paused, completed, cancelled
    executions_count INTEGER DEFAULT 0,
    max_executions INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled order execution history
CREATE TABLE IF NOT EXISTS scheduled_order_executions (
    id SERIAL PRIMARY KEY,
    scheduled_order_id INTEGER NOT NULL REFERENCES scheduled_orders(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    execution_date TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL, -- success, failed, skipped
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Loyalty indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_tier ON loyalty_points(current_tier_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
CREATE INDEX IF NOT EXISTS idx_rewards_catalog_active ON rewards_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_user_id ON redeemed_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_status ON redeemed_rewards(status);

-- Referral indexes
CREATE INDEX IF NOT EXISTS idx_user_referrals_user_id ON user_referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON product_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_product_id ON product_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON product_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_expires ON product_recommendations(expires_at);

-- Scheduling indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_orders_user_id ON scheduled_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_orders_status ON scheduled_orders(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_orders_next_exec ON scheduled_orders(next_execution);
CREATE INDEX IF NOT EXISTS idx_scheduled_executions_scheduled_id ON scheduled_order_executions(scheduled_order_id);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-create loyalty account for new users
CREATE OR REPLACE FUNCTION create_loyalty_account_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create loyalty points account
    INSERT INTO loyalty_points (user_id, total_points, available_points, current_tier_id)
    SELECT NEW.id, 0, 0, id FROM loyalty_tiers WHERE name = 'Bronze' LIMIT 1
    ON CONFLICT (user_id) DO NOTHING;

    -- Create referral code (first 3 letters of name + 5 random digits)
    INSERT INTO user_referrals (user_id, referral_code)
    VALUES (
        NEW.id,
        UPPER(SUBSTRING(COALESCE(NEW.name, 'USER'), 1, 3)) || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0')
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_loyalty_account ON users;
CREATE TRIGGER trigger_create_loyalty_account
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_loyalty_account_for_user();

-- Auto-update loyalty tier when points change
CREATE OR REPLACE FUNCTION update_loyalty_tier()
RETURNS TRIGGER AS $$
DECLARE
    new_tier_id INTEGER;
BEGIN
    -- Find appropriate tier based on total points
    SELECT id INTO new_tier_id
    FROM loyalty_tiers
    WHERE NEW.total_points >= min_points
    ORDER BY min_points DESC
    LIMIT 1;

    -- Update tier if changed
    IF new_tier_id != OLD.current_tier_id THEN
        NEW.current_tier_id = new_tier_id;
        NEW.tier_updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_loyalty_tier ON loyalty_points;
CREATE TRIGGER trigger_update_loyalty_tier
    BEFORE UPDATE ON loyalty_points
    FOR EACH ROW
    WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
    EXECUTE FUNCTION update_loyalty_tier();

-- Auto-create user preferences on first interaction
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_user_preferences ON users;
CREATE TRIGGER trigger_create_user_preferences
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_preferences();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE loyalty_tiers IS 'Loyalty program tier definitions';
COMMENT ON TABLE loyalty_points IS 'User loyalty points balances and tier status';
COMMENT ON TABLE loyalty_transactions IS 'History of points earned and redeemed';
COMMENT ON TABLE rewards_catalog IS 'Available rewards for redemption';
COMMENT ON TABLE redeemed_rewards IS 'User redeemed rewards tracking';

COMMENT ON TABLE user_referrals IS 'User referral codes and stats';
COMMENT ON TABLE referrals IS 'Referral tracking and rewards';

COMMENT ON TABLE user_preferences IS 'User shopping preferences and behavior';
COMMENT ON TABLE product_recommendations IS 'AI-generated product recommendations';

COMMENT ON TABLE scheduled_orders IS 'Future and recurring orders';
COMMENT ON TABLE scheduled_order_executions IS 'Scheduled order execution history';
