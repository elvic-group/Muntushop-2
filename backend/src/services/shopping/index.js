/**
 * Shopping Service
 * Complete shopping service implementation
 */

const db = require('../../config/database');
const greenAPI = require('../../config/greenapi');
const templates = require('../../templates/whatsapp');
const paymentService = require('../payments');

class ShoppingService {
  async handleMessage(user, message) {
    const step = user.current_step;
    const msg = message.toLowerCase().trim();
    
    // Navigation
    if (msg === '0' || msg === 'back') {
      return await this.goBack(user);
    }
    
    if (msg === 'menu') {
      return await this.showMainMenu(user);
    }
    
    // Route based on step
    switch (step) {
      case 'menu':
        return await this.handleMenuSelection(user, msg);
      case 'category':
        return await this.handleCategorySelection(user, msg);
      case 'products':
        return await this.handleProductSelection(user, msg);
      case 'product_detail':
        return await this.handleProductAction(user, msg);
      case 'cart':
        return await this.handleCartAction(user, msg);
      case 'checkout_address':
        return await this.handleAddress(user, message);
      case 'checkout_payment':
        return await this.handlePaymentMethod(user, msg);
      default:
        return await this.showMenu(user);
    }
  }
  
  async showMenu(user) {
    await this.updateUserStep(user.id, 'menu');
    const menu = templates.shopping.menu();
    await this.sendMessage(user.phone, menu);
  }
  
  async handleMenuSelection(user, message) {
    const option = parseInt(message);
    
    if (isNaN(option)) {
      await this.sendMessage(user.phone, 'Invalid option. Please reply with a number (1-8).');
      return;
    }
    
    const categories = {
      1: 'Phone Accessories',
      2: 'Fashion & Clothing',
      3: 'Electronics',
      4: 'Home & Living',
      5: 'Games & Toys'
    };
    
    if (option >= 1 && option <= 5) {
      await this.updateUserStep(user.id, 'category', { category: categories[option] });
      return await this.showProducts(user, categories[option]);
    } else if (option === 6) {
      return await this.showCart(user);
    } else if (option === 7) {
      return await this.showOrders(user);
    } else {
      await this.sendMessage(user.phone, 'Invalid option. Please reply with a number (1-8).');
    }
  }
  
  async showProducts(user, category) {
    const result = await db.query(`
      SELECT * FROM products 
      WHERE category = $1 AND is_active = true 
      ORDER BY rating DESC 
      LIMIT 5
    `, [category]);
    
    const products = result.rows;
    
    if (products.length === 0) {
      await this.sendMessage(user.phone, 'No products available in this category.');
      return await this.showMenu(user);
    }
    
    await this.updateUserStep(user.id, 'products', { category, products: products.map(p => p.id) });
    
    // Use template for product list
    const message = templates.shopping.productList(products, category);
    await this.sendMessage(user.phone, message);
  }
  
  async handleProductSelection(user, message) {
    const option = parseInt(message);
    
    if (isNaN(option)) {
      await this.sendMessage(user.phone, 'Invalid option. Please reply with a number.');
      return;
    }
    
    // Parse session_data if it's a string
    let session = {};
    if (user.session_data) {
      try {
        session = typeof user.session_data === 'string' 
          ? JSON.parse(user.session_data) 
          : user.session_data;
      } catch (e) {
        session = {};
      }
    }
    const products = session.products || [];
    
    if (option >= 1 && option <= products.length) {
      const productId = products[option - 1];
      const product = await this.getProduct(productId);
      
      if (!product) {
        await this.sendMessage(user.phone, 'Product not found.');
        return await this.showMenu(user);
      }
      
      await this.updateUserStep(user.id, 'product_detail', { 
        ...session, 
        current_product: productId 
      });
      
      const message = templates.shopping.productDetail(product);
      await this.sendMessage(user.phone, message);
    } else {
      await this.sendMessage(user.phone, 'Invalid product number. Please try again.');
    }
  }
  
  async handleProductAction(user, message) {
    const option = parseInt(message);
    
    if (isNaN(option)) {
      await this.sendMessage(user.phone, 'Invalid option. Please reply with a number.');
      return;
    }
    
    // Parse session_data if it's a string
    let session = {};
    if (user.session_data) {
      try {
        session = typeof user.session_data === 'string' 
          ? JSON.parse(user.session_data) 
          : user.session_data;
      } catch (e) {
        session = {};
      }
    }
    const productId = session.current_product;
    
    if (!productId) {
      await this.sendMessage(user.phone, 'Product not selected. Please try again.');
      return;
    }
    
    if (option === 1) {
      // Add to cart
      try {
        await this.addToCart(user.id, productId);
        
        const cart = await this.getCart(user.id);
        const product = await this.getProduct(productId);
        if (!product) {
          await this.sendMessage(user.phone, 'Error: Product not found.');
          return;
        }
        const cartTotal = cart && cart.total ? cart.total : 0;
        const message = templates.shopping.addedToCart(product, cartTotal);
        
        await this.updateUserStep(user.id, 'cart');
        await this.sendMessage(user.phone, message);
      } catch (error) {
        console.error('Error adding to cart:', error);
        await this.sendMessage(user.phone, 'Error adding product to cart. Please try again.');
      }
    } else if (option === 2) {
      // View reviews
      await this.showReviews(user, productId);
    } else if (option === 0) {
      await this.showProducts(user, session.category || 'Phone Accessories');
    } else {
      await this.sendMessage(user.phone, 'Invalid option. Please try again.');
    }
  }
  
