/**
 * Green API Configuration
 * WhatsApp API client setup
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const whatsAppClient = require('@green-api/whatsapp-api-client');

const idInstance = process.env.GREEN_ID_INSTANCE;
const apiTokenInstance = process.env.GREEN_API_TOKEN_INSTANCE;

if (!idInstance || !apiTokenInstance) {
  console.error('❌ Green API credentials missing! Set GREEN_ID_INSTANCE and GREEN_API_TOKEN_INSTANCE in .env');
  // Return a dummy object to prevent crashes
  module.exports = {
    message: {
      sendMessage: async () => {
        console.warn('⚠️ Green API not configured - message not sent');
      }
    }
  };
} else {
  const restAPI = whatsAppClient.restAPI({
    idInstance: idInstance,
    apiTokenInstance: apiTokenInstance,
  });
  module.exports = restAPI;
}

