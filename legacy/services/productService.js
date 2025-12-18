// Product Service
// Handles product database operations

const pool = require('../backend/src/config/database');

class ProductService {
  /**
   * Get all products
   */
  static async getAllProducts() {
    try {
      const result = await pool.query(
        'SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category) {
    try {
      const result = await pool.query(
        'SELECT * FROM products WHERE category = $1 AND is_active = true ORDER BY rating DESC',
        [category]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(productId) {
    try {
      const result = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [productId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  /**
   * Search products
   */
  static async searchProducts(query) {
    try {
      const result = await pool.query(
        `SELECT * FROM products
         WHERE is_active = true
         AND (name ILIKE $1 OR description ILIKE $1 OR tags::text ILIKE $1)
         ORDER BY rating DESC
         LIMIT 20`,
        [`%${query}%`]
      );
      return result.rows;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Seed sample products if none exist
   */
  static async seedProducts() {
    try {
      // Check if products exist
      const count = await pool.query('SELECT COUNT(*) FROM products');
      if (parseInt(count.rows[0].count) > 0) {
        console.log('Products already exist, skipping seed');
        return;
      }

      console.log('Seeding products...');

      const products = [
        // Phone Accessories
        { sku: 'PA001', name: 'Phone Case Premium', category: 'Phone Accessories', description: 'High-quality protective case', price: 1.00, rating: 4.8, reviews_count: 234 },
        { sku: 'PA002', name: 'Screen Protector', category: 'Phone Accessories', description: 'Tempered glass protection', price: 1.00, rating: 4.9, reviews_count: 189 },
        { sku: 'PA003', name: 'Fast Charging Cable', category: 'Phone Accessories', description: 'Quick charge support', price: 1.00, rating: 4.7, reviews_count: 156 },
        { sku: 'PA004', name: 'Pop Socket', category: 'Phone Accessories', description: 'Multiple designs available', price: 1.00, rating: 4.6, reviews_count: 98 },
        { sku: 'PA005', name: 'Car Phone Holder', category: 'Phone Accessories', description: 'Secure mount', price: 1.00, rating: 4.8, reviews_count: 145 },

        // Fashion
        { sku: 'FA001', name: 'T-Shirt Cotton Premium', category: 'Fashion', description: 'Comfortable cotton t-shirt', price: 1.00, rating: 4.7, reviews_count: 312 },
        { sku: 'FA002', name: 'Jeans Classic Fit', category: 'Fashion', description: 'Classic fit jeans', price: 1.00, rating: 4.8, reviews_count: 245 },
        { sku: 'FA003', name: 'Sneakers Sport Style', category: 'Fashion', description: 'Sporty sneakers', price: 1.00, rating: 4.9, reviews_count: 198 },
        { sku: 'FA004', name: 'Hoodie Warm & Comfy', category: 'Fashion', description: 'Warm and comfortable hoodie', price: 1.00, rating: 4.6, reviews_count: 156 },
        { sku: 'FA005', name: 'Cap Adjustable', category: 'Fashion', description: 'Adjustable cap', price: 1.00, rating: 4.5, reviews_count: 89 },

        // Electronics
        { sku: 'EL001', name: 'USB Flash Drive 32GB', category: 'Electronics', description: '32GB storage', price: 1.00, rating: 4.8, reviews_count: 423 },
        { sku: 'EL002', name: 'Wireless Mouse Ergonomic', category: 'Electronics', description: 'Ergonomic design', price: 1.00, rating: 4.7, reviews_count: 312 },
        { sku: 'EL003', name: 'Bluetooth Speaker Portable', category: 'Electronics', description: 'Portable speaker', price: 1.00, rating: 4.9, reviews_count: 267 },
        { sku: 'EL004', name: 'Power Bank 10000mAh', category: 'Electronics', description: '10000mAh capacity', price: 1.00, rating: 4.8, reviews_count: 198 },
        { sku: 'EL005', name: 'Earphones Quality Sound', category: 'Electronics', description: 'High-quality sound', price: 1.00, rating: 4.6, reviews_count: 145 },

        // Home & Living
        { sku: 'HL001', name: 'LED Bulb Energy Saving', category: 'Home & Living', description: 'Energy efficient bulb', price: 1.00, rating: 4.7, reviews_count: 234 },
        { sku: 'HL002', name: 'Water Bottle Insulated', category: 'Home & Living', description: 'Insulated water bottle', price: 1.00, rating: 4.8, reviews_count: 198 },
        { sku: 'HL003', name: 'Storage Box Multipurpose', category: 'Home & Living', description: 'Multipurpose storage', price: 1.00, rating: 4.6, reviews_count: 156 },
        { sku: 'HL004', name: 'Wall Clock Modern Design', category: 'Home & Living', description: 'Modern wall clock', price: 1.00, rating: 4.5, reviews_count: 123 },
        { sku: 'HL005', name: 'Kitchen Organizer Space Saver', category: 'Home & Living', description: 'Space-saving organizer', price: 1.00, rating: 4.7, reviews_count: 167 },

        // Games & Toys
        { sku: 'GT001', name: 'Puzzle Set 500 Pieces', category: 'Games & Toys', description: '500-piece puzzle', price: 1.00, rating: 4.8, reviews_count: 189 },
        { sku: 'GT002', name: 'Playing Cards Premium', category: 'Games & Toys', description: 'Premium playing cards', price: 1.00, rating: 4.7, reviews_count: 145 },
        { sku: 'GT003', name: 'Stress Ball Squishy', category: 'Games & Toys', description: 'Squishy stress ball', price: 1.00, rating: 4.6, reviews_count: 98 },
        { sku: 'GT004', name: 'Mini Chess Set Portable', category: 'Games & Toys', description: 'Portable chess set', price: 1.00, rating: 4.9, reviews_count: 134 },
        { sku: 'GT005', name: 'Fidget Spinner Metal', category: 'Games & Toys', description: 'Metal fidget spinner', price: 1.00, rating: 4.5, reviews_count: 87 }
      ];

      for (const product of products) {
        await pool.query(
          `INSERT INTO products (sku, name, category, description, price, rating, reviews_count, stock_quantity)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 999)
           ON CONFLICT (sku) DO NOTHING`,
          [product.sku, product.name, product.category, product.description, product.price, product.rating, product.reviews_count]
        );
      }

      console.log('✅ Products seeded successfully');
    } catch (error) {
      console.error('Error seeding products:', error);
      throw error;
    }
  }

  /**
   * Update product stock
   */
  static async updateStock(productId, quantity) {
    try {
      await pool.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [quantity, productId]
      );
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }
}

module.exports = ProductService;
