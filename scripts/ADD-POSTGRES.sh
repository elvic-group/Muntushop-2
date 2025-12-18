#!/bin/bash
# Quick script to add PostgreSQL to Railway

set -e

echo "🗄️  Adding PostgreSQL to Railway..."
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in. Run: railway login"
    exit 1
fi

# Add PostgreSQL
echo "Running: railway add --database postgres"
railway add --database postgres

echo ""
echo "✅ PostgreSQL added!"
echo ""
echo "📋 Next steps:"
echo "1. Wait a few seconds for database to provision"
echo "2. Check DATABASE_URL: railway variables | grep DATABASE_URL"
echo "3. Run migrations: railway run psql \$DATABASE_URL -f backend/database/schema.sql"
echo ""




