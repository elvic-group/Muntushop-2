# 👥 Admin Panel & User Dashboard

**Complete UI Specifications for Admin & User Interfaces**

---

## Part 1: Admin Panel

### **Admin Dashboard Overview:**

```
┌──────────────────────────────────────────────────────────┐
│  MUNTUSHOP ADMIN PANEL                                   │
├─────────┬────────────────────────────────────────────────┤
│ MENU    │           DASHBOARD                            │
│         │                                                │
│ 📊 Home │  ┌──────────────────┐  ┌──────────────────┐  │
│ 👥 Users│  │ Total Revenue    │  │ Active Users     │  │
│ 🛍 Shop │  │ $12,345         │  │ 1,234           │  │
│ 📦 Orders│  └──────────────────┘  └──────────────────┘  │
│ 📢 Msg  │                                                │
│ 💬 Supp │  ┌──────────────────┐  ┌──────────────────┐  │
│ 📅 Appt │  │ Orders Today     │  │ Messages Sent    │  │
│ 👥 Groups│  │ 45              │  │ 2,341           │  │
│ 💰 Money│  └──────────────────┘  └──────────────────┘  │
│ 📚 Edu  │                                                │
│ 📰 News │  📈 Revenue Chart (Last 30 Days)              │
│ 📊 Mkt  │  [Line chart showing revenue trend]            │
│ 🏪 B2B  │                                                │
│ 📺 IPTV │  📊 Service Performance                        │
│         │  [Bar chart showing service usage]             │
│ ⚙️ Settings                                              │
└─────────┴────────────────────────────────────────────────┘
```

---

### **1. Admin Dashboard Home**

**URL:** `/admin/dashboard`

**Components:**

```javascript
// Dashboard Stats Cards
const statsCards = [
  {
    title: "Total Revenue",
    value: "$12,345",
    change: "+15.3% from last month",
    icon: "💰",
    color: "green"
  },
  {
    title: "Active Users",
    value: "1,234",
    change: "+8.2% from last month",
    icon: "👥",
    color: "blue"
  },
  {
    title: "Orders Today",
    value: "45",
    change: "+12 from yesterday",
    icon: "📦",
    color: "purple"
  },
  {
    title: "Messages Sent",
    value: "2,341",
    change: "+234 from yesterday",
    icon: "📢",
    color: "orange"
  }
];

// Recent Activity Feed
const recentActivity = [
  {
    type: "order",
    message: "New order #ORD-1234 from John Doe",
    time: "2 minutes ago",
    icon: "🛍️"
  },
  {
    type: "user",
    message: "New user registration: jane@example.com",
    time: "5 minutes ago",
    icon: "👤"
  },
  {
    type: "payment",
    message: "Payment received: $50.00",
    time: "10 minutes ago",
    icon: "💳"
  }
];

// Service Overview
const serviceStats = {
  shopping: { orders: 123, revenue: 3456 },
  messaging: { campaigns: 45, sent: 12000 },
  support: { tickets: 67, resolved: 58 },
  appointments: { bookings: 89, completed: 78 },
  iptv: { subscriptions: 234, active: 221 }
};
```

**Charts:**

1. **Revenue Chart** (Line chart - Last 30 days)
2. **Service Usage** (Bar chart - All 11 services)
3. **User Growth** (Area chart - Last 6 months)
4. **Top Products** (Pie chart)

---

### **2. User Management**

**URL:** `/admin/users`

**Features:**

```javascript
// User Table Columns
const userColumns = [
  { field: "id", header: "ID", sortable: true },
  { field: "phone", header: "Phone", sortable: true },
  { field: "name", header: "Name", sortable: true },
  { field: "email", header: "Email", sortable: true },
  { field: "status", header: "Status", sortable: true },
  { field: "created_at", header: "Joined", sortable: true },
  { field: "actions", header: "Actions" }
];

// User Actions
const userActions = [
  "View Details",
  "Edit User",
  "Block User",
  "Delete User",
  "Send Message",
  "View Orders",
  "View Activity"
];

// Filters
const userFilters = {
  status: ["active", "blocked", "unverified"],
  service: ["shopping", "messaging", "support", ...],
  dateRange: "Last 30 days",
  search: "Search by phone, name, or email"
};
```

