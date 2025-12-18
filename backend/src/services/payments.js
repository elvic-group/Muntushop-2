/**
 * Payment Service
 * Stripe payment processing
 */

const stripe = require('../config/stripe');
const db = require('../config/database');
const greenAPI = require('../config/greenapi');
const shoppingService = require('./shopping');
const iptvService = require('./iptv');
const templates = require('../templates/whatsapp');

class PaymentService {
  async createCheckoutSession(userId, serviceType, amount, metadata = {}) {
    try {
      // Validate amount
      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount. Amount must be greater than 0.');
      }
      
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = userResult.rows[0];
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${serviceType} Service`,
              description: metadata.description || `MuntuShop ${serviceType} service`
            },
            unit_amount: Math.round(amount * 100) // Convert to cents
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
        customer_email: user.email,
        metadata: {
          userId: userId.toString(),
          serviceType,
          ...metadata
        }
      });
      
      // Save payment record
      await db.query(`
        INSERT INTO payments (
          user_id, service_type, amount, payment_method,
          stripe_session_id, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        userId,
        serviceType,
        amount,
        'stripe',
        session.id,
        'pending',
        JSON.stringify(metadata)
      ]);
      
      return session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      console.error('Error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
        userId,
        serviceType,
        amount,
        metadata
      });
      
      // Provide more specific error messages
      if (error.type === 'StripeInvalidRequestError') {
        throw new Error(`Payment configuration error: ${error.message}`);
      } else if (error.message && error.message.includes('not configured')) {
        throw new Error('Payment service is not configured. Please contact support.');
      }
      
      throw error;
    }
  }
  
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handlePaymentSuccess(event.data.object);
          break;
          
        case 'checkout.session.expired':
          await this.handlePaymentExpired(event.data.object);
          break;
          
        case 'payment_intent.succeeded':
          console.log('Payment intent succeeded:', event.data.object.id);
          break;
      }
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }
  
  async handlePaymentSuccess(session) {
    if (!session || !session.metadata) {
      console.error('Invalid session data in payment success handler');
      return;
    }
    
    const metadata = session.metadata || {};
    const userId = metadata.userId;
    const serviceType = metadata.serviceType;
    const orderId = metadata.orderId;
    const planId = metadata.planId;
    
    if (!userId || !serviceType) {
      console.error('Missing userId or serviceType in payment metadata');
      return;
    }
    
    // Update payment status
    try {
      await db.query(`
        UPDATE payments 
        SET status = $1, stripe_payment_intent = $2, paid_at = NOW()
        WHERE stripe_session_id = $3
      `, ['completed', session.payment_intent || null, session.id]);
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
    
    // Get user
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      console.error('User not found for payment:', userId);
      return;
    }
    
    const user = userResult.rows[0];
    
    // Process based on service type
    try {
      switch (serviceType) {
        case 'shopping':
          if (orderId) {
            await this.fulfillOrder(orderId);
          }
          break;
          
        case 'iptv':
          if (planId) {
            await iptvService.activateSubscription(parseInt(userId), parseInt(planId));
          }
          break;
          
        case 'education':
          if (metadata.courseId) {
            await this.enrollCourse(parseInt(userId), parseInt(metadata.courseId));
          }
          break;
      }
    } catch (error) {
      console.error('Error processing service after payment:', error);
    }
    
    // Send confirmation
    await this.sendPaymentConfirmation(user, serviceType, session);
  }
  
  async handlePaymentExpired(session) {
    await db.query(`
      UPDATE payments 
      SET status = $1, failed_at = NOW()
      WHERE stripe_session_id = $2
    `, ['expired', session.id]);
  }
  
  async fulfillOrder(orderId) {
    if (!orderId) {
      console.error('Order ID is required for fulfillment');
      return;
    }
    
    try {
      // Get order details first (before updating)
      const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (orderResult.rows.length === 0) {
        console.error('Order not found:', orderId);
        return;
      }
      
      const order = orderResult.rows[0];
      if (!order.user_id) {
        console.error('Order missing user_id:', orderId);
        return;
      }
      
      const userResult = await db.query('SELECT * FROM users WHERE id = $1', [order.user_id]);
      if (userResult.rows.length === 0) {
        console.error('User not found for order:', order.user_id);
        return;
      }
      
      const user = userResult.rows[0];
      if (!user.phone) {
        console.error('User missing phone number:', user.id);
        return;
      }
      
      // Get cart items for confirmation
      let items = [];
      if (order.items) {
        try {
          items = typeof order.items === 'string' 
            ? JSON.parse(order.items) 
            : order.items;
        } catch (e) {
          items = [];
        }
      }

      // Create cart object for confirmation
      const cart = {
        items: items,
        total: parseFloat(order.total) || 0
      };

      // Update order status BEFORE sending confirmation
      await db.query(`
        UPDATE orders 
        SET payment_status = $1, status = $2, paid_at = NOW()
        WHERE id = $3
      `, ['paid', 'processing', orderId]);
      
      // Send order confirmation using shopping service (this also clears cart)
      await shoppingService.createOrderConfirmed(user, cart, orderId);
      
      // Send payment success message
      const orderNumber = order.order_number || `ORD-${orderId}`;
      const total = order.total || 0;
      const message = templates.shopping.paymentSuccess(orderNumber, total);
      
      try {
        await greenAPI.message.sendMessage(
          `${user.phone}@c.us`,
          null,
          message
        );
      } catch (error) {
        console.error('Error sending payment confirmation:', error);
      }
    } catch (error) {
      console.error('Error fulfilling order:', error);
    }
  }
  
  async sendPaymentConfirmation(user, serviceType, session) {
    if (!user || !user.phone) {
      console.error('Invalid user data for payment confirmation');
      return;
    }
    
    const amount = session.amount_total 
      ? (session.amount_total / 100).toFixed(2) 
      : '0.00';
    const transactionId = session.payment_intent || session.id || 'N/A';
    
    const message = `
✅ PAYMENT SUCCESSFUL!

Service: ${serviceType}
Amount: $${amount}
Transaction ID: ${transactionId}

Your service is now active! 🎉

Type MENU to continue.
    `;
    
    try {
      await greenAPI.message.sendMessage(
        `${user.phone}@c.us`,
        null,
        message
      );
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
    }
  }
  
  async enrollCourse(userId, courseId) {
    // Implement course enrollment logic
    await db.query(`
      INSERT INTO course_enrollments (user_id, course_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (user_id, course_id) DO NOTHING
    `, [userId, courseId]);
  }
}

module.exports = new PaymentService();

