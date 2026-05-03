/**
 * Authentication Middleware
 * Verifies Bearer tokens for protected API routes.
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.status = 500;
    throw error;
  }

  return process.env.JWT_SECRET;
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization token is required',
        code: 'AUTH_TOKEN_REQUIRED'
      });
    }

    const token = authHeader.slice(7).trim();
    const payload = jwt.verify(token, getJwtSecret());

    const result = await db.query(
      `SELECT id, uuid, phone, name, email, language, timezone, current_service,
              current_step, session_data, preferences, is_active, is_verified,
              email_verified, phone_verified, last_seen_at, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        error: 'User account is inactive',
        code: 'AUTH_USER_INACTIVE'
      });
    }

    req.auth = {
      token,
      userId: payload.userId
    };
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'AUTH_INVALID_TOKEN'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
}

module.exports = {
  requireAuth
};
