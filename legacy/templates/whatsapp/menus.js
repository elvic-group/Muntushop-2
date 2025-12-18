// Main Menu Templates
exports.mainMenu = () => `
👋 Welcome to MuntuShop Platform!

🌟 All Services - Only $1 Each!

Choose a service:

1️⃣  🛍️  Shopping Store
2️⃣  📢  Bulk Messaging
3️⃣  💬  Customer Support
4️⃣  📅  Appointment Booking
5️⃣  👥  Group Management
6️⃣  💰  Money Assistant
7️⃣  📚  Online Courses
8️⃣  📰  News & Updates
9️⃣  📊  Marketing Services
🔟  🏪  B2B Wholesale
1️⃣1️⃣ 📺  IPTV Subscriptions

Reply with number (1-11)

💡 Type MENU anytime to return here
💡 Type HELP for assistance
`;

exports.helpMessage = () => `
❓ HELP & SUPPORT

Quick Commands:
• MENU - Main menu
• CART - View shopping cart
• ORDERS - View your orders
• ACCOUNT - Your account info
• BALANCE - Check balance
• CANCEL - Cancel current action

Need assistance?
📞 Call: +47 96701573
📧 Email: support@muntushop.com
💬 Live chat: Type SUPPORT

Business Hours:
Mon-Fri: 9AM - 6PM
Sat: 10AM - 4PM
Sun: Closed

We're here to help! 💚
`;

exports.welcomeMessage = (name) => `
👋 Welcome to MuntuShop Platform${name ? `, ${name}` : ''}!

We're excited to have you here! 💚

🌟 Special Welcome Offer:
Get any service for just $1!

What we offer:
• Shopping Store 🛍️
• Business Services 📊
• Entertainment (IPTV) 📺
• And much more!

Type MENU to explore all services

Need help? Reply HELP anytime
`;

exports.serviceNotImplemented = (serviceName) => `
🚧 ${serviceName} Coming Soon!

This service is currently under development.

We're working hard to bring you the best experience!

⏰ Estimated launch: Soon
📧 Get notified: Reply NOTIFY

Type MENU to see available services
`;
