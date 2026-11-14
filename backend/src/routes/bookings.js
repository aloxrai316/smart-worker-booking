const router = require('express').Router();
const db = require('../config/db');
const { auth, allow } = require('../middleware/auth');
const { expireOldBookings } = require('../utils/expiry');
const { recalc } = require('../utils/rating');

const CHARGE = Number(process.env.BOOKING_CHARGE || 100);
const WINDOW = Number(process.env.RESPONSE_WINDOW_MIN || 10);

// Worker may only see customer phone + address once the booking is paid (confirmed)
const VISIBLE_TO_WORKER = ['confirmed', 'in_progress', 'completed'];

// POST /api/bookings   (customer submits request with a pinned map location)
router.post('/', auth, allow('customer'), async (req, res) => {
  const { worker_id, service_date, description, contact_phone, house_address, lat, lng } = req.body;
  if (!worker_id || !contact_phone || !house_address)
    return res.status(400).json({ message: 'Phone number and full house address are required' });
  if (lat === undefined || lat === null || lat === '' || lng === undefined || lng === null || lng === '')
    return res.status(400).json({ message: 'Please pin your work location on the map' });
  const [w] = await db.query(
    'SELECT user_id FROM worker_profiles WHERE user_id=? AND is_verified=1 AND is_available=1', [worker_id]);
  if (!w.length) return res.status(400).json({ message: 'This worker is not available for booking' });

  const [r] = await db.query(
    `INSERT INTO bookings (customer_id,worker_id,service_date,description,contact_phone,house_address,lat,lng,response_deadline)
     VALUES (?,?,?,?,?,?,?,?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [req.user.id, worker_id, service_date || null, description || '', contact_phone, house_address, lat, lng, WINDOW]);
  res.status(201).json({ id: r.insertId, message: `Request sent. The worker has ${WINDOW} minutes to respond.` });
});

// GET /api/bookings/mine   (customer history / worker bookings)
router.get('/mine', auth, allow('customer', 'worker'), async (req, res) => {
  await expireOldBookings();
  const isWorker = req.user.role === 'worker';
  const [rows] = await db.query(
    `SELECT b.*, TIMESTAMPDIFF(SECOND, NOW(), b.response_deadline) AS seconds_left,
            cu.full_name AS customer_name, wu.full_name AS worker_name, wu.photo AS worker_photo,
            c.name AS category, (p.id IS NOT NULL) AS paid, (r.id IS NOT NULL) AS reviewed
     FROM bookings b
     JOIN users cu ON cu.id=b.customer_id
     JOIN users wu ON wu.id=b.worker_id
     JOIN worker_profiles wp ON wp.user_id=b.worker_id
     JOIN categories c ON c.id=wp.category_id
     LEFT JOIN payments p ON p.booking_id=b.id
     LEFT JOIN reviews r ON r.booking_id=b.id
     WHERE ${isWorker ? 'b.worker_id' : 'b.customer_id'}=? ORDER BY b.created_at DESC`, [req.user.id]);

  res.json(rows.map((b) => {
    if (isWorker && !VISIBLE_TO_WORKER.includes(b.status)) {
      b.contact_phone = null;
      b.house_address = null;
      b.lat = null;
      b.lng = null;
      b.customer_name = 'Hidden until payment';
    }
    return b;
  }));
});

// PATCH /api/bookings/:id/respond   (worker accepts / rejects within the window)
router.patch('/:id/respond', auth, allow('worker'), async (req, res) => {
  await expireOldBookings();
  const accept = req.body.action === 'accept';
  const [r] = await db.query(
    `UPDATE bookings SET status=? WHERE id=? AND worker_id=? AND status='pending' AND response_deadline >= NOW()`,
    [accept ? 'accepted' : 'rejected', req.params.id, req.user.id]);
  if (!r.affectedRows) return res.status(400).json({ message: 'Request expired or already handled' });
  res.json({ message: accept ? 'Accepted. Waiting for customer payment.' : 'Request rejected.' });
});

// POST /api/bookings/:id/pay   (customer pays Rs. 100 after the worker accepts)
// NOTE: demo payment. Replace with eSewa / Khalti verification for production.
router.post('/:id/pay', auth, allow('customer'), async (req, res) => {
  const [b] = await db.query('SELECT status FROM bookings WHERE id=? AND customer_id=?', [req.params.id, req.user.id]);
  if (!b.length || b[0].status !== 'accepted')
    return res.status(400).json({ message: 'Payment is only possible after the worker accepts' });
  await db.query('INSERT INTO payments (booking_id,amount,method,reference) VALUES (?,?,?,?)',
    [req.params.id, CHARGE, req.body.method || 'demo', `TXN${Date.now()}`]);
  await db.query(`UPDATE bookings SET status='confirmed' WHERE id=?`, [req.params.id]);
  res.json({ message: `Rs. ${CHARGE} paid. Booking confirmed!` });
});

// PATCH /api/bookings/:id/status   (worker: confirmed -> in_progress -> completed)
router.patch('/:id/status', auth, allow('worker'), async (req, res) => {
  const next = req.body.status;
  const from = { in_progress: 'confirmed', completed: 'in_progress' }[next];
  if (!from) return res.status(400).json({ message: 'Invalid status' });
  const [r] = await db.query('UPDATE bookings SET status=? WHERE id=? AND worker_id=? AND status=?',
    [next, req.params.id, req.user.id, from]);
  if (!r.affectedRows) return res.status(400).json({ message: 'Cannot change status right now' });
  res.json({ message: `Marked as ${next.replace('_', ' ')}` });
});

// PATCH /api/bookings/:id/cancel   (customer, before work starts)
router.patch('/:id/cancel', auth, allow('customer'), async (req, res) => {
  const [r] = await db.query(
    `UPDATE bookings SET status='cancelled' WHERE id=? AND customer_id=? AND status IN ('pending','accepted','confirmed')`,
    [req.params.id, req.user.id]);
  if (!r.affectedRows) return res.status(400).json({ message: 'This booking can no longer be cancelled' });
  res.json({ message: 'Booking cancelled' });
});

// POST /api/bookings/:id/review   (customer rates after completion)
router.post('/:id/review', auth, allow('customer'), async (req, res) => {
  const { rating, comment } = req.body;
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ message: 'Rating must be 1-5' });
  const [b] = await db.query(`SELECT worker_id FROM bookings WHERE id=? AND customer_id=? AND status='completed'`,
    [req.params.id, req.user.id]);
  if (!b.length) return res.status(400).json({ message: 'You can review only completed bookings' });
  try {
    await db.query('INSERT INTO reviews (booking_id,customer_id,worker_id,rating,comment) VALUES (?,?,?,?,?)',
      [req.params.id, req.user.id, b[0].worker_id, rating, comment || '']);
  } catch { return res.status(409).json({ message: 'Already reviewed' }); }
  await recalc(b[0].worker_id);
  res.status(201).json({ message: 'Thanks for your feedback!' });
});

// POST /api/bookings/:id/complaint
router.post('/:id/complaint', auth, allow('customer', 'worker'), async (req, res) => {
  if (!req.body.message) return res.status(400).json({ message: 'Please describe the problem' });
  const [b] = await db.query('SELECT customer_id, worker_id FROM bookings WHERE id=? AND (customer_id=? OR worker_id=?)',
    [req.params.id, req.user.id, req.user.id]);
  if (!b.length) return res.status(404).json({ message: 'Booking not found' });
  const against = b[0].customer_id === req.user.id ? b[0].worker_id : b[0].customer_id;
  await db.query('INSERT INTO complaints (booking_id,from_user,against_user,message) VALUES (?,?,?,?)',
    [req.params.id, req.user.id, against, req.body.message]);
  res.status(201).json({ message: 'Complaint submitted to admin' });
});

module.exports = router;
