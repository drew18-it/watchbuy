const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  
  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.fname, u.lname, u.email
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);
    
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add a review (requires login)
router.post('/', async (req, res) => {
  console.log('Review submission attempt:', {
    sessionUser: req.session.user,
    body: req.body
  });

  if (!req.session.user) {
    console.log('No session user found');
    return res.status(401).json({ error: 'Login required to add review' });
  }

  const { product_id, rating, comment } = req.body;
  const user_id = req.session.user.id;

  console.log('Review data:', { product_id, rating, comment, user_id });

  // Convert product_id to number if it's a string
  const numericProductId = parseInt(product_id);
  const numericRating = parseInt(rating);

  console.log('Converted data:', { numericProductId, numericRating, comment, user_id });

  // Validate input
  if (!numericProductId || isNaN(numericProductId) || !numericRating || numericRating < 1 || numericRating > 5) {
    console.log('Validation failed:', { numericProductId, numericRating });
    return res.status(400).json({ error: 'Invalid input. Rating must be between 1-5' });
  }

  try {
    // Check if user already reviewed this product
    const [existingReview] = await db.query(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [user_id, numericProductId]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Check if product exists
    const [product] = await db.query('SELECT id FROM products WHERE id = ?', [numericProductId]);
    if (product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user has purchased this product (completed order)
    const [purchaseCheck] = await db.query(`
      SELECT oi.id 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = ? AND o.user_id = ? AND o.status = 'paid'
    `, [numericProductId, user_id]);

    console.log('Purchase check result:', purchaseCheck);

    if (purchaseCheck.length === 0) {
      console.log('Purchase check failed - user has not purchased this product');
      return res.status(403).json({ error: 'You can only review products you have purchased' });
    }

    console.log('Purchase check passed, inserting review...');

    // Insert review
    const [result] = await db.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [numericProductId, user_id, numericRating, comment || null]
    );

    console.log('Review insertion result:', result);

    res.status(201).json({ 
      success: true, 
      message: 'Review added successfully',
      reviewId: result.insertId 
    });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Get all reviews (admin only)
router.get('/admin', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const [reviews] = await db.query(`
      SELECT r.*, u.fname, u.lname, u.email, p.name as product_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching all reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Delete review (admin only)
router.delete('/:reviewId', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { reviewId } = req.params;

  try {
    const [result] = await db.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Get products user can review (purchased but not reviewed yet)
router.get('/reviewable-products', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login required' });
  }

  const user_id = req.session.user.id;

  try {
    const [products] = await db.query(`
      SELECT DISTINCT p.id, p.name, p.img_path, p.price
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND o.status = 'paid'
      AND p.id NOT IN (
        SELECT product_id FROM reviews WHERE user_id = ?
      )
      ORDER BY o.created_at DESC
    `, [user_id, user_id]);
    
    res.json(products);
  } catch (err) {
    console.error('Error fetching reviewable products:', err);
    res.status(500).json({ error: 'Failed to fetch reviewable products' });
  }
});

// Get review statistics for a product
router.get('/stats/:productId', async (req, res) => {
  const { productId } = req.params;
  
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews 
      WHERE product_id = ?
    `, [productId]);
    
    const result = stats[0];
    result.average_rating = result.average_rating ? parseFloat(result.average_rating).toFixed(1) : 0;
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching review stats:', err);
    res.status(500).json({ error: 'Failed to fetch review statistics' });
  }
});

module.exports = router; 