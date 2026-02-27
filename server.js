// ─────────────────────────────────────────
//  server.js — Main Entry Point
// ─────────────────────────────────────────

const express     = require('express');
const cors        = require('cors');
const morgan      = require('morgan');
const path        = require('path');
const dotenv      = require('dotenv');
const connectDB   = require('./config/db');
const entryRoutes = require('./routes/entryRoutes');

// Load .env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ────────────────────────────

// Allow requests from frontend (CORS)
app.use(cors());

// Parse JSON body
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Log every request in terminal (helpful for debugging)
app.use(morgan('dev'));

// ── STATIC FILES ──────────────────────────
// Serve your frontend files from /public folder
// Put your index.html, style.css, app.js inside /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API ROUTES ────────────────────────────
app.use('/api', entryRoutes);

// ── HEALTH CHECK ──────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Vault API is running!',
    time: new Date().toISOString()
  });
});

// ── CATCH ALL ─────────────────────────────
// For any unknown route, serve frontend index.html
// This makes React/SPA routing work too
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── ERROR HANDLER ─────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, error: 'File too large. Max 5MB.' });
  }

  res.status(500).json({ success: false, error: err.message || 'Server error' });
});

// ── START SERVER ──────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving frontend from /public`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
});
