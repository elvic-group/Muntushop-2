# 🗄️ Database, API & Deployment Guide

**Complete Database Schema + API Endpoints + Railway/Netlify Deployment**

---

## Part 1: Complete Database Schema

### **Database Setup (PostgreSQL 15):**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- CORE TABLES
-- ====================================

-- Users Table (Main user registry)
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Session management
  current_service VARCHAR(50),
  current_step VARCHAR(100),
  session_data JSONB DEFAULT '{}',
  
  -- User preferences
  preferences JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT true,
  
  -- Timestamps
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 1: SHOPPING STORE
-- ====================================

-- Products Table
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- Product info
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  
  -- Pricing
  price DECIMAL(10, 2) DEFAULT 1.00,
  compare_at_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  
  -- Categorization
  category VARCHAR(100),
  subcategory VARCHAR(100),
  tags JSONB DEFAULT '[]',
  
  -- Media
  images JSONB DEFAULT '[]',
  video_url TEXT,
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 999,
  low_stock_threshold INTEGER DEFAULT 10,
  
  -- Ratings & Reviews
  rating DECIMAL(3, 2) DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,
  
  -- SEO
  slug VARCHAR(255) UNIQUE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Shopping Carts
CREATE TABLE carts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  items JSONB DEFAULT '[]',
  subtotal DECIMAL(10, 2) DEFAULT 0.00,
  shipping DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Orders
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  user_id BIGINT REFERENCES users(id),
  
  -- Order details
  order_number VARCHAR(50) UNIQUE NOT NULL,
  items JSONB NOT NULL,
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping DECIMAL(10, 2) DEFAULT 0.00,
  tax DECIMAL(10, 2) DEFAULT 0.00,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',
  
  -- Payment
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  stripe_session_id VARCHAR(255),
  stripe_payment_intent VARCHAR(255),
  
  -- Shipping
  shipping_address JSONB,
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  carrier VARCHAR(100),
  
  -- Metadata
  notes TEXT,
  customer_notes TEXT,
  
  -- Timestamps
  paid_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product Reviews
CREATE TABLE product_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id),
  order_id BIGINT REFERENCES orders(id),
  
  -- Review content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  
  -- Media
  images JSONB DEFAULT '[]',
  
  -- Moderation
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 2: BULK MESSAGING
-- ====================================

