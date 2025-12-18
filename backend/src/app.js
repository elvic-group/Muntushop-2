/**
 * MuntuShop Platform - Main Express Application
 * Complete multi-service WhatsApp platform
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/v1/auth', require('./routes/api/auth'));
app.use('/api/v1/products', require('./routes/api/products'));
app.use('/api/v1/orders', require('./routes/api/orders'));
app.use('/api/v1/cart', require('./routes/api/cart'));
app.use('/api/v1/messaging', require('./routes/api/messaging'));
app.use('/api/v1/support', require('./routes/api/support'));
app.use('/api/v1/appointments', require('./routes/api/appointments'));
app.use('/api/v1/groups', require('./routes/api/groups'));
app.use('/api/v1/money', require('./routes/api/money'));
app.use('/api/v1/courses', require('./routes/api/courses'));
app.use('/api/v1/news', require('./routes/api/news'));
app.use('/api/v1/marketing', require('./routes/api/marketing'));
app.use('/api/v1/b2b', require('./routes/api/b2b'));
app.use('/api/v1/iptv', require('./routes/api/iptv'));
app.use('/api/v1/payments', require('./routes/api/payments'));

// Admin Routes
app.use('/api/v1/admin', require('./routes/admin'));

// Webhooks
app.use('/webhooks', require('./routes/webhooks'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Something went wrong!' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 MuntuShop Platform Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Green API Instance: ${process.env.GREEN_ID_INSTANCE || 'Not configured'}`);
});

module.exports = app;