  async addToCart(userId, productId, quantity = 1) {
    // Get product
    const product = await this.getProduct(productId);
    if (!product) throw new Error('Product not found');
    
    // Get or create cart
    let cartResult = await db.query(
      'SELECT * FROM carts WHERE user_id = $1',
      [userId]
    );
    
    let cart;
    if (cartResult.rows.length === 0) {
      // Create cart
      const insertResult = await db.query(`
        INSERT INTO carts (user_id, items, total)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [userId, JSON.stringify([]), 0]);
      cart = insertResult.rows[0];
    } else {
      cart = cartResult.rows[0];
    }
    
    // Parse items if it's a string
    let items = [];
    if (cart.items) {
      try {
        items = typeof cart.items === 'string' 
          ? JSON.parse(cart.items) 
          : cart.items;
      } catch (e) {
        items = [];
      }
    }
    if (!Array.isArray(items)) {
      items = [];
    }
    
    // Add or update item
    const existingIndex = items.findIndex(i => i.product_id === productId);
    
    if (existingIndex >= 0) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        product_id: productId,
        name: product.name,
        price: parseFloat(product.price),
        quantity: quantity,
        image: product.images && product.images[0] ? product.images[0] : null
      });
    }
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update cart
    await db.query(`
      UPDATE carts 
      SET items = $1, total = $2, updated_at = NOW()
      WHERE user_id = $3
    `, [JSON.stringify(items), total, userId]);
    
    return { items, total };
  }
  
  async showCart(user) {
    const cart = await this.getCart(user.id);
    
    if (!cart || !cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
      await this.sendMessage(user.phone, '🛒 Your cart is empty!\n\nType MENU to browse products.');
      return;
    }
    
    await this.updateUserStep(user.id, 'cart');
    const total = cart.total || 0;
    const message = templates.shopping.cart(cart.items, total);
    await this.sendMessage(user.phone, message);
  }
  
  async handleCartAction(user, message) {
    const option = parseInt(message);
    
    if (isNaN(option)) {
      await this.sendMessage(user.phone, 'Invalid option. Please reply with a number.');
      return;
    }
    
    if (option === 1) {
      // Proceed to checkout
      const cart = await this.getCart(user.id);
      if (!cart || !cart.items || cart.items.length === 0) {
        await this.sendMessage(user.phone, 'Your cart is empty. Type MENU to browse products.');
        return;
      }
      await this.startCheckout(user);
    } else if (option === 2) {
      // Continue shopping
      await this.showMenu(user);
    } else if (option === 5) {
      // Clear cart
      await this.clearCart(user.id);
      await this.sendMessage(user.phone, '✅ Cart cleared!');
      await this.showMenu(user);
    } else {
      await this.sendMessage(user.phone, 'Invalid option. Please try again.');
    }
  }
  
  async startCheckout(user) {
    await this.updateUserStep(user.id, 'checkout_address');
    const cart = await this.getCart(user.id);
    if (!cart || !cart.total) {
      await this.sendMessage(user.phone, 'Error: Cart is empty. Type MENU to continue.');
      return;
    }
    const message = templates.shopping.checkout(cart.total);
    await this.sendMessage(user.phone, message);
  }
  
  async handleAddress(user, address) {
    if (!address || address.trim().length === 0) {
      await this.sendMessage(user.phone, 'Please provide a valid address. Type CANCEL to go back.');
      return;
    }
    // Save address
    await this.updateUserStep(user.id, 'checkout_payment', { address });
    
    const cart = await this.getCart(user.id);
    if (!cart || !cart.total) {
      await this.sendMessage(user.phone, 'Error: Cart is empty. Type MENU to continue.');
      return;
    }
    const message = templates.shopping.paymentOptions(cart.total);
    await this.sendMessage(user.phone, message);
  }
  
  async handlePaymentMethod(user, message) {
    const option = parseInt(message);
    const cart = await this.getCart(user.id);
    
    if (!cart || !cart.items || cart.items.length === 0) {
      await this.sendMessage(user.phone, 'Error: Cart is empty. Type MENU to continue.');
      return;
    }
    
    if (option === 1) {
      // Stripe payment
      try {
        const order = await this.createOrder(user, cart);
        const paymentUrl = await paymentService.createCheckoutSession(
          user.id,
          'shopping',
          cart.total,
          { orderId: order.id }
        );
        
        const message = templates.shopping.stripePayment(paymentUrl, order.order_number);
        await this.sendMessage(user.phone, message);
      } catch (error) {
        console.error('Error creating payment:', error);
        await this.sendMessage(user.phone, 'Error processing payment. Please try again or type MENU.');
      }
    } else if (option === 2) {
      // M-Pesa
      const mpesaMessage = `
📱 M-PESA PAYMENT

Total: $${cart.total.toFixed(2)}

Send to: ${process.env.GREEN_PHONE || 'Your M-Pesa Number'}

Reference: ORD-${Date.now()}

Send screenshot when done!
Type PAID to confirm.
      `;
      await this.sendMessage(user.phone, mpesaMessage);
    }
  }
  
  async createOrder(user, cart) {
    const orderNumber = 'ORD-' + Date.now();
    // Parse session_data if it's a string
    let session = {};
    if (user.session_data) {
      try {
        session = typeof user.session_data === 'string' 
          ? JSON.parse(user.session_data) 
          : user.session_data;
      } catch (e) {
        session = {};
      }
    }
    const address = session.address || 'Not provided';
    
    const result = await db.query(`
      INSERT INTO orders (
        user_id, order_number, items, subtotal, total,
        status, payment_status, shipping_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      user.id,
      orderNumber,
      JSON.stringify(cart.items),
      cart.total,
      cart.total,
      'pending',
      'pending',
      JSON.stringify({ address })
    ]);
    
    const order = result.rows[0];
    
    // Send order confirmation
    const items = cart.items || [];
    const confirmationMsg = templates.shopping.orderConfirmation(
      order.order_number,
      cart.total,
      items
    );
    await this.sendMessage(user.phone, confirmationMsg);
    
    // Clear cart
    await this.clearCart(user.id);
    
    return order;
  }
  
  async showOrders(user) {
    const result = await db.query(`
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [user.id]);
    
    const orders = result.rows;
    
    // Use template for orders list
    const message = templates.shopping.ordersList(orders);
    await this.sendMessage(user.phone, message);
  }
  
  async showReviews(user, productId) {
    const product = await this.getProduct(productId);
    const productName = product?.name || 'Product';
    
    const result = await db.query(`
      SELECT * FROM product_reviews 
      WHERE product_id = $1 AND is_approved = true
      ORDER BY created_at DESC 
      LIMIT 5
    `, [productId]);
    
    const reviews = result.rows;
    
    // Use template for reviews list
    const message = templates.shopping.reviewsList(reviews, productName);
    await this.sendMessage(user.phone, message);
  }
  
  // Helper methods
  async getProduct(productId) {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    return result.rows[0] || null;
  }
  
  async getCart(userId) {
    try {
      const result = await db.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
      const cart = result.rows[0];
      if (cart && cart.items) {
        try {
          cart.items = typeof cart.items === 'string' 
            ? JSON.parse(cart.items) 
            : cart.items;
        } catch (e) {
          cart.items = [];
        }
        if (!Array.isArray(cart.items)) {
          cart.items = [];
        }
      } else if (cart) {
        cart.items = [];
      }
      return cart;
    } catch (error) {
      console.error('Error getting cart:', error);
      return null;
    }
  }
  
  async clearCart(userId) {
    await db.query(`
      UPDATE carts 
      SET items = '[]', total = 0, updated_at = NOW()
      WHERE user_id = $1
    `, [userId]);
  }
  
  async updateUserStep(userId, step, sessionData = null) {
    const query = sessionData 
      ? 'UPDATE users SET current_service = $1, current_step = $2, session_data = $3 WHERE id = $4'
      : 'UPDATE users SET current_service = $1, current_step = $2 WHERE id = $3';
    
    const params = sessionData 
      ? ['shopping', step, JSON.stringify(sessionData), userId]
      : ['shopping', step, userId];
    
    await db.query(query, params);
  }
  
  async sendMessage(phone, text) {
    try {
      await greenAPI.message.sendMessage(`${phone}@c.us`, null, text);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  }
  
  async goBack(user) {
    await this.showMenu(user);
  }
  
  async showMainMenu(user) {
    await db.query(
      'UPDATE users SET current_service = NULL, current_step = NULL WHERE id = $1',
      [user.id]
    );
    const menu = templates.main.mainMenu();
    await this.sendMessage(user.phone, menu);
  }
}

module.exports = new ShoppingService();

