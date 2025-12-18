-- MuntuShop Platform - Complete Database Schema
-- PostgreSQL 15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- CORE TABLES
-- ====================================

-- Users Table (Main user registry)
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS products (
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
CREATE TABLE IF NOT EXISTS carts (
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
CREATE TABLE IF NOT EXISTS orders (
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
CREATE TABLE IF NOT EXISTS product_reviews (
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
CREATE TABLE IF NOT EXISTS messaging_clients (
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
CREATE TABLE IF NOT EXISTS messaging_contacts (
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
CREATE TABLE IF NOT EXISTS messaging_campaigns (
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

-- Campaign Messages
CREATE TABLE IF NOT EXISTS campaign_messages (
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

-- Support Clients
CREATE TABLE IF NOT EXISTS support_clients (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
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
CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  
  user_id BIGINT REFERENCES users(id),
  client_id BIGINT REFERENCES support_clients(id),
  assigned_to BIGINT REFERENCES users(id),
  
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  
  description TEXT,
  
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id),
  
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 4: APPOINTMENTS
-- ====================================

-- Appointment Providers
CREATE TABLE IF NOT EXISTS appointment_providers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  description TEXT,
  
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  location JSONB,
  
  working_hours JSONB,
  booking_buffer INTEGER DEFAULT 30,
  max_advance_booking INTEGER DEFAULT 30,
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointment Services
CREATE TABLE IF NOT EXISTS appointment_services (
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
CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  appointment_number VARCHAR(50) UNIQUE NOT NULL,
  
  user_id BIGINT REFERENCES users(id),
  provider_id BIGINT REFERENCES appointment_providers(id),
  service_id BIGINT REFERENCES appointment_services(id),
  
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  
  price DECIMAL(10, 2) DEFAULT 1.00,
  payment_status VARCHAR(50) DEFAULT 'pending',
  
  status VARCHAR(50) DEFAULT 'confirmed',
  
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255),
  notes TEXT,
  
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP,
  
  cancelled_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 5: GROUP MANAGEMENT
-- ====================================

-- Managed Groups
CREATE TABLE IF NOT EXISTS managed_groups (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES users(id),
  
  green_api_group_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  member_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  
  auto_welcome BOOLEAN DEFAULT true,
  welcome_message TEXT,
  auto_moderate BOOLEAN DEFAULT false,
  rules JSONB DEFAULT '[]',
  
  features JSONB DEFAULT '{}',
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Group Members
CREATE TABLE IF NOT EXISTS group_members (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT REFERENCES managed_groups(id) ON DELETE CASCADE,
  
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  
  is_admin BOOLEAN DEFAULT false,
  
  messages_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP,
  
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  
  UNIQUE(group_id, phone)
);

-- Group Announcements
CREATE TABLE IF NOT EXISTS group_announcements (
  id BIGSERIAL PRIMARY KEY,
  group_id BIGINT REFERENCES managed_groups(id) ON DELETE CASCADE,
  
  message TEXT NOT NULL,
  
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 6: MONEY ASSISTANT
-- ====================================

-- Money Subscriptions
CREATE TABLE IF NOT EXISTS money_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) UNIQUE,
  
  plan VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  
  monthly_transaction_limit INTEGER,
  transactions_this_month INTEGER DEFAULT 0,
  
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Money Transactions
CREATE TABLE IF NOT EXISTS money_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  recipient VARCHAR(255),
  sender VARCHAR(255),
  
  reference_code VARCHAR(100),
  external_ref VARCHAR(100),
  
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',
  
  status VARCHAR(50) DEFAULT 'completed',
  
  notes TEXT,
  
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
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
CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  
  instructor_name VARCHAR(255),
  instructor_bio TEXT,
  
  category VARCHAR(100),
  level VARCHAR(50),
  duration_weeks INTEGER,
  lessons_count INTEGER,
  
  price DECIMAL(10, 2) DEFAULT 1.00,
  
  thumbnail_url TEXT,
  preview_video_url TEXT,
  
  objectives JSONB DEFAULT '[]',
  
  rating DECIMAL(3, 2) DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,
  students_count INTEGER DEFAULT 0,
  
  is_published BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course Lessons
CREATE TABLE IF NOT EXISTS course_lessons (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  content TEXT,
  lesson_number INTEGER NOT NULL,
  
  video_url TEXT,
  pdf_url TEXT,
  attachments JSONB DEFAULT '[]',
  
  duration_minutes INTEGER,
  
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Course Enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  course_id BIGINT REFERENCES courses(id),
  
  progress INTEGER DEFAULT 0,
  current_lesson_id BIGINT REFERENCES course_lessons(id),
  completed_lessons JSONB DEFAULT '[]',
  
  status VARCHAR(50) DEFAULT 'active',
  
  completed_at TIMESTAMP,
  certificate_issued BOOLEAN DEFAULT false,
  
  enrolled_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP,
  
  UNIQUE(user_id, course_id)
);

-- Course Quizzes
CREATE TABLE IF NOT EXISTS course_quizzes (
  id BIGSERIAL PRIMARY KEY,
  lesson_id BIGINT REFERENCES course_lessons(id) ON DELETE CASCADE,
  
  title VARCHAR(255),
  questions JSONB NOT NULL,
  passing_score INTEGER DEFAULT 70,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
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
CREATE TABLE IF NOT EXISTS news_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) UNIQUE,
  
  tier VARCHAR(50) DEFAULT 'free',
  
  topics JSONB DEFAULT '[]',
  locations JSONB DEFAULT '[]',
  
  daily_limit INTEGER DEFAULT 3,
  sent_today INTEGER DEFAULT 0,
  
  morning_brief BOOLEAN DEFAULT true,
  afternoon_update BOOLEAN DEFAULT false,
  evening_news BOOLEAN DEFAULT false,
  
  status VARCHAR(50) DEFAULT 'active',
  
  last_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- News Articles
CREATE TABLE IF NOT EXISTS news_articles (
  id BIGSERIAL PRIMARY KEY,
  
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content TEXT,
  
  category VARCHAR(100),
  topics JSONB DEFAULT '[]',
  location VARCHAR(100),
  
  image_url TEXT,
  source_url TEXT,
  
  author VARCHAR(255),
  source VARCHAR(100),
  
  is_published BOOLEAN DEFAULT true,
  is_breaking BOOLEAN DEFAULT false,
  
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- News Delivery Log
CREATE TABLE IF NOT EXISTS news_deliveries (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  article_id BIGINT REFERENCES news_articles(id),
  
  delivered_at TIMESTAMP DEFAULT NOW()
);

-- ====================================
-- SERVICE 9: MARKETING
-- ====================================

-- Marketing Clients
CREATE TABLE IF NOT EXISTS marketing_clients (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  company_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  
  plan VARCHAR(50) NOT NULL,
  campaigns_limit INTEGER,
  campaigns_used INTEGER DEFAULT 0,
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES marketing_clients(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(100),
  
  message TEXT,
  images JSONB DEFAULT '[]',
  
  target_audience JSONB,
  
  budget DECIMAL(10, 2),
  spent DECIMAL(10, 2) DEFAULT 0.00,
  
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
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
CREATE TABLE IF NOT EXISTS b2b_businesses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  tax_id VARCHAR(100),
  
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  
  subscription_plan VARCHAR(50),
  credit_limit DECIMAL(10, 2),
  outstanding_balance DECIMAL(10, 2) DEFAULT 0.00,
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- B2B Catalog
CREATE TABLE IF NOT EXISTS b2b_catalog (
  id BIGSERIAL PRIMARY KEY,
  
  supplier_id BIGINT,
  
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  description TEXT,
  
  price DECIMAL(10, 2) DEFAULT 1.00,
  unit VARCHAR(50),
  
  min_order_quantity INTEGER,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- B2B Orders
CREATE TABLE IF NOT EXISTS b2b_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  business_id BIGINT REFERENCES b2b_businesses(id),
  
  items JSONB NOT NULL,
  
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_terms VARCHAR(100),
  due_date DATE,
  
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
CREATE TABLE IF NOT EXISTS iptv_plans (
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
CREATE TABLE IF NOT EXISTS iptv_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  plan_id BIGINT REFERENCES iptv_plans(id),
  
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  
  playlist_url TEXT,
  server_url TEXT,
  
  status VARCHAR(50) DEFAULT 'active',
  
  price DECIMAL(10, 2) DEFAULT 1.00,
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  renewed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- IPTV Usage Logs
CREATE TABLE IF NOT EXISTS iptv_usage_logs (
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
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  user_id BIGINT REFERENCES users(id),
  
  service_type VARCHAR(50) NOT NULL,
  service_id BIGINT,
  
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  payment_method VARCHAR(50) NOT NULL,
  
  stripe_session_id VARCHAR(255),
  stripe_payment_intent VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  
  status VARCHAR(50) DEFAULT 'pending',
  
  metadata JSONB DEFAULT '{}',
  description TEXT,
  
  paid_at TIMESTAMP,
  failed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  
  data JSONB DEFAULT '{}',
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
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
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) UNIQUE,
  
  role VARCHAR(50) DEFAULT 'admin',
  permissions JSONB DEFAULT '[]',
  
  is_super_admin BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
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
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_service ON payments(service_type, service_id);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Support Tickets
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON support_tickets(ticket_number);

-- Course Enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);

-- IPTV Subscriptions
CREATE INDEX IF NOT EXISTS idx_iptv_user ON iptv_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_iptv_status ON iptv_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_iptv_expires ON iptv_subscriptions(expires_at);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

