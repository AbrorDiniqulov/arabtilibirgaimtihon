// ============================================
// server.js — FULL BACKEND FOR EXAM PLATFORM
// Node.js + Express + MongoDB + JWT + Multer
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/exam_platform?retryWrites=true&w=majority';

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============================================
// MONGODB CONNECTION
// ============================================
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB error:', err);
    process.exit(1);
  });

// ============================================
// SCHEMAS
// ============================================

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  photo: { type: String, default: null },
  isExempt: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Exam Settings Schema
const examSettingSchema = new mongoose.Schema({
  hours: { type: Number, default: 3 },
  minutes: { type: Number, default: 0 },
  durationMs: { type: Number, default: 3 * 60 * 60 * 1000 },
  isActive: { type: Boolean, default: false },
  setBy: { type: String },
  setAt: { type: Date, default: Date.now }
});

const ExamSetting = mongoose.model('ExamSetting', examSettingSchema);

// Question Schemas
const grammarQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['grammar', 'analysis'], default: 'grammar' },
  options: [{ type: String }],
  answer: { type: String },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const GrammarQuestion = mongoose.model('GrammarQuestion', grammarQuestionSchema);

const listeningSchema = new mongoose.Schema({
  section: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  audioUrl: { type: String, required: true },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String }]
  }],
  active: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Listening = mongoose.model('Listening', listeningSchema);

const readingSchema = new mongoose.Schema({
  section: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  text: { type: String, required: true },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String }]
  }],
  active: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Reading = mongoose.model('Reading', readingSchema);

const speakingSchema = new mongoose.Schema({
  question: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  timer: {
    prep: { type: Number, default: 10 },
    answer: { type: Number, default: 30 }
  },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Speaking = mongoose.model('Speaking', speakingSchema);

const writingSchema = new mongoose.Schema({
  level: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  topic: { type: String, required: true },
  task: { type: String, required: true },
  time: { type: Number, default: 20 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Writing = mongoose.model('Writing', writingSchema);

// Exam Result Schema
const examResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String },
  grammar: [{
    question: String,
    answer: String
  }],
  listening: [{
    question: String,
    answer: String,
    section: String
  }],
  reading: [{
    passage: String,
    questions: [{
      question: String,
      answer: String
    }]
  }],
  speaking: [{
    question: String,
    difficulty: String,
    audioUrl: { type: String, default: null }
  }],
  writing: [{
    question: String,
    task: String,
    level: String,
    answer: String
  }],
  photo: { type: String, default: null },
  paymentReceipt: { type: String, default: null },
  zipFile: { type: String, default: null },
  status: { type: String, enum: ['completed', 'pending'], default: 'completed' },
  submittedAt: { type: Date, default: Date.now }
});

const ExamResult = mongoose.model('ExamResult', examResultSchema);

// Payment Receipt Schema
const paymentReceiptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  fileName: { type: String },
  fileData: { type: String },
  verified: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now }
});

const PaymentReceipt = mongoose.model('PaymentReceipt', paymentReceiptSchema);

// ============================================
// FILE UPLOAD CONFIG (Multer)
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsDir, req.body.type || 'general');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|webm|wav|mp3|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype.startsWith('audio/') ||
                     file.mimetype.startsWith('image/') ||
                     file.mimetype === 'application/pdf' ||
                     file.mimetype === 'application/zip';
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Fayl turi noto'g'ri!'));
  }
});

// ============================================
// AUTH MIDDLEWARE
// ============================================
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token topilmadi' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token noto'g'ri' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Faqat admin uchun' });
  }
  next();
};

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', [
  body('name').notEmpty().withMessage('Ism kiritilishi shart'),
  body('email').isEmail().withMessage('Email noto'g'ri'),
  body('phone').notEmpty().withMessage('Telefon kiritilishi shart'),
  body('password').isLength({ min: 6 }).withMessage('Parol kamida 6 ta belgi'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password, photo } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Bu email allaqachon mavjud' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      photo: photo || null,
      role: email.toLowerCase() === 'admin@test.com' ? 'admin' : 'student'
    });

    await user.save();

    // Auto-create admin if first user
    const userCount = await User.countDocuments();
    if (userCount === 1) {
      user.role = 'admin';
      await user.save();
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photo: user.photo
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Email yoki parol noto'g'ri' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Email yoki parol noto'g'ri' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photo: user.photo
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
    photo: req.user.photo,
    isExempt: req.user.isExempt
  });
});

// ============================================
// ADMIN ROUTES
// ============================================

// Get all users (admin only)
app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Set exempt status
app.patch('/api/admin/users/:id/exempt', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isExempt: req.body.isExempt },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Delete user
app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Foydalanuvchi o'chirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ============================================
// EXAM SETTINGS ROUTES
// ============================================

