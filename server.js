const express = require('express');
const path = require('path');
const session = require('express-session');

const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const orderRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile'); 
const searchRoutes = require('./routes/search');
const reviewRoutes = require('./routes/reviews');

const app = express();
const PORT = 3000;

// Add error handling middleware
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.use(session({
  secret: 'watchbuy-secret-key-2025', 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  } 
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Test route to check if images are accessible
app.get('/test-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'public', 'uploads', filename);
  console.log('Testing image path:', imagePath);
  
  if (require('fs').existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: 'Image not found', path: imagePath });
  }
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const db = require('./config/db');
    const [result] = await db.query('SELECT 1 as test');
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Database test error:', err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// Test session
app.get('/test-session', (req, res) => {
  res.json({ 
    sessionExists: !!req.session, 
    user: req.session.user,
    sessionId: req.sessionID 
  });
});

app.get('/session-data', (req, res) => {
  if (req.session.user) {
    res.json({
      loggedIn: true,
      user: {
        id: req.session.user.id,
        fname: req.session.user.fname,
        role: req.session.user.role
      }
    });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get(['/index.html', '/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'register.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'views', 'cart.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'views', 'shop.html')));
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, 'views', 'search.html')));
app.get('/orders', (req, res) => res.sendFile(path.join(__dirname, 'views', 'orders.html')));  
app.get('/admin-users', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-users.html'));
});
app.get('/admin-orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-orders.html'));
});
app.get('/admin/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-products.html'));
});
app.get('/admin-charts', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-charts.html'));
});
app.get('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});
app.get('/product.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'product.html'));
});


app.get('/admin-categories', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-categories.html'));
});
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

// 👇👇👇 ADDING /api/stats ROUTE HERE 👇👇👇
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

async function getDashboardStats() {
  const db = require('./config/db');
  const [userResult] = await db.query('SELECT COUNT(*) AS total_users FROM users');
  const [orderResult] = await db.query('SELECT COUNT(*) AS total_orders FROM orders');
  const [revenueResult] = await db.query('SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE status = "paid"');

  return {
    totalUsers: userResult[0].total_users,
    totalOrders: orderResult[0].total_orders,
    totalRevenue: revenueResult[0].total_revenue || 0
  };
}
// 👆👆👆 END OF /api/stats ROUTE 👆👆👆

app.use('/', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);

// Add logging for reviews routes
app.use('/api/reviews', (req, res, next) => {
  console.log(`Reviews API called: ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  next();
}, reviewRoutes);

app.use('/api', profileRoutes);
app.use('/search', searchRoutes);



app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