-- Messaging Clients
CREATE TABLE messaging_clients (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  -- Client info
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  
  -- Subscription
  plan VARCHAR(50) NOT NULL,
  monthly_limit INTEGER NOT NULL,
  messages_used INTEGER DEFAULT 0,
  
  -- Billing
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messaging Contacts
CREATE TABLE messaging_contacts (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES messaging_clients(id) ON DELETE CASCADE,
  
  -- Contact info
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  
  -- Segmentation
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_subscribed BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(client_id, phone)
);

-- Messaging Campaigns
CREATE TABLE messaging_campaigns (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES messaging_clients(id) ON DELETE CASCADE,
  
  -- Campaign details
  name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Targeting
  target_tags JSONB DEFAULT '[]',
  recipient_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- Scheduling
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign Messages (individual sends)
CREATE TABLE campaign_messages (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT REFERENCES messaging_campaigns(id) ON DELETE CASCADE,
  contact_id BIGINT REFERENCES messaging_contacts(id),
  
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Delivery
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 3: CUSTOMER SUPPORT
-- ====================================

-- Support Clients (businesses using support service)
CREATE TABLE support_clients (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  -- Business info
  business_name VARCHAR(255) NOT NULL,
  
  -- Subscription
  plan VARCHAR(50) NOT NULL,
  monthly_ticket_limit INTEGER,
  tickets_used INTEGER DEFAULT 0,
  
  -- Settings
  business_hours JSONB,
  auto_response TEXT,
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE support_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relationships
  user_id BIGINT REFERENCES users(id),
  client_id BIGINT REFERENCES support_clients(id),
  assigned_to BIGINT REFERENCES users(id),
  
  -- Ticket info
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  
  -- Content
  description TEXT,
  
  -- Metadata
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  
  -- Timestamps
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ticket Messages
CREATE TABLE ticket_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id),
  
  -- Message content
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 4: APPOINTMENTS
-- ====================================

-- Appointment Providers (businesses offering appointments)
CREATE TABLE appointment_providers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  -- Business info
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  description TEXT,
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  location JSONB,
  
  -- Settings
  working_hours JSONB,
  booking_buffer INTEGER DEFAULT 30,
  max_advance_booking INTEGER DEFAULT 30,
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointment Services
CREATE TABLE appointment_services (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT REFERENCES appointment_providers(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  price DECIMAL(10, 2) DEFAULT 1.00,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id BIGSERIAL PRIMARY KEY,
  appointment_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relationships
  user_id BIGINT REFERENCES users(id),
  provider_id BIGINT REFERENCES appointment_providers(id),
  service_id BIGINT REFERENCES appointment_services(id),
  
  -- Appointment details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  
  -- Payment
  price DECIMAL(10, 2) DEFAULT 1.00,
  payment_status VARCHAR(50) DEFAULT 'pending',
  
  -- Status
  status VARCHAR(50) DEFAULT 'confirmed',
  
  -- Customer info
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  notes TEXT,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP,
  
  -- Timestamps
  cancelled_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 5: GROUP MANAGEMENT
-- ====================================

-- Managed Groups
CREATE TABLE managed_groups (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES users(id),
  
  -- WhatsApp group info
  green_api_group_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Stats
  member_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  
  -- Settings
  auto_welcome BOOLEAN DEFAULT true,
  welcome_message TEXT,
  auto_moderate BOOLEAN DEFAULT false,
  rules JSONB DEFAULT '[]',
  
  -- Features enabled
  features JSONB DEFAULT '{}',
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Group Members
CREATE TABLE group_members (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT REFERENCES managed_groups(id) ON DELETE CASCADE,
  
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  
  -- Role
  is_admin BOOLEAN DEFAULT false,
  
  -- Activity
  messages_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP,
  
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  
  UNIQUE(group_id, phone)
);

-- Group Announcements (scheduled)
CREATE TABLE group_announcements (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT REFERENCES managed_groups(id) ON DELETE CASCADE,
  
  message TEXT NOT NULL,
  
  -- Scheduling
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 6: MONEY ASSISTANT
-- ====================================

-- Money Tracking Subscriptions
CREATE TABLE money_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) UNIQUE,
  
  plan VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  
  -- Limits
  monthly_transaction_limit INTEGER,
  transactions_this_month INTEGER DEFAULT 0,
  
  -- Billing
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Money Transactions
CREATE TABLE money_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  -- Transaction details
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Parties
  recipient VARCHAR(255),
  sender VARCHAR(255),
  
  -- Reference
  reference_code VARCHAR(100),
  external_ref VARCHAR(100),
  
  -- Categorization
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed',
  
  notes TEXT,
  
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Budgets
CREATE TABLE budgets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  period VARCHAR(50) DEFAULT 'monthly',
  
  spent DECIMAL(10, 2) DEFAULT 0.00,
  
  start_date DATE,
  end_date DATE,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 7: ONLINE COURSES
-- ====================================

-- Courses
CREATE TABLE courses (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- Course info
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  
  -- Instructor
  instructor_name VARCHAR(255),
  instructor_bio TEXT,
  
  -- Course details
  category VARCHAR(100),
  level VARCHAR(50),
  duration_weeks INTEGER,
  lessons_count INTEGER,
  
  -- Pricing
  price DECIMAL(10, 2) DEFAULT 1.00,
  
  -- Media
  thumbnail_url TEXT,
  preview_video_url TEXT,
  
  -- Learning objectives
  objectives JSONB DEFAULT '[]',
  
  -- Ratings
  rating DECIMAL(3, 2) DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,
  students_count INTEGER DEFAULT 0,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course Lessons
CREATE TABLE course_lessons (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  content TEXT,
  lesson_number INTEGER NOT NULL,
  
  -- Media
  video_url TEXT,
  pdf_url TEXT,
  attachments JSONB DEFAULT '[]',
  
  -- Duration
  duration_minutes INTEGER,
  
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Course Enrollments
CREATE TABLE course_enrollments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  course_id BIGINT REFERENCES courses(id),
  
  -- Progress
  progress INTEGER DEFAULT 0,
  current_lesson_id BIGINT REFERENCES course_lessons(id),
  completed_lessons JSONB DEFAULT '[]',
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  -- Completion
  completed_at TIMESTAMP,
  certificate_issued BOOLEAN DEFAULT false,
  
  enrolled_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP,
  
  UNIQUE(user_id, course_id)
);

-- Course Quizzes
CREATE TABLE course_quizzes (
  id BIGSERIAL PRIMARY KEY,
  lesson_id BIGINT REFERENCES course_lessons(id) ON DELETE CASCADE,
  
  title VARCHAR(255),
  questions JSONB NOT NULL,
  passing_score INTEGER DEFAULT 70,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  quiz_id BIGINT REFERENCES course_quizzes(id),
  
  score INTEGER,
  answers JSONB,
  passed BOOLEAN,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 8: NEWS & UPDATES
-- ====================================

-- News Subscriptions
CREATE TABLE news_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) UNIQUE,
  
  -- Plan
  tier VARCHAR(50) DEFAULT 'free',
  
  -- Preferences
  topics JSONB DEFAULT '[]',
  locations JSONB DEFAULT '[]',
  
  -- Limits
  daily_limit INTEGER DEFAULT 3,
  sent_today INTEGER DEFAULT 0,
  
  -- Schedule
  morning_brief BOOLEAN DEFAULT true,
  afternoon_update BOOLEAN DEFAULT false,
  evening_news BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  last_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- News Articles
CREATE TABLE news_articles (
  id BIGSERIAL PRIMARY KEY,
  
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content TEXT,
  
  -- Categorization
  category VARCHAR(100),
  topics JSONB DEFAULT '[]',
  location VARCHAR(100),
  
  -- Media
  image_url TEXT,
  source_url TEXT,
  
  -- Author
  author VARCHAR(255),
  source VARCHAR(100),
  
  -- Status
  is_published BOOLEAN DEFAULT true,
  is_breaking BOOLEAN DEFAULT false,
  
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- News Delivery Log
CREATE TABLE news_deliveries (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  article_id BIGINT REFERENCES news_articles(id),
  
  delivered_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 9: MARKETING
-- ====================================

-- Marketing Clients
CREATE TABLE marketing_clients (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  
  -- Subscription
  plan VARCHAR(50) NOT NULL,
  campaigns_limit INTEGER,
  campaigns_used INTEGER DEFAULT 0,
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketing Campaigns (different from messaging campaigns)
CREATE TABLE marketing_campaigns (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES marketing_clients(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(100),
  
  -- Content
  message TEXT,
  images JSONB DEFAULT '[]',
  
  -- Targeting
  target_audience JSONB,
  
  -- Budget
  budget DECIMAL(10, 2),
  spent DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  -- Schedule
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 10: B2B ORDERS
-- ====================================

-- B2B Businesses
CREATE TABLE b2b_businesses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  -- Business info
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  tax_id VARCHAR(100),
  
  -- Contact
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  
  -- Subscription
  subscription_plan VARCHAR(50),
  credit_limit DECIMAL(10, 2),
  outstanding_balance DECIMAL(10, 2) DEFAULT 0.00,
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- B2B Catalog
CREATE TABLE b2b_catalog (
  id BIGSERIAL PRIMARY KEY,
  
  supplier_id BIGINT,
  
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  description TEXT,
  
  -- Pricing
  price DECIMAL(10, 2) DEFAULT 1.00,
  unit VARCHAR(50),
  
  -- Order requirements
  min_order_quantity INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- B2B Orders
CREATE TABLE b2b_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  business_id BIGINT REFERENCES b2b_businesses(id),
  
  -- Order details
  items JSONB NOT NULL,
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_terms VARCHAR(100),
  due_date DATE,
  
  -- Delivery
  delivery_address TEXT,
  delivery_date DATE,
  delivery_status VARCHAR(50) DEFAULT 'pending',
  
  status VARCHAR(50) DEFAULT 'pending',
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 11: IPTV
-- ====================================

-- IPTV Plans
CREATE TABLE iptv_plans (
  id BIGSERIAL PRIMARY KEY,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  channels_count INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  
  price DECIMAL(10, 2) DEFAULT 1.00,
  duration_days INTEGER DEFAULT 30,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- IPTV Subscriptions
CREATE TABLE iptv_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  plan_id BIGINT REFERENCES iptv_plans(id),
  
  -- Credentials
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  
  -- URLs
  playlist_url TEXT,
  server_url TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  -- Billing
  price DECIMAL(10, 2) DEFAULT 1.00,
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  
  -- Dates
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  renewed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, status) WHERE status = 'active'
);

-- IPTV Usage Logs
CREATE TABLE iptv_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  subscription_id BIGINT REFERENCES iptv_subscriptions(id) ON DELETE CASCADE,
  
  device_info JSONB,
  ip_address VARCHAR(45),
  
  connected_at TIMESTAMP DEFAULT NOW(),
  disconnected_at TIMESTAMP
);

-- ====================================
-- UNIVERSAL TABLES
-- ====================================

-- Payments (Universal payment tracking)
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  user_id BIGINT REFERENCES users(id),
  
  -- Service identification
  service_type VARCHAR(50) NOT NULL,
  service_id BIGINT,
  
  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment method
  payment_method VARCHAR(50) NOT NULL,
  
  -- Stripe
  stripe_session_id VARCHAR(255),
  stripe_payment_intent VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  description TEXT,
  
  -- Timestamps
  paid_at TIMESTAMP,
  failed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  
  -- Metadata
  data JSONB DEFAULT '{}',
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id BIGINT,
  
  details JSONB DEFAULT '{}',
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Users
CREATE TABLE admin_users (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) UNIQUE,
  
  role VARCHAR(50) DEFAULT 'admin',
  permissions JSONB DEFAULT '[]',
  
  is_super_admin BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- System Settings
CREATE TABLE system_settings (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  type VARCHAR(50) DEFAULT 'string',
  
  description TEXT,
  
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================

-- Users
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);

-- Products
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Payments
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_stripe_session ON payments(stripe_session_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_service ON payments(service_type, service_id);

-- Appointments
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Support Tickets
CREATE INDEX idx_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_number ON support_tickets(ticket_number);

-- Course Enrollments
CREATE INDEX idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);

-- IPTV Subscriptions
CREATE INDEX idx_iptv_user ON iptv_subscriptions(user_id);
CREATE INDEX idx_iptv_status ON iptv_subscriptions(status);
CREATE INDEX idx_iptv_expires ON iptv_subscriptions(expires_at);

-- Activity Logs
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

---

## Part 2: Complete API Endpoints

### **API Structure:**

```
BASE_URL: https://api.muntushop.com
Version: /api/v1
```

### **Authentication:**

```javascript
// All authenticated routes require JWT token
Headers: {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

### **API Routes:**

```javascript
// ====================================
// AUTH ENDPOINTS
// ====================================

POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/verify-phone
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me

// ====================================
// SHOPPING ENDPOINTS
// ====================================

// Products
GET    /api/v1/products
GET    /api/v1/products/:id
GET    /api/v1/products/category/:category
GET    /api/v1/products/search?q=:query

// Cart
GET    /api/v1/cart
POST   /api/v1/cart/add
PUT    /api/v1/cart/update/:itemId
DELETE /api/v1/cart/remove/:itemId
DELETE /api/v1/cart/clear

// Orders
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders/create
GET    /api/v1/orders/:id/track

// Reviews
POST   /api/v1/products/:id/reviews
GET    /api/v1/products/:id/reviews

// ====================================
// BULK MESSAGING ENDPOINTS
// ====================================

// Clients
POST   /api/v1/messaging/clients
GET    /api/v1/messaging/clients/:id
PUT    /api/v1/messaging/clients/:id

// Contacts
POST   /api/v1/messaging/contacts
GET    /api/v1/messaging/contacts
PUT    /api/v1/messaging/contacts/:id
DELETE /api/v1/messaging/contacts/:id
POST   /api/v1/messaging/contacts/import

// Campaigns
POST   /api/v1/messaging/campaigns
GET    /api/v1/messaging/campaigns
GET    /api/v1/messaging/campaigns/:id
PUT    /api/v1/messaging/campaigns/:id
POST   /api/v1/messaging/campaigns/:id/send
GET    /api/v1/messaging/campaigns/:id/analytics

// ====================================
// CUSTOMER SUPPORT ENDPOINTS
// ====================================

// Tickets
POST   /api/v1/support/tickets
GET    /api/v1/support/tickets
GET    /api/v1/support/tickets/:id
PUT    /api/v1/support/tickets/:id
POST   /api/v1/support/tickets/:id/messages
GET    /api/v1/support/tickets/:id/messages

// ====================================
// APPOINTMENTS ENDPOINTS
// ====================================

// Providers
GET    /api/v1/appointments/providers
GET    /api/v1/appointments/providers/:id
GET    /api/v1/appointments/providers/:id/services
GET    /api/v1/appointments/providers/:id/availability

// Bookings
POST   /api/v1/appointments/book
GET    /api/v1/appointments
GET    /api/v1/appointments/:id
PUT    /api/v1/appointments/:id/reschedule
DELETE /api/v1/appointments/:id/cancel

// ====================================
// GROUP MANAGEMENT ENDPOINTS
// ====================================

POST   /api/v1/groups
GET    /api/v1/groups
GET    /api/v1/groups/:id
PUT    /api/v1/groups/:id
DELETE /api/v1/groups/:id
GET    /api/v1/groups/:id/members
GET    /api/v1/groups/:id/analytics
POST   /api/v1/groups/:id/announcements

// ====================================
// MONEY ASSISTANT ENDPOINTS
// ====================================

POST   /api/v1/money/transactions
GET    /api/v1/money/transactions
GET    /api/v1/money/transactions/:id
GET    /api/v1/money/balance
GET    /api/v1/money/report/:month
POST   /api/v1/money/budgets
GET    /api/v1/money/budgets

// ====================================
// EDUCATION ENDPOINTS
// ====================================

// Courses
GET    /api/v1/courses
GET    /api/v1/courses/:id
GET    /api/v1/courses/:id/lessons
POST   /api/v1/courses/:id/enroll
GET    /api/v1/courses/my-enrollments

// Progress
GET    /api/v1/enrollments/:id
PUT    /api/v1/enrollments/:id/progress
POST   /api/v1/quizzes/:id/attempt
GET    /api/v1/enrollments/:id/certificate

// ====================================
// NEWS ENDPOINTS
// ====================================

POST   /api/v1/news/subscribe
GET    /api/v1/news/articles
GET    /api/v1/news/articles/:id
PUT    /api/v1/news/preferences

// ====================================
// MARKETING ENDPOINTS
// ====================================

POST   /api/v1/marketing/campaigns
GET    /api/v1/marketing/campaigns
GET    /api/v1/marketing/campaigns/:id
PUT    /api/v1/marketing/campaigns/:id
GET    /api/v1/marketing/campaigns/:id/analytics

// ====================================
// B2B ENDPOINTS
// ====================================

GET    /api/v1/b2b/catalog
POST   /api/v1/b2b/orders
GET    /api/v1/b2b/orders
GET    /api/v1/b2b/orders/:id
GET    /api/v1/b2b/invoices

// ====================================
// IPTV ENDPOINTS
// ====================================

GET    /api/v1/iptv/plans
POST   /api/v1/iptv/subscribe
GET    /api/v1/iptv/subscription
PUT    /api/v1/iptv/subscription/renew
GET    /api/v1/iptv/channels

// ====================================
// PAYMENT ENDPOINTS
// ====================================

POST   /api/v1/payments/create-session
POST   /api/v1/payments/webhook/stripe
GET    /api/v1/payments/history
GET    /api/v1/payments/:id

// ====================================
// ADMIN ENDPOINTS
// ====================================

// Dashboard
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/analytics

// Users
GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id
PUT    /api/v1/admin/users/:id
DELETE /api/v1/admin/users/:id

// Products
POST   /api/v1/admin/products
PUT    /api/v1/admin/products/:id
DELETE /api/v1/admin/products/:id

// Orders
GET    /api/v1/admin/orders
PUT    /api/v1/admin/orders/:id/status

// All Services Management
GET    /api/v1/admin/:service/overview
PUT    /api/v1/admin/:service/:id

// Settings
GET    /api/v1/admin/settings
PUT    /api/v1/admin/settings

// ====================================
// WEBHOOKS
// ====================================

POST   /webhooks/greenapi
POST   /webhooks/stripe
```

---

## Part 3: Railway Deployment

### **Step 1: Prepare Your Code**

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/yourusername/muntushop-platform.git
git push -u origin main
```

### **Step 2: Create Railway Project**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Link to GitHub repo
railway link
```

### **Step 3: Add PostgreSQL Database**

```
1. Go to Railway Dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Database will be provisioned
4. Copy DATABASE_URL from variables
```

### **Step 4: Environment Variables**

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Green API
GREEN_API_INSTANCE_ID=your_instance_id
GREEN_API_TOKEN=your_token

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# JWT
JWT_SECRET=your-super-secret-key-change-this

# Frontend URL
FRONTEND_URL=https://your-frontend.netlify.app

# Environment
NODE_ENV=production
PORT=3000
```

Add to Railway:

```bash
# Add each variable
railway variables set DATABASE_URL=postgresql://...
railway variables set GREEN_API_INSTANCE_ID=...
railway variables set GREEN_API_TOKEN=...
railway variables set STRIPE_SECRET_KEY=...
railway variables set JWT_SECRET=...
railway variables set FRONTEND_URL=...
```

### **Step 5: Deploy Backend**

```bash
# Deploy
railway up

# View logs
railway logs

# Open deployment
railway open
```

### **Step 6: Run Database Migrations**

```bash
# Connect to Railway database
railway run npm run migrate

# Or manually
railway run psql $DATABASE_URL < schema.sql
```

### **Railway Configuration (`railway.toml`):**

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

## Part 4: Netlify Deployment (Frontend)

### **Step 1: Build Frontend**

```bash
cd frontend

# Install dependencies
npm install

# Build
npm run build

# Test build locally
npm run preview
```

### **Step 2: Deploy to Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Or link to GitHub for auto-deploy
netlify init
```

### **Step 3: Environment Variables**

In Netlify Dashboard:

```
Site Settings → Environment Variables

VITE_API_URL=https://your-backend.railway.app/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
```

### **Netlify Configuration (`netlify.toml`):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

---

## Part 5: Post-Deployment Setup

### **1. Configure Green API Webhook:**

```
1. Login to Green API Dashboard
2. Go to Settings → Webhooks
3. Set webhook URL: https://your-backend.railway.app/webhooks/greenapi
4. Enable webhook
5. Test webhook
```

### **2. Configure Stripe Webhooks:**

```
1. Login to Stripe Dashboard
2. Go to Developers → Webhooks
3. Add endpoint: https://your-backend.railway.app/webhooks/stripe
4. Select events:
   - checkout.session.completed
   - checkout.session.expired
   - payment_intent.succeeded
5. Copy webhook secret
6. Add to Railway environment variables
```

### **3. Test Complete Flow:**

```bash
# Test WhatsApp webhook
curl -X POST https://your-backend.railway.app/webhooks/greenapi \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test Stripe webhook
stripe listen --forward-to localhost:3000/webhooks/stripe
```

### **4. Monitor & Logs:**

```bash
# Railway logs
railway logs --follow

# Check health
curl https://your-backend.railway.app/health
```

---

## Part 6: Database Backup & Maintenance

### **Automated Backups:**

```bash
# Add to cron job
0 2 * * * pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Upload to cloud storage
aws s3 cp backup_*.sql s3://your-bucket/backups/
```

### **Database Maintenance:**

```sql
-- Vacuum database weekly
VACUUM ANALYZE;

-- Update statistics
ANALYZE;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

**Your complete database, API, and deployment guide is ready!**

Continue to next file for Admin & User Panels →

*Part 3 of 7 - Database, API & Deployment*  
*Last Updated: December 15, 2024*