// Get exam settings
app.get('/api/exam/settings', async (req, res) => {
  try {
    let settings = await ExamSetting.findOne().sort({ setAt: -1 });
    if (!settings) {
      settings = await ExamSetting.create({
        hours: 3,
        minutes: 0,
        durationMs: 3 * 60 * 60 * 1000,
        isActive: true
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Set exam time (admin only)
app.post('/api/exam/settings', auth, adminOnly, async (req, res) => {
  try {
    const { hours, minutes } = req.body;
    const durationMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);

    const settings = new ExamSetting({
      hours,
      minutes,
      durationMs,
      isActive: true,
      setBy: req.user.email,
      setAt: new Date()
    });

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Reset exam time
app.delete('/api/exam/settings', auth, adminOnly, async (req, res) => {
  try {
    await ExamSetting.deleteMany({});
    res.json({ message: 'Vaqt tozalandi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Get current exam time (for timer sync)
app.get('/api/exam/time', auth, async (req, res) => {
  try {
    const settings = await ExamSetting.findOne().sort({ setAt: -1 });
    if (!settings || !settings.isActive) {
      return res.json({ active: false, message: 'Vaqt o'rnatilmagan' });
    }

    // Calculate end time from when user started
    const userStartTime = req.query.startTime ? new Date(parseInt(req.query.startTime)) : new Date();
    const endTime = new Date(userStartTime.getTime() + settings.durationMs);

    res.json({
      active: true,
      durationMs: settings.durationMs,
      hours: settings.hours,
      minutes: settings.minutes,
      endTime: endTime.toISOString(),
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ============================================
// GRAMMAR QUESTIONS ROUTES
// ============================================

// Get all grammar questions
app.get('/api/grammar', auth, async (req, res) => {
  try {
    const questions = await GrammarQuestion.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Get active grammar questions (for students)
app.get('/api/grammar/active', auth, async (req, res) => {
  try {
    const questions = await GrammarQuestion.find({ active: true }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Add grammar question (admin)
app.post('/api/grammar', auth, adminOnly, async (req, res) => {
  try {
    const question = new GrammarQuestion(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Update grammar question
app.patch('/api/grammar/:id', auth, adminOnly, async (req, res) => {
  try {
    const question = await GrammarQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Delete grammar question
app.delete('/api/grammar/:id', auth, adminOnly, async (req, res) => {
  try {
    await GrammarQuestion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Savol o'chirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Toggle active status
app.patch('/api/grammar/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const question = await GrammarQuestion.findById(req.params.id);
    question.active = !question.active;
    await question.save();
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ============================================
// LISTENING ROUTES
// ============================================

app.get('/api/listening', auth, async (req, res) => {
  try {
    const items = await Listening.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.get('/api/listening/active', auth, async (req, res) => {
  try {
    const items = await Listening.find({ active: true }).sort({ section: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.post('/api/listening', auth, adminOnly, async (req, res) => {
  try {
    const item = new Listening(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.patch('/api/listening/:id', auth, adminOnly, async (req, res) => {
  try {
    const item = await Listening.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.delete('/api/listening/:id', auth, adminOnly, async (req, res) => {
  try {
    await Listening.findByIdAndDelete(req.params.id);
    res.json({ message: 'O'chirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.patch('/api/listening/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const item = await Listening.findById(req.params.id);
    item.active = !item.active;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ============================================
// READING ROUTES
// ============================================

app.get('/api/reading', auth, async (req, res) => {
  try {
    const items = await Reading.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.get('/api/reading/active', auth, async (req, res) => {
  try {
    const items = await Reading.find({ active: true }).sort({ section: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.post('/api/reading', auth, adminOnly, async (req, res) => {
  try {
    const item = new Reading(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.patch('/api/reading/:id', auth, adminOnly, async (req, res) => {
  try {
    const item = await Reading.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.delete('/api/reading/:id', auth, adminOnly, async (req, res) => {
  try {
    await Reading.findByIdAndDelete(req.params.id);
    res.json({ message: 'O'chirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.patch('/api/reading/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const item = await Reading.findById(req.params.id);
    item.active = !item.active;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ============================================
// SPEAKING ROUTES
// ============================================

app.get('/api/speaking', auth, async (req, res) => {
  try {
    const items = await Speaking.find().sort({ difficulty: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.get('/api/speaking/active', auth, async (req, res) => {
  try {
    const items = await Speaking.find({ active: true }).sort({ difficulty: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.post('/api/speaking', auth, adminOnly, async (req, res) => {
  try {
    const item = new Speaking(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.patch('/api/speaking/:id', auth, adminOnly, async (req, res) => {
  try {
    const item = await Speaking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.delete('/api/speaking/:id', auth, adminOnly, async (req, res) => {
  try {
    await Speaking.findByIdAndDelete(req.params.id);
    res.json({ message: 'O'chirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.patch('/api/speaking/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const item = await Speaking.findById(req.params.id);
    item.active = !item.active;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ============================================
// WRITING ROUTES
// ============================================

app.get('/api/writing', auth, async (req, res) => {
  try {
    const items = await Writing.find().sort({ level: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.get('/api/writing/active', auth, async (req, res) => {
  try {
    const items = await Writing.find({ active: true }).sort({ level: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.post('/api/writing', auth, adminOnly, async (req, res) => {
  try {
    const item = new Writing(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.patch('/api/writing/:id', auth, adminOnly, async (req, res) => {
  try {
    const item = await Writing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.delete('/api/writing/:id', auth, adminOnly, async (req, res) => {
  try {
    await Writing.findByIdAndDelete(req.params.id);
    res.json({ message: 'O'chirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

app.patch('/api/writing/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const item = await Writing.findById(req.params.id);
    item.active = !item.active;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ============================================
// FILE UPLOAD ROUTES
// ============================================

// Upload photo
app.post('/api/upload/photo', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fayl yuklanmadi' });
    const fileUrl = `/uploads/${req.body.type || 'general'}/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'Yuklashda xatolik' });
  }
});

// Upload audio (speaking)
app.post('/api/upload/audio', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio yuklanmadi' });
    const fileUrl = `/uploads/audio/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'Yuklashda xatolik' });
  }
});

// Upload payment receipt
app.post('/api/upload/payment', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Chek yuklanmadi' });

    const fileUrl = `/uploads/payment/${req.file.filename}`;

    const receipt = new PaymentReceipt({
      userId: req.user._id,
      userEmail: req.user.email,
      fileName: req.file.filename,
      fileData: fileUrl,
      verified: true // Auto-verify for now, can add OCR later
    });
    await receipt.save();

    res.json({ url: fileUrl, receiptId: receipt._id, verified: true });
  } catch (err) {
    res.status(500).json({ error: 'Yuklashda xatolik' });
  }
});

// Upload ZIP (exam results)
app.post('/api/upload/zip', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ZIP yuklanmadi' });
    const fileUrl = `/uploads/results/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'Yuklashda xatolik' });
  }
});

// ============================================
// EXAM RESULTS ROUTES
// ============================================

// Submit exam results
app.post('/api/results', auth, async (req, res) => {
  try {
    const { grammar, listening, reading, speaking, writing, photo, paymentReceipt, zipFile } = req.body;

    const result = new ExamResult({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      grammar,
      listening,
      reading,
      speaking,
      writing,
      photo,
      paymentReceipt,
      zipFile,
      status: 'completed'
    });

    await result.save();
    res.status(201).json({ message: 'Natija saqlandi', resultId: result._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Get all results (admin)
app.get('/api/results', auth, adminOnly, async (req, res) => {
  try {
    const results = await ExamResult.find()
      .populate('userId', 'name email')
      .sort({ submittedAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Get my results (student)
app.get('/api/results/my', auth, async (req, res) => {
  try {
    const results = await ExamResult.find({ userId: req.user._id }).sort({ submittedAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Get result by ID
app.get('/api/results/:id', auth, async (req, res) => {
  try {
    const result = await ExamResult.findById(req.params.id).populate('userId', 'name email');
    if (!result) return res.status(404).json({ error: 'Natija topilmadi' });

    // Only admin or owner can view
    if (req.user.role !== 'admin' && result.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Ruxsat yo'q' });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Delete result (admin)
app.delete('/api/results/:id', auth, adminOnly, async (req, res) => {
  try {
    await ExamResult.findByIdAndDelete(req.params.id);
    res.json({ message: 'Natija o'chirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ============================================
// PAYMENT VERIFICATION ROUTES
// ============================================

// Check payment status
app.get('/api/payment/status', auth, async (req, res) => {
  try {
    const receipt = await PaymentReceipt.findOne({ 
      userId: req.user._id 
    }).sort({ uploadedAt: -1 });

    if (req.user.isExempt) {
      return res.json({ verified: true, exempt: true });
    }

    res.json({ 
      verified: receipt ? receipt.verified : false,
      receipt: receipt || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Verify payment (admin)
app.patch('/api/payment/:id/verify', auth, adminOnly, async (req, res) => {
  try {
    const receipt = await PaymentReceipt.findByIdAndUpdate(
      req.params.id,
      { verified: req.body.verified },
      { new: true }
    );
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Get all payments (admin)
app.get('/api/payment/all', auth, adminOnly, async (req, res) => {
  try {
    const receipts = await PaymentReceipt.find()
      .populate('userId', 'name email')
      .sort({ uploadedAt: -1 });
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ============================================
// STATS ROUTES
// ============================================

app.get('/api/stats', auth, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalResults = await ExamResult.countDocuments();
    const todayResults = await ExamResult.countDocuments({
      submittedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const weekResults = await ExamResult.countDocuments({
      submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const monthResults = await ExamResult.countDocuments({
      submittedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalUsers,
      totalResults,
      todayResults,
      weekResults,
      monthResults
    });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Server xatosi' });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`\u2705 Server running on port ${PORT}`);
  console.log(`\ud83d\udccc Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
