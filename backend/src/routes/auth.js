const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { auth } = require('../middleware/auth');

const sign = (u) =>
  jwt.sign({ id: u.id, role: u.role, name: u.full_name }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register   (role: customer | worker)
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, phone, address, role = 'customer', category_id, skills, experience_years } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (!['customer', 'worker'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    if (role === 'worker' && !category_id) return res.status(400).json({ message: 'Choose your service category' });

    const [dup] = await db.query('SELECT id FROM users WHERE email=?', [email]);
    if (dup.length) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO users (full_name,email,password_hash,phone,address,role) VALUES (?,?,?,?,?,?)',
      [full_name, email, hash, phone || null, address || null, role]
    );
    if (role === 'worker') {
      await db.query(
        'INSERT INTO worker_profiles (user_id,category_id,skills,experience_years) VALUES (?,?,?,?)',
        [r.insertId, category_id, skills || '', experience_years || 0]
      );
    }
    const user = { id: r.insertId, role, full_name };
    res.status(201).json({ token: sign(user), user });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
      return res.status(401).json({ message: 'Wrong email or password' });
    if (role && u.role !== role) {
      const nice = { customer: 'a Customer', worker: 'a Worker', admin: 'an Admin' }[u.role];
      return res.status(403).json({ message: `This account is registered as ${nice}. Please use the correct login tab.` });
    }
    if (!u.is_active) return res.status(403).json({ message: 'Account is blocked. Contact admin.' });
    res.json({ token: sign(u), user: { id: u.id, role: u.role, full_name: u.full_name } });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id,full_name,email,phone,address,photo,role FROM users WHERE id=?', [req.user.id]);
  res.json(rows[0]);
});

module.exports = router;
