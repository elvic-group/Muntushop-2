# Cursor IDE Rules - MuntuShop Platform

**AI-Assisted Development Rules for Complete Platform**

---

## Project Context

You are building a multi-service WhatsApp platform with 11 integrated services using:
- Backend: Node.js + Express + PostgreSQL
- Frontend: React + Vite + Tailwind CSS
- WhatsApp: Green API
- Payments: Stripe
- Deployment: Railway (backend) + Netlify (frontend)

All services are priced at $1.00 for now (configurable).

---

## Code Style & Standards

### **General Principles:**

```javascript
// ✅ DO: Use async/await
async function getUser(id) {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// ❌ DON'T: Use callbacks
function getUser(id, callback) {
  db.query('SELECT * FROM users WHERE id = $1', [id], (err, result) => {
    callback(err, result.rows[0]);
  });
}

// ✅ DO: Use descriptive names
const userOrders = await getUserOrders(userId);

// ❌ DON'T: Use abbreviations
const uo = await getUO(uid);

// ✅ DO: Handle errors properly
try {
  const result = await db.query(query, params);
  return result.rows;
} catch (error) {
  console.error('Database error:', error);
  throw error;
}

// ❌ DON'T: Ignore errors
const result = await db.query(query, params);
return result.rows;
```

### **File Organization:**

```
✅ One service per file
✅ Group related functions
✅ Export single instance for services
✅ Use index.js for module exports

❌ Don't mix concerns in one file
❌ Don't create god classes
```

---

## Database Queries

### **Always use parameterized queries:**

```javascript
// ✅ CORRECT: Parameterized query (prevents SQL injection)
const result = await db.query(
  'SELECT * FROM users WHERE phone = $1',
  [phone]
);

// ❌ WRONG: String concatenation (SQL injection risk)
const result = await db.query(
  `SELECT * FROM users WHERE phone = '${phone}'`
);
```

### **Query patterns:**

```javascript
// Single result
const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
return user.rows[0];

// Multiple results
const users = await db.query('SELECT * FROM users WHERE is_active = true');
return users.rows;

// Insert with RETURNING
const result = await db.query(`
  INSERT INTO products (name, price) 
  VALUES ($1, $2) 
  RETURNING *
`, [name, price]);
return result.rows[0];

// Update
await db.query(`
  UPDATE users 
  SET name = $1, updated_at = NOW() 
  WHERE id = $2
`, [name, userId]);

// Transaction
const client = await db.connect();
try {
  await client.query('BEGIN');
  // ... multiple queries
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

## Service Implementation

### **Service Template:**

```javascript
// backend/src/services/[service]/index.js
const db = require('../../config/database');
const greenAPI = require('../../config/greenapi');
const templates = require('../../templates/whatsapp');

class ServiceName {
  async handleMessage(user, message) {
    const step = user.current_step;
    const msg = message.toLowerCase().trim();
    
    // Navigation
    if (msg === '0' || msg === 'back') {
      return await this.goBack(user);
    }
    
    if (msg === 'menu') {
      return await this.showMainMenu(user);
    }
    
    // Route based on step
    switch (step) {
      case 'menu':
        return await this.handleMenuSelection(user, msg);
      // ... other steps
      default:
        return await this.showMenu(user);
    }
  }
  
  async showMenu(user) {
    await this.updateUserStep(user.id, 'menu');
    const menu = templates.serviceName.menu();
    await this.sendMessage(user.phone, menu);
  }
  
  // Helper methods
  async updateUserStep(userId, step, sessionData = null) {
    const query = sessionData 
      ? 'UPDATE users SET current_service = $1, current_step = $2, session_data = $3 WHERE id = $4'
      : 'UPDATE users SET current_service = $1, current_step = $2 WHERE id = $3';
    
    const params = sessionData 
      ? ['serviceName', step, JSON.stringify(sessionData), userId]
      : ['serviceName', step, userId];
    
    await db.query(query, params);
  }
  
  async sendMessage(phone, text) {
    await greenAPI.message.sendMessage(`${phone}@c.us`, null, text);
  }
  
  async showMainMenu(user) {
    await db.query(
      'UPDATE users SET current_service = NULL, current_step = NULL WHERE id = $1',
      [user.id]
    );
    const menu = templates.main.mainMenu();
    await this.sendMessage(user.phone, menu);
  }
}

module.exports = new ServiceName();
```

---

## API Route Pattern

### **Route Template:**

```javascript
// backend/src/routes/api/[resource].js
const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const auth = require('../../middleware/auth');

