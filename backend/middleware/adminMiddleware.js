const pool = require('../config/db');

const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.is_active, r.role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (user.role_name !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.adminUser = user;
    return next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    return res.status(500).json({ error: 'Unable to verify admin access' });
  }
};

module.exports = requireAdmin;
