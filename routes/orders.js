const express = require('express');
const router = express.Router();
const db = require('../config/db');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create receipts folder if it doesn't exist
const receiptsDir = path.join(__dirname, '../receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// Nodemailer setup (same as checkout)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cortezdrew454@gmail.com',
    pass: 'deannueldrew18**'
  }
});

// ✅ GET all orders for logged-in user
router.get('/', async (req, res) => {
  console.log('Orders route accessed');
  console.log('Session user:', req.session.user);
  
  if (!req.session.user) {
    console.log('No user session found');
    return res.status(401).json({ error: 'Please login to view orders.' });
  }

  const userId = req.session.user.id;
  console.log('Fetching orders for user ID:', userId);

  try {
    // Test database connection first
    const [testResult] = await db.query('SELECT 1 as test');
    console.log('Database connection test:', testResult);

    const [orders] = await db.query(
      'SELECT id, created_at, status FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    console.log('Orders found:', orders.length);

    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.quantity, p.name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    console.log('Orders with items:', orders);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// GET single order details
router.get('/:id', async (req, res) => {
  const orderId = req.params.id;

  try {
    const [[order]] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    const [items] = await db.query(`
      SELECT p.name, oi.quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    order.items = items;

    res.json(order);
  } catch (err) {
    console.error('❌ Failed to fetch order details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ✅ DELETE /api/orders/:id - Delete order
router.delete('/:id', async (req, res) => {
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

// ✅ PUT /api/orders/:id/complete — Mark as paid + send receipt
router.put('/:id/complete', async (req, res) => {
  const orderId = req.params.id;

  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', ['paid', orderId]);

    const [[user]] = await db.query(`
      SELECT u.email, u.fname, u.lname
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    const [[order]] = await db.query(
      'SELECT created_at FROM orders WHERE id = ?',
      [orderId]
    );

    const [items] = await db.query(`
      SELECT p.name, oi.quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    // PDF Generation
    const pdfPath = path.join(receiptsDir, `paid-order-${orderId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(fs.createWriteStream(pdfPath));

    const fullName = `${user.fname} ${user.lname}`;
    const primaryColor = '#16a34a';
    const textColor = '#333';

    doc
      .fillColor(primaryColor)
      .fontSize(26)
      .text('WatchBuy - Premium Watches - Paid Receipt', { align: 'center' })
      .moveDown(0.5);

    doc
      .fillColor(textColor)
      .fontSize(16)
      .text(`Order #${orderId} - PAID`, { align: 'center' })
      .moveDown(1);

    doc
      .fontSize(12)
      .fillColor('#444')
      .text(`Customer: ${fullName}`)
      .text(`Email: ${user.email}`)
      .text(`Date Paid: ${new Date().toLocaleDateString()}`)
      .moveDown(1);

    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .text('Ordered Items:', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .fillColor('#000')
      .text('Product Name', 70, doc.y, { continued: true })
      .text('Quantity', 400, doc.y)
      .moveDown(0.3);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    items.forEach(item => {
      doc
        .fillColor('#333')
        .text(item.name, 70, doc.y, { continued: true })
        .text(item.quantity.toString(), 400, doc.y);
    });

    doc.moveDown(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc
      .moveDown(1.5)
      .fontSize(12)
      .fillColor('gray')
      .text('Thank you for your payment! Your order has been marked as paid.', {
        align: 'center',
        italic: true,
      });

    doc.end();

    // Email w/ receipt
    await transporter.sendMail({
      from: 'alsamuelcrueta89@gmail.com',
      to: user.email,
      subject: `Order #${orderId} Paid - Receipt Attached`,
      text: `Hello ${fullName},\n\nYour payment for order #${orderId} is confirmed. Receipt attached.`,
      attachments: [
        {
          filename: `paid-order-${orderId}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    });

    res.json({ success: true, message: 'Order marked as paid and email sent.' });
  } catch (err) {
    console.error('Error completing order:', err);
    res.status(500).json({ error: 'Failed to mark order as paid.' });
  }
});

module.exports = router;