// List resources
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    
    // Build query with filters
    let query = 'SELECT * FROM resources WHERE 1=1';
    const params = [];
    
    // Add pagination
    query += ` LIMIT $1 OFFSET $2`;
    params.push(limit, (page - 1) * limit);
    
    const result = await db.query(query, params);
    
    res.json({
      data: result.rows,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single resource
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM resources WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create resource
router.post('/', auth, async (req, res) => {
  try {
    const { field1, field2 } = req.body;
    
    // Validation
    if (!field1 || !field2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await db.query(`
      INSERT INTO resources (field1, field2, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [field1, field2, req.user.userId]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update resource
router.put('/:id', auth, async (req, res) => {
  try {
    const { field1, field2 } = req.body;
    
    const result = await db.query(`
      UPDATE resources 
      SET field1 = $1, field2 = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [field1, field2, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete resource
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM resources WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## React Component Pattern

### **Component Template:**

```javascript
// frontend/src/components/ComponentName.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getData, updateData } from '../lib/api';

export default function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(null);
  
  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['key', prop1],
    queryFn: () => getData(prop1)
  });
  
  // Mutation
  const mutation = useMutation({
    mutationFn: updateData,
    onSuccess: () => {
      // Refetch or update cache
    }
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{data.title}</h1>
      {/* Component content */}
    </div>
  );
}
```

---

## Testing Patterns

### **Service Testing:**

```javascript
// backend/test/shopping.test.js
const shoppingService = require('../src/services/shopping');

describe('Shopping Service', () => {
  test('should show menu', async () => {
    const user = { id: 1, phone: '1234567890' };
    await shoppingService.showMenu(user);
    // Assert message sent
  });
  
  test('should add to cart', async () => {
    const result = await shoppingService.addToCart(1, 1, 2);
    expect(result.items.length).toBeGreaterThan(0);
  });
});
```

---

## Environment Variables

### **Required Variables:**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Green API
GREEN_API_INSTANCE_ID=your_instance_id
GREEN_API_TOKEN=your_token

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxx

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
PORT=3000

# Optional
OPENAI_API_KEY=sk-xxxxx (for AI features)
IPTV_SERVER_URL=https://iptv.muntushop.com
```

---

## Common Commands

### **Development:**

```bash
# Backend
cd backend
npm run dev        # Start dev server with nodemon
npm run migrate    # Run database migrations
npm test          # Run tests

# Frontend
cd frontend
npm run dev       # Start Vite dev server
npm run build     # Build for production
npm run preview   # Preview production build

# Both
npm run dev:all   # Start both backend and frontend
```

### **Database:**

```bash
# Connect to database
railway run psql $DATABASE_URL

# Run migration
railway run psql $DATABASE_URL < schema.sql

# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### **Deployment:**

```bash
# Backend (Railway)
railway up
railway logs
railway variables set KEY=value

# Frontend (Netlify)
netlify deploy
netlify deploy --prod
```

---

## Error Handling

### **API Error Response:**

```javascript
// Standard error response
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // optional
}

// Examples
{ "error": "User not found", "code": "USER_NOT_FOUND" }
{ "error": "Invalid credentials", "code": "INVALID_CREDENTIALS" }
{ "error": "Payment failed", "code": "PAYMENT_FAILED", "details": { "reason": "Insufficient funds" }}
```

### **Try-Catch Pattern:**

```javascript
// Service method
async function serviceMethod() {
  try {
    // Business logic
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Service error:', error);
    throw error; // Let route handler catch it
  }
}

// Route handler
router.get('/endpoint', async (req, res) => {
  try {
    const data = await serviceMethod();
    res.json(data);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ 
      error: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});
```

---

## Security Best Practices

### **Input Validation:**

```javascript
// Validate phone number
function isValidPhone(phone) {
  return /^\+?[1-9]\d{1,14}$/.test(phone);
}

// Validate email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Sanitize input
function sanitizeInput(input) {
  return input.trim().replace(/<script>/gi, '');
}
```

### **Authentication:**

```javascript
// JWT middleware
const jwt = require('jsonwebtoken');

exports.auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin middleware
exports.adminAuth = async (req, res, next) => {
  try {
    await exports.auth(req, res, async () => {
      const admin = await db.query(
        'SELECT * FROM admin_users WHERE user_id = $1',
        [req.user.userId]
      );
      
      if (!admin.rows[0]) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      next();
    });
  } catch (error) {
    res.status(403).json({ error: 'Not authorized' });
  }
};
```

---

## Documentation Standards

### **Function Documentation:**

```javascript
/**
 * Get user by ID
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} User object
 * @throws {Error} If user not found
 */
async function getUser(userId) {
  // Implementation
}

/**
 * Create new order
 * @param {number} userId - User ID
 * @param {Array} items - Order items
 * @param {Object} address - Shipping address
 * @returns {Promise<Object>} Created order
 */
async function createOrder(userId, items, address) {
  // Implementation
}
```

### **README Structure:**

```markdown
# Service Name

## Description
Brief description of what this service does.

## Features
- Feature 1
- Feature 2

## Usage
```javascript
const service = require('./service');
await service.method();
```

## API Endpoints
- `GET /api/resource` - Description
- `POST /api/resource` - Description

## Environment Variables
- `VAR_NAME` - Description

## Testing
```bash
npm test
```
```

---

## Quick Reference

### **Most Used Imports:**

```javascript
// Backend
const express = require('express');
const db = require('../config/database');
const greenAPI = require('../config/greenapi');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Frontend
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
```

### **Database Patterns:**

```javascript
// Get one
const result = await db.query('SELECT * FROM table WHERE id = $1', [id]);
const item = result.rows[0];

// Get many
const result = await db.query('SELECT * FROM table WHERE status = $1', [status]);
const items = result.rows;

// Insert
const result = await db.query(
  'INSERT INTO table (col1, col2) VALUES ($1, $2) RETURNING *',
  [val1, val2]
);
const newItem = result.rows[0];

// Update
await db.query(
  'UPDATE table SET col1 = $1 WHERE id = $2',
  [newVal, id]
);

// Delete
await db.query('DELETE FROM table WHERE id = $1', [id]);
```

---

## AI Assistant Instructions

When helping with this project:

1. **Always use the patterns above**
2. **Check documentation files first** - All implementation details are in the .md files
3. **Follow the service template** - Don't deviate from established patterns
4. **Use parameterized queries** - Never string concatenation
5. **Handle errors properly** - Always try-catch
6. **Maintain consistency** - Same code style throughout
7. **Keep it simple** - Don't over-engineer
8. **Security first** - Validate inputs, use auth middleware
9. **Test before deploying** - Test locally first

### **When creating new features:**

1. Check if similar feature exists
2. Follow the same pattern
3. Add to appropriate service
4. Create API route if needed
5. Update WhatsApp templates
6. Test end-to-end
7. Document in README

---

**All rules are mandatory. Follow them strictly for consistent, maintainable code.**

*Cursor IDE Rules*  
*Last Updated: December 15, 2024*
