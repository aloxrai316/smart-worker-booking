const router = require('express').Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// PUT /api/profile  (basic profile for any user)
router.put('/', auth, upload.single('photo'), async (req, res) => {
  const { full_name, phone, address } = req.body;
  await db.query(
    'UPDATE users SET full_name=COALESCE(?,full_name), phone=?, address=?, photo=COALESCE(?,photo) WHERE id=?',
    [full_name || null, phone || null, address || null, req.file ? `/uploads/${req.file.filename}` : null, req.user.id]);
  res.json({ message: 'Profile updated' });
});

module.exports = router;
