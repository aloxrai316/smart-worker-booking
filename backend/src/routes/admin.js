const router = require('express').Router();
const db = require('../config/db');
const { auth, allow } = require('../middleware/auth');
const { recalc } = require('../utils/rating');
const { expireOldBookings } = require('../utils/expiry');

router.use(auth, allow('admin'));

// GET /api/admin/stats   (system reports)
router.get('/stats', async (req, res) => {
  await expireOldBookings();
  const [[s]] = await db.query(`SELECT
    (SELECT COUNT(*) FROM users WHERE role='customer') AS customers,
    (SELECT COUNT(*) FROM users WHERE role='worker') AS workers,
    (SELECT COUNT(*) FROM worker_profiles WHERE is_verified=0) AS pending_verification,
    (SELECT COUNT(*) FROM bookings) AS bookings,
    (SELECT COUNT(*) FROM bookings WHERE status='completed') AS completed,
    (SELECT COUNT(*) FROM complaints WHERE status='open') AS open_complaints,
    (SELECT COALESCE(SUM(amount),0) FROM payments) AS revenue`);
  const [byStatus] = await db.query('SELECT status, COUNT(*) AS count FROM bookings GROUP BY status');
  const [byCategory] = await db.query(
    `SELECT c.name, COUNT(b.id) AS count FROM categories c
     LEFT JOIN worker_profiles w ON w.category_id=c.id LEFT JOIN bookings b ON b.worker_id=w.user_id GROUP BY c.id`);
  res.json({ ...s, byStatus, byCategory });
});

// ----- customers & workers -----
router.get('/users', async (req, res) => {
  const role = ['customer', 'worker'].includes(req.query.role) ? req.query.role : null;
  const [rows] = await db.query(
    `SELECT u.id,u.full_name,u.email,u.phone,u.address,u.role,u.is_active,u.created_at,
            w.is_verified, c.name AS category
     FROM users u LEFT JOIN worker_profiles w ON w.user_id=u.id LEFT JOIN categories c ON c.id=w.category_id
     WHERE u.role IN ('customer','worker') ${role ? 'AND u.role=?' : ''} ORDER BY u.created_at DESC`,
    role ? [role] : []);
  res.json(rows);
});
router.patch('/users/:id/active', async (req, res) => {
  await db.query(`UPDATE users SET is_active=? WHERE id=? AND role<>'admin'`, [req.body.is_active ? 1 : 0, req.params.id]);
  res.json({ message: 'Updated' });
});
router.patch('/workers/:id/verify', async (req, res) => {
  await db.query('UPDATE worker_profiles SET is_verified=? WHERE user_id=?', [req.body.verified ? 1 : 0, req.params.id]);
  res.json({ message: req.body.verified ? 'Worker verified' : 'Verification removed' });
});

// ----- service categories -----
router.post('/categories', async (req, res) => {
  if (!req.body.name) return res.status(400).json({ message: 'Name required' });
  try { await db.query('INSERT INTO categories (name,icon) VALUES (?,?)', [req.body.name, req.body.icon || '🛠️']); }
  catch { return res.status(409).json({ message: 'Category already exists' }); }
  res.status(201).json({ message: 'Category added' });
});
router.delete('/categories/:id', async (req, res) => {
  try { await db.query('DELETE FROM categories WHERE id=?', [req.params.id]); }
  catch { return res.status(400).json({ message: 'Category is used by workers' }); }
  res.json({ message: 'Deleted' });
});

// ----- bookings monitor -----
router.get('/bookings', async (req, res) => {
  await expireOldBookings();
  const [rows] = await db.query(
    `SELECT b.id,b.status,b.service_date,b.created_at, cu.full_name AS customer, wu.full_name AS worker,
            c.name AS category, p.amount
     FROM bookings b JOIN users cu ON cu.id=b.customer_id JOIN users wu ON wu.id=b.worker_id
     JOIN worker_profiles w ON w.user_id=b.worker_id JOIN categories c ON c.id=w.category_id
     LEFT JOIN payments p ON p.booking_id=b.id ORDER BY b.created_at DESC LIMIT 300`);
  res.json(rows);
});

// ----- complaints -----
router.get('/complaints', async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.*, f.full_name AS from_name, a.full_name AS against_name
     FROM complaints c JOIN users f ON f.id=c.from_user LEFT JOIN users a ON a.id=c.against_user
     ORDER BY c.status ASC, c.created_at DESC`);
  res.json(rows);
});
router.patch('/complaints/:id', async (req, res) => {
  await db.query(`UPDATE complaints SET status='resolved', admin_note=? WHERE id=?`, [req.body.admin_note || '', req.params.id]);
  res.json({ message: 'Complaint resolved' });
});

// ----- review moderation -----
router.get('/reviews', async (req, res) => {
  const [rows] = await db.query(
    `SELECT r.*, cu.full_name AS customer, wu.full_name AS worker
     FROM reviews r JOIN users cu ON cu.id=r.customer_id JOIN users wu ON wu.id=r.worker_id ORDER BY r.created_at DESC`);
  res.json(rows);
});
router.patch('/reviews/:id/hide', async (req, res) => {
  const [[r]] = await db.query('SELECT worker_id FROM reviews WHERE id=?', [req.params.id]);
  if (!r) return res.status(404).json({ message: 'Not found' });
  await db.query('UPDATE reviews SET is_hidden=? WHERE id=?', [req.body.hidden ? 1 : 0, req.params.id]);
  await recalc(r.worker_id);
  res.json({ message: 'Review updated' });
});

module.exports = router;
