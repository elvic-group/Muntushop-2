# 🔧 How to Add PostgreSQL to Railway

## ✅ Current Status

- ✅ Railway CLI installed
- ✅ Logged in as: Elvic Kongolo (elvickongolo@gmail.com)
- ✅ Project linked: "Muntushop2"
- ⚠️ PostgreSQL not yet added

## 🚀 Solution: Add PostgreSQL via Railway Dashboard

The Railway CLI syntax has changed. Here's the easiest way:

### Method 1: Via Railway Dashboard (Recommended)

1. **Open Railway Dashboard:**
   ```bash
   railway open
   ```
   Or go to: https://railway.app

2. **In your project "Muntushop2":**
   - Click the **"+ New"** button
   - Select **"Database"**
   - Choose **"Add PostgreSQL"**
   - Railway will automatically create and configure the database

3. **Get DATABASE_URL:**
   - After PostgreSQL is added, click on the PostgreSQL service
   - Go to the **"Variables"** tab
   - Copy the `DATABASE_URL` value
   - This will be automatically available to your app service

### Method 2: Via Railway CLI (CORRECT SYNTAX) ✅

The correct command is:

```bash
railway add --database postgres
```

**Note:** It's `postgres` not `postgresql`!

This will:
- Create a PostgreSQL database
- Automatically set `DATABASE_URL` environment variable
- Make it available to your app service

### Method 3: Manual Setup via Dashboard

If CLI doesn't work:

1. Go to https://railway.app/dashboard
2. Select your project "Muntushop2"
3. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
4. Wait for provisioning (takes ~30 seconds)
5. The `DATABASE_URL` will be automatically set as an environment variable

## 📋 After PostgreSQL is Added

Once PostgreSQL is added, you need to:

1. **Verify DATABASE_URL is set:**
   ```bash
   railway variables
   ```
   You should see `DATABASE_URL` listed

2. **Run database migrations:**
   ```bash
   railway run psql $DATABASE_URL -f backend/database/schema.sql
   ```

3. **Or run via Railway dashboard:**
   - Go to PostgreSQL service
   - Click **"Query"** tab
   - Copy contents of `backend/database/schema.sql`
   - Paste and execute

## 🔍 Verify PostgreSQL Setup

```bash
# Check if DATABASE_URL is available
railway variables | grep DATABASE_URL

# Test connection
railway run psql $DATABASE_URL -c "SELECT version();"
```

## ✅ Quick Steps Summary

1. Run: `railway open` (opens dashboard)
2. Click: **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Wait: ~30 seconds for provisioning
4. Check: `railway variables` to see `DATABASE_URL`
5. Run: Database migrations (see above)

## 🆘 Troubleshooting

If you still have issues:

1. **Check Railway CLI version:**
   ```bash
   railway --version
   ```

2. **Update Railway CLI:**
   ```bash
   npm install -g @railway/cli@latest
   ```

3. **Try Railway Dashboard directly:**
   - Always works reliably
   - No CLI syntax issues
   - Visual interface

---

**Next Steps After PostgreSQL is Added:**
1. Run database migrations
2. Set other environment variables
3. Deploy your application
4. Configure webhooks

See `RAILWAY-SETUP.md` for complete deployment guide.

