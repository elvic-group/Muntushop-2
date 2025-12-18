// All Services Templates
const shopping = require('./shopping');

// Messaging Service
const messaging = {
  menu: () => `
📢 BULK MESSAGING SERVICE

Professional WhatsApp messaging for your business

Packages (All $1/month):

1️⃣  Starter - 1,000 messages
2️⃣  Business - 5,000 messages
3️⃣  Enterprise - 20,000 messages

4️⃣  Send Campaign
5️⃣  View Analytics
6️⃣  Upload Contacts
7️⃣  Message History
0️⃣  Main Menu

Reply with number
`,

  subscribe: (plan) => `
📢 BULK MESSAGING - ${plan}

Features:
• ${plan === 'Starter' ? '1,000' : plan === 'Business' ? '5,000' : '20,000'} messages/month
• Message scheduling
• Contact management
• Analytics dashboard
• API access
• Email support

💰 Price: $1.00/month

1️⃣  Subscribe Now
2️⃣  View Demo
3️⃣  Compare Plans
0️⃣  Back

Reply with number
`
};

// Customer Support
const support = {
  menu: () => `
💬 CUSTOMER SUPPORT SERVICE

Provide 24/7 support for your customers

Plans (All $1/month):

1️⃣  Basic - 10 tickets/month
2️⃣  Standard - 50 tickets/month
3️⃣  Premium - Unlimited

4️⃣  Create Ticket
5️⃣  View Open Tickets
6️⃣  Ticket History
0️⃣  Main Menu

Reply with number
`,

  createTicket: () => `
🎫 CREATE SUPPORT TICKET

What do you need help with?

Categories:

1️⃣  Technical Issue
2️⃣  Billing Question
3️⃣  Product Inquiry
4️⃣  Feature Request
5️⃣  Other

Reply with number
`
};

// Appointments
const appointments = {
  menu: () => `
📅 APPOINTMENT BOOKING

Book appointments instantly!

Services ($1 each):

1️⃣  Doctor Consultation
2️⃣  Salon/Barbershop
3️⃣  Dental Checkup
4️⃣  Fitness Training
5️⃣  Car Service
6️⃣  Legal Consultation

7️⃣  My Appointments
8️⃣  Reschedule
0️⃣  Main Menu

Reply with number
`,

  selectService: (serviceName) => `
📅 BOOK ${serviceName.toUpperCase()}

Select preferred date:

Available this week:

1️⃣  Monday, Dec 16
2️⃣  Tuesday, Dec 17
3️⃣  Wednesday, Dec 18
4️⃣  Thursday, Dec 19
5️⃣  Friday, Dec 20

6️⃣  Next Week
0️⃣  Back

Reply with number
`
};

// Group Management
const groups = {
  menu: () => `
👥 GROUP MANAGEMENT

Automate your WhatsApp groups!

Services ($1/group/month):

1️⃣  Auto Welcome Messages
2️⃣  Member Moderation
3️⃣  Scheduled Announcements
4️⃣  Payment Collection
5️⃣  Analytics & Reports

6️⃣  Add New Group
7️⃣  My Groups
0️⃣  Main Menu

Reply with number
`,

  addGroup: () => `
➕ ADD GROUP

To manage a group:

1. Add this number to your WhatsApp group
2. Make this number an admin
3. Send group link here

Or reply with group invite link:

Example:
https://chat.whatsapp.com/xxxxx

We'll set up automation in 5 minutes!
`
};

// Money Assistant
const money = {
  menu: () => `
💰 MONEY ASSISTANT

Track your mobile money transactions!

Features ($1/month):

1️⃣  Track Transactions
2️⃣  Monthly Reports
3️⃣  Budget Alerts
4️⃣  Receipt Storage
5️⃣  Export to Excel

6️⃣  Add Transaction
7️⃣  View Balance
8️⃣  This Month's Report
0️⃣  Main Menu

Reply with number
`,

  addTransaction: () => `
💵 ADD TRANSACTION

Forward your M-Pesa/Mobile Money SMS here

Or manually enter:

Format:
Type: Sent/Received
Amount: 1000
To/From: John Doe
Date: Dec 15

Example:
Sent
500
Peter
Today

Type transaction details:
`
};

