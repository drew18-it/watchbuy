const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

/* ====================
    Register Route
==================== */
router.post('/register', upload.single('img_path'), async (req, res) => {
  const { fname, lname, email, password } = req.body;
  const imgPath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [existing] = await db.execute(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing.length > 0) {
      return res.status(400).send('Email already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute(`
      INSERT INTO users (fname, lname, email, password, img_path, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [fname, lname, email, hashedPassword, imgPath, 'active']);

    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Server error. Please try again.');
  }
});

/* ====================
    Login Route
==================== */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).send('Invalid email or password.');
    }

    const user = users[0];

    // Block login if user is inactive
    if (user.status !== 'active') {
      return res.status(403).send('Your account is inactive. Please contact the administrator.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid email or password.');
    }

    // Set session
    req.session.user = {
      id: user.id,
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      role: user.role || 'customer'
    };

    res.redirect('/index.html');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Login failed. Try again.');
  }
});

/* ====================
    Logout Route
==================== */
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Logout failed.');
    }
    res.redirect('/index.html');
  });
});

/* ===========================
    Session Check (AJAX)
=========================== */
router.get('/session-data', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

/* ===========================
    Get Logged-in User Info
=========================== */
router.get('/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, fname, lname, email } = req.session.user;
  res.json({ id, fname, lname, email });
});

module.exports = router;
