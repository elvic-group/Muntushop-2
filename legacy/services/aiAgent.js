// AI Agent Service
// Handles intelligent conversation using OpenAI

const OpenAI = require('openai');
const ConversationManager = require('./conversationManager');
const menus = require('../templates/whatsapp/menus');
const pool = require('../backend/src/config/database');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AIAgent {
  /**
   * Normalize phone number to consistent format (remove @c.us)
   */
  static normalizePhone(phone) {
    if (!phone) return phone;
    return phone.replace(/@c\.us$/, '').replace(/\s+/g, '');
  }

  /**
   * Normalize message text - remove unicode whitespace, convert emoji numbers
   */
  static normalizeMessage(text) {
    if (!text) return '';

    // Remove all unicode whitespace characters (including zero-width spaces, non-breaking spaces, etc.)
    let normalized = text.replace(/[\u200B-\u200D\uFEFF\u00A0\u2000-\u200F\u2028-\u202F\u205F\u3000]/g, '');

    // Convert emoji numbers to regular numbers
    const emojiNumbers = {
      '0️⃣': '0', '1️⃣': '1', '2️⃣': '2', '3️⃣': '3', '4️⃣': '4',
      '5️⃣': '5', '6️⃣': '6', '7️⃣': '7', '8️⃣': '8', '9️⃣': '9',
      '🔟': '10', '1️⃣1️⃣': '11', '1️⃣2️⃣': '12', '1️⃣3️⃣': '13'
    };

    for (const [emoji, number] of Object.entries(emojiNumbers)) {
      normalized = normalized.replace(emoji, number);
    }

    // Standard trim and normalize whitespace
    normalized = normalized.trim().replace(/\s+/g, ' ');

    return normalized;
  }

  /**
   * Process incoming message with AI
   */
  static async processMessage(phoneNumber, messageText) {
    try {
      // Normalize phone number and message
      const normalizedPhone = this.normalizePhone(phoneNumber);
      const normalizedText = this.normalizeMessage(messageText);

      const state = ConversationManager.getUserState(normalizedPhone);
      ConversationManager.addToHistory(normalizedPhone, normalizedText, 'user');

      // If user is in a specific service flow, handle that FIRST
      if (state.currentService) {
        const serviceResponse = await this.handleServiceFlow(normalizedPhone, normalizedText, state);
        if (serviceResponse) {
          ConversationManager.addToHistory(normalizedPhone, serviceResponse, 'bot');
          return serviceResponse;
        }
      }

      // Check for quick commands
      const quickResponse = await this.handleQuickCommands(normalizedPhone, normalizedText);
      if (quickResponse) {
        ConversationManager.addToHistory(normalizedPhone, quickResponse, 'bot');
        return quickResponse;
      }

      // Use AI to understand intent and respond
      return await this.getAIResponse(normalizedPhone, normalizedText, state);
    } catch (error) {
      console.error('AI Agent error:', error);
      return this.getErrorResponse();
    }
  }

  /**
   * Handle quick commands (non-AI)
   * Note: message is already normalized by processMessage()
   */
  static async handleQuickCommands(phoneNumber, message) {
    const msg = message.toLowerCase().trim(); // Lowercase for command matching

    if (msg === 'menu' || msg === 'main' || msg === 'start') {
      ConversationManager.clearState(phoneNumber);
      return menus.mainMenu();
    }

    if (msg === 'help' || msg === 'support') {
      return menus.helpMessage();
    }

    if (msg === 'hi' || msg === 'hello' || msg === 'hey') {
      return menus.welcomeMessage();
    }

    // ORDERS - View order history
    if (msg === 'orders') {
      const OrderService = require('./orderService');
      return await OrderService.getUserOrders(phoneNumber);
    }

    // CART - View shopping cart
    if (msg === 'cart') {
      const OrderService = require('./orderService');
      const cart = await OrderService.getCart(phoneNumber);
      if (!cart || !cart.items || cart.items.length === 0) {
        return `🛒 YOUR CART\n\nYour cart is empty.\n\nType MENU to start shopping!`;
      }
      return await OrderService.displayCart(phoneNumber);
    }

    // ACCOUNT - User account info
    if (msg === 'account') {
      const UserService = require('./userService');
      return await UserService.getAccountInfo(phoneNumber);
    }

    // BALANCE - Check account balance
    if (msg === 'balance') {
      const UserService = require('./userService');
      return await UserService.getBalance(phoneNumber);
    }

    // CANCEL - Cancel current action
    if (msg === 'cancel') {
      ConversationManager.clearState(phoneNumber);
      return `✅ Current action cancelled.\n\nType MENU to see available services.`;
    }

    // Track order command: TRACK <order_number>
    if (msg.startsWith('track ')) {
      const OrderService = require('./orderService');
      const orderNumber = message.substring(6).trim().toUpperCase();
      return await OrderService.getTrackingMessage(orderNumber);
    }

    // Cancel order command: CANCEL ORDER <order_number>
    if (msg.startsWith('cancel order ')) {
      const OrderService = require('./orderService');
      const orderNumber = message.substring(13).trim().toUpperCase();
      const result = await OrderService.cancelOrder(phoneNumber, orderNumber);
      return result.message;
    }

    // ============================================
    // USER PANEL COMMANDS
    // ============================================

    const UserPanelService = require('./userPanelService');

    // MY ACCOUNT - User dashboard
    if (msg === 'my account' || msg === 'panel' || msg === 'dashboard') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'dashboard');
      return await UserPanelService.getDashboard(phoneNumber);
    }

    // Handle user dashboard menu selections
    const userPanel = ConversationManager.getContext(phoneNumber, 'userPanel');

    if (userPanel === 'dashboard' && /^([1-9]|1[0-3])$/.test(msg)) {
      const Phase2Service = require('./phase2Service');
      const Phase3Service = require('./phase3Service');
      const OrderService = require('./orderService');
      const UserService = require('./userService');

      ConversationManager.setContext(phoneNumber, 'userPanel', null);

      switch(msg) {
        case '1': // My Orders
          return await OrderService.getUserOrders(phoneNumber);

        case '2': // Shopping Cart
          const cartResult = await OrderService.getCart(phoneNumber);
          if (!cartResult || !cartResult.items || cartResult.items.length === 0) {
            return `🛒 YOUR CART\n\nYour cart is empty.\n\nType BROWSE to start shopping!`;
          }
          return await OrderService.displayCart(phoneNumber);

        case '3': // Browse Products
          ConversationManager.setContext(phoneNumber, 'userPanel', 'browse');
          return await UserPanelService.getCategories();

        case '4': // Recommended for You
          ConversationManager.setContext(phoneNumber, 'userPanel', 'recommendations');
          return await Phase3Service.getRecommendations(phoneNumber);

        case '5': // My Wishlist
          ConversationManager.setContext(phoneNumber, 'userPanel', 'wishlist');
          return await Phase2Service.getWishlist(phoneNumber);

        case '6': // My Addresses
          ConversationManager.setContext(phoneNumber, 'userPanel', 'addresses');
          return await UserPanelService.getAddresses(phoneNumber);

        case '7': // My Wallet
          ConversationManager.setContext(phoneNumber, 'userPanel', 'wallet');
          return await Phase2Service.getWallet(phoneNumber);

        case '8': // My Rewards
          ConversationManager.setContext(phoneNumber, 'userPanel', 'loyalty');
          return await Phase3Service.getLoyaltyStatus(phoneNumber);

        case '9': // Referral Program
          ConversationManager.setContext(phoneNumber, 'userPanel', 'referrals');
          return await Phase3Service.getReferralStatus(phoneNumber);

        case '10': // Scheduled Orders
          ConversationManager.setContext(phoneNumber, 'userPanel', 'scheduled');
          return await Phase3Service.getScheduledOrders(phoneNumber);

        case '11': // Notifications
          ConversationManager.setContext(phoneNumber, 'userPanel', 'notifications');
          return await Phase2Service.getNotifications(phoneNumber);

        case '12': // Help & Support
          ConversationManager.setContext(phoneNumber, 'userPanel', 'help');
          return UserPanelService.getHelpMenu();

        case '13': // Account Settings
          return await UserService.getAccountInfo(phoneNumber);
      }
    }

    // MY ADDRESSES or ADDRESSES command
    if (msg === 'my addresses' || msg === 'addresses') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'addresses');
      return await UserPanelService.getAddresses(phoneNumber);
    }

    // Handle address list selections
    if (userPanel === 'addresses' && /^\d+$/.test(msg)) {
      const addressNumber = parseInt(msg);
      ConversationManager.setContext(phoneNumber, 'userPanel', 'address-details');
      ConversationManager.setContext(phoneNumber, 'selectedAddress', addressNumber);
      return await UserPanelService.getAddressDetails(phoneNumber, addressNumber);
    }

    // Handle address details actions
    if (userPanel === 'address-details' && /^[1-4]$/.test(msg)) {
      const selectedAddress = ConversationManager.getContext(phoneNumber, 'selectedAddress');
      const UserService = require('./userService');
      const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      const userId = userResult.rows[0]?.id;

      ConversationManager.setContext(phoneNumber, 'userPanel', null);
      ConversationManager.setContext(phoneNumber, 'selectedAddress', null);

      switch(msg) {
        case '1': // Set as Default
          const defaultResult = await UserPanelService.setDefaultAddress(userId, selectedAddress);
          return defaultResult.message;

        case '2': // Edit Address
          return `✏️ EDIT ADDRESS\n\nTo edit this address, please use:\nADD ADDRESS\n\nThen delete the old one.\n\nType MY ADDRESSES to continue.`;

        case '3': // Delete Address
          const deleteResult = await UserPanelService.deleteAddress(userId, selectedAddress);
          return deleteResult.message;

        case '4': // Back
          ConversationManager.setContext(phoneNumber, 'userPanel', 'addresses');
          return await UserPanelService.getAddresses(phoneNumber);
      }
    }

    // ADD ADDRESS command
    if (msg === 'add address') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'add-address');
      ConversationManager.setContext(phoneNumber, 'addressStep', 'label');
      return `📍 ADD NEW ADDRESS\n\nLet's set up your delivery address.\n\n1️⃣ Address Label:\n\nChoose a label for this address:\n1. 🏠 Home\n2. 💼 Work\n3. 📍 Other\n\n💡 Type a number (1-3)`;
    }

    // Handle add address flow
    const addressStep = ConversationManager.getContext(phoneNumber, 'addressStep');

    if (userPanel === 'add-address' && addressStep) {
      const UserService = require('./userService');
      const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      const userId = userResult.rows[0]?.id;

      let addressData = ConversationManager.getContext(phoneNumber, 'addressData') || {};

      switch(addressStep) {
        case 'label':
          if (/^[1-3]$/.test(msg)) {
            const labels = { '1': 'Home', '2': 'Work', '3': 'Other' };
            addressData.label = labels[msg];
            ConversationManager.setContext(phoneNumber, 'addressData', addressData);
            ConversationManager.setContext(phoneNumber, 'addressStep', 'fullName');
            return `📍 ADD NEW ADDRESS\n\n2️⃣ Full Name:\n\nEnter the recipient's full name:\n\nExample: John Doe`;
          }
          break;

        case 'fullName':
          addressData.fullName = message.trim();
          ConversationManager.setContext(phoneNumber, 'addressData', addressData);
          ConversationManager.setContext(phoneNumber, 'addressStep', 'phone');
          return `📍 ADD NEW ADDRESS\n\n3️⃣ Phone Number:\n\nEnter contact phone number:\n\nExample: +47 123 45678`;

        case 'phone':
          addressData.phone = message.trim();
          ConversationManager.setContext(phoneNumber, 'addressData', addressData);
          ConversationManager.setContext(phoneNumber, 'addressStep', 'street');
          return `📍 ADD NEW ADDRESS\n\n4️⃣ Street Address:\n\nEnter street address:\n\nExample: 123 Main Street, Apt 4B`;

        case 'street':
          addressData.streetAddress = message.trim();
          ConversationManager.setContext(phoneNumber, 'addressData', addressData);
          ConversationManager.setContext(phoneNumber, 'addressStep', 'city');
          return `📍 ADD NEW ADDRESS\n\n5️⃣ City:\n\nEnter city name:\n\nExample: Oslo`;

        case 'city':
          addressData.city = message.trim();
          ConversationManager.setContext(phoneNumber, 'addressData', addressData);
          ConversationManager.setContext(phoneNumber, 'addressStep', 'postal');
          return `📍 ADD NEW ADDRESS\n\n6️⃣ Postal Code:\n\nEnter postal code:\n\nExample: 0150`;

        case 'postal':
          addressData.postalCode = message.trim();
          ConversationManager.setContext(phoneNumber, 'addressData', addressData);
          ConversationManager.setContext(phoneNumber, 'addressStep', 'notes');
          return `📍 ADD NEW ADDRESS\n\n7️⃣ Delivery Notes (Optional):\n\nAny special instructions?\n\nExample: Ring doorbell twice\n\nOr type SKIP to finish`;

        case 'notes':
          if (msg !== 'skip') {
            addressData.notes = message.trim();
          }

          // Save address
          const result = await UserPanelService.addAddress(userId, addressData);

          // Clear context
          ConversationManager.setContext(phoneNumber, 'userPanel', null);
          ConversationManager.setContext(phoneNumber, 'addressStep', null);
          ConversationManager.setContext(phoneNumber, 'addressData', null);

          return result.message;
      }
    }

    // BROWSE or BROWSE PRODUCTS command
    if (msg === 'browse' || msg === 'browse products') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'browse');
      return await UserPanelService.getCategories();
    }

    // Handle browse category selection
    if (userPanel === 'browse' && /^\d+$/.test(msg)) {
      const categoryNumber = parseInt(msg);
      ConversationManager.setContext(phoneNumber, 'userPanel', 'browse-products');
      ConversationManager.setContext(phoneNumber, 'selectedCategory', categoryNumber);
      return await UserPanelService.getProductsByCategory(categoryNumber);
    }

    // Handle product selection from browse
    if (userPanel === 'browse-products' && /^\d+$/.test(msg)) {
      const categoryNumber = ConversationManager.getContext(phoneNumber, 'selectedCategory');
      const productNumber = parseInt(msg);

      // Get category
      const categories = await pool.query(
        `SELECT DISTINCT category FROM products WHERE is_active = true AND category IS NOT NULL ORDER BY category`
      );
      const category = categories.rows[categoryNumber - 1]?.category;

      // Get products
      const products = await pool.query(
        `SELECT sku FROM products WHERE category = $1 AND is_active = true ORDER BY created_at DESC LIMIT 25`,
        [category]
      );

      const sku = products.rows[productNumber - 1]?.sku;

      if (sku) {
        // Clear browse context
        ConversationManager.setContext(phoneNumber, 'userPanel', null);
        ConversationManager.setContext(phoneNumber, 'selectedCategory', null);

        // Show product details (reuse admin function or create customer version)
        const AdminService = require('./adminService');
        return await AdminService.getProductDetails(sku);
      }
    }

    // HELP or SUPPORT command
    if (msg === 'help' || msg === 'support') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'help');
      return UserPanelService.getHelpMenu();
    }

    // Handle help menu selections
    if (userPanel === 'help' && /^[1-8]$/.test(msg)) {
      if (msg === '8') {
        ConversationManager.setContext(phoneNumber, 'userPanel', null);
        return await UserPanelService.getDashboard(phoneNumber);
      }

      return UserPanelService.getHelpTopic(parseInt(msg));
    }

    // ============================================
    // PHASE 2 COMMANDS (Wallet, Wishlist, Reviews, Notifications)
    // ============================================

    const Phase2Service = require('./phase2Service');

    // MY WALLET or WALLET command
    if (msg === 'my wallet' || msg === 'wallet') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'wallet');
      return await Phase2Service.getWallet(phoneNumber);
    }

    // Handle wallet menu selections
    if (userPanel === 'wallet' && /^[1-3]$/.test(msg)) {
      const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      const userId = userResult.rows[0]?.id;

      switch(msg) {
        case '1': // Add Funds
          ConversationManager.setContext(phoneNumber, 'userPanel', 'wallet-add');
          return `💰 ADD FUNDS TO WALLET\n\nHow much would you like to add?\n\nEnter amount (e.g., 50.00):\n\nOr type CANCEL to abort`;

        case '2': // Transaction History
          ConversationManager.setContext(phoneNumber, 'userPanel', null);
          return await Phase2Service.getTransactionHistory(phoneNumber);

        case '3': // Back to Dashboard
          ConversationManager.setContext(phoneNumber, 'userPanel', null);
          return await UserPanelService.getDashboard(phoneNumber);
      }
    }

    // Handle add funds amount
    if (userPanel === 'wallet-add' && /^\d+(\.\d{1,2})?$/.test(msg)) {
      const amount = parseFloat(message.trim());
      if (amount > 0 && amount <= 10000) {
        const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
        const userId = userResult.rows[0]?.id;

        const result = await Phase2Service.addFunds(userId, amount, 'Manual top-up');
        ConversationManager.setContext(phoneNumber, 'userPanel', null);
        return result.message;
      }
      return `❌ Invalid amount. Please enter a value between 0.01 and 10000.00`;
    }

    // MY WISHLIST or WISHLIST command
    if (msg === 'my wishlist' || msg === 'wishlist') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'wishlist');
      return await Phase2Service.getWishlist(phoneNumber);
    }

    // REMOVE WISHLIST <number> command
    if (msg.startsWith('remove wishlist ')) {
      const number = parseInt(message.substring(16).trim());
      const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      const userId = userResult.rows[0]?.id;

      const result = await Phase2Service.removeFromWishlist(userId, number);
      return result.message;
    }

    // NOTIFICATIONS or NOTIFS command
    if (msg === 'notifications' || msg === 'notifs') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'notifications');
      return await Phase2Service.getNotifications(phoneNumber);
    }

    // Handle notifications menu selections
    if (userPanel === 'notifications' && /^[1-2]$/.test(msg)) {
      const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      const userId = userResult.rows[0]?.id;

      switch(msg) {
        case '1': // Mark All as Read
          const result = await Phase2Service.markAllAsRead(userId);
          ConversationManager.setContext(phoneNumber, 'userPanel', null);
          return result.message;

        case '2': // Back to Dashboard
          ConversationManager.setContext(phoneNumber, 'userPanel', null);
          return await UserPanelService.getDashboard(phoneNumber);
      }
    }

    // RATE <order_number> command - Start rating flow
    if (msg.startsWith('rate ')) {
      const orderNumber = message.substring(5).trim().toUpperCase();
      const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      const userId = userResult.rows[0]?.id;

      // Get order details
      const order = await pool.query(
        'SELECT id, order_number FROM orders WHERE order_number = $1 AND user_id = $2 AND status = \'completed\'',
        [orderNumber, userId]
      );

      if (order.rows.length === 0) {
        return `❌ Order not found or not eligible for rating.\n\nOnly completed orders can be rated.`;
      }

      ConversationManager.setContext(phoneNumber, 'ratingOrder', order.rows[0].id);
      ConversationManager.setContext(phoneNumber, 'ratingStep', 'rating');

      return `⭐ RATE YOUR PURCHASE\n\nOrder #${orderNumber}\n\nHow would you rate this product?\n\n1️⃣ ⭐ Poor\n2️⃣ ⭐⭐ Fair\n3️⃣ ⭐⭐⭐ Good\n4️⃣ ⭐⭐⭐⭐ Very Good\n5️⃣ ⭐⭐⭐⭐⭐ Excellent\n\n💡 Type a number (1-5)`;
    }

    // Handle rating selection
    const ratingStep = ConversationManager.getContext(phoneNumber, 'ratingStep');
    const ratingOrder = ConversationManager.getContext(phoneNumber, 'ratingOrder');

    if (ratingStep === 'rating' && /^[1-5]$/.test(msg)) {
      const rating = parseInt(msg);
      ConversationManager.setContext(phoneNumber, 'ratingValue', rating);
      ConversationManager.setContext(phoneNumber, 'ratingStep', 'review');

      return `⭐ WRITE A REVIEW (Optional)\n\nYou rated: ${'⭐'.repeat(rating)}\n\nWrite a brief review about this product:\n\nOr type SKIP to finish`;
    }

    // Handle review text
    if (ratingStep === 'review') {
      const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      const userId = userResult.rows[0]?.id;

      const rating = ConversationManager.getContext(phoneNumber, 'ratingValue');
      const reviewText = msg === 'skip' ? null : message.trim();

      // Get product from order
      const orderProduct = await pool.query(
        'SELECT items FROM orders WHERE id = $1',
        [ratingOrder]
      );

      const items = orderProduct.rows[0]?.items || [];
      const productId = items[0]?.productId; // For simplicity, rate first product

      if (productId) {
        const result = await Phase2Service.addReview(userId, productId, ratingOrder, rating, reviewText);

        // Clear context
        ConversationManager.setContext(phoneNumber, 'ratingOrder', null);
        ConversationManager.setContext(phoneNumber, 'ratingStep', null);
        ConversationManager.setContext(phoneNumber, 'ratingValue', null);

        return result.message;
      } else {
        return `❌ Could not find product to rate.`;
      }
    }

    // BACK command - return to dashboard
    if (msg === 'back') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'dashboard');
      return await UserPanelService.getDashboard(phoneNumber);
    }

    // ============================================
    // PHASE 3 COMMANDS (Loyalty, Referrals, Recommendations, Scheduling)
    // ============================================

    const Phase3Service = require('./phase3Service');

    // MY REWARDS or LOYALTY command
    if (msg === 'my rewards' || msg === 'loyalty' || msg === 'rewards') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'loyalty');
      return await Phase3Service.getLoyaltyStatus(phoneNumber);
    }

    // Handle loyalty menu selections (1-5)
    if (userPanel === 'loyalty' && /^[1-5]$/.test(msg)) {
      switch(msg) {
        case '1': // Browse Rewards Catalog
          ConversationManager.setContext(phoneNumber, 'userPanel', 'rewards-catalog');
          return await Phase3Service.getRewardsCatalog();

        case '2': // Points History
          ConversationManager.setContext(phoneNumber, 'userPanel', null);
          return await Phase3Service.getPointsHistory(phoneNumber);

        case '3': // My Redeemed Rewards
          ConversationManager.setContext(phoneNumber, 'userPanel', null);
          return `🎁 MY REDEEMED REWARDS\n\nFeature coming soon!\n\nType MY REWARDS to return.`;

        case '4': // How to Earn Points
          return `💡 HOW TO EARN POINTS\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✨ Earn points with every purchase:\n• 1 point per $1 spent\n• 2x points on first order\n• Bonus points on special items\n\n🎉 Other ways to earn:\n• Complete your profile: 50 pts\n• Refer a friend: 100 pts\n• Write a review: 10 pts\n• Birthday bonus: 200 pts\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nType MY REWARDS to return`;

        case '5': // Back to Dashboard
          ConversationManager.setContext(phoneNumber, 'userPanel', null);
          return await UserPanelService.getDashboard(phoneNumber);
      }
    }

    // Handle rewards catalog selection and redemption
    if (userPanel === 'rewards-catalog' && /^\d+$/.test(msg)) {
      const rewardNumber = parseInt(msg);
      const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      const userId = userResult.rows[0]?.id;

      const result = await Phase3Service.redeemReward(userId, rewardNumber);

      if (result.success) {
        ConversationManager.setContext(phoneNumber, 'userPanel', null);
      }

      return result.message;
    }

    // MY REFERRALS or REFERRAL command
    if (msg === 'my referrals' || msg === 'referral' || msg === 'referrals') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'referrals');
      return await Phase3Service.getReferralStatus(phoneNumber);
    }

    // Handle referral menu selections (1-4)
    if (userPanel === 'referrals' && /^[1-4]$/.test(msg)) {
      switch(msg) {
        case '1': // View Leaderboard
          ConversationManager.setContext(phoneNumber, 'userPanel', null);
          return await Phase3Service.getReferralLeaderboard();

        case '2': // Share Referral Link
          const userResult = await pool.query(
            'SELECT referral_code FROM user_referrals ur JOIN users u ON ur.user_id = u.id WHERE u.phone = $1',
            [phoneNumber]
          );
          const code = userResult.rows[0]?.referral_code;
          return `📤 SHARE YOUR REFERRAL CODE\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nYour code: ${code}\n\nShare this message with friends:\n\n"Join Muntushop and get $5 off!\n\nUse my code: ${code}\n\nSign up now! 🎁"\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nType MY REFERRALS to return`;

        case '3': // All My Referrals
          return `👥 ALL REFERRALS\n\nFeature coming soon!\n\nType MY REFERRALS to return.`;

        case '4': // Back to Dashboard
          ConversationManager.setContext(phoneNumber, 'userPanel', null);
          return await UserPanelService.getDashboard(phoneNumber);
      }
    }

    // APPLY REFERRAL <code> command
    if (msg.startsWith('apply referral ')) {
      const code = message.substring(15).trim().toUpperCase();
      const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      const userId = userResult.rows[0]?.id;

      const result = await Phase3Service.processReferral(userId, code);
      return result.message;
    }

    // RECOMMENDATIONS or RECOMMENDED command
    if (msg === 'recommendations' || msg === 'recommended') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'recommendations');
      return await Phase3Service.getRecommendations(phoneNumber);
    }

    // Handle recommendation product selection
    if (userPanel === 'recommendations' && /^\d+$/.test(msg)) {
      const productNumber = parseInt(msg);

      // Get user's recommendations
      const userResult = await pool.query('SELECT id FROM users WHERE phone = $1', [phoneNumber]);
      const userId = userResult.rows[0]?.id;

      const recsResult = await pool.query(
        `SELECT p.sku FROM product_recommendations pr
         JOIN products p ON pr.product_id = p.id
         WHERE pr.user_id = $1 AND (pr.expires_at IS NULL OR pr.expires_at > NOW())
         AND p.is_active = true
         ORDER BY pr.score DESC, pr.created_at DESC
         LIMIT 10`,
        [userId]
      );

      const sku = recsResult.rows[productNumber - 1]?.sku;

      if (sku) {
        ConversationManager.setContext(phoneNumber, 'userPanel', null);
        const AdminService = require('./adminService');
        return await AdminService.getProductDetails(sku);
      }
      return `❌ Product not found.`;
    }

    // SCHEDULED ORDERS or SCHEDULE command
    if (msg === 'scheduled orders' || msg === 'schedule' || msg === 'my schedule') {
      ConversationManager.setContext(phoneNumber, 'userPanel', 'scheduled');
      return await Phase3Service.getScheduledOrders(phoneNumber);
    }

    // Handle scheduled orders menu selections
    if (userPanel === 'scheduled' && /^\d+$/.test(msg)) {
      const orderNumber = parseInt(msg);
      ConversationManager.setContext(phoneNumber, 'userPanel', 'scheduled-details');
      ConversationManager.setContext(phoneNumber, 'selectedScheduled', orderNumber);
      return await Phase3Service.getScheduledOrderDetails(phoneNumber, orderNumber);
    }

    // Handle scheduled order actions
    if (userPanel === 'scheduled-details' && /^[1-5]$/.test(msg)) {
      const selectedScheduled = ConversationManager.getContext(phoneNumber, 'selectedScheduled');

      ConversationManager.setContext(phoneNumber, 'userPanel', null);
      ConversationManager.setContext(phoneNumber, 'selectedScheduled', null);

      switch(msg) {
        case '1': // Pause/Resume
          return `⏸️ PAUSE/RESUME ORDER\n\nFeature coming soon!\n\nType SCHEDULED ORDERS to return.`;

        case '2': // Modify Items
          return `✏️ MODIFY ITEMS\n\nFeature coming soon!\n\nType SCHEDULED ORDERS to return.`;

        case '3': // Change Date
          return `📅 CHANGE DATE\n\nFeature coming soon!\n\nType SCHEDULED ORDERS to return.`;

        case '4': // Cancel Order
          return `❌ CANCEL SCHEDULED ORDER\n\nFeature coming soon!\n\nType SCHEDULED ORDERS to return.`;

        case '5': // Back
          ConversationManager.setContext(phoneNumber, 'userPanel', 'scheduled');
          return await Phase3Service.getScheduledOrders(phoneNumber);
      }
    }

    // ============================================
    // ADMIN COMMANDS (require admin role)
    // ============================================

    const AdminService = require('./adminService');
    const isAdmin = await AdminService.isAdmin(phoneNumber);

    if (isAdmin) {
      // ============================================
      // ADMIN PIN SECURITY COMMANDS (always accessible)
      // ============================================

      // SET PIN <4-digit> - Set or change admin PIN
      if (msg.startsWith('set pin ')) {
        const pin = message.substring(8).trim();
        const result = await AdminService.setPin(phoneNumber, pin);
        return result.message;
      }

      // UNLOCK <4-digit> - Unlock admin panel
      if (msg.startsWith('unlock ')) {
        const pin = message.substring(7).trim();
        const result = await AdminService.unlockAdmin(phoneNumber, pin);

        if (result.success && result.unlocked) {
          // Store unlocked status in context
          ConversationManager.setContext(phoneNumber, 'adminUnlocked', true);
          ConversationManager.setContext(phoneNumber, 'adminUnlockTime', Date.now());
        }

        return result.message;
      }

      // LOCK - Lock admin panel
      if (msg === 'lock') {
        ConversationManager.setContext(phoneNumber, 'adminUnlocked', false);
        ConversationManager.setContext(phoneNumber, 'adminUnlockTime', null);
        return `🔒 ADMIN PANEL LOCKED\n\nAdmin panel has been locked for security.\n\n💡 Use UNLOCK <pin> to access again.`;
      }

      // RESET PIN - Request PIN reset
      if (msg === 'reset pin') {
        const result = await AdminService.requestPinReset(phoneNumber);
        return result.message;
      }

      // CONFIRM RESET <token> <new-pin> - Confirm PIN reset
      if (msg.startsWith('confirm reset ')) {
        const parts = message.substring(14).trim().split(/\s+/);
        if (parts.length >= 2) {
          const token = parts[0];
          const newPin = parts[1];
          const result = await AdminService.confirmPinReset(phoneNumber, token, newPin);
          return result.message;
        }
        return `❌ Invalid format. Use: CONFIRM RESET <reset-code> <new-4-digit-pin>\n\nExample: CONFIRM RESET 123456 5678`;
      }

      // ============================================
      // CHECK PIN AUTHENTICATION FOR ADMIN COMMANDS
      // ============================================

      // Check if admin has PIN set
      const hasPin = await AdminService.hasPin(phoneNumber);

      // Check if admin is unlocked (if PIN is set)
      const isUnlocked = ConversationManager.getContext(phoneNumber, 'adminUnlocked');
      const unlockTime = ConversationManager.getContext(phoneNumber, 'adminUnlockTime');

      // Auto-lock after 30 minutes of inactivity
      if (isUnlocked && unlockTime && (Date.now() - unlockTime > 30 * 60 * 1000)) {
        ConversationManager.setContext(phoneNumber, 'adminUnlocked', false);
        ConversationManager.setContext(phoneNumber, 'adminUnlockTime', null);
        return `🔒 SESSION EXPIRED\n\nYour admin session has expired due to inactivity.\n\n💡 Use UNLOCK <pin> to access admin panel.`;
      }

      // Require unlock if PIN is set
      if (hasPin && !isUnlocked) {
        // List of commands that require unlock
        const protectedCommands = ['admin', 'ship', 'refund', 'release', 'add product', 'edit product', 'delete product', 'activate product', 'deactivate product'];
        const isProtectedCommand = protectedCommands.some(cmd => msg === cmd || msg.startsWith(cmd + ' '));

        if (isProtectedCommand) {
          return `🔒 ADMIN PANEL LOCKED\n\nPlease unlock admin panel first.\n\n💡 Use: UNLOCK <your-4-digit-pin>\n\nExample: UNLOCK 1234\n\nForgot PIN? Type: RESET PIN`;
        }
      }

      // Update unlock time on any admin activity
      if (isUnlocked) {
        ConversationManager.setContext(phoneNumber, 'adminUnlockTime', Date.now());
      }

      // ============================================
      // ADMIN COMMANDS (require unlock if PIN set)
      // ============================================

      // ADMIN - Main admin dashboard
      if (msg === 'admin') {
        return await AdminService.getDashboard();
      }

      // ADMIN ORDERS - Order management
      if (msg === 'admin orders' || msg.startsWith('admin orders ')) {
        const filter = message.substring(13).trim().toLowerCase() || 'all';
        return await AdminService.getOrders(filter);
      }

      // ADMIN ORDER <order#> - Specific order details
      if (msg.startsWith('admin order ')) {
        const orderNumber = message.substring(12).trim().toUpperCase();
        return await AdminService.getOrderDetails(orderNumber);
      }

      // ADMIN CUSTOMERS - Customer list
      if (msg === 'admin customers') {
        return await AdminService.getCustomers();
      }

      // CUSTOMER <phone> - Customer details
      if (msg.startsWith('customer ')) {
        const phone = message.substring(9).trim();
        return await AdminService.getCustomerDetails(phone);
      }

      // ADMIN STATS - Analytics
      if (msg === 'admin stats') {
        return await AdminService.getStats();
      }

      // SHIP <order#> <tracking> <carrier> - Add tracking
      if (msg.startsWith('ship ')) {
        const parts = message.substring(5).trim().split(/\s+/);
        if (parts.length >= 3) {
          const [orderNumber, trackingNumber, carrier] = parts;
          const result = await AdminService.addTracking(
            phoneNumber,
            orderNumber.toUpperCase(),
            trackingNumber,
            carrier.toUpperCase()
          );

          // Send notification to customer if successful
          if (result.success && result.customerPhone && result.customerMessage) {
            const sendMessage = require('../whatsapp_service').sendMessage;
            await sendMessage(result.customerPhone, result.customerMessage);
          }

          return result.message || result;
        }
        return `❌ Invalid format. Use: SHIP <order#> <tracking> <carrier>\nExample: SHIP ORD123 TRACK456 DHL`;
      }

      // REFUND <order#> [amount] - Process refund
      if (msg.startsWith('refund ')) {
        const parts = message.substring(7).trim().split(/\s+/);
        const orderNumber = parts[0].toUpperCase();
        const amount = parts[1] ? parseFloat(parts[1]) : null;

        const result = await AdminService.processRefund(phoneNumber, orderNumber, amount);

        // Send notification to customer if successful
        if (result.success && result.customerPhone && result.customerMessage) {
          const sendMessage = require('../whatsapp_service').sendMessage;
          await sendMessage(result.customerPhone, result.customerMessage);
        }

        return result.message;
      }

      // RELEASE <order#> - Release escrow
      if (msg.startsWith('release ')) {
        const orderNumber = message.substring(8).trim().toUpperCase();
        const result = await AdminService.releaseEscrow(phoneNumber, orderNumber);

        // Send notification to customer if successful
        if (result.success && result.customerPhone && result.customerMessage) {
          const sendMessage = require('../whatsapp_service').sendMessage;
          await sendMessage(result.customerPhone, result.customerMessage);
        }

        return result.message;
      }

      // ============================================
      // PRODUCT MANAGEMENT COMMANDS
      // ============================================

      // ADMIN PRODUCTS [filter] - Product catalog
      if (msg === 'admin products' || msg.startsWith('admin products ')) {
        const filter = message.substring(14).trim().toLowerCase() || 'all';
        return await AdminService.getProducts(filter, phoneNumber);
      }

      // ADMIN PRODUCT <sku> - Product details
      if (msg.startsWith('admin product ')) {
        const sku = message.substring(14).trim().toUpperCase();
        return await AdminService.getProductDetails(sku, phoneNumber);
      }

      // Handle numbered product selection from catalog list
      const productList = ConversationManager.getContext(phoneNumber, 'productList');
      if (productList && /^\d+$/.test(msg)) {
        const productNumber = parseInt(msg);
        const sku = productList[productNumber];

        if (sku) {
          // Clear product list context
          ConversationManager.setContext(phoneNumber, 'productList', null);
          // Show product details
          return await AdminService.getProductDetails(sku, phoneNumber);
        }
      }

      // Handle numbered product actions when viewing a product
      const viewingProduct = ConversationManager.getContext(phoneNumber, 'viewingProduct');
      if (viewingProduct && /^[1-3]$/.test(msg)) {
        const productIsActive = ConversationManager.getContext(phoneNumber, 'productIsActive');

        // Clear the viewing context
        ConversationManager.setContext(phoneNumber, 'viewingProduct', null);
        ConversationManager.setContext(phoneNumber, 'productIsActive', null);

        switch(msg) {
          case '1': // Edit Product - Start interactive edit
            ConversationManager.setContext(phoneNumber, 'editingProduct', viewingProduct);
            return `📝 EDIT PRODUCT ${viewingProduct}\n\nWhat would you like to edit?\n\n1️⃣ Name\n2️⃣ Price\n3️⃣ Description\n4️⃣ Category\n5️⃣ Stock\n\n💡 Type a number (1-5) or CANCEL to abort`;

          case '2': // Delete Product
            const deleteResult = await AdminService.deleteProduct(phoneNumber, viewingProduct);
            return deleteResult;

          case '3': // Toggle Active Status
            if (productIsActive) {
              const result = await pool.query(
                `UPDATE products SET is_active = false, updated_at = NOW()
                 WHERE sku = $1 RETURNING name`,
                [viewingProduct]
              );
              if (result.rows.length > 0) {
                await AdminService.logAction(phoneNumber, 'deactivate_product', 'product', viewingProduct, { status: 'inactive' });
                return `✅ PRODUCT DEACTIVATED\n\n${result.rows[0].name} (${viewingProduct}) is now hidden from customers.`;
              }
            } else {
              const result = await pool.query(
                `UPDATE products SET is_active = true, updated_at = NOW()
                 WHERE sku = $1 RETURNING name`,
                [viewingProduct]
              );
              if (result.rows.length > 0) {
                await AdminService.logAction(phoneNumber, 'activate_product', 'product', viewingProduct, { status: 'active' });
                return `✅ PRODUCT ACTIVATED\n\n${result.rows[0].name} (${viewingProduct}) is now active and visible to customers.`;
              }
            }
            return `❌ Error updating product status`;
        }
      }

      // Handle edit product field selection
      const editingProduct = ConversationManager.getContext(phoneNumber, 'editingProduct');
      if (editingProduct && /^[1-5]$/.test(msg)) {
        const fieldMap = {
          '1': 'name',
          '2': 'price',
          '3': 'description',
          '4': 'category',
          '5': 'stock'
        };

        const field = fieldMap[msg];
        ConversationManager.setContext(phoneNumber, 'editField', field);

        const prompts = {
          'name': 'Enter new product name:',
          'price': 'Enter new price (e.g., 19.99):',
          'description': 'Enter new description:',
          'category': 'Enter new category:',
          'stock': 'Enter new stock quantity (e.g., 100):'
        };

        return `✏️ EDITING ${field.toUpperCase()} for ${editingProduct}\n\n${prompts[field]}\n\n💡 Type new value or CANCEL to abort`;
      }

      // Handle edit product value input
      const editField = ConversationManager.getContext(phoneNumber, 'editField');
      if (editingProduct && editField) {
        // Clear editing context
        ConversationManager.setContext(phoneNumber, 'editingProduct', null);
        ConversationManager.setContext(phoneNumber, 'editField', null);

        const updates = {};
        const value = message.trim();

        switch(editField) {
          case 'price':
            updates.price = parseFloat(value);
            if (isNaN(updates.price)) {
              return `❌ Invalid price. Please try again.`;
            }
            break;
          case 'stock':
            updates.stock = parseInt(value);
            if (isNaN(updates.stock)) {
              return `❌ Invalid stock quantity. Please try again.`;
            }
            break;
          default:
            updates[editField] = value;
        }

        return await AdminService.updateProduct(phoneNumber, editingProduct, updates);
      }

      // ADD PRODUCT <name> <price> <category> [stock] - Quick product creation
      if (msg.startsWith('add product ')) {
        const parts = message.substring(12).trim().split('|');
        if (parts.length >= 3) {
          const productData = {
            name: parts[0].trim(),
            price: parseFloat(parts[1].trim()),
            category: parts[2].trim(),
            description: parts[3] ? parts[3].trim() : '',
            stock: parts[4] ? parseInt(parts[4].trim()) : 999
          };
          return await AdminService.createProduct(phoneNumber, productData);
        }
        return `❌ Invalid format. Use: ADD PRODUCT name|price|category|description|stock\nExample: ADD PRODUCT Phone Case|15.99|Accessories|Protective case|100`;
      }

      // EDIT PRODUCT <sku> <field> <value> - Update product
      if (msg.startsWith('edit product ')) {
        const parts = message.substring(13).trim().split('|');
        if (parts.length >= 3) {
          const sku = parts[0].trim().toUpperCase();
          const field = parts[1].trim().toLowerCase();
          const value = parts[2].trim();

          const updates = {};
          switch(field) {
            case 'name': updates.name = value; break;
            case 'price': updates.price = parseFloat(value); break;
            case 'description': updates.description = value; break;
            case 'category': updates.category = value; break;
            case 'stock': updates.stock = parseInt(value); break;
            default: return `❌ Invalid field. Use: name, price, description, category, or stock`;
          }

          return await AdminService.updateProduct(phoneNumber, sku, updates);
        }
        return `❌ Invalid format. Use: EDIT PRODUCT sku|field|value\nExample: EDIT PRODUCT SKU123|price|19.99`;
      }

      // DELETE PRODUCT <sku> - Remove product
      if (msg.startsWith('delete product ')) {
        const sku = message.substring(15).trim().toUpperCase();
        return await AdminService.deleteProduct(phoneNumber, sku);
      }

      // ACTIVATE PRODUCT <sku> - Enable product
      if (msg.startsWith('activate product ')) {
        const sku = message.substring(17).trim().toUpperCase();
        const result = await pool.query(
          `UPDATE products SET is_active = true, updated_at = NOW()
           WHERE sku = $1 RETURNING name`,
          [sku]
        );

        if (result.rows.length === 0) {
          return `❌ Product not found: ${sku}`;
        }

        await AdminService.logAction(phoneNumber, 'activate_product', 'product', sku, { status: 'active' });
        return `✅ PRODUCT ACTIVATED\n\n${result.rows[0].name} (${sku}) is now active and visible to customers.`;
      }

      // DEACTIVATE PRODUCT <sku> - Disable product
      if (msg.startsWith('deactivate product ')) {
        const sku = message.substring(19).trim().toUpperCase();
        const result = await pool.query(
          `UPDATE products SET is_active = false, updated_at = NOW()
           WHERE sku = $1 RETURNING name`,
          [sku]
        );

        if (result.rows.length === 0) {
          return `❌ Product not found: ${sku}`;
        }

        await AdminService.logAction(phoneNumber, 'deactivate_product', 'product', sku, { status: 'inactive' });
        return `✅ PRODUCT DEACTIVATED\n\n${result.rows[0].name} (${sku}) is now hidden from customers.`;
      }
    }

    // Number selection for main menu (1-11)
    if (/^(1|2|3|4|5|6|7|8|9|10|11)$/.test(msg)) {
      const ServiceHandler = require('./serviceHandler');
      return ServiceHandler.handleServiceSelection(phoneNumber, parseInt(msg));
    }

    return null;
  }

  /**
   * Handle main menu service selection
   */
  static handleMenuSelection(phoneNumber, number) {
    const ServiceHandler = require('./serviceHandler');
    return ServiceHandler.handleServiceSelection(phoneNumber, number);
  }

  /**
   * Handle service-specific conversation flow
   */
  static async handleServiceFlow(phoneNumber, messageText, state) {
    const ServiceHandler = require('./serviceHandler');
    return ServiceHandler.handleServiceMessage(phoneNumber, messageText, state.currentService);
  }

  /**
   * Get AI-powered response using OpenAI
   */
  static async getAIResponse(phoneNumber, messageText, state) {
    try {
      // Build conversation context
      const messages = [
        {
          role: 'system',
          content: `You are a helpful assistant for MuntuShop Platform, a WhatsApp-based service platform offering 11 services (Shopping, Messaging, Support, Appointments, Groups, Money, Courses, News, Marketing, B2B, IPTV).

Keep responses concise and friendly. Guide users to type MENU to see services or HELP for assistance. All services cost $1 each.

If users ask about specific services, provide brief info and encourage them to select from the menu.`
        }
      ];

      // Add recent conversation history
      state.history.slice(-5).forEach(item => {
        messages.push({
          role: item.sender === 'user' ? 'user' : 'assistant',
          content: item.message
        });
      });

      // Add current message
      messages.push({
        role: 'user',
        content: messageText
      });

      // Get AI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 200,
        temperature: 0.7
      });

      const response = completion.choices[0].message.content.trim();
      ConversationManager.addToHistory(phoneNumber, response, 'bot');

      return response;
    } catch (error) {
      console.error('OpenAI error:', error);

      // Fallback response if AI fails
      return `I'm here to help! 💚

Type MENU to see all available services
Type HELP for assistance

What can I help you with today?`;
    }
  }

  /**
   * Get error response
   */
  static getErrorResponse() {
    return `⚠️ Oops! Something went wrong.

Please try again or type MENU to continue.

Need help? Reply HELP`;
  }
}

module.exports = AIAgent;
