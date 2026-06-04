const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'asset-management-dev-secret';
const TOKEN_EXPIRES_IN = '30m';
const TOKEN_EXPIRES_IN_SECONDS = 30 * 60;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TOKEN_EXPIRY_MINUTES = 30;
const GENERIC_RESET_MESSAGE = 'If this email is registered, a password reset link has been sent.';

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

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getFrontendUrl = () => (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')[0].trim().replace(/\/$/, '');

const createMailTransport = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendPasswordResetEmail = async ({ email, resetLink }) => {
  const transporter = createMailTransport();

  if (!transporter) {
    console.warn(`SMTP is not configured. Password reset link for ${email}: ${resetLink}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Reset your Asset Management password',
    text: `Use this secure link to reset your password. This link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes.\n\n${resetLink}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Reset your password</h2>
        <p>Use the secure link below to reset your Asset Management password.</p>
        <p>This link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes.</p>
        <p><a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">Reset password</a></p>
        <p>If the button does not work, copy and paste this URL into your browser:</p>
        <p style="word-break:break-all;color:#475569;">${resetLink}</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

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
       VALUES ($1, $2, $3, (SELECT id FROM roles WHERE role_name = 'Basic'), 'Active', TRUE)
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

    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = hashResetToken(resetToken);
      const resetLink = `${getFrontendUrl()}/reset-password?token=${resetToken}`;

      await pool.query(
        `UPDATE users
         SET reset_token = $1,
             reset_token_expiry = CURRENT_TIMESTAMP + INTERVAL '${RESET_TOKEN_EXPIRY_MINUTES} minutes',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [resetTokenHash, user.id]
      );

      sendPasswordResetEmail({ email: user.email, resetLink }).catch((mailError) => {
        console.error('Password reset email error:', mailError);
      });
    }

    res.json({ message: GENERIC_RESET_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Unable to process forgot password request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    const password = req.body.password;

    if (!token || !password) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const resetTokenHash = hashResetToken(token);
    const userResult = await pool.query(
      `SELECT id
       FROM users
       WHERE reset_token = $1
         AND reset_token_expiry IS NOT NULL
         AND reset_token_expiry > CURRENT_TIMESTAMP`,
      [resetTokenHash]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Reset link is invalid or expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.query(
      `UPDATE users
       SET password = $1,
           reset_token = NULL,
           reset_token_expiry = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, userResult.rows[0].id]
    );

    res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Unable to reset password' });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
};
