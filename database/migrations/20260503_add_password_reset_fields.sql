ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_password_token_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_password_expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_reset_password_expires_at
  ON users(reset_password_expires_at);
