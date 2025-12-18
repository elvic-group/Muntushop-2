/**
 * Payments API Routes
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../../services/payments');

// Create checkout session
router.post('/create-session', async (req, res) => {
  try {
    const { userId, serviceType, amount, metadata } = req.body;
    
    if (!userId || !serviceType || !amount) {
      return res.status(400).json({ error: 'userId, serviceType, and amount are required' });
    }
    
    const paymentUrl = await paymentService.createCheckoutSession(
      userId,
      serviceType,
      amount,
      metadata || {}
    );
    
    res.json({ paymentUrl });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get payment history
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.user_id;
    
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    const db = require('../../config/database');
    const result = await db.query(`
      SELECT * FROM payments 
      WHERE user_id = $1 
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single payment
router.get('/:id', async (req, res) => {
  try {
    const db = require('../../config/database');
    const result = await db.query(
      'SELECT * FROM payments WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

