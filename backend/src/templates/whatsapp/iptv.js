/**
 * WhatsApp Templates - IPTV Service
 */

exports.menu = () => `
📺 IPTV SUBSCRIPTIONS

Choose your plan:

1️⃣  Basic - $5/month
   • 500+ Channels
   • HD Quality
   • VOD Library
   
2️⃣  Premium - $10/month
   • 1200+ Channels
   • HD/4K Quality
   • Premium Sports
   • VOD Library
   
3️⃣  Ultra - $15/month
   • 2000+ Channels
   • 4K Quality
   • All Sports
   • Premium VOD
   • Multi-device

4️⃣  📺 My Subscription
5️⃣  📋 Channel List
6️⃣  📖 Setup Guide
0️⃣  Main Menu

Reply with number
`;

exports.packageDetails = (planName, channelsCount, features) => {
  if (!planName) {
    return 'Error: Plan information not available.';
  }
  
  const plan = planName || 'Plan';
  const channels = channelsCount || 0;
  const featureList = Array.isArray(features) && features.length > 0 
    ? features.map(f => `• ${f}`).join('\n')
    : '• HD/4K Streaming\n• Sports Channels\n• VOD Library\n• Multi-device';
  
  // Determine price based on plan name
  let price = '15';
  if (plan === 'Basic') price = '5';
  else if (plan === 'Premium') price = '10';
  
  return `
📺 ${plan} Package

📺 Channels: ${channels}+
💎 Quality: HD/4K
🎬 VOD: Available
📱 Multi-device: Yes

✨ Features:
${featureList}

1️⃣  Subscribe Now - $${price}/month
2️⃣  View Channels
3️⃣  Compare Plans
0️⃣  Back

Reply with number
`;
};

exports.subscriptionActivated = (username, password, playlistUrl) => {
  if (!username || !password) {
    return 'Error: Subscription credentials not available. Please contact support.';
  }
  
  const user = username || 'N/A';
  const pass = password || 'N/A';
  const url = playlistUrl || 'Not available';
  
  return `
✅ IPTV SUBSCRIPTION ACTIVATED!

Your credentials:
━━━━━━━━━━━━━━━━━━
Username: ${user}
Password: ${pass}
━━━━━━━━━━━━━━━━━━

📺 Playlist URL:
${url}

📱 Setup Instructions:
1. Download IPTV Smarters Pro
2. Enter playlist URL
3. Enter username & password
4. Enjoy! 🎉

Type SETUP for detailed guide

Reply MENU to continue
`;
};

exports.subscriptionDetails = (subscription) => {
  if (!subscription) {
    return '📺 No active IPTV subscription.\n\nType IPTV to subscribe!';
  }
  
  const planName = subscription.plan_name || 'Plan';
  const channels = subscription.channels_count || 0;
  const status = subscription.status || 'Unknown';
  const username = subscription.username || 'N/A';
  const password = subscription.password || 'N/A';
  const playlistUrl = subscription.playlist_url || 'Not available';
  
  const expiresAt = subscription.expires_at 
    ? new Date(subscription.expires_at)
    : null;
  const daysLeft = expiresAt 
    ? Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const statusEmoji = status === 'active' ? '✅' : '⏳';
  
  return `
📺 YOUR IPTV SUBSCRIPTION

Plan: ${planName}
Channels: ${channels}+
Status: ${statusEmoji} ${status}
Expires in: ${daysLeft} days

━━━━━━━━━━━━━━━━━━
Credentials:
Username: ${username}
Password: ${password}
━━━━━━━━━━━━━━━━━━

Playlist: ${playlistUrl}

1️⃣ Renew Now
2️⃣ Setup Guide
3️⃣ Channel List
0️⃣ Main Menu
`;
};

exports.channelList = (categories) => {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return '📺 Channel information will be available after subscription.\n\nType IPTV to subscribe!';
  }
  
  const categoriesList = categories.join('\n');
  
  return `
📺 CHANNEL CATEGORIES

${categoriesList}

1200+ channels available!

Type IPTV to subscribe!
Type MENU to return
`;
};

exports.setupGuide = () => {
  return `
📖 IPTV SETUP GUIDE

Android/iOS:
1. Download "IPTV Smarters Pro"
2. Enter playlist URL
3. Enter username & password
4. Enjoy! 🎉

Smart TV:
1. Install IPTV Player
2. Enter playlist URL
3. Login
4. Watch! 📺

Windows/Mac:
1. Download VLC Media Player
2. Open Network Stream
3. Enter playlist URL
4. Start watching! 🎬

Need help? Type SUPPORT
Type MENU to return
`;
};

