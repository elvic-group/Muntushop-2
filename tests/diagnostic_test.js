// Comprehensive Diagnostic Test Script
// Tests all platform features and logs issues

const pool = require('./backend/src/config/database');
const AIAgent = require('./services/aiAgent');
const Phase2Service = require('./services/phase2Service');
const Phase3Service = require('./services/phase3Service');
const UserPanelService = require('./services/userPanelService');
const OrderService = require('./services/orderService');
const AdminService = require('./services/adminService');

const TEST_PHONE = '4796701573'; // Use real existing phone (no @c.us, no spaces)
const ADMIN_PHONE = '4796701573'; // Admin phone normalized

const bugs = [];
const passed = [];

async function log(test, status, details = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  const msg = `${icon} ${test}: ${status}${details ? ' - ' + details : ''}`;
  console.log(msg);

  if (status === 'PASS') {
    passed.push(test);
  } else {
    bugs.push({ test, details });
  }
}

async function testDatabaseTables() {
  console.log('\n📊 TESTING DATABASE TABLES...\n');

  const requiredTables = [
    'users', 'products', 'orders', 'carts', 'addresses',
    'wallets', 'transactions', 'wishlist', 'reviews', 'notifications',
    'loyalty_tiers', 'loyalty_points', 'loyalty_transactions',
    'rewards_catalog', 'redeemed_rewards', 'user_referrals', 'referrals',
    'user_preferences', 'product_recommendations', 'scheduled_orders'
  ];

  for (const table of requiredTables) {
    try {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      await log(`Table: ${table}`, 'PASS', `${result.rows[0].count} rows`);
    } catch (error) {
      await log(`Table: ${table}`, 'FAIL', error.message);
    }
  }
}

async function testUserPanelFeatures() {
  console.log('\n👤 TESTING USER PANEL FEATURES...\n');

  try {
    // Test dashboard
    const dashboard = await UserPanelService.getDashboard(TEST_PHONE);
    if (dashboard.includes('MY ACCOUNT') && dashboard.includes('Type a number (1-13)')) {
      await log('User Dashboard', 'PASS');
    } else {
      await log('User Dashboard', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('User Dashboard', 'FAIL', error.message);
  }

  try {
    // Test categories
    const categories = await UserPanelService.getCategories();
    if (categories.includes('BROWSE PRODUCTS')) {
      await log('Browse Categories', 'PASS');
    } else {
      await log('Browse Categories', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Browse Categories', 'FAIL', error.message);
  }

  try {
    // Test help menu
    const help = UserPanelService.getHelpMenu();
    if (help.includes('HELP & SUPPORT')) {
      await log('Help Menu', 'PASS');
    } else {
      await log('Help Menu', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Help Menu', 'FAIL', error.message);
  }
}

async function testPhase2Features() {
  console.log('\n💎 TESTING PHASE 2 FEATURES...\n');

  try {
    // Test wallet
    const wallet = await Phase2Service.getWallet(TEST_PHONE);
    if (wallet.includes('MY WALLET') || wallet.includes('not found')) {
      await log('Wallet Display', 'PASS');
    } else {
      await log('Wallet Display', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Wallet Display', 'FAIL', error.message);
  }

  try {
    // Test wishlist
    const wishlist = await Phase2Service.getWishlist(TEST_PHONE);
    if (wishlist.includes('WISHLIST') || wishlist.includes('empty')) {
      await log('Wishlist Display', 'PASS');
    } else {
      await log('Wishlist Display', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Wishlist Display', 'FAIL', error.message);
  }

  try {
    // Test notifications
    const notifs = await Phase2Service.getNotifications(TEST_PHONE);
    if (notifs.includes('NOTIFICATIONS')) {
      await log('Notifications Display', 'PASS');
    } else {
      await log('Notifications Display', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Notifications Display', 'FAIL', error.message);
  }
}

async function testPhase3Features() {
  console.log('\n🏆 TESTING PHASE 3 FEATURES...\n');

  try {
    // Test loyalty status
    const loyalty = await Phase3Service.getLoyaltyStatus(TEST_PHONE);
    if (loyalty.includes('LOYALTY REWARDS') || loyalty.includes('not found')) {
      await log('Loyalty Status', 'PASS');
    } else {
      await log('Loyalty Status', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Loyalty Status', 'FAIL', error.message);
  }

  try {
    // Test rewards catalog
    const rewards = await Phase3Service.getRewardsCatalog();
    if (rewards.includes('REWARDS CATALOG')) {
      await log('Rewards Catalog', 'PASS');
    } else {
      await log('Rewards Catalog', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Rewards Catalog', 'FAIL', error.message);
  }

  try {
    // Test referral status
    const referral = await Phase3Service.getReferralStatus(TEST_PHONE);
    if (referral.includes('REFERRAL PROGRAM') || referral.includes('not found')) {
      await log('Referral Status', 'PASS');
    } else {
      await log('Referral Status', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Referral Status', 'FAIL', error.message);
  }

  try {
    // Test recommendations
    const recs = await Phase3Service.getRecommendations(TEST_PHONE);
    if (recs.includes('RECOMMENDED') || recs.includes('TRENDING') || recs.includes('not found')) {
      await log('Recommendations', 'PASS');
    } else {
      await log('Recommendations', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Recommendations', 'FAIL', error.message);
  }

  try {
    // Test scheduled orders
    const scheduled = await Phase3Service.getScheduledOrders(TEST_PHONE);
    if (scheduled.includes('SCHEDULED ORDERS')) {
      await log('Scheduled Orders', 'PASS');
    } else {
      await log('Scheduled Orders', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Scheduled Orders', 'FAIL', error.message);
  }
}

async function testAdminFeatures() {
  console.log('\n🔐 TESTING ADMIN FEATURES...\n');

  try {
    // Test admin check
    const isAdmin = await AdminService.isAdmin(ADMIN_PHONE);
    await log('Admin Check', isAdmin ? 'PASS' : 'FAIL', `isAdmin: ${isAdmin}`);
  } catch (error) {
    await log('Admin Check', 'FAIL', error.message);
  }

  try {
    // Test admin dashboard
    const dashboard = await AdminService.getDashboard();
    if (dashboard.includes('ADMIN DASHBOARD')) {
      await log('Admin Dashboard', 'PASS');
    } else {
      await log('Admin Dashboard', 'FAIL', 'Missing content');
    }
  } catch (error) {
    await log('Admin Dashboard', 'FAIL', error.message);
  }
}

async function runDiagnostics() {
  console.log('🔍 STARTING COMPREHENSIVE DIAGNOSTIC TEST\n');
  console.log('==========================================\n');

  await testDatabaseTables();
  await testUserPanelFeatures();
  await testPhase2Features();
  await testPhase3Features();
  await testAdminFeatures();

  console.log('\n==========================================');
  console.log('\n📊 DIAGNOSTIC SUMMARY\n');
  console.log(`✅ Tests Passed: ${passed.length}`);
  console.log(`❌ Tests Failed: ${bugs.length}\n`);

  if (bugs.length > 0) {
    console.log('🐛 BUGS FOUND:\n');
    bugs.forEach((bug, index) => {
      console.log(`${index + 1}. ${bug.test}`);
      console.log(`   ${bug.details}\n`);
    });
  }

  await pool.end();
  process.exit(bugs.length > 0 ? 1 : 0);
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('❌ Fatal error during diagnostics:', error);
  pool.end();
  process.exit(1);
});
