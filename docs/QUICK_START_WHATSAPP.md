# 🚀 Quick Start - WhatsApp Integration

## ✅ What's Been Set Up

1. ✅ **Python WhatsApp Bot** (`whatsapp_bot.py`) - Ready-to-run chatbot
2. ✅ **Node.js WhatsApp Service** (`whatsapp_service.js`) - Reusable service module
3. ✅ **Express Server Example** (`server_example.js`) - API server with WhatsApp
4. ✅ **Configuration** (`config/whatsapp.config.js`) - Centralized config
5. ✅ **Test Script** (`test_whatsapp.js`) - Verify your setup

## 🎯 Quick Test (2 minutes)

### Step 1: Test Your Connection

```bash
npm run whatsapp:test
```

This will verify:
- ✅ Your Green API credentials
- ✅ Account connection
- ✅ Configuration

### Step 2: Run Python Bot

```bash
python whatsapp_bot.py
```

The bot will:
- ✅ Connect to Green API
- ✅ Listen for messages
- ✅ Respond to commands (start, menu, help, etc.)

### Step 3: Run Node.js Server

```bash
npm start
```

Then test sending a message:

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "79999999999@c.us",
    "message": "Hello from MuntuShop!"
  }'
```

## 📋 Environment Setup

Your credentials are already in `Md-files/Env file.md`. 

**Option 1: Create .env file**
```bash
# Copy your credentials from Env file.md
GREEN_ID_INSTANCE=7700330457
GREEN_API_TOKEN_INSTANCE=075b6e1771bb4fd5996043ab9f36bf34ac6d81ebb87549b6aa
GREEN_PHONE=4796701573
```

**Option 2: Use environment variables directly**
The code will use the values from your Env file if available.

## 🎨 Customization

### Python Bot
Edit `whatsapp_bot.py` to:
- Add new commands
- Customize menu
- Add service integrations

### Node.js Service
Use `whatsapp_service.js` in your Express routes:
```javascript
const { sendMessage } = require('./whatsapp_service');
await sendMessage(chatId, "Your message");
```

## 📚 Next Steps

1. **Customize the bot** - Add your business logic
2. **Integrate with database** - Connect to PostgreSQL
3. **Add Stripe payments** - Process payments via WhatsApp
4. **Deploy** - Use Railway for backend, Netlify for frontend

## 🆘 Troubleshooting

**Bot not starting?**
- Check if WhatsApp is authorized in Green API dashboard
- Verify credentials in .env

**Messages not sending?**
- Check phone number format: `79999999999@c.us`
- Verify account balance in Green API dashboard

**Need help?**
- See `README_WHATSAPP.md` for detailed docs
- Check `Md-files/` for platform documentation

---

**You're all set! 🎉**

