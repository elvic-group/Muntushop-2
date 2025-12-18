// User Service
// Handles user and cart database operations

const pool = require('../backend/src/config/database');

class UserService {
  /**
   * Get or create user by phone
   */
  static async getOrCreateUser(phoneNumber) {
    try {
      // Check if user exists
      let result = await pool.query(
        'SELECT * FROM users WHERE phone = $1',
        [phoneNumber]
      );

      if (result.rows.length > 0) {
        // Update last_seen_at
        await pool.query(
          'UPDATE users SET last_seen_at = NOW() WHERE phone = $1',
          [phoneNumber]
        );
        return result.rows[0];
      }

      // Create new user
      result = await pool.query(
        `INSERT INTO users (phone, phone_verified, last_seen_at)
         VALUES ($1, true, NOW())
         RETURNING *`,
        [phoneNumber]
      );

      // Create empty cart for user
      await pool.query(
        'INSERT INTO carts (user_id) VALUES ($1)',
        [result.rows[0].id]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error getting/creating user:', error);
      throw error;
    }
  }

  /**
   * Get user cart
   */
  static async getCart(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM carts WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Create cart if doesn't exist
        const newCart = await pool.query(
          'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
          [userId]
        );
        return newCart.rows[0];
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  static async addToCart(userId, productId, quantity = 1) {
    try {
      const cart = await this.getCart(userId);
      const items = cart.items || [];

      // Check if product already in cart
      const existingItemIndex = items.findIndex(item => item.productId === productId);

      if (existingItemIndex > -1) {
        // Update quantity
        items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        items.push({ productId, quantity });
      }

      // Calculate total
      const total = items.reduce((sum, item) => sum + (item.price || 1.00) * item.quantity, 0);

      // Update cart
      await pool.query(
        'UPDATE carts SET items = $1, total = $2, subtotal = $2 WHERE user_id = $3',
        [JSON.stringify(items), total, userId]
      );

      return items;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(userId, productId) {
    try {
      const cart = await this.getCart(userId);
      let items = cart.items || [];

      // Remove item
      items = items.filter(item => item.productId !== productId);

      // Calculate total
      const total = items.reduce((sum, item) => sum + (item.price || 1.00) * item.quantity, 0);

      // Update cart
      await pool.query(
        'UPDATE carts SET items = $1, total = $2, subtotal = $2 WHERE user_id = $3',
        [JSON.stringify(items), total, userId]
      );

      return items;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  /**
   * Clear cart
   */
  static async clearCart(userId) {
    try {
      await pool.query(
        'UPDATE carts SET items = \'[]\', total = 0, subtotal = 0 WHERE user_id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Update user session state
   */
  static async updateSessionState(phoneNumber, service, step, data = {}) {
    try {
      await pool.query(
        `UPDATE users
         SET current_service = $1, current_step = $2, session_data = $3, updated_at = NOW()
         WHERE phone = $4`,
        [service, step, JSON.stringify(data), phoneNumber]
      );
    } catch (error) {
      console.error('Error updating session state:', error);
      throw error;
    }
  }

  /**
   * Get user session state
   */
  static async getSessionState(phoneNumber) {
    try {
      const result = await pool.query(
        'SELECT current_service, current_step, session_data FROM users WHERE phone = $1',
        [phoneNumber]
      );

      if (result.rows.length === 0) {
        return { current_service: null, current_step: null, session_data: {} };
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error fetching session state:', error);
      throw error;
    }
  }

  /**
   * Clear user session
   */
  static async clearSession(phoneNumber) {
    try {
      await pool.query(
        `UPDATE users
         SET current_service = NULL, current_step = NULL, session_data = '{}', updated_at = NOW()
         WHERE phone = $1`,
        [phoneNumber]
      );
    } catch (error) {
      console.error('Error clearing session:', error);
      throw error;
    }
  }

  /**
   * Get formatted account info for WhatsApp
   */
  static async getAccountInfo(phoneNumber) {
    try {
      const result = await pool.query(
        `SELECT phone, name, email, created_at, last_seen_at
         FROM users
         WHERE phone = $1`,
        [phoneNumber]
      );

      if (result.rows.length === 0) {
        return `⚠️ Account not found. Type MENU to get started.`;
      }

      const user = result.rows[0];
      const memberSince = new Date(user.created_at).toLocaleDateString();
      const lastSeen = user.last_seen_at
        ? new Date(user.last_seen_at).toLocaleDateString()
        : 'N/A';

      let message = `
👤 YOUR ACCOUNT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 CONTACT INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phone: ${user.phone}`;

      if (user.name) {
        message += `\nName: ${user.name}`;
      }

      if (user.email) {
        message += `\nEmail: ${user.email}`;
      }

      message += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ACCOUNT STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Member since: ${memberSince}
Last active: ${lastSeen}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Quick Commands:
• ORDERS - View order history
• BALANCE - Check balance
• CART - View shopping cart

Type MENU for main menu
`;

      return message;
    } catch (error) {
      console.error('Error getting account info:', error);
      return `⚠️ Error fetching account information. Please try again later.`;
    }
  }

  /**
   * Get user balance (placeholder for future wallet feature)
   */
  static async getBalance(phoneNumber) {
    try {
      // Check if user has wallet balance (if wallet feature is implemented)
      const result = await pool.query(
        `SELECT phone FROM users WHERE phone = $1`,
        [phoneNumber]
      );

      if (result.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      // For now, return a placeholder message
      // In the future, this can be connected to a wallet/credits system
      let message = `
💰 ACCOUNT BALANCE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Balance: $0.00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wallet feature coming soon!

You'll be able to:
• Add funds to your account
• Get discounts and cashback
• Quick checkout without cards
• Track rewards points

Type MENU for main menu
`;

      return message;
    } catch (error) {
      console.error('Error getting balance:', error);
      return `⚠️ Error fetching balance. Please try again later.`;
    }
  }
}

module.exports = UserService;
