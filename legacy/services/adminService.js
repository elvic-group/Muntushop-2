// Admin Service
// Handles all admin-related operations via WhatsApp

const pool = require('../backend/src/config/database');
const StripeRefundService = require('./stripeRefundService');
const crypto = require('crypto');

class AdminService {
  /**
   * Check if user is an admin
   */
  static async isAdmin(phoneNumber) {
    try {
      const result = await pool.query(
        'SELECT role FROM users WHERE phone = $1',
        [phoneNumber]
      );
      return result.rows.length > 0 && result.rows[0].role === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Log admin action for audit trail
   */
  static async logAction(adminPhone, actionType, targetType, targetId, details = {}) {
    try {
      await pool.query(
        `INSERT INTO admin_actions (admin_phone, action_type, target_type, target_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [adminPhone, actionType, targetType, targetId, JSON.stringify(details)]
      );
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * ============================================
   * ADMIN PIN SECURITY
   * ============================================
   */

  /**
   * Hash a 4-digit PIN
   */
  static hashPin(pin) {
    return crypto.createHash('sha256').update(pin.toString()).digest('hex');
  }

  /**
   * Check if admin has set a PIN
   */
  static async hasPin(phoneNumber) {
    try {
      const result = await pool.query(
        'SELECT admin_pin_hash FROM users WHERE phone = $1 AND role = \'admin\'',
        [phoneNumber]
      );
      return result.rows.length > 0 && result.rows[0].admin_pin_hash !== null;
    } catch (error) {
      console.error('Error checking PIN status:', error);
      return false;
    }
  }

  /**
   * Set or update admin PIN
   */
  static async setPin(phoneNumber, pin) {
    try {
      // Validate PIN format
      if (!/^\d{4}$/.test(pin)) {
        return {
          success: false,
          message: '❌ Invalid PIN format. Must be exactly 4 digits.\n\nExample: 1234'
        };
      }

      const pinHash = this.hashPin(pin);

      const result = await pool.query(
        `UPDATE users
         SET admin_pin_hash = $1, updated_at = NOW()
         WHERE phone = $2 AND role = 'admin'
         RETURNING phone`,
        [pinHash, phoneNumber]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: '❌ Admin account not found.'
        };
      }

      await this.logAction(phoneNumber, 'set_pin', 'security', phoneNumber, { action: 'pin_set' });

      return {
        success: true,
        message: `✅ ADMIN PIN SET\n\nYour 4-digit PIN has been set successfully!\n\n🔐 Security Tips:\n• Don't share your PIN\n• Use UNLOCK <pin> to access admin panel\n• Use LOCK to secure panel when done\n• Use RESET PIN if you forget\n\n💡 Next: Type UNLOCK ${pin} to unlock admin panel`
      };
    } catch (error) {
      console.error('Error setting PIN:', error);
      return {
        success: false,
        message: '⚠️ Error setting PIN. Please try again.'
      };
    }
  }

  /**
   * Verify PIN and unlock admin panel
   */
  static async unlockAdmin(phoneNumber, pin) {
    try {
      // Validate PIN format
      if (!/^\d{4}$/.test(pin)) {
        return {
          success: false,
          message: '❌ Invalid PIN format. Must be 4 digits.'
        };
      }

      const pinHash = this.hashPin(pin);

      const result = await pool.query(
        `SELECT admin_pin_hash FROM users
         WHERE phone = $1 AND role = 'admin'`,
        [phoneNumber]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: '❌ Admin account not found.'
        };
      }

      const storedHash = result.rows[0].admin_pin_hash;

      if (!storedHash) {
        return {
          success: false,
          message: '❌ No PIN set. Use: SET PIN <4-digit-code>\n\nExample: SET PIN 1234'
        };
      }

      if (storedHash !== pinHash) {
        await this.logAction(phoneNumber, 'failed_unlock', 'security', phoneNumber, { reason: 'wrong_pin' });
        return {
          success: false,
          message: '❌ INCORRECT PIN\n\nPlease try again or use RESET PIN if you forgot your PIN.'
        };
      }

      // Update last unlock timestamp
      await pool.query(
        `UPDATE users SET last_admin_unlock = NOW() WHERE phone = $1`,
        [phoneNumber]
      );

      await this.logAction(phoneNumber, 'unlock_admin', 'security', phoneNumber, { action: 'unlocked' });

      return {
        success: true,
        unlocked: true,
        message: `✅ ADMIN PANEL UNLOCKED\n\nWelcome back, Admin!\n\nYou now have access to all admin commands.\n\n💡 Quick Commands:\n• ADMIN - Dashboard\n• ADMIN ORDERS - Order management\n• ADMIN PRODUCTS - Product catalog\n• LOCK - Lock admin panel\n\nType ADMIN to get started!`
      };
    } catch (error) {
      console.error('Error unlocking admin:', error);
      return {
        success: false,
        message: '⚠️ Error unlocking admin panel. Please try again.'
      };
    }
  }

  /**
   * Generate PIN reset token
   */
  static async requestPinReset(phoneNumber) {
    try {
      const result = await pool.query(
        'SELECT role, admin_pin_hash FROM users WHERE phone = $1',
        [phoneNumber]
      );

      if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
        return {
          success: false,
          message: '❌ Admin account not found.'
        };
      }

      if (!result.rows[0].admin_pin_hash) {
        return {
          success: false,
          message: '❌ No PIN set. Use: SET PIN <4-digit-code>'
        };
      }

      // Generate 6-digit reset code
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await pool.query(
        `UPDATE users
         SET pin_reset_token = $1, pin_reset_expires = $2, updated_at = NOW()
         WHERE phone = $3`,
        [resetToken, expiresAt, phoneNumber]
      );

      await this.logAction(phoneNumber, 'request_pin_reset', 'security', phoneNumber, { action: 'reset_requested' });

      return {
        success: true,
        resetToken: resetToken,
        message: `🔐 PIN RESET REQUESTED\n\nYour reset code: ${resetToken}\n\n⏰ Expires in: 15 minutes\n\nTo complete reset:\nCONFIRM RESET ${resetToken} <new-4-digit-pin>\n\nExample:\nCONFIRM RESET ${resetToken} 5678`
      };
    } catch (error) {
      console.error('Error requesting PIN reset:', error);
      return {
        success: false,
        message: '⚠️ Error requesting PIN reset. Please try again.'
      };
    }
  }

