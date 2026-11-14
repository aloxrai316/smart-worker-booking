// Creates / resets the admin account:  npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const ADMIN_EMAIL = 'aloxrai@123gmail.com';
const ADMIN_PASSWORD = '123456alox';

(async () => {
  try {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.query(
      `INSERT INTO users (full_name,email,password_hash,role,is_active) VALUES ('Alox Rai',?,?, 'admin', 1)
       ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role='admin', is_active=1`, [ADMIN_EMAIL, hash]);
    await db.query(`DELETE FROM users WHERE email='admin@smartworker.com' AND role='admin'`);
    console.log(`✅ Admin ready -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } catch (e) { console.error('❌ Seed failed:', e.message, '\n   -> check DB_PASSWORD in backend/.env'); }
  process.exit(0);
})();
