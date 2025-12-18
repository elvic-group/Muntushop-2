-- Add refund, escrow, and dispute columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS escrow_status VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS escrow_hold_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS dispute_status VARCHAR(50) DEFAULT 'none';

-- Create payment_disputes table
CREATE TABLE IF NOT EXISTS payment_disputes (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL REFERENCES orders(order_number),
    dispute_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(50) DEFAULT 'needs_response',
    evidence_submitted BOOLEAN DEFAULT FALSE,
    evidence_submitted_at TIMESTAMP,
    evidence_due_by TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_disputes_order_number ON payment_disputes(order_number);
CREATE INDEX IF NOT EXISTS idx_disputes_dispute_id ON payment_disputes(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON orders(refund_status);
CREATE INDEX IF NOT EXISTS idx_orders_escrow_status ON orders(escrow_status);
CREATE INDEX IF NOT EXISTS idx_orders_dispute_status ON orders(dispute_status);

-- Add comments for documentation
COMMENT ON COLUMN orders.refund_status IS 'Refund status: none, refunded, partially_refunded';
COMMENT ON COLUMN orders.escrow_status IS 'Escrow status: none, held, released';
COMMENT ON COLUMN orders.dispute_status IS 'Dispute status: none, disputed, won, lost';
COMMENT ON TABLE payment_disputes IS 'Tracks payment disputes and chargebacks from Stripe';
