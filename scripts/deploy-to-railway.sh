#!/bin/bash
# Deploy MuntuShop Platform to Railway
# This script automates the Railway deployment process

set -e

echo "🚂 MuntuShop Platform - Railway Deployment Script"
echo "=================================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in
echo "1️⃣ Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "⚠️  Not logged in to Railway. Please login:"
    echo "   railway login"
    echo ""
    read -p "Press Enter after logging in..."
fi

# Initialize Railway project if not already linked
if [ ! -f ".railway/project.json" ]; then
    echo "2️⃣ Initializing Railway project..."
    railway init
else
    echo "✅ Railway project already initialized"
fi

# Add PostgreSQL if not exists
echo ""
echo "3️⃣ Checking for PostgreSQL database..."
if ! railway service list 2>/dev/null | grep -q postgresql; then
    echo "📦 Adding PostgreSQL database..."
    railway add postgresql
    sleep 2
else
    echo "✅ PostgreSQL database already exists"
fi

# Deploy the application
echo ""
echo "4️⃣ Deploying application..."
railway up --detach

echo ""
echo "5️⃣ Getting deployment URL..."
DEPLOY_URL=$(railway domain 2>/dev/null | head -1 || echo "Check Railway dashboard")

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Configure environment variables in Railway dashboard"
echo "   2. Run database migrations: railway run psql \$DATABASE_URL -f backend/database/schema.sql"
echo "   3. Your app URL: $DEPLOY_URL"
echo "   4. Configure webhooks:"
echo "      - Green API: $DEPLOY_URL/webhooks/greenapi"
echo "      - Stripe: $DEPLOY_URL/webhooks/stripe"
echo ""
echo "📝 View logs: railway logs --follow"
echo "📊 View dashboard: railway open"

