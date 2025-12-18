// Phase 2 Features Service
// Wallet, Wishlist, Reviews, Notifications

const pool = require('../backend/src/config/database');

class Phase2Service {
  /**
   * ============================================
   * WALLET MANAGEMENT
   * ============================================
   */

  static async getWallet(phoneNumber) {
    try {
      const result = await pool.query(
        `SELECT u.id, u.name, w.balance, w.currency
         FROM users u
         LEFT JOIN wallets w ON u.id = w.user_id
         WHERE u.phone = $1`,
        [phoneNumber]
      );

      if (result.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const user = result.rows[0];
      const balance = user.balance || 0;

      // Get recent transactions
      const transactions = await pool.query(
        `SELECT type, amount, description, created_at
         FROM transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [user.id]
      );

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 MY WALLET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${user.name || 'Customer'}
Current Balance: $${parseFloat(balance).toFixed(2)}
`;

      if (transactions.rows.length > 0) {
        message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 RECENT TRANSACTIONS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        transactions.rows.forEach((tx) => {
          const icon = tx.type === 'credit' || tx.type === 'cashback' ? '➕' : '➖';
          const sign = tx.type === 'credit' || tx.type === 'cashback' ? '+' : '-';
          const date = new Date(tx.created_at).toLocaleDateString();

          message += `${icon} ${sign}$${parseFloat(tx.amount).toFixed(2)}\n`;
          message += `   ${tx.description}\n`;
          message += `   ${date}\n\n`;
        });
      }

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ ACTIONS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `1️⃣ Add Funds\n`;
      message += `2️⃣ Transaction History\n`;
      message += `3️⃣ Back to Dashboard\n\n`;
      message += `💡 Type a number (1-3)`;

      return message;
    } catch (error) {
      console.error('Error getting wallet:', error);
      return '⚠️ Error loading wallet. Please try again.';
    }
  }

  static async getTransactionHistory(phoneNumber) {
    try {
      const userResult = await pool.query(
        'SELECT id FROM users WHERE phone = $1',
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const userId = userResult.rows[0].id;

      const transactions = await pool.query(
        `SELECT type, amount, description, balance_after, created_at
         FROM transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      );

      if (transactions.rows.length === 0) {
        return `📊 TRANSACTION HISTORY\n\nNo transactions yet.\n\nType MY WALLET to return.`;
      }

      let message = `📊 TRANSACTION HISTORY\n\nShowing last ${transactions.rows.length} transactions:\n\n`;

      transactions.rows.forEach((tx, index) => {
        const icon = tx.type === 'credit' || tx.type === 'cashback' ? '➕' : '➖';
        const sign = tx.type === 'credit' || tx.type === 'cashback' ? '+' : '-';
        const date = new Date(tx.created_at).toLocaleString();

        message += `${index + 1}. ${icon} ${sign}$${parseFloat(tx.amount).toFixed(2)}\n`;
        message += `   ${tx.description}\n`;
        message += `   Balance: $${parseFloat(tx.balance_after).toFixed(2)}\n`;
        message += `   ${date}\n\n`;
      });

      message += `Type MY WALLET to return`;

      return message;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return '⚠️ Error loading transactions. Please try again.';
    }
  }

  static async addFunds(userId, amount, description = 'Added funds') {
    try {
      // Get or create wallet
      let wallet = await pool.query(
        'SELECT id, balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      if (wallet.rows.length === 0) {
        const newWallet = await pool.query(
          'INSERT INTO wallets (user_id, balance) VALUES ($1, 0) RETURNING id, balance',
          [userId]
        );
        wallet = newWallet;
      }

      const walletId = wallet.rows[0].id;
      const currentBalance = parseFloat(wallet.rows[0].balance);
      const newBalance = currentBalance + parseFloat(amount);

      // Update wallet balance
      await pool.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
        [newBalance, walletId]
      );

      // Record transaction
      await pool.query(
        `INSERT INTO transactions (wallet_id, user_id, type, amount, balance_after, description)
         VALUES ($1, $2, 'credit', $3, $4, $5)`,
        [walletId, userId, amount, newBalance, description]
      );

      return {
        success: true,
        newBalance: newBalance,
        message: `✅ FUNDS ADDED\n\n$${parseFloat(amount).toFixed(2)} added to your wallet!\n\nNew Balance: $${newBalance.toFixed(2)}\n\nType MY WALLET to view details.`
      };
    } catch (error) {
      console.error('Error adding funds:', error);
      return {
        success: false,
        message: '⚠️ Error adding funds. Please try again.'
      };
    }
  }

  static async deductFunds(userId, amount, description) {
    try {
      const wallet = await pool.query(
        'SELECT id, balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      if (wallet.rows.length === 0 || parseFloat(wallet.rows[0].balance) < parseFloat(amount)) {
        return { success: false, message: 'Insufficient balance' };
      }

      const walletId = wallet.rows[0].id;
      const currentBalance = parseFloat(wallet.rows[0].balance);
      const newBalance = currentBalance - parseFloat(amount);

      await pool.query(
        'UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2',
        [newBalance, walletId]
      );

      await pool.query(
        `INSERT INTO transactions (wallet_id, user_id, type, amount, balance_after, description)
         VALUES ($1, $2, 'debit', $3, $4, $5)`,
        [walletId, userId, amount, newBalance, description]
      );

      return { success: true, newBalance: newBalance };
    } catch (error) {
      console.error('Error deducting funds:', error);
      return { success: false, message: 'Error processing payment' };
    }
  }

  /**
   * ============================================
   * WISHLIST MANAGEMENT
   * ============================================
   */

  static async getWishlist(phoneNumber) {
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
        `SELECT w.id, w.notes, w.created_at, p.id as product_id, p.sku, p.name, p.price, p.stock_quantity
         FROM wishlist w
         JOIN products p ON w.product_id = p.id
         WHERE w.user_id = $1
         ORDER BY w.created_at DESC`,
        [userId]
      );

      if (result.rows.length === 0) {
        return `❤️ MY WISHLIST\n\nYour wishlist is empty.\n\nBrowse products and add your favorites!\n\nType BROWSE to start shopping.`;
      }

      let message = `❤️ MY WISHLIST\n\nSaved Products: ${result.rows.length}\n\n`;

      result.rows.forEach((item, index) => {
        const inStock = item.stock_quantity > 0 ? '✅' : '❌ Out of Stock';
        message += `${index + 1}. ${item.name}\n`;
        message += `   $${parseFloat(item.price).toFixed(2)} • ${inStock}\n`;
        if (item.notes) {
          message += `   Note: ${item.notes}\n`;
        }
        message += `\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Actions:\n`;
      message += `• Type number to view product\n`;
      message += `• REMOVE WISHLIST <number> - Remove item\n`;
      message += `• BACK - Return to dashboard\n`;

      return message;
    } catch (error) {
      console.error('Error getting wishlist:', error);
      return '⚠️ Error loading wishlist. Please try again.';
    }
  }

  static async addToWishlist(userId, productId, notes = null) {
    try {
      await pool.query(
        `INSERT INTO wishlist (user_id, product_id, notes)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [userId, productId, notes]
      );

      return {
        success: true,
        message: `❤️ ADDED TO WISHLIST\n\nProduct saved to your wishlist!\n\nType MY WISHLIST to view all saved items.`
      };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return {
        success: false,
        message: '⚠️ Error adding to wishlist. Please try again.'
      };
    }
  }

  static async removeFromWishlist(userId, wishlistNumber) {
    try {
      // Get wishlist items
      const items = await pool.query(
        `SELECT w.id, p.name
         FROM wishlist w
         JOIN products p ON w.product_id = p.id
         WHERE w.user_id = $1
         ORDER BY w.created_at DESC`,
        [userId]
      );

      const item = items.rows[wishlistNumber - 1];

      if (!item) {
        return {
          success: false,
          message: '❌ Item not found in wishlist.'
        };
      }

      await pool.query('DELETE FROM wishlist WHERE id = $1', [item.id]);

      return {
        success: true,
        message: `✅ REMOVED FROM WISHLIST\n\n${item.name} has been removed from your wishlist.\n\nType MY WISHLIST to view remaining items.`
      };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return {
        success: false,
        message: '⚠️ Error removing item. Please try again.'
      };
    }
  }

  /**
   * ============================================
   * REVIEWS & RATINGS
   * ============================================
   */

  static async getProductReviews(productId) {
    try {
      const result = await pool.query(
        `SELECT r.rating, r.review_text, r.is_verified_purchase, r.created_at,
                u.name, u.phone
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         WHERE r.product_id = $1
         ORDER BY r.created_at DESC
         LIMIT 10`,
        [productId]
      );

      if (result.rows.length === 0) {
        return `⭐ NO REVIEWS YET\n\nBe the first to review this product!`;
      }

      let message = `⭐ CUSTOMER REVIEWS\n\nShowing ${result.rows.length} reviews:\n\n`;

      result.rows.forEach((review, index) => {
        const stars = '⭐'.repeat(review.rating);
        const verified = review.is_verified_purchase ? '✅ Verified Purchase' : '';
        const name = review.name || review.phone.substring(0, 6) + '***';
        const date = new Date(review.created_at).toLocaleDateString();

        message += `${index + 1}. ${stars} ${review.rating}/5\n`;
        message += `   ${name} ${verified}\n`;
        if (review.review_text) {
          message += `   "${review.review_text}"\n`;
        }
        message += `   ${date}\n\n`;
      });

      return message;
    } catch (error) {
      console.error('Error getting reviews:', error);
      return '⚠️ Error loading reviews.';
    }
  }

  static async addReview(userId, productId, orderId, rating, reviewText = null) {
    try {
      // Check if user bought this product
      const purchase = await pool.query(
        `SELECT id FROM orders WHERE user_id = $1 AND id = $2`,
        [userId, orderId]
      );

      const isVerified = purchase.rows.length > 0;

      await pool.query(
        `INSERT INTO reviews (user_id, product_id, order_id, rating, review_text, is_verified_purchase)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, product_id, order_id) DO UPDATE
         SET rating = $4, review_text = $5, updated_at = NOW()`,
        [userId, productId, orderId, rating, reviewText, isVerified]
      );

      return {
        success: true,
        message: `✅ REVIEW SUBMITTED\n\nThank you for your feedback!\n\nYour ${rating}-star review has been posted.${isVerified ? '\n✅ Marked as Verified Purchase' : ''}`
      };
    } catch (error) {
      console.error('Error adding review:', error);
      return {
        success: false,
        message: '⚠️ Error submitting review. Please try again.'
      };
    }
  }

  /**
   * ============================================
   * NOTIFICATIONS
   * ============================================
   */

  static async getNotifications(phoneNumber) {
    try {
      const userResult = await pool.query(
        'SELECT id FROM users WHERE phone = $1',
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const userId = userResult.rows[0].id;

      const unreadCount = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      const notifications = await pool.query(
        `SELECT id, type, title, message, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId]
      );

      const unread = parseInt(unreadCount.rows[0].count);

      let message = `🔔 NOTIFICATIONS\n\n`;

      if (unread > 0) {
        message += `You have ${unread} new notification${unread > 1 ? 's' : ''}!\n\n`;
      } else {
        message += `All caught up!\n\n`;
      }

      if (notifications.rows.length === 0) {
        message += `No notifications yet.\n\nType MY ACCOUNT to return.`;
        return message;
      }

      notifications.rows.forEach((notif, index) => {
        const icon = this.getNotificationIcon(notif.type);
        const readStatus = notif.is_read ? '' : '🔵 ';
        const date = new Date(notif.created_at).toLocaleDateString();

        message += `${index + 1}. ${readStatus}${icon} ${notif.title}\n`;
        message += `   ${notif.message}\n`;
        message += `   ${date}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `1️⃣ Mark All as Read\n`;
      message += `2️⃣ Back to Dashboard\n\n`;
      message += `💡 Type a number (1-2)`;

      return message;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return '⚠️ Error loading notifications. Please try again.';
    }
  }

  static async createNotification(userId, type, title, message, actionType = null, actionData = null) {
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, action_type, action_data)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, type, title, message, actionType, actionData ? JSON.stringify(actionData) : null]
      );

      return { success: true };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false };
    }
  }

  static async markAllAsRead(userId) {
    try {
      await pool.query(
        `UPDATE notifications
         SET is_read = true, read_at = NOW()
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );

      return {
        success: true,
        message: `✅ ALL NOTIFICATIONS MARKED AS READ\n\nType NOTIFICATIONS to view them.`
      };
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return {
        success: false,
        message: '⚠️ Error updating notifications.'
      };
    }
  }

  static getNotificationIcon(type) {
    const icons = {
      'order_update': '📦',
      'promotion': '🎉',
      'new_product': '🆕',
      'delivery': '🚚',
      'cashback': '💰',
      'review_reminder': '⭐'
    };
    return icons[type] || '🔔';
  }
}

module.exports = Phase2Service;
