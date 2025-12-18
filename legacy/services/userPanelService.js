// User Panel Service
// Handles customer dashboard and account management

const pool = require('../backend/src/config/database');

class UserPanelService {
  /**
   * ============================================
   * USER DASHBOARD
   * ============================================
   */

  static async getDashboard(phoneNumber) {
    try {
      // Get user info
      const userResult = await pool.query(
        `SELECT id, name, phone, email, created_at FROM users WHERE phone = $1`,
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found. Type MENU to get started.`;
      }

      const user = userResult.rows[0];
      const userId = user.id;

      // Get order stats
      const orderStats = await pool.query(
        `SELECT
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status IN ('pending', 'pending_delivery')) as pending_orders,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
          COALESCE(SUM(total), 0) as total_spent
         FROM orders
         WHERE user_id = $1`,
        [userId]
      );

      // Get cart info
      const cartResult = await pool.query(
        `SELECT items FROM carts WHERE user_id = $1`,
        [userId]
      );

      const stats = orderStats.rows[0];
      const cartItems = cartResult.rows[0]?.items || [];
      const cartCount = Array.isArray(cartItems) ? cartItems.length : 0;

      const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });

      // Get loyalty points
      const loyaltyResult = await pool.query(
        `SELECT lp.available_points, lt.name as tier_name
         FROM loyalty_points lp
         JOIN loyalty_tiers lt ON lp.current_tier_id = lt.id
         WHERE lp.user_id = $1`,
        [userId]
      );

      const loyaltyPoints = loyaltyResult.rows[0]?.available_points || 0;
      const tierName = loyaltyResult.rows[0]?.tier_name || 'Bronze';

      // Get wallet balance
      const walletResult = await pool.query(
        `SELECT balance FROM wallets WHERE user_id = $1`,
        [userId]
      );

      const walletBalance = walletResult.rows[0]?.balance || 0;

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 MY ACCOUNT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome back${user.name ? ', ' + user.name : ''}!
📱 ${user.phone}
📅 Member since: ${memberSince}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 QUICK STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛍️  Total Orders: ${stats.total_orders}
✅ Completed: ${stats.completed_orders}
⏳ Pending: ${stats.pending_orders}
💰 Total Spent: $${parseFloat(stats.total_spent).toFixed(2)}
🛒 Cart Items: ${cartCount}
💳 Wallet: $${parseFloat(walletBalance).toFixed(2)}
🏆 ${tierName} • ${loyaltyPoints} pts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 SHOPPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ My Orders
2️⃣ Shopping Cart
3️⃣ Browse Products
4️⃣ Recommended for You
5️⃣ My Wishlist

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ACCOUNT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6️⃣ My Addresses
7️⃣ My Wallet
8️⃣ My Rewards
9️⃣ Referral Program
🔟 Scheduled Orders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣1️⃣ Notifications
1️⃣2️⃣ Help & Support
1️⃣3️⃣ Account Settings

💡 Type a number (1-13) to continue
`;

      return message;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      return '⚠️ Error loading dashboard. Please try again.';
    }
  }

  /**
   * ============================================
   * ADDRESS MANAGEMENT
   * ============================================
   */

