/**
 * Cart API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// Get user cart
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id;
    
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    const result = await db.query(
      'SELECT * FROM carts WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        items: [],
        total: 0,
        subtotal: 0,
        shipping: 0
      });
    }
    
    const cart = result.rows[0];
    if (typeof cart.items === 'string') {
      cart.items = JSON.parse(cart.items);
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

