# GitHub → Heroku Automatic Deployment Setup

## Current Status
- ✅ Heroku app: `muntushop-production`
- ✅ GitHub repo: `elvic-group/Muntushop-2`
- ⚠️ **GitHub integration: Not connected**

## Setup Instructions

### Method 1: Heroku Dashboard (Recommended)

1. **Go to Heroku Dashboard**
   - Visit: https://dashboard.heroku.com/apps/muntushop-production

2. **Navigate to Deploy Tab**
   - Click on the **"Deploy"** tab in your app dashboard

3. **Connect GitHub**
   - Scroll down to **"Deployment method"**
   - Click **"Connect to GitHub"**
   - Authorize Heroku to access your GitHub account
   - Search for repository: `elvic-group/Muntushop-2`
   - Click **"Connect"**

4. **Enable Automatic Deploys**
   - Scroll to **"Automatic deploys"** section
   - Select branch: **`main`**
   - Check **"Wait for CI to pass"** (optional - if you have CI)
   - Click **"Enable Automatic Deploys"**

5. **Manual Deploy (Optional)**
   - You can also manually deploy by clicking **"Deploy Branch"** in the same section

### Method 2: Heroku CLI (Alternative)

If you prefer CLI, you can use the Heroku API, but it requires additional setup:

```bash
# This requires OAuth token setup which is complex
# Dashboard method is recommended
```

## After Setup

Once connected:
- ✅ Every push to `main` branch will automatically deploy to Heroku
- ✅ You'll see deployment status in Heroku dashboard
- ✅ Build logs will be available in Heroku dashboard

## Verify Connection

After setup, verify it's working:
1. Make a small change to your code
2. Push to GitHub: `git push origin main`
3. Check Heroku dashboard - you should see automatic deployment starting

## Troubleshooting

If automatic deployments don't work:
1. Check Heroku dashboard → Deploy tab → Check if GitHub is connected
2. Verify branch name matches (should be `main`)
3. Check Heroku build logs for errors
4. Ensure your GitHub repo is accessible to Heroku

## Current Manual Deployment

Until GitHub integration is set up, you can still deploy manually:

```bash
git push origin main      # Push to GitHub
git push heroku main      # Deploy to Heroku
```

