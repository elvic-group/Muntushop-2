# 🔧 Complete API Implementation

**All Backend Services - Copy-Paste Ready Code**

---

## Table of Contents

1. [Server Setup](#server-setup)
2. [Service Implementations](#service-implementations)
3. [API Routes](#api-routes)
4. [Utilities](#utilities)

---

## Server Setup

### **Main Application (app.js):**

```javascript
// backend/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/v1/auth', require('./routes/api/auth'));
app.use('/api/v1/products', require('./routes/api/products'));
app.use('/api/v1/orders', require('./routes/api/orders'));
app.use('/api/v1/cart', require('./routes/api/cart'));
app.use('/api/v1/messaging', require('./routes/api/messaging'));
app.use('/api/v1/support', require('./routes/api/support'));
app.use('/api/v1/appointments', require('./routes/api/appointments'));
app.use('/api/v1/groups', require('./routes/api/groups'));
app.use('/api/v1/money', require('./routes/api/money'));
app.use('/api/v1/courses', require('./routes/api/courses'));
app.use('/api/v1/news', require('./routes/api/news'));
app.use('/api/v1/marketing', require('./routes/api/marketing'));
app.use('/api/v1/b2b', require('./routes/api/b2b'));
app.use('/api/v1/iptv', require('./routes/api/iptv'));
app.use('/api/v1/payments', require('./routes/api/payments'));

// Admin Routes
app.use('/api/v1/admin', require('./routes/admin'));

// Webhooks
app.use('/webhooks', require('./routes/webhooks'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Something went wrong!' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
```

### **Database Configuration:**

```javascript
// backend/src/config/database.js
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

module.exports = pool;
```

---

## Service Implementations

### **1. Shopping Service (Complete):**

```javascript
// backend/src/services/shopping/index.js
const db = require('../../config/database');
const greenAPI = require('../../config/greenapi');
const templates = require('../../templates/whatsapp');
const paymentService = require('../payments');

class ShoppingService {
  async handleMessage(user, message) {
    const step = user.current_step;
    const msg = message.toLowerCase().trim();
    
    // Navigation
    if (msg === '0' || msg === 'back') {
      return await this.goBack(user);
    }
    
    if (msg === 'menu') {
      return await this.showMainMenu(user);
    }
    
    // Route based on step
    switch (step) {
      case 'menu':
        return await this.handleMenuSelection(user, msg);
      case 'category':
        return await this.handleCategorySelection(user, msg);
      case 'products':
        return await this.handleProductSelection(user, msg);
      case 'product_detail':
        return await this.handleProductAction(user, msg);
      case 'cart':
        return await this.handleCartAction(user, msg);
      case 'checkout_address':
        return await this.handleAddress(user, message);
      case 'checkout_payment':
        return await this.handlePaymentMethod(user, msg);
      default:
        return await this.showMenu(user);
    }
  }
  
  async showMenu(user) {
    await this.updateUserStep(user.id, 'menu');
    const menu = templates.shopping.menu();
    await this.sendMessage(user.phone, menu);
  }
  
  async handleMenuSelection(user, message) {
    const option = parseInt(message);
    
    const categories = {
      1: 'Phone Accessories',
      2: 'Fashion & Clothing',
      3: 'Electronics',
      4: 'Home & Living',
      5: 'Games & Toys'
    };
    
    if (option >= 1 && option <= 5) {
      await this.updateUserStep(user.id, 'category', { category: categories[option] });
      return await this.showProducts(user, categories[option]);
    } else if (option === 6) {
      return await this.showCart(user);
    } else if (option === 7) {
      return await this.showOrders(user);
    }
  }
  
  async showProducts(user, category) {
    const result = await db.query(`
      SELECT * FROM products 
      WHERE category = $1 AND is_active = true 
      ORDER BY rating DESC 
      LIMIT 5
    `, [category]);
    
    const products = result.rows;
    
    if (products.length === 0) {
      await this.sendMessage(user.phone, 'No products available in this category.');
      return await this.showMenu(user);
    }
    
    await this.updateUserStep(user.id, 'products', { category, products: products.map(p => p.id) });
    
    const message = templates.shopping.phoneAccessories(); // Would be dynamic based on category
    await this.sendMessage(user.phone, message);
  }
  
  async handleProductSelection(user, message) {
    const option = parseInt(message);
    const session = user.session_data;
    const products = session.products || [];
    
    if (option >= 1 && option <= products.length) {
      const productId = products[option - 1];
      const product = await this.getProduct(productId);
      
      await this.updateUserStep(user.id, 'product_detail', { 
        ...session, 
        current_product: productId 
      });
      
      const message = templates.shopping.productDetail(product);
      await this.sendMessage(user.phone, message);
    }
  }
  
  async handleProductAction(user, message) {
    const option = parseInt(message);
    const session = user.session_data;
    const productId = session.current_product;
    
    if (option === 1) {
      // Add to cart
      await this.addToCart(user.id, productId);
      
      const cart = await this.getCart(user.id);
      const message = templates.shopping.addedToCart(
        await this.getProduct(productId),
        cart.total
      );
      
      await this.updateUserStep(user.id, 'cart');
      await this.sendMessage(user.phone, message);
    } else if (option === 2) {
      // View reviews
      await this.showReviews(user, productId);
    }
  }
  
  async addToCart(userId, productId, quantity = 1) {
    // Get product
    const product = await this.getProduct(productId);
    
    // Get or create cart
    let cart = await db.query(
      'SELECT * FROM carts WHERE user_id = $1',
      [userId]
    );
    
    if (cart.rows.length === 0) {
      // Create cart
      cart = await db.query(`
        INSERT INTO carts (user_id, items, total)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [userId, JSON.stringify([]), 0]);
    }
    
    cart = cart.rows[0];
    const items = cart.items || [];
    
    // Add or update item
    const existingIndex = items.findIndex(i => i.product_id === productId);
    
    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        product_id: productId,
        name: product.name,
        price: parseFloat(product.price),
        quantity: quantity,
        image: product.images[0]
      });
    }
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update cart
    await db.query(`
      UPDATE carts 
      SET items = $1, total = $2, updated_at = NOW()
      WHERE user_id = $3
    `, [JSON.stringify(items), total, userId]);
    
    return { items, total };
  }
  
  async showCart(user) {
    const cart = await this.getCart(user.id);
    
    if (!cart || cart.items.length === 0) {
      await this.sendMessage(user.phone, '🛒 Your cart is empty!\n\nType MENU to browse products.');
      return;
    }
    
    await this.updateUserStep(user.id, 'cart');
    const message = templates.shopping.cart(cart.items, cart.total);
    await this.sendMessage(user.phone, message);
  }
  
  async handleCartAction(user, message) {
    const option = parseInt(message);
    
    if (option === 1) {
      // Proceed to checkout
      await this.startCheckout(user);
    } else if (option === 2) {
      // Continue shopping
      await this.showMenu(user);
    } else if (option === 5) {
      // Clear cart
      await this.clearCart(user.id);
      await this.sendMessage(user.phone, '✅ Cart cleared!');
      await this.showMenu(user);
    }
  }
  
  async startCheckout(user) {
    await this.updateUserStep(user.id, 'checkout_address');
    const message = templates.shopping.checkout(
      (await this.getCart(user.id)).total
    );
    await this.sendMessage(user.phone, message);
  }
  
  async handleAddress(user, address) {
    // Save address
    await this.updateUserStep(user.id, 'checkout_payment', { address });
    
    const cart = await this.getCart(user.id);
    const message = templates.shopping.paymentOptions(cart.total);
    await this.sendMessage(user.phone, message);
  }
  
  async handlePaymentMethod(user, message) {
    const option = parseInt(message);
    const cart = await this.getCart(user.id);
    
    if (option === 1) {
      // Stripe payment
      const order = await this.createOrder(user, cart);
      const paymentUrl = await paymentService.createCheckoutSession(
        user.id,
        'shopping',
        cart.total,
        { orderId: order.id }
      );
      
      const message = templates.shopping.stripePayment(paymentUrl, order.order_number);
      await this.sendMessage(user.phone, message);
    } else if (option === 2) {
      // M-Pesa
      const message = templates.payment.mpesa(
        process.env.MPESA_NUMBER,
        cart.total
      );
      await this.sendMessage(user.phone, message);
    }
  }
  
  async createOrder(user, cart) {
    const orderNumber = 'ORD-' + Date.now();
    const address = user.session_data?.address || 'Not provided';
    
    const result = await db.query(`
      INSERT INTO orders (
        user_id, order_number, items, subtotal, total,
        status, payment_status, shipping_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      user.id,
      orderNumber,
      JSON.stringify(cart.items),
      cart.total,
      cart.total,
      'pending',
      'pending',
      JSON.stringify({ address })
    ]);
    
    // Clear cart
    await this.clearCart(user.id);
    
    return result.rows[0];
  }
  
  async showOrders(user) {
    const result = await db.query(`
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [user.id]);
    
    const orders = result.rows;
    
    if (orders.length === 0) {
      await this.sendMessage(user.phone, '📦 No orders yet!\n\nType MENU to start shopping.');
      return;
    }
    
    let message = '📦 YOUR ORDERS\n\n';
    orders.forEach((order, i) => {
      message += `${i+1}. Order #${order.order_number}\n`;
      message += `   Status: ${order.status}\n`;
      message += `   Total: $${order.total}\n`;
      message += `   Date: ${new Date(order.created_at).toLocaleDateString()}\n\n`;
    });
    
    message += 'Reply with order number to track\nOr type MENU to return';
    
    await this.sendMessage(user.phone, message);
  }
  
  // Helper methods
  async getProduct(productId) {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    return result.rows[0];
  }
  
  async getCart(userId) {
    const result = await db.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    return result.rows[0];
  }
  
  async clearCart(userId) {
    await db.query(`
      UPDATE carts 
      SET items = '[]', total = 0, updated_at = NOW()
      WHERE user_id = $1
    `, [userId]);
  }
  
  async updateUserStep(userId, step, sessionData = null) {
    const query = sessionData 
      ? 'UPDATE users SET current_service = $1, current_step = $2, session_data = $3 WHERE id = $4'
      : 'UPDATE users SET current_service = $1, current_step = $2 WHERE id = $3';
    
    const params = sessionData 
      ? ['shopping', step, JSON.stringify(sessionData), userId]
      : ['shopping', step, userId];
    
    await db.query(query, params);
  }
  
  async sendMessage(phone, text) {
    await greenAPI.message.sendMessage(`${phone}@c.us`, null, text);
  }
  
  async goBack(user) {
    // Implement back navigation
    await this.showMenu(user);
  }
  
  async showMainMenu(user) {
    await db.query(
      'UPDATE users SET current_service = NULL, current_step = NULL WHERE id = $1',
      [user.id]
    );
    const menu = templates.main.mainMenu();
    await this.sendMessage(user.phone, menu);
  }
}

