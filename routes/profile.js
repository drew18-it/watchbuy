const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// ✅ Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/* ====================
   ✅ GET /user - Fetch current user profile
==================== */
router.get('/user', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const userId = req.session.user.id;

  try {
    // Use session data if available
    if (req.session.user.fname && req.session.user.lname && req.session.user.email) {
      return res.json({
        id: req.session.user.id,
        fname: req.session.user.fname,
        lname: req.session.user.lname,
        email: req.session.user.email,
        img_path: req.session.user.img_path || ''
      });
    }

    // Fallback: fetch from DB
    const [rows] = await db.query(
      'SELECT id, fname, lname, email, img_path FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    user.img_path = user.img_path || '';

    // Sync session with DB
    req.session.user = { ...req.session.user, ...user };

    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ====================
   ✅ GET /user/stats - Fetch user statistics
==================== */
router.get('/user/stats', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const userId = req.session.user.id;

  try {
    // Get order count and total spent
    const [orderStats] = await db.query(
      `SELECT 
        COUNT(*) as orderCount,
        COALESCE(SUM(total_amount), 0) as totalSpent
       FROM orders 
       WHERE user_id = ?`,
      [userId]
    );

    // Get member since date
    const [userInfo] = await db.query(
      'SELECT created_at FROM users WHERE id = ?',
      [userId]
    );

    const stats = {
      orderCount: orderStats[0]?.orderCount || 0,
      totalSpent: parseFloat(orderStats[0]?.totalSpent || 0),
      memberSince: userInfo[0]?.created_at ? 
        new Date(userInfo[0].created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }) : '-'
    };

    res.json(stats);
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ====================
   ✅ POST /user/update - Update profile (text + image + password)
==================== */
router.post('/user/update', upload.single('image'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const userId = req.session.user.id;
  const { fname, lname, email, password } = req.body;
  const image = req.file;

  // Validation
  if (!fname || !lname || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  // Password validation (if provided)
  if (password && password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if email is already taken by another user
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email address is already in use' });
    }

    // Get current image path from DB
    const [rows] = await db.query('SELECT img_path FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    let imgPath = rows[0].img_path;

    // ✅ Handle new image upload
    if (image) {
      // Delete old image if it exists and is not the default
      if (imgPath && imgPath !== '' && !imgPath.includes('placeholder')) {
        const oldImagePath = path.join(__dirname, '..', 'public', imgPath.replace('/uploads/', ''));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      imgPath = '/uploads/' + image.filename;
    }

    // ✅ Update with new password (if provided)
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET fname = ?, lname = ?, email = ?, password = ?, img_path = ? WHERE id = ?',
        [fname, lname, email, hashedPassword, imgPath, userId]
      );
    } else {
      await db.query(
        'UPDATE users SET fname = ?, lname = ?, email = ?, img_path = ? WHERE id = ?',
        [fname, lname, email, imgPath, userId]
      );
    }

    // ✅ Update session data
    req.session.user.fname = fname;
    req.session.user.lname = lname;
    req.session.user.email = email;
    req.session.user.img_path = imgPath;

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: {
        id: userId,
        fname,
        lname,
        email,
        img_path: imgPath
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    
    // Clean up uploaded file if there was an error
    if (image) {
      const imagePath = path.join(uploadDir, image.filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ====================
   ✅ DELETE /user/image - Delete profile image
==================== */
router.delete('/user/image', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const userId = req.session.user.id;

  try {
    // Get current image path
    const [rows] = await db.query('SELECT img_path FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const imgPath = rows[0].img_path;

    // Delete image file if it exists
    if (imgPath && imgPath !== '' && !imgPath.includes('placeholder')) {
      const imagePath = path.join(__dirname, '..', 'public', imgPath.replace('/uploads/', ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Update database to remove image path
    await db.query('UPDATE users SET img_path = NULL WHERE id = ?', [userId]);
    
    // Update session
    req.session.user.img_path = '';

    res.json({ 
      success: true, 
      message: 'Profile image removed successfully' 
    });
  } catch (err) {
    console.error('Error deleting profile image:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
