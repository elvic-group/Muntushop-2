# 🚀 MuntuShop Platform

**Complete Multi-Service WhatsApp Platform**

A comprehensive WhatsApp-based platform integrating 11 services including Shopping, IPTV, Customer Support, Appointments, and more.

## ✨ Features

- ✅ **11 Integrated Services** - Shopping, IPTV, Messaging, Support, Appointments, Groups, Money, Courses, News, Marketing, B2B
- ✅ **WhatsApp Automation** - Green API integration for seamless messaging
- ✅ **Payment Processing** - Stripe integration for secure payments
- ✅ **Complete Backend** - Node.js + Express + PostgreSQL
- ✅ **RESTful API** - Comprehensive API endpoints for all services
- ✅ **Database** - PostgreSQL with complete schema for all services

## 🏗️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL 15
- **WhatsApp:** Green API
- **Payments:** Stripe
- **Deployment:** Railway (Backend), Netlify (Frontend)

## 📦 Project Structure

```
muntushop-platform/
├── backend/              # Backend API server
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── services/    # Business logic services
│   │   ├── routes/      # API routes
│   │   └── templates/   # WhatsApp message templates
│   ├── database/        # Database schema
│   └── package.json
├── Md-files/            # Complete documentation
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Green API account
- Stripe account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/muntushop-platform.git
cd muntushop-platform
```

2. **Install dependencies**
```bash
cd backend
npm install
```

3. **Configure environment variables**
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
# See backend/.env.example for required variables
```

4. **Setup database**
```bash
# Create database
createdb muntushop

# Run schema
psql $DATABASE_URL -f backend/database/schema.sql
```

5. **Start server**
```bash
cd backend
npm start
```

Server will start on `http://localhost:3000`

## 📚 Documentation

Complete documentation available in `/Md-files`:

- `QUICK-START-GUIDE.md` - 7-day implementation plan
- `COMPLETE-PLATFORM-IMPLEMENTATION.md` - Architecture overview
- `DATABASE-API-DEPLOYMENT.md` - Database schema & deployment
- `ADMIN-USER-PANELS.md` - UI specifications
- `Railway deploy.md` - Railway deployment guide

## 🔧 API Endpoints

- Health: `GET /health`
- Webhooks: `POST /webhooks/greenapi`, `POST /webhooks/stripe`
- API: `/api/v1/*`
- Admin: `/api/v1/admin/*`

See documentation for complete API reference.

## 🚢 Deployment

### Railway (Backend)

See `Md-files/Railway deploy.md` for complete deployment guide.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Environment Variables

Required environment variables for Railway:
- `DATABASE_URL`
- `GREEN_ID_INSTANCE`
- `GREEN_API_TOKEN_INSTANCE`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`

## 📱 WhatsApp Integration

1. Configure Green API webhook in dashboard
2. Set webhook URL to: `https://your-domain.com/webhooks/greenapi`
3. Test by sending "Hi" to your WhatsApp number

## 💳 Payment Integration

1. Configure Stripe webhook in dashboard
2. Set webhook URL to: `https://your-domain.com/webhooks/stripe`
3. Select events: `checkout.session.completed`, `checkout.session.expired`
4. Add webhook secret to environment variables

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, see documentation in `/Md-files` or open an issue.

---

**Built with ❤️ for the MuntuShop Platform**

