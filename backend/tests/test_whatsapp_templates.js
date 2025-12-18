/**
 * WhatsApp Templates Test Suite
 * Tests all message templates for proper functionality and error handling
 */

const templates = require('../src/templates/whatsapp');

// Test results tracking
const results = {
  passed: [],
  failed: [],
  total: 0
};

function test(name, fn) {
  results.total++;
  try {
    const result = fn();
    if (result === true || (typeof result === 'string' && result.length > 0)) {
      results.passed.push(name);
      console.log(`✅ PASS: ${name}`);
      return true;
    } else {
      results.failed.push(name);
      console.log(`❌ FAIL: ${name} - Invalid return value`);
      return false;
    }
  } catch (error) {
    results.failed.push(name);
    console.log(`❌ FAIL: ${name} - ${error.message}`);
    console.error(error);
    return false;
  }
}

console.log('🧪 Testing WhatsApp Message Templates\n');
console.log('='.repeat(60));

// ============================================
// MENUS TEMPLATES
// ============================================
console.log('\n📋 Testing Menus Templates...\n');

test('mainMenu() - returns valid menu', () => {
  const menu = templates.main.mainMenu();
  return typeof menu === 'string' && menu.includes('MuntuShop') && menu.length > 50;
});

test('helpMessage() - returns valid help message', () => {
  const help = templates.main.helpMessage();
  return typeof help === 'string' && help.includes('HELP') && help.length > 50;
});

test('welcomeMessage() - with name parameter', () => {
  const msg = templates.main.welcomeMessage('John');
  return typeof msg === 'string' && msg.includes('John') && msg.length > 50;
});

test('welcomeMessage() - without name parameter', () => {
  const msg = templates.main.welcomeMessage();
  return typeof msg === 'string' && msg.includes('Welcome') && msg.length > 50;
});

test('welcomeMessage() - with null name', () => {
  const msg = templates.main.welcomeMessage(null);
  return typeof msg === 'string' && msg.includes('Welcome') && msg.length > 50;
});

test('serviceNotImplemented() - with service name', () => {
  const msg = templates.main.serviceNotImplemented('Shopping');
  return typeof msg === 'string' && msg.includes('Shopping') && msg.length > 50;
});

test('serviceNotImplemented() - without service name', () => {
  const msg = templates.main.serviceNotImplemented();
  return typeof msg === 'string' && msg.includes('Coming Soon') && msg.length > 50;
});

test('serviceNotImplemented() - with null', () => {
  const msg = templates.main.serviceNotImplemented(null);
  return typeof msg === 'string' && msg.length > 50;
});

// ============================================
// SHOPPING TEMPLATES
// ============================================
console.log('\n🛍️  Testing Shopping Templates...\n');

test('shopping.menu() - returns valid menu', () => {
  const menu = templates.shopping.menu();
  return typeof menu === 'string' && menu.includes('SHOPPING') && menu.length > 50;
});

test('shopping.phoneAccessories() - returns valid list', () => {
  const list = templates.shopping.phoneAccessories();
  return typeof list === 'string' && list.includes('PHONE ACCESSORIES') && list.length > 50;
});

test('shopping.productDetail() - with valid product', () => {
  const product = {
    name: 'Test Product',
    price: 10.99,
    rating: 4.5,
    reviews_count: 100,
    description: 'Test description',
    stock_quantity: 10
  };
  const detail = templates.shopping.productDetail(product);
  return typeof detail === 'string' && 
         detail.includes('Test Product') && 
         detail.includes('$10.99') &&
         detail.length > 50;
});

test('shopping.productDetail() - with null product', () => {
  const detail = templates.shopping.productDetail(null);
  return typeof detail === 'string' && detail.includes('not found');
});

test('shopping.productDetail() - with missing fields', () => {
  const product = { name: 'Test' };
  const detail = templates.shopping.productDetail(product);
  return typeof detail === 'string' && detail.length > 50;
});

