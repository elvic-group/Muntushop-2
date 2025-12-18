/**
 * MuntuShop WhatsApp Service
 * Node.js service for WhatsApp integration using Green API
 */

const whatsAppClient = require("@green-api/whatsapp-api-client");
require("dotenv").config();

// Initialize Green API client
const restAPI = whatsAppClient.restAPI({
  idInstance: process.env.GREEN_ID_INSTANCE || "7700330457",
  apiTokenInstance:
    process.env.GREEN_API_TOKEN_INSTANCE ||
    "075b6e1771bb4fd5996043ab9f36bf34ac6d81ebb87549b6aa",
});

/**
 * Send a text message to a WhatsApp number
 * @param {string} chatId - WhatsApp chat ID (format: 79999999999@c.us)
 * @param {string} message - Message text to send
 * @returns {Promise} API response
 */
async function sendMessage(chatId, message) {
  try {
    const response = await restAPI.message.sendMessage(chatId, null, message);
    return { success: true, data: response };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a file via URL
 * @param {string} chatId - WhatsApp chat ID
 * @param {string} url - File URL
 * @param {string} fileName - Name of the file
 * @param {string} caption - File caption
 * @returns {Promise} API response
 */
async function sendFileByUrl(chatId, url, fileName, caption) {
  try {
    const response = await restAPI.file.sendFileByUrl(
      chatId,
      null,
      url,
      fileName,
      caption
    );
    return { success: true, data: response };
  } catch (error) {
    console.error("Error sending file:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send location
 * @param {string} chatId - WhatsApp chat ID
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {string} name - Location name
 * @returns {Promise} API response
 */
async function sendLocation(chatId, latitude, longitude, name) {
  try {
    const response = await restAPI.sending.sendLocation(
      chatId,
      latitude,
      longitude,
      name
    );
    return { success: true, data: response };
  } catch (error) {
    console.error("Error sending location:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get account settings
 * @returns {Promise} Account settings
 */
async function getAccountSettings() {
  try {
    const response = await restAPI.settings.getSettings();
    return { success: true, data: response };
  } catch (error) {
    console.error("Error getting settings:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if a phone number has WhatsApp
 * @param {string} phoneNumber - Phone number to check
 * @returns {Promise} Check result
 */
async function checkWhatsApp(phoneNumber) {
  try {
    const response = await restAPI.account.checkWhatsapp(phoneNumber);
    return { success: true, data: response };
  } catch (error) {
    console.error("Error checking WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Set webhook URL for receiving incoming messages
 * @param {string} webhookUrl - The webhook URL to configure
 * @returns {Promise} Configuration result
 */
async function setWebhookUrl(webhookUrl) {
  try {
    const response = await restAPI.settings.setSettings({
      webhookUrl: webhookUrl,
      webhookUrlToken: "",
      outgoingWebhook: "yes",
      incomingWebhook: "yes"
    });
    return { success: true, data: response };
  } catch (error) {
    console.error("Error setting webhook:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Start receiving notifications via webhook service
 * @param {Function} onMessage - Callback for incoming messages
 * @param {Function} onStatus - Callback for status updates
 */
async function startReceivingNotifications(onMessage, onStatus) {
  try {
    console.log("Waiting for incoming notifications...");

    // Note: This uses Green API's webhookService which requires proper webhook setup
    // The webhook URL should be configured in Green API dashboard
    // Example: https://your-domain.com/api/whatsapp/webhook

    try {
      // Test the API connection first
      const testSettings = await restAPI.settings.getSettings();
      if (!testSettings || testSettings.error) {
        throw new Error("Green API connection failed");
      }

      await restAPI.webhookService.startReceivingNotifications();

      if (onMessage) {
        restAPI.webhookService.onReceivingMessageText((body) => {
          onMessage(body);
        });
      }

      if (onStatus) {
        restAPI.webhookService.onReceivingDeviceStatus((body) => {
          onStatus(body);
        });
      }
    } catch (webhookError) {
      console.warn("⚠️  Webhook polling service not available. Using webhook endpoint mode.");
      console.log("📌 Configure webhook URL in Green API dashboard:");
      console.log("   POST https://your-domain.com/api/whatsapp/webhook");
      throw webhookError; // Re-throw to prevent continuous polling errors
    }
  } catch (error) {
    console.error("Error starting notifications:", error.message);
    throw error;
  }
}

/**
 * Stop receiving notifications
 */
function stopReceivingNotifications() {
  try {
    restAPI.webhookService.stopReceivingNotifications();
  } catch (error) {
    // Silently ignore if service is not running
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    console.log("🚀 MuntuShop WhatsApp Service");
    console.log(`📱 Instance ID: ${process.env.GREEN_ID_INSTANCE}`);

    // Example: Send a test message
    // const result = await sendMessage("79999999999@c.us", "Hello from MuntuShop!");
    // console.log("Send result:", result);

    // Example: Start receiving notifications
    // await startReceivingNotifications(
    //     (message) => {
    //         console.log("New message:", message);
    //     },
    //     (status) => {
    //         console.log("Status update:", status);
    //     }
    // );
  })();
}

module.exports = {
  sendMessage,
  sendFileByUrl,
  sendLocation,
  getAccountSettings,
  checkWhatsApp,
  setWebhookUrl,
  startReceivingNotifications,
  stopReceivingNotifications,
  restAPI, // Export the raw API client for advanced usage
};