**User Detail View:**

```
┌──────────────────────────────────────────┐
│ USER PROFILE                             │
├──────────────────────────────────────────┤
│                                          │
│ 👤 John Doe                              │
│ 📞 +254712345678                         │
│ 📧 john@example.com                      │
│ 🌍 Language: English                     │
│ 📅 Joined: Dec 15, 2024                  │
│ ⚡ Last Seen: 5 minutes ago              │
│                                          │
├──────────────────────────────────────────┤
│ ACTIVITY                                 │
├──────────────────────────────────────────┤
│ • Orders: 12                             │
│ • Total Spent: $450                      │
│ • Messages: 234                          │
│ • Tickets: 3                             │
│ • Courses: 2                             │
│ • IPTV: Active                           │
│                                          │
├──────────────────────────────────────────┤
│ ACTIONS                                  │
├──────────────────────────────────────────┤
│ [Edit]  [Block]  [Delete]  [Message]    │
└──────────────────────────────────────────┘
```

---

### **3. Product Management**

**URL:** `/admin/products`

**Features:**

```javascript
// Product Form
const productForm = {
  fields: [
    { name: "name", type: "text", required: true },
    { name: "sku", type: "text", required: true },
    { name: "description", type: "textarea" },
    { name: "price", type: "number", default: 1.00 },
    { name: "compare_at_price", type: "number" },
    { name: "category", type: "select", options: categories },
    { name: "images", type: "file-upload", multiple: true },
    { name: "stock_quantity", type: "number", default: 999 },
    { name: "is_active", type: "checkbox" },
    { name: "is_featured", type: "checkbox" }
  ]
};

// Bulk Actions
const bulkActions = [
  "Activate Selected",
  "Deactivate Selected",
  "Delete Selected",
  "Export to CSV",
  "Update Prices",
  "Adjust Stock"
];

// Product Import
const importOptions = {
  csv: "Import from CSV file",
  cj: "Import from CJ Dropshipping",
  manual: "Add manually"
};
```

---

### **4. Order Management**

**URL:** `/admin/orders`

**Order Statuses:**

```javascript
const orderStatuses = {
  pending: { color: "yellow", icon: "⏳" },
  processing: { color: "blue", icon: "🔄" },
  shipped: { color: "purple", icon: "🚚" },
  delivered: { color: "green", icon: "✅" },
  cancelled: { color: "red", icon: "❌" },
  refunded: { color: "orange", icon: "↩️" }
};

// Order Detail View
const orderDetails = {
  sections: [
    "Order Information",
    "Customer Details",
    "Items Ordered",
    "Payment Information",
    "Shipping Information",
    "Order Timeline",
    "Actions"
  ]
};

// Quick Actions
const orderQuickActions = [
  "Mark as Shipped",
  "Add Tracking Number",
  "Send Update to Customer",
  "Print Invoice",
  "Print Packing Slip",
  "Refund Order",
  "Cancel Order"
];
```

---

### **5. Bulk Messaging Management**

**URL:** `/admin/messaging`

**Features:**

```javascript
// Campaign Dashboard
const campaignStats = {
  total: 45,
  active: 12,
  completed: 30,
  failed: 3,
  messages_sent: 12000,
  delivery_rate: "98.5%"
};

// Campaign List
const campaignColumns = [
  "ID",
  "Name",
  "Client",
  "Recipients",
  "Sent",
  "Delivered",
  "Status",
  "Scheduled",
  "Actions"
];

// Campaign Creation Flow
const campaignSteps = [
  "Basic Info",
  "Select Recipients",
  "Compose Message",
  "Schedule",
  "Review & Send"
];
```

---

### **6. Support Ticket Management**

**URL:** `/admin/support`

**Ticket Queue:**

