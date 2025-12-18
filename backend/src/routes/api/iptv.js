/**
 * IPTV API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// Get IPTV plans
router.get('/plans', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM iptv_plans WHERE is_active = true ORDER BY price ASC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching IPTV plans:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user subscription
router.get('/subscription', async (req, res) => {
  try {
    const userId = req.query.user_id;
    
    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    const result = await db.query(`
      SELECT s.*, p.name as plan_name, p.channels_count, p.features
      FROM iptv_subscriptions s
      JOIN iptv_plans p ON s.plan_id = p.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ subscription: null });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

