const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/fileUploadDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Schema
const fileSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const File = mongoose.model("File", fileSchema);

// Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Upload Route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const newFile = new File({
      filename: req.file.filename,
      originalname: req.file.originalname
    });

    await newFile.save();

    res.json({ message: "File uploaded successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Upload failed" });
  }
});

// Get All Files
app.get("/files", async (req, res) => {
  const files = await File.find().sort({ uploadDate: -1 });
  res.json(files);
});

// Start Server
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
