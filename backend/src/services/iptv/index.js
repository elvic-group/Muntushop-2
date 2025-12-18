/**
 * IPTV Service
 * IPTV subscription management
 */

const db = require('../../config/database');
const greenAPI = require('../../config/greenapi');
const templates = require('../../templates/whatsapp');
const paymentService = require('../payments');

class IPTVService {
  async handleMessage(user, message) {
    const step = user.current_step;
    const msg = message.toLowerCase().trim();
    
    if (msg === 'menu' || msg === '0') {
      return await this.showMainMenu(user);
    }
    
    switch (step) {
      case 'menu':
        return await this.handleMenuSelection(user, msg);
      case 'plan_selection':
        return await this.handlePlanSelection(user, msg);
      case 'payment':
        return await this.handlePayment(user, msg);
      default:
        return await this.showMenu(user);
    }
  }
  
  async showMenu(user) {
    await this.updateUserStep(user.id, 'menu');
    const menu = templates.iptv.menu();
    await this.sendMessage(user.phone, menu);
  }
  
  async handleMenuSelection(user, message) {
    const option = parseInt(message);
    
    if (option >= 1 && option <= 3) {
      // Show plan details
      const plan = await this.getPlan(option);
      if (!plan) {
        await this.sendMessage(user.phone, 'Plan not found. Please try again.');
        return;
      }
      
      await this.updateUserStep(user.id, 'plan_selection', { planId: plan.id });
      
      const features = plan.features || [
        'HD/4K Streaming',
        'Sports Channels',
        'VOD Library',
        'Multi-device'
      ];
      
      const message = templates.iptv.packageDetails(
        plan.name,
        plan.channels_count,
        features
      );
      
      await this.sendMessage(user.phone, message);
    } else if (option === 4) {
      // My subscription
      await this.showMySubscription(user);
    } else if (option === 5) {
      // Channel list
      await this.showChannelList(user);
    } else if (option === 6) {
      // Setup guide
      await this.showSetupGuide(user);
    }
  }
  
  async handlePlanSelection(user, message) {
    const option = parseInt(message);
    
    if (option === 1) {
      // Subscribe now
      // Parse session_data if it's a string
      let session = {};
      if (user.session_data) {
        try {
          session = typeof user.session_data === 'string' 
            ? JSON.parse(user.session_data) 
            : user.session_data;
        } catch (e) {
          session = {};
        }
      }
      const planId = session.planId;
      
      if (!planId) {
        await this.sendMessage(user.phone, 'Error: Plan not selected. Please try again.');
        return;
      }
      
      const plan = await this.getPlanById(planId);
      
      if (!plan) {
        await this.sendMessage(user.phone, 'Plan not found.');
        return;
      }
      
      // Create payment
      const paymentUrl = await paymentService.createCheckoutSession(
        user.id,
        'iptv',
        plan.price,
        { planId: plan.id }
      );
      
      await this.updateUserStep(user.id, 'payment');
      
      // Use shopping template for stripe payment (it's generic)
      const message = templates.shopping.stripePayment(paymentUrl, `IPTV-${Date.now()}`);
      await this.sendMessage(user.phone, message);
    } else if (option === 2) {
      // View channels
      await this.showChannelList(user);
    }
  }
  
  async activateSubscription(userId, planId) {
    try {
      const plan = await this.getPlanById(planId);
      if (!plan) throw new Error('Plan not found');
      
      // Generate credentials
      const username = `user_${userId}_${Date.now()}`;
      const password = this.generatePassword();
      const playlistUrl = this.generatePlaylistUrl(username);
      const serverUrl = process.env.IPTV_URL_1 || 'https://iptv.muntushop.com';
      
      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (plan.duration_days || 30));
      
      // Create subscription
      const result = await db.query(`
        INSERT INTO iptv_subscriptions (
          user_id, plan_id, username, password,
          playlist_url, server_url, status,
          price, activated_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
        RETURNING *
      `, [
        userId, planId, username, password,
        playlistUrl, serverUrl, 'active',
        plan.price, expiresAt
      ]);
      
      const subscription = result.rows[0];
      
      // Get user
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) return subscription;
      
      const user = userResult.rows[0];
      
      // Send credentials
      const message = templates.iptv.subscriptionActivated(
        username,
        password,
        playlistUrl
      );
      
      await this.sendMessage(user.phone, message);
      
      return subscription;
    } catch (error) {
      console.error('Error activating subscription:', error);
      throw error;
    }
  }
  
  async showMySubscription(user) {
    const result = await db.query(`
      SELECT s.*, p.name as plan_name, p.channels_count
      FROM iptv_subscriptions s
      JOIN iptv_plans p ON s.plan_id = p.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [user.id]);
    
    if (result.rows.length === 0) {
      await this.sendMessage(
        user.phone,
        '📺 No active IPTV subscription.\n\nType IPTV to subscribe!'
      );
      return;
    }
    
    const sub = result.rows[0];
    // Use template for subscription details
    const message = templates.iptv.subscriptionDetails(sub);
    await this.sendMessage(user.phone, message);
  }
  
  async showChannelList(user) {
    const channels = [
      '🎬 Movies & Series',
      '⚽ Sports (ESPN, FOX, Sky)',
      '📺 Entertainment (HBO, Netflix)',
      '📰 News (CNN, BBC, Al Jazeera)',
      '🎵 Music (MTV, VH1)',
      '👶 Kids (Disney, Cartoon Network)',
      '🌍 International (200+ countries)'
    ];
    
    // Use template for channel list
    const message = templates.iptv.channelList(channels);
    await this.sendMessage(user.phone, message);
  }
  
  async showSetupGuide(user) {
    // Use template for setup guide
    const message = templates.iptv.setupGuide();
    await this.sendMessage(user.phone, message);
  }
  
  // Helper methods
  async getPlan(option) {
    const planMap = {
      1: 'Basic',
      2: 'Premium',
      3: 'Ultra'
    };
    
    const planName = planMap[option];
    if (!planName) return null;
    
    const result = await db.query(
      'SELECT * FROM iptv_plans WHERE name = $1 AND is_active = true',
      [planName]
    );
    
    return result.rows[0] || null;
  }
  
  async getPlanById(planId) {
    const result = await db.query('SELECT * FROM iptv_plans WHERE id = $1', [planId]);
    return result.rows[0] || null;
  }
  
  generatePassword() {
    return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-6).toUpperCase();
  }
  
  generatePlaylistUrl(username) {
    const baseUrl = process.env.IPTV_M3U_URL || process.env.IPTV_URL_1 || 'https://iptv.muntushop.com';
    return `${baseUrl}/playlist/${username}.m3u`;
  }
  
  async updateUserStep(userId, step, sessionData = null) {
    const query = sessionData 
      ? 'UPDATE users SET current_service = $1, current_step = $2, session_data = $3 WHERE id = $4'
      : 'UPDATE users SET current_service = $1, current_step = $2 WHERE id = $3';
    
    const params = sessionData 
      ? ['iptv', step, JSON.stringify(sessionData), userId]
      : ['iptv', step, userId];
    
    await db.query(query, params);
  }
  
  async sendMessage(phone, text) {
    try {
      await greenAPI.message.sendMessage(`${phone}@c.us`, null, text);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  }
  
  async showMainMenu(user) {
    await db.query(
      'UPDATE users SET current_service = NULL, current_step = NULL WHERE id = $1',
      [user.id]
    );
    const menu = templates.main.mainMenu();
    await this.sendMessage(user.phone, menu);
  }
}

module.exports = new IPTVService();

