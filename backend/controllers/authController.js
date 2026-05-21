const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'asset-management-dev-secret';
const TOKEN_EXPIRES_IN = '30m';
const TOKEN_EXPIRES_IN_SECONDS = 30 * 60;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  profile_image: user.profile_image,
  department: user.department,
  role_id: user.role_id,
  role_name: user.role_name,
  status: user.status,
  is_active: user.is_active,
  last_login: user.last_login,
  created_by: user.created_by,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const createToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role_name }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

const validateEmail = (email) => typeof email === 'string' && EMAIL_REGEX.test(email.trim());

const signup = async (req, res) => {
  try {
    const fullName = req.body.full_name || req.body.fullName;
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password, role_id, status, is_active)
       VALUES ($1, $2, $3, (SELECT id FROM roles WHERE role_name = 'Employee'), 'Active', TRUE)
       RETURNING id`,
      [fullName.trim(), email, hashedPassword]
    );

    const userResult = await pool.query(
      `SELECT u.*, r.role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [result.rows[0].id]
    );
    const user = userResult.rows[0];
    res.status(201).json({ message: 'Account created successfully', user: sanitizeUser(user) });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Unable to create account' });
  }
};

const login = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const result = await pool.query(
      `SELECT u.*, r.role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1`,
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (user.is_active === false || user.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account is inactive. Please contact an administrator.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    res.json({
      token: createToken(user),
      expiresIn: TOKEN_EXPIRES_IN_SECONDS,
      user: sanitizeUser({ ...user, last_login: new Date().toISOString() }),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Unable to login' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    res.json({ message: 'If an account exists for this email, password reset instructions will be sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Unable to process forgot password request' });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
};