test('shopping.addedToCart() - with valid product and total', () => {
  const product = { name: 'Test Product', price: 10.99 };
  const msg = templates.shopping.addedToCart(product, 25.50);
  return typeof msg === 'string' && 
         msg.includes('Added to cart') && 
         msg.includes('Test Product') &&
         msg.includes('$25.50') &&
         msg.length > 50;
});

test('shopping.addedToCart() - with null product', () => {
  const msg = templates.shopping.addedToCart(null, 10);
  return typeof msg === 'string' && msg.includes('Error');
});

test('shopping.addedToCart() - with missing product fields', () => {
  const product = {};
  const msg = templates.shopping.addedToCart(product, 10);
  return typeof msg === 'string' && msg.length > 50;
});

test('shopping.addedToCart() - with null total', () => {
  const product = { name: 'Test', price: 10 };
  const msg = templates.shopping.addedToCart(product, null);
  return typeof msg === 'string' && msg.length > 50;
});

test('shopping.cart() - with valid items and total', () => {
  const items = [
    { name: 'Product 1', price: 10, quantity: 2 },
    { name: 'Product 2', price: 5, quantity: 1 }
  ];
  const msg = templates.shopping.cart(items, 25);
  return typeof msg === 'string' && 
         msg.includes('SHOPPING CART') && 
         msg.includes('Product 1') &&
         msg.includes('$25.00') &&
         msg.length > 50;
});

test('shopping.cart() - with empty items array', () => {
  const msg = templates.shopping.cart([], 0);
  return typeof msg === 'string' && msg.includes('empty');
});

test('shopping.cart() - with null items', () => {
  const msg = templates.shopping.cart(null, 0);
  return typeof msg === 'string' && msg.includes('empty');
});

test('shopping.cart() - with invalid items (not array)', () => {
  const msg = templates.shopping.cart('not an array', 0);
  return typeof msg === 'string' && msg.includes('empty');
});

test('shopping.cart() - with missing item fields', () => {
  const items = [{ name: 'Test' }];
  const msg = templates.shopping.cart(items, 10);
  return typeof msg === 'string' && msg.length > 50;
});

test('shopping.checkout() - with valid total', () => {
  const msg = templates.shopping.checkout(25.50);
  return typeof msg === 'string' && 
         msg.includes('CHECKOUT') && 
         msg.includes('$25.50') &&
         msg.length > 50;
});

test('shopping.checkout() - with null total', () => {
  const msg = templates.shopping.checkout(null);
  return typeof msg === 'string' && msg.includes('$0.00');
});

test('shopping.checkout() - with string total', () => {
  const msg = templates.shopping.checkout('25.50');
  return typeof msg === 'string' && msg.includes('$0.00');
});

test('shopping.paymentOptions() - with valid total', () => {
  const msg = templates.shopping.paymentOptions(25.50);
  return typeof msg === 'string' && 
         msg.includes('PAYMENT OPTIONS') && 
         msg.includes('$25.50') &&
         msg.length > 50;
});

test('shopping.paymentOptions() - with null total', () => {
  const msg = templates.shopping.paymentOptions(null);
  return typeof msg === 'string' && msg.includes('$0.00');
});

test('shopping.stripePayment() - with valid parameters', () => {
  const msg = templates.shopping.stripePayment('https://stripe.com/pay', 'ORD-123');
  return typeof msg === 'string' && 
         msg.includes('STRIPE PAYMENT') && 
         msg.includes('ORD-123') &&
         msg.includes('https://stripe.com/pay') &&
         msg.length > 50;
});

test('shopping.stripePayment() - with null paymentUrl', () => {
  const msg = templates.shopping.stripePayment(null, 'ORD-123');
  return typeof msg === 'string' && msg.includes('Error');
});

test('shopping.stripePayment() - with null orderNumber', () => {
  const msg = templates.shopping.stripePayment('https://stripe.com/pay', null);
  return typeof msg === 'string' && msg.includes('N/A');
});