```javascript
// Ticket Filters
const ticketFilters = {
  status: ["open", "in_progress", "resolved", "closed"],
  priority: ["low", "medium", "high", "urgent"],
  assignee: "All agents",
  dateRange: "Last 7 days"
};

// Ticket Detail View
const ticketView = {
  header: {
    ticketNumber: "#TICK-1234",
    status: "open",
    priority: "high",
    created: "2 hours ago",
    customer: "John Doe"
  },
  
  conversation: [
    {
      from: "customer",
      message: "I need help with my order",
      time: "2 hours ago"
    },
    {
      from: "agent",
      message: "I'll help you with that. Can you provide your order number?",
      time: "1 hour ago"
    }
  ],
  
  actions: [
    "Reply",
    "Add Note",
    "Assign to Agent",
    "Change Priority",
    "Close Ticket"
  ]
};

// Quick Replies (Templates)
const quickReplies = [
  "Thank you for contacting us",
  "Can you provide more details?",
  "Your issue has been resolved",
  "We've escalated this to management",
  "You should receive a refund within 5-7 days"
];
```

---

### **7. Appointment Management**

**URL:** `/admin/appointments`

**Calendar View:**

```javascript
// Calendar Component
const calendarView = {
  views: ["day", "week", "month"],
  appointments: [
    {
      id: 1,
      time: "09:00",
      duration: 60,
      customer: "John Doe",
      service: "Consultation",
      status: "confirmed"
    }
  ],
  
  actions: [
    "Add Appointment",
    "Reschedule",
    "Cancel",
    "Mark Complete",
    "Send Reminder"
  ]
};

// Appointment Slots Management
const slotsManagement = {
  workingHours: {
    monday: { start: "09:00", end: "17:00" },
    tuesday: { start: "09:00", end: "17:00" },
    // ...
  },
  
  breaks: [
    { start: "12:00", end: "13:00", label: "Lunch" }
  ],
  
  blockouts: [
    { date: "2024-12-25", reason: "Christmas" }
  ]
};
```

---

### **8. Analytics & Reports**

**URL:** `/admin/analytics`

**Available Reports:**

```javascript
const reports = {
  financial: {
    name: "Financial Report",
    metrics: [
      "Total Revenue",
      "Revenue by Service",
      "Payment Methods",
      "Refunds",
      "Outstanding Payments"
    ],
    exportFormats: ["PDF", "Excel", "CSV"]
  },
  
  sales: {
    name: "Sales Report",
    metrics: [
      "Orders by Date",
      "Top Products",
      "Average Order Value",
      "Conversion Rate"
    ]
  },
  
  users: {
    name: "User Report",
    metrics: [
      "New Users",
      "Active Users",
      "User Retention",
      "User Lifetime Value"
    ]
  },
  
  services: {
    name: "Service Performance",
    metrics: [
      "Usage by Service",
      "Revenue by Service",
      "Customer Satisfaction"
    ]
  }
};

// Export Options
const exportOptions = {
  format: ["PDF", "Excel", "CSV"],
  dateRange: "Custom",
  filters: "Apply filters",
  schedule: "Email daily/weekly/monthly"
};
```

---

### **9. IPTV Management**

**URL:** `/admin/iptv`

**Features:**

```javascript
// IPTV Dashboard
const iptvStats = {
  totalSubscriptions: 234,
  activeSubscriptions: 221,
  expiringSoon: 12,
  monthlyRevenue: "$234"
};

// Subscription Management
const subscriptionActions = [
  "Activate",
  "Extend",
  "Suspend",
  "Cancel",
  "Reset Password",
  "Change Plan"
];

// Plan Management
const planForm = {
  name: "Premium IPTV",
  channels: 1200,
  price: 1.00,
  duration: 30,
  features: [
    "HD/4K Streaming",
    "Sports Channels",
    "VOD Library",
    "Multi-device"
  ]
};
```

---

### **10. Settings**

**URL:** `/admin/settings`

**Setting Categories:**

