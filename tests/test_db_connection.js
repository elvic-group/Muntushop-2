/**
 * Test Heroku Database Connection
 */

require('dotenv').config();
const { Client } = require('pg');

async function testDatabaseConnection() {
    console.log('🔍 Testing Heroku Database Connection...\n');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // Connect to database
        console.log('1️⃣ Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully!\n');

        // Test query - Get database version
        console.log('2️⃣ Testing query (database version)...');
        const versionResult = await client.query('SELECT version();');
        console.log('✅ PostgreSQL Version:', versionResult.rows[0].version.split(' ')[1]);
        console.log();

        // Count tables
        console.log('3️⃣ Counting tables...');
        const tablesResult = await client.query(`
            SELECT COUNT(*) as table_count
            FROM information_schema.tables
            WHERE table_schema = 'public'
        `);
        console.log('✅ Total Tables:', tablesResult.rows[0].table_count);
        console.log();

        // List all tables
        console.log('4️⃣ Listing all tables...');
        const listResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log('✅ Tables:');
        listResult.rows.forEach(row => {
            console.log('   -', row.table_name);
        });
        console.log();

        // Check users table
        console.log('5️⃣ Checking users table...');
        const usersResult = await client.query('SELECT COUNT(*) as user_count FROM users');
        console.log('✅ Total Users:', usersResult.rows[0].user_count);
        console.log();

        // Check products table
        console.log('6️⃣ Checking products table...');
        const productsResult = await client.query('SELECT COUNT(*) as product_count FROM products');
        console.log('✅ Total Products:', productsResult.rows[0].product_count);
        console.log();

        // Check orders table
        console.log('7️⃣ Checking orders table...');
        const ordersResult = await client.query('SELECT COUNT(*) as order_count FROM orders');
        console.log('✅ Total Orders:', ordersResult.rows[0].order_count);
        console.log();

        // Database size
        console.log('8️⃣ Checking database size...');
        const sizeResult = await client.query(`
            SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `);
        console.log('✅ Database Size:', sizeResult.rows[0].size);
        console.log();

        console.log('🎉 All tests passed! Database is fully operational!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await client.end();
        console.log('🔌 Connection closed.');
    }
}

// Run tests
testDatabaseConnection().catch(console.error);
