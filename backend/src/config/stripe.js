/**
 * Stripe Configuration
 * Payment processing setup
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ Stripe secret key missing! Set STRIPE_SECRET_KEY in .env');
  // Return a dummy object to prevent crashes
  module.exports = {
    checkout: {
      sessions: {
        create: async () => {
          throw new Error('Stripe not configured');
        }
      }
    },
    webhooks: {
      constructEvent: () => {
        throw new Error('Stripe not configured');
      }
    }
  };
} else {
  const stripe = Stripe(stripeSecretKey);
  module.exports = stripe;
}

