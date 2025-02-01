// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5003;
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Make sure the 'index.html' file is in the same directory
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/image_collage', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected')).catch(err => console.log(err));

// Image Storage Setup
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Image Schema
const ImageSchema = new mongoose.Schema({
  filename: String,
  path: String,
});
const Image = mongoose.model('Image', ImageSchema);

// Upload Images
app.post('/upload', upload.array('images', 4), async (req, res) => {
  try {
    const imageDocs = req.files.map(file => ({ filename: file.filename, path: file.path }));
    await Image.insertMany(imageDocs);
    res.json({ success: true, images: imageDocs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate Collage
app.post('/collage', async (req, res) => {
  try {
    const images = await Image.find().limit(4);
    if (images.length < 2) return res.status(400).json({ success: false, message: 'At least 2 images needed' });

    const collagePath = `./public/collage-${Date.now()}.jpg`;
    const imageBuffers = await Promise.all(images.map(img => sharp(img.path).resize(300, 300).toBuffer()));
    
    await sharp({ create: { width: 600, height: 600, channels: 3, background: 'white' } })
      .composite(imageBuffers.map((buffer, index) => ({
        input: buffer,
        left: (index % 2) * 300,
        top: Math.floor(index / 2) * 300,
      })))
      .toFile(collagePath);

    res.json({ success: true, collage: collagePath });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
