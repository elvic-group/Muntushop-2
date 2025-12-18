-- Admin Features Migration
-- Adds admin role, tracking, and audit logging

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'customer';

-- Add tracking columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS carrier VARCHAR(50),
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Create admin_actions table for audit logging
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_phone VARCHAR(20) NOT NULL,
    admin_name VARCHAR(100),
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_carrier ON orders(carrier);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_phone);
CREATE INDEX IF NOT EXISTS idx_admin_actions_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions(created_at);

-- Add comments for documentation
COMMENT ON COLUMN users.role IS 'User role: customer or admin';
COMMENT ON COLUMN orders.tracking_number IS 'Shipping tracking number';
COMMENT ON COLUMN orders.carrier IS 'Shipping carrier (DHL, FedEx, UPS, etc)';
COMMENT ON COLUMN orders.tracking_url IS 'Full tracking URL';
COMMENT ON COLUMN orders.shipped_at IS 'When order was shipped';
COMMENT ON COLUMN orders.delivered_at IS 'When order was delivered';
COMMENT ON TABLE admin_actions IS 'Audit log of all admin actions';

-- Create view for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as orders_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as orders_this_week,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as orders_this_month,
    SUM(total) FILTER (WHERE created_at::date = CURRENT_DATE) as revenue_today,
    SUM(total) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as revenue_this_week,
    SUM(total) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as revenue_this_month,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_payment,
    COUNT(*) FILTER (WHERE status = 'pending_delivery') as pending_delivery,
    COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE refund_status != 'none') as refunded,
    COUNT(*) FILTER (WHERE dispute_status = 'disputed') as disputed,
    COUNT(*) FILTER (WHERE escrow_status = 'held') as in_escrow
FROM orders;

-- Grant permissions (if needed)
-- GRANT SELECT ON admin_dashboard_stats TO your_app_user;
