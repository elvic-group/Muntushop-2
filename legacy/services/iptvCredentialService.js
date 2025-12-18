// IPTV Credential Management Service
// Generates unique username/password per customer for direct VLC/IPTV app use

const crypto = require('crypto');

class IPTVCredentialService {
  constructor() {
    // In-memory storage for customer credentials (use database in production)
    this.customers = new Map();

    // Master provider credentials
    this.masterUsername = process.env.IPTV_ACCOUNT || '7PJ9SPZK';
    this.masterPassword = process.env.IPTV_PASSWORD || '3YF6FU7E';
    this.masterServer = process.env.IPTV_SERVER || 'http://mwtrqepg.leadervpn.xyz';
  }

  /**
   * Generate unique credentials for customer
   */
  generateCredentials(phoneNumber, packageTier, durationDays = 30) {
    // Generate unique username
    const timestamp = Date.now();
    const hash = crypto.createHash('md5')
      .update(`${phoneNumber}-${timestamp}`)
      .digest('hex')
      .substring(0, 8);

    const username = `customer_${hash}`;

    // Generate secure password
    const password = crypto.randomBytes(8).toString('hex');

    // Calculate expiration
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Store customer data
    const customerData = {
      username,
      password,
      phoneNumber,
      packageTier,
      channelLimit: this.getChannelLimit(packageTier),
      createdAt,
      expiresAt,
      status: 'active',
      lastUsed: null
    };

    this.customers.set(username, customerData);

    return customerData;
  }

  /**
   * Validate customer credentials
   */
  validateCredentials(username, password) {
    const customer = this.customers.get(username);

    if (!customer) {
      return { valid: false, error: 'Invalid username' };
    }

    if (customer.password !== password) {
      return { valid: false, error: 'Invalid password' };
    }

    if (customer.status !== 'active') {
      return { valid: false, error: 'Account suspended' };
    }

    if (new Date() > customer.expiresAt) {
      customer.status = 'expired';
      return { valid: false, error: 'Subscription expired' };
    }

    // Update last used
    customer.lastUsed = new Date();

    return {
      valid: true,
      customer: {
        username: customer.username,
        packageTier: customer.packageTier,
        channelLimit: customer.channelLimit,
        expiresAt: customer.expiresAt
      }
    };
  }

  /**
   * Get channel limit by tier
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
   * Get customer by phone number
   */
  getCustomerByPhone(phoneNumber) {
    for (const [username, customer] of this.customers.entries()) {
      if (customer.phoneNumber === phoneNumber && customer.status === 'active' && new Date() < customer.expiresAt) {
        return customer;
      }
    }
    return null;
  }

  /**
   * Get customer by username
   */
  getCustomer(username) {
    return this.customers.get(username);
  }

  /**
   * Suspend customer account
   */
  suspendAccount(username) {
    const customer = this.customers.get(username);
    if (customer) {
      customer.status = 'suspended';
      return true;
    }
    return false;
  }

  /**
   * Reactivate customer account
   */
  reactivateAccount(username) {
    const customer = this.customers.get(username);
    if (customer) {
      customer.status = 'active';
      return true;
    }
    return false;
  }

  /**
   * Extend subscription
   */
  extendSubscription(username, additionalDays) {
    const customer = this.customers.get(username);
    if (customer) {
      const currentExpiry = customer.expiresAt;
      const newExpiry = new Date(currentExpiry.getTime() + additionalDays * 24 * 60 * 60 * 1000);
      customer.expiresAt = newExpiry;
      customer.status = 'active';
      return { success: true, newExpiresAt: newExpiry };
    }
    return { success: false, error: 'Customer not found' };
  }

  /**
   * Get all active customers
   */
  getActiveCustomers() {
    const active = [];
    const now = new Date();

    for (const [username, customer] of this.customers.entries()) {
      if (customer.status === 'active' && now < customer.expiresAt) {
        active.push({
          username: customer.username,
          phoneNumber: customer.phoneNumber,
          packageTier: customer.packageTier,
          channelLimit: customer.channelLimit,
          expiresAt: customer.expiresAt,
          daysRemaining: Math.ceil((customer.expiresAt - now) / (1000 * 60 * 60 * 24))
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
    let cleaned = 0;

    for (const [username, customer] of this.customers.entries()) {
      if (now > customer.expiresAt && customer.status !== 'expired') {
        customer.status = 'expired';
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Generate WhatsApp message with credentials
   */
  generateCredentialsMessage(customerData) {
    const baseUrl = process.env.FRONTEND_URL || 'https://muntushop-production-f2ffb28d626e.herokuapp.com';
    const daysRemaining = Math.ceil((customerData.expiresAt - new Date()) / (1000 * 60 * 60 * 24));

    return `
╔════════════════════════════════╗
║   📺 IPTV ACCESS ACTIVATED     ║
╚════════════════════════════════╝

🎉 Your ${customerData.packageTier} Package is Ready!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Server: ${baseUrl}/iptv
Username: ${customerData.username}
Password: ${customerData.password}

⚠️ SAVE THESE - They're unique to you!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 YOUR SUBSCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Package: ${customerData.packageTier}
Channels: ${customerData.channelLimit}+ channels
Valid Until: ${customerData.expiresAt.toLocaleDateString()}
Days Remaining: ${daysRemaining} days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 SETUP INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 1: IPTV Smarters Pro ⭐ Recommended

1. Download IPTV Smarters Pro:
   📱 Android: Play Store
   🍎 iOS: App Store
   📺 Smart TV: App Store

2. Open app → "Login with Xtream Codes"

3. Enter YOUR credentials:
   Server: ${baseUrl}/iptv
   Username: ${customerData.username}
   Password: ${customerData.password}

4. Click "Add User" → Enjoy!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 2: VLC Media Player

1. Open VLC → Media → Open Network Stream

2. Paste this M3U URL:
   ${baseUrl}/iptv/live/${customerData.username}/${customerData.password}/playlist.m3u

3. Click Play → Browse channels!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 3: GSE Smart IPTV

1. Download GSE Smart IPTV
2. Add → Xtream Codes
3. Enter credentials above
4. Load channels → Watch!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 TIPS:
• Works on Phone, TV, Computer, Tablet
• Save credentials in safe place
• Don't share with others
• Renew before expiration

📺 ${customerData.channelLimit}+ channels ready
⚡ Start watching immediately
🔄 Auto-renewal available

Need help? Reply HELP
Questions? Reply SUPPORT

Type MENU for main menu
`;
  }

  /**
   * Get customer statistics
   */
  getStatistics() {
    const now = new Date();
    let active = 0;
    let expired = 0;
    let suspended = 0;
    const tierCounts = { Basic: 0, Standard: 0, Premium: 0 };

    for (const [username, customer] of this.customers.entries()) {
      if (customer.status === 'active' && now < customer.expiresAt) {
        active++;
        tierCounts[customer.packageTier] = (tierCounts[customer.packageTier] || 0) + 1;
      } else if (customer.status === 'suspended') {
        suspended++;
      } else if (now > customer.expiresAt) {
        expired++;
      }
    }

    return {
      total: this.customers.size,
      active,
      expired,
      suspended,
      byTier: tierCounts
    };
  }
}

module.exports = new IPTVCredentialService();
