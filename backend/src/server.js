require('dotenv').config();
require('express-async-errors'); // async route errors -> error handler (server never crashes)
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const { startExpiryJob } = require('./utils/expiry');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Request error:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});
process.on('unhandledRejection', (e) => console.error('Unhandled:', e?.message || e));

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`API running on http://localhost:${PORT}`);
  try {
    await db.query('SELECT 1');
    console.log('✅ Database connected');
  } catch (e) {
    console.error('❌ DATABASE ERROR:', e.message);
    console.error('   -> Check DB_PASSWORD / DB_NAME in backend/.env and that you imported database/schema.sql');
  }
  startExpiryJob();
});