// Online Courses
const courses = {
  menu: () => `
📚 ONLINE COURSES

Learn new skills! All courses $1

Categories:

1️⃣  Programming
2️⃣  Business
3️⃣  Languages
4️⃣  Design
5️⃣  Marketing

6️⃣  My Courses
7️⃣  Continue Learning
8️⃣  Certificates
0️⃣  Main Menu

Reply with number
`,

  courseList: (category) => `
📚 ${category.toUpperCase()} COURSES

$1 each:

1. Introduction to Python
   ⏱️ 4 weeks | ⭐ 4.8/5

2. Web Development Basics
   ⏱️ 6 weeks | ⭐ 4.9/5

3. JavaScript for Beginners
   ⏱️ 5 weeks | ⭐ 4.7/5

Reply with number for details
`
};

// News & Updates
const news = {
  menu: () => `
📰 NEWS & UPDATES

Stay informed!

Subscriptions:

1️⃣  Basic (3 updates/day) - $1/month
2️⃣  Premium (Unlimited) - $1/month

Topics:

3️⃣  Local News
4️⃣  Business
5️⃣  Sports
6️⃣  Entertainment
7️⃣  Technology

8️⃣  My Subscription
0️⃣  Main Menu

Reply with number
`,

  subscribe: (plan) => `
📰 ${plan.toUpperCase()} SUBSCRIPTION

${plan === 'Basic' ? '• 3 news updates/day\n• Breaking news alerts\n• Top stories' : '• Unlimited updates\n• All topics\n• Custom alerts\n• No ads'}

💰 Price: $1.00/month

1️⃣  Subscribe Now
2️⃣  Select Topics
0️⃣  Back

Reply with number
`
};

// Marketing Services
const marketing = {
  menu: () => `
📊 MARKETING SERVICES

Grow your business!

Packages ($1/month):

1️⃣  Startup - 2 campaigns
2️⃣  Growth - 8 campaigns
3️⃣  Enterprise - Unlimited

Services:

4️⃣  Create Campaign
5️⃣  View Analytics
6️⃣  Client Management
7️⃣  Reports
0️⃣  Main Menu

Reply with number
`,

  createCampaign: () => `
📊 NEW MARKETING CAMPAIGN

Campaign Setup:

1. Campaign Name
2. Target Audience
3. Message
4. Schedule

Example:
---
Name: Summer Sale
Audience: All customers
Message: 50% off this weekend!
Schedule: Friday 9 AM
---

Type your campaign details:
`
};

// B2B Wholesale
const b2b = {
  menu: () => `
🏪 B2B WHOLESALE ORDERS

Quick ordering for businesses!

Subscription: $1/month

Features:

1️⃣  Browse Catalog
2️⃣  Place Order
3️⃣  Order History
4️⃣  Invoices
5️⃣  Payment Status
6️⃣  Delivery Schedule

0️⃣  Main Menu

Reply with number
`,

  catalog: () => `
📋 WHOLESALE CATALOG

All prices are per unit:

1. Coca-Cola 500ml (Case of 24)
   $1.00/case

2. Bread (50 loaves)
   $1.00/bundle

3. Rice (50kg bag)
   $1.00/bag

4. Cooking Oil (20L)
   $1.00/container

Reply number to order
`
};

// IPTV Subscriptions
const iptv = {
  menu: () => `
📺 IPTV SUBSCRIPTIONS

Watch 1000+ channels!

All Packages: $1/month

1️⃣  Basic - 500 channels
2️⃣  Standard - 800 channels
3️⃣  Premium - 1200+ channels

Features:
✅ HD/4K Quality
✅ Sports channels
✅ Movies & Series
✅ Live TV
✅ VOD Library

4️⃣  My Subscription
5️⃣  Channel List
6️⃣  Setup Guide
0️⃣  Main Menu

Reply with number
`,

  packageDetails: (packageName) => `
📺 IPTV ${packageName.toUpperCase()}

Channels: ${packageName === 'Basic' ? '500' : packageName === 'Standard' ? '800' : '1200'}+

Includes:
✅ All sports channels
✅ Premium movies
✅ International channels
✅ Kids content
✅ News & documentaries

Compatible with:
📱 Mobile
📺 Smart TV
💻 Computer
🎮 Android Box

💰 Price: $1/month

1️⃣  Subscribe Now
2️⃣  View Channels
3️⃣  Free Trial
0️⃣  Back

Reply with number
`
};

module.exports = {
  shopping,
  messaging,
  support,
  appointments,
  groups,
  money,
  courses,
  news,
  marketing,
  b2b,
  iptv
};
