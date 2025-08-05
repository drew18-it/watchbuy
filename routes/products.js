// Add this to your database:
// CREATE TABLE product_images (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   product_id INT,
//   img_path VARCHAR(255),
//   FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
// );
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const db = require('../config/db');

// Ensure uploads directory exists
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Get all products with images
router.get('/', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    const productIds = results.map(p => p.id);
    let imagesMap = {};
    if (productIds.length > 0) {
      const [images] = await db.query('SELECT * FROM product_images WHERE product_id IN (?)', [productIds]);
      imagesMap = images.reduce((acc, img) => {
        if (!acc[img.product_id]) acc[img.product_id] = [];
        acc[img.product_id].push(img.img_path);
        return acc;
      }, {});
    }
    const enriched = results.map(prod => ({
      ...prod,
      images: imagesMap[prod.id] || [],
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get product by ID with images
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `;
  try {
    const [results] = await db.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = results[0];
    const [images] = await db.query('SELECT img_path FROM product_images WHERE product_id = ?', [id]);
    product.images = images.map(img => img.img_path);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product (multiple images)
router.post('/', upload.array('images', 5), async (req, res) => {
  const { name, description, quantity, category_id, price } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO products (name, description, quantity, category_id, price) VALUES (?, ?, ?, ?, ?)',
      [name, description, quantity || 0, category_id || null, price || 0]
    );
    const productId = result.insertId;
    if (req.files && req.files.length > 0) {
      const imageInserts = req.files.map(f => [productId, '/uploads/' + f.filename]);
      await db.query('INSERT INTO product_images (product_id, img_path) VALUES ?', [imageInserts]);
    }
    res.status(201).json({ message: 'Product created successfully', id: productId });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (multiple images)
router.put('/:id', upload.array('images', 5), async (req, res) => {
  const { id } = req.params;
  const { name, description, quantity, category_id, price } = req.body;
  try {
    await db.query(
      'UPDATE products SET name = ?, description = ?, quantity = ?, category_id = ?, price = ? WHERE id = ?',
      [name, description, quantity, category_id, price || 0, id]
    );
    if (req.files && req.files.length > 0) {
      // Optionally, delete old images here if you want to replace
      await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);
      const imageInserts = req.files.map(f => [id, '/uploads/' + f.filename]);
      await db.query('INSERT INTO product_images (product_id, img_path) VALUES ?', [imageInserts]);
    }
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product with FK constraint handling
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM products WHERE id = ?', [id], (err) => {
    if (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({
          error: 'Cannot delete product: It is linked to existing orders.',
        });
      } else {
        console.error('Delete error:', err);
        return res.status(500).json({ error: 'Failed to delete product.' });
      }
    }

    res.json({ message: 'Product deleted successfully' });
  });
});

module.exports = router;