  /**
   * Confirm PIN reset with token
   */
  static async confirmPinReset(phoneNumber, token, newPin) {
    try {
      // Validate new PIN
      if (!/^\d{4}$/.test(newPin)) {
        return {
          success: false,
          message: '❌ Invalid PIN format. Must be exactly 4 digits.'
        };
      }

      const result = await pool.query(
        `SELECT pin_reset_token, pin_reset_expires
         FROM users
         WHERE phone = $1 AND role = 'admin'`,
        [phoneNumber]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          message: '❌ Admin account not found.'
        };
      }

      const { pin_reset_token, pin_reset_expires } = result.rows[0];

      if (!pin_reset_token) {
        return {
          success: false,
          message: '❌ No reset request found. Use: RESET PIN'
        };
      }

      if (new Date() > new Date(pin_reset_expires)) {
        return {
          success: false,
          message: '❌ Reset code expired. Please request a new one.\n\nType: RESET PIN'
        };
      }

      if (pin_reset_token !== token) {
        return {
          success: false,
          message: '❌ Invalid reset code. Please check and try again.'
        };
      }

      // Reset successful - update PIN
      const newPinHash = this.hashPin(newPin);

      await pool.query(
        `UPDATE users
         SET admin_pin_hash = $1,
             pin_reset_token = NULL,
             pin_reset_expires = NULL,
             updated_at = NOW()
         WHERE phone = $2`,
        [newPinHash, phoneNumber]
      );

      await this.logAction(phoneNumber, 'confirm_pin_reset', 'security', phoneNumber, { action: 'pin_reset_completed' });

      return {
        success: true,
        message: `✅ PIN RESET SUCCESSFUL\n\nYour new PIN has been set!\n\n🔐 Next Steps:\n• Use UNLOCK ${newPin} to access admin panel\n• Keep your PIN secure\n\n💡 You can now use all admin commands.`
      };
    } catch (error) {
      console.error('Error confirming PIN reset:', error);
      return {
        success: false,
        message: '⚠️ Error resetting PIN. Please try again.'
      };
    }
  }

  /**
   * ============================================
   * ADMIN DASHBOARD
   * ============================================
   */

  static async getDashboard() {
    try {
      const stats = await pool.query('SELECT * FROM admin_dashboard_stats');
      const data = stats.rows[0];

      const message = `
🔐 ADMIN DASHBOARD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 QUICK STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Today's Orders: ${data.orders_today || 0}
Today's Revenue: $${parseFloat(data.revenue_today || 0).toFixed(2)}

Pending Payment: ${data.pending_payment || 0}
Pending Delivery: ${data.pending_delivery || 0}
In Escrow: ${data.in_escrow || 0}
Disputed: ${data.disputed || 0}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️  ADMIN COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• ADMIN ORDERS - Manage orders
• ADMIN REFUNDS - Process refunds
• ADMIN TRACKING - Shipping tracking
• ADMIN CUSTOMERS - View customers
• ADMIN STATS - Full analytics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ QUICK ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• SHIP <order#> <tracking> <carrier>
• REFUND <order#> [amount]
• RELEASE <order#>

Type command or 0 for MENU
`;

      return message;
    } catch (error) {
      console.error('Error getting admin dashboard:', error);
      return '⚠️ Error loading dashboard. Please try again.';
    }
  }

  /**
   * ============================================
   * ORDER MANAGEMENT
   * ============================================
   */

  static async getOrders(filter = 'all') {
    try {
      let query = 'SELECT order_number, user_id, total, status, created_at FROM orders';
      let params = [];

      switch (filter) {
        case 'pending':
          query += ' WHERE status = $1';
          params = ['pending'];
          break;
        case 'pending_delivery':
          query += ' WHERE status = $1';
          params = ['pending_delivery'];
          break;
        case 'escrow':
          query += ' WHERE escrow_status = $1';
          params = ['held'];
          break;
        case 'disputed':
          query += ' WHERE dispute_status = $1';
          params = ['disputed'];
          break;
        case 'completed':
          query += ' WHERE status = $1';
          params = ['completed'];
          break;
      }

      query += ' ORDER BY created_at DESC LIMIT 20';

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return `📦 NO ORDERS FOUND\n\nFilter: ${filter}\n\nType ADMIN for dashboard`;
      }

      const statusIcons = {
        pending: '⏳',
        pending_delivery: '📦',
        processing: '⚙️',
        shipped: '🚚',
        delivered: '✅',
        completed: '✅',
        refunded: '💰',
        cancelled: '❌',
        disputed: '⚠️'
      };

      let message = `📦 ORDER MANAGEMENT\n\nFilter: ${filter.toUpperCase()}\nShowing ${result.rows.length} orders:\n\n`;

      result.rows.forEach((order, index) => {
        const icon = statusIcons[order.status] || '•';
        const date = new Date(order.created_at).toLocaleDateString();
        message += `${index + 1}. ${icon} ${order.order_number}\n`;
        message += `   $${parseFloat(order.total).toFixed(2)} - ${order.status}\n`;
        message += `   ${date}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Type: ADMIN ORDER <order#>\nExample: ADMIN ORDER ${result.rows[0].order_number}\n\n`;
      message += `Filters:\n`;
      message += `• ADMIN ORDERS pending\n`;
      message += `• ADMIN ORDERS escrow\n`;
      message += `• ADMIN ORDERS disputed\n`;

      return message;
    } catch (error) {
      console.error('Error getting orders:', error);
      return '⚠️ Error loading orders. Please try again.';
    }
  }

  static async getOrderDetails(orderNumber) {
    try {
      const result = await pool.query(
        `SELECT o.*,
                array_agg(json_build_object('product', oi.product_name, 'price', oi.price, 'qty', oi.quantity)) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.order_number = oi.order_number
         WHERE o.order_number = $1
         GROUP BY o.order_number`,
        [orderNumber]
      );

      if (result.rows.length === 0) {
        return `❌ Order not found: ${orderNumber}`;
      }

      const order = result.rows[0];
      const date = new Date(order.created_at).toLocaleString();

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order #: ${order.order_number}
Status: ${order.status}
Amount: $${parseFloat(order.total).toFixed(2)}
Date: ${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 CUSTOMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phone: ${order.user_id}`;

      if (order.email) {
        message += `\nEmail: ${order.email}`;
      }

      if (order.delivery_address) {
        message += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📍 DELIVERY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${order.delivery_address}`;
      }

      if (order.items && order.items[0] && order.items[0].product) {
        message += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 ITEMS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        order.items.forEach((item, index) => {
          if (item.product) {
            message += `${index + 1}. ${item.product}\n`;
            message += `   $${parseFloat(item.price).toFixed(2)} x ${item.qty}\n\n`;
          }
        });
      }

      if (order.tracking_number) {
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🚚 TRACKING\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `Tracking: ${order.tracking_number}\n`;
        message += `Carrier: ${order.carrier}\n`;
        if (order.shipped_at) {
          message += `Shipped: ${new Date(order.shipped_at).toLocaleDateString()}\n`;
        }
      }

      if (order.escrow_status === 'held') {
        const daysInEscrow = Math.ceil((new Date() - new Date(order.created_at)) / (1000 * 60 * 60 * 24));
        const daysUntil = new Date(order.escrow_hold_until);
        message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💰 ESCROW\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `Status: HELD\n`;
        message += `Days held: ${daysInEscrow} / 7\n`;
        message += `Auto-release: ${daysUntil.toLocaleDateString()}\n`;
      }

      message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ QUICK ACTIONS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (!order.tracking_number) {
        message += `• SHIP ${order.order_number} <tracking> <carrier>\n`;
      }
      if (order.escrow_status === 'held') {
        message += `• RELEASE ${order.order_number}\n`;
      }
      if (order.refund_status === 'none') {
        message += `• REFUND ${order.order_number} [amount]\n`;
      }

      return message;
    } catch (error) {
      console.error('Error getting order details:', error);
      return '⚠️ Error loading order details. Please try again.';
    }
  }

  /**
   * ============================================
   * TRACKING MANAGEMENT
   * ============================================
   */

  static async addTracking(adminPhone, orderNumber, trackingNumber, carrier) {
    try {
      // Update order with tracking info
      const result = await pool.query(
        `UPDATE orders
         SET tracking_number = $1,
             carrier = $2,
             tracking_url = $3,
             shipped_at = NOW(),
             status = 'shipped',
             updated_at = NOW()
         WHERE order_number = $4
         RETURNING user_id`,
        [trackingNumber, carrier, this.generateTrackingUrl(carrier, trackingNumber), orderNumber]
      );

      if (result.rows.length === 0) {
        return `❌ Order not found: ${orderNumber}`;
      }

      // Log admin action
      await this.logAction(adminPhone, 'add_tracking', 'order', orderNumber, {
        tracking_number: trackingNumber,
        carrier: carrier
      });

      const customerPhone = result.rows[0].user_id;

      return {
        success: true,
        message: `✅ TRACKING ADDED\n\nOrder: ${orderNumber}\nTracking: ${trackingNumber}\nCarrier: ${carrier}\n\n✅ Customer will be notified`,
        customerPhone,
        customerMessage: this.generateTrackingNotification(orderNumber, trackingNumber, carrier)
      };
    } catch (error) {
      console.error('Error adding tracking:', error);
      return { success: false, message: '⚠️ Error adding tracking. Please try again.' };
    }
  }

  static generateTrackingUrl(carrier, trackingNumber) {
    const urls = {
      'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
      'FEDEX': `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
      'POSTEN': `https://www.posten.no/tracking/${trackingNumber}`
    };
    return urls[carrier.toUpperCase()] || '';
  }

  static generateTrackingNotification(orderNumber, trackingNumber, carrier) {
    return `
📦 YOUR ORDER HAS SHIPPED!

Order #: ${orderNumber}

🚚 Tracking Information:
Carrier: ${carrier}
Tracking #: ${trackingNumber}

Estimated delivery: 3-5 business days

Track your package:
Type: TRACK ${orderNumber}

Type MENU for main menu
`;
  }

  /**
   * ============================================
   * CUSTOMER MANAGEMENT
   * ============================================
   */

  static async getCustomers() {
    try {
      const result = await pool.query(
        `SELECT u.phone, u.name, u.created_at,
                COUNT(o.order_number) as order_count,
                COALESCE(SUM(o.total), 0) as total_spent
         FROM users u
         LEFT JOIN orders o ON u.phone = o.user_id
         WHERE u.role = 'customer'
         GROUP BY u.phone, u.name, u.created_at
         ORDER BY total_spent DESC
         LIMIT 20`
      );

      if (result.rows.length === 0) {
        return `👥 NO CUSTOMERS FOUND\n\nType ADMIN for dashboard`;
      }

      let message = `👥 TOP CUSTOMERS\n\nShowing ${result.rows.length} customers:\n\n`;

      result.rows.forEach((customer, index) => {
        message += `${index + 1}. ${customer.phone}\n`;
        if (customer.name) {
          message += `   ${customer.name}\n`;
        }
        message += `   ${customer.order_count} orders - $${parseFloat(customer.total_spent).toFixed(2)}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Type: CUSTOMER <phone>\nExample: CUSTOMER ${result.rows[0].phone}\n`;

      return message;
    } catch (error) {
      console.error('Error getting customers:', error);
      return '⚠️ Error loading customers. Please try again.';
    }
  }

  static async getCustomerDetails(phone) {
    try {
      const result = await pool.query(
        `SELECT u.*,
                COUNT(o.order_number) as order_count,
                COALESCE(SUM(o.total), 0) as total_spent,
                MAX(o.created_at) as last_order
         FROM users u
         LEFT JOIN orders o ON u.phone = o.user_id
         WHERE u.phone = $1
         GROUP BY u.phone`,
        [phone]
      );

      if (result.rows.length === 0) {
        return `❌ Customer not found: ${phone}`;
      }

      const customer = result.rows[0];
      const memberSince = new Date(customer.created_at).toLocaleDateString();
      const lastOrder = customer.last_order ? new Date(customer.last_order).toLocaleDateString() : 'Never';
      const avgOrder = customer.order_count > 0 ? parseFloat(customer.total_spent) / customer.order_count : 0;

      let message = `
👤 CUSTOMER PROFILE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phone: ${customer.phone}`;

      if (customer.name) {
        message += `\nName: ${customer.name}`;
      }
      if (customer.email) {
        message += `\nEmail: ${customer.email}`;
      }

      message += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 ORDER STATISTICS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Total Orders: ${customer.order_count}\n`;
      message += `Total Spent: $${parseFloat(customer.total_spent).toFixed(2)}\n`;
      message += `Avg Order: $${avgOrder.toFixed(2)}\n`;
      message += `Last Order: ${lastOrder}\n`;
      message += `Member Since: ${memberSince}\n`;

      // Get recent orders
      const orders = await pool.query(
        `SELECT order_number, total, status, created_at
         FROM orders
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [phone]
      );

      if (orders.rows.length > 0) {
        message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 RECENT ORDERS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        orders.rows.forEach((order, index) => {
          const date = new Date(order.created_at).toLocaleDateString();
          message += `${index + 1}. ${order.order_number}\n`;
          message += `   $${parseFloat(order.total).toFixed(2)} - ${order.status}\n`;
          message += `   ${date}\n\n`;
        });
      }

      message += `Type: ADMIN ORDER <order#> for details`;

      return message;
    } catch (error) {
      console.error('Error getting customer details:', error);
      return '⚠️ Error loading customer details. Please try again.';
    }
  }

  /**
   * ============================================
   * ANALYTICS & STATS
   * ============================================
   */

  static async getStats() {
    try {
      const stats = await pool.query('SELECT * FROM admin_dashboard_stats');
      const data = stats.rows[0];

      // Get payment method breakdown
      const payments = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE stripe_payment_intent IS NOT NULL) as stripe_count,
           COALESCE(SUM(total) FILTER (WHERE stripe_payment_intent IS NOT NULL), 0) as stripe_total
         FROM orders
         WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
      );
      const paymentData = payments.rows[0];

      // Get top products
      const products = await pool.query(
        `SELECT product_name, COUNT(*) as sales, SUM(price * quantity) as revenue
         FROM order_items
         WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
         GROUP BY product_name
         ORDER BY sales DESC
         LIMIT 5`
      );

      let message = `
📊 BUSINESS ANALYTICS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 REVENUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Today: $${parseFloat(data.revenue_today || 0).toFixed(2)} (${data.orders_today || 0} orders)
This Week: $${parseFloat(data.revenue_this_week || 0).toFixed(2)} (${data.orders_this_week || 0} orders)
This Month: $${parseFloat(data.revenue_this_month || 0).toFixed(2)} (${data.orders_this_month || 0} orders)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ORDERS BY STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ Pending Payment: ${data.pending_payment || 0}
📦 Pending Delivery: ${data.pending_delivery || 0}
🚚 Shipped: ${data.shipped || 0}
✅ Completed: ${data.completed || 0}
💰 Refunded: ${data.refunded || 0}
⚠️  Disputed: ${data.disputed || 0}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 PAYMENT METHODS (This Month)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stripe: $${parseFloat(paymentData.stripe_total).toFixed(2)} (${paymentData.stripe_count} orders)
`;

      if (products.rows.length > 0) {
        message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🏆 TOP PRODUCTS (This Month)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        products.rows.forEach((product, index) => {
          message += `${index + 1}. ${product.product_name}\n`;
          message += `   ${product.sales} sold - $${parseFloat(product.revenue).toFixed(2)}\n\n`;
        });
      }

      message += `Type ADMIN for dashboard`;

      return message;
    } catch (error) {
      console.error('Error getting stats:', error);
      return '⚠️ Error loading statistics. Please try again.';
    }
  }

  /**
   * ============================================
   * REFUND MANAGEMENT
   * ============================================
   */

  static async processRefund(adminPhone, orderNumber, amount = null) {
    try {
      const orderResult = await pool.query(
        'SELECT total, user_id, refund_status FROM orders WHERE order_number = $1',
        [orderNumber]
      );

      if (orderResult.rows.length === 0) {
        return { success: false, message: `❌ Order not found: ${orderNumber}` };
      }

      const order = orderResult.rows[0];

      if (order.refund_status !== 'none') {
        return { success: false, message: `❌ Order already refunded` };
      }

      // Determine refund type
      const isFullRefund = !amount || parseFloat(amount) >= parseFloat(order.total);
      const refundAmount = isFullRefund ? parseFloat(order.total) : parseFloat(amount);

      // Process refund via Stripe
      const result = isFullRefund
        ? await StripeRefundService.createFullRefund(orderNumber, 'requested_by_customer')
        : await StripeRefundService.createPartialRefund(orderNumber, refundAmount, 'requested_by_customer');

      if (!result.success) {
        return { success: false, message: `❌ Refund failed: ${result.error}` };
      }

      // Log admin action
      await this.logAction(adminPhone, 'process_refund', 'order', orderNumber, {
        amount: refundAmount,
        type: isFullRefund ? 'full' : 'partial'
      });

      const message = `
✅ REFUND PROCESSED

Order: ${orderNumber}
Amount: $${refundAmount.toFixed(2)}
Type: ${isFullRefund ? 'FULL' : 'PARTIAL'}
Refund ID: ${result.refundId}

✅ Customer will be notified
✅ Funds return in 5-10 days
`;

      return {
        success: true,
        message,
        customerPhone: order.user_id,
        customerMessage: StripeRefundService.generateRefundMessage(orderNumber, refundAmount, result.refundId)
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return { success: false, message: '⚠️ Error processing refund. Please try again.' };
    }
  }

  /**
   * ============================================
   * ESCROW MANAGEMENT
   * ============================================
   */

  static async releaseEscrow(adminPhone, orderNumber) {
    try {
      const result = await StripeRefundService.releaseEscrowPayment(orderNumber);

      if (!result.success) {
        return { success: false, message: `❌ ${result.error}` };
      }

      // Log admin action
      await this.logAction(adminPhone, 'release_escrow', 'order', orderNumber);

      // Get customer phone
      const order = await pool.query(
        'SELECT user_id FROM orders WHERE order_number = $1',
        [orderNumber]
      );

      return {
        success: true,
        message: `✅ ESCROW RELEASED\n\nOrder: ${orderNumber}\n\n✅ Payment released to merchant\n✅ Customer will be notified`,
        customerPhone: order.rows[0]?.user_id,
        customerMessage: StripeRefundService.generateEscrowReleaseMessage(orderNumber)
      };
    } catch (error) {
      console.error('Error releasing escrow:', error);
      return { success: false, message: '⚠️ Error releasing escrow. Please try again.' };
    }
  }

  /**
   * ============================================
   * PRODUCT MANAGEMENT
   * ============================================
   */

  static async getProducts(filter = 'all', adminPhone = null) {
    try {
      let query = 'SELECT id, sku, name, price, category, stock_quantity, is_active FROM products';
      let params = [];

      switch (filter) {
        case 'active':
          query += ' WHERE is_active = true';
          break;
        case 'inactive':
          query += ' WHERE is_active = false';
          break;
        case 'low_stock':
          query += ' WHERE stock_quantity < low_stock_threshold';
          break;
      }

      query += ' ORDER BY created_at DESC LIMIT 50';

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return `📦 NO PRODUCTS FOUND\n\nType: ADD PRODUCT\nto add your first product`;
      }

      // Store product list mapping for quick selection
      if (adminPhone) {
        const ConversationManager = require('./conversationManager');
        const productMap = {};
        result.rows.forEach((product, index) => {
          productMap[index + 1] = product.sku;
        });
        ConversationManager.setContext(adminPhone, 'productList', productMap);
      }

      let message = `📦 PRODUCT CATALOG\n\nFilter: ${filter.toUpperCase()}\nShowing ${result.rows.length} products:\n\n`;

      result.rows.forEach((product, index) => {
        const status = product.is_active ? '✅' : '❌';
        message += `${index + 1}. ${status} ${product.name}\n`;
        message += `   SKU: ${product.sku}\n`;
        message += `   Price: $${parseFloat(product.price).toFixed(2)}\n`;
        message += `   Stock: ${product.stock_quantity}\n`;
        message += `   Category: ${product.category || 'None'}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Commands:\n`;
      message += `• ADD PRODUCT - Create new\n`;
      message += `• EDIT PRODUCT <sku> - Edit product\n`;
      message += `• DELETE PRODUCT <sku> - Remove\n`;
      message += `\nFilters:\n`;
      message += `• ADMIN PRODUCTS active\n`;
      message += `• ADMIN PRODUCTS inactive\n`;
      message += `• ADMIN PRODUCTS low_stock\n`;

      if (adminPhone) {
        message += `\n💡 Type a number (1-${result.rows.length}) to view product details`;
      }

      return message;
    } catch (error) {
      console.error('Error getting products:', error);
      return '⚠️ Error loading products. Please try again.';
    }
  }

  static async getProductDetails(sku, adminPhone = null) {
    try {
      const result = await pool.query(
        'SELECT * FROM products WHERE sku = $1 OR LOWER(name) = LOWER($1)',
        [sku]
      );

      if (result.rows.length === 0) {
        return `❌ Product not found: ${sku}`;
      }

      const product = result.rows[0];
      const createdDate = new Date(product.created_at).toLocaleDateString();

      // Store product SKU in context for quick actions
      if (adminPhone) {
        const ConversationManager = require('./conversationManager');
        ConversationManager.setContext(adminPhone, 'viewingProduct', product.sku);
        ConversationManager.setContext(adminPhone, 'productIsActive', product.is_active);
      }

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 PRODUCT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: ${product.name}
SKU: ${product.sku}
Status: ${product.is_active ? '✅ Active' : '❌ Inactive'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 PRICING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Price: $${parseFloat(product.price).toFixed(2)}`;

      if (product.compare_at_price) {
        message += `\nCompare: $${parseFloat(product.compare_at_price).toFixed(2)}`;
      }

      message += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 DETAILS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (product.description) {
        message += `Description:\n${product.description}\n\n`;
      }

      message += `Category: ${product.category || 'None'}\n`;

      if (product.subcategory) {
        message += `Subcategory: ${product.subcategory}\n`;
      }

      message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 INVENTORY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Stock: ${product.stock_quantity} units\n`;
      message += `Low Stock Alert: ${product.low_stock_threshold} units\n`;

      if (product.rating > 0) {
        message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⭐ REVIEWS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `Rating: ${product.rating}/5.0\n`;
        message += `Reviews: ${product.reviews_count}\n`;
      }

      message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nℹ️  INFO\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Created: ${createdDate}\n`;
      message += `Featured: ${product.is_featured ? 'Yes' : 'No'}\n`;

      message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ ACTIONS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `1️⃣ EDIT PRODUCT ${product.sku}\n`;
      message += `2️⃣ DELETE PRODUCT ${product.sku}\n`;
      message += `3️⃣ ${product.is_active ? 'DEACTIVATE' : 'ACTIVATE'} PRODUCT ${product.sku}\n`;

      if (adminPhone) {
        message += `\n💡 Type a number (1-3) to perform action`;
      }

      return message;
    } catch (error) {
      console.error('Error getting product details:', error);
      return '⚠️ Error loading product details. Please try again.';
    }
  }

  static async createProduct(adminPhone, productData) {
    try {
      // Generate SKU from name if not provided
      const sku = productData.sku || this.generateSKU(productData.name);

      const result = await pool.query(
        `INSERT INTO products (
          sku, name, description, price, category, subcategory,
          stock_quantity, low_stock_threshold, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          sku,
          productData.name,
          productData.description || '',
          productData.price || 1.00,
          productData.category || 'Uncategorized',
          productData.subcategory || null,
          productData.stock || 999,
          productData.lowStockThreshold || 10,
          true
        ]
      );

      // Log admin action
      await this.logAction(adminPhone, 'create_product', 'product', sku, productData);

      const product = result.rows[0];

      return {
        success: true,
        message: `
✅ PRODUCT CREATED

Name: ${product.name}
SKU: ${product.sku}
Price: $${parseFloat(product.price).toFixed(2)}
Category: ${product.category}
Stock: ${product.stock_quantity}

Product is now ACTIVE and available for purchase.

Type: ADMIN PRODUCTS
to view all products
`
      };
    } catch (error) {
      console.error('Error creating product:', error);
      if (error.code === '23505') {
        return { success: false, message: '❌ Product with this SKU already exists.' };
      }
      return { success: false, message: '⚠️ Error creating product. Please try again.' };
    }
  }

  static async updateProduct(adminPhone, sku, updates) {
    try {
      const fields = [];
      const values = [];
      let index = 1;

      // Build dynamic update query
      if (updates.name) {
        fields.push(`name = $${index++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push(`description = $${index++}`);
        values.push(updates.description);
      }
      if (updates.price !== undefined) {
        fields.push(`price = $${index++}`);
        values.push(updates.price);
      }
      if (updates.category) {
        fields.push(`category = $${index++}`);
        values.push(updates.category);
      }
      if (updates.subcategory !== undefined) {
        fields.push(`subcategory = $${index++}`);
        values.push(updates.subcategory);
      }
      if (updates.stock !== undefined) {
        fields.push(`stock_quantity = $${index++}`);
        values.push(updates.stock);
      }
      if (updates.isActive !== undefined) {
        fields.push(`is_active = $${index++}`);
        values.push(updates.isActive);
      }

      if (fields.length === 0) {
        return { success: false, message: '❌ No fields to update.' };
      }

      fields.push(`updated_at = NOW()`);
      values.push(sku);

      const query = `UPDATE products SET ${fields.join(', ')} WHERE sku = $${index} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return { success: false, message: `❌ Product not found: ${sku}` };
      }

      // Log admin action
      await this.logAction(adminPhone, 'update_product', 'product', sku, updates);

      const product = result.rows[0];

      return {
        success: true,
        message: `
✅ PRODUCT UPDATED

Name: ${product.name}
SKU: ${product.sku}
Price: $${parseFloat(product.price).toFixed(2)}
Stock: ${product.stock_quantity}
Status: ${product.is_active ? 'Active' : 'Inactive'}

Type: ADMIN PRODUCT ${product.sku}
to view details
`
      };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, message: '⚠️ Error updating product. Please try again.' };
    }
  }

  static async deleteProduct(adminPhone, sku) {
    try {
      const result = await pool.query(
        'DELETE FROM products WHERE sku = $1 RETURNING name',
        [sku]
      );

      if (result.rows.length === 0) {
        return { success: false, message: `❌ Product not found: ${sku}` };
      }

      // Log admin action
      await this.logAction(adminPhone, 'delete_product', 'product', sku);

      return {
        success: true,
        message: `✅ PRODUCT DELETED\n\n${result.rows[0].name} (${sku}) has been removed from catalog.`
      };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, message: '⚠️ Error deleting product. Please try again.' };
    }
  }

  static async toggleProductStatus(adminPhone, sku) {
    try {
      const result = await pool.query(
        `UPDATE products
         SET is_active = NOT is_active, updated_at = NOW()
         WHERE sku = $1
         RETURNING name, is_active`,
        [sku]
      );

      if (result.rows.length === 0) {
        return { success: false, message: `❌ Product not found: ${sku}` };
      }

      const product = result.rows[0];
      const status = product.is_active ? 'ACTIVATED' : 'DEACTIVATED';

      // Log admin action
      await this.logAction(adminPhone, 'toggle_product_status', 'product', sku, {
        is_active: product.is_active
      });

      return {
        success: true,
        message: `✅ PRODUCT ${status}\n\n${product.name} is now ${product.is_active ? 'available' : 'hidden'} from customers.`
      };
    } catch (error) {
      console.error('Error toggling product status:', error);
      return { success: false, message: '⚠️ Error updating product. Please try again.' };
    }
  }

  static generateSKU(name) {
    // Generate SKU from product name
    const cleaned = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    return `${cleaned.substring(0, 6)}${timestamp}`;
  }
}

module.exports = AdminService;
