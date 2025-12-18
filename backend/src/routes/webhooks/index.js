/**
 * Webhook Routes
 * Handle incoming webhooks from Green API and Stripe
 */

const express = require("express");
const router = express.Router();
const whatsappHandler = require("../../services/greenapi/handler");
const paymentService = require("../../services/payments");
const stripe = require("../../config/stripe");

// Green API webhook
router.post("/greenapi", async (req, res) => {
  try {
    console.log("Green API webhook received:", req.body.typeWebhook);

    await whatsappHandler.handleIncomingMessage(req.body);

    res.sendStatus(200);
  } catch (error) {
    console.error("Green API webhook error:", error);
    res.sendStatus(500);
  }
});

// Stripe webhook
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("Missing stripe-signature header");
      return res.status(400).send("Missing stripe-signature header");
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).send("Webhook secret not configured");
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      console.log("Stripe webhook received:", event.type);

      await paymentService.handleWebhook(event);

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

module.exports = router;
