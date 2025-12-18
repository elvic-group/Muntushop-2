# Railway GitHub Actions Setup Guide

## Current Status

✅ **RAILWAY_TOKEN** secret has been added to GitHub

## Next Steps

To complete the Railway deployment setup, you need to add your Railway Project ID:

### Option 1: Get Project ID from Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Go to **Settings** → **General**
4. Copy the **Project ID** (it looks like: `abc123de-f456-7890-abcd-ef1234567890`)
5. Add it as a GitHub secret:
   ```bash
   gh secret set RAILWAY_PROJECT_ID --body "your-project-id-here" --repo elvic-group/Muntushop-2
   ```

### Option 2: Link Project Locally and Commit .railway Directory

1. Install Railway CLI locally:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link your project:
   ```bash
   cd /Users/elvicmbaya/Muntushop-2
   railway link
   ```

4. Remove `.railway` from `.gitignore` temporarily:
   ```bash
   # Edit .gitignore and comment out or remove the .railway/ line
   ```

5. Commit the `.railway` directory:
   ```bash
   git add .railway/
   git commit -m "Add Railway project link"
   git push
   ```

6. Add `.railway/` back to `.gitignore` if you removed it

## Testing the Deployment

Once you've added the Project ID, trigger the workflow:

```bash
gh workflow run "Deploy to Railway" --repo elvic-group/Muntushop-2
```

Or push to `main`/`master` branch to trigger automatically.

## Troubleshooting

If deployment fails:

1. Check workflow logs in GitHub Actions
2. Verify `RAILWAY_TOKEN` is set correctly
3. Verify `RAILWAY_PROJECT_ID` is set (if using Option 1)
4. Check Railway dashboard for deployment logs
5. Ensure your Railway project has the correct service configured

## Current Secrets in GitHub

- ✅ `RAILWAY_TOKEN` - Added successfully

## Required Secrets (if using Option 1)

- `RAILWAY_TOKEN` - ✅ Already added
- `RAILWAY_PROJECT_ID` - ⚠️ **Need to add**
- `RAILWAY_SERVICE_ID` - Optional (only if you have multiple services)