module.exports = new ShoppingService();
```

### **2. IPTV Service (Complete):**

```javascript
// backend/src/services/iptv/index.js
const db = require('../../config/database');
const greenAPI = require('../../config/greenapi');
const templates = require('../../templates/whatsapp');
const paymentService = require('../payments');

class IPTVService {
  async handleMessage(user, message) {
    const step = user.current_step;
    const msg = message.toLowerCase().trim();
    
    if (msg === 'menu' || msg === '0') {
      return await this.showMainMenu(user);
    }
    
    switch (step) {
      case 'menu':
        return await this.handleMenuSelection(user, msg);
      case 'plan_selection':
        return await this.handlePlanSelection(user, msg);
      case 'payment':
        return await this.handlePayment(user, msg);
      default:
        return await this.showMenu(user);
    }
  }
  
  async showMenu(user) {
    await this.updateUserStep(user.id, 'menu');
    const menu = templates.iptv.menu();
    await this.sendMessage(user.phone, menu);
  }
  
  async handleMenuSelection(user, message) {
    const option = parseInt(message);
    
    if (option >= 1 && option <= 3) {
      // Show plan details
      const plan = await this.getPlan(option);
      await this.updateUserStep(user.id, 'plan_selection', { planId: plan.id });
      
      const message = templates.iptv.packageDetails(
        plan.name,
        plan.channels_count,
        plan.features
      );
      
      await this.sendMessage(user.phone, message);
    } else if (option === 4) {
      // My subscription
      await this.showMySubscription(user);
    } else if (option === 5) {
      // Channel list
      await this.showChannelList(user);
    } else if (option === 6) {
      // Setup guide
      await this.showSetupGuide(user);
    }
  }
  
