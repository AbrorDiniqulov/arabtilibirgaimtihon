require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Create temp directory
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB ulandi'))
    .catch(err => console.log('MongoDB xatosi:', err.message));
} else {
  console.log('MONGODB_URI o\'rnatilmagan - LocalStorage rejimi');
}

// Schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: { type: String, default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

const ExamResultSchema = new mongoose.Schema({
  studentName: String,
  studentEmail: String,
  answers: Object,
  section: String,
  zipFileName: String,
  submittedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const ExamResult = mongoose.models.ExamResult || mongoose.model('ExamResult', ExamResultSchema);

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Email config
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_TO = process.env.EMAIL_TO || EMAIL_USER;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// JWT Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token talab qilinadi' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    next();
  } catch {
    res.status(403).json({ error: 'Token noto\'g\'ri' });
  }
};

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Barcha maydonlar talab qilinadi' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone });
    await user.save();
    res.json({ success: true, message: 'Ro\'yxatdan o\'tildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit exam with ZIP
app.post('/api/submit-exam', upload.single('zipFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ZIP fayl yuklanmadi' });

    const { studentName, studentEmail, section } = req.body;
    const zipPath = path.join(TEMP_DIR, Date.now() + '_exam.zip');
    fs.writeFileSync(zipPath, req.file.buffer);

    // Save to MongoDB
    if (MONGODB_URI) {
      await ExamResult.create({
        studentName: studentName,
        studentEmail: studentEmail,
        section: section,
        zipFileName: path.basename(zipPath)
      });
    }

    // Send email
    if (EMAIL_USER && EMAIL_PASS) {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: EMAIL_TO,
        subject: 'Imtihon - ' + studentName,
        text: 'Talaba: ' + studentName + '\nEmail: ' + studentEmail + '\nSana: ' + new Date().toLocaleString('uz-UZ'),
        attachments: [{ filename: studentName.replace(/\s+/g, '_') + '_exam.zip', path: zipPath }]
      });
    }

    fs.unlinkSync(zipPath);
    res.json({ success: true, message: 'Imtihon yuborildi!' });
  } catch (err) {
    console.error('Xatolik:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save answers
app.post('/api/save-answers', async (req, res) => {
  try {
    const { studentName, answers, section } = req.body;
    if (MONGODB_URI) {
      await ExamResult.create({
        studentName: studentName,
        answers: answers,
        section: section
      });
    }
    res.json({ success: true, message: 'Javoblar saqlandi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all results (admin)
app.get('/api/results', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Ruxsat yo\'q' });
    const results = await ExamResult.find().sort({ submittedAt: -1 });
    res.json({ success: true, results: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('Server ' + PORT + ' portda ishlamoqda');
});
