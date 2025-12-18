/**
 * Express Server Example with WhatsApp Integration
 * This is a basic example showing how to integrate WhatsApp with Express
 */

const express = require("express");
const bodyParser = require("body-parser");
const { sendMessage, startReceivingNotifications, setWebhookUrl } = require("./whatsapp_service");
const AIAgent = require("./services/aiAgent");
const PaymentService = require("./services/paymentService");
const IPTVPlaylistService = require("./services/iptvPlaylistService");
const IPTVCredentialService = require("./services/iptvCredentialService");
const ProductService = require("./services/productService");
const MobileMoneyService = require("./services/mobileMoneyService");
const OrderService = require("./services/orderService");
const StripeRefundService = require("./services/stripeRefundService");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Stripe webhook needs raw body for signature verification
app.post('/api/stripe/webhook',
    bodyParser.raw({ type: 'application/json' }),
    async (req, res) => {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        try {
            const result = await PaymentService.handleWebhook(
                req.body,
                sig,
                webhookSecret
            );

            // Send confirmation message to user if payment succeeded
            if (result.phoneNumber && result.message) {
                console.log(`📤 Sending payment confirmation to ${result.phoneNumber}`);
                // Format phone number for WhatsApp (add @c.us if not present)
                const chatId = result.phoneNumber.includes('@')
                    ? result.phoneNumber
                    : `${result.phoneNumber}@c.us`;
                const sendResult = await sendMessage(chatId, result.message);
                if (sendResult.success) {
                    console.log(`✅ Payment confirmation sent successfully`);
                } else {
                    console.error(`❌ Failed to send payment confirmation:`, sendResult.error);
                }
            }

            res.json({ received: true });
        } catch (error) {
            console.error('Stripe webhook error:', error);
            res.status(400).send(`Webhook Error: ${error.message}`);
        }
    }
);

