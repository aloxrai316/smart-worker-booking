const router = require('express').Router();
const db = require('../config/db');
const { auth, allow } = require('../middleware/auth');
const upload = require('../middleware/upload');

const num = (v) => (v === undefined || v === null || v === '' || isNaN(Number(v)) ? null : Number(v));

// GET /api/workers?category=&q=&minRating=&available=1&lat=&lng=&sort=distance
router.get('/', async (req, res) => {
  const { category, q, minRating, available, sort, limit } = req.query;
  const lat = num(req.query.lat), lng = num(req.query.lng);
  const hasLoc = lat !== null && lng !== null;
  const p = [];
  let dist = 'NULL';
  if (hasLoc) {
    dist = `IF(w.lat IS NULL, NULL, 6371 * ACOS(LEAST(1, COS(RADIANS(?)) * COS(RADIANS(w.lat)) * COS(RADIANS(w.lng) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(w.lat)))))`;
    p.push(lat, lng, lat);
  }
  let sql = `SELECT u.id, u.full_name, u.photo, u.address, w.skills, w.experience_years, w.availability,
                    w.is_available, w.avg_rating, w.rating_count, w.lat, w.lng, c.name AS category, c.icon,
                    ${dist} AS distance_km
             FROM worker_profiles w JOIN users u ON u.id=w.user_id JOIN categories c ON c.id=w.category_id
             WHERE w.is_verified=1 AND u.is_active=1`;
  if (category) { sql += ' AND c.id=?'; p.push(category); }
  if (q) { sql += ' AND (u.full_name LIKE ? OR w.skills LIKE ? OR u.address LIKE ? OR c.name LIKE ?)'; p.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`); }
  if (minRating) { sql += ' AND w.avg_rating>=?'; p.push(minRating); }
  if (available === '1') sql += ' AND w.is_available=1';
  sql += sort === 'distance' && hasLoc
    ? ' ORDER BY distance_km IS NULL, distance_km ASC, w.avg_rating DESC'
    : ' ORDER BY w.avg_rating DESC, w.experience_years DESC';
  if (limit) { sql += ' LIMIT ?'; p.push(Math.min(Number(limit) || 10, 50)); }
  const [rows] = await db.query(sql, p);
  res.json(rows);
});

// GET /api/workers/me/profile   (own profile + reviews, even if not yet verified)
router.get('/me/profile', auth, allow('worker'), async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id,u.full_name,u.email,u.phone,u.address,u.photo, w.*, c.name AS category, c.icon
     FROM users u JOIN worker_profiles w ON w.user_id=u.id JOIN categories c ON c.id=w.category_id WHERE u.id=?`, [req.user.id]);
  const [reviews] = await db.query(
    `SELECT r.rating,r.comment,r.created_at,u.full_name AS customer
     FROM reviews r JOIN users u ON u.id=r.customer_id WHERE r.worker_id=? AND r.is_hidden=0 ORDER BY r.created_at DESC`, [req.user.id]);
  res.json({ ...rows[0], reviews });
});

// PUT /api/workers/me/profile   (multipart: optional photo)
router.put('/me/profile', auth, allow('worker'), upload.single('photo'), async (req, res) => {
  const { full_name, phone, address, category_id, skills, bio, experience_years, service_info, availability, is_available } = req.body;
  await db.query(
    'UPDATE users SET full_name=COALESCE(?,full_name), phone=?, address=?, photo=COALESCE(?,photo) WHERE id=?',
    [full_name || null, phone || null, address || null, req.file ? `/uploads/${req.file.filename}` : null, req.user.id]);
  await db.query(
    `UPDATE worker_profiles SET category_id=COALESCE(?,category_id), skills=?, bio=?, experience_years=?,
       service_info=?, availability=?, is_available=?, lat=?, lng=? WHERE user_id=?`,
    [category_id || null, skills || '', bio || '', experience_years || 0, service_info || '',
     availability || '', is_available === '0' || is_available === 'false' ? 0 : 1,
     num(req.body.lat), num(req.body.lng), req.user.id]);
  // Optional testing shortcut: AUTO_VERIFY_WORKERS=true in .env shows workers to customers immediately
  if (process.env.AUTO_VERIFY_WORKERS === 'true')
    await db.query('UPDATE worker_profiles SET is_verified=1 WHERE user_id=?', [req.user.id]);
  res.json({ message: 'Profile saved' });
});

// GET /api/workers/:id   (public profile + reviews)
router.get('/:id', async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id,u.full_name,u.photo,u.address, w.skills,w.bio,w.experience_years,w.service_info,
            w.availability,w.is_available,w.avg_rating,w.rating_count,w.lat,w.lng, c.name AS category, c.icon
     FROM users u JOIN worker_profiles w ON w.user_id=u.id JOIN categories c ON c.id=w.category_id
     WHERE u.id=? AND w.is_verified=1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Worker not found' });
  const [reviews] = await db.query(
    `SELECT r.rating,r.comment,r.created_at,u.full_name AS customer
     FROM reviews r JOIN users u ON u.id=r.customer_id WHERE r.worker_id=? AND r.is_hidden=0 ORDER BY r.created_at DESC`,
    [req.params.id]);
  res.json({ ...rows[0], reviews });
});

module.exports = router;
