// Phase 3 Service
// Loyalty Program, Referral System, Recommendations, Order Scheduling

const pool = require('../backend/src/config/database');

class Phase3Service {
  /**
   * ============================================
   * LOYALTY & REWARDS PROGRAM
   * ============================================
   */

  static async getLoyaltyStatus(phoneNumber) {
    try {
      const userResult = await pool.query(
        `SELECT id, name, phone FROM users WHERE phone = $1`,
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const user = userResult.rows[0];

      // Get loyalty points and tier
      const loyaltyResult = await pool.query(
        `SELECT lp.total_points, lp.available_points, lp.lifetime_points,
                lt.name as tier_name, lt.discount_percentage, lt.cashback_percentage,
                lt.free_shipping, lt.priority_support
         FROM loyalty_points lp
         JOIN loyalty_tiers lt ON lp.current_tier_id = lt.id
         WHERE lp.user_id = $1`,
        [user.id]
      );

      if (loyaltyResult.rows.length === 0) {
        return `⚠️ Loyalty account not found.`;
      }

      const loyalty = loyaltyResult.rows[0];

      // Get next tier info
      const nextTierResult = await pool.query(
        `SELECT name, min_points
         FROM loyalty_tiers
         WHERE min_points > $1
         ORDER BY min_points ASC
         LIMIT 1`,
        [loyalty.total_points]
      );

      const nextTier = nextTierResult.rows[0];

      // Get recent transactions
      const transactionsResult = await pool.query(
        `SELECT type, points, description, created_at
         FROM loyalty_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [user.id]
      );

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 LOYALTY REWARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${user.name ? user.name + "'s " : ''}Current Status:

🎖️  Tier: ${loyalty.tier_name}
⭐ Available Points: ${loyalty.available_points}
📊 Total Points: ${loyalty.total_points}
🎯 Lifetime Points: ${loyalty.lifetime_points}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ TIER BENEFITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Discount: ${loyalty.discount_percentage}% on orders
💵 Cashback: ${loyalty.cashback_percentage}% on purchases
${loyalty.free_shipping ? '🚚 Free Shipping on all orders' : ''}
${loyalty.priority_support ? '⚡ Priority Customer Support' : ''}
`;

      if (nextTier) {
        const pointsNeeded = nextTier.min_points - loyalty.total_points;
        message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📈 NEXT TIER: ${nextTier.name}\n${pointsNeeded} points away!\n`;
      }

      if (transactionsResult.rows.length > 0) {
        message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📜 RECENT ACTIVITY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        transactionsResult.rows.forEach(tx => {
          const icon = tx.type === 'earn' ? '➕' : '➖';
          const sign = tx.type === 'earn' ? '+' : '-';
          message += `${icon} ${sign}${tx.points} pts - ${tx.description}\n`;
        });
      }

      message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ ACTIONS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `1️⃣ Browse Rewards Catalog\n`;
      message += `2️⃣ Points History\n`;
      message += `3️⃣ My Redeemed Rewards\n`;
      message += `4️⃣ How to Earn Points\n`;
      message += `5️⃣ Back to Dashboard\n\n`;
      message += `💡 Type a number (1-5) to continue`;

      return message;
    } catch (error) {
      console.error('Error getting loyalty status:', error);
      return '⚠️ Error loading loyalty status. Please try again.';
    }
  }

  static async getRewardsCatalog() {
    try {
      const result = await pool.query(
        `SELECT id, name, description, points_required, reward_type, reward_value, stock_quantity
         FROM rewards_catalog
         WHERE is_active = true
         ORDER BY points_required ASC`
      );

      if (result.rows.length === 0) {
        return `📦 NO REWARDS AVAILABLE\n\nNo rewards in catalog at the moment.\n\nType MY REWARDS to return.`;
      }

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎁 REWARDS CATALOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Redeem your points for exciting rewards!

`;

      result.rows.forEach((reward, index) => {
        const icon = this.getRewardIcon(reward.reward_type);
        message += `${index + 1}. ${icon} ${reward.name}\n`;
        message += `   ${reward.description}\n`;
        message += `   Points: ${reward.points_required} pts`;

        if (reward.reward_value) {
          message += ` | Value: $${parseFloat(reward.reward_value).toFixed(2)}`;
        }

        if (reward.stock_quantity > 0) {
          message += ` | Stock: ${reward.stock_quantity}`;
        }

        message += `\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `💡 Type a number (1-${result.rows.length}) to redeem reward\n`;
      message += `Or type MY REWARDS to go back`;

      return message;
    } catch (error) {
      console.error('Error getting rewards catalog:', error);
      return '⚠️ Error loading rewards. Please try again.';
    }
  }

  static async redeemReward(userId, rewardNumber) {
    try {
      // Get reward details
      const rewardsResult = await pool.query(
        `SELECT id, name, points_required, reward_type, reward_value, stock_quantity
         FROM rewards_catalog
         WHERE is_active = true
         ORDER BY points_required ASC`
      );

      const reward = rewardsResult.rows[rewardNumber - 1];

      if (!reward) {
        return {
          success: false,
          message: '❌ Reward not found.'
        };
      }

      // Check stock
      if (reward.stock_quantity <= 0) {
        return {
          success: false,
          message: '❌ OUT OF STOCK\n\nThis reward is currently unavailable.'
        };
      }

      // Get user points
      const loyaltyResult = await pool.query(
        `SELECT id, available_points FROM loyalty_points WHERE user_id = $1`,
        [userId]
      );

      if (loyaltyResult.rows.length === 0) {
        return {
          success: false,
          message: '⚠️ Loyalty account not found.'
        };
      }

      const loyalty = loyaltyResult.rows[0];

      // Check if user has enough points
      if (loyalty.available_points < reward.points_required) {
        return {
          success: false,
          message: `❌ INSUFFICIENT POINTS\n\nYou need ${reward.points_required} points but only have ${loyalty.available_points} points.\n\nType MY REWARDS to see how to earn more.`
        };
      }

      // Redeem reward
      const newBalance = loyalty.available_points - reward.points_required;

      await pool.query(
        `UPDATE loyalty_points
         SET available_points = $1, updated_at = NOW()
         WHERE id = $2`,
        [newBalance, loyalty.id]
      );

      // Record transaction
      await pool.query(
        `INSERT INTO loyalty_transactions
         (user_id, type, points, balance_after, description, reference_type, reference_id)
         VALUES ($1, 'redeem', $2, $3, $4, 'reward', $5)`,
        [userId, -reward.points_required, newBalance, `Redeemed: ${reward.name}`, reward.id]
      );

      // Create redeemed reward record (expires in 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await pool.query(
        `INSERT INTO redeemed_rewards
         (user_id, reward_id, points_spent, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [userId, reward.id, reward.points_required, expiresAt]
      );

      // Decrease stock
      await pool.query(
        `UPDATE rewards_catalog SET stock_quantity = stock_quantity - 1 WHERE id = $1`,
        [reward.id]
      );

      return {
        success: true,
        message: `✅ REWARD REDEEMED!\n\n🎁 ${reward.name}\n\nPoints spent: ${reward.points_required}\nRemaining balance: ${newBalance} pts\n\nExpires: ${expiresAt.toLocaleDateString()}\n\nType MY REWARDS to view your rewards.`
      };
    } catch (error) {
      console.error('Error redeeming reward:', error);
      return {
        success: false,
        message: '⚠️ Error redeeming reward. Please try again.'
      };
    }
  }

  static async getPointsHistory(phoneNumber) {
    try {
      const userResult = await pool.query(
        `SELECT id FROM users WHERE phone = $1`,
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const userId = userResult.rows[0].id;

      const result = await pool.query(
        `SELECT type, points, description, created_at
         FROM loyalty_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      );

      if (result.rows.length === 0) {
        return `📜 POINTS HISTORY\n\nNo transactions yet.\n\nType MY REWARDS to return.`;
      }

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 POINTS HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recent Transactions:

`;

      result.rows.forEach(tx => {
        const icon = tx.type === 'earn' ? '➕' : tx.type === 'redeem' ? '➖' : '🔄';
        const sign = tx.type === 'earn' ? '+' : '-';
        const date = new Date(tx.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        message += `${icon} ${sign}${tx.points} pts - ${tx.description}\n`;
        message += `   ${date}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Type MY REWARDS to return to loyalty dashboard`;

      return message;
    } catch (error) {
      console.error('Error getting points history:', error);
      return '⚠️ Error loading history. Please try again.';
    }
  }

  static async earnPoints(userId, points, description, referenceType = null, referenceId = null) {
    try {
      const loyaltyResult = await pool.query(
        `SELECT id, total_points, available_points FROM loyalty_points WHERE user_id = $1`,
        [userId]
      );

      if (loyaltyResult.rows.length === 0) {
        return { success: false };
      }

      const loyalty = loyaltyResult.rows[0];
      const newTotal = loyalty.total_points + points;
      const newAvailable = loyalty.available_points + points;

      await pool.query(
        `UPDATE loyalty_points
         SET total_points = $1, available_points = $2, lifetime_points = lifetime_points + $3, updated_at = NOW()
         WHERE id = $4`,
        [newTotal, newAvailable, points, loyalty.id]
      );

      await pool.query(
        `INSERT INTO loyalty_transactions
         (user_id, type, points, balance_after, description, reference_type, reference_id)
         VALUES ($1, 'earn', $2, $3, $4, $5, $6)`,
        [userId, points, newAvailable, description, referenceType, referenceId]
      );

      return { success: true, newBalance: newAvailable };
    } catch (error) {
      console.error('Error earning points:', error);
      return { success: false };
    }
  }

  static getRewardIcon(rewardType) {
    const icons = {
      'discount_coupon': '🎟️',
      'free_product': '🎁',
      'cashback': '💰',
      'free_shipping': '🚚'
    };
    return icons[rewardType] || '🎁';
  }

  /**
   * ============================================
   * REFERRAL SYSTEM
   * ============================================
   */

  static async getReferralStatus(phoneNumber) {
    try {
      const userResult = await pool.query(
        `SELECT id, name FROM users WHERE phone = $1`,
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const user = userResult.rows[0];

      // Get referral info
      const referralResult = await pool.query(
        `SELECT referral_code, total_referrals, successful_referrals, total_earned
         FROM user_referrals
         WHERE user_id = $1`,
        [user.id]
      );

      if (referralResult.rows.length === 0) {
        return `⚠️ Referral account not found.`;
      }

      const referral = referralResult.rows[0];

      // Get recent referrals
      const recentReferrals = await pool.query(
        `SELECT u.name, u.phone, r.status, r.referrer_reward, r.created_at
         FROM referrals r
         JOIN users u ON r.referred_id = u.id
         WHERE r.referrer_id = $1
         ORDER BY r.created_at DESC
         LIMIT 5`,
        [user.id]
      );

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 REFERRAL PROGRAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Referral Code: ${referral.referral_code}

📊 Your Stats:
👥 Total Referrals: ${referral.total_referrals}
✅ Successful: ${referral.successful_referrals}
💰 Total Earned: $${parseFloat(referral.total_earned).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 HOW IT WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Share your referral code: ${referral.referral_code}
2. Friend signs up & makes first purchase
3. You get $10 wallet credit
4. They get $5 welcome bonus

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      if (recentReferrals.rows.length > 0) {
        message += `📋 RECENT REFERRALS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        recentReferrals.rows.forEach(ref => {
          const statusIcon = ref.status === 'rewarded' ? '✅' : ref.status === 'completed' ? '⏳' : '📝';
          message += `${statusIcon} ${ref.name || ref.phone}\n`;
          message += `   Status: ${ref.status}\n`;
          if (ref.referrer_reward > 0) {
            message += `   Earned: $${parseFloat(ref.referrer_reward).toFixed(2)}\n`;
          }
          message += `\n`;
        });
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      }

      message += `\n⚡ ACTIONS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `1️⃣ View Leaderboard\n`;
      message += `2️⃣ Share Referral Link\n`;
      message += `3️⃣ All My Referrals\n`;
      message += `4️⃣ Back to Dashboard\n\n`;
      message += `💡 Type a number (1-4) to continue`;

      return message;
    } catch (error) {
      console.error('Error getting referral status:', error);
      return '⚠️ Error loading referral info. Please try again.';
    }
  }

  static async getReferralLeaderboard() {
    try {
      const result = await pool.query(
        `SELECT u.name, u.phone, ur.successful_referrals, ur.total_earned
         FROM user_referrals ur
         JOIN users u ON ur.user_id = u.id
         WHERE ur.successful_referrals > 0
         ORDER BY ur.successful_referrals DESC, ur.total_earned DESC
         LIMIT 10`
      );

      if (result.rows.length === 0) {
        return `🏆 REFERRAL LEADERBOARD\n\nNo referrals yet. Be the first!\n\nType MY REFERRALS to return.`;
      }

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 REFERRAL LEADERBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top Referrers:

`;

      result.rows.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        message += `${medal} ${user.name || user.phone}\n`;
        message += `   ${user.successful_referrals} referrals | $${parseFloat(user.total_earned).toFixed(2)} earned\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `Type MY REFERRALS to return`;

      return message;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return '⚠️ Error loading leaderboard. Please try again.';
    }
  }

  static async processReferral(referredUserId, referralCode) {
    try {
      // Find referrer by code
      const referrerResult = await pool.query(
        `SELECT user_id FROM user_referrals WHERE referral_code = $1`,
        [referralCode.toUpperCase()]
      );

      if (referrerResult.rows.length === 0) {
        return { success: false, message: '❌ Invalid referral code.' };
      }

      const referrerId = referrerResult.rows[0].user_id;

      // Check if user is trying to refer themselves
      if (referrerId === referredUserId) {
        return { success: false, message: '❌ You cannot refer yourself.' };
      }

      // Check if user was already referred
      const existingReferral = await pool.query(
        `SELECT id FROM referrals WHERE referred_id = $1`,
        [referredUserId]
      );

      if (existingReferral.rows.length > 0) {
        return { success: false, message: '❌ You were already referred by someone else.' };
      }

      // Create referral record
      await pool.query(
        `INSERT INTO referrals (referrer_id, referred_id, referral_code, status, referred_reward)
         VALUES ($1, $2, $3, 'pending', 5.00)`,
        [referrerId, referredUserId, referralCode.toUpperCase()]
      );

      // Update referrer's total count
      await pool.query(
        `UPDATE user_referrals SET total_referrals = total_referrals + 1 WHERE user_id = $1`,
        [referrerId]
      );

      // Give referred user welcome bonus
      const Phase2Service = require('./phase2Service');
      await Phase2Service.addFunds(referredUserId, 5.00, 'Referral welcome bonus');

      return {
        success: true,
        message: `✅ REFERRAL APPLIED!\n\nYou received $5.00 welcome bonus!\n\nYour referrer will get $10 when you make your first purchase.`
      };
    } catch (error) {
      console.error('Error processing referral:', error);
      return { success: false, message: '⚠️ Error processing referral.' };
    }
  }

  static async completeReferral(orderId) {
    try {
      // Get order details
      const orderResult = await pool.query(
        `SELECT user_id FROM orders WHERE id = $1`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        return { success: false };
      }

      const userId = orderResult.rows[0].user_id;

      // Check if this is user's first order and they were referred
      const referralResult = await pool.query(
        `SELECT r.id, r.referrer_id, r.referred_id, r.status
         FROM referrals r
         WHERE r.referred_id = $1 AND r.status = 'pending'`,
        [userId]
      );

      if (referralResult.rows.length === 0) {
        return { success: false };
      }

      const referral = referralResult.rows[0];

      // Mark referral as completed and rewarded
      await pool.query(
        `UPDATE referrals
         SET status = 'rewarded', referrer_reward = 10.00, first_order_id = $1, completed_at = NOW()
         WHERE id = $2`,
        [orderId, referral.id]
      );

      // Update referrer stats
      await pool.query(
        `UPDATE user_referrals
         SET successful_referrals = successful_referrals + 1,
             total_earned = total_earned + 10.00
         WHERE user_id = $1`,
        [referral.referrer_id]
      );

      // Give referrer $10 wallet credit
      const Phase2Service = require('./phase2Service');
      await Phase2Service.addFunds(referral.referrer_id, 10.00, 'Referral reward - friend made first purchase');

      // Create notification for referrer
      await Phase2Service.createNotification(
        referral.referrer_id,
        'referral',
        'Referral Reward Earned!',
        'Your referral made their first purchase! $10.00 added to your wallet.',
        'view_wallet',
        {}
      );

      return { success: true };
    } catch (error) {
      console.error('Error completing referral:', error);
      return { success: false };
    }
  }

  /**
   * ============================================
   * PRODUCT RECOMMENDATIONS
   * ============================================
   */

  static async getRecommendations(phoneNumber) {
    try {
      const userResult = await pool.query(
        `SELECT id, name FROM users WHERE phone = $1`,
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const user = userResult.rows[0];

      // Get personalized recommendations
      const recsResult = await pool.query(
        `SELECT pr.recommendation_type, pr.reason, p.id, p.sku, p.name, p.price, p.rating
         FROM product_recommendations pr
         JOIN products p ON pr.product_id = p.id
         WHERE pr.user_id = $1
           AND (pr.expires_at IS NULL OR pr.expires_at > NOW())
           AND p.is_active = true
         ORDER BY pr.score DESC, pr.created_at DESC
         LIMIT 10`,
        [user.id]
      );

      // If no personalized recommendations, get trending products
      if (recsResult.rows.length === 0) {
        return await this.getTrendingProducts();
      }

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ RECOMMENDED FOR YOU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${user.name ? user.name + ', w' : 'W'}e think you'll love these:

`;

      recsResult.rows.forEach((rec, index) => {
        const typeIcon = rec.recommendation_type === 'personalized' ? '🎯' : '🔥';
        message += `${index + 1}. ${typeIcon} ${rec.name}\n`;
        message += `   $${parseFloat(rec.price).toFixed(2)}`;

        if (rec.rating) {
          message += ` | ⭐ ${rec.rating}`;
        }

        message += `\n   ${rec.reason || 'Based on your preferences'}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `💡 Type a number (1-${recsResult.rows.length}) to view product\n`;
      message += `Or type MENU to return`;

      return message;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return '⚠️ Error loading recommendations. Please try again.';
    }
  }

  static async getTrendingProducts() {
    try {
      // Get trending products based on recent orders (items stored as JSON in orders.items)
      // First get order items from last 30 days, then count by product
      const result = await pool.query(
        `WITH recent_order_items AS (
          SELECT
            jsonb_array_elements(items::jsonb) AS item,
            created_at
          FROM orders
          WHERE created_at > NOW() - INTERVAL '30 days'
            AND status != 'cancelled'
        ),
        product_counts AS (
          SELECT
            (item->>'productId')::INTEGER AS product_id,
            COUNT(*) AS order_count
          FROM recent_order_items
          GROUP BY (item->>'productId')::INTEGER
        )
        SELECT
          p.id, p.sku, p.name, p.price, p.rating,
          COALESCE(pc.order_count, 0) AS order_count
        FROM products p
        LEFT JOIN product_counts pc ON p.id = pc.product_id
        WHERE p.is_active = true
        ORDER BY order_count DESC, p.rating DESC NULLS LAST
        LIMIT 10`
      );

      if (result.rows.length === 0) {
        return `🔥 TRENDING PRODUCTS\n\nNo trending products at the moment.\n\nType BROWSE to view categories.`;
      }

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 TRENDING NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Most popular products this month:

`;

      result.rows.forEach((product, index) => {
        message += `${index + 1}. ${product.name}\n`;
        message += `   $${parseFloat(product.price).toFixed(2)}`;

        if (product.rating) {
          message += ` | ⭐ ${product.rating}`;
        }

        if (product.order_count > 0) {
          message += ` | ${product.order_count} sold`;
        }

        message += `\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `💡 Type a number (1-${result.rows.length}) to view product`;

      return message;
    } catch (error) {
      console.error('Error getting trending products:', error);
      return '⚠️ Error loading trending products.';
    }
  }

  static async updateUserPreferences(userId, category = null, priceMin = null, priceMax = null) {
    try {
      const prefsResult = await pool.query(
        `SELECT favorite_categories FROM user_preferences WHERE user_id = $1`,
        [userId]
      );

      let favCategories = [];
      if (prefsResult.rows.length > 0) {
        favCategories = prefsResult.rows[0].favorite_categories || [];
      }

      // Add category if provided and not already in favorites
      if (category && !favCategories.includes(category)) {
        favCategories.push(category);
        if (favCategories.length > 5) {
          favCategories.shift(); // Keep only last 5 categories
        }
      }

      await pool.query(
        `INSERT INTO user_preferences (user_id, favorite_categories, price_range_min, price_range_max, last_updated)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           favorite_categories = $2,
           price_range_min = COALESCE($3, user_preferences.price_range_min),
           price_range_max = COALESCE($4, user_preferences.price_range_max),
           last_updated = NOW()`,
        [userId, JSON.stringify(favCategories), priceMin, priceMax]
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { success: false };
    }
  }

  /**
   * ============================================
   * ORDER SCHEDULING
   * ============================================
   */

  static async getScheduledOrders(phoneNumber) {
    try {
      const userResult = await pool.query(
        `SELECT id FROM users WHERE phone = $1`,
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const userId = userResult.rows[0].id;

      const result = await pool.query(
        `SELECT id, order_type, scheduled_date, frequency, total_amount, status, executions_count
         FROM scheduled_orders
         WHERE user_id = $1 AND status IN ('active', 'paused')
         ORDER BY scheduled_date ASC`,
        [userId]
      );

      if (result.rows.length === 0) {
        return `
📅 SCHEDULED ORDERS

No scheduled orders yet.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Want to schedule future deliveries?

1️⃣ Schedule One-Time Order
2️⃣ Create Recurring Order
3️⃣ Back to Dashboard

💡 Type a number (1-3)`;
      }

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 SCHEDULED ORDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your upcoming deliveries:

`;

      result.rows.forEach((order, index) => {
        const typeIcon = order.order_type === 'recurring' ? '🔄' : '📆';
        const statusIcon = order.status === 'active' ? '✅' : '⏸️';

        message += `${index + 1}. ${typeIcon} ${order.order_type === 'recurring' ? 'Recurring' : 'One-Time'} Order\n`;
        message += `   ${statusIcon} ${order.status}\n`;
        message += `   Next: ${new Date(order.scheduled_date).toLocaleDateString()}\n`;

        if (order.frequency) {
          message += `   Frequency: ${order.frequency}\n`;
        }

        message += `   Amount: $${parseFloat(order.total_amount).toFixed(2)}\n`;

        if (order.executions_count > 0) {
          message += `   Executed: ${order.executions_count} times\n`;
        }

        message += `\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `💡 Type a number (1-${result.rows.length}) to manage order\n`;
      message += `Or type SCHEDULE ORDER to create new`;

      return message;
    } catch (error) {
      console.error('Error getting scheduled orders:', error);
      return '⚠️ Error loading scheduled orders.';
    }
  }

  static async getScheduledOrderDetails(phoneNumber, orderNumber) {
    try {
      const userResult = await pool.query(
        `SELECT id FROM users WHERE phone = $1`,
        [phoneNumber]
      );

      if (userResult.rows.length === 0) {
        return `⚠️ Account not found.`;
      }

      const userId = userResult.rows[0].id;

      const orders = await pool.query(
        `SELECT id, order_type, items, scheduled_date, frequency, next_execution,
                total_amount, status, executions_count, notes
         FROM scheduled_orders
         WHERE user_id = $1 AND status IN ('active', 'paused')
         ORDER BY scheduled_date ASC`,
        [userId]
      );

      const order = orders.rows[orderNumber - 1];

      if (!order) {
        return `❌ Scheduled order not found.`;
      }

      const items = order.items;

      let message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 SCHEDULED ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: ${order.order_type === 'recurring' ? '🔄 Recurring' : '📆 One-Time'}
Status: ${order.status === 'active' ? '✅ Active' : '⏸️ Paused'}

Next Delivery: ${new Date(order.scheduled_date).toLocaleDateString()}
${order.frequency ? 'Frequency: ' + order.frequency : ''}
${order.executions_count > 0 ? 'Times Executed: ' + order.executions_count : ''}

Total: $${parseFloat(order.total_amount).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

      items.forEach(item => {
        message += `• ${item.name} x${item.quantity}\n`;
        message += `  $${parseFloat(item.price).toFixed(2)} each\n\n`;
      });

      if (order.notes) {
        message += `\nNotes: ${order.notes}\n`;
      }

      message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ ACTIONS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (order.status === 'active') {
        message += `1️⃣ Pause Order\n`;
      } else {
        message += `1️⃣ Resume Order\n`;
      }

      message += `2️⃣ Modify Items\n`;
      message += `3️⃣ Change Date\n`;
      message += `4️⃣ Cancel Order\n`;
      message += `5️⃣ Back to Scheduled Orders\n\n`;
      message += `💡 Type a number (1-5)`;

      return message;
    } catch (error) {
      console.error('Error getting scheduled order details:', error);
      return '⚠️ Error loading order details.';
    }
  }
}

module.exports = Phase3Service;
