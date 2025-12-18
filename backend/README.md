# MuntuShop Platform - Backend

Complete multi-service WhatsApp platform backend built with Node.js, Express, PostgreSQL, Green API, and Stripe.

## Features

- ✅ 11 integrated services (Shopping, IPTV, Support, Appointments, etc.)
- ✅ WhatsApp automation via Green API
- ✅ Stripe payment processing
- ✅ PostgreSQL database
- ✅ RESTful API endpoints
- ✅ Webhook handlers

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Setup database:
```bash
# Make sure PostgreSQL is running
# Run schema.sql to create all tables
psql $DATABASE_URL -f database/schema.sql
```

4. Start server:
```bash
npm start
# or
npm run dev
```

## API Endpoints

- Health: `GET /health`
- Webhooks: `POST /webhooks/greenapi`, `POST /webhooks/stripe`
- API: `/api/v1/*`
- Admin: `/api/v1/admin/*`

## Services Implemented

- ✅ Shopping Service (Products, Cart, Orders)
- ✅ IPTV Service (Subscriptions, Plans)
- ✅ Payment Service (Stripe integration)
- ✅ WhatsApp Handler (Message routing)

## Documentation

See `/Md-files` for complete documentation.

