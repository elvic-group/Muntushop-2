# 📱 WhatsApp Integration Guide

This guide explains how to use the WhatsApp integration for MuntuShop platform.

## 📚 Available Libraries

We have installed three WhatsApp libraries:

1. **Python API Client** (`whatsapp-api-client-python`)
2. **Python Chatbot Framework** (`whatsapp-chatbot-python`)
3. **JavaScript/Node.js API Client** (`@green-api/whatsapp-api-client`)

## 🚀 Quick Start

### Python Bot (Recommended for Chatbots)

Run the Python chatbot:

```bash
# Make sure you have a .env file with your credentials
python whatsapp_bot.py
```

### Node.js Service (Recommended for API Integration)

Use in your Express.js backend:

```javascript
const { sendMessage, sendFileByUrl } = require('./whatsapp_service');

// Send a message
const result = await sendMessage("79999999999@c.us", "Hello from MuntuShop!");
```

## 📋 Setup Steps

### 1. Get Green API Credentials

1. Go to [green-api.com](https://green-api.com)
2. Register an account
3. Get your `ID_INSTANCE` and `API_TOKEN_INSTANCE`
4. Add them to your `.env` file

### 2. Authorize WhatsApp

1. Log into your Green API dashboard
2. Scan the QR code with your WhatsApp mobile app
3. Wait for authorization to complete

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## 📝 Usage Examples

### Python - Simple Message

```python
from whatsapp_api_client_python import API

greenAPI = API.GreenAPI(
    "YOUR_ID_INSTANCE",
    "YOUR_API_TOKEN_INSTANCE"
)

response = greenAPI.sending.sendMessage("79999999999@c.us", "Hello!")
print(response.data)
```

### Python - Chatbot

```python
from whatsapp_chatbot_python import GreenAPIBot, Notification

bot = GreenAPIBot("YOUR_ID_INSTANCE", "YOUR_API_TOKEN_INSTANCE")

@bot.router.message(command="start")
def start_handler(notification: Notification) -> None:
    notification.answer("Welcome to MuntuShop!")

bot.run_forever()
```

### JavaScript - Send Message

```javascript
const whatsAppClient = require("@green-api/whatsapp-api-client");

const restAPI = whatsAppClient.restAPI({
    idInstance: "YOUR_ID_INSTANCE",
    apiTokenInstance: "YOUR_API_TOKEN_INSTANCE",
});

restAPI.message.sendMessage("79999999999@c.us", null, "Hello!")
    .then((data) => console.log(data))
    .catch((error) => console.error(error));
```

### JavaScript - Receive Notifications

```javascript
const { startReceivingNotifications } = require('./whatsapp_service');

await startReceivingNotifications(
    (message) => {
        console.log("New message:", message);
        // Handle incoming message
    },
    (status) => {
        console.log("Status update:", status);
        // Handle status update
    }
);
```

## 🔧 Integration with Express.js

### Webhook Setup

```javascript
const express = require('express');
const whatsAppClient = require("@green-api/whatsapp-api-client");
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Set webhook URL in Green API dashboard
const webHookAPI = whatsAppClient.webhookAPI(app, "/webhooks");

// Handle incoming messages
webHookAPI.onIncomingMessageText(
    (data, idInstance, idMessage, sender, typeMessage, textMessage) => {
        console.log(`Message from ${sender}: ${textMessage}`);
        // Process message and send response
    }
);

app.listen(3000, () => {
    console.log("Webhook server running on port 3000");
});
```

## 📁 File Structure

```
Muntushop-2/
├── whatsapp_bot.py          # Python chatbot (ready to run)
├── whatsapp_service.js      # Node.js service module
├── config/
│   └── whatsapp.config.js  # Configuration file
├── .env.example            # Environment variables template
└── README_WHATSAPP.md      # This file
```

## 🎯 MuntuShop Services Integration

The bot supports all 11 MuntuShop services:

1. Shopping (Dropshipping Store)
2. Bulk Messaging Service
3. Customer Support Assistant
4. Appointment Booking
5. Group Management
6. Money Transfer Assistant
7. Online Courses
8. Local News & Updates
9. Marketing Services
10. B2B Wholesale Orders
11. IPTV Subscriptions

## 🔐 Security Notes

- **Never commit** your `.env` file to Git
- Keep your `API_TOKEN_INSTANCE` secret
- Use environment variables for all credentials
- Validate all incoming messages

## 📚 Documentation

- [Green API Documentation](https://green-api.com/en/docs/)
- [Python API Client Docs](https://github.com/green-api/whatsapp-api-client-python)
- [Python Chatbot Docs](https://github.com/green-api/whatsapp-chatbot-python)
- [JavaScript API Client Docs](https://github.com/green-api/whatsapp-api-client-js)

## 🆘 Troubleshooting

### Bot not responding?

1. Check if WhatsApp is authorized in Green API dashboard
2. Verify your credentials in `.env`
3. Check the bot logs for errors
4. Ensure the bot process is running

### Messages not sending?

1. Verify your `ID_INSTANCE` and `API_TOKEN_INSTANCE`
2. Check if the phone number format is correct (e.g., `79999999999@c.us`)
3. Check your Green API account balance/limits

### Webhook not receiving messages?

1. Ensure your webhook URL is publicly accessible
2. Check if webhook is enabled in Green API dashboard
3. Verify your Express server is running and accessible

## 🚀 Next Steps

1. Customize `whatsapp_bot.py` with your business logic
2. Integrate `whatsapp_service.js` into your Express backend
3. Connect to your database for user management
4. Add Stripe payment integration
5. Deploy to Railway/Netlify

---

**Need help?** Check the main documentation in `Md-files/` folder!

