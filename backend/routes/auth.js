const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smart_emr_jwt_secret_2026';

function makeToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function safeUser(user) {
  return {
    id:              user._id,
    name:            user.name,
    email:           user.email,
    role:            user.role,
    department:      user.department,
    patientId:       user.patientId,
    caretaker_name:  user.caretaker_name,
    caretaker_phone: user.caretaker_phone,
    caretaker_email: user.caretaker_email,
  };
}

/* ── Seed demo accounts on startup (idempotent) ─────────────────── */
async function seedDemoUsers() {
  try {
    if (!await User.findOne({ email: 'doctor@smartemr.com' })) {
      await User.create({
        name: 'Dr. Sarah Ahmed', email: 'doctor@smartemr.com',
        passwordHash: await bcrypt.hash('doctor123', 10),
        role: 'doctor', department: 'General Medicine',
      });
      console.log('✅ Demo doctor seeded');
    }
    if (!await User.findOne({ email: 'patient@smartemr.com' })) {
      await User.create({
        name: 'Rahul Sharma', email: 'patient@smartemr.com',
        passwordHash: await bcrypt.hash('patient123', 10),
        role: 'patient', patientId: 'PT-00001',
      });
      console.log('✅ Demo patient seeded');
    }
  } catch (err) { console.error('Demo seed error:', err.message); }
}
setTimeout(seedDemoUsers, 2000);

/* ── POST /api/auth/register ──────────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, patientId, caretaker_name, caretaker_phone, caretaker_email } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'name, email, password and role are required.' });
    if (!['doctor', 'patient'].includes(role))
      return res.status(400).json({ error: 'role must be "doctor" or "patient".' });
    if (role === 'patient' && (!caretaker_name || !caretaker_phone || !caretaker_email))
      return res.status(400).json({ error: 'Caretaker name, phone and email are required.' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const count = await User.countDocuments({ role: 'patient' });
    const user = await User.create({
      name, email: email.toLowerCase(), passwordHash, role,
      ...(role === 'doctor'  ? { department: department || 'General' } : {}),
      ...(role === 'patient' ? {
        patientId: patientId || `PT-${String(count + 2).padStart(5, '0')}`,
        caretaker_name:  caretaker_name  || '',
        caretaker_phone: caretaker_phone || '',
        caretaker_email: caretaker_email || '',
      } : {}),
    });
    res.status(201).json({ token: makeToken(user), user: safeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

/* ── POST /api/auth/login ─────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email and password are required.' });
    let user;
    try { user = await User.findByCredentials(email, password); }
    catch { return res.status(401).json({ error: 'Invalid email or password.' }); }
    res.json({ token: makeToken(user), user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

/* ── GET /api/auth/me ─────────────────────────────────────────────── */
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token.' });
  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(safeUser(user));
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

module.exports = router;
