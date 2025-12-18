// Payment Service with Stripe Integration
const Stripe = require('stripe');
const IPTVPlaylistService = require('./iptvPlaylistService');
const IPTVCredentialService = require('./iptvCredentialService');
require('dotenv').config();

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

class PaymentService {
  /**
   * Create Stripe checkout session
   */
  static async createCheckoutSession(phoneNumber, serviceName, amount, metadata = {}) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY in .env');
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: serviceName,
              description: metadata.description || `MuntuShop ${serviceName}`
            },
            unit_amount: Math.round(amount * 100) // Convert to cents
          },
          quantity: metadata.quantity || 1
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'https://muntushop-production-f2ffb28d626e.herokuapp.com'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://muntushop-production-f2ffb28d626e.herokuapp.com'}/payment/cancel`,
        metadata: {
          phoneNumber,
          serviceName,
          ...metadata
        }
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Generate payment link message
   */
  static generatePaymentMessage(serviceName, amount, paymentUrl) {
    const amountNum = parseFloat(amount) || 0;
    return `
💳 SECURE PAYMENT

Service: ${serviceName}
Amount: $${amountNum.toFixed(2)}

Click here to pay securely:
${paymentUrl}

✅ Powered by Stripe
🔒 100% Secure Payment
⚡ Instant Confirmation

After payment, you'll receive automatic confirmation!

Having issues? Reply HELP
`;
  }

  /**
   * Handle Stripe webhook
   */
  static async handleWebhook(event, signature, webhookSecret) {
    try {
      // Verify webhook signature
      const webhookEvent = stripe.webhooks.constructEvent(
        event,
        signature,
        webhookSecret
      );

      switch (webhookEvent.type) {
        case 'checkout.session.completed': {
          // Retrieve full session with charges to get receipt URL
          if (stripe) {
            const fullSession = await stripe.checkout.sessions.retrieve(
              webhookEvent.data.object.id,
              {
                expand: ['payment_intent.latest_charge']
              }
            );
            return await this.handlePaymentSuccess(fullSession);
          }
          return await this.handlePaymentSuccess(webhookEvent.data.object);
        }

        case 'checkout.session.expired':
          return await this.handlePaymentExpired(webhookEvent.data.object);

        case 'payment_intent.succeeded':
          console.log('Payment intent succeeded:', webhookEvent.data.object.id);
          break;

        case 'charge.refunded':
        case 'charge.refund.updated': {
          console.log(`Refund event: ${webhookEvent.type}`, webhookEvent.data.object.id);
          // Refund notifications are handled by the refund API endpoint
          break;
        }

        case 'charge.dispute.created': {
          console.log('Dispute created:', webhookEvent.data.object.id);
          const StripeRefundService = require('./stripeRefundService');
          await StripeRefundService.handleDisputeCreated(webhookEvent.data.object);
          break;
        }

        case 'charge.dispute.updated':
        case 'charge.dispute.closed':
        case 'charge.dispute.funds_withdrawn':
        case 'charge.dispute.funds_reinstated': {
          console.log(`Dispute event: ${webhookEvent.type}`, webhookEvent.data.object.id);
          const StripeRefundService = require('./stripeRefundService');
          await StripeRefundService.handleDisputeUpdate(webhookEvent.data.object);
          break;
        }

        default:
          console.log(`Unhandled webhook type: ${webhookEvent.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  static async handlePaymentSuccess(session) {
    const {
      phoneNumber,
      serviceName,
      serviceType,
      orderNumber,
      deliveryAddress,
      customerPhone
    } = session.metadata;

    console.log(`✅ Payment successful for ${serviceName} by ${phoneNumber}`);
    console.log(`Amount: $${(session.amount_total / 100).toFixed(2)}`);
    console.log(`Session ID: ${session.id}`);

    // Extract receipt URL from payment intent
    let receiptUrl = null;
    if (session.payment_intent?.latest_charge?.receipt_url) {
      receiptUrl = session.payment_intent.latest_charge.receipt_url;
    } else if (typeof session.payment_intent === 'string' && stripe) {
      // If payment_intent is not expanded, fetch it
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        if (paymentIntent.latest_charge) {
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
          receiptUrl = charge.receipt_url;
        }
      } catch (error) {
        console.log('Could not fetch receipt URL:', error.message);
      }
    }

    // Hold shopping orders in escrow automatically
    if (serviceType === 'shopping' && orderNumber) {
      try {
        const StripeRefundService = require('./stripeRefundService');
        const escrowResult = await StripeRefundService.holdPaymentInEscrow(orderNumber);
        if (escrowResult.success) {
          console.log(`💰 Payment held in escrow until ${escrowResult.holdUntil}`);
        }
      } catch (error) {
        console.error('Escrow error:', error.message);
        // Continue even if escrow fails
      }
    }

    // Generate detailed receipt
    const receiptMessage = this.generateReceipt({
      serviceName,
      serviceType,
      orderNumber,
      amount: session.amount_total / 100,
      transactionId: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id,
      paymentMethod: session.payment_method_types[0],
      customerEmail: session.customer_details?.email,
      customerPhone: customerPhone || phoneNumber,
      deliveryAddress,
      date: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Oslo'
      }),
      receiptUrl,
      packageTier: session.metadata.package || session.metadata.plan || 'Premium'
    });

    // This will be sent by the webhook handler
    return {
      phoneNumber,
      message: receiptMessage,
      session
    };
  }

  /**
   * Generate detailed receipt message
   */
  static generateReceipt(details) {
    const {
      serviceName,
      serviceType,
      orderNumber,
      amount,
      transactionId,
      paymentMethod,
      customerEmail,
      customerPhone,
      deliveryAddress,
      date,
      receiptUrl,
      packageTier
    } = details;

    const amountNum = parseFloat(amount) || 0;

    let receipt = `
╔════════════════════════════════╗
║       🧾 PAYMENT RECEIPT       ║
╚════════════════════════════════╝

🎉 PAYMENT SUCCESSFUL!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Service: ${serviceName}`;

    if (orderNumber) {
      receipt += `\nOrder #: ${orderNumber}`;
    }

    receipt += `\nDate: ${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Amount Paid: $${amountNum.toFixed(2)}
Payment Method: ${paymentMethod === 'card' ? '💳 Card' : paymentMethod}
Transaction ID: ${transactionId || 'Processing...'}
Status: ✅ PAID

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 CUSTOMER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phone: ${customerPhone}`;

    if (customerEmail) {
      receipt += `\nEmail: ${customerEmail}`;
    }

    if (deliveryAddress) {
      receipt += `\nDelivery: ${deliveryAddress}`;
    }

    // Service-specific information
    if (serviceType === 'shopping') {
      receipt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 DELIVERY INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Estimated Delivery: 5-7 business days
Shipping: FREE
Tracking: Available in 24-48 hours

Type TRACK ${orderNumber} to track your order`;
    } else if (serviceType === 'iptv') {
      // Generate unique credentials for this customer
      const packageTier = details.packageTier || 'Premium'; // Basic, Standard, or Premium
      const credentials = IPTVCredentialService.generateCredentials(customerPhone, packageTier, 30);

      // Server info
      const baseUrl = process.env.FRONTEND_URL || 'https://muntushop-production-f2ffb28d626e.herokuapp.com';
      const smartersUrl = process.env.IPTV_SMARTERS_APP_URL || 'https://www.iptvsmarters.com/#downloads';

      // Calculate days remaining
      const daysRemaining = Math.ceil((credentials.expiresAt - new Date()) / (1000 * 60 * 60 * 24));

      receipt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📺 IPTV ACCESS - ${packageTier.toUpperCase()} PACKAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your IPTV is now ACTIVE! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Server: ${baseUrl}/iptv
Username: ${credentials.username}
Password: ${credentials.password}

⚠️ SAVE THESE - They're unique to you!
🔒 Don't share with others

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 YOUR SUBSCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Package: ${packageTier}
Channels: ${credentials.channelLimit}+ channels
Valid Until: ${credentials.expiresAt.toLocaleDateString()}
Days Remaining: ${daysRemaining} days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 SETUP INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 1: IPTV Smarters Pro ⭐ RECOMMENDED

1. Download IPTV Smarters Pro:
   📱 Android: Play Store
   🍎 iOS: App Store
   📺 Smart TV: App Store
   ${smartersUrl}

2. Open app → "Login with Xtream Codes"

3. Enter YOUR credentials:
   Server: ${baseUrl}/iptv
   Username: ${credentials.username}
   Password: ${credentials.password}

4. Click "Add User" → Enjoy ${credentials.channelLimit}+ channels!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 2: VLC Media Player

1. Open VLC → Media → Open Network Stream

2. Paste this M3U URL:
   ${baseUrl}/iptv/live/${credentials.username}/${credentials.password}/playlist.m3u

3. Click Play → Browse channels!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 3: GSE Smart IPTV / Perfect Player

1. Download GSE Smart IPTV or Perfect Player
2. Add → Xtream Codes API
3. Enter credentials above
4. Load → Watch!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 IMPORTANT TIPS:
• Works on Phone, TV, Computer, Tablet
• Save credentials in a safe place
• Don't share with others (account will be suspended)
• Credentials expire on ${credentials.expiresAt.toLocaleDateString()}
• Reply RENEW before expiration

📺 ${credentials.channelLimit}+ channels ready to watch
⚡ Start watching immediately
🔄 ${daysRemaining} days remaining

Need help? Reply HELP
Renew subscription? Reply RENEW

Type MENU for main menu`;
    } else if (['messaging', 'news', 'courses'].includes(serviceType)) {
      receipt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ SUBSCRIPTION ACTIVATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your subscription is now active!
Access your service immediately.

Type MENU to get started`;
    } else if (serviceType === 'appointments') {
      receipt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 APPOINTMENT CONFIRMED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You'll receive a reminder 24 hours before.

Type MENU for more options`;
    }

    receipt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ This is your official receipt
💚 Thank you for using MuntuShop!`;

    if (receiptUrl) {
      receipt += `

📄 Download Receipt: ${receiptUrl}`;
    }

    receipt += `

Need help? Reply HELP
Questions? Reply SUPPORT

Type MENU for main menu
`;

    return receipt;
  }

  /**
   * Handle expired payment
   */
  static async handlePaymentExpired(session) {
    const { phoneNumber, serviceName } = session.metadata;

    console.log(`❌ Payment expired for ${serviceName} by ${phoneNumber}`);

    return {
      phoneNumber,
      message: `
⏰ PAYMENT SESSION EXPIRED

Service: ${serviceName}

Your payment session has expired.

Would you like to try again?

Type MENU to see services.
`,
      session
    };
  }

  /**
   * Create payment for specific service
   */
  static async createServicePayment(phoneNumber, serviceType, serviceDetails) {
    const serviceConfig = {
      'shopping': {
        name: `Shopping Order #${serviceDetails.orderNumber || 'NEW'}`,
        amount: serviceDetails.total || 1.00,
        description: `${serviceDetails.itemCount || 1} items`
      },
      'messaging': {
        name: `Bulk Messaging ${serviceDetails.plan || 'Plan'}`,
        amount: 1.00,
        description: `${serviceDetails.messageCount || '1,000'} messages/month`
      },
      'support': {
        name: `Customer Support ${serviceDetails.plan || 'Plan'}`,
        amount: 1.00,
        description: `${serviceDetails.ticketCount || '10'} tickets/month`
      },
      'appointments': {
        name: `Appointment - ${serviceDetails.service || 'Service'}`,
        amount: 1.00,
        description: `${serviceDetails.date || 'Date TBD'} ${serviceDetails.time || ''}`
      },
      'iptv': {
        name: `IPTV ${serviceDetails.package || 'Package'}`,
        amount: 1.00,
        description: `${serviceDetails.channels || '500+'} channels`
      },
      'courses': {
        name: `Course: ${serviceDetails.courseName || 'Course'}`,
        amount: 1.00,
        description: serviceDetails.description || 'Online course'
      }
    };

    const config = serviceConfig[serviceType] || {
      name: serviceDetails.name || 'MuntuShop Service',
      amount: serviceDetails.amount || 1.00,
      description: serviceDetails.description || 'Service'
    };

    const session = await this.createCheckoutSession(
      phoneNumber,
      config.name,
      config.amount,
      {
        description: config.description,
        serviceType,
        ...serviceDetails
      }
    );

    return {
      url: session.url,
      sessionId: session.id,
      message: this.generatePaymentMessage(config.name, config.amount, session.url)
    };
  }
}

module.exports = PaymentService;
