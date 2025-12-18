-- Admin PIN Security Migration
-- Adds PIN protection for admin panel access

-- Add PIN column to users table (hashed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_pin_hash VARCHAR(255);

-- Add PIN reset token columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_reset_token VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_reset_expires TIMESTAMP;

-- Add last unlock timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_admin_unlock TIMESTAMP;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_pin_reset ON users(pin_reset_token);

-- Add comments
COMMENT ON COLUMN users.admin_pin_hash IS '4-digit PIN hash for admin panel access';
COMMENT ON COLUMN users.pin_reset_token IS 'Token for PIN reset verification';
COMMENT ON COLUMN users.pin_reset_expires IS 'Expiration time for reset token';
COMMENT ON COLUMN users.last_admin_unlock IS 'Last time admin unlocked panel';
