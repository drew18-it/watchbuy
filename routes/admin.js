const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/db');
const { sendOrderCompletedEmail, sendOrderCanceledEmail } = require('../config/email');

// ✅ Test database connection
router.get('/test-db', async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 as test');
    res.json({ success: true, message: 'Database connected', data: result });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// ✅ Test route (no admin required)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin routes are working' });
});

// ✅ Middleware: Check if admin
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ error: 'Forbidden - Admins only' });
}

// ✅ Dashboard statistics
router.get('/dashboard-stats', isAdmin, async (req, res) => {
  try {
    // Get total users
    const [[userCount]] = await db.query('SELECT COUNT(*) as count FROM users');
    
    // Get total orders
    const [[orderCount]] = await db.query('SELECT COUNT(*) as count FROM orders');
    
    // Get total revenue (sum of paid orders) - now using total_amount field
    const [[revenue]] = await db.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status = 'paid'
    `);
    
    // Get total products
    const [[productCount]] = await db.query('SELECT COUNT(*) as count FROM products');
    
    res.json({
      success: true,
      stats: {
        totalUsers: userCount.count,
        totalOrders: orderCount.count,
        totalRevenue: revenue.total,
        totalProducts: productCount.count
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics' });
  }
});

// ✅ Fetch all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, fname, lname, email, role, status FROM users');
    const formatted = users.map(user => ({
      id: user.id,
      fname: user.fname || '',
      lname: user.lname || '',
      email: user.email,
      role: user.role,
      status: user.status || 'inactive'
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ✅ Update user role
router.put('/users/:id/role', isAdmin, async (req, res) => {
  const { role } = req.body;
  const userId = req.params.id;

  if (!['admin', 'customer'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  try {
    const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ success: false });
  }
});

// ✅ Update user status
router.put('/users/:id/status', isAdmin, async (req, res) => {
  const { status } = req.body;
  const userId = req.params.id;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const [result] = await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ success: false });
  }
});

// ✅ Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false });
  }
});

// ✅ Get all orders (admin)
router.get('/orders', isAdmin, async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.id, o.user_id, o.status, o.created_at
      FROM orders o
      ORDER BY o.created_at DESC
    `);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ✅ Get single order with items (admin)
router.get('/orders/:id', isAdmin, async (req, res) => {
  const orderId = req.params.id;
  
  try {
    // Get order details
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items with product details
    const [items] = await db.query(`
      SELECT oi.*, p.name, p.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    order.items = items;
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ✅ Complete order (admin)
router.put('/orders/:id/complete', isAdmin, async (req, res) => {
  const orderId = req.params.id;

  try {
    // Check if order exists and get current status
    const [[order]] = await db.query('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Prevent completing already completed orders
    if (order.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already completed' });
    }

    // Update order status to paid
    const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', ['paid', orderId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Get order details for confirmation
    const [[orderDetails]] = await db.query(`
      SELECT u.fname, u.lname, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (!orderDetails) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order details not found' 
      });
    }

    // Get order items for confirmation
    const [items] = await db.query(`
      SELECT p.name, oi.quantity, p.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    // Get total amount from orders table
    const [totalResult] = await db.query(`
      SELECT COALESCE(total_amount, 0) as total_amount
      FROM orders
      WHERE id = ?
    `, [orderId]);

    const totalAmount = totalResult[0]?.total_amount || 0;

    // Send completion email
    const orderData = {
      orderId: orderId,
      customerName: `${orderDetails.fname || ''} ${orderDetails.lname || ''}`.trim() || 'Unknown Customer',
      customerEmail: orderDetails.email || 'No email',
      orderDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalAmount: totalAmount.toFixed(2)
    };

    // Send email asynchronously (don't wait for it)
    sendOrderCompletedEmail(orderData).then(result => {
      if (result.success) {
        console.log('Order completion email sent successfully');
      } else {
        console.error('Failed to send order completion email:', result.error);
      }
    }).catch(err => {
      console.error('Email send error:', err);
    });

    // Prepare response data
    const responseData = { 
      success: true, 
      message: 'Order completed successfully',
      order: {
        id: orderId,
        status: 'paid',
        total_amount: totalAmount,
        customer: orderData.customerName,
        email: orderData.customerEmail,
        items: items || [],
        completed_at: new Date().toISOString()
      }
    };

    console.log('Order completion response:', responseData);
    res.json(responseData);

  } catch (err) {
    console.error('Error completing order:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete order',
      error: err.message 
    });
  }
});

// ✅ Cancel order
router.put('/orders/:id/cancel', isAdmin, async (req, res) => {
  const orderId = req.params.id;

  try {
    // Check if order exists and get current status
    const [[order]] = await db.query('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Prevent canceling already paid orders
    if (order.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a paid order' });
    }

    // Prevent canceling already canceled orders
    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', orderId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Get order details for email
    const [[orderDetails]] = await db.query(`
      SELECT o.created_at, u.fname, u.lname, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orderDetails) {
      // Get total amount from orders table
      const [totalResult] = await db.query(`
        SELECT COALESCE(total_amount, 0) as total_amount
        FROM orders
        WHERE id = ?
      `, [orderId]);

      const totalAmount = totalResult[0]?.total_amount || 0;

      // Send cancellation email
      const orderData = {
        orderId: orderId,
        customerName: `${orderDetails.fname || ''} ${orderDetails.lname || ''}`.trim() || 'Unknown Customer',
        customerEmail: orderDetails.email || 'No email',
        orderDate: new Date(orderDetails.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        totalAmount: totalAmount.toFixed(2)
      };

      // Send email asynchronously (don't wait for it)
      sendOrderCanceledEmail(orderData).then(result => {
        if (result.success) {
          console.log('Order cancellation email sent successfully');
        } else {
          console.error('Failed to send order cancellation email:', result.error);
        }
      }).catch(err => {
        console.error('Email send error:', err);
      });
    }
    
    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});

// ✅ Delete order (admin)
router.delete('/orders/:id', isAdmin, async (req, res) => {
  const orderId = req.params.id;

  try {
    // Check if order exists
    const [[order]] = await db.query('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Optional: prevent deletion of paid orders
    if (order.status === 'paid') {
      return res.status(400).json({ success: false, error: 'Cannot delete a paid order.' });
    }

    // Delete from order_items first (foreign key constraint)
    await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

    // Then delete from orders
    await db.query('DELETE FROM orders WHERE id = ?', [orderId]);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting order:', err);
    res.status(500).json({ success: false, error: 'Failed to delete order.' });
  }
});

// ✅ Pie chart data: product category distribution of paid orders
router.get('/category-distribution', isAdmin, async (req, res) => {
  const sql = `
    SELECT c.name AS category, COUNT(*) AS count
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'paid'
    GROUP BY c.name
    ORDER BY count DESC
  `;
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error fetching category distribution:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Bar chart data: paid orders per month
router.get('/orders-per-month', isAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT MONTH(created_at) AS month, COUNT(*) AS count
      FROM orders
      WHERE status = 'paid'
      GROUP BY MONTH(created_at)
    `;
    const [rows] = await db.query(sql);
    const ordersByMonth = Array(12).fill(0); // Initialize 12 months
    rows.forEach(row => {
      ordersByMonth[row.month - 1] = row.count;
    });
    res.json({ success: true, data: ordersByMonth });
  } catch (err) {
    console.error('Error fetching orders per month:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Sales revenue per month
router.get('/sales-per-month', isAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT MONTH(created_at) AS month, COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE status = 'paid'
      GROUP BY MONTH(created_at)
    `;
    const [rows] = await db.query(sql);
    const salesByMonth = Array(12).fill(0); // Initialize 12 months
    rows.forEach(row => {
      salesByMonth[row.month - 1] = parseFloat(row.revenue);
    });
    res.json({ success: true, data: salesByMonth });
  } catch (err) {
    console.error('Error fetching sales per month:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Admin Pages
router.get('/dashboard', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin-dashboard.html'));
});

router.get('/users', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin-users.html'));
});

router.get('/orders', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin-orders.html'));
});

router.get('/products', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin-products.html'));
});

router.get('/edit-product/:id', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin-edit-product.html'));
});

router.get('/charts', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin-charts.html'));
});

module.exports = router;