```javascript
const settings = {
  general: {
    siteName: "MuntuShop Platform",
    siteUrl: "https://muntushop.com",
    supportEmail: "support@muntushop.com",
    supportPhone: "+123456789"
  },
  
  greenapi: {
    instanceId: "xxxxx",
    token: "xxxxx",
    webhookUrl: "https://api.muntushop.com/webhooks/greenapi"
  },
  
  stripe: {
    publicKey: "pk_test_xxxxx",
    secretKey: "sk_test_xxxxx",
    webhookSecret: "whsec_xxxxx"
  },
  
  pricing: {
    defaultPrice: 1.00,
    currency: "USD",
    taxRate: 0.00
  },
  
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true
  },
  
  services: {
    shopping: { enabled: true, pricing: 1.00 },
    messaging: { enabled: true, pricing: 1.00 },
    support: { enabled: true, pricing: 1.00 },
    // ... all services
  }
};
```

---

## Part 2: User Dashboard

### **User Dashboard Overview:**

```
┌──────────────────────────────────────────────────────────┐
│  MUNTUSHOP - MY ACCOUNT                                  │
├─────────┬────────────────────────────────────────────────┤
│ MENU    │           MY DASHBOARD                         │
│         │                                                │
│ 🏠 Home │  Welcome back, John! 👋                        │
│ 🛍 Shop │                                                │
│ 📦 Orders│  ┌──────────────────┐  ┌──────────────────┐  │
│ 🛒 Cart │  │ Active Orders    │  │ Total Spent      │  │
│ 💳 Wallet│  │ 3               │  │ $450.00         │  │
│ 📅 Appts│  └──────────────────┘  └──────────────────┘  │
│ 📚 Courses                                              │
│ 📺 IPTV │  📦 Recent Orders                              │
│ 💬 Support │  • Order #ORD-1234 - Delivered            │
│ ⚙️ Settings│  • Order #ORD-1233 - Shipped             │
└─────────┴────────────────────────────────────────────────┘
```

---

### **1. User Home Dashboard**

**URL:** `/dashboard`

**Components:**

```javascript
// Welcome Section
const welcomeSection = {
  greeting: "Welcome back, John!",
  lastLogin: "Last seen: 5 minutes ago",
  notifications: 3,
  messages: 2
};

// Quick Stats
const userStats = {
  activeOrders: 3,
  totalSpent: 450.00,
  loyaltyPoints: 120,
  activeCourses: 2,
  iptvStatus: "Active"
};

// Quick Actions
const quickActions = [
  { label: "Track Order", icon: "📦", link: "/orders" },
  { label: "Continue Learning", icon: "📚", link: "/courses" },
  { label: "View Cart", icon: "🛒", link: "/cart" },
  { label: "Get Support", icon: "💬", link: "/support" }
];

// Recent Activity
const recentActivity = [
  "Order #ORD-1234 delivered",
  "Completed Lesson 3 in Python course",
  "Payment of $50 received",
  "IPTV subscription renewed"
];
```

---

### **2. Shopping (User View)**

**URL:** `/shop`

**Features:**

```javascript
// Product Grid
const productGrid = {
  view: "grid", // or "list"
  filters: {
    category: "All",
    priceRange: [0, 100],
    rating: "All",
    inStock: true
  },
  
  sort: "Featured", // Popular, Newest, Price
  
  productsPerPage: 20
};

// Product Card
const productCard = {
  image: "product.jpg",
  name: "Phone Case",
  price: 1.00,
  rating: 4.8,
  reviews: 234,
  badge: "Bestseller",
  quickActions: ["Add to Cart", "Quick View", "Wishlist"]
};
```

---

### **3. My Orders**

**URL:** `/orders`

**Order List:**

```javascript
// Order Card
const orderCard = {
  orderNumber: "ORD-1234",
  date: "Dec 15, 2024",
  total: 50.00,
  status: "Delivered",
  items: [
    {
      name: "Phone Case",
      quantity: 2,
      price: 25.00
    }
  ],
  
  actions: [
    "Track Order",
    "View Details",
    "Leave Review",
    "Reorder",
    "Get Help"
  ]
};

// Order Tracking
const trackingView = {
  orderNumber: "ORD-1234",
  carrier: "DHL",
  trackingNumber: "DHL123456",
  
  timeline: [
    { status: "Order Placed", date: "Dec 10", completed: true },
    { status: "Processing", date: "Dec 11", completed: true },
    { status: "Shipped", date: "Dec 12", completed: true },
    { status: "Out for Delivery", date: "Dec 15", completed: true },
    { status: "Delivered", date: "Dec 15", completed: true }
  ],
  
  estimatedDelivery: "Dec 15, 2024"
};
```