  static async getAddresses(phoneNumber) {
    try {
      const userResult = await pool.query(
        'SELECT id FROM users WHERE phone = $1',
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const userId = userResult.rows[0].id;

      const result = await pool.query(
        `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );

      if (result.rows.length === 0) {
        return `📍 MY ADDRESSES\n\nYou don't have any saved addresses yet.\n\n1️⃣ Add New Address\n2️⃣ Back to Dashboard\n\n💡 Type a number (1-2)`;
      }

      let message = `📍 MY ADDRESSES\n\nSaved Addresses: ${result.rows.length}\n\n`;

      result.rows.forEach((addr, index) => {
        const defaultBadge = addr.is_default ? ' (Default)' : '';
        const icon = addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍';

        message += `${index + 1}. ${icon} ${addr.label}${defaultBadge}\n`;
        message += `   ${addr.full_name || 'No name'}\n`;
        message += `   ${addr.street_address}\n`;
        message += `   ${addr.city}${addr.postal_code ? ', ' + addr.postal_code : ''}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Actions:\n`;
      message += `• Type number to view/edit address\n`;
      message += `• ADD ADDRESS - Add new address\n`;
      message += `• BACK - Return to dashboard\n`;

      return message;
    } catch (error) {
      console.error('Error getting addresses:', error);
      return '⚠️ Error loading addresses. Please try again.';
    }
  }

  static async getAddressDetails(phoneNumber, addressNumber) {
    try {
      const userResult = await pool.query(
        'SELECT id FROM users WHERE phone = $1',
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const userId = userResult.rows[0].id;

      const result = await pool.query(
        `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );

      const address = result.rows[addressNumber - 1];

      if (!address) {
        return `❌ Address not found.`;
      }

      const icon = address.label === 'Home' ? '🏠' : address.label === 'Work' ? '💼' : '📍';

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${icon} ADDRESS DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Label: ${address.label}${address.is_default ? ' (Default)' : ''}
Name: ${address.full_name || 'Not set'}
Phone: ${address.phone || 'Not set'}

Street: ${address.street_address}
City: ${address.city}
Postal Code: ${address.postal_code || 'Not set'}
Country: ${address.country || 'Norway'}

${address.delivery_notes ? 'Notes: ' + address.delivery_notes : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Set as Default
2️⃣ Edit Address
3️⃣ Delete Address
4️⃣ Back to Addresses

💡 Type a number (1-4)
`;

      return message;
    } catch (error) {
      console.error('Error getting address details:', error);
      return '⚠️ Error loading address. Please try again.';
    }
  }

  static async addAddress(userId, addressData) {
    try {
      // Check if this is the first address
      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM addresses WHERE user_id = $1',
        [userId]
      );

      const isFirst = parseInt(countResult.rows[0].count) === 0;

      const result = await pool.query(
        `INSERT INTO addresses (
          user_id, label, full_name, phone, street_address,
          city, postal_code, country, delivery_notes, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          userId,
          addressData.label || 'Home',
          addressData.fullName,
          addressData.phone,
          addressData.streetAddress,
          addressData.city,
          addressData.postalCode,
          addressData.country || 'Norway',
          addressData.notes || null,
          isFirst // First address is automatically default
        ]
      );

      return {
        success: true,
        addressId: result.rows[0].id,
        message: `✅ ADDRESS SAVED\n\nYour address has been added successfully!${isFirst ? '\n\n✨ Set as default address' : ''}\n\nType MY ADDRESSES to view all addresses.`
      };
    } catch (error) {
      console.error('Error adding address:', error);
      return {
        success: false,
        message: '⚠️ Error saving address. Please try again.'
      };
    }
  }

  static async setDefaultAddress(userId, addressNumber) {
    try {
      const addresses = await pool.query(
        `SELECT id FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );

      const address = addresses.rows[addressNumber - 1];

      if (!address) {
        return {
          success: false,
          message: '❌ Address not found.'
        };
      }

      await pool.query(
        `UPDATE addresses SET is_default = true, updated_at = NOW() WHERE id = $1`,
        [address.id]
      );

      return {
        success: true,
        message: `✅ DEFAULT ADDRESS UPDATED\n\nThis address is now your default shipping address.\n\nType MY ADDRESSES to view all addresses.`
      };
    } catch (error) {
      console.error('Error setting default address:', error);
      return {
        success: false,
        message: '⚠️ Error updating address. Please try again.'
      };
    }
  }

  static async deleteAddress(userId, addressNumber) {
    try {
      const addresses = await pool.query(
        `SELECT id, is_default FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );

      const address = addresses.rows[addressNumber - 1];

      if (!address) {
        return {
          success: false,
          message: '❌ Address not found.'
        };
      }

      await pool.query(
        `DELETE FROM addresses WHERE id = $1`,
        [address.id]
      );

      // If deleted address was default, make first remaining address default
      if (address.is_default && addresses.rows.length > 1) {
        const newDefault = addresses.rows.find(a => a.id !== address.id);
        if (newDefault) {
          await pool.query(
            `UPDATE addresses SET is_default = true WHERE id = $1`,
            [newDefault.id]
          );
        }
      }

      return {
        success: true,
        message: `✅ ADDRESS DELETED\n\nThe address has been removed from your account.\n\nType MY ADDRESSES to view remaining addresses.`
      };
    } catch (error) {
      console.error('Error deleting address:', error);
      return {
        success: false,
        message: '⚠️ Error deleting address. Please try again.'
      };
    }
  }

  /**
   * ============================================
   * BROWSE PRODUCTS BY CATEGORY
   * ============================================
   */

  static async getCategories() {
    try {
      const result = await pool.query(
        `SELECT DISTINCT category
         FROM products
         WHERE is_active = true AND category IS NOT NULL
         ORDER BY category`
      );

      if (result.rows.length === 0) {
        return `📦 NO CATEGORIES FOUND\n\nNo products available at the moment.\n\nType MENU to return to main menu.`;
      }

      let message = `🛍️ BROWSE PRODUCTS\n\nShop by Category:\n\n`;

      result.rows.forEach((row, index) => {
        const icon = this.getCategoryIcon(row.category);
        message += `${index + 1}. ${icon} ${row.category}\n`;
      });

      message += `\n💡 Type a number (1-${result.rows.length}) to browse category`;

      return message;
    } catch (error) {
      console.error('Error getting categories:', error);
      return '⚠️ Error loading categories. Please try again.';
    }
  }

  static async getProductsByCategory(categoryNumber) {
    try {
      // Get all categories
      const categories = await pool.query(
        `SELECT DISTINCT category
         FROM products
         WHERE is_active = true AND category IS NOT NULL
         ORDER BY category`
      );

      const category = categories.rows[categoryNumber - 1]?.category;

      if (!category) {
        return `❌ Category not found.`;
      }

      // Get products in this category
      const products = await pool.query(
        `SELECT id, sku, name, price, stock_quantity
         FROM products
         WHERE category = $1 AND is_active = true
         ORDER BY created_at DESC
         LIMIT 25`,
        [category]
      );

      if (products.rows.length === 0) {
        return `📦 NO PRODUCTS FOUND\n\nNo products in ${category} category.\n\nType BROWSE to see other categories.`;
      }

      const icon = this.getCategoryIcon(category);
      let message = `${icon} ${category.toUpperCase()}\n\nShowing ${products.rows.length} products:\n\n`;

      products.rows.forEach((product, index) => {
        message += `${index + 1}. ${product.name}\n`;
        message += `   $${parseFloat(product.price).toFixed(2)}`;
        message += ` • Stock: ${product.stock_quantity}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `💡 Type a number (1-${products.rows.length}) to view product\n`;
      message += `Or type BROWSE to see other categories`;

      return message;
    } catch (error) {
      console.error('Error getting products by category:', error);
      return '⚠️ Error loading products. Please try again.';
    }
  }

  static getCategoryIcon(category) {
    const icons = {
      'Electronics': '📱',
      'Fashion': '👕',
      'Home & Living': '🏠',
      'Games & Toys': '🎮',
      'Phone Accessories': '📞',
      'Sports': '⚽',
      'Books': '📚',
      'Beauty': '💄',
      'Food': '🍔'
    };
    return icons[category] || '📦';
  }

  /**
   * ============================================
   * HELP & SUPPORT
   * ============================================
   */

  static getHelpMenu() {
    return `
🆘 HELP & SUPPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How can we help you today?

1️⃣ Track My Order
2️⃣ Return & Refund Policy
3️⃣ Payment Methods
4️⃣ Shipping Information
5️⃣ Account Issues
6️⃣ Contact Admin
7️⃣ FAQs
8️⃣ Back to Dashboard

💡 Type a number (1-8) to continue
`;
  }

  static getHelpTopic(topicNumber) {
    const topics = {
      1: `📦 TRACK YOUR ORDER

To track your order:
1. Type: ORDERS
2. Find your order number
3. Type: TRACK ORD123456

You'll receive:
• Current status
• Tracking number
• Estimated delivery
• Shipping carrier info

Need help? Type 6 to contact admin.`,

      2: `💰 RETURN & REFUND POLICY

Returns accepted within 30 days.

Eligible items:
✅ Unopened products
✅ Items in original packaging
✅ Non-damaged goods

Refund process:
1. Contact support
2. Provide order number
3. Explain reason
4. Admin processes refund
5. Money back in 5-10 days

Contact admin: Type 6`,

      3: `💳 PAYMENT METHODS

We accept:
✅ Credit/Debit Cards (Stripe)
✅ M-Pesa (Coming soon)
✅ Orange Money (Coming soon)
✅ Bank Transfer

All payments are secure and encrypted.

Questions? Contact admin (Type 6)`,

      4: `🚚 SHIPPING INFORMATION

Delivery time: 3-5 business days
Shipping cost: Calculated at checkout

Carriers we use:
• DHL
• FedEx
• UPS
• Local carriers

Track your order anytime:
Type: TRACK <order-number>

Questions? Contact admin (Type 6)`,

      5: `👤 ACCOUNT ISSUES

Common issues:

Can't login?
• Check phone number format
• Type MENU to restart

Update account info:
• Type MY ACCOUNT
• Select Account Settings

Delete account:
• Contact admin

Need help? Type 6 to contact admin.`,

      6: `📞 CONTACT ADMIN

Need to speak with us?

Admin Phone: +47 967 01573

Or describe your issue here and we'll get back to you within 24 hours.

Please include:
• Your order number (if applicable)
• Issue description
• Screenshots (if relevant)

We're here to help! 💚`,

      7: `❓ FREQUENTLY ASKED QUESTIONS

Q: How do I track my order?
A: Type TRACK <order-number>

Q: How long is shipping?
A: 3-5 business days

Q: Can I cancel my order?
A: Yes, if payment is pending

Q: How do I get a refund?
A: Contact admin (Type 6)

Q: Is my payment secure?
A: Yes, we use Stripe encryption

More questions? Type 6 to contact admin.`
    };

    return topics[topicNumber] || `❌ Topic not found. Type HELP to see all topics.`;
  }
}

module.exports = UserPanelService;
