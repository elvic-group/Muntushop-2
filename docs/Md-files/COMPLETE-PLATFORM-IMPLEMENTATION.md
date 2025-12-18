# 🚀 Complete Multi-Service Platform Implementation Guide

**Build ALL 11 Business Ideas in ONE Unified WhatsApp Platform**

Using: Green API + Node.js + Express + PostgreSQL + Stripe + Cursor + Railway

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [All 11 Services Integrated](#all-11-services-integrated)
5. [WhatsApp Menu System](#whatsapp-menu-system)
6. [Database Schema](#database-schema)
7. [Green API Integration](#green-api-integration)
8. [Stripe Payment Integration](#stripe-payment-integration)
9. [Admin Panel Features](#admin-panel-features)
10. [User Dashboard](#user-dashboard)
11. [Deployment Steps](#deployment-steps)

---

## Platform Overview

### **What We're Building:**

A **unified WhatsApp-based platform** that provides 11 different services through ONE bot:

```
┌─────────────────────────────────────────────────────────────┐
│              WHATSAPP SUPER PLATFORM                        │
│                                                              │
│  Customer → WhatsApp → Green API → Your Platform → Services │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Services Menu:
1️⃣  Shopping (Dropshipping Store)
2️⃣  Bulk Messaging Service
3️⃣  Customer Support Assistant
4️⃣  Appointment Booking
5️⃣  Group Management
6️⃣  Money Transfer Assistant
7️⃣  Online Courses
8️⃣  Local News & Updates
9️⃣  Marketing Services
🔟  B2B Wholesale Orders
1️⃣1️⃣ IPTV Subscriptions
```

### **Key Features:**

✅ **All services at $1** (for now - configurable)  
✅ **Stripe payments** integrated  
✅ **Admin panel** for management  
✅ **User dashboard** for customers  
✅ **WhatsApp menu system** for navigation  
✅ **Green API** for WhatsApp automation  
✅ **Railway/Netlify** deployment ready  

---

## Technology Stack

### **Backend:**
```javascript
- Node.js 20+
- Express.js 4.x
- PostgreSQL 15
- Green API SDK
- Stripe SDK
- OpenAI SDK (for AI features)
```

### **Frontend:**
```javascript
- React 18
- Tailwind CSS
- shadcn/ui components
- React Router
- TanStack Query
```

### **Infrastructure:**
```javascript
- Railway (backend + database)
- Netlify (frontend)
- Green API (WhatsApp)
- Stripe (payments)
```

### **Development:**
```javascript
- Cursor IDE
- Git + GitHub
- Environment variables
- Docker (optional)
```

---

## Project Structure

```
muntushop-platform/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── greenapi.js
│   │   │   ├── stripe.js
│   │   │   └── env.js
│   │   │
│   │   ├── services/
│   │   │   ├── greenapi/
│   │   │   │   ├── index.js
│   │   │   │   ├── messages.js
│   │   │   │   ├── webhooks.js
│   │   │   │   └── media.js
│   │   │   │
│   │   │   ├── shopping/
│   │   │   │   ├── dropshipping.js
│   │   │   │   ├── products.js
│   │   │   │   ├── cart.js
│   │   │   │   └── orders.js
│   │   │   │
│   │   │   ├── messaging/
│   │   │   │   ├── bulk-sender.js
│   │   │   │   ├── campaigns.js
│   │   │   │   └── analytics.js
│   │   │   │
│   │   │   ├── support/
│   │   │   │   ├── tickets.js
│   │   │   │   ├── ai-agent.js
│   │   │   │   └── routing.js
│   │   │   │
│   │   │   ├── appointments/
│   │   │   │   ├── bookings.js
│   │   │   │   ├── calendar.js
│   │   │   │   └── reminders.js
│   │   │   │
│   │   │   ├── groups/
│   │   │   │   ├── management.js
│   │   │   │   ├── moderation.js
│   │   │   │   └── analytics.js
│   │   │   │
│   │   │   ├── money/
│   │   │   │   ├── tracking.js
│   │   │   │   ├── reports.js
│   │   │   │   └── alerts.js
│   │   │   │
│   │   │   ├── education/
│   │   │   │   ├── courses.js
│   │   │   │   ├── lessons.js
│   │   │   │   └── quizzes.js
│   │   │   │
│   │   │   ├── news/
│   │   │   │   ├── feed.js
│   │   │   │   ├── subscriptions.js
│   │   │   │   └── content.js
│   │   │   │
│   │   │   ├── marketing/
│   │   │   │   ├── campaigns.js
│   │   │   │   ├── analytics.js
│   │   │   │   └── clients.js
│   │   │   │
│   │   │   ├── b2b/
│   │   │   │   ├── orders.js
│   │   │   │   ├── catalog.js
│   │   │   │   └── invoices.js
│   │   │   │
│   │   │   └── iptv/
│   │   │       ├── subscriptions.js
│   │   │       ├── playlists.js
│   │   │       └── activation.js
│   │   │
│   │   ├── routes/
│   │   │   ├── api/
│   │   │   │   ├── auth.js
│   │   │   │   ├── shopping.js
│   │   │   │   ├── messaging.js
│   │   │   │   ├── support.js
│   │   │   │   ├── appointments.js
│   │   │   │   ├── groups.js
│   │   │   │   ├── money.js
│   │   │   │   ├── education.js
│   │   │   │   ├── news.js
│   │   │   │   ├── marketing.js
│   │   │   │   ├── b2b.js
│   │   │   │   └── iptv.js
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── dashboard.js
│   │   │   │   ├── users.js
│   │   │   │   ├── products.js
│   │   │   │   ├── orders.js
│   │   │   │   ├── campaigns.js
│   │   │   │   ├── analytics.js
│   │   │   │   └── settings.js
│   │   │   │
│   │   │   └── webhooks/
│   │   │       ├── greenapi.js
│   │   │       └── stripe.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   ├── ratelimit.js
│   │   │   └── error.js
│   │   │
│   │   ├── utils/
│   │   │   ├── helpers.js
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   └── logger.js
│   │   │
│   │   ├── templates/
│   │   │   ├── whatsapp/
│   │   │   │   ├── menus.js
│   │   │   │   ├── shopping.js
│   │   │   │   ├── messaging.js
│   │   │   │   ├── support.js
│   │   │   │   ├── appointments.js
│   │   │   │   ├── groups.js
│   │   │   │   ├── money.js
│   │   │   │   ├── education.js
│   │   │   │   ├── news.js
│   │   │   │   ├── marketing.js
│   │   │   │   ├── b2b.js
│   │   │   │   └── iptv.js
│   │   │   │
│   │   │   └── emails/
│   │   │       ├── welcome.js
│   │   │       ├── order-confirmation.js
│   │   │       └── receipt.js
│   │   │
│   │   └── app.js
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Products.jsx
│   │   │   │   ├── Orders.jsx
│   │   │   │   ├── Users.jsx
│   │   │   │   ├── Campaigns.jsx
│   │   │   │   ├── Analytics.jsx
│   │   │   │   └── Settings.jsx
│   │   │   │
│   │   │   ├── user/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Orders.jsx
│   │   │   │   ├── Subscriptions.jsx
│   │   │   │   ├── Appointments.jsx
│   │   │   │   ├── Courses.jsx
│   │   │   │   └── Profile.jsx
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       ├── Table.jsx
│   │   │       └── Charts.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   └── AdminLayout.jsx
│   │   │   │
│   │   │   ├── user/
│   │   │   │   └── UserLayout.jsx
│   │   │   │
│   │   │   ├── Login.jsx
│   │   │   └── Home.jsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   └── utils.js
│   │   │
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── API-DOCUMENTATION.md
│   ├── DATABASE-SCHEMA.md
│   ├── MESSAGE-FLOW.md
│   ├── ADMIN-PANEL.md
│   ├── USER-PANEL.md
│   └── DEPLOYMENT-GUIDE.md
│
└── README.md
```

---

## All 11 Services Integrated

### **Service Integration Matrix:**

```
Service                 Green API    Stripe    Database    Admin Panel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.  Shopping            ✅          ✅        ✅          ✅
2.  Bulk Messaging      ✅          ✅        ✅          ✅
3.  Customer Support    ✅          ✅        ✅          ✅
4.  Appointments        ✅          ✅        ✅          ✅
5.  Group Management    ✅          ✅        ✅          ✅
6.  Money Assistant     ✅          ✅        ✅          ✅
7.  Online Courses      ✅          ✅        ✅          ✅
8.  Local News          ✅          ✅        ✅          ✅
9.  Marketing           ✅          ✅        ✅          ✅
10. B2B Orders          ✅          ✅        ✅          ✅
11. IPTV                ✅          ✅        ✅          ✅
```

### **Pricing (All $1 for now):**

```javascript
const PRICING = {
  shopping: {
    product: 1.00,           // Per product
    shipping: 0.00           // Free for now
  },
  
  messaging: {
    starter: 1.00,           // 100 messages
    business: 1.00,          // 500 messages
    enterprise: 1.00         // Unlimited
  },
  
  support: {
    basic: 1.00,             // 10 tickets/month
    standard: 1.00,          // 50 tickets/month
    premium: 1.00            // Unlimited
  },
  
  appointments: {
    single: 1.00,            // Per booking
    monthly: 1.00            // Unlimited bookings
  },
  
  groupManagement: {
    perGroup: 1.00           // Per group/month
  },
  
  moneyAssistant: {
    premium: 1.00            // Per month
  },
  
  education: {
    course: 1.00,            // Per course
    subscription: 1.00       // All courses
  },
  
  news: {
    basic: 1.00,             // 3 updates/day
    premium: 1.00            // Unlimited
  },
  
  marketing: {
    campaign: 1.00,          // Per campaign
    monthly: 1.00            // Unlimited campaigns
  },
  
  b2b: {
    perOrder: 1.00,          // Per order
    subscription: 1.00       // Unlimited orders
  },
  
  iptv: {
    basic: 1.00,             // Basic package
    standard: 1.00,          // Standard package
    premium: 1.00            // Premium package
  }
};
```

---

## WhatsApp Menu System

### **Main Menu Structure:**

```
User sends: "Hi" or "Menu" or "Start"
    ↓
Bot responds:

👋 Welcome to MuntuShop Platform!

Choose a service:

1️⃣  🛍️  Shopping
2️⃣  📢  Bulk Messaging
3️⃣  💬  Customer Support
4️⃣  📅  Appointments
5️⃣  👥  Group Management
6️⃣  💰  Money Assistant
7️⃣  📚  Online Courses
8️⃣  📰  News & Updates
9️⃣  📊  Marketing
🔟  🏪  B2B Orders
1️⃣1️⃣ 📺  IPTV

Reply with number (1-11)

💡 Type HELP anytime for assistance
```

### **Example: Shopping Menu (Option 1):**

```
User: 1
    ↓
Bot:

🛍️  SHOPPING STORE

What are you looking for?

1️⃣  Phone Accessories
2️⃣  Fashion & Clothing
3️⃣  Electronics
4️⃣  Home & Living
5️⃣  View My Cart 🛒
6️⃣  My Orders 📦
0️⃣  Back to Main Menu

Reply with number
```

### **Example: Product Selection:**

```
User: 1
    ↓
Bot:

📱 PHONE ACCESSORIES

1. Phone Case - $1.00 ⭐4.8/5
2. Screen Protector - $1.00 ⭐4.9/5
3. Charging Cable - $1.00 ⭐4.7/5
4. Pop Socket - $1.00 ⭐4.6/5
5. Phone Holder - $1.00 ⭐4.8/5

Reply with number to view details
Or type NEXT for more products
```

### **Example: Product Details:**

```
User: 1
    ↓
Bot:

📱 Premium Phone Case

💰 Price: $1.00
⭐ Rating: 4.8/5 (234 reviews)
📦 In Stock
🚚 Free Shipping

✨ Features:
• Shockproof protection
• Slim design
• Multiple colors available
• Anti-scratch coating

Colors: Black, Blue, Red, Clear

1️⃣  Add to Cart
2️⃣  View Reviews
3️⃣  Back to Products

Reply with number
```

### **Example: Checkout Flow:**

```
User: 1 (Add to Cart)
    ↓
Bot:

✅ Added to cart!

🛒 YOUR CART (1 item)

• Phone Case (Black) - $1.00

Total: $1.00

1️⃣  Checkout Now
2️⃣  Continue Shopping
3️⃣  View Cart
4️⃣  Remove Item

Reply with number
```

```
User: 1 (Checkout)
    ↓
Bot:

💳 PAYMENT

Total: $1.00

Choose payment method:

1️⃣  Card Payment (Stripe)
2️⃣  M-Pesa
3️⃣  Bank Transfer

Reply with number

(Stripe is instant and secure! ✅)
```

```
User: 1 (Stripe)
    ↓
Bot:

💳 Complete your payment:

Click here to pay: [STRIPE_PAYMENT_LINK]

Total: $1.00

✅ Secure payment by Stripe
🔒 Your payment info is protected

After payment, send screenshot or 
type PAID to confirm!
```

---

## Database Schema

### **Core Tables:**

```sql
-- Users Table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  language VARCHAR(5) DEFAULT 'en',
  current_service VARCHAR(50),
  current_step VARCHAR(100),
  session_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Shopping Service Tables
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 1.00,
  category VARCHAR(100),
  images JSONB,
  stock_quantity INTEGER DEFAULT 999,
  rating DECIMAL(3, 2),
  reviews_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE carts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  items JSONB,
  total DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  order_number VARCHAR(50) UNIQUE,
  items JSONB,
  total DECIMAL(10, 2),
  status VARCHAR(50),
  payment_method VARCHAR(50),
  payment_status VARCHAR(50),
  stripe_session_id VARCHAR(255),
  shipping_address JSONB,
  tracking_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bulk Messaging Service
CREATE TABLE messaging_clients (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  company_name VARCHAR(255),
  plan VARCHAR(50),
  monthly_limit INTEGER,
  messages_used INTEGER DEFAULT 0,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messaging_campaigns (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES messaging_clients(id),
  name VARCHAR(255),
  message TEXT,
  recipient_count INTEGER,
  sent_count INTEGER DEFAULT 0,
  status VARCHAR(50),
  scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Support Service
CREATE TABLE support_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  client_id BIGINT,
  ticket_number VARCHAR(50) UNIQUE,
  subject VARCHAR(255),
  status VARCHAR(50),
  priority VARCHAR(50),
  assigned_to BIGINT,
  messages JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments Service
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  business_id BIGINT,
  service_type VARCHAR(100),
  appointment_date DATE,
  appointment_time TIME,
  status VARCHAR(50),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Group Management Service
CREATE TABLE managed_groups (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT,
  green_api_group_id VARCHAR(255),
  name VARCHAR(255),
  description TEXT,
  member_count INTEGER,
  rules JSONB,
  auto_welcome BOOLEAN DEFAULT true,
  auto_moderate BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Money Assistant Service
CREATE TABLE money_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  transaction_type VARCHAR(50),
  amount DECIMAL(10, 2),
  currency VARCHAR(3),
  reference VARCHAR(100),
  recipient VARCHAR(255),
  status VARCHAR(50),
  notes TEXT,
  transaction_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Education Service
CREATE TABLE courses (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 1.00,
  instructor VARCHAR(255),
  duration_weeks INTEGER,
  lessons_count INTEGER,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course_enrollments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  course_id BIGINT REFERENCES courses(id),
  progress INTEGER DEFAULT 0,
  current_lesson INTEGER DEFAULT 1,
  status VARCHAR(50),
  enrolled_at TIMESTAMP DEFAULT NOW()
);

-- News Service
CREATE TABLE news_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  tier VARCHAR(50),
  topics JSONB,
  daily_limit INTEGER,
  sent_today INTEGER DEFAULT 0,
  last_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE news_articles (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  category VARCHAR(100),
  location VARCHAR(100),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Marketing Service
CREATE TABLE marketing_clients (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  company_name VARCHAR(255),
  plan VARCHAR(50),
  campaigns_limit INTEGER,
  campaigns_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- B2B Orders Service
CREATE TABLE b2b_businesses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  business_name VARCHAR(255),
  business_type VARCHAR(100),
  subscription_plan VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE b2b_catalog (
  id BIGSERIAL PRIMARY KEY,
  supplier_id BIGINT,
  product_name VARCHAR(255),
  price DECIMAL(10, 2) DEFAULT 1.00,
  unit VARCHAR(50),
  min_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE b2b_orders (
  id BIGSERIAL PRIMARY KEY,
  business_id BIGINT REFERENCES b2b_businesses(id),
  order_number VARCHAR(50) UNIQUE,
  items JSONB,
  total DECIMAL(10, 2),
  status VARCHAR(50),
  delivery_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- IPTV Service
CREATE TABLE iptv_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  plan VARCHAR(50),
  channels_count INTEGER,
  price DECIMAL(10, 2) DEFAULT 1.00,
  status VARCHAR(50),
  playlist_url TEXT,
  username VARCHAR(100),
  password VARCHAR(100),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE iptv_plans (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100),
  channels_count INTEGER,
  price DECIMAL(10, 2) DEFAULT 1.00,
  features JSONB,
  duration_days INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments Table (Universal)
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  service_type VARCHAR(50),
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  stripe_session_id VARCHAR(255),
  stripe_payment_intent VARCHAR(255),
  status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_session_id);
```

---

## Green API Integration

### **Core Configuration:**

```javascript
// src/config/greenapi.js

const GreenAPI = require('@green-api/whatsapp-api-client');

const greenAPI = GreenAPI.restAPI({
  idInstance: process.env.GREEN_API_INSTANCE_ID,
  apiTokenInstance: process.env.GREEN_API_TOKEN
});

module.exports = greenAPI;
```

### **Message Handler (Main Router):**

```javascript
// src/services/greenapi/webhooks.js

const db = require('../../config/database');
const menuTemplates = require('../../templates/whatsapp/menus');
const shoppingService = require('../shopping');
const messagingService = require('../messaging');
// ... import all services

class WhatsAppHandler {
  async handleIncomingMessage(webhookData) {
    const { typeWebhook, messageData, senderData } = webhookData;
    
    if (typeWebhook !== 'incomingMessageReceived') return;
    
    const phone = senderData.sender.replace('@c.us', '');
    const message = messageData.textMessageData?.textMessage || '';
    
    // Get or create user
    let user = await this.getUser(phone);
    if (!user) {
      user = await this.createUser(phone);
    }
    
    // Route to appropriate service
    await this.routeMessage(user, message);
  }
  
  async routeMessage(user, message) {
    const msg = message.toLowerCase().trim();
    
    // Check for main menu triggers
    if (['hi', 'hello', 'menu', 'start', 'help'].includes(msg)) {
      return await this.sendMainMenu(user.phone);
    }
    
    // Check if user is in a service flow
    if (user.current_service) {
      return await this.handleServiceFlow(user, message);
    }
    
    // Handle main menu selection
    if (msg.match(/^[0-9]{1,2}$/)) {
      const option = parseInt(msg);
      return await this.handleMainMenuSelection(user, option);
    }
    
    // Default: show main menu
    await this.sendMainMenu(user.phone);
  }
  
  async sendMainMenu(phone) {
    const menu = menuTemplates.mainMenu();
    await this.sendMessage(phone, menu);
  }
  
  async handleMainMenuSelection(user, option) {
    const services = {
      1: 'shopping',
      2: 'messaging',
      3: 'support',
      4: 'appointments',
      5: 'groups',
      6: 'money',
      7: 'education',
      8: 'news',
      9: 'marketing',
      10: 'b2b',
      11: 'iptv'
    };
    
    const service = services[option];
    
    if (!service) {
      return await this.sendMessage(
        user.phone,
        '❌ Invalid option. Type MENU to see options.'
      );
    }
    
    // Update user's current service
    await db.query(
      'UPDATE users SET current_service = $1, current_step = $2 WHERE id = $3',
      [service, 'menu', user.id]
    );
    
    // Send service menu
    await this.sendServiceMenu(user.phone, service);
  }
  
  async sendServiceMenu(phone, service) {
    const menus = {
      shopping: menuTemplates.shopping.menu,
      messaging: menuTemplates.messaging.menu,
      support: menuTemplates.support.menu,
      appointments: menuTemplates.appointments.menu,
      groups: menuTemplates.groups.menu,
      money: menuTemplates.money.menu,
      education: menuTemplates.education.menu,
      news: menuTemplates.news.menu,
      marketing: menuTemplates.marketing.menu,
      b2b: menuTemplates.b2b.menu,
      iptv: menuTemplates.iptv.menu
    };
    
    const menu = menus[service]();
    await this.sendMessage(phone, menu);
  }
  
  async handleServiceFlow(user, message) {
    // Delegate to appropriate service handler
    const handlers = {
      shopping: shoppingService.handleMessage,
      messaging: messagingService.handleMessage,
      // ... all service handlers
    };
    
    const handler = handlers[user.current_service];
    if (handler) {
      await handler(user, message);
    }
  }
  
  async sendMessage(phone, text) {
    await greenAPI.message.sendMessage(`${phone}@c.us`, null, text);
  }
  
  async getUser(phone) {
    const result = await db.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    return result.rows[0];
  }
  
  async createUser(phone) {
    const result = await db.query(
      `INSERT INTO users (phone) VALUES ($1) RETURNING *`,
      [phone]
    );
    return result.rows[0];
  }
}

module.exports = new WhatsAppHandler();
```

---

## Stripe Payment Integration

### **Configuration:**

```javascript
// src/config/stripe.js

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
```

### **Payment Flow:**

```javascript
// src/services/payments.js

const stripe = require('../config/stripe');
const db = require('../config/database');
const greenAPI = require('./greenapi');

class PaymentService {
  async createPaymentSession(userId, serviceType, amount, metadata = {}) {
    const user = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${serviceType} Service`,
            description: metadata.description || ''
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
    
    return session;
  }
  
  async handleStripeWebhook(event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handlePaymentSuccess(event.data.object);
        break;
        
      case 'checkout.session.expired':
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }
  
  async handlePaymentSuccess(session) {
    const { userId, serviceType } = session.metadata;
    
    // Update payment status
    await db.query(
      `UPDATE payments 
       SET status = $1, stripe_payment_intent = $2, updated_at = NOW()
       WHERE stripe_session_id = $3`,
      ['completed', session.payment_intent, session.id]
    );
    
    // Get user
    const user = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    // Process based on service type
    await this.processServiceActivation(serviceType, session.metadata);
    
    // Send confirmation via WhatsApp
    await this.sendPaymentConfirmation(user.rows[0], serviceType, session);
  }
  
  async processServiceActivation(serviceType, metadata) {
    switch (serviceType) {
      case 'shopping':
        await this.fulfillOrder(metadata.orderId);
        break;
        
      case 'iptv':
        await this.activateIPTV(metadata.userId, metadata.plan);
        break;
        
      case 'education':
        await this.enrollCourse(metadata.userId, metadata.courseId);
        break;
        
      // ... other services
    }
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

## Next Steps

This is the **main implementation guide**. The following files contain detailed implementations:

1. **DATABASE-SCHEMA.md** - Complete database with all tables
2. **MESSAGE-FLOW.md** - All WhatsApp message templates and flows
3. **API-IMPLEMENTATION.md** - All API endpoints
4. **ADMIN-PANEL.md** - Complete admin dashboard
5. **USER-PANEL.md** - User dashboard
6. **DEPLOYMENT-GUIDE.md** - Railway + Netlify deployment

**Continue to the next file for detailed implementation! →**

---

*Part 1 of 7 - Main Platform Guide*  
*Last Updated: December 15, 2024*
