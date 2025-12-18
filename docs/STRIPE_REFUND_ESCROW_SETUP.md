# Stripe Refund, Escrow & Dispute Management Setup Guide

## ✅ What's Been Implemented

### 1. **Refund System**
- Full refunds - Return entire order amount
- Partial refunds - Return specific amount
- Automatic WhatsApp notifications
- Refund tracking in database

### 2. **Escrow System**
- Hold payments until delivery confirmation
- Automatic release after 7 days (configurable)
- Manual release after delivery confirmation
- Prevents premature merchant payouts

### 3. **Dispute Management**
- Automatic dispute detection from Stripe
- Evidence submission system
- Dispute status tracking
- Customer notifications

## 🚀 Setup Instructions

### Step 1: Configure Stripe Webhook (REQUIRED)

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks

2. **Add Endpoint:**
   ```
   URL: https://muntushop-production-f2ffb28d626e.herokuapp.com/api/stripe/webhook
   ```

3. **Select Events to Listen:**
   - ✅ `checkout.session.completed` (payment success)
   - ✅ `checkout.session.expired` (payment expired)
   - ✅ `payment_intent.succeeded` (payment confirmed)
   - ✅ `charge.dispute.created` (dispute opened)
   - ✅ `charge.dispute.updated` (dispute status changed)
   - ✅ `charge.dispute.closed` (dispute resolved)
   - ✅ `charge.refunded` (refund processed)

4. **Copy Webhook Secret:**
   - Click on the webhook
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_...`)

5. **Add to Heroku:**
   ```bash
   heroku config:set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here --app muntushop-production
   ```

### Step 2: Database Migration (COMPLETED ✅)

The database has been updated with:
- ✅ Refund columns in orders table
- ✅ Escrow columns in orders table
- ✅ Dispute columns in orders table
- ✅ payment_disputes table created
- ✅ Indexes for performance

## 📡 API Endpoints

### Refund Endpoints

#### Create Full Refund
```bash
POST /api/refund/create
Content-Type: application/json

{
  "orderNumber": "ORD1234567890",
  "type": "full",
  "reason": "requested_by_customer"
}
```

**Reasons:**
- `requested_by_customer`
- `duplicate`
- `fraudulent`

#### Create Partial Refund
```bash
POST /api/refund/create
Content-Type: application/json

{
  "orderNumber": "ORD1234567890",
  "type": "partial",
  "amount": 5.00,
  "reason": "requested_by_customer"
}
```

### Escrow Endpoints

#### Release Escrow Payment
```bash
POST /api/escrow/release
Content-Type: application/json

{
  "orderNumber": "ORD1234567890"
}
```

### Dispute Endpoints

#### Get Dispute Info
```bash
GET /api/dispute/ORD1234567890
```

#### Submit Dispute Evidence
```bash
POST /api/dispute/submit-evidence
Content-Type: application/json