test('shopping.stripePayment() - with both null', () => {
  const msg = templates.shopping.stripePayment(null, null);
  return typeof msg === 'string' && msg.includes('Error');
});

test('shopping.orderConfirmation() - with valid parameters', () => {
  const items = [
    { name: 'Product 1', quantity: 2 },
    { name: 'Product 2', quantity: 1 }
  ];
  const msg = templates.shopping.orderConfirmation('ORD-123', 25.50, items);
  return typeof msg === 'string' && 
         msg.includes('ORDER CONFIRMED') && 
         msg.includes('ORD-123') &&
         msg.includes('$25.50') &&
         msg.length > 50;
});

test('shopping.orderConfirmation() - with null items', () => {
  const msg = templates.shopping.orderConfirmation('ORD-123', 25.50, null);
  return typeof msg === 'string' && msg.length > 50;
});

test('shopping.paymentSuccess() - with valid parameters', () => {
  const msg = templates.shopping.paymentSuccess('ORD-123', 25.50);
  return typeof msg === 'string' && 
         msg.includes('PAYMENT SUCCESSFUL') && 
         msg.includes('ORD-123') &&
         msg.includes('$25.50') &&
         msg.length > 50;
});

test('shopping.orderStatus() - with valid parameters', () => {
  const msg = templates.shopping.orderStatus('ORD-123', 'shipped', 'TRACK123');
  return typeof msg === 'string' && 
         msg.includes('ORDER STATUS') && 
         msg.includes('ORD-123') &&
         msg.includes('shipped') &&
         msg.includes('TRACK123') &&
         msg.length > 50;
});

test('shopping.ordersList() - with valid orders', () => {
  const orders = [
    { order_number: 'ORD-1', status: 'pending', total: 10.00, created_at: new Date() },
    { order_number: 'ORD-2', status: 'shipped', total: 20.00, created_at: new Date() }
  ];
  const msg = templates.shopping.ordersList(orders);
  return typeof msg === 'string' && 
         msg.includes('YOUR ORDERS') && 
         msg.includes('ORD-1') &&
         msg.includes('ORD-2') &&
         msg.length > 50;
});

test('shopping.ordersList() - with empty orders', () => {
  const msg = templates.shopping.ordersList([]);
  return typeof msg === 'string' && msg.includes('No orders');
});

test('shopping.productList() - with valid products', () => {
  const products = [
    { name: 'Product 1', price: 10.00, rating: 4.5 },
    { name: 'Product 2', price: 20.00, rating: 4.8 }
  ];
  const msg = templates.shopping.productList(products, 'Electronics');
  return typeof msg === 'string' && 
         msg.includes('Electronics') && 
         msg.includes('Product 1') &&
         msg.includes('Product 2') &&
         msg.length > 50;
});

test('shopping.reviewsList() - with valid reviews', () => {
  const reviews = [
    { rating: 5, content: 'Great product!' },
    { rating: 4, content: 'Good value' }
  ];
  const msg = templates.shopping.reviewsList(reviews, 'Test Product');
  return typeof msg === 'string' && 
         msg.includes('REVIEWS') && 
         msg.includes('Test Product') &&
         msg.length > 50;
});

// ============================================
// IPTV TEMPLATES
// ============================================
console.log('\n📺 Testing IPTV Templates...\n');

test('iptv.menu() - returns valid menu', () => {
  const menu = templates.iptv.menu();
  return typeof menu === 'string' && menu.includes('IPTV') && menu.length > 50;
});

test('iptv.packageDetails() - with valid parameters', () => {
  const features = ['HD Quality', 'Sports Channels', 'VOD Library'];
  const msg = templates.iptv.packageDetails('Premium', 1200, features);
  return typeof msg === 'string' && 
         msg.includes('Premium') && 
         msg.includes('1200+') &&
         msg.includes('HD Quality') &&
         msg.includes('$10') &&
         msg.length > 50;
});

test('iptv.packageDetails() - with Basic plan', () => {
  const features = ['HD Quality'];
  const msg = templates.iptv.packageDetails('Basic', 500, features);
  return typeof msg === 'string' && msg.includes('$5');
});

