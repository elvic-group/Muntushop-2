/**
 * WhatsApp Message Handler
 * Routes incoming messages to appropriate services
 */

const db = require('../../config/database');
const templates = require('../../templates/whatsapp');
const greenAPI = require('../../config/greenapi');

// Import services
const shoppingService = require('../shopping');
const iptvService = require('../iptv');
const aiAgent = require('../aiAgent');
// Add other services as they're implemented

class WhatsAppHandler {
  async handleIncomingMessage(webhookData) {
    try {
      if (!webhookData || !webhookData.typeWebhook) {
        console.log('Invalid webhook data received');
        return;
      }
      
      const { typeWebhook, messageData, senderData } = webhookData;
      
      // Only handle incoming messages
      if (typeWebhook !== 'incomingMessageReceived') {
        return;
      }
      
      if (!senderData || !senderData.sender) {
        console.error('Missing sender data in webhook');
        return;
      }
      
      const phone = senderData.sender.replace('@c.us', '');
      
      // Safely extract message text
      let message = '';
      if (messageData && messageData.textMessageData && messageData.textMessageData.textMessage) {
        message = messageData.textMessageData.textMessage;
      } else if (messageData && messageData.textMessage) {
        message = messageData.textMessage;
      }
      
      console.log(`📨 Message from ${phone}: ${message}`);
      
      // Get or create user
      let user = await this.getUser(phone);
      
      if (!user) {
        try {
          user = await this.createUser(phone, senderData.senderName || 'User');
        } catch (createError) {
          // Send error message to user instead of silently failing
          await this.sendMessage(phone, 'Sorry, there was an error setting up your account. Please try again later.');
          return;
        }
      } else {
        // Update last seen
        try {
          await db.query(
            'UPDATE users SET last_seen_at = NOW() WHERE id = $1',
            [user.id]
          );
          // Refresh user object to get latest state from database
          user = await this.getUser(phone);
        } catch (dbError) {
          // Log error but continue processing
        }
      }
      
      // Ensure user exists before routing
      if (!user) {
        await this.sendMessage(phone, 'Sorry, there was an error processing your request. Please try again.');
        return;
      }
      
      // Route message to appropriate service
      await this.routeMessage(user, message);
      
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }
  
  async routeMessage(user, message) {
    // Defensive check for user
    if (!user || !user.phone) {
      return;
    }
    
    if (!message || typeof message !== 'string') {
      return await this.sendMainMenu(user.phone);
    }
    
    const msg = message.toLowerCase().trim();
    
    // Check for main menu triggers (these always go to main menu)
    if (['hi', 'hello', 'hey', 'menu', 'start', 'help'].includes(msg)) {
      // Clear service flow when user explicitly requests menu
      if (user.current_service && ['menu', 'start'].includes(msg)) {
        try {
          await db.query(
            'UPDATE users SET current_service = NULL, current_step = NULL WHERE id = $1',
            [user.id]
          );
        } catch (e) {
          // Ignore errors
        }
      }
      if (msg === 'help') {
        return await this.sendHelp(user.phone);
      }
      return await this.sendMainMenu(user.phone);
    }
    
    // Check if user is in a service flow
    if (user.current_service) {
      // Check if message is a valid service command (numbers, back, menu, etc.)
      const isServiceCommand = msg.match(/^[0-9]+$/) || 
                               ['back', '0', 'cancel'].includes(msg) ||
                               msg.startsWith('add') ||
                               msg.startsWith('remove') ||
                               msg.startsWith('checkout') ||
                               msg.startsWith('order');
      
      if (isServiceCommand) {
        // Valid service command - route to service handler
        return await this.handleServiceFlow(user, message);
      } else {
        // Not a service command - use AI agent for natural language
        try {
          const aiResponse = await aiAgent.processMessage(user.phone, message, user);
          await this.sendMessage(user.phone, aiResponse);
          return;
        } catch (aiError) {
          console.error('AI agent error:', aiError);
          // Fallback to service handler if AI fails
          return await this.handleServiceFlow(user, message);
        }
      }
    }
    
    // Handle main menu selection
    if (msg.match(/^[0-9]{1,2}$/)) {
      const option = parseInt(msg);
      return await this.handleMainMenuSelection(user, option);
    }
    
    // If no command matched, use AI agent for natural language processing
    try {
      const aiResponse = await aiAgent.processMessage(user.phone, message, user);
      await this.sendMessage(user.phone, aiResponse);
    } catch (aiError) {
      console.error('AI agent error:', aiError);
      // Fallback to main menu if AI fails
      await this.sendMainMenu(user.phone);
    }
  }
  
  async sendMainMenu(phone) {
    const menu = templates.main.mainMenu();
    await this.sendMessage(phone, menu);
  }
  
  async sendHelp(phone) {
    const help = templates.main.helpMessage();
    await this.sendMessage(phone, help);
  }
  
  async handleMainMenuSelection(user, option) {
    const services = {
      1: 'shopping',
      2: 'messaging',
      3: 'support',
      4: 'appointments',
      5: 'groups',
      6: 'money',
      7: 'education',
      8: 'news',
      9: 'marketing',
      10: 'b2b',
      11: 'iptv'
    };
    
    const service = services[option];
    
    if (!service) {
      return await this.sendMessage(
        user.phone,
        '❌ Invalid option. Type MENU to see options.'
      );
    }
    
    // Update user's current service
    try {
      await db.query(
        'UPDATE users SET current_service = $1, current_step = $2 WHERE id = $3',
        [service, 'menu', user.id]
      );
      // Refresh user object to get latest state from database (FIX: prevents stale user object)
      user = await this.getUser(user.phone);
    } catch (dbError) {
      await this.sendMessage(user.phone, 'Sorry, there was an error. Please try again.');
      return;
    }
    
    // Ensure user was refreshed successfully
    if (!user) {
      return;
    }
    
    // Send service menu
    await this.sendServiceMenu(user, service);
  }
  
  async sendServiceMenu(user, service) {
    try {
      switch (service) {
        case 'shopping':
          await shoppingService.showMenu(user);
          break;
        case 'iptv':
          await iptvService.showMenu(user);
          break;
        // Add other services
        default:
          await this.sendMessage(user.phone, `Service ${service} is coming soon! Type MENU to continue.`);
      }
    } catch (error) {
      console.error(`Error sending ${service} menu:`, error);
      await this.sendMessage(user.phone, 'Sorry, an error occurred. Type MENU to continue.');
    }
  }
  
  async handleServiceFlow(user, message) {
    try {
      // Delegate to appropriate service handler
      switch (user.current_service) {
        case 'shopping':
          await shoppingService.handleMessage(user, message);
          break;
        case 'iptv':
          await iptvService.handleMessage(user, message);
          break;
        // Add other service handlers as they're implemented
        default:
          await this.sendMessage(user.phone, 'Service not implemented yet. Type MENU to continue.');
      }
    } catch (error) {
      console.error('Error in service flow:', error);
      await this.sendMessage(user.phone, 'Sorry, an error occurred. Type MENU to continue.');
    }
  }
  
  async sendMessage(phone, text) {
    try {
      await greenAPI.message.sendMessage(`${phone}@c.us`, null, text);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  }
  
  async getUser(phone) {
    try {
      if (!phone) {
        return null;
      }
      const result = await db.query(
        'SELECT * FROM users WHERE phone = $1',
        [phone]
      );
      const user = result.rows[0] || null;
      
      // Parse session_data if it exists and is a string
      if (user && user.session_data && typeof user.session_data === 'string') {
        try {
          user.session_data = JSON.parse(user.session_data);
        } catch (e) {
          // If parsing fails, keep as is or set to empty object
          user.session_data = {};
        }
      }
      
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
  
  async createUser(phone, name = null) {
    try {
      if (!phone) {
        throw new Error('Phone number is required');
      }
      const result = await db.query(
        `INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING *`,
        [phone, name || 'User']
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppHandler();

