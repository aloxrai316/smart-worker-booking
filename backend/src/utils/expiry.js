const db = require('../config/db');

// Pending requests the worker did not answer within the window become "expired"
async function expireOldBookings() {
  await db.query(`UPDATE bookings SET status='expired' WHERE status='pending' AND response_deadline < NOW()`);
}
const startExpiryJob = () => setInterval(() => expireOldBookings().catch(console.error), 30 * 1000);

module.exports = { expireOldBookings, startExpiryJob };
