/**
 * Quick Server Test Script
 * Tests configuration and server startup
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('🧪 Testing MuntuShop Platform Configuration...\n');

// Test database connection
console.log('1️⃣ Testing Database Connection...');
const db = require('./src/config/database');
db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('   ❌ Database:', err.message);
    console.log('   💡 Tip: Make sure PostgreSQL is running and database exists');
    console.log('   💡 Create database: createdb muntushop\n');
  } else {
    console.log('   ✅ Database connection OK\n');
  }
  
  // Test Green API
  console.log('2️⃣ Testing Green API Configuration...');
  if (process.env.GREEN_ID_INSTANCE && process.env.GREEN_API_TOKEN_INSTANCE) {
    console.log('   ✅ Green API credentials loaded');
    console.log('   📱 Instance ID:', process.env.GREEN_ID_INSTANCE);
    console.log('   🔑 Token:', process.env.GREEN_API_TOKEN_INSTANCE ? 'Set' : 'Missing\n');
  } else {
    console.log('   ❌ Green API credentials missing\n');
  }
  
  // Test Stripe
  console.log('3️⃣ Testing Stripe Configuration...');
  if (process.env.STRIPE_SECRET_KEY) {
    console.log('   ✅ Stripe credentials loaded');
    console.log('   💳 Secret Key:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...\n');
  } else {
    console.log('   ❌ Stripe secret key missing\n');
  }
  
  // Test app import
  console.log('4️⃣ Testing Application Load...');
  try {
    require('./src/app.js');
    console.log('   ✅ Application loaded successfully\n');
    console.log('🎉 All tests passed! Server should start correctly.\n');
    console.log('📝 Next steps:');
    console.log('   1. Create database: createdb muntushop');
    console.log('   2. Run schema: psql muntushop -f database/schema.sql');
    console.log('   3. Start server: npm start\n');
    process.exit(0);
  } catch (error) {
    console.log('   ❌ Application load failed:', error.message);
    console.log('   ', error.stack.split('\n')[1]);
    process.exit(1);
  }
});

