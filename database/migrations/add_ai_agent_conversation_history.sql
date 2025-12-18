-- Migration: Add AI Agent Conversation History Table
-- Description: Stores conversation history for AI agent context

CREATE TABLE IF NOT EXISTS conversation_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  
  -- Message details
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_history_user ON conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_created ON conversation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_created ON conversation_history(user_id, created_at DESC);

