// Run once:  npm run migrate   (safe to run many times)
require('dotenv').config();
const db = require('../config/db');

async function addColumn(table, column, ddl) {
  const [r] = await db.query(
    `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?`, [table, column]);
  if (!r.length) { await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`); console.log(`+ ${table}.${column}`); }
}

(async () => {
  try {
    await addColumn('worker_profiles', 'lat', 'DECIMAL(10,7) NULL');
    await addColumn('worker_profiles', 'lng', 'DECIMAL(10,7) NULL');
    await addColumn('bookings', 'lat', 'DECIMAL(10,7) NULL');
    await addColumn('bookings', 'lng', 'DECIMAL(10,7) NULL');
    const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM categories');
    if (!n) {
      await db.query(`INSERT INTO categories (name, icon) VALUES ('Electrician','⚡'),('Plumber','🚰'),('Carpenter','🪚'),('Painter','🎨'),('AC Repair','❄️'),('Cleaner','🧹'),('Mechanic','🔧')`);
      console.log('+ default categories');
    }
    console.log('✅ Migration complete');
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();
