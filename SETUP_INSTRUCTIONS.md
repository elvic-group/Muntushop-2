# 🚀 GitHub → Heroku Setup - Complete These Steps

## ⚠️ IMPORTANT: OAuth Required
GitHub integration requires OAuth authorization which must be done through the browser.

## 📋 Step-by-Step Instructions

### Step 1: Open Heroku Dashboard
**URL:** https://dashboard.heroku.com/apps/muntushop-production/deploy/github

(Should open automatically in your browser)

### Step 2: Connect GitHub Account
1. Scroll to **"Deployment method"** section
2. Click **"Connect to GitHub"** button
3. If prompted, authorize Heroku to access your GitHub account
4. Grant necessary permissions

### Step 3: Connect Repository
1. In the **"Connect to GitHub"** section, you'll see a search box
2. Type: `elvic-group/Muntushop-2`
3. Click **"Connect"** next to your repository

### Step 4: Enable Automatic Deploys
1. Scroll down to **"Automatic deploys"** section
2. Select branch: **`main`**
3. (Optional) Check **"Wait for CI to pass before deploy"** if you have CI
4. Click **"Enable Automatic Deploys"** button

### Step 5: (Optional) Manual Deploy Now
1. Scroll to **"Manual deploy"** section
2. Select branch: **`main`**
3. Click **"Deploy Branch"** to deploy immediately

## ✅ Verification

After completing the steps:

1. **Test it:**
   ```bash
   # Make a small change
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: verify auto-deploy"
   git push origin main
   ```

2. **Check Heroku Dashboard:**
   - Go to: https://dashboard.heroku.com/apps/muntushop-production/activity
   - You should see a new deployment starting automatically

## 🎯 What This Enables

- ✅ **Automatic Deployment**: Every push to `main` → Auto-deploy to Heroku
- ✅ **No Manual Steps**: No need to run `git push heroku main`
- ✅ **Deployment History**: See all deployments in Heroku dashboard
- ✅ **Build Logs**: View build and deployment logs in Heroku

## 📝 Current Status

- ✅ Heroku App: `muntushop-production`
- ✅ GitHub Repo: `elvic-group/Muntushop-2`
- ⚠️ **GitHub Integration: Needs to be connected (follow steps above)**

---

**Once you complete the steps above, automatic deployments will be active!**

