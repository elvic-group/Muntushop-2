# 📱 Complete WhatsApp Message Flow & Templates

**All Message Templates for 11 Services**

Complete conversation flows, menus, and templates for Green API integration.

---

## Table of Contents

1. [Main Menu](#main-menu)
2. [Service 1: Shopping Store](#service-1-shopping-store)
3. [Service 2: Bulk Messaging](#service-2-bulk-messaging)
4. [Service 3: Customer Support](#service-3-customer-support)
5. [Service 4: Appointments](#service-4-appointments)
6. [Service 5: Group Management](#service-5-group-management)
7. [Service 6: Money Assistant](#service-6-money-assistant)
8. [Service 7: Online Courses](#service-7-online-courses)
9. [Service 8: News & Updates](#service-8-news--updates)
10. [Service 9: Marketing](#service-9-marketing)
11. [Service 10: B2B Orders](#service-10-b2b-orders)
12. [Service 11: IPTV](#service-11-iptv)
13. [Payment Templates](#payment-templates)
14. [Notification Templates](#notification-templates)

---

## Main Menu

### **Welcome Message:**

```javascript
// templates/whatsapp/menus.js

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
📞 Call: +123-456-7890
📧 Email: support@muntushop.com
💬 Live chat: Type SUPPORT

Business Hours:
Mon-Fri: 9AM - 6PM
Sat: 10AM - 4PM
Sun: Closed

We're here to help! 💚
`;
```

---

## Service 1: Shopping Store

### **Shopping Main Menu:**

```javascript
exports.shopping = {
  menu: () => `
🛍️  SHOPPING STORE

All Products: $1.00 each! 🎉

Browse by category:

1️⃣  📱  Phone Accessories
2️⃣  👗  Fashion & Clothing
3️⃣  💻  Electronics
4️⃣  🏠  Home & Living
5️⃣  🎮  Games & Toys
6️⃣  🛒  View Cart
7️⃣  📦  My Orders
8️⃣  🔍  Search Products
0️⃣  ⬅️  Main Menu

Reply with number
`,

  phoneAccessories: () => `
📱 PHONE ACCESSORIES

All $1.00 each:

1. Phone Case - Premium
   ⭐ 4.8/5 (234 reviews)
   
2. Screen Protector - Tempered Glass
   ⭐ 4.9/5 (189 reviews)
   
3. Charging Cable - Fast Charge
   ⭐ 4.7/5 (156 reviews)
   
4. Pop Socket - Multiple Designs
   ⭐ 4.6/5 (98 reviews)
   
5. Phone Holder - Car Mount
   ⭐ 4.8/5 (145 reviews)

6️⃣  View More
0️⃣  Back

Reply with number for details
`,

  productDetail: (product) => `
${product.name}

💰 Price: $${product.price}
⭐ Rating: ${product.rating}/5 (${product.reviews_count} reviews)
📦 Stock: ${product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
🚚 Shipping: FREE

✨ ${product.description}

${product.features ? `Features:\n${product.features.map(f => `• ${f}`).join('\n')}` : ''}

${product.colors ? `\nColors: ${product.colors.join(', ')}` : ''}

1️⃣  Add to Cart
2️⃣  View Reviews
3️⃣  Ask Question
0️⃣  Back to Products

Reply with number
`,

  addedToCart: (product, cartTotal) => `
✅ Added to cart!

${product.name} - $${product.price}

🛒 Cart Total: $${cartTotal}

1️⃣  Checkout Now
2️⃣  Continue Shopping
3️⃣  View Full Cart
4️⃣  Remove from Cart

Reply with number
`,

  cart: (items, total) => `
🛒 YOUR SHOPPING CART

${items.map((item, i) => `${i+1}. ${item.name}\n   $${item.price} × ${item.quantity} = $${item.subtotal}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━
💰 Total: $${total}
━━━━━━━━━━━━━━━━━━

1️⃣  Proceed to Checkout
2️⃣  Update Quantities
3️⃣  Remove Items
4️⃣  Continue Shopping
5️⃣  Clear Cart

Reply with number
`,

  checkout: (total) => `
💳 CHECKOUT

Order Summary:
━━━━━━━━━━━━━━━━━━
Subtotal: $${total}
Shipping: FREE
━━━━━━━━━━━━━━━━━━
💰 Total: $${total}

📍 Shipping Address:
Please provide your delivery address:

Example:
John Doe
123 Main Street
Nairobi, Kenya
+254712345678

Type your full address or reply EDIT to change
`,

  paymentOptions: (total) => `
💳 PAYMENT METHOD

Total: $${total}

Choose payment:

1️⃣  💳  Credit/Debit Card (Stripe)
2️⃣  📱  M-Pesa
3️⃣  🏦  Bank Transfer
4️⃣  💵  Cash on Delivery

Reply with number

Recommended: Card payment is instant! ✅
`,

  stripePayment: (paymentUrl, orderId) => `
💳 SECURE CARD PAYMENT

Order #${orderId}

Click here to pay securely:
${paymentUrl}

✅ Powered by Stripe
🔒 Your payment info is protected
⚡ Instant confirmation

After payment:
• You'll receive confirmation
• We'll send tracking info
• Delivery in 5-7 days

Having issues? Reply HELP
`,

  orderConfirmed: (orderNumber, total) => `
🎉 ORDER CONFIRMED!

Order #${orderNumber}
Total: $${total}

✅ Payment received
📦 Processing your order
🚚 Estimated delivery: 5-7 days

You'll receive:
• Order confirmation email
• Tracking number (24-48hrs)
• Delivery updates

Track your order:
Reply TRACK ${orderNumber}

Thank you for shopping! 💚

Type MENU for main menu
`,

  orderTracking: (orderNumber, status, trackingUrl) => `
📦 ORDER TRACKING

Order #${orderNumber}
Status: ${status}

${status === 'processing' ? '⏳ Preparing your order...' : ''}
${status === 'shipped' ? '🚚 On the way to you!' : ''}
${status === 'delivered' ? '✅ Delivered!' : ''}

${trackingUrl ? `Track here: ${trackingUrl}` : 'Tracking number will be available soon'}

Estimated delivery: 5-7 days

Questions? Reply HELP

Type MENU for main menu
`
};
```

---

## Service 2: Bulk Messaging

```javascript
exports.messaging = {
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
8️⃣  My Subscription
0️⃣  Main Menu

Reply with number
`,

  subscribe: (plan) => `
📢 BULK MESSAGING - ${plan}

Features:
${plan === 'Starter' ? '• 1,000 messages/month' : ''}
${plan === 'Business' ? '• 5,000 messages/month' : ''}
${plan === 'Enterprise' ? '• 20,000 messages/month' : ''}
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
`,

  createCampaign: () => `
📤 CREATE CAMPAIGN

Step 1/3: Campaign Details

Please provide:

1. Campaign Name
2. Message Text
3. Target Audience

Example:
---
Name: Black Friday Sale
Message: 🎉 50% OFF everything! Shop now at example.com
Audience: All Customers
---

Type your campaign details:
`,

  campaignCreated: (campaignName, recipientCount) => `
✅ CAMPAIGN CREATED!

Campaign: ${campaignName}
Recipients: ${recipientCount}

Schedule Options:

1️⃣  Send Now
2️⃣  Schedule for Later
3️⃣  Preview Message
4️⃣  Edit Campaign
5️⃣  Cancel

Reply with number
`,

  analytics: (sent, delivered, read, clicked) => `
📊 CAMPAIGN ANALYTICS

This Month:
━━━━━━━━━━━━━━━━━━
📤 Sent: ${sent}
✅ Delivered: ${delivered}
👁️ Read: ${read}
🔗 Clicked: ${clicked}

Delivery Rate: ${((delivered/sent) * 100).toFixed(1)}%
Read Rate: ${((read/delivered) * 100).toFixed(1)}%

1️⃣  Detailed Report
2️⃣  Export Data
3️⃣  View Campaigns
0️⃣  Back

Reply with number
`
};
```

---

## Service 3: Customer Support

```javascript
exports.support = {
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
7️⃣  Support Stats
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
`,

  ticketCreated: (ticketNumber) => `
✅ TICKET CREATED

Ticket #${ticketNumber}

Your request has been received!

⏱️ Average response time: 2 hours

We'll reply to this number or email you.

1️⃣  Add More Details
2️⃣  Upload Screenshot
3️⃣  View Ticket Status
0️⃣  Main Menu

Reply with number
`,

  ticketUpdate: (ticketNumber, status, message) => `
🔔 TICKET UPDATE

Ticket #${ticketNumber}
Status: ${status}

Agent Response:
━━━━━━━━━━━━━━━━━━
${message}
━━━━━━━━━━━━━━━━━━

1️⃣  Reply to Agent
2️⃣  Mark as Resolved
3️⃣  Request Call
0️⃣  Main Menu

Reply with number
`
};
```

---

## Service 4: Appointments

```javascript
exports.appointments = {
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
9️⃣  Cancel Appointment
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
7️⃣  Custom Date

Reply with number
`,

  selectTime: (date) => `
⏰ SELECT TIME

Date: ${date}

Available slots:

1️⃣  9:00 AM
2️⃣  10:00 AM
3️⃣  11:00 AM
4️⃣  2:00 PM
5️⃣  3:00 PM
6️⃣  4:00 PM

Reply with number
`,

  confirmBooking: (service, date, time) => `
📅 CONFIRM APPOINTMENT

Service: ${service}
Date: ${date}
Time: ${time}

💰 Fee: $1.00

1️⃣  Confirm & Pay
2️⃣  Change Time
3️⃣  Change Date
4️⃣  Cancel

Reply with number
`,

  bookingConfirmed: (appointmentId, service, date, time, location) => `
✅ APPOINTMENT CONFIRMED!

Booking #${appointmentId}

Service: ${service}
📅 Date: ${date}
⏰ Time: ${time}
📍 Location: ${location}

We'll send you a reminder 1 hour before!

Save this number: +123-456-7890

1️⃣  Add to Calendar
2️⃣  Get Directions
3️⃣  Contact Provider
0️⃣  Main Menu

Reply with number
`,

  reminder: (service, time) => `
⏰ APPOINTMENT REMINDER

Your ${service} appointment is in 1 hour!

Time: ${time}
Location: [Address]

Please arrive 10 minutes early.

Reply CANCEL to cancel
Reply CONFIRM to confirm

See you soon! 💚
`
};
```

---

## Service 5: Group Management

```javascript
exports.groups = {
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
8️⃣  Group Settings
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
`,

  groupAdded: (groupName) => `
✅ GROUP ADDED!

Group: ${groupName}

Select features:

1️⃣  Auto-welcome new members
2️⃣  Remove spam/ads
3️⃣  Scheduled announcements
4️⃣  Collect contributions
5️⃣  Member analytics

Select all features you want (comma-separated)

Example: 1,2,3

Reply with numbers:
`,

  welcomeSetup: () => `
👋 WELCOME MESSAGE SETUP

Customize welcome message for new members:

Current message:
"Welcome to the group! 👋"

Type your custom welcome message:

Use variables:
{name} - Member's name
{rules} - Group rules
{admin} - Admin contact

Example:
"Welcome {name}! Please read our rules: {rules}"

Type your message:
`,

  groupAnalytics: (groupName, members, messagesThisWeek, activeMembers) => `
📊 GROUP ANALYTICS

Group: ${groupName}

👥 Members: ${members}
💬 Messages (7 days): ${messagesThisWeek}
🔥 Active Members: ${activeMembers}

Top Contributors:
1. John - 45 messages
2. Mary - 38 messages
3. Peter - 29 messages

1️⃣  Detailed Report
2️⃣  Export Data
3️⃣  Member List
0️⃣  Back

Reply with number
`
};
```

---

## Service 6: Money Assistant

```javascript
exports.money = {
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
`,

  transactionAdded: (type, amount, recipient) => `
✅ TRANSACTION ADDED

${type}: $${amount}
${type === 'Sent' ? 'To' : 'From'}: ${recipient}

💰 New Balance: $XXX

1️⃣  Add Another
2️⃣  View Summary
3️⃣  Generate Receipt
0️⃣  Main Menu

Reply with number
`,

  monthlyReport: (totalIncome, totalExpenses, balance, transactions) => `
📊 MONTHLY REPORT - ${new Date().toLocaleString('default', { month: 'long' })}

💵 Income: $${totalIncome}
💸 Expenses: $${totalExpenses}
━━━━━━━━━━━━━━━━━━
💰 Net: $${balance}

Recent Transactions:
${transactions.slice(0, 5).map(t => `• ${t.type} $${t.amount} - ${t.recipient}`).join('\n')}

1️⃣  Full Report
2️⃣  Export Excel
3️⃣  Set Budget
0️⃣  Main Menu

Reply with number
`
};
```

---

## Service 7: Online Courses

```javascript
exports.education = {
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
`,

  courseDetail: (course) => `
📚 ${course.title}

👨‍🏫 Instructor: ${course.instructor}
⏱️ Duration: ${course.duration} weeks
📊 Difficulty: ${course.level}
⭐ Rating: ${course.rating}/5 (${course.reviews} reviews)

What you'll learn:
${course.objectives.map(o => `• ${o}`).join('\n')}

💰 Price: $1.00

1️⃣  Enroll Now
2️⃣  View Curriculum
3️⃣  Read Reviews
0️⃣  Back

Reply with number
`,

  enrollmentConfirmed: (courseName, startDate) => `
✅ ENROLLED SUCCESSFULLY!

Course: ${courseName}
Start Date: ${startDate}

You'll receive:
📱 Daily lessons via WhatsApp
📄 PDF materials
🎥 Video tutorials
📝 Quizzes & assignments
🎓 Certificate on completion

First lesson starts tomorrow at 9 AM!

1️⃣  Preview Curriculum
2️⃣  Join Course Group
3️⃣  Download Materials
0️⃣  Main Menu

Reply with number
`,

  dailyLesson: (lessonNumber, title, content) => `
📚 LESSON ${lessonNumber}: ${title}

${content}

📄 Full notes: [PDF Link]
🎥 Video tutorial: [Video Link]

📝 Quiz Time!
Take today's quiz to test your knowledge:

Reply QUIZ to start

Next lesson tomorrow at 9 AM!
`
};
```

---

## Service 8: News & Updates

```javascript
exports.news = {
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
9️⃣  Saved Articles
0️⃣  Main Menu

Reply with number
`,

  subscriptionOptions: () => `
📰 CHOOSE SUBSCRIPTION

1️⃣  Basic - $1/month
   • 3 news updates/day
   • Breaking news alerts
   • Top stories

2️⃣  Premium - $1/month
   • Unlimited updates
   • All topics
   • Custom alerts
   • No ads

Reply with number
`,

  selectTopics: () => `
📌 SELECT TOPICS

Choose topics to follow:

1️⃣  Local News
2️⃣  Business & Economy
3️⃣  Sports
4️⃣  Entertainment
5️⃣  Technology
6️⃣  Health
7️⃣  Politics

Select multiple (comma-separated)

Example: 1,3,5

Reply with numbers:
`,

  subscriptionConfirmed: (plan, topics) => `
✅ SUBSCRIPTION ACTIVE!

Plan: ${plan}
Topics: ${topics.join(', ')}

You'll receive:
• Morning briefing (8 AM)
• Afternoon update (2 PM)
• Evening news (6 PM)
• Breaking news alerts

First update tomorrow morning!

1️⃣  Update Preferences
2️⃣  Pause Subscription
0️⃣  Main Menu

Reply with number
`,

  newsUpdate: (articles) => `
📰 NEWS UPDATE - ${new Date().toLocaleTimeString()}

${articles.map((article, i) => `
${i+1}. ${article.title}
   ${article.category} | ${article.time}
   ${article.summary}
   Read: ${article.url}
`).join('\n')}

Reply number to read full article
Reply NEXT for more news
`
};
```

---

## Service 9: Marketing

```javascript
exports.marketing = {
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

  createMarketingCampaign: () => `
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
`,

  campaignAnalytics: (campaignName, sent, clicks, conversions) => `
📊 CAMPAIGN ANALYTICS

Campaign: ${campaignName}

Performance:
━━━━━━━━━━━━━━━━━━
📤 Sent: ${sent}
👁️ Views: ${Math.round(sent * 0.7)}
🔗 Clicks: ${clicks}
✅ Conversions: ${conversions}

ROI: ${((conversions * 20 / 1) * 100).toFixed(0)}%

1️⃣  Detailed Report
2️⃣  Export Data
3️⃣  Create Similar
0️⃣  Back

Reply with number
`
};
```

---

## Service 10: B2B Orders

```javascript
exports.b2b = {
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
Reply NEXT for more items
`,

  orderProduct: (productName) => `
📦 ORDER ${productName}

Price: $1.00 per unit

How many units?

Minimum order: 10 units

Type quantity:
(Example: 20)
`,

  orderConfirmation: (items, total, deliveryDate) => `
📦 CONFIRM ORDER

Items:
${items.map(i => `• ${i.name} × ${i.quantity} = $${i.total}`).join('\n')}

━━━━━━━━━━━━━━━━━━
💰 Total: $${total}
🚚 Delivery: ${deliveryDate}

1️⃣  Confirm Order
2️⃣  Edit Quantities
3️⃣  Change Delivery
4️⃣  Cancel

Reply with number
`,

  orderPlaced: (orderNumber, total, deliveryDate) => `
✅ ORDER PLACED!

Order #${orderNumber}
Total: $${total}

🚚 Delivery: ${deliveryDate}
⏰ Time: 8:00 AM - 10:00 AM

Payment Options:

1️⃣  Pay Now (Card)
2️⃣  M-Pesa
3️⃣  Invoice (30 days)

Reply with number
`
};
```

---

## Service 11: IPTV

```javascript
exports.iptv = {
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

  packageDetails: (packageName, channels, features) => `
📺 IPTV ${packageName.toUpperCase()}

Channels: ${channels}+

Includes:
${features.map(f => `✅ ${f}`).join('\n')}

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
`,

  subscriptionActivated: (username, password, playlist) => `
✅ IPTV ACTIVATED!

Your Credentials:
━━━━━━━━━━━━━━━━━━
👤 Username: ${username}
🔒 Password: ${password}
━━━━━━━━━━━━━━━━━━

📱 Playlist URL:
${playlist}

Setup Instructions:

1️⃣  Android/iOS Setup
2️⃣  Smart TV Setup
3️⃣  Computer Setup
4️⃣  Download App

Reply with number for guide

Enjoy your channels! 📺
`,

  setupGuide: (device) => `
📱 ${device.toUpperCase()} SETUP GUIDE

Step 1: Download App
App: IPTV Smarters Pro
Link: [App Store/Play Store Link]

Step 2: Open App
• Click "Login with Xtream Codes"

Step 3: Enter Details
• Username: ${username}
• Password: ${password}
• URL: ${serverUrl}

Step 4: Enjoy!
• Browse channels
• Watch live TV
• Access VOD

Need help?
📞 Call: +123-456-7890
💬 Chat: Reply SUPPORT

Happy watching! 📺
`
};
```

---

## Payment Templates

```javascript
exports.payment = {
  requestPayment: (amount, service) => `
💳 PAYMENT REQUIRED

Service: ${service}
Amount: $${amount}

Choose payment method:

1️⃣  💳  Card (Stripe) - Instant
2️⃣  📱  M-Pesa
3️⃣  🏦  Bank Transfer

Reply with number
`,

  stripeLink: (url, amount) => `
💳 SECURE PAYMENT

Amount: $${amount}

Click to pay:
${url}

✅ Powered by Stripe
🔒 100% Secure
⚡ Instant Confirmation

After payment, you'll receive confirmation automatically!

Having issues? Reply HELP
`,

  mpesa: (phoneNumber, amount) => `
📱 M-PESA PAYMENT

Amount: $${amount}

Pay To: ${phoneNumber}
Account: MuntuShop

Steps:
1. Go to M-Pesa menu
2. Select Lipa na M-Pesa
3. Enter Business Number
4. Enter Amount
5. Enter PIN

After payment, send confirmation code here!

Example: AB12CD34EF
`,

  paymentReceived: (amount, method, reference) => `
✅ PAYMENT RECEIVED!

Amount: $${amount}
Method: ${method}
Reference: ${reference}

Your service is now active! 🎉

Receipt sent to your email.

Type MENU to continue
`,

  paymentFailed: () => `
❌ PAYMENT FAILED

Your payment could not be processed.

Common issues:
• Insufficient funds
• Incorrect details
• Network error

Try again:

1️⃣  Retry Payment
2️⃣  Different Method
3️⃣  Contact Support

Reply with number
`
};
```

---

## Notification Templates

```javascript
exports.notifications = {
  welcomeNew: (name) => `
👋 Welcome to MuntuShop Platform${name ? `, ${name}` : ''}!

We're excited to have you here! 💚

🌟 Special Welcome Offer:
Get any service for just $1!

What we offer:
• Shopping Store
• Business Services
• Entertainment (IPTV)
• And much more!

Type MENU to explore all services

Need help? Reply HELP anytime
`,

  dailyReminder: () => `
⏰ DAILY REMINDER

Don't forget:
• You have items in your cart 🛒
• New courses available 📚
• Today's news waiting 📰

Type MENU to access services
`,

  subscriptionExpiring: (service, daysLeft) => `
⚠️ SUBSCRIPTION EXPIRING

Your ${service} subscription expires in ${daysLeft} days.

Renew now for just $1/month!

1️⃣  Renew Now
2️⃣  Change Plan
3️⃣  Cancel Subscription

Reply with number
`,

  orderShipped: (orderNumber, tracking) => `
🚚 ORDER SHIPPED!

Order #${orderNumber} is on the way!

Tracking: ${tracking}

Estimated delivery: 3-5 days

Track here: [Tracking URL]

Questions? Reply HELP
`,

  appointmentReminder: (service, date, time) => `
⏰ APPOINTMENT REMINDER

Tomorrow's appointment:

Service: ${service}
Date: ${date}
Time: ${time}

Location: [Address]

Please confirm:
Reply YES to confirm
Reply NO to reschedule

See you there! 💚
`,

  promotionalOffer: () => `
🎉 SPECIAL OFFER!

This Week Only:
━━━━━━━━━━━━━━━━━━
All Services: $1
Save up to 90%!
━━━━━━━━━━━━━━━━━━

Limited time offer!

Type MENU to browse services

Don't miss out! ⚡
`
};
```

---

## Implementation Code

```javascript
// src/templates/whatsapp/index.js

const templates = {
  main: require('./menus'),
  shopping: require('./shopping'),
  messaging: require('./messaging'),
  support: require('./support'),
  appointments: require('./appointments'),
  groups: require('./groups'),
  money: require('./money'),
  education: require('./education'),
  news: require('./news'),
  marketing: require('./marketing'),
  b2b: require('./b2b'),
  iptv: require('./iptv'),
  payment: require('./payment'),
  notifications: require('./notifications')
};

// Helper function to send formatted message
async function sendTemplate(phone, templateFunction, ...args) {
  const greenAPI = require('../../config/greenapi');
  const message = templateFunction(...args);
  
  await greenAPI.message.sendMessage(
    `${phone}@c.us`,
    null,
    message
  );
}

module.exports = {
  templates,
  sendTemplate
};
```

---

**All 11 services have complete message flows! Continue to next file for API implementation →**

*Part 2 of 7 - Message Flow & Templates*  
*Last Updated: December 15, 2024*
