const multer = require('multer');
const path = require('path');

module.exports = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../uploads'),
    filename: (req, file, cb) =>
      cb(null, `u${req.user.id}-${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /image\/(jpe?g|png|webp)/.test(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG/PNG/WEBP images allowed')),
});
