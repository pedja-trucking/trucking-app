require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_please';
const NODE_ENV = process.env.NODE_ENV || 'development';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Register
app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (email, username, password_hash) VALUES ($1,$2,$3) RETURNING id, email, username';
    const result = await pool.query(sql, [email, username || null, hashed]);
    const user = result.rows[0];
    res.json({ ok: true, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const q = 'SELECT id, email, username, password_hash FROM users WHERE email = $1';
    const r = await pool.query(q, [email]);
    if (r.rowCount === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ ok: true, user: { id: user.id, email: user.email, username: user.username }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// middleware auth
async function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const q = 'SELECT id, email, username FROM users WHERE id = $1';
    const r = await pool.query(q, [payload.userId]);
    if (r.rowCount === 0) return res.status(401).json({ error: 'Unauthorized' });
    req.user = r.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// get current user
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ ok: true, user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
