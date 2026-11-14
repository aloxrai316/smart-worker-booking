const db = require('../config/db');

// Recalculate a worker's average rating from visible reviews
exports.recalc = async (workerId) => {
  await db.query(
    `UPDATE worker_profiles SET
       avg_rating = COALESCE((SELECT ROUND(AVG(rating),2) FROM reviews WHERE worker_id=? AND is_hidden=0),0),
       rating_count = (SELECT COUNT(*) FROM reviews WHERE worker_id=? AND is_hidden=0)
     WHERE user_id=?`, [workerId, workerId, workerId]);
};