---

### **4. Shopping Cart**

**URL:** `/cart`

**Cart View:**

```javascript
// Cart Items
const cartView = {
  items: [
    {
      id: 1,
      product: "Phone Case",
      price: 1.00,
      quantity: 2,
      subtotal: 2.00,
      image: "case.jpg"
    }
  ],
  
  summary: {
    subtotal: 2.00,
    shipping: 0.00,
    tax: 0.00,
    total: 2.00
  },
  
  actions: [
    "Update Quantity",
    "Remove Item",
    "Save for Later",
    "Apply Coupon",
    "Proceed to Checkout"
  ]
};

// Checkout Flow
const checkoutSteps = [
  "Review Cart",
  "Shipping Address",
  "Payment Method",
  "Confirm Order"
];
```

---

### **5. My Wallet**

**URL:** `/wallet`

**Wallet Features:**

```javascript
// Wallet Dashboard
const wallet = {
  balance: 25.00,
  currency: "USD",
  
  recentTransactions: [
    { type: "credit", amount: 50.00, desc: "Refund", date: "Dec 15" },
    { type: "debit", amount: 25.00, desc: "Purchase", date: "Dec 14" }
  ],
  
  actions: [
    "Add Funds",
    "Withdraw",
    "Transaction History",
    "Payment Methods"
  ]
};

// Payment Methods
const paymentMethods = [
  {
    type: "card",
    last4: "4242",
    brand: "Visa",
    isDefault: true
  },
  {
    type: "mpesa",
    phone: "+254712345678",
    isDefault: false
  }
];
```

---

### **6. My Appointments**

**URL:** `/appointments`

**Appointments View:**

```javascript
// Upcoming Appointments
const upcomingAppointments = [
  {
    id: 1,
    service: "Doctor Consultation",
    date: "Dec 20, 2024",
    time: "10:00 AM",
    provider: "Dr. Smith",
    location: "City Clinic",
    status: "Confirmed",
    
    actions: [
      "Reschedule",
      "Cancel",
      "Get Directions",
      "Add to Calendar"
    ]
  }
];

// Past Appointments
const pastAppointments = [
  {
    id: 2,
    service: "Dental Checkup",
    date: "Dec 10, 2024",
    provider: "Dr. Jones",
    
    actions: [
      "Book Again",
      "Leave Review",
      "View Receipt"
    ]
  }
];
```

---

### **7. My Courses**

**URL:** `/courses`

**Course Progress:**

```javascript
// Enrolled Courses
const enrolledCourses = [
  {
    id: 1,
    title: "Introduction to Python",
    instructor: "John Smith",
    progress: 65,
    currentLesson: "Lesson 7: Functions",
    totalLessons: 12,
    
    actions: [
      "Continue Learning",
      "View Curriculum",
      "Download Materials",
      "Get Certificate"
    ]
  }
];

// Course Player
const coursePlayer = {
  video: "lesson-7.mp4",
  notes: "lesson-7.pdf",
  
  navigation: {
    previous: "Lesson 6",
    next: "Lesson 8",
    quizAvailable: true
  },
  
  progress: 65,
  
  actions: [
    "Mark Complete",
    "Take Notes",
    "Ask Question",
    "Download"
  ]
};
```

---

### **8. IPTV Subscription**

**URL:** `/iptv`

**IPTV Dashboard:**

