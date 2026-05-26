const bcrypt = require('bcryptjs');
const pool = require('../config/db');

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

const validateEmail = (email) => typeof email === 'string' && EMAIL_REGEX.test(email.trim());
const normalizeStatus = (status, isActive) => {
  if (typeof isActive === 'boolean') {
    return isActive ? 'Active' : 'Inactive';
  }
  return status === 'Inactive' ? 'Inactive' : 'Active';
};
const allowedRoleNames = ['Admin', 'Basic'];

const userSelectSql = `
  SELECT
    u.id,
    u.full_name,
    u.email,
    u.profile_image,
    u.department,
    u.role_id,
    r.role_name,
    u.status,
    u.is_active,
    u.last_login,
    u.created_by,
    u.created_at,
    u.updated_at
  FROM users u
  LEFT JOIN roles r ON r.id = u.role_id
`;

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `${userSelectSql} WHERE u.id = $1`,
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
      `${userSelectSql}
       WHERE u.id <> $1 AND u.is_active = TRUE
       ORDER BY u.full_name ASC, u.email ASC`,
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
       RETURNING id`,
      [fullName.trim(), email, profileImage, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userResult = await pool.query(`${userSelectSql} WHERE u.id = $1`, [result.rows[0].id]);
    res.json({ message: 'Profile updated successfully', user: sanitizeUser(userResult.rows[0]) });
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

const getUsers = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const role = req.query.role?.trim();
    const status = req.query.status?.trim();
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      where.push(`(LOWER(u.full_name) LIKE $${values.length} OR LOWER(u.email) LIKE $${values.length} OR LOWER(COALESCE(u.department, '')) LIKE $${values.length})`);
    }

    if (role) {
      values.push(role);
      where.push(`r.role_name = $${values.length}`);
    }

    if (status) {
      values.push(status);
      where.push(`u.status = $${values.length}`);
    }

    const result = await pool.query(
      `${userSelectSql}
       ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY u.created_at DESC, u.full_name ASC`,
      values
    );

    res.json({ users: result.rows.map(sanitizeUser) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Unable to load users' });
  }
};

const createUser = async (req, res) => {
  try {
    const fullName = req.body.full_name || req.body.fullName;
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const department = req.body.department || null;
    const roleId = req.body.role_id || req.body.roleId || null;
    const status = normalizeStatus(req.body.status, req.body.is_active ?? req.body.isActive);
    const isActive = status === 'Active';

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const duplicate = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const roleResult = roleId
      ? await pool.query('SELECT id, role_name FROM roles WHERE id = $1 AND role_name = ANY($2)', [roleId, allowedRoleNames])
      : await pool.query("SELECT id, role_name FROM roles WHERE role_name = 'Basic'");
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: 'Please select a valid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password, department, role_id, status, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [fullName.trim(), email, hashedPassword, department, roleResult.rows[0].id, status, isActive, req.user.id]
    );

    const userResult = await pool.query(`${userSelectSql} WHERE u.id = $1`, [result.rows[0].id]);
    res.status(201).json({ message: 'User created successfully', user: sanitizeUser(userResult.rows[0]) });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Unable to create user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const fullName = req.body.full_name || req.body.fullName;
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const department = req.body.department || null;
    const roleId = req.body.role_id || req.body.roleId || null;
    const status = normalizeStatus(req.body.status, req.body.is_active ?? req.body.isActive);
    const isActive = status === 'Active';

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (password && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const duplicate = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, id]);
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    if (roleId) {
      const roleResult = await pool.query('SELECT id FROM roles WHERE id = $1 AND role_name = ANY($2)', [roleId, allowedRoleNames]);
      if (roleResult.rows.length === 0) {
        return res.status(400).json({ error: 'Please select a valid role' });
      }
    }

    const existingResult = await pool.query(`${userSelectSql} WHERE u.id = $1`, [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (id === req.user.id && !isActive) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    const values = [fullName.trim(), email, department, roleId, status, isActive, id];
    let passwordSetSql = '';
    if (password) {
      values.splice(6, 0, await bcrypt.hash(password, 12));
      passwordSetSql = ', password = $7';
    }

    const idParam = password ? 8 : 7;
    await pool.query(
      `UPDATE users
       SET full_name = $1,
           email = $2,
           department = $3,
           role_id = $4,
           status = $5,
           is_active = $6,
           updated_at = CURRENT_TIMESTAMP
           ${passwordSetSql}
       WHERE id = $${idParam}`,
      values
    );

    const userResult = await pool.query(`${userSelectSql} WHERE u.id = $1`, [id]);
    res.json({ message: 'User updated successfully', user: sanitizeUser(userResult.rows[0]) });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Unable to update user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }

    const existingResult = await pool.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Unable to delete user' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const roleId = req.body.role_id || req.body.roleId;

    if (!roleId) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const roleResult = await pool.query('SELECT id, role_name FROM roles WHERE id = $1 AND role_name = ANY($2)', [roleId, allowedRoleNames]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: 'Please select a valid role' });
    }

    const existingResult = await pool.query('SELECT id, email FROM users WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    await pool.query('UPDATE users SET role_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [roleId, id]);
    const userResult = await pool.query(`${userSelectSql} WHERE u.id = $1`, [id]);
    res.json({ message: 'Role updated successfully', user: sanitizeUser(userResult.rows[0]) });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Unable to update user role' });
  }
};

module.exports = {
  getProfile,
  getAssignableUsers,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateProfile,
  changePassword,
};
