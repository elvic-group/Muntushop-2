#!/bin/bash
# Quick Deploy Script for MuntuShop Platform
# This script will deploy your updated code to Railway

set -e

echo "🚀 MuntuShop Platform - Quick Deploy"
echo "====================================="
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo ""
    echo "⚠️  Please login to Railway first:"
    echo "   railway login"
    echo ""
    read -p "Press Enter after logging in, or Ctrl+C to cancel..."
fi

# Verify login
if ! railway whoami &> /dev/null; then
    echo "❌ Still not logged in. Please run 'railway login' first."
    exit 1
fi

echo "✅ Logged in as: $(railway whoami)"
echo ""

# Check if project is linked
if [ ! -f ".railway/project.json" ]; then
    echo "🔗 Linking to Railway project..."
    railway link
else
    echo "✅ Project already linked"
fi

echo ""
echo "📦 Deploying to Railway..."
echo ""

# Deploy
railway up --detach

echo ""
echo "⏳ Waiting for deployment to start..."
sleep 3

# Get deployment URL
echo ""
echo "🌐 Getting deployment URL..."
DEPLOY_URL=$(railway domain 2>/dev/null | head -1 || echo "Check Railway dashboard")

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Deployment Details:"
echo "   URL: $DEPLOY_URL"
echo ""
echo "📊 Next Steps:"
echo "   1. Monitor logs: railway logs --follow"
echo "   2. Check health: curl $DEPLOY_URL/health"
echo "   3. View dashboard: railway open"
echo ""
echo "🔧 Verify Environment Variables:"
echo "   railway variables"
echo ""
echo "📝 Run Database Migrations (if needed):"
echo "   railway run psql \$DATABASE_URL -f backend/database/schema.sql"
echo ""



