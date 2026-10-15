const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Phoenix@2024';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ─────────────────────────────────────────────
//  MONGODB SCHEMAS & MODELS
// ─────────────────────────────────────────────
const teacherSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  payments: { type: [Boolean], default: () => Array(12).fill(false) },
  order: { type: Number, default: 0 }
});

const expenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  desc: { type: String, required: true },
  cat: { type: String, default: 'Other' },
  amount: { type: Number, required: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Teacher = mongoose.model('Teacher', teacherSchema);
const Expense = mongoose.model('Expense', expenseSchema);

// ─────────────────────────────────────────────
//  SEED DEFAULT TEACHERS
// ─────────────────────────────────────────────
const DEFAULT_NAMES = [
  'Ananya Sharma', 'Priya Nair', 'Sunita Reddy', 'Meena Iyer', 'Kavitha Pillai',
  'Rekha Gupta', 'Divya Patel', 'Leela Rao', 'Sandhya Menon', 'Jyothi Krishnan',
  'Radha Srinivas', 'Usha Bhat', 'Manjula Desai', 'Sheela Joshi', 'Pooja Verma',
  'Asha Tiwari', 'Geetha Nambiar', 'Smitha Hegde', 'Lalitha Mohan', 'Vandana Singh'
];

async function seedTeachersIfNeeded() {
  try {
    const count = await Teacher.countDocuments();
    if (count === 0) {
      console.log('Seeding initial 20 teachers into MongoDB...');
      const docs = DEFAULT_NAMES.map((name, i) => ({
        id: 'T' + (i + 1),
        name,
        payments: Array(12).fill(false),
        order: i + 1
      }));
      await Teacher.insertMany(docs);
      console.log('20 Teachers seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding teachers:', err.message);
  }
}

// ─────────────────────────────────────────────
//  ADMIN AUTH MIDDLEWARE
// ─────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin password' });
  }
  next();
}

// ─────────────────────────────────────────────
//  API ROUTES
// ─────────────────────────────────────────────

// Status check
app.get('/api/status', (req, res) => {
  res.json({
    connected: mongoose.connection.readyState === 1,
    db: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'MongoDB Disconnected'
  });
});

// PUBLIC: Get all data (viewers + admin)
app.get('/api/data', async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ order: 1 });
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json({ teachers, expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Verify login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Admin authenticated' });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect password' });
  }
});

// ADMIN: Toggle teacher payment
app.post('/api/teachers/:id/payment', requireAdmin, async (req, res) => {
  try {
    const { monthIndex, paid } = req.body;
    const teacher = await Teacher.findOne({ id: req.params.id });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    teacher.payments[monthIndex] = Boolean(paid);
    teacher.markModified('payments');
    await teacher.save();
    res.json({ success: true, teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Update teacher name
app.put('/api/teachers/:id/name', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const teacher = await Teacher.findOneAndUpdate(
      { id: req.params.id },
      { name: name.trim() },
      { new: true }
    );
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json({ success: true, teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Add new teacher slot
app.post('/api/teachers', requireAdmin, async (req, res) => {
  try {
    const count = await Teacher.countDocuments();
    const newId = 'T' + Date.now();
    const teacher = await Teacher.create({
      id: newId,
      name: (req.body.name || '').trim(),
      payments: Array(12).fill(false),
      order: count + 1
    });
    res.json({ success: true, teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Delete teacher
app.delete('/api/teachers/:id', requireAdmin, async (req, res) => {
  try {
    await Teacher.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'Teacher removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Mark current month for all
app.post('/api/teachers/mark-month', requireAdmin, async (req, res) => {
  try {
    const { monthIndex } = req.body;
    const teachers = await Teacher.find();
    for (const t of teachers) {
      t.payments[monthIndex] = true;
      t.markModified('payments');
      await t.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Clear all payments
app.post('/api/teachers/clear-all', requireAdmin, async (req, res) => {
  try {
    await Teacher.updateMany({}, { $set: { payments: Array(12).fill(false) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Add expense
app.post('/api/expenses', requireAdmin, async (req, res) => {
  try {
    const { desc, cat, amount, date, notes } = req.body;
    const newExpense = await Expense.create({
      id: 'E' + Date.now() + Math.random().toString(36).slice(2, 6),
      desc: desc.trim(),
      cat: cat || 'Other',
      amount: Number(amount),
      date: date || new Date().toISOString().split('T')[0],
      notes: (notes || '').trim()
    });
    res.json({ success: true, expense: newExpense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Delete expense
app.delete('/api/expenses/:id', requireAdmin, async (req, res) => {
  try {
    await Expense.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all route to serve the dashboard
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI || MONGODB_URI.includes('example.mongodb.net')) {
  console.warn('⚠️  MONGODB_URI is not configured yet in .env');
  console.warn('⚠️  Please add your actual MongoDB Atlas connection string to .env');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas successfully.');
      seedTeachersIfNeeded();
    })
    .catch(err => {
      console.error('❌ MongoDB Connection Error:', err.message);
    });
}

app.listen(PORT, () => {
  console.log(`🚀 Phoenix Rising Academy server running at: http://localhost:${PORT}`);
});
