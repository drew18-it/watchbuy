const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendOrderConfirmationEmail, sendOrderCanceledEmail, sendOrderCompletedEmail } = require('../config/email');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure receipts folder exists
const receiptsDir = path.join(__dirname, '../receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

router.post('/', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Login required' });
  }

  const userId = req.session.user.id;

  try {
    // Fetch cart items
    const [cartItems] = await db.query(`
      SELECT c.product_id, c.quantity, p.name, p.img_path, p.price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [userId]);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Insert order
    const [orderResult] = await db.query(
      'INSERT INTO orders (user_id) VALUES (?)',
      [userId]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of cartItems) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)',
        [orderId, item.product_id, item.quantity]
      );
    }

    // Clear cart
    await db.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    // Get user details
    const [[userInfo]] = await db.query(
      'SELECT email, fname, lname FROM users WHERE id = ?',
      [userId]
    );

    const userEmail = userInfo.email;
    const fullName = `${userInfo.fname} ${userInfo.lname}`;

    // Generate styled PDF
    const pdfPath = path.join(receiptsDir, `order-${orderId}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(fs.createWriteStream(pdfPath));

    const primaryColor = '#2563eb';
    const textColor = '#333';

    doc
      .fillColor(primaryColor)
      .fontSize(26)
      .text('WatchBuy - Premium Watches', { align: 'center' })
      .moveDown(0.5);

    doc
      .fillColor(textColor)
      .fontSize(16)
      .text(`Order Receipt #${orderId}`, { align: 'center' })
      .moveDown(1);

    doc
      .fontSize(12)
      .fillColor('#444')
      .text(`Customer: ${fullName}`)
      .text(`Email: ${userEmail}`)
      .text(`Date: ${new Date().toLocaleDateString()}`)
      .text(`Status: Pending`)
      .moveDown(1);

    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .text('Order Details')
      .moveDown(0.5);

    doc
      .fontSize(12)
      .fillColor('#000')
      .text('Product Name', 70, doc.y, { continued: true })
      .text('Quantity', 300, doc.y, { continued: true })
      .text('Price', 400, doc.y, { continued: true })
      .text('Total', 500, doc.y)
      .moveDown(0.3);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    cartItems.forEach(item => {
      const itemTotal = item.price * item.quantity;
      doc
        .fillColor('#333')
        .text(item.name, 70, doc.y, { continued: true })
        .text(item.quantity.toString(), 300, doc.y, { continued: true })
        .text(`₱${item.price.toLocaleString()}`, 400, doc.y, { continued: true })
        .text(`₱${itemTotal.toLocaleString()}`, 500, doc.y);
    });

    doc.moveDown(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc
      .moveDown(1)
      .fontSize(14)
      .fillColor(primaryColor)
      .text(`Total Amount: ₱${totalAmount.toLocaleString()}`, { align: 'right' });

    doc
      .moveDown(1.5)
      .fontSize(12)
      .fillColor('gray')
      .text('Thank you for shopping with WatchBuy!', {
        align: 'center',
        italic: true,
      });

    doc.end();

    // Respond to client before sending email
    res.json({ success: true, orderId });

    // Send beautiful HTML email after responding to client
    const orderData = {
      orderId: orderId,
      customerName: fullName,
      customerEmail: userEmail,
      orderDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalAmount: totalAmount.toFixed(2)
    };

    sendOrderConfirmationEmail(orderData).then(result => {
      if (result.success) {
        console.log('Order confirmation email sent successfully');
      } else {
        console.error('Failed to send order confirmation email:', result.error);
      }
    }).catch(err => {
      console.error('Email send error:', err);
    });

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Test email routes for debugging email templates
router.get('/test-email-completed', async (req, res) => {
  try {
    console.log('Testing order completed email...');
    
    const testOrderData = {
      orderId: '12345',
      customerName: 'John Doe',
      customerEmail: 'cortezdrew454@gmail.com', // Send to yourself for testing
      orderDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalAmount: '1,299.99'
    };

    const result = await sendOrderCompletedEmail(testOrderData);
    
    if (result.success) {
      console.log('Order completed email sent successfully');
      res.json({ success: true, message: 'Order completed email sent successfully' });
    } else {
      console.error('Failed to send order completed email:', result.error);
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/test-email-canceled', async (req, res) => {
  try {
    console.log('Testing order canceled email...');
    
    const testOrderData = {
      orderId: '12345',
      customerName: 'John Doe',
      customerEmail: 'cortezdrew454@gmail.com', // Send to yourself for testing
      orderDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalAmount: '1,299.99'
    };

    const result = await sendOrderCanceledEmail(testOrderData);
    
    if (result.success) {
      console.log('Order canceled email sent successfully');
      res.json({ success: true, message: 'Order canceled email sent successfully' });
    } else {
      console.error('Failed to send order canceled email:', result.error);
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/test-email-confirmation', async (req, res) => {
  try {
    console.log('Testing order confirmation email...');
    
    const testOrderData = {
      orderId: '12345',
      customerName: 'John Doe',
      customerEmail: 'cortezdrew454@gmail.com', // Send to yourself for testing
      orderDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalAmount: '1,299.99'
    };

    const result = await sendOrderConfirmationEmail(testOrderData);
    
    if (result.success) {
      console.log('Order confirmation email sent successfully');
      res.json({ success: true, message: 'Order confirmation email sent successfully' });
    } else {
      console.error('Failed to send order confirmation email:', result.error);
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel Order Email
router.post('/cancel-order/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const [[orderInfo]] = await db.query(
      `SELECT o.id, o.created_at, o.total_amount, u.email, u.fname, u.lname
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (!orderInfo) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = {
      orderId: orderInfo.id,
      customerName: `${orderInfo.fname} ${orderInfo.lname}`,
      customerEmail: orderInfo.email,
      orderDate: new Date(orderInfo.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalAmount: (orderInfo.total_amount || 0).toFixed(2)
    };

    const result = await sendOrderCanceledEmail(orderData);
    
    if (result.success) {
      res.json({ success: true, message: 'Cancellation email sent successfully.' });
    } else {
      res.status(500).json({ error: 'Failed to send cancellation email' });
    }

  } catch (err) {
    console.error('Cancel email error:', err);
    res.status(500).json({ error: 'Failed to send cancellation email' });
  }
});

// Mark Completed Email
router.post('/complete-order/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const [[orderInfo]] = await db.query(
      `SELECT o.id, o.created_at, o.total_amount, u.email, u.fname, u.lname
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (!orderInfo) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = {
      orderId: orderInfo.id,
      customerName: `${orderInfo.fname} ${orderInfo.lname}`,
      customerEmail: orderInfo.email,
      orderDate: new Date(orderInfo.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalAmount: (orderInfo.total_amount || 0).toFixed(2)
    };

    const result = await sendOrderCompletedEmail(orderData);
    
    if (result.success) {
      res.json({ success: true, message: 'Completion email sent successfully.' });
    } else {
      res.status(500).json({ error: 'Failed to send completion email' });
    }

  } catch (err) {
    console.error('Completed email error:', err);
    res.status(500).json({ error: 'Failed to send completed email' });
  }
});


module.exports = router;