test('iptv.packageDetails() - with Ultra plan', () => {
  const features = ['4K Quality'];
  const msg = templates.iptv.packageDetails('Ultra', 2000, features);
  return typeof msg === 'string' && msg.includes('$15');
});

test('iptv.packageDetails() - with null planName', () => {
  const msg = templates.iptv.packageDetails(null, 500, []);
  return typeof msg === 'string' && msg.includes('Error');
});

test('iptv.packageDetails() - with null features', () => {
  const msg = templates.iptv.packageDetails('Premium', 1200, null);
  return typeof msg === 'string' && msg.length > 50;
});

test('iptv.packageDetails() - with empty features array', () => {
  const msg = templates.iptv.packageDetails('Premium', 1200, []);
  return typeof msg === 'string' && msg.length > 50;
});

test('iptv.packageDetails() - with non-array features', () => {
  const msg = templates.iptv.packageDetails('Premium', 1200, 'not an array');
  return typeof msg === 'string' && msg.length > 50;
});

test('iptv.subscriptionActivated() - with valid parameters', () => {
  const msg = templates.iptv.subscriptionActivated('user123', 'pass456', 'https://iptv.com/playlist.m3u');
  return typeof msg === 'string' && 
         msg.includes('ACTIVATED') && 
         msg.includes('user123') &&
         msg.includes('pass456') &&
         msg.includes('https://iptv.com/playlist.m3u') &&
         msg.length > 50;
});

test('iptv.subscriptionActivated() - with null username', () => {
  const msg = templates.iptv.subscriptionActivated(null, 'pass456', 'https://iptv.com/playlist.m3u');
  return typeof msg === 'string' && msg.includes('Error');
});

test('iptv.subscriptionActivated() - with null password', () => {
  const msg = templates.iptv.subscriptionActivated('user123', null, 'https://iptv.com/playlist.m3u');
  return typeof msg === 'string' && msg.includes('Error');
});

test('iptv.subscriptionActivated() - with null playlistUrl', () => {
  const msg = templates.iptv.subscriptionActivated('user123', 'pass456', null);
  return typeof msg === 'string' && msg.includes('Not available');
});

test('iptv.subscriptionActivated() - with all null', () => {
  const msg = templates.iptv.subscriptionActivated(null, null, null);
  return typeof msg === 'string' && msg.includes('Error');
});

test('iptv.subscriptionDetails() - with valid subscription', () => {
  const subscription = {
    plan_name: 'Premium',
    channels_count: 1200,
    status: 'active',
    username: 'user123',
    password: 'pass456',
    playlist_url: 'https://iptv.com/playlist.m3u',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
  const msg = templates.iptv.subscriptionDetails(subscription);
  return typeof msg === 'string' && 
         msg.includes('IPTV SUBSCRIPTION') && 
         msg.includes('Premium') &&
         msg.includes('user123') &&
         msg.length > 50;
});

test('iptv.subscriptionDetails() - with null subscription', () => {
  const msg = templates.iptv.subscriptionDetails(null);
  return typeof msg === 'string' && msg.includes('No active');
});

test('iptv.channelList() - with valid categories', () => {
  const categories = ['Movies', 'Sports', 'News'];
  const msg = templates.iptv.channelList(categories);
  return typeof msg === 'string' && 
         msg.includes('CHANNEL CATEGORIES') && 
         msg.includes('Movies') &&
         msg.length > 50;
});

test('iptv.setupGuide() - returns valid guide', () => {
  const msg = templates.iptv.setupGuide();
  return typeof msg === 'string' && 
         msg.includes('SETUP GUIDE') && 
         msg.includes('IPTV Smarters Pro') &&
         msg.length > 50;
});

// ============================================
// SUMMARY
// ============================================
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary\n');
console.log(`Total Tests: ${results.total}`);
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ Failed Tests:');
  results.failed.forEach(test => console.log(`   - ${test}`));
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}

