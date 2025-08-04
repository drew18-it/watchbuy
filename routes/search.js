// routes/search.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Enhanced search API that returns JSON
router.get('/api', async (req, res) => {
  const query = req.query.q;
  const category = req.query.category;
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const sortBy = req.query.sortBy || 'name';
  const sortOrder = req.query.sortOrder || 'ASC';
  const limit = parseInt(req.query.limit) || 20;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  if (!query && !category && !minPrice && !maxPrice) {
    return res.json({
      success: false,
      message: 'No search criteria provided',
      results: [],
      total: 0,
      page: page,
      totalPages: 0
    });
  }

  try {
    let sql = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Add search conditions
    if (query) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (category) {
      sql += ` AND c.name = ?`;
      params.push(category);
    }

    // Add price filtering (using frontend prices)
    if (minPrice || maxPrice) {
      sql += ` AND p.id IN (1, 2, 3, 4, 5, 6)`; // Only products with frontend prices
    }

    // Get total count for pagination
    const countSql = sql.replace('SELECT p.*, c.name AS category_name', 'SELECT COUNT(*) as total');
    const [countResult] = await db.query(countSql, params);
    const total = countResult[0].total;

    // Add sorting and pagination
    sql += ` ORDER BY p.${sortBy} ${sortOrder}`;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [products] = await db.query(sql, params);

    // Add frontend prices
    const prices = {
      1: 2999,
      2: 1499,
      3: 899,
      4: 1999,
      5: 2499,
      6: 1799
    };

    const enrichedProducts = products.map(product => ({
      ...product,
      price: prices[product.id] || null
    }));

    // Filter by price if specified
    let filteredProducts = enrichedProducts;
    if (minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price && p.price >= parseInt(minPrice));
    }
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price && p.price <= parseInt(maxPrice));
    }

    res.json({
      success: true,
      results: filteredProducts,
      total: filteredProducts.length,
      page: page,
      totalPages: Math.ceil(total / limit),
      query: query,
      filters: {
        category,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder
      }
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      success: false,
      message: 'An error occurred while searching',
      error: err.message
    });
  }
});

// Get search suggestions for autocomplete
router.get('/suggestions', async (req, res) => {
  const query = req.query.q;

  if (!query || query.length < 2) {
    return res.json([]);
  }

  try {
    const [products] = await db.query(
      `SELECT DISTINCT name FROM products 
       WHERE name LIKE ? 
       ORDER BY name 
       LIMIT 10`,
      [`%${query}%`]
    );

    const [categories] = await db.query(
      `SELECT DISTINCT name FROM categories 
       WHERE name LIKE ? 
       ORDER BY name 
       LIMIT 5`,
      [`%${query}%`]
    );

    const suggestions = [
      ...products.map(p => ({ type: 'product', value: p.name })),
      ...categories.map(c => ({ type: 'category', value: c.name }))
    ];

    res.json(suggestions);

  } catch (err) {
    console.error('Search suggestions error:', err);
    res.status(500).json([]);
  }
});

// Legacy route for backward compatibility
router.get('/', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.send('<h2>No search query provided.</h2>');
  }

  try {
    const [products] = await db.query(
      'SELECT * FROM products WHERE name LIKE ? OR description LIKE ?',
      [`%${query}%`, `%${query}%`]
    );

    let html = `<h2>Search Results for "${query}"</h2>`;
    if (products.length === 0) {
      html += '<p>No products found.</p>';
    } else {
      html += '<ul>';
      products.forEach(product => {
        html += `<li><strong>${product.name}</strong> - ${product.description}</li>`;
      });
      html += '</ul>';
    }

    res.send(html);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).send('An error occurred while searching.');
  }
});

module.exports = router;