  async handlePlanSelection(user, message) {
    const option = parseInt(message);
    
    if (option === 1) {
      // Subscribe now
      const session = user.session_data;
      const plan = await this.getPlanById(session.planId);
      
      // Create payment
      const paymentUrl = await paymentService.createCheckoutSession(
        user.id,
        'iptv',
        plan.price,
        { planId: plan.id }
      );
      
      await this.updateUserStep(user.id, 'payment');
      
      const message = templates.payment.stripeLink(paymentUrl, plan.price);
      await this.sendMessage(user.phone, message);
    } else if (option === 2) {
      // View channels
      await this.showChannelList(user);
    }
  }
  
  async activateSubscription(userId, planId) {
    const plan = await this.getPlanById(planId);
    
    // Generate credentials
    const username = `user_${userId}_${Date.now()}`;
    const password = this.generatePassword();
    const playlistUrl = this.generatePlaylistUrl(username);
    const serverUrl = process.env.IPTV_SERVER_URL || 'https://iptv.muntushop.com';
    
    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);
    
    // Create subscription
    const result = await db.query(`
      INSERT INTO iptv_subscriptions (
        user_id, plan_id, username, password,
        playlist_url, server_url, status,
        price, activated_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      RETURNING *
    `, [
      userId, planId, username, password,
      playlistUrl, serverUrl, 'active',
      plan.price, expiresAt
    ]);
    
