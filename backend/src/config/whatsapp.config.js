/**
 * WhatsApp Configuration
 * Centralized configuration for WhatsApp/Green API integration
 */

require("dotenv").config();

const whatsappConfig = {
  // Green API credentials
  idInstance: process.env.GREEN_ID_INSTANCE || "7700330457",
  apiTokenInstance: process.env.GREEN_API_TOKEN_INSTANCE || "",
  apiUrl: process.env.GREEN_API_URL || "https://7700.api.greenapi.com",
  mediaUrl: process.env.GREEN_MEDIA_URL || "https://7700.media.greenapi.com",
  phone: process.env.GREEN_PHONE || "",

  // Bot settings
  bot: {
    name: "MuntuShop Bot",
    welcomeMessage: "👋 Welcome to MuntuShop!",
    defaultResponse: "I didn't understand that. Type 'start' for the menu.",
  },

  // Service prices (in USD)
  prices: {
    shopping: 1.0,
    bulkMessaging: 1.0,
    support: 1.0,
    appointments: 1.0,
    groupManagement: 1.0,
    moneyTransfer: 1.0,
    courses: 1.0,
    news: 1.0,
    marketing: 1.0,
    wholesale: 1.0,
    iptv: {
      basic: 5.0,
      premium: 10.0,
      ultra: 15.0,
    },
  },

  // Message templates
  templates: {
    welcome: (name) => `👋 Welcome to *MuntuShop*, ${name}!`,
    menu: () => "🛍️ *Our Services:*\n\n1️⃣ Shopping\n2️⃣ Bulk Messaging\n...",
    help: () => "🆘 *MuntuShop Support*\n\nNeed help? Contact us...",
  },

  // Validation
  validate: () => {
    if (!whatsappConfig.idInstance) {
      throw new Error("GREEN_ID_INSTANCE is required");
    }
    if (!whatsappConfig.apiTokenInstance) {
      throw new Error("GREEN_API_TOKEN_INSTANCE is required");
    }
    return true;
  },
};

module.exports = whatsappConfig;
