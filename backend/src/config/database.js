/**
 * Database Configuration
 * PostgreSQL connection pool
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

// Test connection (async)
(async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection test successful');
  } catch (err) {
    console.error('❌ Database connection test failed:', err.message);
  }
})();

module.exports = pool;

