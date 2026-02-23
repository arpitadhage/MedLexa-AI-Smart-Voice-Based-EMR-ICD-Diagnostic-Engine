require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const connectDB        = require('./config/db');
const audioRoutes      = require('./routes/audio');
const transcriptRoutes = require('./routes/transcript');
const emrRoutes        = require('./routes/emr');
const authRoutes       = require('./routes/auth');
const recordRoutes     = require('./routes/records');
const aiRoutes         = require('./routes/ai');
const { requireAuth, requireRole } = require('./middleware/authMiddleware');

// Connect to MongoDB
connectDB();

const app  = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded audio files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes — require valid JWT
app.use('/api/audio',   requireAuth, requireRole('doctor'), audioRoutes);
app.use('/api/transcript', requireAuth, transcriptRoutes);
app.use('/api/emr',     requireAuth, requireRole('doctor'), emrRoutes);
app.use('/api/records', requireAuth, recordRoutes);
app.use('/api/ai',      requireAuth, aiRoutes);

// Redirect root to frontend
app.get('/', (req, res) => res.redirect('http://localhost:3000'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Smart EMR API is running' }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Smart EMR Backend running on http://localhost:${PORT}`);
});
