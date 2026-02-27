// ─────────────────────────────────────────
//  models/Entry.js — MongoDB Schema
// ─────────────────────────────────────────

const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    // Form fields
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name too long']
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },

    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message too long']
    },

    // File upload (optional)
    file: {
      filename:     { type: String, default: null },
      originalname: { type: String, default: null },
      mimetype:     { type: String, default: null },
      size:         { type: Number, default: null },
      path:         { type: String, default: null }
    }
  },
  {
    timestamps: true  // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('Entry', entrySchema);
