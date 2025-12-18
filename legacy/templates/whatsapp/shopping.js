// Shopping Service Templates
module.exports = {
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

1️⃣  Phone Case - Premium
    ⭐ 4.8/5 (234 reviews)

2️⃣  Screen Protector - Tempered Glass
    ⭐ 4.9/5 (189 reviews)

3️⃣  Charging Cable - Fast Charge
    ⭐ 4.7/5 (156 reviews)

4️⃣  Pop Socket - Multiple Designs
    ⭐ 4.6/5 (98 reviews)

5️⃣  Phone Holder - Car Mount
    ⭐ 4.8/5 (145 reviews)

6️⃣  View More
0️⃣  Back

Reply with number for details
`,

  fashion: () => `
👗 FASHION & CLOTHING

All $1.00 each:

1️⃣  T-Shirt - Cotton Premium
    ⭐ 4.7/5 (312 reviews)

2️⃣  Jeans - Classic Fit
    ⭐ 4.8/5 (245 reviews)

3️⃣  Sneakers - Sport Style
    ⭐ 4.9/5 (198 reviews)

4️⃣  Hoodie - Warm & Comfy
    ⭐ 4.6/5 (156 reviews)

5️⃣  Cap - Adjustable
    ⭐ 4.5/5 (89 reviews)

6️⃣  View More
0️⃣  Back

Reply with number for details
`,

  electronics: () => `
💻 ELECTRONICS

All $1.00 each:

1️⃣  USB Flash Drive - 32GB
    ⭐ 4.8/5 (423 reviews)

2️⃣  Wireless Mouse - Ergonomic
    ⭐ 4.7/5 (312 reviews)

3️⃣  Bluetooth Speaker - Portable
    ⭐ 4.9/5 (267 reviews)

4️⃣  Power Bank - 10000mAh
    ⭐ 4.8/5 (198 reviews)

5️⃣  Earphones - Quality Sound
    ⭐ 4.6/5 (145 reviews)

6️⃣  View More
0️⃣  Back

Reply with number for details
`,

  homeAndLiving: () => `
🏠 HOME & LIVING

All $1.00 each:

1️⃣  LED Bulb - Energy Saving
    ⭐ 4.7/5 (234 reviews)

2️⃣  Water Bottle - Insulated
    ⭐ 4.8/5 (198 reviews)

3️⃣  Storage Box - Multipurpose
    ⭐ 4.6/5 (156 reviews)

4️⃣  Wall Clock - Modern Design
    ⭐ 4.5/5 (123 reviews)

5️⃣  Kitchen Organizer - Space Saver
    ⭐ 4.7/5 (167 reviews)

6️⃣  View More
0️⃣  Back

Reply with number for details
`,

  gamesAndToys: () => `
🎮 GAMES & TOYS

All $1.00 each:

1️⃣  Puzzle Set - 500 Pieces
    ⭐ 4.8/5 (189 reviews)

2️⃣  Playing Cards - Premium
    ⭐ 4.7/5 (145 reviews)

3️⃣  Stress Ball - Squishy
    ⭐ 4.6/5 (98 reviews)

4️⃣  Mini Chess Set - Portable
    ⭐ 4.9/5 (134 reviews)

5️⃣  Fidget Spinner - Metal
    ⭐ 4.5/5 (87 reviews)

6️⃣  View More
0️⃣  Back

Reply with number for details
`,

  productDetail: (product) => `
${product.name}

💰 Price: $${product.price}
⭐ Rating: ${product.rating}/5 (${product.reviews} reviews)
📦 Stock: In Stock
🚚 Shipping: FREE

✨ ${product.description}

1️⃣  Add to Cart
2️⃣  View Reviews
3️⃣  Ask Question
0️⃣  Back to Products

Reply with number
`,

  addedToCart: (productName, cartTotal) => `
✅ Added to cart!

${productName} - $1.00

🛒 Cart Total: $${cartTotal}

1️⃣  Checkout Now
2️⃣  Continue Shopping
3️⃣  View Full Cart
0️⃣  Main Menu

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

  emptyCart: () => `
🛒 YOUR CART IS EMPTY

Start shopping now!

1️⃣  Browse Products
2️⃣  View Categories
0️⃣  Main Menu

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
Oslo, Norway
+4796701573

Type your full address
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
`
};
