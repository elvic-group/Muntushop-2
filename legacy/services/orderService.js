// Order Service
// Handles order database operations

const pool = require('../backend/src/config/database');

class OrderService {
  /**
   * Create a new order
   */
  static async createOrder(userId, orderData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const {
        orderNumber,
        items,
        subtotal,
        shipping = 0,
        tax = 0,
        discount = 0,
        total,
        shippingAddress,
        paymentMethod = 'card',
        stripeSessionId,
        customerPhone
      } = orderData;

      // Create order
      const result = await client.query(
        `INSERT INTO orders (
          user_id, order_number, items, subtotal, shipping, tax, discount, total,
          shipping_address, payment_method, stripe_session_id, status, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'pending')
        RETURNING *`,
        [
          userId,
          orderNumber,
          JSON.stringify(items),
          subtotal,
          shipping,
          tax,
          discount,
          total,
          JSON.stringify({ address: shippingAddress, phone: customerPhone }),
          paymentMethod,
          stripeSessionId
        ]
      );

      // Update product stock
      for (const item of items) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.productId]
        );
      }

      // Clear user cart
      await client.query(
        'UPDATE carts SET items = \'[]\', subtotal = 0, total = 0 WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating order:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get order by order number
   */
  static async getOrderByNumber(orderNumber) {
    try {
      const result = await pool.query(
        'SELECT * FROM orders WHERE order_number = $1',
        [orderNumber]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   */
  static async getUserOrders(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  /**
   * Update order payment status
   */
  static async updatePaymentStatus(orderNumber, paymentStatus, paymentIntentId = null) {
    try {
      const updates = [paymentStatus, orderNumber];
      let query = 'UPDATE orders SET payment_status = $1, updated_at = NOW()';

      if (paymentStatus === 'paid') {
        query += ', paid_at = NOW(), status = \'processing\'';
      }

      if (paymentIntentId) {
        query += ', stripe_payment_intent = $3';
        updates.push(paymentIntentId);
      }

      query += ' WHERE order_number = $2 RETURNING *';

      const result = await pool.query(query, updates);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderNumber, status) {
    try {
      const statusUpdates = {
        processing: {},
        shipped: { shipped_at: 'NOW()', fulfillment_status: 'fulfilled' },
        delivered: { delivered_at: 'NOW()', fulfillment_status: 'fulfilled' },
        cancelled: { cancelled_at: 'NOW()' }
      };

      let query = 'UPDATE orders SET status = $1, updated_at = NOW()';
      const updates = [status, orderNumber];

      if (statusUpdates[status]) {
        const additional = statusUpdates[status];
        Object.entries(additional).forEach(([key, value]) => {
          query += `, ${key} = ${value}`;
        });
      }

      query += ' WHERE order_number = $2 RETURNING *';

      const result = await pool.query(query, updates);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Add tracking information
   */
  static async addTracking(orderNumber, trackingNumber, carrier, trackingUrl = null) {
    try {
      const result = await pool.query(
        `UPDATE orders
         SET tracking_number = $1, carrier = $2, tracking_url = $3,
             fulfillment_status = 'fulfilled', shipped_at = NOW(), updated_at = NOW()
         WHERE order_number = $4
         RETURNING *`,
        [trackingNumber, carrier, trackingUrl, orderNumber]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error adding tracking:', error);
      throw error;
    }
  }

  /**
   * Get order tracking info
   */
  static async getTracking(orderNumber) {
    try {
      const result = await pool.query(
        `SELECT order_number, status, fulfillment_status, tracking_number,
                tracking_url, carrier, shipped_at, delivered_at
         FROM orders WHERE order_number = $1`,
        [orderNumber]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching tracking:', error);
      throw error;
    }
  }

  /**
   * Generate tracking message
   */
  static async getTrackingMessage(orderNumber) {
    try {
      const tracking = await this.getTracking(orderNumber);

      if (!tracking) {
        return `❌ Order #${orderNumber} not found.\n\nPlease check your order number and try again.`;
      }

      const statusIcons = {
        pending: '🕐',
        processing: '📦',
        shipped: '🚚',
        delivered: '✅',
        cancelled: '❌'
      };

      let message = `
📦 ORDER TRACKING

Order #: ${tracking.order_number}
Status: ${statusIcons[tracking.status]} ${tracking.status.toUpperCase()}
`;

      if (tracking.tracking_number) {
        message += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚚 SHIPPING INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tracking #: ${tracking.tracking_number}
Carrier: ${tracking.carrier}
`;

        if (tracking.tracking_url) {
          message += `
Track online:
${tracking.tracking_url}
`;
        }
      }

      if (tracking.shipped_at) {
        message += `\n📅 Shipped: ${new Date(tracking.shipped_at).toLocaleDateString()}`;
      }

      if (tracking.delivered_at) {
        message += `\n✅ Delivered: ${new Date(tracking.delivered_at).toLocaleDateString()}`;
      }

      message += `

Type MENU for main menu
`;

      return message;
    } catch (error) {
      console.error('Error generating tracking message:', error);
      return `⚠️ Error fetching tracking information. Please try again later.`;
    }
  }

  /**
   * Get formatted user orders for WhatsApp
   */
  static async getUserOrders(userId) {
    try {
      const result = await pool.query(
        `SELECT order_number, total, status, created_at, payment_status
         FROM orders
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId]
      );

      if (result.rows.length === 0) {
        return `📦 YOUR ORDERS\n\nYou haven't placed any orders yet.\n\nType MENU to start shopping!`;
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

      let message = `📦 YOUR ORDER HISTORY\n\nShowing last ${result.rows.length} order(s):\n\n`;

      result.rows.forEach((order, index) => {
        const date = new Date(order.created_at).toLocaleDateString();
        const status = statusIcons[order.status] || '•';
        message += `${index + 1}. ${status} ${order.order_number}\n`;
        message += `   Amount: $${parseFloat(order.total).toFixed(2)}\n`;
        message += `   Status: ${order.status}\n`;
        message += `   Date: ${date}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `💡 Track an order:\nType: TRACK <order_number>\n\n`;
      message += `Type MENU for main menu`;

      return message;
    } catch (error) {
      console.error('Error getting user orders:', error);
      return `⚠️ Error fetching your orders. Please try again later.`;
    }
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(phoneNumber, orderNumber) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get user ID
      const userResult = await client.query(
        'SELECT id FROM users WHERE phone = $1',
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const userId = userResult.rows[0].id;

      // Get order details
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE order_number = $1 AND user_id = $2',
        [orderNumber, userId]
      );

      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: `❌ ORDER NOT FOUND\n\nOrder ${orderNumber} not found in your account.\n\nType ORDERS to view your orders.`
        };
      }

      const order = orderResult.rows[0];

      // Check if order can be cancelled
      const cancellableStatuses = ['pending', 'pending_delivery', 'processing'];
      if (!cancellableStatuses.includes(order.status)) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: `❌ CANNOT CANCEL ORDER\n\nOrder ${orderNumber} cannot be cancelled.\n\nCurrent status: ${order.status}\n\nOnly orders in pending, pending_delivery, or processing status can be cancelled.\n\nNeed help? Type HELP`
        };
      }

      // Check if already cancelled
      if (order.status === 'cancelled') {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: `ℹ️ ORDER ALREADY CANCELLED\n\nOrder ${orderNumber} was already cancelled.\n\nType ORDERS to view your orders.`
        };
      }

      // Restore product stock
      const items = order.items || [];
      for (const item of items) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.productId]
        );
      }

      // Refund to wallet if payment was completed
      let refundAmount = 0;
      if (order.payment_status === 'completed' || order.payment_status === 'paid') {
        refundAmount = parseFloat(order.total);

        // Add funds to wallet
        await client.query(
          `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
          [refundAmount, userId]
        );

        // Get new balance
        const balanceResult = await client.query(
          'SELECT balance FROM wallets WHERE user_id = $1',
          [userId]
        );
        const newBalance = balanceResult.rows[0]?.balance || 0;

        // Record transaction
        await client.query(
          `INSERT INTO transactions (wallet_id, user_id, type, amount, balance_after, description, reference_type, reference_id)
           SELECT w.id, $1, 'credit', $2, $3, $4, 'order_cancellation', $5
           FROM wallets w WHERE w.user_id = $1`,
          [userId, refundAmount, newBalance, `Refund for cancelled order ${orderNumber}`, order.id]
        );
      }

      // Restore loyalty points if they were deducted (if order used points)
      // This would need to check if points were used in the order
      // For now, we'll skip this as it requires additional order fields

      // Update order status
      await client.query(
        `UPDATE orders SET status = 'cancelled', payment_status = 'refunded', updated_at = NOW() WHERE id = $1`,
        [order.id]
      );

      // Create cancellation notification
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, action_type, action_data)
         VALUES ($1, 'order_update', 'Order Cancelled', $2, 'track_order', $3)`,
        [
          userId,
          `Your order ${orderNumber} has been cancelled successfully.${refundAmount > 0 ? ` $${refundAmount.toFixed(2)} refunded to your wallet.` : ''}`,
          JSON.stringify({ orderNumber: orderNumber })
        ]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: `✅ ORDER CANCELLED\n\nOrder ${orderNumber} has been cancelled successfully.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${refundAmount > 0 ? `💰 Refund: $${refundAmount.toFixed(2)}\nRefunded to your wallet\n\n` : ''}📦 Stock restored for all items\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nType MY WALLET to check your balance\nType ORDERS to view your orders`
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error cancelling order:', error);
      return {
        success: false,
        message: `⚠️ ERROR CANCELLING ORDER\n\nSomething went wrong. Please try again or contact support.\n\nType HELP for assistance`
      };
    } finally {
      client.release();
    }
  }
}

module.exports = OrderService;
