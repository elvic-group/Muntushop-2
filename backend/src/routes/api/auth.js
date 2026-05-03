/**
 * Auth API Routes
 * Registration, login, and current-user endpoints for the web dashboard.
 */

const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.status = 500;
    throw error;
  }

  return process.env.JWT_SECRET;
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      phone: user.phone
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    uuid: user.uuid,
    phone: user.phone,
    name: user.name,
    email: user.email,
    language: user.language,
    timezone: user.timezone,
    current_service: user.current_service,
    current_step: user.current_step,
    session_data: user.session_data,
    preferences: user.preferences,
    is_active: user.is_active,
    is_verified: user.is_verified,
    email_verified: user.email_verified,
    phone_verified: user.phone_verified,
    last_seen_at: user.last_seen_at,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildPasswordResetResponse(message, resetToken, resetExpiresAt) {
  if (process.env.NODE_ENV === 'production') {
    return { message };
  }

  return {
    message,
    resetToken,
    resetExpiresAt
  };
}

async function findUserByIdentifier(identifier) {
  const normalized = String(identifier || '').trim().toLowerCase();

  return db.query(
    `SELECT id, uuid, phone, name, email, password_hash, language, timezone,
            current_service, current_step, session_data, preferences,
            is_active, is_verified, email_verified, phone_verified,
            last_seen_at, created_at, updated_at,
            reset_password_token_hash, reset_password_expires_at
     FROM users
     WHERE LOWER(email) = $1 OR phone = $2
     LIMIT 1`,
    [normalized, String(identifier || '').trim()]
  );
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!email || !phone || !password) {
      return res.status(400).json({
        error: 'email, phone, and password are required',
        code: 'AUTH_MISSING_FIELDS'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'AUTH_WEAK_PASSWORD'
      });
    }

    const existingUser = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = $1 OR phone = $2 LIMIT 1',
      [normalizedEmail, normalizedPhone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'A user with that email or phone already exists',
        code: 'AUTH_USER_EXISTS'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, last_seen_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, uuid, phone, name, email, language, timezone, current_service,
                 current_step, session_data, preferences, is_active, is_verified,
                 email_verified, phone_verified, last_seen_at, created_at, updated_at`,
      [name ? String(name).trim() : null, normalizedEmail, normalizedPhone, passwordHash]
    );

    const user = result.rows[0];
    const token = createToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Registration failed',
      code: 'AUTH_REGISTER_ERROR'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const loginIdentifier = identifier || email || phone;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        error: 'identifier and password are required',
        code: 'AUTH_MISSING_CREDENTIALS'
      });
    }

    const result = await findUserByIdentifier(loginIdentifier);

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'AUTH_INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash || '');

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'AUTH_INVALID_CREDENTIALS'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'User account is inactive',
        code: 'AUTH_USER_INACTIVE'
      });
    }

    await db.query(
      'UPDATE users SET last_seen_at = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    const refreshedUserResult = await db.query(
      `SELECT id, uuid, phone, name, email, language, timezone, current_service,
              current_step, session_data, preferences, is_active, is_verified,
              email_verified, phone_verified, last_seen_at, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [user.id]
    );

    const refreshedUser = refreshedUserResult.rows[0];
    const token = createToken(refreshedUser);

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(refreshedUser)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Login failed',
      code: 'AUTH_LOGIN_ERROR'
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, phone, identifier } = req.body;
    const lookupIdentifier = identifier || email || phone;

    if (!lookupIdentifier) {
      return res.status(400).json({
        error: 'identifier is required',
        code: 'AUTH_MISSING_IDENTIFIER'
      });
    }

    const result = await findUserByIdentifier(lookupIdentifier);
    const defaultMessage = 'If the account exists, a password reset token has been created.';

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.json({ message: defaultMessage });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashResetToken(resetToken);

    const updateResult = await db.query(
      `UPDATE users
       SET reset_password_token_hash = $1,
           reset_password_expires_at = NOW() + INTERVAL '1 hour',
           updated_at = NOW()
       WHERE id = $2
       RETURNING reset_password_expires_at`,
      [resetTokenHash, user.id]
    );

    return res.json(
      buildPasswordResetResponse(
        defaultMessage,
        resetToken,
        updateResult.rows[0].reset_password_expires_at
      )
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Password reset request failed',
      code: 'AUTH_FORGOT_PASSWORD_ERROR'
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'token and password are required',
        code: 'AUTH_MISSING_RESET_FIELDS'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long',
        code: 'AUTH_WEAK_PASSWORD'
      });
    }

    const result = await db.query(
      `SELECT id, uuid, phone, name, email, language, timezone, current_service,
              current_step, session_data, preferences, is_active, is_verified,
              email_verified, phone_verified, last_seen_at, created_at, updated_at
       FROM users
       WHERE reset_password_token_hash = $1
         AND reset_password_expires_at > NOW()
       LIMIT 1`,
      [hashResetToken(String(token).trim())]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'AUTH_INVALID_RESET_TOKEN'
      });
    }

    const user = result.rows[0];
    const passwordHash = await bcrypt.hash(password, 12);

    const updatedUserResult = await db.query(
      `UPDATE users
       SET password_hash = $1,
           reset_password_token_hash = NULL,
           reset_password_expires_at = NULL,
           last_seen_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, uuid, phone, name, email, language, timezone, current_service,
                 current_step, session_data, preferences, is_active, is_verified,
                 email_verified, phone_verified, last_seen_at, created_at, updated_at`,
      [passwordHash, user.id]
    );

    const updatedUser = updatedUserResult.rows[0];
    const authToken = createToken(updatedUser);

    res.json({
      message: 'Password reset successful',
      token: authToken,
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'Password reset failed',
      code: 'AUTH_RESET_PASSWORD_ERROR'
    });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({
    user: sanitizeUser(req.user)
  });
});

module.exports = router;
