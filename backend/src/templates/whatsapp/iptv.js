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

exports.packageDetails = (planName, channelsCount, features) => `
📺 ${planName} Package

📺 Channels: ${channelsCount}+
💎 Quality: HD/4K
🎬 VOD: Available
📱 Multi-device: Yes

✨ Features:
${features.map(f => `• ${f}`).join('\n')}

1️⃣  Subscribe Now - $${planName === 'Basic' ? '5' : planName === 'Premium' ? '10' : '15'}/month
2️⃣  View Channels
3️⃣  Compare Plans
0️⃣  Back

Reply with number
`;

exports.subscriptionActivated = (username, password, playlistUrl) => `
✅ IPTV SUBSCRIPTION ACTIVATED!

Your credentials:
━━━━━━━━━━━━━━━━━━
Username: ${username}
Password: ${password}
━━━━━━━━━━━━━━━━━━

📺 Playlist URL:
${playlistUrl}

📱 Setup Instructions:
1. Download IPTV Smarters Pro
2. Enter playlist URL
3. Enter username & password
4. Enjoy! 🎉

Type SETUP for detailed guide

Reply MENU to continue
`;

