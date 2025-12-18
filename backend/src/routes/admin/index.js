/**
 * Admin API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Get basic stats
    const usersCount = await db.query('SELECT COUNT(*) FROM users');
    const ordersCount = await db.query('SELECT COUNT(*) FROM orders');
    const revenueResult = await db.query(`
      SELECT COALESCE(SUM(total), 0) as total 
      FROM orders 
      WHERE payment_status = 'paid'
    `);
    
    res.json({
      users: parseInt(usersCount.rows[0].count),
      orders: parseInt(ordersCount.rows[0].count),
      revenue: parseFloat(revenueResult.rows[0].total)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, phone, name, email, created_at, is_active FROM users ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