```javascript
// Subscription Info
const iptvSubscription = {
  plan: "Premium",
  status: "Active",
  channels: 1200,
  expiresIn: "25 days",
  renewalDate: "Jan 10, 2025",
  
  credentials: {
    username: "user123",
    password: "********",
    playlistUrl: "https://..."
  },
  
  actions: [
    "Renew Now",
    "Change Plan",
    "Setup Guide",
    "Channel List",
    "Download App"
  ]
};

// Setup Guides
const setupGuides = [
  {
    device: "Android/iOS",
    app: "IPTV Smarters Pro",
    steps: ["Download app", "Login", "Enjoy"]
  },
  {
    device: "Smart TV",
    app: "IPTV Player",
    steps: ["Install app", "Enter URL", "Login"]
  }
];
```

---

### **9. Support Center**

**URL:** `/support`

**Support Features:**

```javascript
// Support Dashboard
const supportDashboard = {
  activeTickets: 2,
  resolvedTickets: 5,
  
  quickActions: [
    "Create Ticket",
    "View FAQ",
    "Live Chat",
    "Call Support"
  ]
};

// My Tickets
const myTickets = [
  {
    ticketNumber: "TICK-1234",
    subject: "Order Issue",
    status: "Open",
    priority: "High",
    created: "2 hours ago",
    lastUpdate: "1 hour ago",
    
    actions: [
      "View Details",
      "Add Reply",
      "Close Ticket"
    ]
  }
];

// FAQ
const faqCategories = [
  {
    name: "Orders & Shipping",
    questions: [
      "How do I track my order?",
      "What is the return policy?",
      "Shipping costs and times"
    ]
  },
  {
    name: "Payments",
    questions: [
      "Payment methods accepted",
      "How to get a refund",
      "Payment security"
    ]
  }
];
```

---

### **10. Account Settings**

**URL:** `/settings`

**Settings Sections:**

```javascript
// Profile Settings
const profileSettings = {
  name: "John Doe",
  email: "john@example.com",
  phone: "+254712345678",
  language: "English",
  timezone: "EAT",
  
  actions: ["Update Profile", "Change Password", "Verify Email"]
};

// Notification Preferences
const notificationSettings = {
  email: {
    orderUpdates: true,
    promotions: false,
    newsletter: true
  },
  
  whatsapp: {
    orderUpdates: true,
    appointmentReminders: true,
    courseUpdates: true
  },
  
  sms: {
    orderUpdates: false,
    securityAlerts: true
  }
};

// Privacy Settings
const privacySettings = {
  profileVisibility: "Private",
  dataSharing: false,
  marketingEmails: true,
  
  actions: [
    "Download My Data",
    "Delete Account",
    "Privacy Policy"
  ]
};
```

---

## Part 3: UI Components Library

### **Reusable Components:**

```javascript
// Button Component
const Button = {
  variants: ["primary", "secondary", "outline", "ghost"],
  sizes: ["sm", "md", "lg"],
  states: ["default", "hover", "active", "disabled"]
};

// Card Component
const Card = {
  shadow: true,
  hover: true,
  padding: "md",
  rounded: true
};

// Table Component
const Table = {
  sortable: true,
  filterable: true,
  pagination: true,
  rowsPerPage: [10, 20, 50, 100],
  bulkActions: true
};

// Modal Component
const Modal = {
  sizes: ["sm", "md", "lg", "xl", "full"],
  closeOnOverlay: true,
  animations: true
};

// Form Components
const FormComponents = {
  Input: { validation: true, error: true },
  Select: { search: true, multiple: true },
  Textarea: { autoResize: true },
  FileUpload: { multiple: true, dragDrop: true },
  DatePicker: { range: true },
  ColorPicker: { presets: true }
};
```

---

## Part 4: Responsive Design

### **Breakpoints:**

```css
/* Mobile First Approach */
:root {
  --mobile: 640px;
  --tablet: 768px;
  --desktop: 1024px;
  --wide: 1280px;
}

/* Admin Panel - Responsive */
@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    position: fixed;
  }
  
  .admin-content {
    margin-left: 0;
  }
}

/* User Dashboard - Mobile */
@media (max-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-stats {
    grid-template-columns: 1fr;
  }
}
```

---

**Your complete Admin Panel & User Dashboard specs are ready!**

Continue to final Quick Start Guide →

*Part 4 of 7 - Admin & User Panels*  
*Last Updated: December 15, 2024*
