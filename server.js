const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'invitation.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const GALLERY_DIR = path.join(UPLOADS_DIR, 'gallery');
const AUDIO_DIR = path.join(__dirname, 'public', 'audio');

[DATA_DIR, UPLOADS_DIR, GALLERY_DIR, AUDIO_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer Storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'gallery') {
      cb(null, GALLERY_DIR);
    } else if (file.fieldname === 'music') {
      cb(null, AUDIO_DIR);
    } else {
      cb(null, UPLOADS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();

    if (file.fieldname === 'bride') {
      cb(null, `bride_${timestamp}${ext}`);
    } else if (file.fieldname === 'groom') {
      cb(null, `groom_${timestamp}${ext}`);
    } else if (file.fieldname === 'companyLogo') {
      cb(null, `company_logo_${timestamp}${ext}`);
    } else if (file.fieldname === 'music') {
      cb(null, `wedding_music_${timestamp}${ext}`);
    } else {
      cb(null, `${cleanBase}_${timestamp}${ext}`);
    }
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB
});

// Helper to read data safely
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading invitation.json:', err);
  }
  return {};
}

// Helper to write data safely
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing invitation.json:', err);
    return false;
  }
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Public API: Get Invitation Details
app.get('/api/invitation', (req, res) => {
  const data = readData();
  res.json({ success: true, data });
});

// Admin API: Update Invitation Details
app.post('/api/invitation', (req, res) => {
  const updatedData = req.body;
  if (!updatedData || typeof updatedData !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }

  const ok = writeData(updatedData);
  if (ok) {
    res.json({ success: true, message: 'निमंत्रण डेटा सफलतापूर्वक सुरक्षित कर लिया गया!', data: updatedData });
  } else {
    res.status(500).json({ success: false, message: 'डेटा सुरक्षित करने में त्रुटि हुई।' });
  }
});

// Admin API: Upload Single File (Bride, Groom, Logo, Music)
app.post('/api/upload', upload.fields([
  { name: 'bride', maxCount: 1 },
  { name: 'groom', maxCount: 1 },
  { name: 'companyLogo', maxCount: 1 },
  { name: 'music', maxCount: 1 },
  { name: 'gallery', maxCount: 10 }
]), (req, res) => {
  const data = readData();
  const files = req.files || {};
  const responseData = {};

  if (files.bride && files.bride[0]) {
    const bridePath = `/uploads/${files.bride[0].filename}`;
    if (!data.couple) data.couple = {};
    if (!data.couple.bride) data.couple.bride = {};
    data.couple.bride.photo = bridePath;
    responseData.bridePhoto = bridePath;
  }

  if (files.groom && files.groom[0]) {
    const groomPath = `/uploads/${files.groom[0].filename}`;
    if (!data.couple) data.couple = {};
    if (!data.couple.groom) data.couple.groom = {};
    data.couple.groom.photo = groomPath;
    responseData.groomPhoto = groomPath;
  }

  if (files.companyLogo && files.companyLogo[0]) {
    const logoPath = `/uploads/${files.companyLogo[0].filename}`;
    if (!data.general) data.general = {};
    if (!data.general.company) data.general.company = {};
    data.general.company.logoUrl = logoPath;
    data.general.company.showLogo = true;
    responseData.companyLogo = logoPath;
  }

  if (files.music && files.music[0]) {
    const musicPath = `/audio/${files.music[0].filename}`;
    if (!data.general) data.general = {};
    data.general.musicUrl = musicPath;
    responseData.musicUrl = musicPath;
  }

  if (files.gallery && files.gallery.length > 0) {
    if (!data.gallery) data.gallery = [];
    const addedPhotos = files.gallery.map((f, i) => ({
      url: `/uploads/gallery/${f.filename}`,
      caption: req.body[`galleryCaption_${i}`] || 'शुभ परिणय क्षण',
      category: 'celebration'
    }));
    data.gallery.push(...addedPhotos);
    responseData.addedGallery = addedPhotos;
  }

  writeData(data);
  res.json({
    success: true,
    message: 'फाइलें सफलतापूर्वक अपलोड कर दी गईं!',
    uploaded: responseData,
    invitation: data
  });
});

// Admin API: Delete Gallery Item
app.delete('/api/gallery/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  const data = readData();
  if (data.gallery && data.gallery[index]) {
    const removed = data.gallery.splice(index, 1);
    writeData(data);
    res.json({ success: true, message: 'फोटो हटा दी गई', removed, gallery: data.gallery });
  } else {
    res.status(404).json({ success: false, message: 'फोटो नहीं मिली' });
  }
});

// Dedicated Routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback to index.html for guest experience
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`✨ MINTO WEDDING INVITATION SERVER RUNNING ✨`);
  console.log(`🔗 Guest Invitation: http://localhost:${PORT}/`);
  console.log(`🛠️ Private Admin Editor: http://localhost:${PORT}/admin`);
  console.log(`======================================================\n`);
});
