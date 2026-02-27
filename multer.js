// ─────────────────────────────────────────
//  config/multer.js — File Upload Config
// ─────────────────────────────────────────

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Make sure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Where and how to save files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + original name
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  }
});

// Only allow these file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);   // accept file
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, PDF, TXT allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB max
  }
});

module.exports = upload;
