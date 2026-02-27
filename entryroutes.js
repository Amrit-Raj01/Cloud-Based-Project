// ─────────────────────────────────────────
//  routes/entryRoutes.js — API Routes
// ─────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const upload  = require('../config/multer');
const Entry   = require('../models/Entry');

// ── POST /submit ──────────────────────────
// Receive form data + optional file upload
// Body: { name, email, message }
// File: file (optional)

router.post('/submit', upload.single('file'), async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and message are required'
      });
    }

    // Build entry object
    const entryData = { name, email, message };

    // If file was uploaded, save its info
    if (req.file) {
      entryData.file = {
        filename:     req.file.filename,
        originalname: req.file.originalname,
        mimetype:     req.file.mimetype,
        size:         req.file.size,
        path:         req.file.path
      };
    }

    // Save to MongoDB
    const entry = await Entry.create(entryData);

    res.status(201).json({
      success: true,
      message: 'Entry saved successfully!',
      data: entry
    });

  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: errors.join(', ') });
    }

    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// ── GET /entries ──────────────────────────
// Get all entries from database

router.get('/entries', async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 }); // newest first

    res.json({
      success: true,
      count: entries.length,
      data: entries
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// ── GET /entries/:id ──────────────────────
// Get single entry by ID

router.get('/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    res.json({ success: true, data: entry });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// ── DELETE /entries/:id ───────────────────
// Delete an entry

router.delete('/entries/:id', async (req, res) => {
  try {
    const entry = await Entry.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }

    res.json({ success: true, message: 'Entry deleted' });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


module.exports = router;
