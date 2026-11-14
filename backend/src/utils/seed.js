// Creates / resets the admin account:  npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

(async () => {
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before seeding.');
    }
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.query(
      `INSERT INTO users (full_name,email,password_hash,role,is_active) VALUES (?,?,?, 'admin', 1)
       ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), password_hash=VALUES(password_hash), role='admin', is_active=1`,
      [ADMIN_NAME, ADMIN_EMAIL, hash]);
    await db.query(`DELETE FROM users WHERE email='admin@smartworker.com' AND role='admin'`);
    console.log(`✅ Admin ready -> ${ADMIN_EMAIL}`);
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();
