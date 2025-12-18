# MuntuShop Platform

> **A comprehensive WhatsApp-based multi-service platform**  
> Built with Node.js, Express, PostgreSQL, Green API, and Stripe

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Development Guidelines](#development-guidelines)
5. [Code Standards](#code-standards)
6. [API Documentation](#api-documentation)
7. [Services Documentation](#services-documentation)
8. [Database Schema](#database-schema)
9. [Environment Variables](#environment-variables)
10. [Deployment](#deployment)
11. [Testing](#testing)
12. [Change Log](#change-log)

---

## 🎯 Project Overview

### Purpose

MuntuShop is a multi-service WhatsApp platform that enables businesses to offer 11 integrated services through WhatsApp messaging. Users interact with the platform via WhatsApp, and all services are accessible through a unified menu system.

### Core Features

- **11 Integrated Services**: Shopping, IPTV, Messaging, Support, Appointments, Groups, Money, Courses, News, Marketing, B2B
- **WhatsApp Integration**: Full automation via Green API
- **Payment Processing**: Stripe integration for secure payments
- **Admin Panel**: Complete admin dashboard for managing orders, products, and users
- **RESTful API**: Comprehensive API for all platform features

### Service Pricing

All services are currently priced at **$1.00 each** (configurable per service).

---

## 🏗️ Architecture & Tech Stack

### Backend Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL 8.16.3
- **ORM**: Native pg driver
- **Authentication**: JWT (jsonwebtoken 9.0.3)
- **Security**: Helmet 8.1.0, CORS 2.8.5
- **Logging**: Morgan 1.10.1

### External Services

- **WhatsApp**: Green API (@green-api/whatsapp-api-client 0.4.4)
- **Payments**: Stripe 20.0.0
- **Utilities**: bcryptjs, uuid, dotenv

### Project Type

- **Type**: CommonJS (ES Modules not used)
- **Package Manager**: npm
- **Deployment**: Railway (backend), Heroku compatible

---

## 📁 Project Structure

```
Muntushop-2/
├── .cursor/                    # Cursor IDE rules and configuration
│   ├── rules/                  # Project-specific coding rules
│   └── commands/               # Cursor commands
│
├── backend/                    # Main backend application
│   ├── src/
│   │   ├── app.js             # Express app entry point
│   │   ├── config/            # Configuration modules
│   │   │   ├── database.js    # PostgreSQL connection
│   │   │   ├── greenapi.js    # Green API client
│   │   │   ├── stripe.js      # Stripe client
│   │   │   └── whatsapp.config.js
│   │   ├── routes/            # API route handlers
│   │   │   ├── admin/         # Admin routes
│   │   │   ├── api/           # Public API routes
│   │   │   └── webhooks/      # Webhook handlers
│   │   ├── services/          # Business logic services
│   │   │   ├── greenapi/      # WhatsApp handler
│   │   │   ├── iptv/          # IPTV service
│   │   │   ├── shopping/      # Shopping service
│   │   │   ├── payments.js    # Payment service
│   │   │   └── whatsapp_service.js
│   │   ├── templates/         # WhatsApp message templates
│   │   │   ├── whatsapp/      # WhatsApp templates
│   │   │   └── emails/        # Email templates
│   │   ├── middleware/        # Express middleware
│   │   └── utils/             # Utility functions
│   ├── database/
│   │   └── schema.sql         # Database schema
│   ├── prisma/                # Prisma config (if used)
│   ├── package.json           # Backend dependencies
│   ├── Procfile              # Heroku deployment config
│   └── nixpacks.toml         # Nixpacks config
│
├── docs/                      # Documentation files
│   ├── Md-files/             # Additional documentation
│   └── *.md                  # Various guides and docs
│
├── scripts/                   # Deployment and utility scripts
│   ├── deploy-*.sh           # Deployment scripts
│   └── *.py                  # Python utilities
│
├── tests/                     # Test files
│   ├── test_*.js             # Test scripts
│   └── test_*.json           # Test data
│
├── database/                  # Database migration files
│   └── migrations/           # SQL migration files
│
├── legacy/                    # Old/unused code (archived)
│   ├── services/             # Legacy service files
│   └── templates/            # Legacy templates
│
├── cursor-commands/           # Cursor command templates
├── .env                       # Environment variables (not in git)
├── package.json               # Root package.json
├── Procfile                   # Root Procfile
├── railway.json               # Railway config
├── railway.toml               # Railway config
└── README.md                  # This file
```

### Key Directories

- **`backend/src/`**: All application source code
- **`backend/src/routes/`**: API route definitions
- **`backend/src/services/`**: Business logic and service implementations
- **`backend/src/templates/`**: Message templates for WhatsApp
- **`backend/src/config/`**: Configuration and client setup
- **`docs/`**: All project documentation
- **`tests/`**: Test files and test data
- **`legacy/`**: Archived code (not actively used)

---

## 💻 Development Guidelines

### Getting Started

#### Prerequisites

- Node.js 18 or higher
- PostgreSQL database (local or remote)
- Green API account and credentials
- Stripe account and API keys

#### Installation

```bash
# 1. Install root dependencies
npm install

# 2. Install backend dependencies
cd backend
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Run database migrations
psql $DATABASE_URL -f database/schema.sql

# 5. Start the development server
npm start
# or
npm run dev
```

### Development Workflow

1. **Always work from `backend/src/` directory**
2. **Follow the existing service patterns** (see Services Documentation)
3. **Update templates** when adding new message flows
4. **Test locally** before committing
5. **Update this README** when making significant changes

### NPM Scripts

#### Root Level

```bash
npm start          # Start backend server
npm run dev        # Start backend in dev mode
npm test           # Run tests
```

#### Backend Level

```bash
cd backend
npm start          # Start server
npm run dev        # Start server (same as start)
npm run migrate    # Run database migrations
```

---

## 📝 Code Standards

### General Principles

- **Use async/await** - No callbacks
- **Parameterized queries** - Always use `$1, $2, ...` for SQL
- **Error handling** - Always wrap in try-catch
- **Descriptive names** - No abbreviations
- **Single responsibility** - One service per file
- **DRY principle** - Don't repeat code

### Code Style

#### JavaScript/Node.js

```javascript
// ✅ DO: Use async/await
async function getUser(id) {
  const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
}

// ❌ DON'T: Use callbacks
function getUser(id, callback) {
  db.query("SELECT * FROM users WHERE id = $1", [id], (err, result) => {
    callback(err, result.rows[0]);
  });
}

// ✅ DO: Parameterized queries (prevents SQL injection)
const result = await db.query("SELECT * FROM users WHERE phone = $1", [phone]);

// ❌ DON'T: String concatenation (SQL injection risk)
const result = await db.query(`SELECT * FROM users WHERE phone = '${phone}'`);
```

#### File Organization

- **One service per file**
- **Group related functions**
- **Export single instance for services**
- **Use index.js for module exports**

### Error Handling Pattern

```javascript
// Service method
async function serviceMethod() {
  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Service error:", error);
    throw error; // Let route handler catch it
  }
}

// Route handler
router.get("/endpoint", async (req, res) => {
  try {
    const data = await serviceMethod();
    res.json(data);
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({
      error: error.message,
      code: "INTERNAL_ERROR",
    });
  }
});
```

### Database Query Patterns

```javascript
// Single result
const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
const user = result.rows[0];

// Multiple results
const result = await db.query("SELECT * FROM users WHERE is_active = true");
const users = result.rows;

// Insert with RETURNING
const result = await db.query(
  `
  INSERT INTO products (name, price) 
  VALUES ($1, $2) 
  RETURNING *
`,
  [name, price]
);
const newProduct = result.rows[0];

// Update
await db.query(
  `
  UPDATE users 
  SET name = $1, updated_at = NOW() 
  WHERE id = $2
`,
  [name, userId]
);

// Transaction
const client = await db.connect();
try {
  await client.query("BEGIN");
  // ... multiple queries
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
```

---

## 🔌 API Documentation

### Base URL

- **Development**: `http://localhost:3000`
- **Production**: Set via `BACKEND_URL` environment variable

### Authentication

Most endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <token>
```

### Endpoints

#### Health Check

```
GET /health
```

Returns server status and uptime.

#### Webhooks

```
POST /webhooks/greenapi    # WhatsApp webhooks
POST /webhooks/stripe      # Stripe webhooks
```

#### Public API Routes

All API routes are prefixed with `/api/v1/`:

- `GET/POST /api/v1/auth` - Authentication
- `GET/POST /api/v1/products` - Products management
- `GET/POST /api/v1/orders` - Orders management
- `GET/POST /api/v1/cart` - Shopping cart
- `GET/POST /api/v1/messaging` - Bulk messaging
- `GET/POST /api/v1/support` - Customer support
- `GET/POST /api/v1/appointments` - Appointment booking
- `GET/POST /api/v1/groups` - Group management
- `GET/POST /api/v1/money` - Money assistant
- `GET/POST /api/v1/courses` - Online courses
- `GET/POST /api/v1/news` - News & updates
- `GET/POST /api/v1/marketing` - Marketing services
- `GET/POST /api/v1/b2b` - B2B wholesale
- `GET/POST /api/v1/iptv` - IPTV subscriptions
- `GET/POST /api/v1/payments` - Payment processing

#### Admin Routes

- `GET/POST /api/v1/admin/*` - Admin operations

### Response Format

#### Success Response

```json
{
  "data": {...},
  "message": "Success message"
}
```

#### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 🛍️ Services Documentation

### Service Architecture

Each service follows this pattern:

1. **Route Handler** (`backend/src/routes/api/[service].js`)
2. **Service Logic** (`backend/src/services/[service]/index.js`)
3. **Templates** (`backend/src/templates/whatsapp/[service].js`)

### Implemented Services

#### ✅ Shopping Service

- **Location**: `backend/src/services/shopping/index.js`
- **Routes**: `/api/v1/products`, `/api/v1/orders`, `/api/v1/cart`
- **Features**: Product browsing, cart management, order processing

#### ✅ IPTV Service

- **Location**: `backend/src/services/iptv/index.js`
- **Routes**: `/api/v1/iptv`
- **Features**: Subscription management, package selection

#### ✅ Payment Service

- **Location**: `backend/src/services/payments.js`
- **Routes**: `/api/v1/payments`
- **Features**: Stripe integration, payment processing

#### ✅ WhatsApp Handler

- **Location**: `backend/src/services/greenapi/handler.js`
- **Routes**: `/webhooks/greenapi`
- **Features**: Message routing, service flow management

### Service Template

When creating a new service:

```javascript
// backend/src/services/[service]/index.js
const db = require("../../config/database");
const greenAPI = require("../../config/greenapi");
const templates = require("../../templates/whatsapp");

class ServiceName {
  async handleMessage(user, message) {
    const step = user.current_step;
    const msg = message.toLowerCase().trim();

    // Navigation
    if (msg === "0" || msg === "back") {
      return await this.goBack(user);
    }

    if (msg === "menu") {
      return await this.showMainMenu(user);
    }

    // Route based on step
    switch (step) {
      case "menu":
        return await this.handleMenuSelection(user, msg);
      default:
        return await this.showMenu(user);
    }
  }

  async showMenu(user) {
    await this.updateUserStep(user.id, "menu");
    const menu = templates.serviceName.menu();
    await this.sendMessage(user.phone, menu);
  }

  async sendMessage(phone, text) {
    await greenAPI.message.sendMessage(`${phone}@c.us`, null, text);
  }
}

module.exports = new ServiceName();
```

---

## 🗄️ Database Schema

### Main Tables

- **users** - User accounts and session data
- **products** - Product catalog
- **orders** - Order management
- **cart_items** - Shopping cart
- **payments** - Payment transactions
- **subscriptions** - Service subscriptions
- **admin_users** - Admin accounts
- **support_tickets** - Support system

### Schema Location

- **Main Schema**: `backend/database/schema.sql`
- **Migrations**: `database/migrations/*.sql`

### Running Migrations

```bash
# Run main schema
psql $DATABASE_URL -f backend/database/schema.sql

# Run specific migration
psql $DATABASE_URL -f database/migrations/[migration-name].sql
```

---

## 🔐 Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Green API (WhatsApp)
GREEN_ID_INSTANCE=your_instance_id
GREEN_API_TOKEN_INSTANCE=your_token

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxx

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
PORT=3000
```

### Optional Variables

```bash
# OpenAI (for AI features)
OPENAI_API_KEY=sk-xxxxx

# IPTV
IPTV_SERVER_URL=https://iptv.muntushop.com
```

### Environment File Location

- **Development**: `backend/.env` (not in git)
- **Production**: Set via deployment platform (Railway, Heroku, etc.)

---

## 🚀 Deployment

### Railway Deployment

1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway auto-deploys on push to main branch

### Heroku Deployment

1. Install Heroku CLI
2. Create Heroku app: `heroku create`
3. Set environment variables: `heroku config:set KEY=value`
4. Deploy: `git push heroku main`

### Manual Deployment

```bash
# Build and deploy
npm install
cd backend
npm install
npm start
```

### Database Setup (Production)

```bash
# Run migrations
psql $DATABASE_URL -f backend/database/schema.sql

# Run additional migrations
for file in database/migrations/*.sql; do
  psql $DATABASE_URL -f "$file"
done
```

---

## 🧪 Testing

### Test Structure

- **Location**: `tests/` directory
- **Test Files**: `test_*.js`
- **Test Data**: `test_*.json`

### Running Tests

```bash
# Run all tests
npm test

# Run specific test
node tests/test_whatsapp.js
node tests/test_db_connection.js
```

### Test Files

- `test_whatsapp.js` - WhatsApp integration tests
- `test_db_connection.js` - Database connection tests
- `test_webhook.json` - Webhook test data
- `test_service_webhook.json` - Service webhook test data

---

## 📊 Change Log

> **This section tracks all significant changes to the project**

### 2024-12-18 - Project Cleanup & Restructure

- ✅ Removed duplicate nested `backend/backend/` directory
- ✅ Moved duplicate root services/templates to `legacy/` directory
- ✅ Consolidated all documentation into `docs/` directory
- ✅ Organized test files into `tests/` directory
- ✅ Moved deployment scripts to `scripts/` directory
- ✅ Updated root `package.json` with proper scripts
- ✅ Created comprehensive README.md as project documentation
- ✅ Preserved all `.cursor` rules and configuration files
- ✅ Restored `CURSOR-RULES.md` to root directory

### Future Changes

- All future changes will be documented here
- Include date, description, and affected areas
- Link to related issues or PRs when applicable

---

## 📚 Additional Documentation

### Documentation Files

All detailed documentation is located in the `docs/` directory:

- **Setup Guides**: `QUICK-START.md`, `DEPLOYMENT-STEPS.md`
- **API Documentation**: `COMPLETE-API-IMPLEMENTATION.md`
- **Service Guides**: `ALL_SERVICES_WORKING.md`
- **Deployment**: `RAILWAY-DEPLOY.md`, `HEROKU_DEPLOYMENT_SUCCESS.md`
- **Database**: `FIX-POSTGRESQL.md`, `POSTGRESQL-FIX.md`

### Cursor Rules

- **Location**: `.cursor/rules/` directory
- **Purpose**: Project-specific coding rules and guidelines
- **Files**: Various `.mdc` files for different aspects

---

## 🤝 Contributing

### Code Contribution Guidelines

1. **Follow code standards** outlined in this document
2. **Update README.md** when making significant changes
3. **Test locally** before submitting
4. **Document changes** in the Change Log section
5. **Preserve existing structure** - don't break working code

### Commit Messages

Use conventional commit format:

```
feat: add new shopping feature
fix: resolve payment processing bug
docs: update API documentation
refactor: reorganize service structure
```

---

## 📞 Support & Contact

- **Phone**: +47 96701573
- **Email**: support@muntushop.com
- **Business Hours**: Mon-Fri 9AM-6PM, Sat 10AM-4PM

---

## 📄 License

ISC License

---

## 🔄 Version History

- **v1.0.0** - Initial platform release with 11 services
- Current version: **1.0.0**

---

**Last Updated**: December 18, 2024  
**Maintained By**: MuntuShop Development Team

---

> **Note**: This README.md serves as both project documentation and context for AI assistants. Keep it updated with all significant changes to the project.
