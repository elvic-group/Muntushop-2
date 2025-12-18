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

exports.addedToCart = (product, cartTotal) => {
  if (!product) {
    return 'Error: Product information not available.';
  }
  
  const productName = product.name || 'Product';
  const productPrice = product.price || '0.00';
  const total = typeof cartTotal === 'number' ? cartTotal.toFixed(2) : (cartTotal || '0.00');
  
  return `
✅ Added to cart!

${productName} - $${productPrice}

🛒 Cart Total: $${total}

1️⃣  Checkout Now
2️⃣  Continue Shopping
3️⃣  View Full Cart
4️⃣  Remove from Cart

Reply with number
`;
};

exports.cart = (items, total) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return '🛒 Your cart is empty!\n\nType MENU to browse products.';
  }
  
  const itemsList = items.map((item, i) => {
    const name = item.name || 'Product';
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    const itemTotal = (price * quantity).toFixed(2);
    return `${i+1}. ${name}\n   $${price.toFixed(2)} × ${quantity} = $${itemTotal}`;
  }).join('\n\n');
  
  const cartTotal = typeof total === 'number' ? total.toFixed(2) : '0.00';
  
  return `
🛒 YOUR SHOPPING CART

${itemsList}

━━━━━━━━━━━━━━━━━━
💰 Total: $${cartTotal}
━━━━━━━━━━━━━━━━━━

1️⃣  Proceed to Checkout
2️⃣  Update Quantities
3️⃣  Remove Items
4️⃣  Continue Shopping
5️⃣  Clear Cart

Reply with number
`;
};

exports.checkout = (total) => {
  const orderTotal = typeof total === 'number' ? total.toFixed(2) : '0.00';
  
  return `
💳 CHECKOUT

Order Summary:
━━━━━━━━━━━━━━━━━━
Subtotal: $${orderTotal}
Shipping: FREE
Tax: $0.00
━━━━━━━━━━━━━━━━━━
*Total: $${orderTotal}*

Please provide your shipping address:

📍 Format:
Name, Street, City, Postal Code

Or type CANCEL to go back
`;
};

exports.paymentOptions = (total) => {
  const orderTotal = typeof total === 'number' ? total.toFixed(2) : '0.00';
  
  return `
💳 PAYMENT OPTIONS

Total: $${orderTotal}

Choose payment method:

1️⃣  💳 Card Payment (Stripe)
   ✅ Secure & Instant
   
2️⃣  📱 M-Pesa
   Send to: [Your M-Pesa Number]
   
3️⃣  🏦 Bank Transfer
   Details will be provided

Reply with number (1-3)
`;
};

exports.stripePayment = (paymentUrl, orderNumber) => {
  if (!paymentUrl) {
    return 'Error: Payment link not available. Please try again or contact support.';
  }
  
  const order = orderNumber || 'N/A';
  const url = paymentUrl || '#';
  
  return `
💳 STRIPE PAYMENT

Order: ${order}

Complete your payment:
🔗 ${url}

✅ Secure payment by Stripe
🔒 Your payment info is protected

After payment, send screenshot or 
type PAID to confirm!

Or type CANCEL to cancel
`;
};

exports.orderConfirmation = (orderNumber, total, items) => {
  const order = orderNumber || 'N/A';
  const orderTotal = typeof total === 'number' ? total.toFixed(2) : '0.00';
  
  let itemsList = '';
  if (items && Array.isArray(items) && items.length > 0) {
    itemsList = items.slice(0, 5).map((item, i) => {
      const name = item.name || 'Product';
      const qty = item.quantity || 1;
      return `${i+1}. ${name} (×${qty})`;
    }).join('\n');
    if (items.length > 5) {
      itemsList += `\n... and ${items.length - 5} more item(s)`;
    }
  } else {
    itemsList = 'Items will be processed';
  }
  
  return `
✅ ORDER CONFIRMED!

Order #${order}
━━━━━━━━━━━━━━━━━━
${itemsList}
━━━━━━━━━━━━━━━━━━
Total: $${orderTotal}

📦 We're preparing your order!
You'll receive updates via WhatsApp.

Type ORDERS to track your order
Type MENU to continue shopping
`;
};

exports.paymentSuccess = (orderNumber, total) => {
  const order = orderNumber || 'N/A';
  const orderTotal = typeof total === 'number' ? total.toFixed(2) : '0.00';
  
  return `
💳 PAYMENT SUCCESSFUL!

Order: ${order}
Amount: $${orderTotal}

✅ Your payment has been received
📦 Your order is being processed

We'll notify you when your order ships!

Type ORDERS to view your orders
Type MENU to continue shopping
`;
};

exports.orderStatus = (orderNumber, status, trackingNumber = null) => {
  const order = orderNumber || 'N/A';
  const statusEmoji = {
    'pending': '⏳',
    'processing': '🔄',
    'shipped': '📦',
    'delivered': '✅',
    'cancelled': '❌'
  };
  const emoji = statusEmoji[status?.toLowerCase()] || '📋';
  
  let trackingInfo = '';
  if (trackingNumber) {
    trackingInfo = `\n📮 Tracking: ${trackingNumber}\n`;
  }
  
  return `
📦 ORDER STATUS

Order: ${order}
Status: ${emoji} ${status || 'Unknown'}${trackingInfo}

Type ORDERS to see all orders
Type MENU to continue shopping
`;
};

exports.ordersList = (orders) => {
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return '📦 No orders yet!\n\nType MENU to start shopping.';
  }
  
  const ordersList = orders.map((order, i) => {
    const statusEmoji = {
      'pending': '⏳',
      'processing': '🔄',
      'shipped': '📦',
      'delivered': '✅',
      'cancelled': '❌'
    };
    const emoji = statusEmoji[order.status?.toLowerCase()] || '📋';
    const date = order.created_at 
      ? new Date(order.created_at).toLocaleDateString() 
      : 'N/A';
    const total = typeof order.total === 'number' ? order.total.toFixed(2) : '0.00';
    
    return `${i+1}. ${emoji} Order #${order.order_number || 'N/A'}\n   Status: ${order.status || 'Unknown'}\n   Total: $${total}\n   Date: ${date}`;
  }).join('\n\n');
  
  return `
📦 YOUR ORDERS

${ordersList}

Reply with order number to track
Or type MENU to return
`;
};

exports.productList = (products, category) => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return `No products available in ${category || 'this category'}.\n\nType MENU to browse other categories.`;
  }
  
  const categoryName = category || 'Products';
  const productsList = products.map((product, i) => {
    const name = product.name || 'Product';
    const price = typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';
    const rating = product.rating || '4.5';
    return `${i+1}. ${name} - $${price}\n   ⭐ ${rating}/5`;
  }).join('\n\n');
  
  return `
📱 ${categoryName}

${productsList}

Reply with number to view details
Or type MENU to go back
`;
};

exports.reviewsList = (reviews, productName = 'Product') => {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return `⭐ No reviews yet for ${productName}.\n\nBe the first to review!`;
  }
  
  const reviewsList = reviews.map((review, i) => {
    const rating = review.rating || 0;
    const content = review.content || 'No comment';
    const stars = '⭐'.repeat(Math.min(rating, 5));
    return `${i+1}. ${stars} ${rating}/5\n   ${content}`;
  }).join('\n\n');
  
  return `
⭐ REVIEWS - ${productName}

${reviewsList}

Type MENU to continue shopping
`;
};