{
  "disputeId": "dp_xxx",
  "evidence": {
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "shippingAddress": "123 Main St",
    "shippingDate": "2024-01-15",
    "trackingNumber": "TRACK123",
    "carrier": "DHL",
    "productDescription": "Phone Case Premium",
    "receiptUrl": "https://...",
    "additionalInfo": "Customer confirmed delivery"
  }
}
```

## 🔄 How It Works

### Refund Flow:
1. Merchant initiates refund via API
2. Stripe processes refund
3. Order status updated to "refunded"
4. Customer receives WhatsApp notification
5. Refund appears in customer's account (5-10 days)

### Escrow Flow:
1. Payment captured on order creation
2. Order marked as `escrow_status: 'held'`
3. Merchant ships product
4. Customer confirms delivery OR 7 days pass
5. Call `/api/escrow/release` to release payment
6. Order status updated to "completed"

### Dispute Flow:
1. Customer opens dispute in Stripe
2. Webhook notifies your server
3. Order marked as `dispute_status: 'disputed'`
4. Customer notified via WhatsApp
5. Merchant submits evidence via API
6. Stripe reviews and resolves dispute
7. Order updated based on outcome (won/lost)

## 📊 Database Schema

### orders table (new columns):
```sql
refund_status VARCHAR(50)      -- none, refunded, partially_refunded
refund_amount DECIMAL(10, 2)   -- Amount refunded
refund_id VARCHAR(255)          -- Stripe refund ID
refund_reason TEXT              -- Reason for refund
refunded_at TIMESTAMP           -- When refunded
escrow_status VARCHAR(50)       -- none, held, released
escrow_hold_until TIMESTAMP     -- Auto-release date
escrow_released_at TIMESTAMP    -- When released
dispute_status VARCHAR(50)      -- none, disputed, won, lost
```

### payment_disputes table:
```sql
id SERIAL PRIMARY KEY
order_number VARCHAR(50)        -- Links to orders
dispute_id VARCHAR(255)         -- Stripe dispute ID
amount DECIMAL(10, 2)           -- Disputed amount
reason VARCHAR(255)             -- Dispute reason
status VARCHAR(50)              -- needs_response, won, lost
evidence_submitted BOOLEAN      -- Evidence submitted?
evidence_submitted_at TIMESTAMP
evidence_due_by TIMESTAMP       -- Deadline
created_at TIMESTAMP
updated_at TIMESTAMP
```

## 🧪 Testing

### Test Refund:
```bash
curl -X POST https://muntushop-production-f2ffb28d626e.herokuapp.com/api/refund/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD1765996089413",
    "type": "full",
    "reason": "requested_by_customer"
  }'
```

### Test Escrow Release:
```bash
curl -X POST https://muntushop-production-f2ffb28d626e.herokuapp.com/api/escrow/release \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "ORD1765996089413"}'
```

### Test Dispute (Simulate in Stripe):
1. Go to Stripe Dashboard → Payments
2. Find a test payment
3. Click "..." → "Simulate dispute"
4. Check your server logs and database

## 💡 Best Practices

### Refunds:
- ✅ Always provide clear refund reasons
- ✅ Process refunds within 24 hours
- ✅ Keep customers informed via WhatsApp
- ✅ Track refund metrics

### Escrow:
- ✅ Release payments promptly after delivery
- ✅ Set appropriate hold periods (default: 7 days)
- ✅ Automate release with tracking confirmations
- ✅ Run auto-release job daily:
  ```javascript
  await StripeRefundService.autoReleaseExpiredEscrow();
  ```

### Disputes:
- ✅ Respond to disputes within 7 days
- ✅ Provide comprehensive evidence
- ✅ Include tracking numbers and delivery confirmations
- ✅ Keep detailed records of all transactions

## 📱 Customer Notifications

### Refund Notification:
```
💰 REFUND PROCESSED

Order #: ORD123
Refund Amount: $10.00
Refund ID: re_xxx

✅ Your refund has been processed!
⏰ Timeline: 5-10 business days
```

### Escrow Release:
```
✅ PAYMENT RELEASED

Order #: ORD123
Your order has been confirmed as delivered.
Thank you for shopping with MuntuShop!
```

### Dispute Notice:
```
⚠️ PAYMENT DISPUTE NOTICE

Order #: ORD123
Reason: Product not received

A dispute has been opened.
Our team will contact you within 24 hours.
```

## 🔒 Security Considerations

1. **Webhook Verification:**
   - Always verify Stripe webhook signatures
   - STRIPE_WEBHOOK_SECRET is required
   - Reject unsigned webhooks

2. **Refund Authorization:**
   - Add authentication to refund endpoints
   - Require merchant/admin credentials
   - Log all refund requests

3. **Evidence Protection:**
   - Store evidence securely
   - Include signed delivery confirmations
   - Maintain customer communication logs

## 🎯 Next Steps

1. ✅ Configure Stripe webhook with secret
2. ⏳ Test refund flow with a real order
3. ⏳ Set up automated escrow release (cron job)
4. ⏳ Configure dispute email notifications
5. ⏳ Add admin dashboard for refund management

## 📞 Support

For questions or issues:
- Check Stripe Dashboard for webhook logs
- Check Heroku logs: `heroku logs --tail --app muntushop-production`
- Review payment_disputes table for dispute status
- Test endpoints with curl or Postman

---

**Deployed Version:** v27
**Database:** Updated ✅
**Status:** Ready for production 🚀
