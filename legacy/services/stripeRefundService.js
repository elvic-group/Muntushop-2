// Stripe Refund, Escrow, and Dispute Service
const Stripe = require('stripe');
const pool = require('../backend/src/config/database');
require('dotenv').config();

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

class StripeRefundService {
  /**
   * ============================================
   * REFUND MANAGEMENT
   * ============================================
   */

  /**
   * Create a full refund for an order
   */
  static async createFullRefund(orderNumber, reason = 'requested_by_customer') {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      // Get order details
      const orderResult = await pool.query(
        'SELECT * FROM orders WHERE order_number = $1',
        [orderNumber]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      if (!order.stripe_payment_intent) {
        throw new Error('No payment intent found for this order');
      }

      if (order.refund_status === 'refunded') {
        throw new Error('Order already refunded');
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent,
        reason: reason,
        metadata: {
          order_number: orderNumber,
          refund_type: 'full'
        }
      });

      // Update order in database
      await pool.query(
        `UPDATE orders
         SET refund_status = $1,
             refund_amount = $2,
             refund_id = $3,
             refund_reason = $4,
             refunded_at = NOW(),
             status = $5
         WHERE order_number = $6`,
        ['refunded', order.total, refund.id, reason, 'refunded', orderNumber]
      );

      return {
        success: true,
        refund,
        message: `Refund of $${(refund.amount / 100).toFixed(2)} processed successfully`,
        refundId: refund.id
      };
    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a partial refund for an order
   */
  static async createPartialRefund(orderNumber, amount, reason = 'requested_by_customer') {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const orderResult = await pool.query(
        'SELECT * FROM orders WHERE order_number = $1',
        [orderNumber]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      if (!order.stripe_payment_intent) {
        throw new Error('No payment intent found');
      }

      // Create partial refund
      const refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent,
        amount: Math.round(amount * 100), // Convert to cents
        reason: reason,
        metadata: {
          order_number: orderNumber,
          refund_type: 'partial'
        }
      });

      // Update order
      await pool.query(
        `UPDATE orders
         SET refund_status = $1,
             refund_amount = COALESCE(refund_amount, 0) + $2,
             refund_id = $3,
             refund_reason = $4,
             refunded_at = NOW()
         WHERE order_number = $5`,
        ['partially_refunded', amount, refund.id, reason, orderNumber]
      );

      return {
        success: true,
        refund,
        message: `Partial refund of $${amount.toFixed(2)} processed successfully`,
        refundId: refund.id
      };
    } catch (error) {
      console.error('Partial refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check refund status
   */
  static async getRefundStatus(refundId) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const refund = await stripe.refunds.retrieve(refundId);
      return {
        success: true,
        status: refund.status,
        amount: refund.amount / 100,
        reason: refund.reason,
        created: new Date(refund.created * 1000)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ============================================
   * ESCROW MANAGEMENT
   * ============================================
   */

  /**
   * Hold payment in escrow (mark as held, not captured yet)
   * Note: Stripe holds funds for 7 days by default
   */
  static async holdPaymentInEscrow(orderNumber, holdUntil = null) {
    try {
      const expiryDate = holdUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await pool.query(
        `UPDATE orders
         SET escrow_status = $1,
             escrow_hold_until = $2,
             status = $3
         WHERE order_number = $4`,
        ['held', expiryDate, 'pending_delivery', orderNumber]
      );

      return {
        success: true,
        message: 'Payment held in escrow',
        holdUntil: expiryDate
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Release payment from escrow (confirm delivery)
   */
  static async releaseEscrowPayment(orderNumber) {
    try {
      const orderResult = await pool.query(
        'SELECT * FROM orders WHERE order_number = $1',
        [orderNumber]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      if (order.escrow_status !== 'held') {
        throw new Error('Payment not held in escrow');
      }

      // Update order status
      await pool.query(
        `UPDATE orders
         SET escrow_status = $1,
             escrow_released_at = NOW(),
             status = $2
         WHERE order_number = $3`,
        ['released', 'completed', orderNumber]
      );

      return {
        success: true,
        message: 'Payment released from escrow',
        orderNumber
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Auto-release escrow payments that have expired hold period
   */
  static async autoReleaseExpiredEscrow() {
    try {
      const result = await pool.query(
        `UPDATE orders
         SET escrow_status = 'released',
             escrow_released_at = NOW(),
             status = 'completed'
         WHERE escrow_status = 'held'
         AND escrow_hold_until < NOW()
         RETURNING order_number`
      );

      return {
        success: true,
        releasedOrders: result.rows.map(r => r.order_number),
        count: result.rowCount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ============================================
   * DISPUTE MANAGEMENT
   * ============================================
   */

  /**
   * Handle dispute webhook from Stripe
   */
  static async handleDisputeCreated(dispute) {
    try {
      const paymentIntent = dispute.payment_intent;

      // Find order by payment intent
      const orderResult = await pool.query(
        'SELECT * FROM orders WHERE stripe_payment_intent = $1',
        [paymentIntent]
      );

      if (orderResult.rows.length === 0) {
        console.error('Order not found for dispute:', paymentIntent);
        return { success: false, error: 'Order not found' };
      }

      const order = orderResult.rows[0];

      // Create dispute record
      await pool.query(
        `INSERT INTO payment_disputes
         (order_number, dispute_id, amount, reason, status, evidence_due_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          order.order_number,
          dispute.id,
          dispute.amount / 100,
          dispute.reason,
          dispute.status,
          new Date(dispute.evidence_details.due_by * 1000)
        ]
      );

      // Update order status
      await pool.query(
        `UPDATE orders
         SET dispute_status = $1,
             status = $2
         WHERE order_number = $3`,
        ['disputed', 'disputed', order.order_number]
      );

      return {
        success: true,
        orderNumber: order.order_number,
        disputeId: dispute.id,
        message: `Dispute created for order ${order.order_number}`
      };
    } catch (error) {
      console.error('Dispute handling error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Submit evidence for a dispute
   */
  static async submitDisputeEvidence(disputeId, evidence) {
    try {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const disputeUpdate = await stripe.disputes.update(disputeId, {
        evidence: {
          customer_name: evidence.customerName,
          customer_email_address: evidence.customerEmail,
          shipping_address: evidence.shippingAddress,
          shipping_date: evidence.shippingDate,
          shipping_tracking_number: evidence.trackingNumber,
          shipping_carrier: evidence.carrier,
          product_description: evidence.productDescription,
          billing_address: evidence.billingAddress,
          receipt: evidence.receiptUrl,
          customer_signature: evidence.signatureUrl,
          uncategorized_text: evidence.additionalInfo
        }
      });

      // Update dispute record
      await pool.query(
        `UPDATE payment_disputes
         SET evidence_submitted = true,
             evidence_submitted_at = NOW(),
             status = $1
         WHERE dispute_id = $2`,
        [disputeUpdate.status, disputeId]
      );

      return {
        success: true,
        dispute: disputeUpdate,
        message: 'Evidence submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle dispute status updates
   */
  static async handleDisputeUpdate(dispute) {
    try {
      await pool.query(
        `UPDATE payment_disputes
         SET status = $1,
             updated_at = NOW()
         WHERE dispute_id = $2`,
        [dispute.status, dispute.id]
      );

      // Update order based on dispute outcome
      if (dispute.status === 'won') {
        await pool.query(
          `UPDATE orders
           SET dispute_status = 'won',
               status = 'completed'
           WHERE dispute_status = 'disputed'
           AND order_number IN (
             SELECT order_number FROM payment_disputes WHERE dispute_id = $1
           )`,
          [dispute.id]
        );
      } else if (dispute.status === 'lost') {
        await pool.query(
          `UPDATE orders
           SET dispute_status = 'lost',
               refund_status = 'refunded',
               status = 'refunded'
           WHERE dispute_status = 'disputed'
           AND order_number IN (
             SELECT order_number FROM payment_disputes WHERE dispute_id = $1
           )`,
          [dispute.id]
        );
      }

      return {
        success: true,
        status: dispute.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get dispute information
   */
  static async getDisputeInfo(orderNumber) {
    try {
      const result = await pool.query(
        `SELECT d.*, o.user_id
         FROM payment_disputes d
         JOIN orders o ON d.order_number = o.order_number
         WHERE d.order_number = $1
         ORDER BY d.created_at DESC
         LIMIT 1`,
        [orderNumber]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'No dispute found for this order'
        };
      }

      return {
        success: true,
        dispute: result.rows[0]
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ============================================
   * UTILITY FUNCTIONS
   * ============================================
   */

  /**
   * Generate refund confirmation message
   */
  static generateRefundMessage(orderNumber, amount, refundId) {
    return `
💰 REFUND PROCESSED

Order #: ${orderNumber}
Refund Amount: $${amount.toFixed(2)}
Refund ID: ${refundId}

✅ Your refund has been processed successfully!

⏰ Timeline:
• Card payments: 5-10 business days
• Original payment method will be credited

📧 You'll receive a confirmation email from Stripe

Type MENU for main menu
`;
  }

  /**
   * Generate escrow release message
   */
  static generateEscrowReleaseMessage(orderNumber) {
    return `
✅ PAYMENT RELEASED

Order #: ${orderNumber}

Your order has been confirmed as delivered.
Payment has been released to the merchant.

Thank you for shopping with MuntuShop!

Type MENU for main menu
`;
  }

  /**
   * Generate dispute notification message
   */
  static generateDisputeNotificationMessage(orderNumber, reason) {
    return `
⚠️ PAYMENT DISPUTE NOTICE

Order #: ${orderNumber}
Reason: ${reason}

A payment dispute has been opened for this order.

Our team will review the case and contact you within 24 hours.

If you have any questions, please reply HELP

Type MENU for main menu
`;
  }
}

module.exports = StripeRefundService;
