const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  profile_image: user.profile_image,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const validateEmail = (email) => typeof email === 'string' && EMAIL_REGEX.test(email.trim());

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, profile_image, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Unable to load profile' });
  }
};

const getAssignableUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, profile_image, created_at, updated_at
       FROM users
       WHERE id <> $1
       ORDER BY full_name ASC, email ASC`,
      [req.user.id]
    );

    res.json({ users: result.rows.map(sanitizeUser) });
  } catch (error) {
    console.error('Get assignable users error:', error);
    res.status(500).json({ error: 'Unable to load users' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const fullName = req.body.full_name || req.body.fullName;
    const email = req.body.email?.trim().toLowerCase();
    const profileImage = req.body.profile_image || req.body.profileImage || null;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const duplicate = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [
      email,
      req.user.id,
    ]);
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2, profile_image = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, full_name, email, profile_image, created_at, updated_at`,
      [fullName.trim(), email, profileImage, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user: sanitizeUser(result.rows[0]) });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Unable to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const currentPassword = req.body.current_password || req.body.currentPassword;
    const newPassword = req.body.new_password || req.body.newPassword;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const result = await pool.query('SELECT id, password FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      hashedPassword,
      req.user.id,
    ]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Unable to change password' });
  }
};

module.exports = {
  getProfile,
  getAssignableUsers,
  updateProfile,
  changePassword,
};
