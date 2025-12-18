#!/bin/bash
# Setup GitHub → Heroku Automatic Deployment
# This script helps automate the GitHub integration setup

set -e

echo "🚀 Setting up GitHub → Heroku Automatic Deployment"
echo "=================================================="
echo ""

APP_NAME="muntushop-production"
GITHUB_REPO="elvic-group/Muntushop-2"
BRANCH="main"

echo "📋 Configuration:"
echo "   App: $APP_NAME"
echo "   GitHub Repo: $GITHUB_REPO"
echo "   Branch: $BRANCH"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI not found. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if logged in
echo "🔐 Checking Heroku authentication..."
if ! heroku auth:whoami &> /dev/null; then
    echo "⚠️  Not logged in to Heroku. Please login:"
    heroku login
fi

echo "✅ Heroku authentication verified"
echo ""

# Check app exists
echo "🔍 Verifying Heroku app..."
if ! heroku apps:info --app $APP_NAME &> /dev/null; then
    echo "❌ App $APP_NAME not found!"
    exit 1
fi

echo "✅ App verified: $APP_NAME"
echo ""

echo "📝 IMPORTANT: GitHub integration requires OAuth authorization"
echo "   which must be done through the Heroku Dashboard."
echo ""
echo "🔗 Please complete these steps:"
echo ""
echo "   1. Open: https://dashboard.heroku.com/apps/$APP_NAME/deploy/github"
echo ""
echo "   2. Click 'Connect to GitHub' (if not already connected)"
echo "      - Authorize Heroku to access your GitHub account"
echo ""
echo "   3. Search for repository: $GITHUB_REPO"
echo "      - Click 'Connect'"
echo ""
echo "   4. Enable Automatic Deploys:"
echo "      - Select branch: $BRANCH"
echo "      - Click 'Enable Automatic Deploys'"
echo ""
echo "   5. (Optional) Click 'Deploy Branch' to deploy immediately"
echo ""

# Try to open the dashboard
if command -v open &> /dev/null; then
    echo "🌐 Opening Heroku Dashboard..."
    open "https://dashboard.heroku.com/apps/$APP_NAME/deploy/github"
elif command -v xdg-open &> /dev/null; then
    xdg-open "https://dashboard.heroku.com/apps/$APP_NAME/deploy/github"
fi

echo ""
echo "⏳ After completing the steps above, press Enter to verify..."
read -p "Press Enter when done..."

echo ""
echo "🔍 Verifying GitHub integration..."
sleep 2

# Check if GitHub is connected (this might not work via API, but we can try)
GITHUB_INFO=$(heroku apps:info --app $APP_NAME --json 2>/dev/null | jq -r '.github_repo // "not connected"')

if [ "$GITHUB_INFO" != "not connected" ] && [ "$GITHUB_INFO" != "null" ]; then
    echo "✅ GitHub integration verified!"
    echo "   Repository: $GITHUB_INFO"
else
    echo "⚠️  Could not verify GitHub integration via API"
    echo "   Please check the Heroku Dashboard to confirm it's connected"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Push to GitHub: git push origin $BRANCH"
echo "   2. Heroku will automatically deploy"
echo "   3. Check deployment status in Heroku Dashboard"
echo ""