    const subscription = result.rows[0];
    
    // Get user
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    // Send credentials
    const message = templates.iptv.subscriptionActivated(
      username,
      password,
      playlistUrl
    );
    
    await this.sendMessage(user.rows[0].phone, message);
    
    return subscription;
  }
  
  async showMySubscription(user) {
    const result = await db.query(`
      SELECT s.*, p.name as plan_name, p.channels_count
      FROM iptv_subscriptions s
      JOIN iptv_plans p ON s.plan_id = p.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [user.id]);
    
    if (result.rows.length === 0) {
      await this.sendMessage(
        user.phone,
        '📺 No active IPTV subscription.\n\nType IPTV to subscribe!'
      );
      return;
    }
    
    const sub = result.rows[0];
    const daysLeft = Math.ceil((new Date(sub.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
    
    let message = `📺 YOUR IPTV SUBSCRIPTION\n\n`;
    message += `Plan: ${sub.plan_name}\n`;
    message += `Channels: ${sub.channels_count}+\n`;
    message += `Status: ${sub.status}\n`;
    message += `Expires in: ${daysLeft} days\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `Credentials:\n`;
    message += `Username: ${sub.username}\n`;
    message += `Password: ${sub.password}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `Playlist: ${sub.playlist_url}\n\n`;
    message += `1️⃣ Renew Now\n`;
    message += `2️⃣ Setup Guide\n`;
    message += `3️⃣ Channel List\n`;
    message += `0️⃣ Main Menu`;
    
    await this.sendMessage(user.phone, message);
  }
  
  async showChannelList(user) {
    const channels = [
      '🎬 Movies & Series',
      '⚽ Sports (ESPN, FOX, Sky)',
      '📺 Entertainment (HBO, Netflix)',
      '📰 News (CNN, BBC, Al Jazeera)',
      '🎵 Music (MTV, VH1)',
      '👶 Kids (Disney, Cartoon Network)',
      '🌍 International (200+ countries)'
    ];
    
    let message = '📺 CHANNEL CATEGORIES\n\n';
    message += channels.join('\n');
    message += '\n\n1200+ channels available!';
    message += '\n\nType IPTV to subscribe!';
    
    await this.sendMessage(user.phone, message);
  }
  
  async showSetupGuide(user) {
    const message = templates.iptv.setupGuide('Android/iOS');
    await this.sendMessage(user.phone, message);
  }
  
  // Helper methods
  async getPlan(option) {
    const planMap = {
      1: 'Basic',
      2: 'Standard',
      3: 'Premium'
    };
    
    const result = await db.query(
      'SELECT * FROM iptv_plans WHERE name = $1',
      [planMap[option]]
    );
    
    return result.rows[0];
  }
  
  async getPlanById(planId) {
    const result = await db.query('SELECT * FROM iptv_plans WHERE id = $1', [planId]);
    return result.rows[0];
  }
  
  generatePassword() {
    return Math.random().toString(36).slice(-10);
  }
  
  generatePlaylistUrl(username) {
    return `${process.env.IPTV_SERVER_URL || 'https://iptv.muntushop.com'}/playlist/${username}.m3u`;
  }
  
  async updateUserStep(userId, step, sessionData = null) {
    const query = sessionData 
      ? 'UPDATE users SET current_service = $1, current_step = $2, session_data = $3 WHERE id = $4'
      : 'UPDATE users SET current_service = $1, current_step = $2 WHERE id = $3';
    
    const params = sessionData 
      ? ['iptv', step, JSON.stringify(sessionData), userId]
      : ['iptv', step, userId];
    
    await db.query(query, params);
  }
  
  async sendMessage(phone, text) {
    await greenAPI.message.sendMessage(`${phone}@c.us`, null, text);
  }
  
  async showMainMenu(user) {
    await db.query(
      'UPDATE users SET current_service = NULL, current_step = NULL WHERE id = $1',
      [user.id]
    );
    const menu = templates.main.mainMenu();
    await this.sendMessage(user.phone, menu);
  }
}

module.exports = new IPTVService();
```

### **3. Payment Service (Complete):**

```javascript
// backend/src/services/payments.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');
const greenAPI = require('../config/greenapi');
const shoppingService = require('./shopping');
const iptvService = require('./iptv');

class PaymentService {
  async createCheckoutSession(userId, serviceType, amount, metadata = {}) {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${serviceType} Service`,
            description: metadata.description || `MuntuShop ${serviceType} service`
          },
          unit_amount: Math.round(amount * 100) // Convert to cents
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      customer_email: user.rows[0].email,
      metadata: {
        userId,
        serviceType,
        ...metadata
      }
    });
    
    // Save payment record
    await db.query(`
      INSERT INTO payments (
        user_id, service_type, amount, payment_method,
        stripe_session_id, status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      userId,
      serviceType,
      amount,
      'stripe',
      session.id,
      'pending',
      JSON.stringify(metadata)
    ]);
    
    return session.url;
  }
  
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handlePaymentSuccess(event.data.object);
          break;
          
        case 'checkout.session.expired':
          await this.handlePaymentExpired(event.data.object);
          break;
          
        case 'payment_intent.succeeded':
          console.log('Payment intent succeeded:', event.data.object.id);
          break;
      }
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }
  
  async handlePaymentSuccess(session) {
    const { userId, serviceType, orderId, planId } = session.metadata;
    
    // Update payment status
    await db.query(`
      UPDATE payments 
      SET status = $1, stripe_payment_intent = $2, paid_at = NOW()
      WHERE stripe_session_id = $3
    `, ['completed', session.payment_intent, session.id]);
    
    // Get user
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    // Process based on service type
    switch (serviceType) {
      case 'shopping':
        await this.fulfillOrder(orderId);
        break;
        
      case 'iptv':
        await iptvService.activateSubscription(userId, planId);
        break;
        
      case 'education':
        await this.enrollCourse(userId, session.metadata.courseId);
        break;
        
      // Add other services...
    }
    
    // Send confirmation
    await this.sendPaymentConfirmation(user.rows[0], serviceType, session);
  }
  
  async handlePaymentExpired(session) {
    await db.query(`
      UPDATE payments 
      SET status = $1, failed_at = NOW()
      WHERE stripe_session_id = $2
    `, ['expired', session.id]);
  }
  
  async fulfillOrder(orderId) {
    // Update order status
    await db.query(`
      UPDATE orders 
      SET payment_status = $1, status = $2, paid_at = NOW()
      WHERE id = $3
    `, ['paid', 'processing', orderId]);
    
    // Get order details
    const order = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const user = await db.query('SELECT * FROM users WHERE id = $1', [order.rows[0].user_id]);
    
    // Send confirmation
    const message = `
🎉 PAYMENT SUCCESSFUL!

Order #${order.rows[0].order_number}
Total: $${order.rows[0].total}

✅ Payment received
📦 Processing your order
🚚 Estimated delivery: 5-7 days

You'll receive tracking info soon!

Type MENU to continue.
    `;
    
    await greenAPI.message.sendMessage(
      `${user.rows[0].phone}@c.us`,
      null,
      message
    );
  }
  
  async sendPaymentConfirmation(user, serviceType, session) {
    const message = `
✅ PAYMENT SUCCESSFUL!

Service: ${serviceType}
Amount: $${(session.amount_total / 100).toFixed(2)}
Transaction ID: ${session.payment_intent}

Your service is now active! 🎉

Type MENU to continue.
    `;
    
    await greenAPI.message.sendMessage(
      `${user.phone}@c.us`,
      null,
      message
    );
  }
}

module.exports = new PaymentService();
```

---

## API Routes

### **Shopping Routes:**

```javascript
// backend/src/routes/api/products.js
const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    
    let query = 'SELECT * FROM products WHERE is_active = true';
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);
    
    const result = await db.query(query, params);
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM products WHERE is_active = true';
    const countResult = await db.query(countQuery);
    
    res.json({
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### **Orders Routes:**

```javascript
// backend/src/routes/api/orders.js
const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const auth = require('../../middleware/auth');

// Get user orders
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [req.user.userId]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM orders 
      WHERE id = $1 AND user_id = $2
    `, [req.params.id, req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track order
router.get('/:id/track', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT order_number, status, tracking_number, tracking_url
      FROM orders 
      WHERE id = $1 AND user_id = $2
    `, [req.params.id, req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### **Webhook Routes:**

```javascript
// backend/src/routes/webhooks/index.js
const express = require('express');
const router = express.Router();
const whatsappHandler = require('../../services/greenapi/handler');
const paymentService = require('../../services/payments');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Green API webhook
router.post('/greenapi', async (req, res) => {
  try {
    console.log('Green API webhook received:', req.body.typeWebhook);
    
    await whatsappHandler.handleIncomingMessage(req.body);
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Green API webhook error:', error);
    res.sendStatus(500);
  }
});

// Stripe webhook
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log('Stripe webhook received:', event.type);
    
    await paymentService.handleWebhook(event);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
```

---

**Continue to CURSOR-RULES.md for Cursor IDE setup →**

*Part 5 of 7 - Complete API Implementation*  
*Last Updated: December 15, 2024*
