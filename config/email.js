const nodemailer = require('nodemailer');

// Gmail transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cortezdrew454@gmail.com',
    pass: 'cggm rpmq gjma xsbu' // Gmail App Password
  }
});

// Email templates
const emailTemplates = {
  orderCompleted: (orderData) => ({
    subject: `🎉 Order #${orderData.orderId} Completed - WatchBuy`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Completed - WatchBuy</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 2rem;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
          }
          .header p {
            margin: 0.5rem 0 0 0;
            opacity: 0.9;
            font-size: 1.1rem;
          }
          .content {
            padding: 2rem;
          }
          .status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-weight: 600;
            font-size: 0.9rem;
            margin-bottom: 1rem;
          }
          .order-details {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1.5rem 0;
          }
          .order-details h3 {
            margin: 0 0 1rem 0;
            color: #1e293b;
            font-size: 1.2rem;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #64748b;
          }
          .detail-value {
            color: #1e293b;
            font-weight: 500;
          }
          .message {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-left: 4px solid #3b82f6;
            padding: 1rem;
            border-radius: 8px;
            margin: 1.5rem 0;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 1.5rem 2rem;
            text-align: center;
            color: #64748b;
          }
          .footer a {
            color: #bfa76f;
            text-decoration: none;
            font-weight: 600;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .social-links {
            margin-top: 1rem;
          }
          .social-links a {
            display: inline-block;
            margin: 0 0.5rem;
            color: #64748b;
            text-decoration: none;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #bfa76f 0%, #a98d4c 100%);
            color: white;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 1rem 0;
            transition: transform 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Order Completed!</h1>
            <p>Your WatchBuy order has been successfully completed</p>
          </div>
          
          <div class="content">
            <div class="status-badge">✅ Order Completed</div>
            
            <h2>Hello ${orderData.customerName},</h2>
            
            <p>Great news! Your order has been completed and is ready for pickup or has been delivered to your specified address.</p>
            
            <div class="order-details">
              <h3>Order Information</h3>
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${orderData.orderId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">${orderData.orderDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value">$${orderData.totalAmount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">Completed</span>
              </div>
            </div>
            
            <div class="message">
              <strong>Thank you for choosing WatchBuy!</strong><br>
              We hope you love your new luxury timepiece. If you have any questions or need assistance, our customer support team is here to help.
            </div>
            
            <div style="text-align: center;">
              <a href="/orders" class="cta-button">View My Orders</a>
            </div>
            
            <p style="margin-top: 2rem; color: #64748b; font-size: 0.9rem;">
              If you have any questions about your order, please don't hesitate to contact our support team at 
              <a href="mailto:support@watchbuy.com">support@watchbuy.com</a>
            </p>
          </div>
          
          <div class="footer">
            <p><strong>WatchBuy</strong> - Premium Luxury Watches</p>
            <p>Timeless elegance meets modern craftsmanship</p>
            <div class="social-links">
              <a href="#">📧 Email</a>
              <a href="#">📱 Phone</a>
              <a href="#">🌐 Website</a>
            </div>
            <p style="margin-top: 1rem; font-size: 0.8rem;">
              © 2024 WatchBuy. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  orderCanceled: (orderData) => ({
    subject: `❌ Order #${orderData.orderId} Cancelled - WatchBuy`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Cancelled - WatchBuy</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 2rem;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
          }
          .header p {
            margin: 0.5rem 0 0 0;
            opacity: 0.9;
            font-size: 1.1rem;
          }
          .content {
            padding: 2rem;
          }
          .status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-weight: 600;
            font-size: 0.9rem;
            margin-bottom: 1rem;
          }
          .order-details {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1.5rem 0;
          }
          .order-details h3 {
            margin: 0 0 1rem 0;
            color: #991b1b;
            font-size: 1.2rem;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #fecaca;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #7f1d1d;
          }
          .detail-value {
            color: #991b1b;
            font-weight: 500;
          }
          .message {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-left: 4px solid #dc2626;
            padding: 1rem;
            border-radius: 8px;
            margin: 1.5rem 0;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 1.5rem 2rem;
            text-align: center;
            color: #64748b;
          }
          .footer a {
            color: #bfa76f;
            text-decoration: none;
            font-weight: 600;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .social-links {
            margin-top: 1rem;
          }
          .social-links a {
            display: inline-block;
            margin: 0 0.5rem;
            color: #64748b;
            text-decoration: none;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #bfa76f 0%, #a98d4c 100%);
            color: white;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 1rem 0;
            transition: transform 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .refund-info {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1.5rem 0;
          }
          .refund-info h3 {
            margin: 0 0 1rem 0;
            color: #0369a1;
            font-size: 1.2rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Order Cancelled</h1>
            <p>Your WatchBuy order has been cancelled</p>
          </div>
          
          <div class="content">
            <div class="status-badge">❌ Order Cancelled</div>
            
            <h2>Hello ${orderData.customerName},</h2>
            
            <p>We're sorry to inform you that your order has been cancelled as requested.</p>
            
            <div class="order-details">
              <h3>Cancelled Order Information</h3>
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${orderData.orderId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">${orderData.orderDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value">$${orderData.totalAmount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">Cancelled</span>
              </div>
            </div>
            
            <div class="refund-info">
              <h3>💳 Refund Information</h3>
              <p>If you were charged for this order, a refund will be processed within 3-5 business days. The refund will be credited back to your original payment method.</p>
              <p><strong>Refund Timeline:</strong> 3-5 business days</p>
            </div>
            
            <div class="message">
              <strong>Need Help?</strong><br>
              If you didn't request this cancellation or have any questions, please contact our customer support team immediately.
            </div>
            
            <div style="text-align: center;">
              <a href="/shop" class="cta-button">Continue Shopping</a>
            </div>
            
            <p style="margin-top: 2rem; color: #64748b; font-size: 0.9rem;">
              If you have any questions about your cancellation or refund, please contact our support team at 
              <a href="mailto:support@watchbuy.com">support@watchbuy.com</a>
            </p>
          </div>
          
          <div class="footer">
            <p><strong>WatchBuy</strong> - Premium Luxury Watches</p>
            <p>Timeless elegance meets modern craftsmanship</p>
            <div class="social-links">
              <a href="#">📧 Email</a>
              <a href="#">📱 Phone</a>
              <a href="#">🌐 Website</a>
            </div>
            <p style="margin-top: 1rem; font-size: 0.8rem;">
              © 2024 WatchBuy. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  orderConfirmation: (orderData) => ({
    subject: `📦 Order #${orderData.orderId} Confirmed - WatchBuy`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - WatchBuy</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 2rem;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
          }
          .header p {
            margin: 0.5rem 0 0 0;
            opacity: 0.9;
            font-size: 1.1rem;
          }
          .content {
            padding: 2rem;
          }
          .status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-weight: 600;
            font-size: 0.9rem;
            margin-bottom: 1rem;
          }
          .order-details {
            background-color: #f8fafc;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 1.5rem 0;
          }
          .order-details h3 {
            margin: 0 0 1rem 0;
            color: #1e293b;
            font-size: 1.2rem;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 600;
            color: #64748b;
          }
          .detail-value {
            color: #1e293b;
            font-weight: 500;
          }
          .message {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border-left: 4px solid #3b82f6;
            padding: 1rem;
            border-radius: 8px;
            margin: 1.5rem 0;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 1.5rem 2rem;
            text-align: center;
            color: #64748b;
          }
          .footer a {
            color: #bfa76f;
            text-decoration: none;
            font-weight: 600;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .social-links {
            margin-top: 1rem;
          }
          .social-links a {
            display: inline-block;
            margin: 0 0.5rem;
            color: #64748b;
            text-decoration: none;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #bfa76f 0%, #a98d4c 100%);
            color: white;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 1rem 0;
            transition: transform 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Order Confirmed!</h1>
            <p>Thank you for your WatchBuy order</p>
          </div>
          
          <div class="content">
            <div class="status-badge">📋 Order Confirmed</div>
            
            <h2>Hello ${orderData.customerName},</h2>
            
            <p>Thank you for your order! We've received your order and are processing it. You'll receive updates as your order progresses.</p>
            
            <div class="order-details">
              <h3>Order Information</h3>
              <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${orderData.orderId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">${orderData.orderDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value">$${orderData.totalAmount}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">Confirmed</span>
              </div>
            </div>
            
            <div class="message">
              <strong>What's Next?</strong><br>
              We'll send you updates as your order is processed, shipped, and delivered. You can also track your order status in your account.
            </div>
            
            <div style="text-align: center;">
              <a href="/orders" class="cta-button">Track My Order</a>
            </div>
            
            <p style="margin-top: 2rem; color: #64748b; font-size: 0.9rem;">
              If you have any questions about your order, please contact our support team at 
              <a href="mailto:support@watchbuy.com">support@watchbuy.com</a>
            </p>
          </div>
          
          <div class="footer">
            <p><strong>WatchBuy</strong> - Premium Luxury Watches</p>
            <p>Timeless elegance meets modern craftsmanship</p>
            <div class="social-links">
              <a href="#">📧 Email</a>
              <a href="#">📱 Phone</a>
              <a href="#">🌐 Website</a>
            </div>
            <p style="margin-top: 1rem; font-size: 0.8rem;">
              © 2024 WatchBuy. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Email sending functions
const sendEmail = async (to, subject, html, text = '') => {
  try {
    const mailOptions = {
      from: 'cortezdrew454@gmail.com',
      to: to,
      subject: subject,
      html: html,
      text: text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Specific email functions
const sendOrderCompletedEmail = async (orderData) => {
  const template = emailTemplates.orderCompleted(orderData);
  return await sendEmail(orderData.customerEmail, template.subject, template.html);
};

const sendOrderCanceledEmail = async (orderData) => {
  const template = emailTemplates.orderCanceled(orderData);
  return await sendEmail(orderData.customerEmail, template.subject, template.html);
};

const sendOrderConfirmationEmail = async (orderData) => {
  const template = emailTemplates.orderConfirmation(orderData);
  return await sendEmail(orderData.customerEmail, template.subject, template.html);
};

module.exports = {
  transporter,
  sendEmail,
  sendOrderCompletedEmail,
  sendOrderCanceledEmail,
  sendOrderConfirmationEmail,
  emailTemplates
}; 