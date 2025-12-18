/**
 * Migration script for AI Agent conversation history table
 * Run this after setting up the database schema
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
  });

  try {
    console.log('🔄 Running AI Agent migration...');
    
    const migrationPath = path.join(__dirname, '../../database/migrations/add_ai_agent_conversation_history.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    
    console.log('✅ AI Agent migration completed successfully!');
    console.log('📊 Conversation history table created');
    
    // Verify table was created
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'conversation_history'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('✅ Verified: conversation_history table exists');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Table already exists, skipping...');
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);

