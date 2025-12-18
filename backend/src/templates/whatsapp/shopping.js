/**
 * WhatsApp Templates - Shopping Service
 */

exports.menu = () => `
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
`;

exports.phoneAccessories = () => `
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
`;

exports.productDetail = (product) => {
  if (!product) {
    return 'Product not found.';
  }
  
  const images = product.images && Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0] 
    : null;
  
  const stockQuantity = product.stock_quantity || 0;
  const stockStatus = stockQuantity > 0 ? 'In Stock ✅' : 'Out of Stock ❌';
  
  return `
📱 *${product.name || 'Product'}*

💰 Price: $${product.price || '0.00'}
⭐ Rating: ${product.rating || '4.5'}/5 (${product.reviews_count || 0} reviews)
📦 Stock: ${stockStatus}
🚚 Shipping: FREE

${product.description || product.short_description || 'No description available.'}

1️⃣  Add to Cart
2️⃣  View Reviews
3️⃣  Ask Question
0️⃣  Back to Products

Reply with number
`;
};

exports.addedToCart = (product, cartTotal) => `
✅ Added to cart!

${product.name} - $${product.price}

🛒 Cart Total: $${cartTotal}

1️⃣  Checkout Now
2️⃣  Continue Shopping
3️⃣  View Full Cart
4️⃣  Remove from Cart

Reply with number
`;

exports.cart = (items, total) => {
  const itemsList = items.map((item, i) => 
    `${i+1}. ${item.name}\n   $${item.price} × ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n\n');
  
  return `
🛒 YOUR SHOPPING CART

${itemsList}

━━━━━━━━━━━━━━━━━━
💰 Total: $${total.toFixed(2)}
━━━━━━━━━━━━━━━━━━

1️⃣  Proceed to Checkout
2️⃣  Update Quantities
3️⃣  Remove Items
4️⃣  Continue Shopping
5️⃣  Clear Cart

Reply with number
`;
};

exports.checkout = (total) => `
💳 CHECKOUT

Order Summary:
━━━━━━━━━━━━━━━━━━
Subtotal: $${total.toFixed(2)}
Shipping: FREE
Tax: $0.00
━━━━━━━━━━━━━━━━━━
*Total: $${total.toFixed(2)}*

Please provide your shipping address:

📍 Format:
Name, Street, City, Postal Code

Or type CANCEL to go back
`;

exports.paymentOptions = (total) => `
💳 PAYMENT OPTIONS

Total: $${total.toFixed(2)}

Choose payment method:

1️⃣  💳 Card Payment (Stripe)
   ✅ Secure & Instant
   
2️⃣  📱 M-Pesa
   Send to: [Your M-Pesa Number]
   
3️⃣  🏦 Bank Transfer
   Details will be provided

Reply with number (1-3)
`;

exports.stripePayment = (paymentUrl, orderNumber) => `
💳 STRIPE PAYMENT

Order: ${orderNumber}

Complete your payment:
🔗 ${paymentUrl}

✅ Secure payment by Stripe
🔒 Your payment info is protected

After payment, send screenshot or 
type PAID to confirm!

Or type CANCEL to cancel
`;

