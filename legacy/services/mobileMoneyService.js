// Mobile Money Payment Service
// Supports M-Pesa, Orange Money, Tigo Pesa

const axios = require('axios');
require('dotenv').config();

class MobileMoneyService {
  /**
   * Initialize M-Pesa payment (Safaricom - Kenya)
   * Using Daraja API
   */
  static async initiateMpesaPayment(phoneNumber, amount, orderNumber, accountReference) {
    try {
      // Get M-Pesa access token
      const token = await this.getMpesaAccessToken();

      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
      const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
      ).toString('base64');

      // Format phone number (254712345678)
      const formattedPhone = phoneNumber.replace(/\+/g, '').replace(/^0/, '254');

      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
          BusinessShortCode: process.env.MPESA_SHORTCODE || '174379',
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.ceil(amount),
          PartyA: formattedPhone,
          PartyB: process.env.MPESA_SHORTCODE || '174379',
          PhoneNumber: formattedPhone,
          CallBackURL: `${process.env.FRONTEND_URL || 'https://muntushop-production-f2ffb28d626e.herokuapp.com'}/api/mpesa/callback`,
          AccountReference: accountReference || orderNumber,
          TransactionDesc: `Payment for Order ${orderNumber}`
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        provider: 'M-Pesa',
        transactionId: response.data.CheckoutRequestID,
        message: this.generateMpesaMessage(formattedPhone, amount, orderNumber)
      };
    } catch (error) {
      console.error('M-Pesa payment error:', error.response?.data || error.message);
      return {
        success: false,
        provider: 'M-Pesa',
        error: error.response?.data?.errorMessage || error.message
      };
    }
  }

  /**
   * Get M-Pesa access token
   */
  static async getMpesaAccessToken() {
    try {
      const auth = Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
      ).toString('base64');

      const response = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  /**
   * Generate M-Pesa payment message
   */
  static generateMpesaMessage(phoneNumber, amount, orderNumber) {
    return `
📱 M-PESA PAYMENT

Order #: ${orderNumber}
Amount: KES ${Math.ceil(amount * 130)} (~$${amount.toFixed(2)})

📲 PAYMENT INSTRUCTIONS:

1. Check your phone (${phoneNumber})
2. You'll receive an M-Pesa prompt
3. Enter your M-Pesa PIN
4. Confirm payment

⏰ Prompt expires in 60 seconds
🔄 Processing usually takes 5-10 seconds

✅ You'll receive confirmation once payment is complete.

Having issues? Reply HELP
`;
  }

  /**
   * Initiate Orange Money payment
   * Works in: Senegal, Mali, Burkina Faso, Ivory Coast, etc.
   */
  static async initiateOrangeMoneyPayment(phoneNumber, amount, orderNumber) {
    try {
      // Get Orange Money access token
      const token = await this.getOrangeMoneyToken();

      // Format phone number (international format without +)
      const formattedPhone = phoneNumber.replace(/\+/g, '');

      const response = await axios.post(
        `${process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com/orange-money-webpay/dev/v1'}/webpayment`,
        {
          merchant_key: process.env.ORANGE_MONEY_MERCHANT_KEY,
          currency: 'XOF', // West African CFA franc
          order_id: orderNumber,
          amount: Math.ceil(amount * 655), // Convert USD to XOF
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
          notif_url: `${process.env.FRONTEND_URL}/api/orange/callback`,
          lang: 'en',
          reference: orderNumber
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        provider: 'Orange Money',
        paymentUrl: response.data.payment_url,
        transactionId: response.data.pay_token,
        message: this.generateOrangeMoneyMessage(response.data.payment_url, amount, orderNumber)
      };
    } catch (error) {
      console.error('Orange Money payment error:', error.response?.data || error.message);
      return {
        success: false,
        provider: 'Orange Money',
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get Orange Money access token
   */
  static async getOrangeMoneyToken() {
    try {
      const auth = Buffer.from(
        `${process.env.ORANGE_MONEY_CLIENT_ID}:${process.env.ORANGE_MONEY_CLIENT_SECRET}`
      ).toString('base64');

      const response = await axios.post(
        'https://api.orange.com/oauth/v3/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to get Orange Money access token');
    }
  }

  /**
   * Generate Orange Money payment message
   */
  static generateOrangeMoneyMessage(paymentUrl, amount, orderNumber) {
    return `
🍊 ORANGE MONEY PAYMENT

Order #: ${orderNumber}
Amount: XOF ${Math.ceil(amount * 655)} (~$${amount.toFixed(2)})

📲 PAYMENT INSTRUCTIONS:

Click the link below to pay:
${paymentUrl}

OR

1. Dial #144# on your Orange phone
2. Select "Pay merchant"
3. Enter merchant code
4. Enter amount: ${Math.ceil(amount * 655)}
5. Enter your Orange Money PIN

✅ You'll receive confirmation once payment is complete.

Having issues? Reply HELP
`;
  }

  /**
   * Initiate Tigo Pesa payment (Tanzania)
   */
  static async initiateTigoPesaPayment(phoneNumber, amount, orderNumber) {
    try {
      // Format phone number (255712345678)
      const formattedPhone = phoneNumber.replace(/\+/g, '').replace(/^0/, '255');

      const response = await axios.post(
        `${process.env.TIGO_PESA_API_URL || 'https://developer.tigo.com/api'}/payment/v1/authorize`,
        {
          CustomerMSISDN: formattedPhone,
          BillerMSISDN: process.env.TIGO_PESA_BILLER_MSISDN,
          BillerCode: process.env.TIGO_PESA_BILLER_CODE,
          Amount: Math.ceil(amount * 2300), // Convert USD to TZS
          Remarks: `Payment for Order ${orderNumber}`,
          ReferenceID: orderNumber
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TIGO_PESA_API_KEY}`
          }
        }
      );

      return {
        success: true,
        provider: 'Tigo Pesa',
        transactionId: response.data.TransactionID,
        message: this.generateTigoPesaMessage(formattedPhone, amount, orderNumber)
      };
    } catch (error) {
      console.error('Tigo Pesa payment error:', error.response?.data || error.message);
      return {
        success: false,
        provider: 'Tigo Pesa',
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Generate Tigo Pesa payment message
   */
  static generateTigoPesaMessage(phoneNumber, amount, orderNumber) {
    return `
💙 TIGO PESA PAYMENT

Order #: ${orderNumber}
Amount: TZS ${Math.ceil(amount * 2300)} (~$${amount.toFixed(2)})

📲 PAYMENT INSTRUCTIONS:

1. Check your phone (${phoneNumber})
2. You'll receive a Tigo Pesa prompt
3. Enter your Tigo Pesa PIN
4. Confirm payment

OR Dial manually:

1. Dial *150*01#
2. Select "Make Payment"
3. Enter Biller Code: ${process.env.TIGO_PESA_BILLER_CODE || 'MUNTUSHOP'}
4. Enter amount: ${Math.ceil(amount * 2300)}
5. Enter your PIN

✅ You'll receive confirmation once payment is complete.

Having issues? Reply HELP
`;
  }

  /**
   * Get payment method selection menu
   */
  static getPaymentMethodMenu(total) {
    return `
💳 SELECT PAYMENT METHOD

Order Total: $${total.toFixed(2)}

Choose your payment method:

1️⃣  💳  Stripe (Card) - Instant
    Visa, Mastercard, Amex

2️⃣  📱  M-Pesa (Kenya)
    KES ${Math.ceil(total * 130)}

3️⃣  🍊  Orange Money
    XOF ${Math.ceil(total * 655)}

4️⃣  💙  Tigo Pesa (Tanzania)
    TZS ${Math.ceil(total * 2300)}

0️⃣  ⬅️  Back

Reply with number

💡 All methods are secure and instant!
`;
  }

  /**
   * Handle payment callback verification
   */
  static async verifyMpesaCallback(callbackData) {
    try {
      const resultCode = callbackData.Body?.stkCallback?.ResultCode;
      const checkoutRequestId = callbackData.Body?.stkCallback?.CheckoutRequestID;

      if (resultCode === 0) {
        // Payment successful
        const metadata = callbackData.Body.stkCallback.CallbackMetadata.Item;
        const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        const amount = metadata.find(item => item.Name === 'Amount')?.Value;
        const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

        return {
          success: true,
          provider: 'M-Pesa',
          transactionId: mpesaReceiptNumber,
          amount,
          phoneNumber,
          checkoutRequestId
        };
      } else {
        // Payment failed
        return {
          success: false,
          provider: 'M-Pesa',
          error: callbackData.Body?.stkCallback?.ResultDesc,
          checkoutRequestId
        };
      }
    } catch (error) {
      console.error('M-Pesa callback verification error:', error);
      return { success: false, error: 'Invalid callback data' };
    }
  }

  /**
   * Check if mobile money is configured
   */
  static isConfigured(provider) {
    switch (provider) {
      case 'mpesa':
        return !!(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET);
      case 'orange':
        return !!(process.env.ORANGE_MONEY_CLIENT_ID && process.env.ORANGE_MONEY_CLIENT_SECRET);
      case 'tigo':
        return !!(process.env.TIGO_PESA_API_KEY && process.env.TIGO_PESA_BILLER_CODE);
      default:
        return false;
    }
  }

  /**
   * Get available payment methods
   */
  static getAvailablePaymentMethods() {
    const methods = [
      { id: 'stripe', name: 'Card Payment (Stripe)', icon: '💳', available: true }
    ];

    if (this.isConfigured('mpesa')) {
      methods.push({ id: 'mpesa', name: 'M-Pesa', icon: '📱', available: true });
    }

    if (this.isConfigured('orange')) {
      methods.push({ id: 'orange', name: 'Orange Money', icon: '🍊', available: true });
    }

    if (this.isConfigured('tigo')) {
      methods.push({ id: 'tigo', name: 'Tigo Pesa', icon: '💙', available: true });
    }

    return methods;
  }
}

module.exports = MobileMoneyService;