// M-Pesa callback endpoint
app.post('/api/mpesa/callback', bodyParser.json(), async (req, res) => {
    try {
        console.log('📱 M-Pesa callback received:', JSON.stringify(req.body, null, 2));

        const result = await MobileMoneyService.verifyMpesaCallback(req.body);

        if (result.success) {
            // Update order status
            await OrderService.updatePaymentStatus(
                result.checkoutRequestId,
                'paid',
                result.transactionId
            );

            // Send confirmation to customer
            if (result.phoneNumber) {
                await sendMessage(
                    `${result.phoneNumber}@c.us`,
                    `✅ Payment received!\n\nM-Pesa Receipt: ${result.transactionId}\nAmount: KES ${result.amount}\n\nYour order is being processed.\n\nType MENU for main menu`
                );
            }
        }

        res.json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (error) {
        console.error('❌ M-Pesa callback error:', error);
        res.status(500).json({ ResultCode: 1, ResultDesc: 'Failed' });
    }
});

// Orange Money callback endpoint
app.post('/api/orange/callback', bodyParser.json(), async (req, res) => {
    try {
        console.log('🍊 Orange Money callback received:', JSON.stringify(req.body, null, 2));

        const { order_id, status, pay_token } = req.body;

        if (status === 'SUCCESS') {
            // Update order status
            await OrderService.updatePaymentStatus(order_id, 'paid', pay_token);

            console.log(`✅ Orange Money payment confirmed for order ${order_id}`);
        }

        res.json({ status: 'OK' });
    } catch (error) {
        console.error('❌ Orange Money callback error:', error);
        res.status(500).json({ status: 'ERROR' });
    }
});

// Tigo Pesa callback endpoint
app.post('/api/tigo/callback', bodyParser.json(), async (req, res) => {
    try {
        console.log('💙 Tigo Pesa callback received:', JSON.stringify(req.body, null, 2));

        const { ReferenceID, TransactionID, Status } = req.body;

        if (Status === 'SUCCESS') {
            // Update order status
            await OrderService.updatePaymentStatus(ReferenceID, 'paid', TransactionID);

            console.log(`✅ Tigo Pesa payment confirmed for order ${ReferenceID}`);
        }

        res.json({ ResponseCode: '0', ResponseDescription: 'Success' });
    } catch (error) {
        console.error('❌ Tigo Pesa callback error:', error);
        res.status(500).json({ ResponseCode: '1', ResponseDescription: 'Failed' });
    }
});

// ========================================
// REFUND & DISPUTE ENDPOINTS
// ========================================

// Create refund for an order
app.post('/api/refund/create', bodyParser.json(), async (req, res) => {
    try {
        const { orderNumber, amount, reason, type } = req.body;

        let result;
        if (type === 'full') {
            result = await StripeRefundService.createFullRefund(orderNumber, reason);
        } else {
            result = await StripeRefundService.createPartialRefund(orderNumber, amount, reason);
        }

        if (result.success) {
            // Send confirmation to customer
            const orderInfo = await OrderService.getOrderByNumber(orderNumber);
            if (orderInfo && orderInfo.user_id) {
                const userResult = await OrderService.pool.query(
                    'SELECT phone FROM users WHERE id = $1',
                    [orderInfo.user_id]
                );
                if (userResult.rows.length > 0) {
                    const phone = userResult.rows[0].phone;
                    const message = StripeRefundService.generateRefundMessage(
                        orderNumber,
                        parseFloat(amount || result.refund.amount / 100),
                        result.refundId
                    );
                    await sendMessage(phone, message);
                }
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Refund API error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Release escrow payment
app.post('/api/escrow/release', bodyParser.json(), async (req, res) => {
    try {
        const { orderNumber } = req.body;
        const result = await StripeRefundService.releaseEscrowPayment(orderNumber);

        if (result.success) {
            // Notify customer
            const orderInfo = await OrderService.getOrderByNumber(orderNumber);
            if (orderInfo && orderInfo.user_id) {
                const userResult = await OrderService.pool.query(
                    'SELECT phone FROM users WHERE id = $1',
                    [orderInfo.user_id]
                );
                if (userResult.rows.length > 0) {
                    const phone = userResult.rows[0].phone;
                    const message = StripeRefundService.generateEscrowReleaseMessage(orderNumber);
                    await sendMessage(phone, message);
                }
            }
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get dispute information
app.get('/api/dispute/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const result = await StripeRefundService.getDisputeInfo(orderNumber);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit dispute evidence
app.post('/api/dispute/submit-evidence', bodyParser.json(), async (req, res) => {
    try {
        const { disputeId, evidence } = req.body;
        const result = await StripeRefundService.submitDisputeEvidence(disputeId, evidence);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Auto-release expired escrow payments (cron job endpoint)
app.post('/api/cron/release-escrow', bodyParser.json(), async (req, res) => {
    try {
        console.log('🔄 Running auto-release escrow job...');

        const result = await StripeRefundService.autoReleaseExpiredEscrow();

        if (result.success && result.count > 0) {
            console.log(`✅ Released ${result.count} orders:`, result.releasedOrders);

            // Send WhatsApp notifications to customers
            for (const orderNumber of result.releasedOrders) {
                try {
                    // Get order details to find customer phone
                    const pool = require('./backend/src/config/database');
                    const orderResult = await pool.query(
                        'SELECT user_id FROM orders WHERE order_number = $1',
                        [orderNumber]
                    );

                    if (orderResult.rows.length > 0) {
                        const phone = orderResult.rows[0].user_id;
                        const message = StripeRefundService.generateEscrowReleaseMessage(orderNumber);
                        await sendMessage(phone, message);
                    }
                } catch (notifyError) {
                    console.error(`Failed to notify customer for ${orderNumber}:`, notifyError.message);
                }
            }
        } else {
            console.log('ℹ️ No escrow payments to release');
        }

        res.json({
            success: true,
            releasedCount: result.count || 0,
            orders: result.releasedOrders || []
        });
    } catch (error) {
        console.error('❌ Escrow auto-release error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Middleware for other routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "MuntuShop WhatsApp API Server",
        version: "2.0.0",
        endpoints: {
            test: "/test - Test sending messages",
            send: "POST /api/whatsapp/send - Send a message",
            webhook: "POST /api/whatsapp/webhook - Receive webhooks",
            stripeWebhook: "POST /api/stripe/webhook - Stripe payment webhooks",
            mpesaCallback: "POST /api/mpesa/callback - M-Pesa payment callbacks",
            orangeCallback: "POST /api/orange/callback - Orange Money callbacks",
            tigoCallback: "POST /api/tigo/callback - Tigo Pesa callbacks",
            iptvPlaylist: "GET /iptv/playlist/:token.m3u - Custom IPTV playlists",
            iptvInfo: "GET /iptv/info/:token - Subscription information",
            refundCreate: "POST /api/refund/create - Create refund",
            escrowRelease: "POST /api/escrow/release - Release escrow payment",
            disputeInfo: "GET /api/dispute/:orderNumber - Get dispute info",
            disputeEvidence: "POST /api/dispute/submit-evidence - Submit dispute evidence",
            cronEscrowRelease: "POST /api/cron/release-escrow - Auto-release expired escrow (cron)"
        },
        paymentMethods: {
            stripe: "Card payments (Visa, Mastercard, Amex)",
            mpesa: "M-Pesa (Kenya)",
            orange: "Orange Money (West Africa)",
            tigo: "Tigo Pesa (Tanzania)"
        }
    });
});

// Serve test page
app.get("/test", (req, res) => {
    res.sendFile(__dirname + "/test_send.html");
});

// Send message endpoint
app.post("/api/whatsapp/send", async (req, res) => {
    try {
        const { chatId, message } = req.body;

        if (!chatId || !message) {
            return res.status(400).json({
                success: false,
                error: "chatId and message are required",
            });
        }

        const result = await sendMessage(chatId, message);

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// Webhook endpoint for receiving messages (if using webhook mode)
app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
        const body = req.body;
        console.log("📥 Webhook received:", JSON.stringify(body, null, 2));

        // Send immediate response to Green API (required)
        res.status(200).json({
            received: true,
            timestamp: new Date().toISOString()
        });

        // Process incoming message asynchronously
        if (body.typeWebhook === "incomingMessageReceived") {
            // Use the handleIncomingMessage function
            await handleIncomingMessage(body);
        } else if (body.typeWebhook === "outgoingMessageStatus") {
            console.log("📤 Outgoing message status:", body.status);
        } else if (body.typeWebhook === "stateInstanceChanged") {
            console.log("📊 Instance state changed:", body.stateInstance);
        } else {
            console.log("ℹ️  Webhook type:", body.typeWebhook);
        }
    } catch (error) {
        console.error("❌ Webhook error:", error);
        // Don't send error response if headers already sent
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

// IPTV Playlist endpoint - Serves custom M3U playlists
app.get("/iptv/playlist/:token.m3u", async (req, res) => {
    try {
        const token = req.params.token;
        console.log(`📺 IPTV playlist requested: ${token}`);

        // Generate playlist for this token
        const playlist = await IPTVPlaylistService.generatePlaylist(token);

        // Get subscription info for logging
        const info = IPTVPlaylistService.getSubscriptionInfo(token);
        if (info) {
            console.log(`✅ Serving ${info.packageTier} playlist (${info.channelCount} channels)`);
        }

        // Set headers for M3U file
        res.setHeader('Content-Type', 'audio/x-mpegurl');
        res.setHeader('Content-Disposition', `attachment; filename="muntushop_${token}.m3u"`);
        res.setHeader('Cache-Control', 'no-cache');

        res.send(playlist);
    } catch (error) {
        console.error("❌ Playlist error:", error);
        res.status(error.message === 'Invalid token' ? 404 :
                   error.message === 'Subscription expired' ? 410 : 500)
           .send(`# Error: ${error.message}\n# Please contact support`);
    }
});

// IPTV Subscription info endpoint
app.get("/iptv/info/:token", async (req, res) => {
    try {
        const token = req.params.token;
        const info = IPTVPlaylistService.getSubscriptionInfo(token);

        if (!info) {
            return res.status(404).json({ error: 'Subscription not found or expired' });
        }

        res.json({
            package: info.packageTier,
            channels: info.channelCount,
            expiresAt: info.expiresAt,
            daysRemaining: info.daysRemaining,
            playlistUrl: IPTVPlaylistService.generatePlaylistUrlFromToken(token)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// IPTV Xtream Codes API Endpoints
// For VLC, IPTV Smarters, and other apps
// ========================================

// Xtream Codes authentication endpoint
app.get("/iptv/player_api.php", (req, res) => {
    const { username, password } = req.query;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const validation = IPTVCredentialService.validateCredentials(username, password);

    if (!validation.valid) {
        return res.status(401).json({
            error: validation.error,
            message: 'Invalid credentials or subscription expired'
        });
    }

    const customer = validation.customer;
    const serverUrl = req.protocol + '://' + req.get('host');

    // Return Xtream Codes format user info
    res.json({
        user_info: {
            username: customer.username,
            password: password,
            message: 'Active',
            auth: 1,
            status: 'Active',
            exp_date: Math.floor(customer.expiresAt.getTime() / 1000).toString(),
            is_trial: '0',
            active_cons: '1',
            created_at: Math.floor(new Date(customer.username).getTime() / 1000).toString(),
            max_connections: '1',
            allowed_output_formats: ['m3u8', 'ts', 'rtmp']
        },
        server_info: {
            url: serverUrl + '/iptv',
            port: '80',
            https_port: '443',
            server_protocol: req.protocol,
            rtmp_port: '1935',
            timezone: 'Europe/Oslo',
            timestamp_now: Math.floor(Date.now() / 1000)
        }
    });
});

// M3U playlist endpoint for customer credentials
app.get("/iptv/live/:username/:password/playlist.m3u", async (req, res) => {
    try {
        const { username, password } = req.params;

        const validation = IPTVCredentialService.validateCredentials(username, password);

        if (!validation.valid) {
            return res.status(401).send(`# Error: ${validation.error}\n# Please contact support or renew subscription`);
        }

        const customer = validation.customer;
        const channelLimit = customer.channelLimit;

        // Generate M3U playlist
        let playlist = '#EXTM3U\n';
        playlist += `#EXTINF:-1,MuntuShop IPTV - ${customer.packageTier} Package\n`;
        playlist += `#EXTINF:-1,${channelLimit} Channels for ${customer.username}\n`;
        playlist += `#EXTINF:-1,Valid until ${customer.expiresAt.toLocaleDateString()}\n`;
        playlist += '\n';

        // Add sample channels based on tier
        const categories = ['Sports', 'Movies', 'News', 'Entertainment', 'Kids', 'International'];
        const sampleChannels = ['Sky Sports', 'ESPN', 'HBO', 'CNN', 'MTV', 'Disney'];

        let channelCount = 0;
        while (channelCount < channelLimit && channelCount < 50) {
            const category = categories[Math.floor(channelCount / 10) % categories.length];
            const channel = sampleChannels[channelCount % sampleChannels.length];

            playlist += `#EXTINF:-1 tvg-id="${channelCount + 1}" tvg-name="${channel} ${channelCount + 1}" group-title="${category}",${channel} ${channelCount + 1}\n`;
            playlist += `# Channel ${channelCount + 1} - ${customer.packageTier} tier\n`;

            channelCount++;
        }

        playlist += `\n# ${channelLimit} total channels available\n`;
        playlist += `# Subscription expires: ${customer.expiresAt.toLocaleDateString()}\n`;

        res.setHeader('Content-Type', 'audio/x-mpegurl');
        res.setHeader('Content-Disposition', `attachment; filename="${customer.username}.m3u"`);
        res.send(playlist);

    } catch (error) {
        console.error('Playlist generation error:', error);
        res.status(500).send(`# Error generating playlist\n# Contact support`);
    }
});

// Get live stream categories
app.get("/iptv/player_api.php", (req, res) => {
    const { username, password, action } = req.query;

    if (!username || !password) {
        return res.status(400).json({ error: 'Credentials required' });
    }

    const validation = IPTVCredentialService.validateCredentials(username, password);

    if (!validation.valid) {
        return res.status(401).json({ error: validation.error });
    }

    if (action === 'get_live_categories') {
        return res.json([
            { category_id: '1', category_name: 'Sports', parent_id: 0 },
            { category_id: '2', category_name: 'Movies', parent_id: 0 },
            { category_id: '3', category_name: 'News', parent_id: 0 },
            { category_id: '4', category_name: 'Entertainment', parent_id: 0 },
            { category_id: '5', category_name: 'Kids', parent_id: 0 },
            { category_id: '6', category_name: 'International', parent_id: 0 }
        ]);
    }

    if (action === 'get_live_streams') {
        const customer = validation.customer;
        const channels = [];

        // Generate sample channels based on tier
        for (let i = 1; i <= Math.min(customer.channelLimit, 50); i++) {
            channels.push({
                num: i,
                name: `Channel ${i}`,
                stream_type: 'live',
                stream_id: i,
                stream_icon: '',
                epg_channel_id: '',
                added: Math.floor(Date.now() / 1000).toString(),
                category_id: ((i % 6) + 1).toString(),
                custom_sid: '',
                tv_archive: 0,
                direct_source: '',
                tv_archive_duration: 0
            });
        }

        return res.json(channels);
    }

    // Default response
    res.json({
        user_info: validation.customer,
        server_info: {
            url: req.protocol + '://' + req.get('host') + '/iptv',
            port: '80'
        }
    });
});

// Initialize database and seed products
async function initializeDatabase() {
    try {
        console.log('🗄️  Initializing database...');
        await ProductService.seedProducts();
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        console.log('⚠️  Server will continue, but shopping may not work');
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 MuntuShop WhatsApp Server running on port ${PORT}`);
    console.log(`📱 Instance ID: ${process.env.GREEN_ID_INSTANCE}`);
    console.log(`🌐 API: http://localhost:${PORT}`);
    console.log(`📨 Send message: POST http://localhost:${PORT}/api/whatsapp/send`);

    // Initialize database
    await initializeDatabase();

    // Start receiving WhatsApp notifications
    startWhatsAppAgent();
});

// WhatsApp Agent - Handles incoming messages
async function startWhatsAppAgent() {
    try {
        console.log("🤖 Starting WhatsApp Agent...");

        // Configure webhook URL automatically
        const webhookUrl = process.env.FRONTEND_URL || "https://muntushop-production-f2ffb28d626e.herokuapp.com";
        const fullWebhookUrl = `${webhookUrl}/api/whatsapp/webhook`;

        try {
            console.log("📡 Configuring webhook URL...");
            const result = await setWebhookUrl(fullWebhookUrl);
            if (result.success) {
                console.log("✅ Webhook URL configured successfully!");
                console.log(`📌 Webhook: ${fullWebhookUrl}`);
            } else {
                console.log("⚠️  Could not configure webhook automatically");
                console.log(`📌 Please configure manually: ${fullWebhookUrl}`);
            }
        } catch (webhookError) {
            console.log("⚠️  Webhook configuration skipped");
        }

        // Use webhook endpoint mode (recommended for production)
        console.log("✅ WhatsApp Agent ready (webhook endpoint mode)!");
        console.log("💡 All incoming messages will be processed via webhook endpoint");

        // Note: If you want to enable polling mode, uncomment the code below
        // and ensure your Green API account supports it
        /*
        try {
            await startReceivingNotifications(
                (message) => {
                    console.log("📩 Incoming message:", message);
                    handleIncomingMessage(message);
                },
                (status) => {
                    console.log("📊 Status update:", status);
                }
            );
            console.log("✅ Polling mode activated!");
        } catch (webhookError) {
            console.log("⚠️  Polling mode not available, using webhook endpoint");
        }
        */
    } catch (error) {
        console.error("❌ Error starting WhatsApp Agent:", error.message);
        console.log("💡 Webhook endpoint is still available at POST /api/whatsapp/webhook");
    }
}

// Handle incoming WhatsApp messages with AI
async function handleIncomingMessage(body) {
    try {
        const sender = body.senderData?.sender;
        const messageText = body.messageData?.textMessageData?.textMessage;

        if (!sender || !messageText) return;

        console.log(`💬 Message from ${sender}: ${messageText}`);

        // Process message with AI agent
        const response = await AIAgent.processMessage(sender, messageText);

        // Send response back to user
        if (response) {
            console.log(`🤖 AI Response: ${response.substring(0, 100)}...`);
            await sendMessage(sender, response);
        }
    } catch (error) {
        console.error("❌ Error handling message:", error);

        // Send fallback error message
        try {
            await sendMessage(sender,
                "⚠️ Sorry, I encountered an error. Please try again!\n\n" +
                "Type MENU for main menu\n" +
                "Type HELP for assistance"
            );
        } catch (sendError) {
            console.error("❌ Failed to send error message:", sendError);
        }
    }
}

