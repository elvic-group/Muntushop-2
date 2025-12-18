// IPTV Playlist Generation Service
// Generates custom M3U playlists per user based on subscription tier

const crypto = require('crypto');

class IPTVPlaylistService {
  constructor() {
    // In-memory storage for user subscriptions (in production, use database)
    this.subscriptions = new Map();

    // Master credentials from .env
    this.masterUsername = process.env.IPTV_ACCOUNT || '7PJ9SPZK';
    this.masterPassword = process.env.IPTV_PASSWORD || '3YF6FU7E';
    this.masterM3U = process.env.IPTV_M3U_URL ||
      `http://mwtrqepg.leadervpn.xyz/get.php?username=${this.masterUsername}&password=${this.masterPassword}&type=m3u_plus&output=mpegts`;
  }

  /**
   * Generate secure token for user's playlist
   */
  generateToken(phoneNumber, packageTier) {
    const data = `${phoneNumber}-${packageTier}-${Date.now()}`;
    const token = crypto.createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 32);

    // Store subscription data
    this.subscriptions.set(token, {
      phoneNumber,
      packageTier,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    return token;
  }

  /**
   * Validate token and get subscription details
   */
  validateToken(token) {
    const subscription = this.subscriptions.get(token);

    if (!subscription) {
      throw new Error('Invalid token');
    }

    if (new Date() > subscription.expiresAt) {
      this.subscriptions.delete(token);
      throw new Error('Subscription expired');
    }

    return subscription;
  }

  /**
   * Generate custom playlist URL for user
   */
  generatePlaylistUrl(phoneNumber, packageTier) {
    const token = this.generateToken(phoneNumber, packageTier);
    const baseUrl = process.env.FRONTEND_URL || 'https://muntushop-production-f2ffb28d626e.herokuapp.com';
    return `${baseUrl}/iptv/playlist/${token}.m3u`;
  }

  /**
   * Get channel count based on tier
   */
  getChannelLimit(tier) {
    const limits = {
      'Basic': 500,
      'Standard': 800,
      'Premium': 1200
    };
    return limits[tier] || 1200;
  }

  /**
   * Generate M3U playlist content
   */
  async generatePlaylist(token) {
    try {
      const subscription = this.validateToken(token);
      const channelLimit = this.getChannelLimit(subscription.packageTier);

      // Build M3U playlist
      let playlist = '#EXTM3U\n';
      playlist += `#EXTINF:-1,MuntuShop IPTV - ${subscription.packageTier} Package\n`;
      playlist += `#EXTINF:-1,${channelLimit} Channels Available\n`;
      playlist += '\n';

      // Add sample channels (in production, fetch from master playlist)
      playlist += this.generateSampleChannels(channelLimit);

      // Add master M3U URL for actual streaming
      // This delegates actual streaming to the provider
      playlist += `\n# Master Stream (Powered by ${this.masterUsername})\n`;
      playlist += `#EXTINF:-1,All Channels via Provider\n`;
      playlist += `${this.masterM3U}\n`;

      return playlist;
    } catch (error) {
      console.error('Error generating playlist:', error);
      throw error;
    }
  }

  /**
   * Generate sample channel list for M3U
   */
  generateSampleChannels(limit) {
    const categories = [
      { name: 'Sports', channels: ['Sky Sports', 'ESPN', 'Fox Sports', 'BeIN Sports', 'NBC Sports'] },
      { name: 'Movies', channels: ['HBO', 'Showtime', 'Starz', 'Cinemax', 'TNT'] },
      { name: 'News', channels: ['CNN', 'BBC News', 'Fox News', 'MSNBC', 'Al Jazeera'] },
      { name: 'Entertainment', channels: ['MTV', 'E!', 'Comedy Central', 'TBS', 'FX'] },
      { name: 'Kids', channels: ['Disney', 'Nickelodeon', 'Cartoon Network', 'Nick Jr', 'PBS Kids'] },
      { name: 'International', channels: ['TV5 Monde', 'RAI', 'ARD', 'NHK', 'CCTV'] }
    ];

    let playlist = '';
    let channelCount = 0;

    // Generate channels up to the limit
    while (channelCount < limit) {
      for (const category of categories) {
        if (channelCount >= limit) break;

        for (const channel of category.channels) {
          if (channelCount >= limit) break;

          const channelNumber = channelCount + 1;
          playlist += `#EXTINF:-1 tvg-id="${channelNumber}" tvg-name="${channel}" tvg-logo="" group-title="${category.name}",${channel}\n`;
          playlist += `# Channel ${channelNumber}: ${channel} (${category.name})\n`;

          channelCount++;
        }
      }
    }

    return playlist;
  }

  /**
   * Get subscription info by token
   */
  getSubscriptionInfo(token) {
    try {
      const subscription = this.validateToken(token);
      return {
        packageTier: subscription.packageTier,
        channelCount: this.getChannelLimit(subscription.packageTier),
        expiresAt: subscription.expiresAt,
        daysRemaining: Math.ceil((subscription.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user's active subscription by phone number
   */
  getUserSubscription(phoneNumber) {
    for (const [token, subscription] of this.subscriptions.entries()) {
      if (subscription.phoneNumber === phoneNumber && new Date() < subscription.expiresAt) {
        return {
          token,
          ...subscription,
          playlistUrl: this.generatePlaylistUrlFromToken(token),
          channelCount: this.getChannelLimit(subscription.packageTier)
        };
      }
    }
    return null;
  }

  /**
   * Generate playlist URL from existing token
   */
  generatePlaylistUrlFromToken(token) {
    const baseUrl = process.env.FRONTEND_URL || 'https://muntushop-production-f2ffb28d626e.herokuapp.com';
    return `${baseUrl}/iptv/playlist/${token}.m3u`;
  }

  /**
   * Get all active subscriptions (for admin)
   */
  getAllSubscriptions() {
    const active = [];
    for (const [token, subscription] of this.subscriptions.entries()) {
      if (new Date() < subscription.expiresAt) {
        active.push({
          token,
          ...subscription,
          channelCount: this.getChannelLimit(subscription.packageTier)
        });
      }
    }
    return active;
  }

  /**
   * Clean up expired subscriptions
   */
  cleanupExpired() {
    const now = new Date();
    for (const [token, subscription] of this.subscriptions.entries()) {
      if (now > subscription.expiresAt) {
        this.subscriptions.delete(token);
      }
    }
  }
}

module.exports = new IPTVPlaylistService();
