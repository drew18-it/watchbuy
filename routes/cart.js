const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/cart - Add or update item in cart and deduct from product stock
router.post('/', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please login to add to cart.' });
  }

  // Prevent admin users from adding to cart
  if (req.session.user.role === 'admin') {
    return res.status(403).json({ error: 'Admin users cannot add items to cart.' });
  }

  const userId = req.session.user.id;
  const { product_id, quantity } = req.body;

  try {
    // 1. Check product existence and available quantity
    const [productRows] = await db.query('SELECT quantity FROM products WHERE id = ?', [product_id]);
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const availableQty = productRows[0].quantity;
    if (availableQty < quantity) {
      return res.status(400).json({ error: 'Not enough stock available.' });
    }

    // 2. Check if item is already in user's cart
    const [existing] = await db.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, userId, product_id]
      );
    } else {
      await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, product_id, quantity]
      );
    }

    // 3. Deduct from product stock
    await db.query(
      'UPDATE products SET quantity = quantity - ? WHERE id = ?',
      [quantity, product_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cart - Get cart items
router.get('/', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please login to view cart.' });
  }

  // Prevent admin users from viewing cart
  if (req.session.user.role === 'admin') {
    return res.status(403).json({ error: 'Admin users cannot access cart.' });
  }

  const userId = req.session.user.id;

  try {
    const [rows] = await db.query(
      `SELECT c.id, c.quantity, p.name, p.description, p.img_path
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart/:id - Remove item from cart and return stock
router.delete('/:id', async (req, res) => {
  const cartItemId = req.params.id;

  try {
    const [rows] = await db.query(
      'SELECT product_id, quantity FROM cart WHERE id = ?',
      [cartItemId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    const { product_id, quantity } = rows[0];

    await db.query('DELETE FROM cart WHERE id = ?', [cartItemId]);

    await db.query(
      'UPDATE products SET quantity = quantity + ? WHERE id = ?',
      [quantity, product_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting cart item:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/checkout - Finalize order and clear cart
router.post('/checkout', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please login to proceed to checkout.' });
  }

  // Prevent admin users from checking out
  if (req.session.user.role === 'admin') {
    return res.status(403).json({ error: 'Admin users cannot proceed to checkout.' });
  }

  const userId = req.session.user.id;

  try {
    const [cartItems] = await db.query(
      `SELECT product_id, quantity FROM cart WHERE user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    // OPTIONAL: You can insert these items into an 'orders' table here

    // Clear cart after checkout
    await db.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error during checkout:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
